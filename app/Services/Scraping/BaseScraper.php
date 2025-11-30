<?php

namespace App\Services\Scraping;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ScrapingJob;
use App\Models\ScrapingLog;
use App\Models\ScrapingSource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class BaseScraper implements ScraperInterface
{
    protected ScrapingSource $source;
    protected ScrapingJob $job;
    protected int $productsFound = 0;
    protected int $productsCreated = 0;
    protected int $productsUpdated = 0;
    protected int $productsFailed = 0;
    protected int $imagesDownloaded = 0;

    public function initialize(ScrapingSource $source, ScrapingJob $job): void
    {
        $this->source = $source;
        $this->job = $job;
        $this->resetCounters();
    }

    protected function resetCounters(): void
    {
        $this->productsFound = 0;
        $this->productsCreated = 0;
        $this->productsUpdated = 0;
        $this->productsFailed = 0;
        $this->imagesDownloaded = 0;
    }

    protected function log(string $level, string $message, ?array $context = null, ?string $url = null): void
    {
        ScrapingLog::create([
            'job_id' => $this->job->id,
            'level' => $level,
            'message' => $message,
            'context' => $context,
            'url' => $url,
        ]);
    }

    protected function logDebug(string $message, ?array $context = null, ?string $url = null): void
    {
        $this->log(ScrapingLog::LEVEL_DEBUG, $message, $context, $url);
    }

    protected function logInfo(string $message, ?array $context = null, ?string $url = null): void
    {
        $this->log(ScrapingLog::LEVEL_INFO, $message, $context, $url);
    }

    protected function logWarning(string $message, ?array $context = null, ?string $url = null): void
    {
        $this->log(ScrapingLog::LEVEL_WARNING, $message, $context, $url);
    }

    protected function logError(string $message, ?array $context = null, ?string $url = null): void
    {
        $this->log(ScrapingLog::LEVEL_ERROR, $message, $context, $url);
    }

    protected function updateJobStats(): void
    {
        $this->job->update([
            'products_found' => $this->productsFound,
            'products_created' => $this->productsCreated,
            'products_updated' => $this->productsUpdated,
            'products_failed' => $this->productsFailed,
            'images_downloaded' => $this->imagesDownloaded,
        ]);
    }

    protected function markJobRunning(): void
    {
        $this->job->update([
            'status' => ScrapingJob::STATUS_RUNNING,
            'started_at' => now(),
        ]);
    }

    protected function markJobCompleted(): void
    {
        $this->updateJobStats();
        $this->job->update([
            'status' => ScrapingJob::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
        $this->source->update(['last_scraped_at' => now()]);
    }

    protected function markJobFailed(string $errorMessage): void
    {
        $this->updateJobStats();
        $this->job->update([
            'status' => ScrapingJob::STATUS_FAILED,
            'error_message' => $errorMessage,
            'completed_at' => now(),
        ]);
    }

    /**
     * Create or update a product from scraped data
     */
    protected function saveProduct(array $data): ?Product
    {
        try {
            $this->productsFound++;

            // Find existing product by source_id
            $product = Product::where('source', $this->getSourceSlug())
                ->where('source_id', $data['source_id'])
                ->first();

            // Find or create brand
            $brandId = null;
            if (!empty($data['brand'])) {
                $brand = Brand::firstOrCreate(
                    ['slug' => Str::slug($data['brand'])],
                    ['name' => $data['brand'], 'is_active' => true]
                );
                $brandId = $brand->id;
            }

            // Find or create category
            $categoryId = $this->source->default_category_id;
            if (!empty($data['category'])) {
                $category = Category::where('name', $data['category'])->first();
                if ($category) {
                    $categoryId = $category->id;
                }
            }

            // Determine product status
            $status = $this->source->auto_publish ? 'active' : 'draft';

            $productData = [
                'seller_id' => $this->source->seller_id,
                'category_id' => $categoryId,
                'brand_id' => $brandId,
                'name' => $data['name'],
                'slug' => $this->generateUniqueSlug($data['name'], $product?->id),
                'description' => $data['description'] ?? null,
                'short_description' => $data['short_description'] ?? null,
                'specifications' => $data['specifications'] ?? null,
                'base_price' => $data['price'],
                'compare_at_price' => $data['compare_price'] ?? null,
                'currency_id' => $this->source->default_currency_id,
                'sku' => $data['sku'] ?? null,
                'stock_quantity' => $data['stock_quantity'] ?? 100,
                'track_inventory' => false, // Scraped products don't track inventory
                'status' => $product ? $product->status : $status,
                'is_featured' => false,
                'is_new' => !$product,
                'source' => $this->getSourceSlug(),
                'source_id' => $data['source_id'],
                'source_url' => $data['source_url'],
                'rating' => $data['rating'] ?? 0,
                'reviews_count' => $data['reviews_count'] ?? 0,
            ];

            if ($product) {
                $product->update($productData);
                $this->productsUpdated++;
                $this->logDebug("Updated product: {$data['name']}", ['product_id' => $product->id]);
            } else {
                $product = Product::create($productData);
                $this->productsCreated++;
                $this->logInfo("Created product: {$data['name']}", ['product_id' => $product->id]);
            }

            // Handle images
            if (!empty($data['images'])) {
                $this->saveProductImages($product, $data['images']);
            }

            // Update stats every 10 products
            if ($this->productsFound % 10 === 0) {
                $this->updateJobStats();
            }

            return $product;
        } catch (\Exception $e) {
            $this->productsFailed++;
            $this->logError("Failed to save product: {$data['name']}", [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return null;
        }
    }

    /**
     * Save product images
     */
    protected function saveProductImages(Product $product, array $imageUrls): void
    {
        // Delete existing images for scraped products (they might have changed)
        if ($product->source) {
            $product->images()->delete();
        }

        foreach ($imageUrls as $index => $imageUrl) {
            try {
                $path = $this->downloadImage($imageUrl, $product);
                if ($path) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $path,
                        'alt_text' => $product->name,
                        'sort_order' => $index,
                        'is_primary' => $index === 0,
                    ]);
                    $this->imagesDownloaded++;
                }
            } catch (\Exception $e) {
                $this->logWarning("Failed to download image", [
                    'url' => $imageUrl,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Download an image and save to storage
     */
    protected function downloadImage(string $url, Product $product): ?string
    {
        try {
            $context = stream_context_create([
                'http' => [
                    'timeout' => 30,
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
            ]);

            $imageContent = @file_get_contents($url, false, $context);
            if (!$imageContent) {
                return null;
            }

            // Determine extension
            $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
            if (!in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                $extension = 'jpg';
            }

            // Generate filename
            $filename = Str::uuid() . '.' . $extension;
            $path = "products/{$this->getSourceSlug()}/{$product->id}/{$filename}";

            // Save to storage
            Storage::disk('public')->put($path, $imageContent);

            return $path;
        } catch (\Exception $e) {
            $this->logWarning("Image download failed: " . $e->getMessage(), ['url' => $url]);
            return null;
        }
    }

    /**
     * Generate a unique slug for a product
     */
    protected function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (true) {
            $query = Product::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            if (!$query->exists()) {
                break;
            }

            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Clean a price string and convert to float
     */
    protected function parsePrice(string $priceString): float
    {
        // Remove currency symbols and formatting
        $cleaned = preg_replace('/[^0-9.,]/', '', $priceString);
        // Handle thousands separator
        $cleaned = str_replace(',', '', $cleaned);
        return (float) $cleaned;
    }

    /**
     * Add delay between requests to avoid rate limiting
     */
    protected function delay(int $milliseconds = 1000): void
    {
        usleep($milliseconds * 1000);
    }
}

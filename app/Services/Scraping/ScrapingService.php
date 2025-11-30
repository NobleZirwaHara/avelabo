<?php

namespace App\Services\Scraping;

use App\Models\ScrapingJob;
use App\Models\ScrapingSource;
use Illuminate\Support\Facades\Log;

class ScrapingService
{
    /**
     * Registered scrapers
     */
    protected array $scrapers = [];

    public function __construct()
    {
        // Register available scrapers
        $this->registerScraper(new TakealotScraper());
        $this->registerScraper(new NoonScraper());
    }

    /**
     * Register a scraper
     */
    public function registerScraper(ScraperInterface $scraper): void
    {
        $this->scrapers[$scraper->getSourceSlug()] = $scraper;
    }

    /**
     * Get a scraper for a source
     */
    public function getScraper(string $sourceSlug): ?ScraperInterface
    {
        return $this->scrapers[$sourceSlug] ?? null;
    }

    /**
     * Get all registered scrapers
     */
    public function getScrapers(): array
    {
        return $this->scrapers;
    }

    /**
     * Create a new scraping job
     */
    public function createJob(
        ScrapingSource $source,
        string $type = ScrapingJob::TYPE_FULL,
        ?array $config = null
    ): ScrapingJob {
        return ScrapingJob::create([
            'source_id' => $source->id,
            'status' => ScrapingJob::STATUS_PENDING,
            'type' => $type,
            'config' => $config,
        ]);
    }

    /**
     * Run a scraping job
     */
    public function runJob(ScrapingJob $job): void
    {
        $source = $job->source;

        // Get the appropriate scraper
        $scraper = $this->getScraper($source->slug);

        if (!$scraper) {
            $job->update([
                'status' => ScrapingJob::STATUS_FAILED,
                'error_message' => "No scraper registered for source: {$source->slug}",
                'completed_at' => now(),
            ]);
            return;
        }

        try {
            // Initialize scraper
            $scraper->initialize($source, $job);

            // Run based on job type
            switch ($job->type) {
                case ScrapingJob::TYPE_FULL:
                    $scraper->scrapeAll();
                    break;

                case ScrapingJob::TYPE_CATEGORY:
                    $categoryUrl = $job->config['category_url'] ?? null;
                    $categoryName = $job->config['category_name'] ?? null;
                    if ($categoryUrl) {
                        $scraper->scrapeCategory($categoryUrl, $categoryName);
                    }
                    break;

                case ScrapingJob::TYPE_PRODUCT:
                    $productUrl = $job->config['product_url'] ?? null;
                    if ($productUrl) {
                        $scraper->scrapeProduct($productUrl);
                    }
                    break;

                default:
                    $scraper->scrapeAll();
            }
        } catch (\Exception $e) {
            Log::error("Scraping job failed", [
                'job_id' => $job->id,
                'source' => $source->slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $job->update([
                'status' => ScrapingJob::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
        } finally {
            $scraper->cleanup();
        }
    }

    /**
     * Cancel a running or pending job
     */
    public function cancelJob(ScrapingJob $job): bool
    {
        if (!in_array($job->status, [ScrapingJob::STATUS_PENDING, ScrapingJob::STATUS_RUNNING])) {
            return false;
        }

        $job->update([
            'status' => ScrapingJob::STATUS_CANCELLED,
            'completed_at' => now(),
        ]);

        return true;
    }

    /**
     * Get job statistics for a source
     */
    public function getSourceStats(ScrapingSource $source): array
    {
        $jobs = $source->jobs();

        return [
            'total_jobs' => $jobs->count(),
            'completed_jobs' => $jobs->where('status', ScrapingJob::STATUS_COMPLETED)->count(),
            'failed_jobs' => $jobs->where('status', ScrapingJob::STATUS_FAILED)->count(),
            'total_products_created' => $jobs->sum('products_created'),
            'total_products_updated' => $jobs->sum('products_updated'),
            'last_scraped_at' => $source->last_scraped_at,
        ];
    }
}

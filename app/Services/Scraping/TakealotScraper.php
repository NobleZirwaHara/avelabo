<?php

namespace App\Services\Scraping;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class TakealotScraper extends BaseScraper
{
    protected string $scriptPath;

    public function __construct()
    {
        $this->scriptPath = base_path('scripts/scrapers/takealot.js');
    }

    public function getSourceSlug(): string
    {
        return 'takealot';
    }

    public function scrapeAll(): void
    {
        $this->markJobRunning();
        $this->logInfo('Starting full Takealot scrape');

        try {
            $maxPagesPerCategory = $this->source->config['max_pages_per_category'] ?? 5;

            $result = $this->runNodeScript('scrape_all', [
                'max_pages_per_category' => $maxPagesPerCategory,
            ]);

            if (isset($result['error'])) {
                throw new \Exception($result['error']);
            }

            if (is_array($result)) {
                $this->logInfo('Scrape completed, processing ' . count($result) . ' products');

                foreach ($result as $productData) {
                    $this->saveProduct($productData);
                }
            }

            $this->markJobCompleted();
            $this->logInfo('Full scrape completed', [
                'found' => $this->productsFound,
                'created' => $this->productsCreated,
                'updated' => $this->productsUpdated,
                'failed' => $this->productsFailed,
            ]);
        } catch (\Exception $e) {
            $this->logError('Scrape failed: ' . $e->getMessage());
            $this->markJobFailed($e->getMessage());
            throw $e;
        }
    }

    public function scrapeCategory(string $categoryUrl, ?string $categoryName = null): void
    {
        $this->markJobRunning();
        $this->logInfo("Starting category scrape: {$categoryUrl}");

        try {
            $maxPages = $this->job->config['max_pages'] ?? 10;

            $result = $this->runNodeScript('scrape_category', [
                'url' => $categoryUrl,
                'max_pages' => $maxPages,
            ]);

            if (isset($result['error'])) {
                throw new \Exception($result['error']);
            }

            if (is_array($result)) {
                $this->logInfo('Category scrape completed, processing ' . count($result) . ' products');

                foreach ($result as $productData) {
                    $this->saveProduct($productData);
                }
            }

            $this->markJobCompleted();
            $this->logInfo('Category scrape completed', [
                'category' => $categoryName ?? $categoryUrl,
                'found' => $this->productsFound,
                'created' => $this->productsCreated,
                'updated' => $this->productsUpdated,
            ]);
        } catch (\Exception $e) {
            $this->logError('Category scrape failed: ' . $e->getMessage());
            $this->markJobFailed($e->getMessage());
            throw $e;
        }
    }

    public function scrapeProduct(string $productUrl): ?array
    {
        $this->markJobRunning();
        $this->logInfo("Scraping product: {$productUrl}");

        try {
            $result = $this->runNodeScript('scrape_product', [
                'url' => $productUrl,
            ]);

            if (isset($result['error'])) {
                throw new \Exception($result['error']);
            }

            if ($result && isset($result['name']) && isset($result['price'])) {
                $product = $this->saveProduct($result);
                $this->markJobCompleted();
                return $result;
            }

            $this->logWarning('Product scrape returned no valid data');
            $this->markJobFailed('No valid product data found');
            return null;
        } catch (\Exception $e) {
            $this->logError('Product scrape failed: ' . $e->getMessage());
            $this->markJobFailed($e->getMessage());
            throw $e;
        }
    }

    public function cleanup(): void
    {
        // No cleanup needed as the Node script handles its own cleanup
    }

    /**
     * Run the Node.js scraper script
     */
    protected function runNodeScript(string $action, array $params = []): array
    {
        $paramsJson = json_encode($params);

        $process = new Process([
            'node',
            $this->scriptPath,
            $action,
            $paramsJson,
        ]);

        // Set timeout based on action (full scrapes take longer)
        $timeout = match ($action) {
            'scrape_all' => 3600, // 1 hour
            'scrape_category' => 1800, // 30 minutes
            default => 300, // 5 minutes
        };

        $process->setTimeout($timeout);
        $process->setIdleTimeout($timeout);

        $this->logDebug("Running Node script: {$action}", ['params' => $params]);

        try {
            $process->run(function ($type, $buffer) {
                // Log stderr output (progress messages)
                if ($type === Process::ERR) {
                    foreach (explode("\n", trim($buffer)) as $line) {
                        if (!empty($line)) {
                            $this->logDebug($line);
                        }
                    }
                }
            });

            if (!$process->isSuccessful()) {
                $errorOutput = $process->getErrorOutput();
                Log::error('Takealot scraper failed', [
                    'action' => $action,
                    'error' => $errorOutput,
                ]);
                throw new \Exception("Scraper script failed: {$errorOutput}");
            }

            $output = $process->getOutput();
            $result = json_decode($output, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Failed to parse scraper output as JSON: ' . json_last_error_msg());
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Takealot scraper exception', [
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get available categories from Takealot
     */
    public function getCategories(): array
    {
        try {
            return $this->runNodeScript('get_categories');
        } catch (\Exception $e) {
            Log::error('Failed to get Takealot categories', ['error' => $e->getMessage()]);
            return [];
        }
    }
}

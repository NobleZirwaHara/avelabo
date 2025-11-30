<?php

namespace App\Services\Scraping;

/**
 * Noon.com Scraper (Placeholder)
 *
 * This scraper will be implemented to scrape products from Noon.com
 * Similar architecture to TakealotScraper, using Puppeteer for browser automation.
 *
 * Note: Noon.com has different site structure and may require different selectors.
 */
class NoonScraper extends BaseScraper
{
    protected string $scriptPath;

    public function __construct()
    {
        $this->scriptPath = base_path('scripts/scrapers/noon.js');
    }

    public function getSourceSlug(): string
    {
        return 'noon';
    }

    public function scrapeAll(): void
    {
        $this->markJobRunning();
        $this->logInfo('Noon scraper not yet implemented');
        $this->markJobFailed('Noon scraper not yet implemented. Coming soon!');
    }

    public function scrapeCategory(string $categoryUrl, ?string $categoryName = null): void
    {
        $this->markJobRunning();
        $this->logInfo('Noon scraper not yet implemented');
        $this->markJobFailed('Noon scraper not yet implemented. Coming soon!');
    }

    public function scrapeProduct(string $productUrl): ?array
    {
        $this->markJobRunning();
        $this->logInfo('Noon scraper not yet implemented');
        $this->markJobFailed('Noon scraper not yet implemented. Coming soon!');
        return null;
    }

    public function cleanup(): void
    {
        // No cleanup needed
    }
}

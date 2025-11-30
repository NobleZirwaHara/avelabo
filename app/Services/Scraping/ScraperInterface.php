<?php

namespace App\Services\Scraping;

use App\Models\ScrapingJob;
use App\Models\ScrapingSource;

interface ScraperInterface
{
    /**
     * Get the source slug this scraper handles
     */
    public function getSourceSlug(): string;

    /**
     * Initialize the scraper with a source and job
     */
    public function initialize(ScrapingSource $source, ScrapingJob $job): void;

    /**
     * Run a full scrape of all products
     */
    public function scrapeAll(): void;

    /**
     * Scrape a specific category
     */
    public function scrapeCategory(string $categoryUrl, ?string $categoryName = null): void;

    /**
     * Scrape a single product by URL
     */
    public function scrapeProduct(string $productUrl): ?array;

    /**
     * Clean up resources (close browser, etc.)
     */
    public function cleanup(): void;
}

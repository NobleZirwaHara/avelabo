<?php

namespace App\Console\Commands;

use App\Jobs\ProcessScrapingJob;
use App\Models\ScrapingJob;
use App\Models\ScrapingSource;
use App\Services\Scraping\ScrapingService;
use Illuminate\Console\Command;

class RunScraper extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scraper:run
                            {source : The source slug (e.g., takealot)}
                            {--type=full : Type of scrape (full, category, product)}
                            {--url= : URL for category or product scrape}
                            {--queue : Queue the job instead of running synchronously}
                            {--max-pages=5 : Maximum pages per category for full scrape}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run a product scraper for a specific source';

    /**
     * Execute the console command.
     */
    public function handle(ScrapingService $scrapingService): int
    {
        $sourceSlug = $this->argument('source');
        $type = $this->option('type');
        $url = $this->option('url');
        $queue = $this->option('queue');
        $maxPages = (int) $this->option('max-pages');

        // Find the source
        $source = ScrapingSource::where('slug', $sourceSlug)->first();

        if (!$source) {
            $this->error("Source not found: {$sourceSlug}");
            $this->info('Available sources:');
            ScrapingSource::all()->each(function ($s) {
                $this->line("  - {$s->slug}: {$s->name}");
            });
            return 1;
        }

        if (!$source->is_active) {
            $this->error("Source is not active: {$sourceSlug}");
            return 1;
        }

        // Check if scraper exists
        $scraper = $scrapingService->getScraper($sourceSlug);
        if (!$scraper) {
            $this->error("No scraper registered for source: {$sourceSlug}");
            return 1;
        }

        // Validate type-specific requirements
        if (in_array($type, ['category', 'product']) && !$url) {
            $this->error("URL is required for {$type} scrape");
            return 1;
        }

        // Build config
        $config = [];
        if ($type === 'category') {
            $config['category_url'] = $url;
            $config['max_pages'] = $maxPages;
        } elseif ($type === 'product') {
            $config['product_url'] = $url;
        } else {
            $config['max_pages_per_category'] = $maxPages;
        }

        // Create the job
        $jobType = match ($type) {
            'category' => ScrapingJob::TYPE_CATEGORY,
            'product' => ScrapingJob::TYPE_PRODUCT,
            default => ScrapingJob::TYPE_FULL,
        };

        $job = $scrapingService->createJob($source, $jobType, $config);

        $this->info("Created scraping job #{$job->id} for {$source->name}");

        if ($queue) {
            ProcessScrapingJob::dispatch($job->id);
            $this->info('Job queued for processing');
        } else {
            $this->info('Running scraper synchronously...');
            $this->newLine();

            $scrapingService->runJob($job);

            // Refresh job to get latest stats
            $job->refresh();

            $this->newLine();
            $this->info('Scrape completed!');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Status', $job->status],
                    ['Products Found', $job->products_found],
                    ['Products Created', $job->products_created],
                    ['Products Updated', $job->products_updated],
                    ['Products Failed', $job->products_failed],
                    ['Images Downloaded', $job->images_downloaded],
                    ['Duration', $job->duration ? "{$job->duration} seconds" : 'N/A'],
                ]
            );

            if ($job->status === ScrapingJob::STATUS_FAILED) {
                $this->error("Job failed: {$job->error_message}");
                return 1;
            }
        }

        return 0;
    }
}

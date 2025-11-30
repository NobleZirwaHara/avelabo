<?php

namespace App\Console\Commands;

use App\Jobs\ProcessScrapingJob;
use App\Models\ScrapingJob;
use App\Models\ScrapingSource;
use App\Services\Scraping\ScrapingService;
use Cron\CronExpression;
use Illuminate\Console\Command;

class ScheduledScraper extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scraper:scheduled
                            {--force : Force run all active sources regardless of schedule}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and run scheduled scraping jobs';

    /**
     * Execute the console command.
     */
    public function handle(ScrapingService $scrapingService): int
    {
        $this->info('Checking for scheduled scraping jobs...');

        $sources = ScrapingSource::where('is_active', true)
            ->whereNotNull('schedule')
            ->get();

        if ($sources->isEmpty()) {
            $this->info('No active sources with schedules found.');
            return 0;
        }

        $jobsQueued = 0;

        foreach ($sources as $source) {
            // Check if schedule says to run now
            if (!$this->option('force') && !$this->shouldRunNow($source)) {
                $this->line("  Skipping {$source->name} (not scheduled for now)");
                continue;
            }

            // Check if there's already a running job for this source
            $hasRunningJob = ScrapingJob::where('source_id', $source->id)
                ->whereIn('status', [ScrapingJob::STATUS_PENDING, ScrapingJob::STATUS_RUNNING])
                ->exists();

            if ($hasRunningJob) {
                $this->line("  Skipping {$source->name} (job already in progress)");
                continue;
            }

            // Create and queue the job
            $job = $scrapingService->createJob($source, ScrapingJob::TYPE_FULL, [
                'max_pages_per_category' => $source->config['max_pages_per_category'] ?? 5,
            ]);

            ProcessScrapingJob::dispatch($job->id);

            $this->info("  Queued scraping job #{$job->id} for {$source->name}");
            $jobsQueued++;
        }

        $this->newLine();
        $this->info("Queued {$jobsQueued} scraping job(s).");

        return 0;
    }

    /**
     * Check if source should run based on its cron schedule
     */
    protected function shouldRunNow(ScrapingSource $source): bool
    {
        if (empty($source->schedule)) {
            return false;
        }

        try {
            $cron = new CronExpression($source->schedule);

            // Check if the current time matches the cron schedule (within 1 minute)
            return $cron->isDue();
        } catch (\Exception $e) {
            $this->warn("  Invalid cron expression for {$source->name}: {$source->schedule}");
            return false;
        }
    }
}

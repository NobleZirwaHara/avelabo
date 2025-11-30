<?php

namespace App\Jobs;

use App\Models\ScrapingJob as ScrapingJobModel;
use App\Services\Scraping\ScrapingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessScrapingJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 1;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 7200; // 2 hours

    /**
     * The scraping job ID
     */
    protected int $scrapingJobId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $scrapingJobId)
    {
        $this->scrapingJobId = $scrapingJobId;
        $this->onQueue('scraping');
    }

    /**
     * Execute the job.
     */
    public function handle(ScrapingService $scrapingService): void
    {
        $scrapingJob = ScrapingJobModel::find($this->scrapingJobId);

        if (!$scrapingJob) {
            Log::warning('Scraping job not found', ['job_id' => $this->scrapingJobId]);
            return;
        }

        if ($scrapingJob->status !== ScrapingJobModel::STATUS_PENDING) {
            Log::warning('Scraping job is not in pending status', [
                'job_id' => $this->scrapingJobId,
                'status' => $scrapingJob->status,
            ]);
            return;
        }

        try {
            $scrapingService->runJob($scrapingJob);
        } catch (\Exception $e) {
            Log::error('Scraping job failed', [
                'job_id' => $this->scrapingJobId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $scrapingJob = ScrapingJobModel::find($this->scrapingJobId);

        if ($scrapingJob) {
            $scrapingJob->update([
                'status' => ScrapingJobModel::STATUS_FAILED,
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ]);
        }

        Log::error('Scraping queue job failed', [
            'job_id' => $this->scrapingJobId,
            'error' => $exception->getMessage(),
        ]);
    }
}

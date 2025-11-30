<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessScrapingJob;
use App\Models\Category;
use App\Models\Currency;
use App\Models\ScrapingJob;
use App\Models\ScrapingSource;
use App\Models\Seller;
use App\Services\Scraping\ScrapingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScrapingController extends Controller
{
    public function __construct(
        protected ScrapingService $scrapingService
    ) {}

    /**
     * Display the scraping dashboard
     */
    public function index()
    {
        $sources = ScrapingSource::with(['seller:id,shop_name', 'defaultCurrency:id,code,symbol'])
            ->withCount('jobs')
            ->get()
            ->map(function ($source) {
                $latestJob = $source->jobs()->latest()->first();
                return [
                    'id' => $source->id,
                    'name' => $source->name,
                    'slug' => $source->slug,
                    'base_url' => $source->base_url,
                    'seller' => $source->seller,
                    'currency' => $source->defaultCurrency,
                    'is_active' => $source->is_active,
                    'auto_publish' => $source->auto_publish,
                    'schedule' => $source->schedule,
                    'last_scraped_at' => $source->last_scraped_at?->diffForHumans(),
                    'jobs_count' => $source->jobs_count,
                    'latest_job' => $latestJob ? [
                        'id' => $latestJob->id,
                        'status' => $latestJob->status,
                        'type' => $latestJob->type,
                        'products_found' => $latestJob->products_found,
                        'products_created' => $latestJob->products_created,
                        'products_updated' => $latestJob->products_updated,
                        'created_at' => $latestJob->created_at->diffForHumans(),
                    ] : null,
                ];
            });

        // Get recent jobs across all sources
        $recentJobs = ScrapingJob::with('source:id,name,slug')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($job) => [
                'id' => $job->id,
                'source' => $job->source,
                'status' => $job->status,
                'type' => $job->type,
                'products_found' => $job->products_found,
                'products_created' => $job->products_created,
                'products_updated' => $job->products_updated,
                'products_failed' => $job->products_failed,
                'started_at' => $job->started_at?->format('Y-m-d H:i'),
                'completed_at' => $job->completed_at?->format('Y-m-d H:i'),
                'duration' => $job->duration,
                'error_message' => $job->error_message,
                'created_at' => $job->created_at->diffForHumans(),
            ]);

        // Stats
        $stats = [
            'total_sources' => ScrapingSource::count(),
            'active_sources' => ScrapingSource::where('is_active', true)->count(),
            'total_jobs' => ScrapingJob::count(),
            'running_jobs' => ScrapingJob::where('status', ScrapingJob::STATUS_RUNNING)->count(),
            'total_products_scraped' => ScrapingJob::sum('products_created'),
            'total_products_updated' => ScrapingJob::sum('products_updated'),
        ];

        return Inertia::render('Admin/Scraping/Index', [
            'sources' => $sources,
            'recentJobs' => $recentJobs,
            'stats' => $stats,
        ]);
    }

    /**
     * Show source details and jobs
     */
    public function show(ScrapingSource $source)
    {
        $source->load(['seller', 'defaultCurrency', 'defaultCategory']);

        $jobs = ScrapingJob::where('source_id', $source->id)
            ->latest()
            ->paginate(20)
            ->through(fn($job) => [
                'id' => $job->id,
                'status' => $job->status,
                'type' => $job->type,
                'config' => $job->config,
                'products_found' => $job->products_found,
                'products_created' => $job->products_created,
                'products_updated' => $job->products_updated,
                'products_failed' => $job->products_failed,
                'images_downloaded' => $job->images_downloaded,
                'error_message' => $job->error_message,
                'started_at' => $job->started_at?->format('Y-m-d H:i:s'),
                'completed_at' => $job->completed_at?->format('Y-m-d H:i:s'),
                'duration' => $job->duration,
                'created_at' => $job->created_at->format('Y-m-d H:i:s'),
            ]);

        $stats = $this->scrapingService->getSourceStats($source);

        return Inertia::render('Admin/Scraping/Show', [
            'source' => $source,
            'jobs' => $jobs,
            'stats' => $stats,
            'sellers' => Seller::where('status', 'active')->get(['id', 'shop_name', 'slug']),
            'currencies' => Currency::where('is_active', true)->get(['id', 'code', 'name']),
            'categories' => Category::whereNull('parent_id')->get(['id', 'name']),
        ]);
    }

    /**
     * Create a new scraping source
     */
    public function create()
    {
        return Inertia::render('Admin/Scraping/Create', [
            'sellers' => Seller::where('status', 'active')->get(['id', 'shop_name', 'slug']),
            'currencies' => Currency::where('is_active', true)->get(['id', 'code', 'name']),
            'categories' => Category::whereNull('parent_id')->with('children:id,name,parent_id')->get(['id', 'name']),
            'availableScrapers' => array_keys($this->scrapingService->getScrapers()),
        ]);
    }

    /**
     * Store a new scraping source
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:scraping_sources,slug'],
            'base_url' => ['required', 'url'],
            'seller_id' => ['required', 'exists:sellers,id'],
            'default_currency_id' => ['required', 'exists:currencies,id'],
            'default_category_id' => ['nullable', 'exists:categories,id'],
            'config' => ['nullable', 'array'],
            'schedule' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'auto_publish' => ['boolean'],
        ]);

        ScrapingSource::create($validated);

        return redirect()->route('admin.scraping.index')
            ->with('success', 'Scraping source created successfully.');
    }

    /**
     * Update a scraping source
     */
    public function update(Request $request, ScrapingSource $source)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'base_url' => ['required', 'url'],
            'seller_id' => ['required', 'exists:sellers,id'],
            'default_currency_id' => ['required', 'exists:currencies,id'],
            'default_category_id' => ['nullable', 'exists:categories,id'],
            'config' => ['nullable', 'array'],
            'schedule' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'auto_publish' => ['boolean'],
        ]);

        $source->update($validated);

        return back()->with('success', 'Source updated successfully.');
    }

    /**
     * Toggle source active status
     */
    public function toggleActive(ScrapingSource $source)
    {
        $source->update(['is_active' => !$source->is_active]);

        return back()->with('success', 'Source status updated.');
    }

    /**
     * Start a scraping job
     */
    public function startJob(Request $request, ScrapingSource $source)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:full,category,product'],
            'category_url' => ['required_if:type,category', 'nullable', 'url'],
            'product_url' => ['required_if:type,product', 'nullable', 'url'],
            'max_pages' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if (!$source->is_active) {
            return back()->with('error', 'Cannot start job for inactive source.');
        }

        // Build config
        $config = [];
        if ($validated['type'] === 'category') {
            $config['category_url'] = $validated['category_url'];
            $config['max_pages'] = $validated['max_pages'] ?? 10;
        } elseif ($validated['type'] === 'product') {
            $config['product_url'] = $validated['product_url'];
        } else {
            $config['max_pages_per_category'] = $validated['max_pages'] ?? 5;
        }

        // Create job
        $job = $this->scrapingService->createJob($source, $validated['type'], $config);

        // Dispatch to queue
        ProcessScrapingJob::dispatch($job->id);

        return back()->with('success', "Scraping job #{$job->id} queued for processing.");
    }

    /**
     * Cancel a running/pending job
     */
    public function cancelJob(ScrapingJob $job)
    {
        if ($this->scrapingService->cancelJob($job)) {
            return back()->with('success', 'Job cancelled.');
        }

        return back()->with('error', 'Cannot cancel this job.');
    }

    /**
     * View job details and logs
     */
    public function showJob(ScrapingJob $job)
    {
        $job->load('source:id,name,slug');

        $logs = $job->logs()
            ->latest()
            ->paginate(50)
            ->through(fn($log) => [
                'id' => $log->id,
                'level' => $log->level,
                'message' => $log->message,
                'context' => $log->context,
                'url' => $log->url,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
            ]);

        return Inertia::render('Admin/Scraping/Job', [
            'job' => [
                'id' => $job->id,
                'source' => $job->source,
                'status' => $job->status,
                'type' => $job->type,
                'config' => $job->config,
                'products_found' => $job->products_found,
                'products_created' => $job->products_created,
                'products_updated' => $job->products_updated,
                'products_failed' => $job->products_failed,
                'images_downloaded' => $job->images_downloaded,
                'error_message' => $job->error_message,
                'started_at' => $job->started_at?->format('Y-m-d H:i:s'),
                'completed_at' => $job->completed_at?->format('Y-m-d H:i:s'),
                'duration' => $job->duration,
                'created_at' => $job->created_at->format('Y-m-d H:i:s'),
            ],
            'logs' => $logs,
        ]);
    }

    /**
     * Delete a scraping source
     */
    public function destroy(ScrapingSource $source)
    {
        // Check for running jobs
        if ($source->jobs()->where('status', ScrapingJob::STATUS_RUNNING)->exists()) {
            return back()->with('error', 'Cannot delete source with running jobs.');
        }

        $source->delete();

        return redirect()->route('admin.scraping.index')
            ->with('success', 'Source deleted successfully.');
    }
}

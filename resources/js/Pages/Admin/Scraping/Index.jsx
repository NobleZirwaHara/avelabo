import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useEffect } from 'react';

export default function Index({ sources, recentJobs, stats, flash }) {
    const [showStartModal, setShowStartModal] = useState(false);
    const [selectedSource, setSelectedSource] = useState(null);
    const [jobType, setJobType] = useState('full');
    const [categoryUrl, setCategoryUrl] = useState('');
    const [productUrl, setProductUrl] = useState('');
    const [maxPages, setMaxPages] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuickScrapePanel, setShowQuickScrapePanel] = useState(false);
    const [quickScrapeUrl, setQuickScrapeUrl] = useState('');
    const [quickScrapeSource, setQuickScrapeSource] = useState('');

    // Auto-refresh when there are running jobs
    useEffect(() => {
        const hasRunningJobs = stats?.running_jobs > 0 || recentJobs?.some(job => job.status === 'running' || job.status === 'pending');

        if (hasRunningJobs) {
            const interval = setInterval(() => {
                router.reload({ only: ['sources', 'recentJobs', 'stats'] });
            }, 5000); // Refresh every 5 seconds

            return () => clearInterval(interval);
        }
    }, [stats?.running_jobs, recentJobs]);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700',
            running: 'bg-blue-100 text-blue-700 animate-pulse',
            completed: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const handleStartJob = (source) => {
        setSelectedSource(source);
        setJobType('full');
        setCategoryUrl('');
        setProductUrl('');
        setMaxPages(5);
        setShowStartModal(true);
    };

    const handleSubmitJob = () => {
        if (!selectedSource) return;

        setIsSubmitting(true);
        router.post(route('admin.scraping.start-job', selectedSource.id), {
            type: jobType,
            category_url: categoryUrl || null,
            product_url: productUrl || null,
            max_pages: maxPages,
        }, {
            onSuccess: () => {
                setShowStartModal(false);
                setSelectedSource(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleQuickScrape = () => {
        if (!quickScrapeSource || !quickScrapeUrl) return;

        setIsSubmitting(true);

        // Determine if it's a product or category URL
        const isProductUrl = quickScrapeUrl.includes('/PLID') || quickScrapeUrl.includes('/product/');

        router.post(route('admin.scraping.start-job', quickScrapeSource), {
            type: isProductUrl ? 'product' : 'category',
            product_url: isProductUrl ? quickScrapeUrl : null,
            category_url: !isProductUrl ? quickScrapeUrl : null,
            max_pages: 10,
        }, {
            onSuccess: () => {
                setShowQuickScrapePanel(false);
                setQuickScrapeUrl('');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleToggleActive = (source) => {
        router.post(route('admin.scraping.toggle-active', source.id), {}, {
            preserveScroll: true,
        });
    };

    const handleCancelJob = (jobId) => {
        if (confirm('Are you sure you want to cancel this job?')) {
            router.post(route('admin.scraping.cancel-job', jobId), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleStartAllSources = () => {
        if (confirm('Start scraping for all active sources? This may take a while.')) {
            sources.filter(s => s.is_active).forEach(source => {
                router.post(route('admin.scraping.start-job', source.id), {
                    type: 'full',
                    max_pages: 3,
                }, { preserveScroll: true });
            });
        }
    };

    const activeSources = sources?.filter(s => s.is_active) || [];

    return (
        <AdminLayout>
            <Head title="Scraping Management" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Scraping Management</h2>
                        <p className="text-body">Manage product scraping sources and jobs</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowQuickScrapePanel(!showQuickScrapePanel)}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">bolt</span>
                            Quick Scrape
                        </button>
                        {activeSources.length > 0 && (
                            <button
                                onClick={handleStartAllSources}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <span className="material-icons text-sm">play_circle</span>
                                Start All
                            </button>
                        )}
                        <Link
                            href={route('admin.scraping.create')}
                            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">add</span>
                            Add Source
                        </Link>
                    </div>
                </div>

                {/* Quick Scrape Panel */}
                {showQuickScrapePanel && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons text-green-600">bolt</span>
                            <h3 className="text-lg font-semibold text-heading dark:text-white">Quick Scrape</h3>
                            <span className="text-sm text-body ml-2">Paste a URL to quickly scrape a product or category</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Source</label>
                                <select
                                    value={quickScrapeSource}
                                    onChange={(e) => setQuickScrapeSource(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-body border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select source...</option>
                                    {activeSources.map((source) => (
                                        <option key={source.id} value={source.id}>{source.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">URL</label>
                                <input
                                    type="url"
                                    value={quickScrapeUrl}
                                    onChange={(e) => setQuickScrapeUrl(e.target.value)}
                                    placeholder="Paste product or category URL..."
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-body border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleQuickScrape}
                                    disabled={!quickScrapeSource || !quickScrapeUrl || isSubmitting}
                                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Starting...' : 'Scrape Now'}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-body mt-3">
                            The system will automatically detect if it's a product or category URL based on the URL pattern.
                        </p>
                    </div>
                )}

                {/* Running Jobs Alert */}
                {stats?.running_jobs > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <span className="material-icons text-blue-600 animate-spin">sync</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-blue-800 dark:text-blue-300">
                                {stats.running_jobs} job{stats.running_jobs > 1 ? 's' : ''} currently running
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                This page will auto-refresh every 5 seconds to show progress.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-body">Total Sources</p>
                        <p className="text-2xl font-bold text-heading dark:text-white">{stats?.total_sources || 0}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <p className="text-sm text-green-700 dark:text-green-400">Active Sources</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats?.active_sources || 0}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-400">Total Jobs</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats?.total_jobs || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${stats?.running_jobs > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-400' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">Running Jobs</p>
                        <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats?.running_jobs || 0}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                        <p className="text-sm text-purple-700 dark:text-purple-400">Products Scraped</p>
                        <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats?.total_products_scraped || 0}</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                        <p className="text-sm text-indigo-700 dark:text-indigo-400">Products Updated</p>
                        <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">{stats?.total_products_updated || 0}</p>
                    </div>
                </div>

                {/* Sources Grid */}
                <div>
                    <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Scraping Sources</h3>
                    {sources?.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {sources.map((source) => (
                                <div key={source.id} className={`bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden ${source.latest_job?.status === 'running' ? 'ring-2 ring-blue-400' : ''}`}>
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${source.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    <span className={`material-icons ${source.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {source.slug === 'takealot' ? 'shopping_bag' : source.slug === 'noon' ? 'store' : 'language'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-heading dark:text-white">{source.name}</h3>
                                                    <p className="text-sm text-body">{source.base_url}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${source.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {source.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                {source.auto_publish && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700" title="Products are automatically published">
                                                        Auto
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-body">Seller:</p>
                                                <p className="font-medium text-heading dark:text-white">{source.seller?.shop_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-body">Currency:</p>
                                                <p className="font-medium text-heading dark:text-white">{source.currency?.code || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-body">Schedule:</p>
                                                <p className="font-medium text-heading dark:text-white">{source.schedule || 'Manual only'}</p>
                                            </div>
                                            <div>
                                                <p className="text-body">Last Scraped:</p>
                                                <p className="font-medium text-heading dark:text-white">{source.last_scraped_at || 'Never'}</p>
                                            </div>
                                        </div>

                                        {source.latest_job && (
                                            <div className={`mt-4 p-3 rounded-lg ${source.latest_job.status === 'running' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-dark-body'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-body">Latest Job #{source.latest_job.id}</p>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(source.latest_job.status)}`}>
                                                        {source.latest_job.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-body">
                                                        <span className="text-green-600 font-medium">{source.latest_job.products_created}</span> created,{' '}
                                                        <span className="text-blue-600 font-medium">{source.latest_job.products_updated}</span> updated
                                                    </span>
                                                    {source.latest_job.status === 'running' && (
                                                        <button
                                                            onClick={() => handleCancelJob(source.latest_job.id)}
                                                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-body border-t dark:border-white/10 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleActive(source)}
                                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                    source.is_active
                                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                            >
                                                {source.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            {source.is_active && (
                                                <button
                                                    onClick={() => handleStartJob(source)}
                                                    disabled={source.latest_job?.status === 'running'}
                                                    className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {source.latest_job?.status === 'running' ? 'Running...' : 'Start Scrape'}
                                                </button>
                                            )}
                                        </div>
                                        <Link
                                            href={route('admin.scraping.show', source.id)}
                                            className="px-3 py-1.5 text-brand hover:text-brand-dark text-xs font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-12 text-center">
                            <span className="material-icons text-5xl text-gray-300 mb-4">source</span>
                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No scraping sources</h3>
                            <p className="text-body mb-4">Add a scraping source to start importing products.</p>
                            <Link
                                href={route('admin.scraping.create')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add First Source
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent Jobs */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-heading dark:text-white">Recent Jobs</h3>
                        <button
                            onClick={() => router.reload({ only: ['recentJobs'] })}
                            className="text-brand hover:text-brand-dark text-sm font-medium flex items-center gap-1"
                        >
                            <span className="material-icons text-sm">refresh</span>
                            Refresh
                        </button>
                    </div>
                    {recentJobs?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-dark-body">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Source</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Type</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Products</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Duration</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Started</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-body uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-white/10">
                                    {recentJobs.map((job) => (
                                        <tr key={job.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 ${job.status === 'running' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-heading dark:text-white">{job.source?.name}</p>
                                            </td>
                                            <td className="py-3 px-4 text-sm capitalize">{job.type}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className="text-green-600">{job.products_created}</span>
                                                {' / '}
                                                <span className="text-blue-600">{job.products_updated}</span>
                                                {job.products_failed > 0 && (
                                                    <>
                                                        {' / '}
                                                        <span className="text-red-600">{job.products_failed}</span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-body">
                                                {job.duration ? `${job.duration}s` : job.status === 'running' ? <span className="text-blue-600">In progress...</span> : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-body">
                                                {job.created_at}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(job.status === 'running' || job.status === 'pending') && (
                                                        <button
                                                            onClick={() => handleCancelJob(job.id)}
                                                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('admin.scraping.job', job.id)}
                                                        className="text-brand hover:text-brand-dark text-sm font-medium"
                                                    >
                                                        View
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <span className="material-icons text-5xl text-gray-300 mb-4">schedule</span>
                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No jobs yet</h3>
                            <p className="text-body">Start a scrape to see job history here.</p>
                        </div>
                    )}
                </div>

                {/* Help Section */}
                <div className="bg-gray-50 dark:bg-dark-body rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-heading dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-icons text-brand">help_outline</span>
                        How to Use
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-heading dark:text-white mb-2">Quick Scrape</h4>
                            <p className="text-body">
                                Use the Quick Scrape panel to instantly scrape a single product or category by pasting a URL.
                                The system auto-detects whether it's a product or category.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-heading dark:text-white mb-2">Full Scrape</h4>
                            <p className="text-body">
                                Click "Start Scrape" on a source to run a comprehensive scrape of all configured categories.
                                This may take 30 minutes to several hours.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-heading dark:text-white mb-2">Scheduled Scrapes</h4>
                            <p className="text-body">
                                Sources with a schedule (cron) will automatically run at the specified times.
                                Check "Schedule" field on each source card.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Start Job Modal */}
            {showStartModal && selectedSource && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setShowStartModal(false)} />
                        <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-lg max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <span className="material-icons text-brand">play_arrow</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-heading dark:text-white">
                                        Start Scraping Job
                                    </h3>
                                    <p className="text-sm text-body">{selectedSource.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                        Job Type
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['full', 'category', 'product'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setJobType(type)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    jobType === type
                                                        ? 'bg-brand text-white'
                                                        : 'bg-gray-100 dark:bg-dark-body text-body hover:bg-gray-200'
                                                }`}
                                            >
                                                {type === 'full' ? 'Full' : type === 'category' ? 'Category' : 'Product'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {jobType === 'category' && (
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                            Category URL
                                        </label>
                                        <input
                                            type="url"
                                            value={categoryUrl}
                                            onChange={(e) => setCategoryUrl(e.target.value)}
                                            placeholder="https://www.takealot.com/electronics"
                                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                        />
                                    </div>
                                )}

                                {jobType === 'product' && (
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                            Product URL
                                        </label>
                                        <input
                                            type="url"
                                            value={productUrl}
                                            onChange={(e) => setProductUrl(e.target.value)}
                                            placeholder="https://www.takealot.com/product/..."
                                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                        />
                                    </div>
                                )}

                                {jobType !== 'product' && (
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                            Max Pages per Category: {maxPages}
                                        </label>
                                        <input
                                            type="range"
                                            value={maxPages}
                                            onChange={(e) => setMaxPages(parseInt(e.target.value))}
                                            min="1"
                                            max="50"
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-body mt-1">
                                            <span>1 page (faster)</span>
                                            <span>50 pages (more products)</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                        <strong>Note:</strong> {jobType === 'full'
                                            ? 'Full scrapes can take 30 minutes to several hours depending on the number of categories and pages.'
                                            : jobType === 'category'
                                            ? 'Category scrapes typically take 5-15 minutes depending on the number of pages.'
                                            : 'Single product scrapes usually complete within 30 seconds.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowStartModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitJob}
                                    disabled={isSubmitting || (jobType === 'category' && !categoryUrl) || (jobType === 'product' && !productUrl)}
                                    className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-icons text-sm animate-spin">sync</span>
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">play_arrow</span>
                                            Start Job
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

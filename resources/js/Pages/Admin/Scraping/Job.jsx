import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useEffect, useState } from 'react';

export default function Job({ job, logs }) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auto-refresh when job is running
    useEffect(() => {
        if (job.status === 'running' || job.status === 'pending') {
            const interval = setInterval(() => {
                router.reload({ only: ['job', 'logs'] });
            }, 3000); // Refresh every 3 seconds

            return () => clearInterval(interval);
        }
    }, [job.status]);
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700',
            running: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getLogLevelColor = (level) => {
        const colors = {
            debug: 'text-gray-500',
            info: 'text-blue-600',
            warning: 'text-yellow-600',
            error: 'text-red-600',
        };
        return colors[level] || 'text-gray-500';
    };

    const handleCancelJob = () => {
        if (confirm('Are you sure you want to cancel this job?')) {
            router.post(route('admin.scraping.cancel-job', job.id));
        }
    };

    return (
        <AdminLayout>
            <Head title={`Scraping Job #${job.id}`} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.scraping.show', job.source?.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-body rounded-lg transition-colors"
                        >
                            <span className="material-icons text-body">arrow_back</span>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold text-heading dark:text-white">Job #{job.id}</h2>
                            <p className="text-body">{job.source?.name} - {job.type} scrape</p>
                        </div>
                    </div>
                    {(job.status === 'pending' || job.status === 'running') && (
                        <button
                            onClick={handleCancelJob}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel Job
                        </button>
                    )}
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Card */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Job Status</h3>
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                                {job.status}
                            </span>
                            <span className="text-sm text-body capitalize">{job.type} scrape</span>
                        </div>

                        {job.error_message && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Error Message</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{job.error_message}</p>
                            </div>
                        )}

                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-body">Started</dt>
                                <dd className="font-medium text-heading dark:text-white">{job.started_at || 'Not started'}</dd>
                            </div>
                            <div>
                                <dt className="text-body">Completed</dt>
                                <dd className="font-medium text-heading dark:text-white">{job.completed_at || 'In progress'}</dd>
                            </div>
                            <div>
                                <dt className="text-body">Duration</dt>
                                <dd className="font-medium text-heading dark:text-white">{job.duration ? `${job.duration} seconds` : '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-body">Created</dt>
                                <dd className="font-medium text-heading dark:text-white">{job.created_at}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Results</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-dark-body rounded-lg">
                                <p className="text-2xl font-bold text-heading dark:text-white">{job.products_found}</p>
                                <p className="text-sm text-body">Products Found</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{job.products_created}</p>
                                <p className="text-sm text-green-600 dark:text-green-400">Created</p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{job.products_updated}</p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Updated</p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{job.products_failed}</p>
                                <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg col-span-2">
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{job.images_downloaded}</p>
                                <p className="text-sm text-purple-600 dark:text-purple-400">Images Downloaded</p>
                            </div>
                        </div>

                        {job.config && Object.keys(job.config).length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-heading dark:text-white mb-2">Configuration</p>
                                <pre className="text-xs bg-gray-50 dark:bg-dark-body p-3 rounded-lg overflow-auto">
                                    {JSON.stringify(job.config, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logs */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b dark:border-white/10">
                        <h3 className="text-lg font-semibold text-heading dark:text-white">Logs</h3>
                    </div>
                    {logs?.data?.length > 0 ? (
                        <>
                            <div className="divide-y dark:divide-white/10">
                                {logs.data.map((log) => (
                                    <div key={log.id} className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div className="flex items-start gap-3">
                                            <span className={`text-xs font-medium uppercase min-w-16 ${getLogLevelColor(log.level)}`}>
                                                {log.level}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-heading dark:text-white">{log.message}</p>
                                                {log.url && (
                                                    <p className="text-xs text-body mt-1 truncate">{log.url}</p>
                                                )}
                                                {log.context && Object.keys(log.context).length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="text-xs text-brand cursor-pointer">Show context</summary>
                                                        <pre className="text-xs bg-gray-50 dark:bg-dark-body p-2 rounded mt-1 overflow-auto">
                                                            {JSON.stringify(log.context, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                            <span className="text-xs text-body whitespace-nowrap">{log.created_at}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {logs.last_page > 1 && (
                                <div className="px-6 py-4 border-t dark:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-body">
                                            Showing {logs.from} to {logs.to} of {logs.total} logs
                                        </p>
                                        <div className="flex gap-1">
                                            {logs.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`px-3 py-1.5 rounded text-sm ${
                                                        link.active
                                                            ? 'bg-brand text-white'
                                                            : link.url
                                                            ? 'bg-gray-100 dark:bg-dark-body text-body hover:bg-gray-200'
                                                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <span className="material-icons text-5xl text-gray-300 mb-4">article</span>
                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No logs yet</h3>
                            <p className="text-body">Logs will appear here as the job runs.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

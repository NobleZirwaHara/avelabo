import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useEffect } from 'react';

export default function Show({ source, jobs, stats, sellers, currencies, categories }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState('general');
    const [categoryInput, setCategoryInput] = useState('');
    const [configCategories, setConfigCategories] = useState(source.config?.categories || []);

    const { data, setData, put, processing, errors } = useForm({
        name: source.name,
        base_url: source.base_url,
        seller_id: source.seller_id,
        default_currency_id: source.default_currency_id,
        default_category_id: source.default_category_id || '',
        schedule: source.schedule || '',
        is_active: source.is_active,
        auto_publish: source.auto_publish,
        config: source.config || {},
    });

    // Auto-refresh when there are running jobs
    useEffect(() => {
        const hasRunningJobs = jobs?.data?.some(job => job.status === 'running' || job.status === 'pending');

        if (hasRunningJobs) {
            const interval = setInterval(() => {
                router.reload({ only: ['jobs', 'stats'] });
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [jobs?.data]);

    const schedulePresets = [
        { label: 'Manual Only', value: '' },
        { label: 'Every Hour', value: '0 * * * *' },
        { label: 'Every 6 Hours', value: '0 */6 * * *' },
        { label: 'Daily at 2am', value: '0 2 * * *' },
        { label: 'Daily at 6am', value: '0 6 * * *' },
        { label: 'Weekly (Sunday)', value: '0 2 * * 0' },
        { label: 'Weekly (Monday)', value: '0 2 * * 1' },
    ];

    const addCategory = () => {
        if (categoryInput.trim() && !configCategories.includes(categoryInput.trim())) {
            const newCategories = [...configCategories, categoryInput.trim()];
            setConfigCategories(newCategories);
            setData('config', { ...data.config, categories: newCategories });
            setCategoryInput('');
        }
    };

    const removeCategory = (index) => {
        const newCategories = configCategories.filter((_, i) => i !== index);
        setConfigCategories(newCategories);
        setData('config', { ...data.config, categories: newCategories });
    };

    const updateConfig = (key, value) => {
        setData('config', { ...data.config, [key]: value });
    };

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

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route('admin.scraping.update', source.id), {
            onSuccess: () => setShowEditModal(false),
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this source? This cannot be undone.')) {
            router.delete(route('admin.scraping.destroy', source.id));
        }
    };

    return (
        <AdminLayout>
            <Head title={`Scraping Source - ${source.name}`} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.scraping.index')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-body rounded-lg transition-colors"
                        >
                            <span className="material-icons text-body">arrow_back</span>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold text-heading dark:text-white">{source.name}</h2>
                            <p className="text-body">{source.base_url}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                showSettingsPanel
                                    ? 'bg-brand text-white'
                                    : 'bg-gray-100 dark:bg-dark-body hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <span className="material-icons text-sm">settings</span>
                            Settings
                        </button>
                        <button
                            onClick={() => router.post(route('admin.scraping.start-job', source.id), { type: 'full', max_pages: 5 })}
                            disabled={jobs?.data?.some(job => job.status === 'running')}
                            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-icons text-sm">play_arrow</span>
                            Start Scrape
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettingsPanel && (
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden">
                        {/* Settings Tabs */}
                        <div className="border-b dark:border-white/10">
                            <div className="flex gap-1 px-4 pt-4">
                                {[
                                    { id: 'general', label: 'General', icon: 'tune' },
                                    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
                                    { id: 'categories', label: 'Categories', icon: 'category' },
                                    { id: 'advanced', label: 'Advanced', icon: 'code' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSettingsTab(tab.id)}
                                        className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                            activeSettingsTab === tab.id
                                                ? 'bg-gray-100 dark:bg-dark-body text-heading dark:text-white'
                                                : 'text-body hover:text-heading dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="material-icons text-sm">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6">
                            {/* General Settings */}
                            {activeSettingsTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Source Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Base URL
                                            </label>
                                            <input
                                                type="url"
                                                value={data.base_url}
                                                onChange={(e) => setData('base_url', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            {errors.base_url && <p className="text-red-500 text-xs mt-1">{errors.base_url}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Seller Account
                                            </label>
                                            <select
                                                value={data.seller_id}
                                                onChange={(e) => setData('seller_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            >
                                                <option value="">Select seller...</option>
                                                {sellers?.map((seller) => (
                                                    <option key={seller.id} value={seller.id}>{seller.shop_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Default Currency
                                            </label>
                                            <select
                                                value={data.default_currency_id}
                                                onChange={(e) => setData('default_currency_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            >
                                                <option value="">Select currency...</option>
                                                {currencies?.map((currency) => (
                                                    <option key={currency.id} value={currency.id}>{currency.code} - {currency.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Default Product Category
                                            </label>
                                            <select
                                                value={data.default_category_id}
                                                onChange={(e) => setData('default_category_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            >
                                                <option value="">No default (auto-detect)</option>
                                                {categories?.map((category) => (
                                                    <option key={category.id} value={category.id}>{category.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-body rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-heading dark:text-white">Active</span>
                                                <span className="text-xs text-body">Enable this source for scraping</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-body rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.auto_publish}
                                                onChange={(e) => setData('auto_publish', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-heading dark:text-white">Auto-Publish</span>
                                                <span className="text-xs text-body">Automatically publish scraped products</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Schedule Settings */}
                            {activeSettingsTab === 'schedule' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-3">
                                            Schedule Presets
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {schedulePresets.map((preset) => (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={() => setData('schedule', preset.value)}
                                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                        data.schedule === preset.value
                                                            ? 'bg-brand text-white'
                                                            : 'bg-gray-100 dark:bg-dark-body text-body hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                            Custom Cron Expression
                                        </label>
                                        <input
                                            type="text"
                                            value={data.schedule}
                                            onChange={(e) => setData('schedule', e.target.value)}
                                            placeholder="0 2 * * * (minute hour day month weekday)"
                                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand font-mono"
                                        />
                                        <p className="text-xs text-body mt-2">
                                            Format: minute (0-59) hour (0-23) day (1-31) month (1-12) weekday (0-6, Sunday=0)
                                        </p>
                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons text-blue-600 mt-0.5">info</span>
                                            <div>
                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Current Schedule</p>
                                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                                    {data.schedule || 'Manual only - scrapes will only run when started manually'}
                                                </p>
                                                {data.schedule && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                                                        Requires the Laravel scheduler to be running: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">php artisan schedule:work</code>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Categories Settings */}
                            {activeSettingsTab === 'categories' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                            Category URLs to Scrape
                                        </label>
                                        <p className="text-xs text-body mb-4">
                                            Add specific category URLs from {source.name} to scrape. If no categories are added, the scraper will use default categories.
                                        </p>

                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="url"
                                                value={categoryInput}
                                                onChange={(e) => setCategoryInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                                                placeholder="https://www.takealot.com/electronics"
                                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            <button
                                                type="button"
                                                onClick={addCategory}
                                                className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {configCategories.length > 0 ? (
                                            <div className="space-y-2">
                                                {configCategories.map((cat, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-body rounded-lg group"
                                                    >
                                                        <span className="text-sm text-heading dark:text-white truncate flex-1">{cat}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCategory(index)}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <span className="material-icons text-sm">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 dark:bg-dark-body rounded-lg">
                                                <span className="material-icons text-4xl text-gray-300 mb-2">folder_open</span>
                                                <p className="text-body text-sm">No custom categories added</p>
                                                <p className="text-xs text-body mt-1">The scraper will use default category discovery</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Advanced Settings */}
                            {activeSettingsTab === 'advanced' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Max Pages per Category
                                            </label>
                                            <input
                                                type="number"
                                                value={data.config?.max_pages || 10}
                                                onChange={(e) => updateConfig('max_pages', parseInt(e.target.value))}
                                                min="1"
                                                max="100"
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            <p className="text-xs text-body mt-1">Limit pages scraped per category (1-100)</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Delay Between Requests (ms)
                                            </label>
                                            <input
                                                type="number"
                                                value={data.config?.delay_ms || 1000}
                                                onChange={(e) => updateConfig('delay_ms', parseInt(e.target.value))}
                                                min="500"
                                                max="10000"
                                                step="100"
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            <p className="text-xs text-body mt-1">Wait time between requests (500-10000ms)</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Timeout per Page (seconds)
                                            </label>
                                            <input
                                                type="number"
                                                value={data.config?.timeout_seconds || 30}
                                                onChange={(e) => updateConfig('timeout_seconds', parseInt(e.target.value))}
                                                min="10"
                                                max="120"
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            <p className="text-xs text-body mt-1">Maximum time to wait for page load</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                                Concurrent Requests
                                            </label>
                                            <input
                                                type="number"
                                                value={data.config?.concurrent_requests || 1}
                                                onChange={(e) => updateConfig('concurrent_requests', parseInt(e.target.value))}
                                                min="1"
                                                max="5"
                                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            />
                                            <p className="text-xs text-body mt-1">Number of parallel browser instances (1-5)</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-body rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.config?.download_images ?? true}
                                                onChange={(e) => updateConfig('download_images', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-heading dark:text-white">Download Images</span>
                                                <span className="text-xs text-body">Download and store product images locally</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-body rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.config?.skip_existing ?? false}
                                                onChange={(e) => updateConfig('skip_existing', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-heading dark:text-white">Skip Existing</span>
                                                <span className="text-xs text-body">Skip products that already exist in database</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-body rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.config?.headless ?? true}
                                                onChange={(e) => updateConfig('headless', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-heading dark:text-white">Headless Mode</span>
                                                <span className="text-xs text-body">Run browser without visible window</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons text-yellow-600 mt-0.5">warning</span>
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Advanced Settings</p>
                                                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                                    Modifying these settings may affect scraping performance and reliability.
                                                    Lower delays or higher concurrency may result in rate limiting.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsPanel(false)}
                                    className="px-6 py-2.5 bg-gray-100 dark:bg-dark-body hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <span className="material-icons text-sm animate-spin">sync</span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">save</span>
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Source Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Info Card */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Source Details</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm text-body">Slug</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.slug}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Status</dt>
                                <dd>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${source.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {source.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Seller</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.seller?.shop_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Currency</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.default_currency?.code}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Default Category</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.default_category?.name || 'None'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Auto-Publish</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.auto_publish ? 'Yes' : 'No'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Schedule</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.schedule || 'Manual only'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-body">Last Scraped</dt>
                                <dd className="font-medium text-heading dark:text-white">{source.last_scraped_at || 'Never'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Statistics</h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-body">Total Jobs</dt>
                                <dd className="font-medium text-heading dark:text-white">{stats?.total_jobs || 0}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-body">Completed Jobs</dt>
                                <dd className="font-medium text-green-600">{stats?.completed_jobs || 0}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-body">Failed Jobs</dt>
                                <dd className="font-medium text-red-600">{stats?.failed_jobs || 0}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-body">Products Created</dt>
                                <dd className="font-medium text-heading dark:text-white">{stats?.total_products_created || 0}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-body">Products Updated</dt>
                                <dd className="font-medium text-heading dark:text-white">{stats?.total_products_updated || 0}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Config Card */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Configuration</h3>
                        {source.config && Object.keys(source.config).length > 0 ? (
                            <pre className="text-xs bg-gray-50 dark:bg-dark-body p-3 rounded-lg overflow-auto max-h-48">
                                {JSON.stringify(source.config, null, 2)}
                            </pre>
                        ) : (
                            <p className="text-body text-sm">No configuration set</p>
                        )}
                    </div>
                </div>

                {/* Jobs Table */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b dark:border-white/10">
                        <h3 className="text-lg font-semibold text-heading dark:text-white">Job History</h3>
                    </div>
                    {jobs?.data?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-dark-body">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">ID</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Type</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Status</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Found</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Created</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Updated</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Failed</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Duration</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Started</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-body uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-white/10">
                                        {jobs.data.map((job) => (
                                            <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                <td className="py-3 px-4 text-sm font-medium">#{job.id}</td>
                                                <td className="py-3 px-4 text-sm capitalize">{job.type}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">{job.products_found}</td>
                                                <td className="py-3 px-4 text-sm text-green-600">{job.products_created}</td>
                                                <td className="py-3 px-4 text-sm text-blue-600">{job.products_updated}</td>
                                                <td className="py-3 px-4 text-sm text-red-600">{job.products_failed}</td>
                                                <td className="py-3 px-4 text-sm text-body">{job.duration ? `${job.duration}s` : '-'}</td>
                                                <td className="py-3 px-4 text-sm text-body">{job.started_at || '-'}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link
                                                        href={route('admin.scraping.job', job.id)}
                                                        className="text-brand hover:text-brand-dark text-sm font-medium"
                                                    >
                                                        View Logs
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {jobs.last_page > 1 && (
                                <div className="px-6 py-4 border-t dark:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-body">
                                            Showing {jobs.from} to {jobs.to} of {jobs.total} jobs
                                        </p>
                                        <div className="flex gap-1">
                                            {jobs.links.map((link, index) => (
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
                            <span className="material-icons text-5xl text-gray-300 mb-4">schedule</span>
                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No jobs yet</h3>
                            <p className="text-body">Start a scrape from the main scraping page.</p>
                        </div>
                    )}
                </div>
            </div>

        </AdminLayout>
    );
}

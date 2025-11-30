import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create({ sellers, currencies, categories, availableScrapers }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        base_url: '',
        seller_id: '',
        default_currency_id: '',
        default_category_id: '',
        schedule: '',
        is_active: true,
        auto_publish: true,
        config: {},
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.scraping.store'));
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setData({
            ...data,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        });
    };

    return (
        <AdminLayout>
            <Head title="Add Scraping Source" />

            <div className="max-w-2xl mx-auto">
                {/* Page Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={route('admin.scraping.index')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-body rounded-lg transition-colors"
                    >
                        <span className="material-icons text-body">arrow_back</span>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Add Scraping Source</h2>
                        <p className="text-body">Configure a new product scraping source</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6 space-y-6">
                    {availableScrapers?.length > 0 && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                <strong>Available Scrapers:</strong> {availableScrapers.join(', ')}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Make sure your source slug matches one of these scraper identifiers.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                Source Name *
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={handleNameChange}
                                placeholder="e.g., Takealot"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                required
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                Slug *
                            </label>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                placeholder="e.g., takealot"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                required
                            />
                            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                            Base URL *
                        </label>
                        <input
                            type="url"
                            value={data.base_url}
                            onChange={(e) => setData('base_url', e.target.value)}
                            placeholder="https://www.takealot.com"
                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            required
                        />
                        {errors.base_url && <p className="text-red-500 text-xs mt-1">{errors.base_url}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                Seller *
                            </label>
                            <select
                                value={data.seller_id}
                                onChange={(e) => setData('seller_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                required
                            >
                                <option value="">Select a seller...</option>
                                {sellers?.map((seller) => (
                                    <option key={seller.id} value={seller.id}>
                                        {seller.shop_name} ({seller.slug})
                                    </option>
                                ))}
                            </select>
                            {errors.seller_id && <p className="text-red-500 text-xs mt-1">{errors.seller_id}</p>}
                            <p className="text-xs text-body mt-1">Products will be assigned to this seller</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                Default Currency *
                            </label>
                            <select
                                value={data.default_currency_id}
                                onChange={(e) => setData('default_currency_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                required
                            >
                                <option value="">Select a currency...</option>
                                {currencies?.map((currency) => (
                                    <option key={currency.id} value={currency.id}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                            {errors.default_currency_id && <p className="text-red-500 text-xs mt-1">{errors.default_currency_id}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                Default Category
                            </label>
                            <select
                                value={data.default_category_id}
                                onChange={(e) => setData('default_category_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            >
                                <option value="">None (use scraped category)</option>
                                {categories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-body mt-1">Fallback if scraped category not found</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                Schedule (Cron Expression)
                            </label>
                            <input
                                type="text"
                                value={data.schedule}
                                onChange={(e) => setData('schedule', e.target.value)}
                                placeholder="0 2 * * * (daily at 2am)"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            />
                            <p className="text-xs text-body mt-1">Leave empty for manual-only scraping</p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            <span className="text-sm text-heading dark:text-white">Active</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.auto_publish}
                                onChange={(e) => setData('auto_publish', e.target.checked)}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            <span className="text-sm text-heading dark:text-white">Auto-Publish Products</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t dark:border-white/10">
                        <Link
                            href={route('admin.scraping.index')}
                            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-center transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Source'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

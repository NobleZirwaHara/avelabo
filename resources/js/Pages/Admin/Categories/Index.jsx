import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Index({ categories, filters, stats }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [expandedCategories, setExpandedCategories] = useState({});

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.categories.index'), { search }, { preserveState: true });
    };

    const handleFilterChange = (key, value) => {
        router.get(route('admin.categories.index'), { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const handleDelete = (category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(route('admin.categories.destroy', category.id));
        }
    };

    const toggleStatus = (category) => {
        router.patch(route('admin.categories.toggle-status', category.id));
    };

    const toggleFeatured = (category) => {
        router.patch(route('admin.categories.toggle-featured', category.id));
    };

    const toggleExpand = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const CategoryRow = ({ category, level = 0 }) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories[category.id];

        return (
            <>
                <tr className="hover:bg-gray-50 dark:hover:bg-dark-body/50">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
                            {hasChildren && (
                                <button
                                    onClick={() => toggleExpand(category.id)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-dark-body rounded"
                                >
                                    <span className="material-icons text-sm">
                                        {isExpanded ? 'expand_more' : 'chevron_right'}
                                    </span>
                                </button>
                            )}
                            {!hasChildren && level > 0 && <div className="w-7" />}
                            {category.image ? (
                                <img
                                    src={`/storage/${category.image}`}
                                    alt={category.name}
                                    className="w-10 h-10 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-100 dark:bg-dark-body rounded-lg flex items-center justify-center">
                                    <span className="material-icons text-gray-400">category</span>
                                </div>
                            )}
                            <div>
                                <Link
                                    href={route('admin.categories.show', category.id)}
                                    className="font-medium text-heading dark:text-white hover:text-brand"
                                >
                                    {category.name}
                                </Link>
                                {category.description && (
                                    <p className="text-sm text-body truncate max-w-xs">{category.description}</p>
                                )}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-body">
                        {category.products_count || 0} products
                    </td>
                    <td className="px-6 py-4">
                        <button
                            onClick={() => toggleStatus(category)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {category.is_active ? 'Active' : 'Inactive'}
                        </button>
                    </td>
                    <td className="px-6 py-4">
                        <button
                            onClick={() => toggleFeatured(category)}
                            className={`p-1 rounded ${
                                category.is_featured
                                    ? 'text-yellow-500'
                                    : 'text-gray-300 hover:text-yellow-500'
                            }`}
                            title={category.is_featured ? 'Featured' : 'Not featured'}
                        >
                            <span className="material-icons">
                                {category.is_featured ? 'star' : 'star_outline'}
                            </span>
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Link
                                href={route('admin.categories.edit', category.id)}
                                className="p-2 text-gray-500 hover:text-brand hover:bg-gray-100 dark:hover:bg-dark-body rounded-lg transition-colors"
                                title="Edit"
                            >
                                <span className="material-icons text-lg">edit</span>
                            </Link>
                            <button
                                onClick={() => handleDelete(category)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <span className="material-icons text-lg">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
                {hasChildren && isExpanded && category.children.map(child => (
                    <CategoryRow key={child.id} category={child} level={level + 1} />
                ))}
            </>
        );
    };

    return (
        <AdminLayout>
            <Head title="Categories" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Categories</h2>
                        <p className="text-body">Manage product categories and subcategories</p>
                    </div>
                    <Link
                        href={route('admin.categories.create')}
                        className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2 mt-4 md:mt-0"
                    >
                        <span className="material-icons text-lg">add</span>
                        Add Category
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-body">Total Categories</p>
                        <p className="text-2xl font-bold text-heading dark:text-white">{stats?.total || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-body">Root Categories</p>
                        <p className="text-2xl font-bold text-heading dark:text-white">{stats?.root || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-green-600">Active</p>
                        <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-yellow-600">Featured</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats?.featured || 0}</p>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card">
                    <div className="p-5 border-b dark:border-white/10">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="relative">
                                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </form>
                            {/* Status Filter */}
                            <select
                                className="px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                value={filters?.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Categories Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-dark-body">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/10">
                                {categories?.data?.length > 0 ? (
                                    categories.data.map((category) => (
                                        <CategoryRow key={category.id} category={category} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <span className="material-icons text-5xl text-gray-300 mb-4">category</span>
                                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No categories found</h3>
                                            <p className="text-body mb-6">Get started by creating your first category.</p>
                                            <Link
                                                href={route('admin.categories.create')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium text-sm transition-colors"
                                            >
                                                <span className="material-icons text-lg">add</span>
                                                Add Category
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {categories?.last_page > 1 && (
                        <div className="px-6 py-4 border-t dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-body">
                                    Showing {categories.from} to {categories.to} of {categories.total} categories
                                </p>
                                <div className="flex gap-2">
                                    {categories.links.map((link, index) => (
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
                </div>
            </div>
        </AdminLayout>
    );
}

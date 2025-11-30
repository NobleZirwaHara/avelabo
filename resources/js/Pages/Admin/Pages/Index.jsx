import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function PagesIndex({ pages, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.pages.index'), { search }, { preserveState: true });
    };

    const handleDelete = (page) => {
        if (confirm(`Are you sure you want to delete "${page.title}"?`)) {
            router.delete(route('admin.pages.destroy', page.id));
        }
    };

    const handleToggleActive = (page) => {
        router.put(route('admin.pages.update', page.id), {
            ...page,
            is_active: !page.is_active,
        }, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Page Content Management" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Page Content</h2>
                    <p className="text-gray-500 text-sm">Manage static page content for your site</p>
                </div>
                <Link
                    href={route('admin.pages.create')}
                    className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <span className="material-icons text-lg">add</span>
                    Add New Page
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search pages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <span className="material-icons">search</span>
                    </button>
                </form>
            </div>

            {/* Pages Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {pages?.data?.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Page
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Slug
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Last Updated
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pages.data.map((page) => (
                                        <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{page.title}</p>
                                                    {page.meta_title && (
                                                        <p className="text-sm text-gray-500">{page.meta_title}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded">
                                                    {page.page_slug}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleActive(page)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        page.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {page.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(page.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('admin.pages.edit', page.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-icons text-lg">edit</span>
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(page)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-icons text-lg">delete</span>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pages.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Showing {pages.from} to {pages.to} of {pages.total} pages
                                    </p>
                                    <div className="flex gap-2">
                                        {pages.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded text-sm ${
                                                    link.active
                                                        ? 'bg-brand text-white'
                                                        : link.url
                                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pages found</h3>
                        <p className="text-gray-500 mb-4">
                            {search ? 'No pages match your search.' : 'Get started by creating your first page.'}
                        </p>
                        <Link
                            href={route('admin.pages.create')}
                            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <span className="material-icons text-lg">add</span>
                            Create Page
                        </Link>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Index({ products, filters, categories, sellers, stats }) {
    const [selectAll, setSelectAll] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [search, setSearch] = useState(filters?.search || '');

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            draft: 'bg-yellow-100 text-yellow-700',
            inactive: 'bg-gray-100 text-gray-600',
        };
        return styles[status] || 'bg-gray-100 text-gray-600';
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(products.data.map(p => p.id));
        }
        setSelectAll(!selectAll);
    };

    const toggleItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.products.index'), { search }, { preserveState: true });
    };

    const handleFilterChange = (key, value) => {
        router.get(route('admin.products.index'), { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const handleDelete = (product) => {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            router.delete(route('admin.products.destroy', product.id));
        }
    };

    const handleBulkAction = (action) => {
        if (selectedItems.length === 0) {
            alert('Please select at least one product');
            return;
        }

        if (action === 'delete') {
            if (confirm(`Are you sure you want to delete ${selectedItems.length} products?`)) {
                router.post(route('admin.products.bulk-delete'), { ids: selectedItems });
                setSelectedItems([]);
                setSelectAll(false);
            }
        } else if (['active', 'inactive', 'draft'].includes(action)) {
            router.post(route('admin.products.bulk-status'), { ids: selectedItems, status: action });
            setSelectedItems([]);
            setSelectAll(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <AdminLayout>
            <Head title="Products" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Products</h2>
                        <p className="text-body">Manage all products across sellers</p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <Link
                            href={route('admin.products.create')}
                            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                        >
                            <span className="material-icons text-lg">add</span>
                            Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-body">Total</p>
                        <p className="text-2xl font-bold text-heading dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-green-600">Active</p>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-yellow-600">Draft</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-gray-500">Inactive</p>
                        <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-orange-600">Low Stock</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.low_stock}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-red-600">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">{stats.out_of_stock}</p>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card">
                    <div className="p-5 border-b dark:border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Search */}
                            <div className="md:col-span-4">
                                <form onSubmit={handleSearch}>
                                    <div className="relative">
                                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </form>
                            </div>
                            {/* Category Filter */}
                            <div className="md:col-span-2">
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    value={filters?.category_id || ''}
                                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories?.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Seller Filter */}
                            <div className="md:col-span-2">
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    value={filters?.seller_id || ''}
                                    onChange={(e) => handleFilterChange('seller_id', e.target.value)}
                                >
                                    <option value="">All Sellers</option>
                                    {sellers?.map((seller) => (
                                        <option key={seller.id} value={seller.id}>{seller.shop_name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Status Filter */}
                            <div className="md:col-span-2">
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    value={filters?.status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            {/* Stock Filter */}
                            <div className="md:col-span-2">
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    value={filters?.stock || ''}
                                    onChange={(e) => handleFilterChange('stock', e.target.value)}
                                >
                                    <option value="">All Stock</option>
                                    <option value="low">Low Stock</option>
                                    <option value="out">Out of Stock</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedItems.length > 0 && (
                        <div className="px-5 py-3 bg-gray-50 dark:bg-dark-body border-b dark:border-white/10 flex items-center gap-4">
                            <span className="text-sm text-body">{selectedItems.length} selected</span>
                            <button
                                onClick={() => handleBulkAction('active')}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                            >
                                Set Active
                            </button>
                            <button
                                onClick={() => handleBulkAction('draft')}
                                className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200"
                            >
                                Set Draft
                            </button>
                            <button
                                onClick={() => handleBulkAction('inactive')}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                            >
                                Set Inactive
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete')}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    )}

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-dark-body">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/10">
                                {products?.data?.length > 0 ? (
                                    products.data.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-body/50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(product.id)}
                                                    onChange={() => toggleItem(product.id)}
                                                    className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-dark-body rounded-lg overflow-hidden flex-shrink-0">
                                                        {product.primary_image ? (
                                                            <img
                                                                src={`/storage/${product.primary_image}`}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="material-icons text-gray-400">image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={route('admin.products.show', product.id)}
                                                            className="font-medium text-heading dark:text-white hover:text-brand"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                        <p className="text-sm text-body">{product.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-body">
                                                {product.seller?.shop_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-body">
                                                {product.category?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-heading dark:text-white">
                                                {formatCurrency(product.base_price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    product.stock_quantity === 0
                                                        ? 'bg-red-100 text-red-700'
                                                        : product.stock_quantity <= product.low_stock_threshold
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {product.stock_quantity} units
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(product.status)}`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('admin.products.edit', product.id)}
                                                        className="p-2 text-gray-500 hover:text-brand hover:bg-gray-100 dark:hover:bg-dark-body rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <span className="material-icons text-lg">edit</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <span className="material-icons text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <span className="material-icons text-5xl text-gray-300 mb-4">inventory_2</span>
                                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No products found</h3>
                                            <p className="text-body mb-6">Try adjusting your filters or add a new product.</p>
                                            <Link
                                                href={route('admin.products.create')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium text-sm transition-colors"
                                            >
                                                <span className="material-icons text-lg">add</span>
                                                Add Product
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products?.last_page > 1 && (
                        <div className="px-6 py-4 border-t dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-body">
                                    Showing {products.from} to {products.to} of {products.total} products
                                </p>
                                <div className="flex gap-2">
                                    {products.links.map((link, index) => (
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

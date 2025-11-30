import { Head, Link, router } from '@inertiajs/react';
import SellerLayout from '@/Layouts/SellerLayout';
import { useState } from 'react';

export default function OrdersIndex({ orders, stats, filters }) {
    const [status, setStatus] = useState(filters?.status || '');
    const [search, setSearch] = useState(filters?.search || '');

    const handleFilter = (newStatus) => {
        setStatus(newStatus);
        router.get(route('seller.orders.index'), { status: newStatus, search }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('seller.orders.index'), { status, search }, { preserveState: true });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getItemStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            shipped: 'bg-purple-100 text-purple-700',
            delivered: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const statusTabs = [
        { value: '', label: 'All', count: null },
        { value: 'pending', label: 'Pending', count: stats?.pending },
        { value: 'processing', label: 'Processing', count: stats?.processing },
        { value: 'shipped', label: 'Shipped', count: stats?.shipped },
        { value: 'delivered', label: 'Delivered', count: stats?.delivered },
    ];

    return (
        <SellerLayout title="Orders">
            <Head title="Orders" />

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h2>
                <p className="text-gray-500 text-sm">Manage and fulfill your customer orders</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats?.pending || 0}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400">Processing</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats?.processing || 0}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-400">Shipped</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats?.shipped || 0}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400">Delivered</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats?.delivered || 0}</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2 mb-6">
                <div className="flex flex-wrap gap-2">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleFilter(tab.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                status === tab.value
                                    ? 'bg-brand text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    status === tab.value
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Search by order number or customer name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {orders?.data?.length > 0 ? (
                    <>
                        {orders.data.map((order) => (
                            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Order Header */}
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500">Order</span>
                                            <p className="font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Customer</span>
                                            <p className="text-gray-900 dark:text-white">{order.customer_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Date</span>
                                            <p className="text-gray-900 dark:text-white">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-brand text-lg">
                                        {formatCurrency(order.seller_total)}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {order.items?.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.product_image ? (
                                                    <img
                                                        src={`/storage/${item.product_image}`}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-icons text-gray-400">image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                                                {item.variant_name && (
                                                    <p className="text-xs text-gray-500">{item.variant_name}</p>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Qty: {item.quantity}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(item.line_total)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getItemStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <Link
                                        href={route('seller.orders.show', order.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors"
                                    >
                                        <span className="material-icons text-lg">visibility</span>
                                        Manage Order
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Showing {orders.from} to {orders.to} of {orders.total} orders
                                    </p>
                                    <div className="flex gap-2">
                                        {orders.links.map((link, index) => (
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
                        <span className="material-icons text-5xl text-gray-300 mb-4">inbox</span>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                        <p className="text-gray-500">
                            {status ? `No ${status} orders at the moment.` : 'You haven\'t received any orders yet.'}
                        </p>
                    </div>
                )}
            </div>
        </SellerLayout>
    );
}

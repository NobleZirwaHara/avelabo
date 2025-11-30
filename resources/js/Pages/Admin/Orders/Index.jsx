import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Index({ orders, stats, revenue, filters, statuses }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleFilter = () => {
        router.get(route('admin.orders.index'), {
            search: search || undefined,
            status: status || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.orders.index'));
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700',
            awaiting_payment: 'bg-orange-100 text-orange-700',
            processing: 'bg-blue-100 text-blue-700',
            partially_shipped: 'bg-indigo-100 text-indigo-700',
            shipped: 'bg-purple-100 text-purple-700',
            delivered: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            refunded: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            paid: 'text-green-600',
            pending: 'text-yellow-600',
            failed: 'text-red-600',
        };
        return colors[status] || 'text-gray-600';
    };

    return (
        <AdminLayout>
            <Head title="Orders" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Orders</h2>
                        <p className="text-body">Manage and track all customer orders</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card">
                        <p className="text-sm text-body">Total Orders</p>
                        <p className="text-2xl font-bold text-heading dark:text-white">{stats?.total || 0}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending</p>
                        <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats?.pending || 0}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-400">Processing</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats?.processing || 0}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                        <p className="text-sm text-purple-700 dark:text-purple-400">Shipped</p>
                        <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats?.shipped || 0}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <p className="text-sm text-green-700 dark:text-green-400">Delivered</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats?.delivered || 0}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                        <p className="text-sm text-red-700 dark:text-red-400">Cancelled</p>
                        <p className="text-2xl font-bold text-red-800 dark:text-red-300">{stats?.cancelled || 0}</p>
                    </div>
                </div>

                {/* Revenue Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-brand to-brand-dark rounded-xl p-6 text-white">
                        <p className="text-sm opacity-90">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(revenue?.total)}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-card">
                        <p className="text-sm text-body">Today's Revenue</p>
                        <p className="text-2xl font-bold text-heading dark:text-white mt-1">{formatCurrency(revenue?.today)}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-card">
                        <p className="text-sm text-body">This Month</p>
                        <p className="text-2xl font-bold text-heading dark:text-white mt-1">{formatCurrency(revenue?.this_month)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Search by order number or customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            />
                        </div>
                        <div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            >
                                <option value="">All Statuses</option>
                                {statuses && Object.entries(statuses).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="From"
                                className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="To"
                                className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFilter}
                                className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Filter
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-dark-body hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden">
                    {orders?.data?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-dark-body">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Order</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Customer</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Items</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Total</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Revenue</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Status</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Payment</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-body uppercase">Date</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-body uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-white/10">
                                        {orders.data.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-heading dark:text-white">{order.order_number}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium text-heading dark:text-white">{order.user?.name}</p>
                                                        <p className="text-xs text-body">{order.user?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {order.items?.length || 0} items
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-heading dark:text-white">{formatCurrency(order.total)}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-sm text-green-600">{formatCurrency(order.revenue?.platform_revenue)}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                        {statuses?.[order.status] || order.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-sm font-medium capitalize ${getPaymentStatusColor(order.payment?.status)}`}>
                                                        {order.payment?.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-body">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link
                                                        href={route('admin.orders.show', order.id)}
                                                        className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded text-xs font-medium transition-colors"
                                                    >
                                                        View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {orders.last_page > 1 && (
                                <div className="px-6 py-4 border-t dark:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-body">
                                            Showing {orders.from} to {orders.to} of {orders.total} orders
                                        </p>
                                        <div className="flex gap-1">
                                            {orders.links.map((link, index) => (
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
                            <span className="material-icons text-5xl text-gray-300 mb-4">inbox</span>
                            <h3 className="text-lg font-medium text-heading dark:text-white mb-2">No orders found</h3>
                            <p className="text-body">
                                {(search || status || dateFrom || dateTo)
                                    ? 'Try adjusting your filters to find orders.'
                                    : 'Orders will appear here once customers place them.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

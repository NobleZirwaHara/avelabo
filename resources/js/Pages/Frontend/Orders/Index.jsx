import { Head, Link, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function OrdersIndex({ orders, filters, statuses }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-MW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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

    const handleFilterChange = (status) => {
        router.get(route('customer.orders.index'), {
            status: status || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <FrontendLayout>
            <Head title="My Orders" />

            <div className="max-w-container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-heading font-quicksand">My Orders</h1>
                    <p className="text-muted mt-1">View and track your order history</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-border p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleFilterChange('')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !filters.status
                                    ? 'bg-brand text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Orders
                        </button>
                        {Object.entries(statuses).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => handleFilterChange(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filters.status === key
                                        ? 'bg-brand text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                {orders.data.length > 0 ? (
                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-border overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                            <span className="text-sm text-muted">Order</span>
                                            <p className="font-semibold text-heading">{order.order_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted">Date</span>
                                            <p className="text-heading">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted">Items</span>
                                            <p className="text-heading">{order.items_count || order.items?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {statuses[order.status] || order.status}
                                        </span>
                                        <span className="font-bold text-brand text-lg">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="px-6 py-4">
                                    <div className="flex flex-wrap gap-3">
                                        {order.items?.slice(0, 4).map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 pr-4">
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.product_image ? (
                                                        <img
                                                            src={`/storage/${item.product_image}`}
                                                            alt={item.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <i className="fi-rs-picture text-lg"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-heading truncate max-w-[150px]">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {order.items?.length > 4 && (
                                            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-muted text-sm font-medium">
                                                +{order.items.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Actions */}
                                <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        {order.items?.some(item => item.tracking_number) && (
                                            <span className="text-sm text-muted">
                                                <i className="fi-rs-truck-side mr-1"></i>
                                                Tracking available
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        {['pending', 'awaiting_payment'].includes(order.status) && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to cancel this order?')) {
                                                        router.post(route('customer.orders.cancel', order.id));
                                                    }
                                                }}
                                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                        <Link
                                            href={route('customer.orders.show', order.id)}
                                            className="px-4 py-2 text-sm bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-border p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fi-rs-shopping-bag text-4xl text-gray-400"></i>
                        </div>
                        <h3 className="text-xl font-bold text-heading mb-2">No orders yet</h3>
                        <p className="text-muted mb-6">
                            {filters.status
                                ? `No ${statuses[filters.status]?.toLowerCase() || filters.status} orders found.`
                                : "You haven't placed any orders yet. Start shopping to see your orders here."}
                        </p>
                        <Link
                            href={route('shop')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                        >
                            Start Shopping
                            <i className="fi-rs-arrow-right"></i>
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex gap-2">
                            {orders.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-brand text-white'
                                            : link.url
                                            ? 'bg-white border border-border text-heading hover:bg-gray-50'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveScroll
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </FrontendLayout>
    );
}

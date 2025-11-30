import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Show({ order, statuses, itemStatuses }) {
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const { data, setData, patch, processing } = useForm({
        type: 'order',
        status: '',
        item_id: null,
        comment: '',
        tracking_number: '',
        tracking_carrier: '',
        notify_customer: true,
    });

    const refundForm = useForm({
        amount: 0,
        reason: '',
        refund_type: 'full',
        items: [],
    });

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
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

    const handleOrderStatusChange = () => {
        if (!data.status) return;
        patch(route('admin.orders.update-status', order.id), {
            preserveScroll: true,
            onSuccess: () => {
                setData({ ...data, status: '', comment: '' });
            },
        });
    };

    const handleItemStatusClick = (item) => {
        setCurrentItem(item);
        setData({
            type: 'item',
            item_id: item.id,
            status: '',
            comment: '',
            tracking_number: '',
            tracking_carrier: '',
            notify_customer: true,
        });
        setShowItemModal(true);
    };

    const handleItemStatusSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.orders.update-status', order.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowItemModal(false);
                setCurrentItem(null);
            },
        });
    };

    const handleRefundSubmit = (e) => {
        e.preventDefault();
        router.post(route('admin.orders.refund', order.id), refundForm.data, {
            preserveScroll: true,
            onSuccess: () => {
                setShowRefundModal(false);
                refundForm.reset();
            },
        });
    };

    // Group items by seller
    const itemsBySeller = order?.items?.reduce((acc, item) => {
        const sellerId = item.seller_id || 'unknown';
        const sellerName = item.seller_name || 'Unknown Seller';
        if (!acc[sellerId]) {
            acc[sellerId] = { seller_name: sellerName, items: [] };
        }
        acc[sellerId].items.push(item);
        return acc;
    }, {}) || {};

    return (
        <AdminLayout>
            <Head title={`Order ${order?.order_number}`} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.orders.index')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="material-icons text-gray-500">arrow_back</span>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold text-heading dark:text-white">{order?.order_number}</h2>
                            <p className="text-body">{formatDate(order?.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order?.status)}`}>
                            {statuses?.[order?.status] || order?.status}
                        </span>
                        {!['cancelled', 'refunded'].includes(order?.status) && (
                            <button
                                onClick={() => setShowRefundModal(true)}
                                className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                            >
                                Process Refund
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Status Change */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                            <h3 className="font-semibold text-heading dark:text-white mb-4">Update Order Status</h3>
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                >
                                    <option value="">Select new status...</option>
                                    {statuses && Object.entries(statuses).map(([key, label]) => (
                                        <option key={key} value={key} disabled={key === order?.status}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Add comment (optional)"
                                    value={data.comment}
                                    onChange={(e) => setData('comment', e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                                <button
                                    onClick={handleOrderStatusChange}
                                    disabled={processing || !data.status}
                                    className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>

                        {/* Items by Seller */}
                        {Object.entries(itemsBySeller).map(([sellerId, { seller_name, items }]) => (
                            <div key={sellerId} className="bg-white dark:bg-dark-card rounded-xl shadow-card overflow-hidden">
                                <div className="px-5 py-3 bg-gray-50 dark:bg-dark-body border-b dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-brand text-lg">store</span>
                                        <span className="font-medium text-heading dark:text-white">{seller_name}</span>
                                    </div>
                                    <span className="text-sm text-body">{items.length} items</span>
                                </div>
                                <div className="divide-y dark:divide-white/10">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-body rounded-lg overflow-hidden flex-shrink-0">
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
                                                    <h4 className="font-medium text-heading dark:text-white">{item.product_name}</h4>
                                                    {item.variant_name && (
                                                        <p className="text-sm text-body">{item.variant_name}</p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                                                        <span className="text-body">Qty: {item.quantity}</span>
                                                        <span className="text-body">Base: {formatCurrency(item.base_price)}</span>
                                                        <span className="text-green-600">Markup: {formatCurrency(item.markup_amount)}</span>
                                                        <span className="font-medium">Display: {formatCurrency(item.display_price)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-heading dark:text-white">{formatCurrency(item.line_total)}</p>
                                                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tracking info */}
                                            {item.tracking_number && (
                                                <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-body rounded-lg text-sm">
                                                    <span className="material-icons text-sm text-body mr-1 align-middle">local_shipping</span>
                                                    {item.tracking_carrier && <span className="text-body">{item.tracking_carrier}: </span>}
                                                    <span className="text-heading dark:text-white font-medium">{item.tracking_number}</span>
                                                </div>
                                            )}

                                            {/* Update Item Status */}
                                            <div className="mt-3">
                                                <button
                                                    onClick={() => handleItemStatusClick(item)}
                                                    className="text-sm text-brand hover:text-brand-dark font-medium"
                                                >
                                                    Update Item Status
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Order Totals */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                            <h3 className="font-semibold text-heading dark:text-white mb-4">Order Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-body">Subtotal</span>
                                    <span className="text-heading dark:text-white">{formatCurrency(order?.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-body">Shipping</span>
                                    <span className="text-heading dark:text-white">
                                        {order?.shipping_amount === 0 ? 'Free' : formatCurrency(order?.shipping_amount)}
                                    </span>
                                </div>
                                {order?.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-body">Tax</span>
                                        <span className="text-heading dark:text-white">{formatCurrency(order?.tax_amount)}</span>
                                    </div>
                                )}
                                {order?.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order?.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t dark:border-white/10 pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-heading dark:text-white">Total</span>
                                        <span className="text-xl font-bold text-brand">{formatCurrency(order?.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Breakdown */}
                            {order?.revenue && (
                                <div className="mt-6 pt-4 border-t dark:border-white/10">
                                    <h4 className="font-medium text-heading dark:text-white mb-3">Revenue Breakdown</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-gray-50 dark:bg-dark-body rounded-lg">
                                            <p className="text-xs text-body mb-1">Seller Payout</p>
                                            <p className="font-semibold text-heading dark:text-white">{formatCurrency(order.revenue.seller_payout)}</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-xs text-green-700 mb-1">Platform Revenue</p>
                                            <p className="font-semibold text-green-700">{formatCurrency(order.revenue.platform_revenue)}</p>
                                        </div>
                                        <div className="text-center p-3 bg-brand/10 rounded-lg">
                                            <p className="text-xs text-brand mb-1">Total</p>
                                            <p className="font-semibold text-brand">{formatCurrency(order.revenue.total)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeline */}
                        {order?.timeline?.length > 0 && (
                            <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                                <h3 className="font-semibold text-heading dark:text-white mb-4">Order Timeline</h3>
                                <div className="space-y-4">
                                    {order.timeline.map((entry, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.status).replace('text-', 'bg-').replace('-100', '-500')}`}></div>
                                                {index < order.timeline.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="font-medium text-heading dark:text-white capitalize">{entry.status}</p>
                                                {entry.note && <p className="text-sm text-body mt-1">{entry.note}</p>}
                                                <p className="text-xs text-body mt-1">{formatDate(entry.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                            <h3 className="font-semibold text-heading dark:text-white mb-4">Customer</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                                    <span className="material-icons text-brand">person</span>
                                </div>
                                <div>
                                    <p className="font-medium text-heading dark:text-white">{order?.user?.name}</p>
                                    <p className="text-sm text-body">{order?.user?.email}</p>
                                </div>
                            </div>
                            {order?.user?.phone && (
                                <p className="text-sm text-body flex items-center gap-2">
                                    <span className="material-icons text-sm">phone</span>
                                    {order.user.phone}
                                </p>
                            )}
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                            <h3 className="font-semibold text-heading dark:text-white mb-4">Shipping Address</h3>
                            {order?.shipping_address ? (
                                <div className="text-sm text-body space-y-1">
                                    <p className="font-medium text-heading dark:text-white">{order.shipping_address.name}</p>
                                    <p>{order.shipping_address.address}</p>
                                    {order.shipping_address.phone && (
                                        <p className="flex items-center gap-1 mt-2">
                                            <span className="material-icons text-sm">phone</span>
                                            {order.shipping_address.phone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-body">No shipping address</p>
                            )}
                        </div>

                        {/* Billing Address */}
                        {order?.billing_address && (
                            <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                                <h3 className="font-semibold text-heading dark:text-white mb-4">Billing Address</h3>
                                <div className="text-sm text-body space-y-1">
                                    <p className="font-medium text-heading dark:text-white">{order.billing_address.name}</p>
                                    <p>{order.billing_address.address}</p>
                                </div>
                            </div>
                        )}

                        {/* Payment */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                            <h3 className="font-semibold text-heading dark:text-white mb-4">Payment</h3>
                            {order?.payment ? (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-body">Method</span>
                                        <span className="text-heading dark:text-white">{order.payment.gateway || order.payment.method}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-body">Status</span>
                                        <span className={`font-medium ${
                                            order.payment.status === 'paid' ? 'text-green-600' :
                                            order.payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {order.payment.status}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-body">No payment information</p>
                            )}
                        </div>

                        {/* Notes */}
                        {order?.notes && (
                            <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-5">
                                <h3 className="font-semibold text-heading dark:text-white mb-4">Order Notes</h3>
                                <p className="text-sm text-body">{order.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Item Status Modal */}
            {showItemModal && currentItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-dark-card rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-heading dark:text-white mb-4">Update Item Status</h3>
                        <p className="text-sm text-body mb-4">{currentItem.product_name}</p>
                        <form onSubmit={handleItemStatusSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">New Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    required
                                >
                                    <option value="">Select status...</option>
                                    {itemStatuses && Object.entries(itemStatuses).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {data.status === 'shipped' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">Tracking Number</label>
                                        <input
                                            type="text"
                                            value={data.tracking_number}
                                            onChange={(e) => setData('tracking_number', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-heading dark:text-white mb-2">Carrier</label>
                                        <input
                                            type="text"
                                            value={data.tracking_carrier}
                                            onChange={(e) => setData('tracking_carrier', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Comment</label>
                                <textarea
                                    value={data.comment}
                                    onChange={(e) => setData('comment', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowItemModal(false);
                                        setCurrentItem(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body text-body hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.status}
                                    className="flex-1 px-4 py-2.5 bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-dark-card rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-heading dark:text-white mb-4">Process Refund</h3>
                        <form onSubmit={handleRefundSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Refund Type</label>
                                <select
                                    value={refundForm.data.refund_type}
                                    onChange={(e) => {
                                        refundForm.setData('refund_type', e.target.value);
                                        if (e.target.value === 'full') {
                                            refundForm.setData('amount', order?.total || 0);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                >
                                    <option value="full">Full Refund ({formatCurrency(order?.total)})</option>
                                    <option value="partial">Partial Refund</option>
                                </select>
                            </div>

                            {refundForm.data.refund_type === 'partial' && (
                                <div>
                                    <label className="block text-sm font-medium text-heading dark:text-white mb-2">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={order?.total}
                                        value={refundForm.data.amount}
                                        onChange={(e) => refundForm.setData('amount', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Reason</label>
                                <textarea
                                    value={refundForm.data.reason}
                                    onChange={(e) => refundForm.setData('reason', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand resize-none"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRefundModal(false);
                                        refundForm.reset();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-body text-body hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={refundForm.processing}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {refundForm.processing ? 'Processing...' : 'Process Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

import { Head, Link, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function OrderShow({ order }) {
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-MW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            awaiting_payment: 'bg-orange-100 text-orange-700 border-orange-300',
            processing: 'bg-blue-100 text-blue-700 border-blue-300',
            partially_shipped: 'bg-indigo-100 text-indigo-700 border-indigo-300',
            shipped: 'bg-purple-100 text-purple-700 border-purple-300',
            delivered: 'bg-green-100 text-green-700 border-green-300',
            cancelled: 'bg-red-100 text-red-700 border-red-300',
            refunded: 'bg-gray-100 text-gray-700 border-gray-300',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const getItemStatusColor = (status) => {
        const colors = {
            pending: 'text-yellow-600',
            processing: 'text-blue-600',
            shipped: 'text-purple-600',
            delivered: 'text-green-600',
            cancelled: 'text-red-600',
        };
        return colors[status] || 'text-gray-600';
    };

    const statusLabels = {
        pending: 'Pending',
        awaiting_payment: 'Awaiting Payment',
        processing: 'Processing',
        partially_shipped: 'Partially Shipped',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        refunded: 'Refunded',
    };

    const itemStatusLabels = {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
    };

    // Group items by seller
    const itemsBySeller = order?.items?.reduce((acc, item) => {
        const sellerId = item.seller_id || 'unknown';
        const sellerName = item.seller?.business_name || item.seller_name || 'Unknown Seller';
        if (!acc[sellerId]) {
            acc[sellerId] = {
                seller_name: sellerName,
                items: [],
            };
        }
        acc[sellerId].items.push(item);
        return acc;
    }, {}) || {};

    const canCancel = ['pending', 'awaiting_payment'].includes(order?.status);

    return (
        <FrontendLayout>
            <Head title={`Order ${order?.order_number}`} />

            <div className="max-w-container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted mb-6">
                    <Link href={route('home')} className="hover:text-brand">Home</Link>
                    <i className="fi-rs-angle-right text-xs"></i>
                    <Link href={route('customer.orders.index')} className="hover:text-brand">My Orders</Link>
                    <i className="fi-rs-angle-right text-xs"></i>
                    <span className="text-heading">{order?.order_number}</span>
                </nav>

                {/* Order Header */}
                <div className="bg-white rounded-xl border border-border p-6 mb-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-heading font-quicksand">
                                Order {order?.order_number}
                            </h1>
                            <p className="text-muted mt-1">
                                Placed on {formatDate(order?.created_at)}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(order?.status)}`}>
                                {statusLabels[order?.status] || order?.status}
                            </span>
                            {canCancel && (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to cancel this order?')) {
                                            router.post(route('customer.orders.cancel', order?.id));
                                        }
                                    }}
                                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items by Seller */}
                        {Object.entries(itemsBySeller).map(([sellerId, { seller_name, items }]) => (
                            <div key={sellerId} className="bg-white rounded-xl border border-border overflow-hidden">
                                <div className="bg-gray-50 px-6 py-3 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <i className="fi-rs-shop text-brand"></i>
                                        <span className="font-medium text-heading">Sold by {seller_name}</span>
                                    </div>
                                </div>

                                <div className="divide-y divide-border">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-6">
                                            <div className="flex gap-4">
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.product_image ? (
                                                        <img
                                                            src={`/storage/${item.product_image}`}
                                                            alt={item.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <i className="fi-rs-picture text-2xl"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-semibold text-heading">
                                                                {item.product?.slug ? (
                                                                    <Link
                                                                        href={route('product.show', item.product.slug)}
                                                                        className="hover:text-brand"
                                                                    >
                                                                        {item.product_name}
                                                                    </Link>
                                                                ) : (
                                                                    item.product_name
                                                                )}
                                                            </h4>
                                                            {item.variant_name && (
                                                                <p className="text-sm text-muted">{item.variant_name}</p>
                                                            )}
                                                            {item.product_sku && (
                                                                <p className="text-xs text-muted mt-1">SKU: {item.product_sku}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-brand">{formatCurrency(item.line_total)}</p>
                                                            <p className="text-sm text-muted">
                                                                {formatCurrency(item.display_price)} x {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Item Status */}
                                                    <div className="mt-3 flex flex-wrap items-center gap-4">
                                                        <span className={`text-sm font-medium ${getItemStatusColor(item.status)}`}>
                                                            <i className="fi-rs-box mr-1"></i>
                                                            {itemStatusLabels[item.status] || item.status}
                                                        </span>

                                                        {item.tracking_number && (
                                                            <span className="text-sm text-muted">
                                                                <i className="fi-rs-truck-side mr-1"></i>
                                                                {item.tracking_carrier && `${item.tracking_carrier}: `}
                                                                {item.tracking_number}
                                                            </span>
                                                        )}

                                                        {item.shipped_at && (
                                                            <span className="text-sm text-muted">
                                                                Shipped: {formatShortDate(item.shipped_at)}
                                                            </span>
                                                        )}

                                                        {item.delivered_at && (
                                                            <span className="text-sm text-green-600">
                                                                Delivered: {formatShortDate(item.delivered_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Order Notes */}
                        {order?.notes && (
                            <div className="bg-white rounded-xl border border-border p-6">
                                <h3 className="font-bold text-heading mb-3">
                                    <i className="fi-rs-document mr-2"></i>
                                    Order Notes
                                </h3>
                                <p className="text-muted">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-bold text-heading mb-4">Order Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Subtotal</span>
                                    <span>{formatCurrency(order?.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Shipping</span>
                                    <span>{order?.shipping_amount === 0 ? 'Free' : formatCurrency(order?.shipping_amount)}</span>
                                </div>
                                {order?.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted">Tax</span>
                                        <span>{formatCurrency(order?.tax_amount)}</span>
                                    </div>
                                )}
                                {order?.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order?.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-border pt-3">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-brand">{formatCurrency(order?.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-bold text-heading mb-4">Payment Information</h3>
                            {order?.payment ? (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Method</span>
                                        <span>{order.payment.gateway?.name || order.payment.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Status</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            order.payment.status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {order.payment.status}
                                        </span>
                                    </div>
                                    {order.payment.paid_at && (
                                        <div className="flex justify-between">
                                            <span className="text-muted">Paid On</span>
                                            <span>{formatShortDate(order.payment.paid_at)}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted text-sm">No payment information available</p>
                            )}
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-bold text-heading mb-4">Shipping Address</h3>
                            {order?.shipping_address ? (
                                <div className="text-sm space-y-1">
                                    <p className="font-semibold">{order.shipping_address.name}</p>
                                    <p className="text-muted">{order.shipping_address.address}</p>
                                    {order.shipping_address.phone && (
                                        <p className="text-muted mt-2">
                                            <i className="fi-rs-phone-call mr-1"></i>
                                            {order.shipping_address.phone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted text-sm">No shipping address</p>
                            )}
                        </div>

                        {/* Billing Address */}
                        {order?.billing_address && (
                            <div className="bg-white rounded-xl border border-border p-6">
                                <h3 className="font-bold text-heading mb-4">Billing Address</h3>
                                <div className="text-sm space-y-1">
                                    <p className="font-semibold">{order.billing_address.name}</p>
                                    <p className="text-muted">{order.billing_address.address}</p>
                                    {order.billing_address.phone && (
                                        <p className="text-muted mt-2">
                                            <i className="fi-rs-phone-call mr-1"></i>
                                            {order.billing_address.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Need Help */}
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                            <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
                            <p className="text-blue-700 text-sm mb-4">
                                If you have any questions about your order, please contact our support team.
                            </p>
                            <Link
                                href={route('contact')}
                                className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
                            >
                                <i className="fi-rs-headset"></i>
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8">
                    <Link
                        href={route('customer.orders.index')}
                        className="inline-flex items-center gap-2 text-brand hover:text-brand-dark font-medium"
                    >
                        <i className="fi-rs-arrow-left"></i>
                        Back to My Orders
                    </Link>
                </div>
            </div>
        </FrontendLayout>
    );
}

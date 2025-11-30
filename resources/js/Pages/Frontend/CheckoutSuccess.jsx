import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function CheckoutSuccess({ order }) {
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

    return (
        <FrontendLayout>
            <Head title="Order Confirmed" />

            <div className="max-w-container mx-auto px-4 py-12">
                {/* Success Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fi-rs-check text-4xl text-green-600"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-heading font-quicksand mb-3">
                        Thank you for your order!
                    </h1>
                    <p className="text-body">
                        Your order <span className="font-semibold text-brand">{order?.order_number}</span> has been placed successfully.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Order Details */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="text-lg font-bold text-heading mb-4">Order Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">Order Number:</span>
                                    <span className="font-semibold">{order?.order_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Order Date:</span>
                                    <span>{formatDate(order?.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Status:</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium capitalize">
                                        {order?.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Payment Status:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        order?.payment?.status === 'paid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {order?.payment?.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="text-lg font-bold text-heading mb-4">Shipping Address</h3>
                            {order?.shipping_address ? (
                                <div className="text-sm">
                                    <p className="font-semibold mb-1">{order.shipping_address.name}</p>
                                    <p className="text-muted">{order.shipping_address.address}</p>
                                    {order.shipping_address.phone && (
                                        <p className="text-muted mt-2">
                                            <i className="fi-rs-phone-call mr-1"></i>
                                            {order.shipping_address.phone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted text-sm">No shipping address provided</p>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl border border-border p-6 mt-8">
                        <h3 className="text-lg font-bold text-heading mb-4">Order Items</h3>
                        <div className="space-y-4">
                            {order?.items?.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.product_image ? (
                                            <img
                                                src={`/storage/${item.product_image}`}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <i className="fi-rs-picture text-xl"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h6 className="font-semibold text-heading mb-1">{item.product_name}</h6>
                                        {item.variant_name && (
                                            <p className="text-xs text-muted">{item.variant_name}</p>
                                        )}
                                        {item.seller_name && (
                                            <p className="text-xs text-muted">Sold by: {item.seller_name}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted">Qty: {item.quantity}</p>
                                        <p className="font-bold text-brand">{formatCurrency(item.line_total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Totals */}
                        <div className="border-t border-border pt-4 mt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Subtotal</span>
                                    <span>{formatCurrency(order?.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Shipping</span>
                                    <span>{order?.shipping_amount === 0 ? 'Free' : formatCurrency(order?.shipping_amount)}</span>
                                </div>
                                {order?.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order?.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                    <span>Total</span>
                                    <span className="text-brand">{formatCurrency(order?.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                        <Link
                            href={route('customer.orders.show', order?.id)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                        >
                            <i className="fi-rs-document"></i>
                            Track Order
                        </Link>
                        <Link
                            href={route('shop')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-lg font-semibold transition-colors"
                        >
                            Continue Shopping
                            <i className="fi-rs-arrow-right"></i>
                        </Link>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8 text-center">
                        <p className="text-blue-700 text-sm">
                            <i className="fi-rs-info mr-2"></i>
                            A confirmation email has been sent to your email address. If you have any questions, please contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function CheckoutCancel({ order_number, message }) {
    return (
        <FrontendLayout>
            <Head title="Payment Cancelled" />

            <div className="max-w-container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Cancel Icon */}
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fi-rs-cross text-4xl text-red-600"></i>
                    </div>

                    <h1 className="text-3xl font-bold text-heading font-quicksand mb-3">
                        Payment Cancelled
                    </h1>

                    {order_number && (
                        <p className="text-body mb-4">
                            Order: <span className="font-semibold">{order_number}</span>
                        </p>
                    )}

                    <p className="text-muted mb-8">
                        {message || 'Your payment was cancelled. You can try again or contact our support team for assistance.'}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={route('cart')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                        >
                            <i className="fi-rs-shopping-cart"></i>
                            Return to Cart
                        </Link>
                        <Link
                            href={route('shop')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-lg font-semibold transition-colors"
                        >
                            Continue Shopping
                            <i className="fi-rs-arrow-right"></i>
                        </Link>
                    </div>

                    {/* Help Box */}
                    <div className="bg-gray-50 border border-border rounded-lg p-6 mt-8">
                        <h3 className="font-semibold text-heading mb-2">Need Help?</h3>
                        <p className="text-muted text-sm mb-4">
                            If you're experiencing issues with payment, please don't hesitate to contact us.
                        </p>
                        <Link
                            href={route('contact')}
                            className="text-brand hover:text-brand-dark font-semibold text-sm"
                        >
                            Contact Support <i className="fi-rs-arrow-right ml-1"></i>
                        </Link>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}

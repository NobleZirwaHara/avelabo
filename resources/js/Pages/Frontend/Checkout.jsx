import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Checkout({ cart, paymentGateways = [], countries = [], savedAddresses = [], user }) {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showShippingAddress, setShowShippingAddress] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const { data, setData, post, processing, errors } = useForm({
        billing: {
            first_name: user?.name?.split(' ')[0] || '',
            last_name: user?.name?.split(' ').slice(1).join(' ') || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country_id: '',
        },
        shipping: {
            same_as_billing: true,
            first_name: '',
            last_name: '',
            phone: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country_id: '',
        },
        payment_gateway_id: paymentGateways[0]?.id || '',
        notes: '',
        create_account: false,
    });

    const loginForm = useForm({
        email: '',
        password: '',
    });

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        loginForm.post(route('login'), {
            onSuccess: () => {
                router.reload();
            },
        });
    };

    const handleCheckoutSubmit = (e) => {
        e.preventDefault();
        post(route('checkout.process'));
    };

    const handleBillingChange = (field, value) => {
        setData('billing', { ...data.billing, [field]: value });
    };

    const handleShippingChange = (field, value) => {
        setData('shipping', { ...data.shipping, [field]: value });
    };

    const handleShippingSameAsBilling = (checked) => {
        setData('shipping', { ...data.shipping, same_as_billing: checked });
        setShowShippingAddress(!checked);
    };

    const items = cart?.items || [];
    const itemCount = cart?.item_count || 0;

    return (
        <FrontendLayout>
            <Head title="Checkout" />

            {/* Breadcrumb */}
            <div className="bg-grey-9 py-4">
                <div className="max-w-container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-brand hover:text-brand-dark flex items-center gap-1">
                            <i className="fi-rs-home"></i> Home
                        </Link>
                        <span className="text-muted">-</span>
                        <Link href={route('cart')} className="text-muted hover:text-brand">Cart</Link>
                        <span className="text-muted">-</span>
                        <span className="text-body">Checkout</span>
                    </div>
                </div>
            </div>

            {/* Checkout Section */}
            <section className="py-12">
                <div className="max-w-container mx-auto px-4">
                    {/* Page Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-heading font-quicksand mb-2">Checkout</h1>
                        <p className="text-body">
                            There are <span className="text-brand font-semibold">{itemCount}</span> products in your cart
                        </p>
                    </div>

                    {/* Error Display */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="text-red-700 font-semibold mb-2">Please fix the following errors:</h4>
                            <ul className="list-disc list-inside text-red-600 text-sm">
                                {Object.entries(errors).map(([key, value]) => (
                                    <li key={key}>{value}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleCheckoutSubmit}>
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Column - Forms */}
                            <div className="lg:w-7/12">
                                {/* Login Section (for guests) */}
                                {!user && (
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 text-body">
                                            <i className="fi-rs-user"></i>
                                            <span>Already have an account?</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginForm(!showLoginForm)}
                                                className="text-brand hover:text-brand-dark font-semibold"
                                            >
                                                Click here to login
                                            </button>
                                        </div>

                                        {showLoginForm && (
                                            <div className="mt-4 bg-white p-6 rounded-lg border border-border">
                                                <p className="text-sm text-body mb-4">
                                                    If you have shopped with us before, log in for faster checkout.
                                                    New customers can proceed with Quick Checkout below.
                                                </p>
                                                <div className="space-y-4">
                                                    <input
                                                        type="email"
                                                        value={loginForm.data.email}
                                                        onChange={(e) => loginForm.setData('email', e.target.value)}
                                                        placeholder="Email"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                    <input
                                                        type="password"
                                                        value={loginForm.data.password}
                                                        onChange={(e) => loginForm.setData('password', e.target.value)}
                                                        placeholder="Password"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleLoginSubmit}
                                                        disabled={loginForm.processing}
                                                        className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-md font-semibold transition-colors"
                                                    >
                                                        {loginForm.processing ? 'Logging in...' : 'Log in'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Billing Details Form */}
                                <div className="bg-white p-6 lg:p-8 rounded-lg border border-border mb-6">
                                    <h4 className="text-xl font-bold text-heading font-quicksand mb-6">
                                        {user ? 'Billing Details' : 'Quick Checkout'}
                                    </h4>

                                    {!user && (
                                        <p className="text-sm text-body mb-6 bg-blue-50 p-3 rounded-lg">
                                            <i className="fi-rs-info mr-2"></i>
                                            An account will be created automatically using your email address.
                                        </p>
                                    )}

                                    {/* Name Row */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.first_name}
                                                onChange={(e) => handleBillingChange('first_name', e.target.value)}
                                                placeholder="First name *"
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none ${errors['billing.first_name'] ? 'border-red-500' : 'border-border'}`}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.last_name}
                                                onChange={(e) => handleBillingChange('last_name', e.target.value)}
                                                placeholder="Last name *"
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none ${errors['billing.last_name'] ? 'border-red-500' : 'border-border'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Email & Phone Row */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <input
                                                type="email"
                                                value={data.billing.email}
                                                onChange={(e) => handleBillingChange('email', e.target.value)}
                                                placeholder="Email address *"
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none ${errors['billing.email'] ? 'border-red-500' : 'border-border'}`}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="tel"
                                                value={data.billing.phone}
                                                onChange={(e) => handleBillingChange('phone', e.target.value)}
                                                placeholder="Phone *"
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none ${errors['billing.phone'] ? 'border-red-500' : 'border-border'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Address Row */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.address_line_1}
                                                onChange={(e) => handleBillingChange('address_line_1', e.target.value)}
                                                placeholder="Address *"
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none ${errors['billing.address_line_1'] ? 'border-red-500' : 'border-border'}`}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.address_line_2}
                                                onChange={(e) => handleBillingChange('address_line_2', e.target.value)}
                                                placeholder="Address line 2 (optional)"
                                                className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* City & State Row */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.city}
                                                onChange={(e) => handleBillingChange('city', e.target.value)}
                                                placeholder="City / Town *"
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none ${errors['billing.city'] ? 'border-red-500' : 'border-border'}`}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.state}
                                                onChange={(e) => handleBillingChange('state', e.target.value)}
                                                placeholder="State / Region"
                                                className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Country & Postal Code Row */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <select
                                                value={data.billing.country_id}
                                                onChange={(e) => handleBillingChange('country_id', e.target.value)}
                                                required
                                                className={`w-full border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none bg-white ${errors['billing.country_id'] ? 'border-red-500' : 'border-border'}`}
                                            >
                                                <option value="">Select Country *</option>
                                                {countries.map((country) => (
                                                    <option key={country.id} value={country.id}>{country.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={data.billing.postal_code}
                                                onChange={(e) => handleBillingChange('postal_code', e.target.value)}
                                                placeholder="Postal Code"
                                                className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Order Notes */}
                                    <div className="mb-4">
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows="3"
                                            placeholder="Order notes (optional)"
                                            className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none resize-none"
                                        ></textarea>
                                    </div>

                                    {/* Ship to Different Address */}
                                    <div className="border-t border-border pt-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!data.shipping.same_as_billing}
                                                onChange={(e) => handleShippingSameAsBilling(!e.target.checked)}
                                                className="w-4 h-4 accent-brand"
                                            />
                                            <span className="text-sm text-heading font-semibold">Ship to a different address?</span>
                                        </label>

                                        {showShippingAddress && (
                                            <div className="mt-6 space-y-4">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={data.shipping.first_name}
                                                        onChange={(e) => handleShippingChange('first_name', e.target.value)}
                                                        placeholder="First name *"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={data.shipping.last_name}
                                                        onChange={(e) => handleShippingChange('last_name', e.target.value)}
                                                        placeholder="Last name *"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={data.shipping.phone}
                                                    onChange={(e) => handleShippingChange('phone', e.target.value)}
                                                    placeholder="Phone *"
                                                    className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                />
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={data.shipping.address_line_1}
                                                        onChange={(e) => handleShippingChange('address_line_1', e.target.value)}
                                                        placeholder="Address *"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={data.shipping.address_line_2}
                                                        onChange={(e) => handleShippingChange('address_line_2', e.target.value)}
                                                        placeholder="Address line 2"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={data.shipping.city}
                                                        onChange={(e) => handleShippingChange('city', e.target.value)}
                                                        placeholder="City / Town *"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={data.shipping.state}
                                                        onChange={(e) => handleShippingChange('state', e.target.value)}
                                                        placeholder="State / Region"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <select
                                                        value={data.shipping.country_id}
                                                        onChange={(e) => handleShippingChange('country_id', e.target.value)}
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none bg-white"
                                                    >
                                                        <option value="">Select Country *</option>
                                                        {countries.map((country) => (
                                                            <option key={country.id} value={country.id}>{country.name}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={data.shipping.postal_code}
                                                        onChange={(e) => handleShippingChange('postal_code', e.target.value)}
                                                        placeholder="Postal Code"
                                                        className="w-full border border-border rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Order Summary & Payment */}
                            <div className="lg:w-5/12">
                                {/* Order Summary */}
                                <div className="bg-white p-6 lg:p-8 rounded-lg border border-border mb-6">
                                    <h4 className="text-xl font-bold text-heading font-quicksand mb-6">Your Order</h4>
                                    <div className="border-t-2 border-brand mb-6"></div>

                                    {/* Order Items */}
                                    <div className="space-y-4 mb-6">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-border">
                                                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <img
                                                            src={`/storage/${item.image}`}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <i className="fi-rs-picture"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h6 className="text-heading font-semibold text-sm mb-1 truncate">
                                                        {item.name}
                                                    </h6>
                                                    {item.variant_name && (
                                                        <p className="text-xs text-muted">{item.variant_name}</p>
                                                    )}
                                                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                                                </div>
                                                <span className="text-brand font-bold">{formatCurrency(item.line_total)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Totals */}
                                    <div className="space-y-3 border-t border-border pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-body">Subtotal</span>
                                            <span className="font-semibold">{formatCurrency(cart?.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-body">Shipping</span>
                                            <span className="font-semibold">{cart?.shipping === 0 ? 'Free' : formatCurrency(cart?.shipping)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg border-t border-border pt-3">
                                            <span className="font-bold text-heading">Total</span>
                                            <span className="font-bold text-brand">{formatCurrency(cart?.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Section */}
                                <div className="bg-white p-6 lg:p-8 rounded-lg border border-border">
                                    <h4 className="text-xl font-bold text-heading font-quicksand mb-6">Payment Method</h4>

                                    {/* Payment Options */}
                                    <div className="space-y-3 mb-6">
                                        {paymentGateways.map((gateway) => (
                                            <label
                                                key={gateway.id}
                                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                                    data.payment_gateway_id === gateway.id
                                                        ? 'border-brand bg-brand/5'
                                                        : 'border-border hover:border-brand/50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_gateway_id"
                                                    value={gateway.id}
                                                    checked={data.payment_gateway_id === gateway.id}
                                                    onChange={(e) => setData('payment_gateway_id', parseInt(e.target.value))}
                                                    className="w-4 h-4 accent-brand"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-semibold text-heading">{gateway.display_name}</span>
                                                    {gateway.description && (
                                                        <p className="text-xs text-muted mt-1">{gateway.description}</p>
                                                    )}
                                                </div>
                                                {gateway.logo && (
                                                    <img src={gateway.logo} alt={gateway.name} className="h-8" />
                                                )}
                                            </label>
                                        ))}

                                        {paymentGateways.length === 0 && (
                                            <p className="text-muted text-sm">No payment methods available.</p>
                                        )}
                                    </div>

                                    {/* Place Order Button */}
                                    <button
                                        type="submit"
                                        disabled={processing || paymentGateways.length === 0}
                                        className="w-full bg-brand hover:bg-brand-dark text-white py-4 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <i className="fi-rs-spinner animate-spin"></i>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Place Order
                                                <i className="fi-rs-arrow-right"></i>
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-muted text-center mt-4">
                                        By placing your order, you agree to our Terms & Conditions and Privacy Policy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        </FrontendLayout>
    );
}

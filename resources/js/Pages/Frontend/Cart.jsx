import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Cart({ cart }) {
    const [loading, setLoading] = useState(false);
    const [updatingItems, setUpdatingItems] = useState({});

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Update quantity handler
    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 0 || updatingItems[itemId]) return;

        setUpdatingItems(prev => ({ ...prev, [itemId]: true }));

        router.patch(route('cart.update', itemId), {
            quantity: newQuantity,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
            },
        });
    };

    // Remove item handler
    const removeItem = (itemId) => {
        if (updatingItems[itemId]) return;

        setUpdatingItems(prev => ({ ...prev, [itemId]: true }));

        router.delete(route('cart.remove', itemId), {
            preserveScroll: true,
            onFinish: () => {
                setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
            },
        });
    };

    // Clear cart handler
    const clearCart = () => {
        if (loading) return;

        if (!confirm('Are you sure you want to clear your cart?')) return;

        setLoading(true);
        router.delete(route('cart.clear'), {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    // Apply coupon handler
    const applyCoupon = (e) => {
        e.preventDefault();
        if (couponCode.trim()) {
            // TODO: Implement coupon functionality
            setAppliedCoupon(couponCode);
            alert(`Coupon "${couponCode}" applied!`);
        }
    };

    const cartItems = cart?.items || [];
    const subtotal = cart?.subtotal || 0;
    const shipping = cart?.shipping || 0;
    const total = cart?.total || 0;

    return (
        <FrontendLayout>
            <Head title="Shopping Cart" />

            {/* Page Header / Breadcrumb */}
            <div className="bg-grey-9 py-5">
                <div className="max-w-container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-brand hover:text-brand-dark flex items-center gap-1">
                            <i className="fi-rs-home"></i> Home
                        </Link>
                        <span className="text-muted">-</span>
                        <Link href={route('shop')} className="text-muted hover:text-brand">Shop</Link>
                        <span className="text-muted">-</span>
                        <span className="text-body">Cart</span>
                    </div>
                </div>
            </div>

            {/* Cart Content */}
            <div className="max-w-container mx-auto px-4 py-12">
                {/* Cart Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-quicksand font-bold text-heading mb-2">Your Cart</h1>
                            <p className="text-body">
                                There are <span className="text-brand font-semibold">{cart?.item_count || 0}</span> products in your cart
                            </p>
                        </div>
                        {cartItems.length > 0 && (
                            <button
                                onClick={clearCart}
                                disabled={loading}
                                className="flex items-center gap-2 text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                                <i className="fi-rs-trash"></i> Clear Cart
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Table */}
                    <div className="flex-1">
                        <div className="bg-white border border-border rounded-xl overflow-hidden">
                            {/* Table Header (Desktop) */}
                            <div className="hidden md:grid grid-cols-12 gap-4 bg-grey-9 px-6 py-4 text-sm font-semibold text-heading">
                                <div className="col-span-6">Product</div>
                                <div className="col-span-2">Unit Price</div>
                                <div className="col-span-2">Quantity</div>
                                <div className="col-span-1">Subtotal</div>
                                <div className="col-span-1 text-center">Remove</div>
                            </div>

                            {/* Cart Items */}
                            {cartItems.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="fi-rs-shopping-cart text-4xl text-gray-400"></i>
                                    </div>
                                    <p className="text-muted text-lg mb-4">Your cart is empty</p>
                                    <Link
                                        href={route('shop')}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-md font-semibold transition-colors"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            ) : (
                                cartItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-6 ${
                                            index < cartItems.length - 1 ? 'border-b border-border' : ''
                                        } ${updatingItems[item.id] ? 'opacity-50' : ''}`}
                                    >
                                        <div className="col-span-1 md:col-span-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                                    {item.image ? (
                                                        <img
                                                            src={`/storage/${item.image}`}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <i className="fi-rs-picture text-2xl"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h6 className="font-quicksand font-semibold text-heading mb-1">
                                                        {item.name}
                                                    </h6>
                                                    {item.variant_name && (
                                                        <p className="text-xs text-muted mb-1">{item.variant_name}</p>
                                                    )}
                                                    {item.seller_name && (
                                                        <p className="text-xs text-muted">
                                                            Sold by: <span className="text-brand">{item.seller_name}</span>
                                                        </p>
                                                    )}
                                                    {!item.in_stock && (
                                                        <p className="text-xs text-red-500 mt-1">Out of stock</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <span className="md:hidden text-sm text-muted">Price: </span>
                                            <span className="text-body font-semibold">{formatCurrency(item.unit_price)}</span>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <div className="flex items-center border border-border rounded-md w-fit">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={updatingItems[item.id] || item.quantity <= 1}
                                                    className="w-10 h-10 flex items-center justify-center text-heading hover:text-brand transition-colors disabled:opacity-50"
                                                >
                                                    <i className="fi-rs-minus-small"></i>
                                                </button>
                                                <span className="w-12 h-10 flex items-center justify-center border-x border-border text-heading font-semibold">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    disabled={updatingItems[item.id]}
                                                    className="w-10 h-10 flex items-center justify-center text-heading hover:text-brand transition-colors disabled:opacity-50"
                                                >
                                                    <i className="fi-rs-plus-small"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-1 md:col-span-1">
                                            <span className="md:hidden text-sm text-muted">Subtotal: </span>
                                            <span className="text-brand font-bold">
                                                {formatCurrency(item.line_total)}
                                            </span>
                                        </div>
                                        <div className="col-span-1 md:col-span-1 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                disabled={updatingItems[item.id]}
                                                className="text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                                            >
                                                <i className="fi-rs-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Actions */}
                        {cartItems.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pt-6 border-t border-border">
                                <Link
                                    href={route('shop')}
                                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border-2 text-brand rounded-md hover:bg-brand hover:text-white hover:border-brand transition-colors font-semibold"
                                >
                                    <i className="fi-rs-arrow-left"></i> Continue Shopping
                                </Link>
                            </div>
                        )}

                        {/* Coupon Section */}
                        {cartItems.length > 0 && (
                            <div className="mt-12">
                                <div className="bg-white border border-border rounded-xl p-6 lg:p-8">
                                    <h4 className="font-quicksand font-bold text-heading text-lg mb-3">Apply Coupon</h4>
                                    <p className="text-sm text-muted mb-6">Using A Promo Code?</p>
                                    <form onSubmit={applyCoupon} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Enter Your Coupon"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="flex-1 border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand"
                                        />
                                        <button
                                            type="submit"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-md font-semibold transition-colors"
                                        >
                                            <i className="fi-rs-label"></i> Apply
                                        </button>
                                    </form>
                                    {appliedCoupon && (
                                        <p className="mt-3 text-sm text-brand">
                                            Coupon "{appliedCoupon}" applied!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cart Totals Sidebar */}
                    {cartItems.length > 0 && (
                        <div className="w-full lg:w-[380px] flex-shrink-0">
                            <div className="bg-white border border-border rounded-xl p-6 lg:p-8 sticky top-24">
                                <h4 className="font-quicksand font-bold text-heading text-xl mb-6 pb-4 border-b border-border">Cart Totals</h4>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Subtotal</span>
                                        <span className="text-brand font-bold text-lg">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="border-t border-border"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Shipping</span>
                                        <span className="text-heading font-semibold">{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                                    </div>
                                    <div className="border-t border-border"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-heading font-semibold">Total</span>
                                        <span className="text-brand font-bold text-2xl">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <Link
                                    href={route('checkout')}
                                    className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white py-4 rounded-md font-quicksand font-bold transition-colors"
                                >
                                    Proceed To CheckOut <i className="fi-rs-sign-out"></i>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </FrontendLayout>
    );
}

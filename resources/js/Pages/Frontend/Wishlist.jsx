import { Head, Link, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Wishlist({ items = [] }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleRemove = (productId) => {
        router.delete(route('wishlist.remove', productId), {
            preserveScroll: true,
        });
    };

    const handleAddToCart = (productId) => {
        router.post(route('cart.add'), {
            product_id: productId,
            quantity: 1,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <FrontendLayout>
            <Head title="My Wishlist" />

            {/* Breadcrumb */}
            <div className="bg-gray-50 py-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-body hover:text-brand">Home</Link>
                        <span className="text-body">/</span>
                        <span className="text-brand">Wishlist</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-heading mb-8 font-quicksand">My Wishlist</h1>

                {items.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-heading">Product</th>
                                    <th className="text-left py-4 px-6 font-semibold text-heading">Price</th>
                                    <th className="text-left py-4 px-6 font-semibold text-heading">Stock Status</th>
                                    <th className="text-right py-4 px-6 font-semibold text-heading">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={item.product?.image || '/images/frontend/placeholder-product.png'}
                                                    alt={item.product?.name}
                                                    className="w-20 h-20 object-contain rounded-lg border"
                                                />
                                                <div>
                                                    <Link
                                                        href={`/product/${item.product?.slug}`}
                                                        className="font-semibold text-heading hover:text-brand transition-colors"
                                                    >
                                                        {item.product?.name}
                                                    </Link>
                                                    <p className="text-sm text-body">{item.product?.category?.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-brand font-bold">{formatCurrency(item.product?.price)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {item.product?.in_stock ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                    In Stock
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAddToCart(item.product?.id)}
                                                    disabled={!item.product?.in_stock}
                                                    className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Add to Cart
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(item.product?.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-heading mb-2">Your Wishlist is Empty</h3>
                        <p className="text-body mb-6">Save items you love to your wishlist and come back to them anytime.</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </FrontendLayout>
    );
}

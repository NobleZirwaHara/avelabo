import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Compare({ products = [] }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <FrontendLayout>
            <Head title="Compare Products" />

            {/* Breadcrumb */}
            <div className="bg-gray-50 py-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-body hover:text-brand">Home</Link>
                        <span className="text-body">/</span>
                        <span className="text-brand">Compare Products</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-heading mb-8 font-quicksand">Compare Products</h1>

                {products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-gray-200 p-4 bg-gray-50 text-left">Product</th>
                                    {products.map((product) => (
                                        <th key={product.id} className="border border-gray-200 p-4 min-w-[200px]">
                                            <div className="text-center">
                                                <img
                                                    src={product.image || '/images/frontend/placeholder-product.png'}
                                                    alt={product.name}
                                                    className="w-32 h-32 object-contain mx-auto mb-3"
                                                />
                                                <Link
                                                    href={`/product/${product.slug}`}
                                                    className="font-semibold text-heading hover:text-brand transition-colors"
                                                >
                                                    {product.name}
                                                </Link>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-200 p-4 bg-gray-50 font-semibold">Price</td>
                                    {products.map((product) => (
                                        <td key={product.id} className="border border-gray-200 p-4 text-center">
                                            <span className="text-brand font-bold text-xl">{formatCurrency(product.price)}</span>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 p-4 bg-gray-50 font-semibold">Availability</td>
                                    {products.map((product) => (
                                        <td key={product.id} className="border border-gray-200 p-4 text-center">
                                            <span className={product.in_stock ? 'text-green-600' : 'text-red-600'}>
                                                {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 p-4 bg-gray-50 font-semibold">Rating</td>
                                    {products.map((product) => (
                                        <td key={product.id} className="border border-gray-200 p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-4 h-4 ${i < (product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 p-4 bg-gray-50 font-semibold">Action</td>
                                    {products.map((product) => (
                                        <td key={product.id} className="border border-gray-200 p-4 text-center">
                                            <button className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors">
                                                Add to Cart
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-heading mb-2">No Products to Compare</h3>
                        <p className="text-body mb-6">Add products to your compare list to see them side by side.</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                )}
            </div>
        </FrontendLayout>
    );
}

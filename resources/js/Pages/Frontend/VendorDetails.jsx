import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import ProductCard from '@/Components/Frontend/ProductCard';

export default function VendorDetails({
    vendor = {},
    products = { data: [] },
    categories = [],
    dealProducts = [],
    filters = {},
}) {
    const [priceRange, setPriceRange] = useState(filters.max_price || 500000);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleFilterChange = (key, value) => {
        router.get(route('vendor.details', vendor.slug), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleAddToCart = (product) => {
        router.post(route('cart.add'), {
            product_id: product.id,
            quantity: 1,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <FrontendLayout>
            <Head title={`${vendor.shop_name} - Avelabo Marketplace`} />

            {/* Breadcrumb */}
            <div className="bg-white py-4 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-brand transition-colors">
                            <i className="fi fi-rs-home"></i>
                        </Link>
                        <span className="text-gray-500">/</span>
                        <Link href={route('vendors')} className="text-gray-500 hover:text-brand transition-colors">Vendors</Link>
                        <span className="text-gray-500">/</span>
                        <span className="text-brand">{vendor.shop_name}</span>
                    </div>
                </div>
            </div>

            {/* Vendor Header Banner */}
            <section
                className="relative py-16 lg:py-24 bg-cover bg-center"
                style={{
                    backgroundImage: vendor.banner
                        ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${vendor.banner}')`
                        : "linear-gradient(rgba(59,130,246,0.8), rgba(59,130,246,0.9))"
                }}
            >
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                        {/* Vendor Logo */}
                        <div className="flex-shrink-0">
                            {vendor.logo ? (
                                <img src={vendor.logo} alt={vendor.shop_name} className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg" />
                            ) : (
                                <div className="w-32 h-32 rounded-xl bg-white flex items-center justify-center border-4 border-white shadow-lg">
                                    <span className="text-4xl font-bold text-brand">{vendor.shop_name?.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        {/* Vendor Info */}
                        <div className="text-center lg:text-left flex-1">
                            <span className="text-gray-300 text-sm">Since {vendor.created_at}</span>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white font-quicksand mt-2 mb-4">
                                {vendor.shop_name}
                                {vendor.is_verified && (
                                    <i className="fi fi-rs-badge-check text-blue-400 ml-2" title="Verified Seller"></i>
                                )}
                            </h1>
                            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                                <div className="flex">
                                    {[1,2,3,4,5].map((star) => (
                                        <i key={star} className={`fi fi-rs-star text-xs ${star <= Math.round(vendor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                                    ))}
                                </div>
                                <span className="text-gray-300 text-sm">({vendor.rating?.toFixed(1) || '0.0'})</span>
                                <span className="text-gray-300 text-sm">| {vendor.total_reviews || 0} reviews</span>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Description */}
                                <div>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        {vendor.description || 'Welcome to our store! We offer quality products at competitive prices.'}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="text-white/90 text-sm space-y-2">
                                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                                        <i className="fi fi-rs-box text-brand-light"></i>
                                        <span><strong>{vendor.total_products || 0}</strong> Products</span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                                        <i className="fi fi-rs-shopping-bag text-brand-light"></i>
                                        <span><strong>{vendor.total_sales || 0}</strong> Sales</span>
                                    </div>
                                    {vendor.country && (
                                        <div className="flex items-center gap-2 justify-center lg:justify-start">
                                            <i className="fi fi-rs-marker text-brand-light"></i>
                                            <span>{vendor.country}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-center lg:justify-start gap-3">
                                    {vendor.is_featured && (
                                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            Featured Seller
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Products List */}
                        <div className="flex-1 order-2 lg:order-1">
                            {/* Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
                                <p className="text-gray-500">
                                    We found <strong className="text-brand">{products.total || products.data?.length || 0}</strong> products
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 text-sm">Show:</span>
                                        <select
                                            value={filters.per_page || 12}
                                            onChange={(e) => handleFilterChange('per_page', e.target.value)}
                                            className="border border-gray-200 rounded px-3 py-2 text-sm focus:border-brand focus:outline-none"
                                        >
                                            <option value="12">12</option>
                                            <option value="24">24</option>
                                            <option value="48">48</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 text-sm">Sort by:</span>
                                        <select
                                            value={filters.sort || 'featured'}
                                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                                            className="border border-gray-200 rounded px-3 py-2 text-sm focus:border-brand focus:outline-none"
                                        >
                                            <option value="featured">Featured</option>
                                            <option value="newest">Newest</option>
                                            <option value="price_low">Price: Low to High</option>
                                            <option value="price_high">Price: High to Low</option>
                                            <option value="rating">Top Rated</option>
                                            <option value="popular">Most Popular</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Product Grid */}
                            {products.data?.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                                    {products.data.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <i className="fi fi-rs-shopping-bag text-5xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-500">No products available from this seller yet</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {products.last_page > 1 && (
                                <nav className="flex items-center justify-center gap-2 mb-12">
                                    {products.links?.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`w-10 h-10 flex items-center justify-center border rounded transition-colors ${
                                                link.active
                                                    ? 'border-brand bg-brand text-white'
                                                    : 'border-gray-200 hover:border-brand hover:text-brand'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            )}

                            {/* Deals of the Day */}
                            {dealProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-heading font-quicksand">Deals From This Seller</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {dealProducts.map((product) => (
                                            <div key={product.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                                                <Link href={route('product.detail', product.slug)} className="block">
                                                    <img
                                                        src={product.primary_image || '/images/frontend/placeholder-product.png'}
                                                        alt={product.name}
                                                        className="w-full h-48 object-contain"
                                                    />
                                                </Link>
                                                <div className="p-4">
                                                    <Link href={route('product.detail', product.slug)}>
                                                        <h6 className="font-quicksand font-semibold text-heading mb-2 hover:text-brand line-clamp-2">
                                                            {product.name}
                                                        </h6>
                                                    </Link>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex">
                                                            {[1,2,3,4,5].map((star) => (
                                                                <i key={star} className={`fi fi-rs-star text-xs ${star <= (product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-brand font-bold">{formatCurrency(product.price)}</span>
                                                            {product.compare_price && (
                                                                <span className="text-gray-500 line-through text-xs ml-1">{formatCurrency(product.compare_price)}</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddToCart(product)}
                                                            className="text-brand hover:text-brand-dark text-sm flex items-center gap-1"
                                                        >
                                                            <i className="fi fi-rs-shopping-cart"></i> Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="w-full lg:w-72 flex-shrink-0 order-1 lg:order-2">
                            {/* Categories Widget */}
                            {categories.length > 0 && (
                                <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                                    <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-4 border-b border-gray-100">Categories</h5>
                                    <ul className="space-y-3">
                                        <li>
                                            <button
                                                onClick={() => handleFilterChange('category', '')}
                                                className={`flex items-center justify-between w-full group ${!filters.category ? 'text-brand' : ''}`}
                                            >
                                                <span className="text-heading group-hover:text-brand transition-colors">All Products</span>
                                                <span className="bg-brand/10 text-brand text-xs px-2 py-1 rounded-full">
                                                    {products.total || 0}
                                                </span>
                                            </button>
                                        </li>
                                        {categories.map((category) => (
                                            <li key={category.id}>
                                                <button
                                                    onClick={() => handleFilterChange('category', category.slug)}
                                                    className={`flex items-center justify-between w-full group ${filters.category === category.slug ? 'text-brand' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {category.icon && <img src={category.icon} alt="" className="w-6 h-6" />}
                                                        <span className="text-heading group-hover:text-brand transition-colors">{category.name}</span>
                                                    </div>
                                                    <span className="bg-brand/10 text-brand text-xs px-2 py-1 rounded-full">{category.products_count}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Filter by Price Widget */}
                            <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                                <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-4 border-b border-gray-100">Filter by Price</h5>

                                <div className="mb-6">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000000"
                                        step="10000"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(e.target.value)}
                                        className="w-full mb-4 accent-brand"
                                    />
                                    <div className="flex justify-between text-sm">
                                        <span>From: <strong className="text-brand">{formatCurrency(0)}</strong></span>
                                        <span>To: <strong className="text-brand">{formatCurrency(priceRange)}</strong></span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleFilterChange('max_price', priceRange)}
                                    className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 w-fit"
                                >
                                    <i className="fi fi-rs-filter"></i> Apply Filter
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}

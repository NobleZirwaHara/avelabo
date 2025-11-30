import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Vendors({ vendors = { data: [] }, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('vendors'), { search, sort: filters.sort }, { preserveState: true });
    };

    const handleSort = (sortValue) => {
        router.get(route('vendors'), { search: filters.search, sort: sortValue }, { preserveState: true });
    };

    return (
        <FrontendLayout>
            <Head title="Our Sellers - Avelabo Marketplace" />

            {/* Breadcrumb */}
            <div className="bg-white py-4 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-brand transition-colors">
                            <i className="fi fi-rs-home"></i>
                        </Link>
                        <span className="text-gray-500">/</span>
                        <span className="text-brand">Our Sellers</span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="py-12 bg-gradient-to-r from-brand to-brand-dark text-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl lg:text-4xl font-bold font-quicksand mb-4">
                            Our Trusted Sellers
                        </h1>
                        <p className="text-white/90 text-lg">
                            Browse through our verified sellers and find quality products from trusted merchants across Malawi.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Search and Sort */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-md flex-1">
                            <input
                                type="text"
                                placeholder="Search sellers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
                            >
                                <i className="fi fi-rs-search"></i>
                            </button>
                        </form>

                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">Sort by:</span>
                            <select
                                value={filters.sort || 'featured'}
                                onChange={(e) => handleSort(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:border-brand focus:outline-none"
                            >
                                <option value="featured">Featured</option>
                                <option value="newest">Newest</option>
                                <option value="rating">Top Rated</option>
                                <option value="products">Most Products</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <p className="text-gray-500 mb-6">
                        Showing <strong className="text-brand">{vendors.total || vendors.data?.length || 0}</strong> sellers
                    </p>

                    {/* Vendors Grid */}
                    {vendors.data?.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {vendors.data.map((vendor) => (
                                <Link
                                    key={vendor.id}
                                    href={route('vendor.details', vendor.slug)}
                                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
                                >
                                    {/* Banner */}
                                    <div
                                        className="h-32 bg-cover bg-center"
                                        style={{
                                            backgroundImage: vendor.banner
                                                ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${vendor.banner}')`
                                                : 'linear-gradient(rgba(59,130,246,0.8), rgba(59,130,246,0.9))'
                                        }}
                                    >
                                        <div className="h-full flex items-center justify-center">
                                            {vendor.is_featured && (
                                                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    Featured Seller
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 relative">
                                        {/* Logo */}
                                        <div className="absolute -top-10 left-6">
                                            {vendor.logo ? (
                                                <img
                                                    src={vendor.logo}
                                                    alt={vendor.shop_name}
                                                    className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-brand flex items-center justify-center border-4 border-white shadow-lg">
                                                    <span className="text-2xl font-bold text-white">
                                                        {vendor.shop_name?.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8">
                                            <h3 className="font-quicksand font-bold text-lg text-heading group-hover:text-brand transition-colors flex items-center gap-2">
                                                {vendor.shop_name}
                                                {vendor.is_verified && (
                                                    <i className="fi fi-rs-badge-check text-blue-500" title="Verified Seller"></i>
                                                )}
                                            </h3>

                                            {/* Rating */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <i
                                                            key={star}
                                                            className={`fi fi-rs-star text-xs ${
                                                                star <= Math.round(vendor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                                                            }`}
                                                        ></i>
                                                    ))}
                                                </div>
                                                <span className="text-gray-500 text-sm">
                                                    ({vendor.rating?.toFixed(1) || '0.0'})
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {vendor.description && (
                                                <p className="text-gray-500 text-sm mt-3 line-clamp-2">
                                                    {vendor.description}
                                                </p>
                                            )}

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <i className="fi fi-rs-box text-brand"></i>
                                                    {vendor.total_products || 0} products
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <i className="fi fi-rs-shopping-bag text-brand"></i>
                                                    {vendor.total_sales || 0} sales
                                                </span>
                                            </div>

                                            {/* Location */}
                                            {vendor.country && (
                                                <div className="flex items-center gap-1 mt-3 text-sm text-gray-400">
                                                    <i className="fi fi-rs-marker"></i>
                                                    {vendor.country}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <i className="fi fi-rs-shop text-5xl text-gray-300 mb-4 block"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No sellers found</h3>
                            <p className="text-gray-500">
                                {filters.search
                                    ? 'No sellers match your search criteria.'
                                    : 'No sellers available at the moment.'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {vendors.last_page > 1 && (
                        <nav className="flex items-center justify-center gap-2">
                            {vendors.links?.map((link, index) => (
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
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl lg:text-3xl font-bold text-heading font-quicksand mb-4">
                            Want to become a seller?
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Join our marketplace and reach thousands of customers across Malawi.
                        </p>
                        <Link
                            href={route('vendor.guide')}
                            className="inline-block bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-lg font-semibold transition-colors"
                        >
                            Learn How to Sell
                        </Link>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}

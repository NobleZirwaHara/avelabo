import { useState } from 'react';
import { Link, Head, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Shop({ products, categories, brands, priceRange, featuredProducts, currentCategory, filters }) {
    // Filter states
    const [localPriceRange, setLocalPriceRange] = useState(filters?.max_price || priceRange?.max || 500);
    const [showDropdown, setShowDropdown] = useState(null);

    const sortOptions = [
        { value: 'featured', label: 'Featured' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'newest', label: 'Newest' },
        { value: 'rating', label: 'Top Rated' },
    ];
    const showOptions = [12, 24, 36, 48];

    const handleFilterChange = (key, value) => {
        router.get(route('shop'), { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    };

    const handlePriceFilter = () => {
        router.get(route('shop'), { ...filters, min_price: priceRange?.min || 0, max_price: localPriceRange }, { preserveState: true });
    };

    const clearFilters = () => {
        router.get(route('shop'));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getBadgeClass = (product) => {
        if (product.is_on_sale) return 'bg-red-500';
        if (product.is_featured) return 'bg-brand';
        return 'bg-yellow-500';
    };

    const getBadgeText = (product) => {
        if (product.is_on_sale) return `-${product.discount_percentage}%`;
        if (product.is_featured) return 'Featured';
        return 'New';
    };

    const hasActiveFilters = filters?.category || filters?.brand || filters?.min_price || filters?.max_price || filters?.search;

    return (
        <FrontendLayout>
            <Head title={currentCategory ? currentCategory.name : 'Shop'} />

            {/* Page Header / Breadcrumb */}
            <div className="py-8 mb-8">
                <div className="max-w-container mx-auto px-4">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-quicksand font-bold text-heading mb-3">
                                {currentCategory ? currentCategory.name : 'Shop'}
                            </h1>
                            <div className="flex items-center gap-2 text-sm">
                                <Link href="/" className="text-brand hover:text-brand-dark flex items-center gap-1">
                                    <i className="fi-rs-home"></i> Home
                                </Link>
                                <span className="text-muted">•</span>
                                <span className="text-heading">Shop</span>
                                {currentCategory && (
                                    <>
                                        <span className="text-muted">•</span>
                                        <span className="text-body">{currentCategory.name}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Active Filter Tags */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-3 flex-wrap">
                                {filters?.search && (
                                    <span className="flex items-center gap-2 px-4 py-2 border border-brand bg-brand/5 text-brand rounded-full text-sm">
                                        Search: {filters.search}
                                        <button onClick={() => handleFilterChange('search', null)} className="hover:text-brand-dark">
                                            <i className="fi-rs-cross text-xs"></i>
                                        </button>
                                    </span>
                                )}
                                {filters?.category && (
                                    <span className="flex items-center gap-2 px-4 py-2 border border-brand bg-brand/5 text-brand rounded-full text-sm">
                                        {currentCategory?.name}
                                        <button onClick={() => handleFilterChange('category', null)} className="hover:text-brand-dark">
                                            <i className="fi-rs-cross text-xs"></i>
                                        </button>
                                    </span>
                                )}
                                <button onClick={clearFilters} className="text-sm text-muted hover:text-brand">
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shop Content */}
            <div className="max-w-container mx-auto px-4 mb-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar (Left) */}
                    <aside className="w-full lg:w-[280px] flex-shrink-0 order-2 lg:order-1">
                        {/* Category Widget */}
                        <div className="bg-white border border-border rounded-xl p-6 mb-6">
                            <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-4 border-b border-border">Category</h5>
                            <ul className="space-y-3">
                                {categories?.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            href={route('shop', { category: category.slug })}
                                            className={`flex items-center justify-between group ${filters?.category === category.slug ? 'text-brand' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {category.icon && <i className={category.icon}></i>}
                                                <span className="text-heading group-hover:text-brand transition-colors">{category.name}</span>
                                            </div>
                                            <span className="bg-brand/10 text-brand text-xs px-2 py-1 rounded-full">{category.products_count}</span>
                                        </Link>
                                        {/* Subcategories */}
                                        {category.children?.length > 0 && (
                                            <ul className="ml-6 mt-2 space-y-2">
                                                {category.children.map((child) => (
                                                    <li key={child.id}>
                                                        <Link
                                                            href={route('shop', { category: child.slug })}
                                                            className={`flex items-center justify-between text-sm ${filters?.category === child.slug ? 'text-brand' : 'text-body hover:text-brand'}`}
                                                        >
                                                            <span>{child.name}</span>
                                                            <span className="text-xs text-muted">({child.products_count})</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Filter Widget */}
                        <div className="bg-white border border-border rounded-xl p-6 mb-6">
                            <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-4 border-b border-border">Filter by price</h5>
                            <div className="mb-5">
                                <input
                                    type="range"
                                    min={priceRange?.min || 0}
                                    max={priceRange?.max || 10000}
                                    value={localPriceRange}
                                    onChange={(e) => setLocalPriceRange(parseInt(e.target.value))}
                                    className="w-full accent-brand"
                                />
                                <div className="flex justify-between text-sm mt-2">
                                    <span>From: <strong className="text-brand">{formatCurrency(priceRange?.min || 0)}</strong></span>
                                    <span>To: <strong className="text-brand">{formatCurrency(localPriceRange)}</strong></span>
                                </div>
                            </div>
                            <button
                                onClick={handlePriceFilter}
                                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
                            >
                                <i className="fi-rs-filter"></i> Filter
                            </button>
                        </div>

                        {/* Brand Filter Widget */}
                        {brands?.length > 0 && (
                            <div className="bg-white border border-border rounded-xl p-6 mb-6">
                                <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-4 border-b border-border">Brands</h5>
                                <ul className="space-y-2">
                                    {brands.map((brand) => (
                                        <li key={brand.id}>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="brand"
                                                    className="w-4 h-4 accent-brand"
                                                    checked={filters?.brand === brand.id?.toString()}
                                                    onChange={() => handleFilterChange('brand', brand.id)}
                                                />
                                                <span className="text-sm text-body">{brand.name}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Featured Products Widget */}
                        {featuredProducts?.length > 0 && (
                            <div className="bg-grey-9 rounded-xl p-6 mb-6">
                                <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-4 border-b border-border">Featured Products</h5>
                                <div className="space-y-4">
                                    {featuredProducts.map((product) => (
                                        <div key={product.id} className="flex gap-3">
                                            <Link href={route('product.detail', product.slug)} className="w-20 h-20 flex-shrink-0">
                                                {product.primary_image ? (
                                                    <img src={`/storage/${product.primary_image}`} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">No image</span>
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex-1">
                                                <h6 className="font-quicksand font-semibold text-heading text-sm mb-1">
                                                    <Link href={route('product.detail', product.slug)} className="hover:text-brand line-clamp-2">{product.name}</Link>
                                                </h6>
                                                <p className="text-brand font-bold text-sm">{formatCurrency(product.price)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Products Grid (Right) */}
                    <div className="flex-1 order-1 lg:order-2">
                        {/* Shop Filter Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-border">
                            <p className="text-sm">
                                We found <strong className="text-brand">{products?.total || 0}</strong> items for you!
                            </p>
                            <div className="flex items-center gap-4">
                                {/* Show Dropdown */}
                                <div className="relative">
                                    <button
                                        className="flex items-center gap-2 text-sm text-heading"
                                        onClick={() => setShowDropdown(showDropdown === 'show' ? null : 'show')}
                                    >
                                        <i className="fi-rs-apps text-muted"></i>
                                        Show: <span className="font-semibold">{filters?.per_page || 12}</span>
                                        <i className="fi-rs-angle-small-down text-muted"></i>
                                    </button>
                                    {showDropdown === 'show' && (
                                        <ul className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl py-2 min-w-[100px] z-50">
                                            {showOptions.map((option) => (
                                                <li key={option}>
                                                    <button
                                                        onClick={() => { handleFilterChange('per_page', option); setShowDropdown(null); }}
                                                        className={`block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${(filters?.per_page || 12) === option ? 'text-brand' : 'text-heading'}`}
                                                    >
                                                        {option}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {/* Sort Dropdown */}
                                <div className="relative">
                                    <button
                                        className="flex items-center gap-2 text-sm text-heading"
                                        onClick={() => setShowDropdown(showDropdown === 'sort' ? null : 'sort')}
                                    >
                                        <i className="fi-rs-apps-sort text-muted"></i>
                                        Sort by: <span className="font-semibold">{sortOptions.find(o => o.value === (filters?.sort || 'featured'))?.label}</span>
                                        <i className="fi-rs-angle-small-down text-muted"></i>
                                    </button>
                                    {showDropdown === 'sort' && (
                                        <ul className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl py-2 min-w-[180px] z-50">
                                            {sortOptions.map((option) => (
                                                <li key={option.value}>
                                                    <button
                                                        onClick={() => { handleFilterChange('sort', option.value); setShowDropdown(null); }}
                                                        className={`block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${(filters?.sort || 'featured') === option.value ? 'text-brand' : 'text-heading'}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {products?.data?.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                                {products.data.map((product) => (
                                    <div key={product.id} className="product-cart-wrap bg-white border border-border rounded-xl overflow-hidden hover:border-border-2 hover:shadow-lg transition-all group">
                                        <div className="relative">
                                            <Link href={route('product.detail', product.slug)} className="block overflow-hidden">
                                                {product.primary_image ? (
                                                    <img src={`/storage/${product.primary_image}`} alt={product.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-400">No image</span>
                                                    </div>
                                                )}
                                            </Link>
                                            {(product.is_on_sale || product.is_featured) && (
                                                <div className="absolute top-3 left-3">
                                                    <span className={`${getBadgeClass(product)} text-white text-xs font-semibold px-2 py-1 rounded`}>
                                                        {getBadgeText(product)}
                                                    </span>
                                                </div>
                                            )}
                                            {!product.is_in_stock && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">Out of Stock</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-brand hover:text-white transition-colors">
                                                    <i className="fi-rs-heart"></i>
                                                </button>
                                                <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-brand hover:text-white transition-colors">
                                                    <i className="fi-rs-shuffle"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {product.category && (
                                                <Link href={route('shop', { category: product.category.slug })} className="text-xs text-muted hover:text-brand">
                                                    {product.category.name}
                                                </Link>
                                            )}
                                            <h6 className="font-quicksand font-semibold text-heading text-sm mt-1 mb-2 line-clamp-2">
                                                <Link href={route('product.detail', product.slug)} className="hover:text-brand">{product.name}</Link>
                                            </h6>
                                            {product.rating > 0 && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <i key={i} className={`fi-rs-star text-xs ${i < Math.floor(product.rating) ? '' : 'text-gray-300'}`}></i>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-muted">({product.reviews_count || 0})</span>
                                                </div>
                                            )}
                                            {product.seller && (
                                                <p className="text-xs text-muted mb-3">By <span className="text-brand">{product.seller.name}</span></p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-brand font-bold text-lg">{formatCurrency(product.price)}</span>
                                                    {product.compare_price && product.compare_price > product.price && (
                                                        <span className="text-muted line-through text-sm ml-2">{formatCurrency(product.compare_price)}</span>
                                                    )}
                                                </div>
                                                <button
                                                    disabled={!product.is_in_stock}
                                                    className="w-9 h-9 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <i className="fi-rs-shopping-cart"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <i className="fi-rs-box text-6xl text-gray-300 mb-4"></i>
                                <h3 className="text-xl font-semibold text-heading mb-2">No products found</h3>
                                <p className="text-body mb-6">Try adjusting your filters or search terms</p>
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-md font-semibold transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {products?.last_page > 1 && (
                            <nav className="flex items-center justify-center gap-2 mb-10">
                                {products.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 flex items-center justify-center border rounded-md transition-colors ${
                                            link.active
                                                ? 'border-brand bg-brand text-white'
                                                : link.url
                                                ? 'border-border hover:border-brand hover:text-brand'
                                                : 'border-border text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        )}
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}

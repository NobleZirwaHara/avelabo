import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Header({ isSticky, onMobileMenuToggle }) {
    const { currencies, counts, headerCategories, siteSettings } = usePage().props;
    const [categoriesOpen, setCategoriesOpen] = useState(false);

    const selectedCurrency = currencies?.selected || currencies?.default;
    const activeCurrencies = currencies?.active || [];

    const handleCurrencyChange = (code) => {
        router.post(route('currency.set'), { code }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const categories = headerCategories || [];

    return (
        <>
            {/* Top Bar */}
            {/* <div className="hidden lg:block bg-white border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-6 text-body">
                            <Link href="/about" className="hover:text-brand transition-colors">About Us</Link>
                            <span>|</span>
                            <Link href="/account" className="hover:text-brand transition-colors">My Account</Link>
                            <span>|</span>
                            <Link href="/wishlist" className="hover:text-brand transition-colors">Wishlist</Link>
                            <span>|</span>
                            <Link href="/account" className="hover:text-brand transition-colors">Order Tracking</Link>
                        </div>
                        <div className="flex items-center gap-4 text-body">
                            <span>Need help? Call Us: <strong className="text-brand">{siteSettings?.site_phone || '+265 999 123 456'}</strong></span>
                            <span>|</span>
                            <select className="bg-transparent border-none text-sm cursor-pointer">
                                <option>English</option>
                            </select>
                            <select
                                className="bg-transparent border-none text-sm cursor-pointer"
                                value={selectedCurrency?.code || 'MWK'}
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                            >
                                {activeCurrencies.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Middle Header */}
            <div className="bg-white py-4 lg:py-6 border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0">
                            <img
                                src="/images/logo/logo-web-small.png"
                                alt={siteSettings?.site_name || 'Avelabo'}
                                className="h-10 lg:h-12"
                            />
                        </Link>

                        {/* Search Bar */}
                        <div className="hidden lg:flex flex-1 max-w-2xl">
                            <div className="flex w-full">
                                {/* <select className="border border-r-0 border-gray-200 rounded-l-md px-4 py-3 bg-gray-50 text-sm">
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.slug}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select> */}
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search for items..."
                                        className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:ring-0"
                                    />
                                </div>
                                <button className="bg-brand hover:bg-brand-dark text-white px-6 rounded-r-md transition-colors">
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-4 lg:gap-6">

                            {/* Wishlist */}
                            <Link href="/wishlist" className="hidden lg:flex items-center gap-2 text-heading hover:text-brand transition-colors">
                                <div className="relative">
                                    <img src="/images/frontend/theme/icons/icon-heart.svg" alt="Wishlist" className="w-6 h-6" />
                                    <span className="absolute -top-2 -right-2 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {counts?.wishlist || 0}
                                    </span>
                                </div>
                                <span className="text-sm">Wishlist</span>
                            </Link>

                            {/* Basket */}
                            <Link href="/cart" className="flex items-center gap-2 text-heading hover:text-brand transition-colors">
                                <div className="relative">
                                    <img src="/images/frontend/theme/icons/icon-cart.svg" alt="Basket" className="w-6 h-6" />
                                    <span className="absolute -top-2 -right-2 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {counts?.cart || 0}
                                    </span>
                                </div>
                                <span className="hidden lg:block text-sm">Basket</span>
                            </Link>

                            {/* Account */}
                            <Link href="/account" className="hidden lg:flex items-center gap-2 text-heading hover:text-brand transition-colors">
                                <img src="/images/frontend/theme/icons/icon-user.svg" alt="Account" className="w-6 h-6" />
                                <span className="text-sm">Account</span>
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={onMobileMenuToggle}
                                className="lg:hidden p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Header / Navigation */}
            <div className={`bg-white border-b border-gray-100 ${isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-md header-sticky' : ''}`}>
                <div className="container mx-auto px-4">
                    <div className="hidden lg:flex items-center justify-between py-3">
                        {/* Categories Dropdown */}
                        {(
                            <div className="relative">
                                <button
                                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                                    className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-md hover:bg-brand-dark transition-colors font-quicksand"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span className="font-semibold">All</span>
                                    <svg className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {categoriesOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-2 max-h-[400px] overflow-y-auto">
                                        {categories.length > 0 ? (
                                            categories.map((category) => (
                                                <Link
                                                    key={category.id}
                                                    href={`/shop?category=${category.slug}`}
                                                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group"
                                                    onClick={() => setCategoriesOpen(false)}
                                                >
                                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 group-hover:bg-brand/10 rounded-lg flex-shrink-0">
                                                        {category.icon ? (
                                                            <span className="material-icons text-brand text-lg">{category.icon}</span>
                                                        ) : (
                                                            <span className="material-icons text-gray-400 text-lg">category</span>
                                                        )}
                                                    </span>
                                                    <span className="text-heading group-hover:text-brand text-sm font-medium">{category.name}</span>
                                                </Link>
                                            ))
                                        ) : (
                                            <p className="px-5 py-3 text-body text-sm">No categories available</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Main Navigation / Categories */}
                        
                            <nav className="flex items-center gap-2 font-quicksand overflow-x-auto">
                                {/* <Link href="/shop" className="text-heading hover:text-brand hover:bg-gray-100 font-semibold text-sm transition-all whitespace-nowrap px-4 py-2 rounded-md">All</Link> */}
                                {categories.slice(0, 8).map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/shop?category=${category.slug}`}
                                        className="text-heading hover:text-brand hover:bg-gray-100 font-semibold text-sm transition-all whitespace-nowrap px-4 py-2 rounded-md"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </nav>
                        

                        {/* Cart Icon (Sticky Nav) */}
                        {isSticky && (
                            <Link href="/cart" className="flex items-center gap-2 text-heading hover:text-brand hover:bg-gray-100 transition-all px-4 py-2 rounded-md">
                                <div className="relative">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {counts?.cart > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {counts.cart}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-semibold">Basket</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

import { Head, Link, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import HeroSlider from '@/Components/Frontend/HeroSlider';
import CategorySlider from '@/Components/Frontend/CategorySlider';
import ProductCard from '@/Components/Frontend/ProductCard';
import { useState, useEffect } from 'react';

export default function Home({
    featuredProducts = [],
    popularProducts = [],
    newProducts = [],
    saleProducts = [],
    categories = [],
    bestSellers = [],
    dailyDeals = [],
}) {
    const [activeTab, setActiveTab] = useState('all');
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    // Countdown timer for daily deals (ends at midnight)
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;

            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                secs: Math.floor((diff % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Determine which products to show based on active tab
    const getDisplayProducts = () => {
        switch (activeTab) {
            case 'featured':
                return featuredProducts;
            case 'new':
                return newProducts;
            case 'sale':
                return saleProducts;
            case 'all':
            default:
                return popularProducts.length > 0 ? popularProducts : featuredProducts;
        }
    };

    const displayProducts = getDisplayProducts();
    const dealProduct = dailyDeals[0] || featuredProducts[0];

    const handleAddToCart = (product) => {
        router.post(route('cart.add'), {
            product_id: product.id,
            quantity: 1,
        }, {
            preserveScroll: true,
        });
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'featured', label: 'Featured' },
        { id: 'new', label: 'New Arrivals' },
        { id: 'sale', label: 'On Sale' },
    ];

    // Add category tabs if we have categories
    const categoryTabs = categories.slice(0, 4).map(cat => ({
        id: `cat-${cat.slug}`,
        label: cat.name,
        slug: cat.slug,
    }));

    return (
        <FrontendLayout>
            <Head title="Home - Avelabo Marketplace" />

            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <section className="mb-12">
                    <HeroSlider />
                </section>

                {/* Featured Categories */}
                <section className="mb-12">
                    <h3 className="text-2xl font-bold text-heading mb-6 font-quicksand">Featured Categories</h3>
                    <CategorySlider categories={categories} />
                </section>

                {/* Promotional Banners */}
                <section className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { image: '/images/frontend/banner/banner-1.png', title: 'Everyday Fresh & Clean with Our Products', link: '/shop' },
                            { image: '/images/frontend/banner/banner-2.png', title: 'Make your Breakfast Healthy and Easy', link: '/shop' },
                            { image: '/images/frontend/banner/banner-3.png', title: 'The best Organic Products Online', link: '/shop' },
                        ].map((banner, index) => (
                            <Link
                                key={index}
                                href={banner.link}
                                className="relative rounded-xl overflow-hidden group h-48"
                            >
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent flex items-center p-6">
                                    <h4 className="text-white font-bold text-xl max-w-[60%]">{banner.title}</h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Popular Products */}
                <section className="mb-12">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-2xl font-bold text-heading font-quicksand">Popular Products</h3>
                        <div className="flex flex-wrap gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-brand text-white'
                                            : 'text-heading hover:bg-gray-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {displayProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {displayProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <i className="fi-rs-shopping-bag text-5xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500">No products available yet</p>
                            <Link href="/shop" className="inline-block mt-4 px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors">
                                Browse Shop
                            </Link>
                        </div>
                    )}
                </section>

                {/* Deals Section */}
                <section className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Deal of the Day */}
                        <div className="lg:col-span-1 bg-brand-light rounded-xl p-6">
                            <h3 className="text-xl font-bold text-heading mb-4 font-quicksand">Deal Of The Day</h3>
                            {dealProduct ? (
                                <div className="bg-white rounded-xl p-4">
                                    <Link href={route('product.detail', dealProduct.slug)}>
                                        <img
                                            src={dealProduct.primary_image || '/images/frontend/placeholder-product.png'}
                                            alt={dealProduct.name}
                                            className="w-full aspect-square object-contain mb-4 hover:scale-105 transition-transform"
                                        />
                                    </Link>
                                    <Link href={route('product.detail', dealProduct.slug)}>
                                        <h6 className="font-semibold text-heading mb-2 hover:text-brand transition-colors line-clamp-2">
                                            {dealProduct.name}
                                        </h6>
                                    </Link>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-brand font-bold text-xl">{formatCurrency(dealProduct.price)}</span>
                                        {dealProduct.compare_price && (
                                            <span className="text-body line-through text-sm">{formatCurrency(dealProduct.compare_price)}</span>
                                        )}
                                    </div>
                                    {/* Countdown Timer */}
                                    <div className="flex gap-2 mb-4">
                                        {[
                                            { value: countdown.days, label: 'Days' },
                                            { value: countdown.hours, label: 'Hours' },
                                            { value: countdown.mins, label: 'Mins' },
                                            { value: countdown.secs, label: 'Secs' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-brand/10 rounded px-2 py-1 text-center flex-1">
                                                <span className="text-brand font-bold">{String(item.value).padStart(2, '0')}</span>
                                                <span className="text-xs text-body block">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(dealProduct)}
                                        className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-md font-semibold transition-colors"
                                    >
                                        Add To Cart
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl p-4 text-center text-gray-500">
                                    No deals available
                                </div>
                            )}
                        </div>

                        {/* Product Columns */}
                        {[
                            { title: 'Top Selling', products: bestSellers },
                            { title: 'Trending Products', products: popularProducts.slice(0, 3) },
                            { title: 'Recently Added', products: newProducts.slice(0, 3) },
                        ].map((column, colIndex) => (
                            <div key={colIndex}>
                                <h3 className="text-xl font-bold text-heading mb-4 font-quicksand">{column.title}</h3>
                                <div className="space-y-4">
                                    {column.products.length > 0 ? (
                                        column.products.slice(0, 3).map((product) => (
                                            <Link
                                                key={product.id}
                                                href={route('product.detail', product.slug)}
                                                className="flex gap-4 items-center bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={product.primary_image || '/images/frontend/placeholder-product.png'}
                                                    alt={product.name}
                                                    className="w-20 h-20 object-contain"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h6 className="text-heading font-semibold text-sm mb-1 line-clamp-2">{product.name}</h6>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg
                                                                key={i}
                                                                className={`w-3 h-3 ${i < (product.rating || 0) ? 'text-brand-2' : 'text-gray-300'}`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                    <span className="text-brand font-bold">{formatCurrency(product.price)}</span>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                                            No products yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* View All Products CTA */}
                <section className="text-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                    >
                        View All Products
                        <i className="fi-rs-arrow-right"></i>
                    </Link>
                </section>
            </div>
        </FrontendLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function PurchaseGuide({ pageContent = {}, categories = [], trendingProducts = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const content = pageContent.content || {};

    const sections = content.sections || [
        {
            title: '1. Create Your Account',
            content: 'Register for a free account to start shopping. You can also checkout as a guest for quick purchases.',
            items: ['Name and email address', 'Phone number for delivery updates', 'Delivery address'],
        },
        {
            title: '2. Browse & Select Products',
            content: 'Explore our wide range of products from trusted sellers. Use filters to find exactly what you need.',
        },
        {
            title: '3. Add to Cart & Checkout',
            content: 'Add items to your cart and proceed to checkout when ready. Review your order before payment.',
        },
        {
            title: '4. Make Payment',
            content: 'Pay securely using your preferred method. We accept mobile money and card payments.',
            items: ['Airtel Money', 'TNM Mpamba', 'Visa/Mastercard'],
        },
        {
            title: '5. Track Your Order',
            content: 'Track your order status from your account dashboard. You\'ll receive SMS updates at each stage.',
        },
        {
            title: '6. Receive Your Delivery',
            content: 'Your order will be delivered to your specified address. Inspect before accepting delivery.',
        },
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = route('shop') + '?search=' + encodeURIComponent(searchQuery);
        }
    };

    return (
        <FrontendLayout>
            <Head title={pageContent.meta_title || pageContent.title || "Purchase Guide"} />

            {/* Breadcrumb */}
            <section className="bg-gray-50 py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-400 hover:text-brand transition-colors flex items-center gap-1">
                            <i className="fi fi-rs-home text-xs"></i> Home
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-brand">Purchase Guide</span>
                    </nav>
                </div>
            </section>

            {/* Page Content */}
            <section className="py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Column - Main Content */}
                            <div className="lg:w-9/12">
                                <div className="pr-0 lg:pr-8">
                                    {/* Header */}
                                    <div className="mb-8">
                                        <h1 className="font-quicksand font-bold text-3xl lg:text-4xl text-heading mb-4">
                                            {pageContent.title || 'Purchase Guide'}
                                        </h1>
                                        <p className="text-gray-500">
                                            Everything you need to know about shopping on Avelabo
                                        </p>
                                    </div>

                                    {/* Featured Image */}
                                    <figure className="mb-8">
                                        <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-8 text-white">
                                            <h2 className="text-2xl font-bold mb-4">Shop with Confidence</h2>
                                            <p className="text-white/90">
                                                Avelabo connects you with trusted sellers across Malawi.
                                                Enjoy secure payments, quality products, and reliable delivery.
                                            </p>
                                        </div>
                                    </figure>

                                    {/* Guide Content */}
                                    <div className="space-y-8">
                                        {sections.map((section, index) => (
                                            <div key={index}>
                                                <h3 className="font-quicksand font-bold text-xl text-heading mb-4">{section.title}</h3>
                                                <p className="text-gray-500 mb-4">{section.content}</p>
                                                {section.items && section.items.length > 0 && (
                                                    <ul className="list-disc list-inside space-y-2 text-gray-500 ml-4">
                                                        {section.items.map((item, itemIndex) => (
                                                            <li key={itemIndex}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div className="mt-12 bg-brand/10 rounded-xl p-8 text-center">
                                        <h3 className="text-2xl font-bold text-heading font-quicksand mb-4">Ready to start shopping?</h3>
                                        <p className="text-gray-600 mb-6">Browse thousands of products from trusted sellers</p>
                                        <Link
                                            href={route('shop')}
                                            className="inline-block bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-lg font-semibold transition-colors"
                                        >
                                            Browse Products
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="lg:w-3/12">
                                <div className="space-y-8">
                                    {/* Search Widget */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                                        <form onSubmit={handleSearch} className="flex border border-gray-200 rounded-md overflow-hidden">
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="flex-1 px-4 py-3 focus:outline-none text-sm"
                                            />
                                            <button type="submit" className="px-4 text-brand hover:text-brand-dark transition-colors">
                                                <i className="fi fi-rs-search"></i>
                                            </button>
                                        </form>
                                    </div>

                                    {/* Category Widget */}
                                    {categories.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                                            <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-3 border-b border-gray-200">Categories</h5>
                                            <ul className="space-y-3">
                                                {categories.map((category) => (
                                                    <li key={category.id}>
                                                        <Link href={route('shop') + `?category=${category.slug}`} className="flex items-center justify-between text-heading hover:text-brand transition-colors">
                                                            <span className="flex items-center gap-3">
                                                                {category.icon && <img src={category.icon} alt="" className="w-6" />}
                                                                {category.name}
                                                            </span>
                                                            <span className="text-gray-400 text-sm">{category.products_count}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Trending Now Widget */}
                                    {trendingProducts.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-5">
                                            <h5 className="font-quicksand font-bold text-heading text-lg mb-5 pb-3 border-b border-gray-200">Trending Now</h5>
                                            <div className="space-y-4">
                                                {trendingProducts.map((product) => (
                                                    <div key={product.id} className="flex gap-3">
                                                        <Link href={route('product.detail', product.slug)} className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src={product.image || '/images/frontend/placeholder-product.png'} alt={product.name} className="w-full h-full object-cover" />
                                                        </Link>
                                                        <div className="flex-1 pt-1">
                                                            <h6 className="font-quicksand font-semibold text-heading text-sm hover:text-brand mb-1">
                                                                <Link href={route('product.detail', product.slug)}>{product.name}</Link>
                                                            </h6>
                                                            <p className="text-brand font-bold text-sm mb-1">{formatCurrency(product.price)}</p>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <i
                                                                        key={i}
                                                                        className={`fi fi-rs-star text-xs ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                    ></i>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Help Banner */}
                                    <div className="bg-brand rounded-xl p-6 text-white">
                                        <h5 className="font-bold text-lg mb-3">Need Help?</h5>
                                        <p className="text-white/90 text-sm mb-4">
                                            Our support team is here to help you with any questions.
                                        </p>
                                        <Link
                                            href={route('contact')}
                                            className="inline-block bg-white text-brand px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors"
                                        >
                                            Contact Us
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}

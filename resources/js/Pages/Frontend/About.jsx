import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function About() {
    const stats = [
        { number: '10K+', label: 'Products' },
        { number: '500+', label: 'Vendors' },
        { number: '50K+', label: 'Customers' },
        { number: '100K+', label: 'Orders Delivered' },
    ];

    const team = [
        { name: 'John Doe', role: 'CEO & Founder', image: '/images/frontend/team/team-1.png' },
        { name: 'Jane Smith', role: 'Operations Manager', image: '/images/frontend/team/team-2.png' },
        { name: 'Mike Johnson', role: 'Tech Lead', image: '/images/frontend/team/team-3.png' },
        { name: 'Sarah Williams', role: 'Customer Success', image: '/images/frontend/team/team-4.png' },
    ];

    return (
        <FrontendLayout>
            <Head title="About Us" />

            {/* Breadcrumb */}
            <div className="bg-gray-50 py-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-body hover:text-brand">Home</Link>
                        <span className="text-body">/</span>
                        <span className="text-brand">About Us</span>
                    </nav>
                </div>
            </div>

            {/* Hero Section */}
            <section className="py-16 bg-gradient-to-r from-brand-light to-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-heading mb-6 font-quicksand">
                                Welcome to Avelabo Marketplace
                            </h1>
                            <p className="text-body text-lg mb-6">
                                Avelabo is Malawi's premier multi-vendor ecommerce marketplace, connecting South African
                                and Middle Eastern suppliers with Malawian customers through local sellers who handle
                                last-mile delivery.
                            </p>
                            <p className="text-body mb-8">
                                Our mission is to bring quality products from around the world to Malawian doorsteps,
                                while empowering local entrepreneurs to build sustainable businesses.
                            </p>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                            >
                                Start Shopping
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="relative">
                            <img
                                src="/images/frontend/about/about-hero.png"
                                alt="About Avelabo"
                                className="rounded-xl shadow-lg"
                                onError={(e) => { e.target.src = '/images/frontend/placeholder-product.png'; }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-brand">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.number}</p>
                                <p className="text-white/80">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-heading mb-4 font-quicksand">How Avelabo Works</h2>
                        <p className="text-body max-w-2xl mx-auto">
                            Our unique model connects international suppliers with local delivery partners
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '🌍',
                                title: 'Global Sourcing',
                                description: 'We source quality products from trusted suppliers in South Africa, UAE, and beyond.'
                            },
                            {
                                icon: '🏪',
                                title: 'Local Sellers',
                                description: 'Local entrepreneurs manage inventory and handle customer relationships.'
                            },
                            {
                                icon: '🚚',
                                title: 'Fast Delivery',
                                description: 'Products are delivered to your doorstep by our reliable local delivery network.'
                            },
                        ].map((item, index) => (
                            <div key={index} className="text-center p-8 bg-gray-50 rounded-xl">
                                <div className="text-5xl mb-4">{item.icon}</div>
                                <h3 className="text-xl font-bold text-heading mb-3">{item.title}</h3>
                                <p className="text-body">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <img
                                src="/images/frontend/about/why-choose.png"
                                alt="Why Choose Us"
                                className="rounded-xl"
                                onError={(e) => { e.target.src = '/images/frontend/placeholder-product.png'; }}
                            />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-heading mb-6 font-quicksand">Why Choose Avelabo?</h2>
                            <div className="space-y-6">
                                {[
                                    {
                                        title: 'Quality Guaranteed',
                                        description: 'All products are verified and come with quality assurance.'
                                    },
                                    {
                                        title: 'Competitive Prices',
                                        description: 'We negotiate the best prices with suppliers to save you money.'
                                    },
                                    {
                                        title: 'Secure Payments',
                                        description: 'Multiple payment options including mobile money and bank transfers.'
                                    },
                                    {
                                        title: 'Local Support',
                                        description: '24/7 customer support from our team based in Malawi.'
                                    },
                                ].map((item, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-heading mb-1">{item.title}</h3>
                                            <p className="text-body">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-brand">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4 font-quicksand">Ready to Start Shopping?</h2>
                    <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied customers and discover amazing products at great prices.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/shop"
                            className="px-8 py-4 bg-white text-brand hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                        >
                            Browse Products
                        </Link>
                        <Link
                            href="/vendor-guide"
                            className="px-8 py-4 bg-brand-dark text-white hover:bg-brand-darker rounded-lg font-semibold transition-colors"
                        >
                            Become a Vendor
                        </Link>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}

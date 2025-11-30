import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function PrivacyPolicy({ pageContent = {}, categories = [] }) {
    const content = pageContent.content || {};

    const sections = content.sections || [
        {
            title: 'Introduction',
            content: 'Welcome to Avelabo. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.',
        },
        {
            title: 'Information We Collect',
            content: 'We collect personal information that you voluntarily provide to us when you register, make a purchase, or contact us.',
            items: [
                'Personal identification (name, email, phone)',
                'Payment information (processed securely by our payment partners)',
                'Delivery addresses',
                'Order history and preferences',
            ],
        },
        {
            title: 'How We Use Your Information',
            content: 'We use the information we collect to:',
            items: [
                'Process and fulfill your orders',
                'Send order confirmations and updates',
                'Respond to your inquiries and provide customer support',
                'Improve our website and services',
                'Send promotional communications (with your consent)',
            ],
        },
        {
            title: 'Information Sharing',
            content: 'We share your information only with trusted third parties who assist us in operating our website, conducting our business, or servicing you.',
            items: [
                'Sellers (to fulfill your orders)',
                'Payment processors (to process transactions)',
                'Delivery partners (to deliver your orders)',
            ],
        },
        {
            title: 'Data Security',
            content: 'We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.',
        },
        {
            title: 'Your Rights',
            content: 'You have the right to access, update, or delete your personal information. Contact us at privacy@avelabo.com for any requests.',
        },
        {
            title: 'Contact Us',
            content: 'If you have questions about this Privacy Policy, please contact us at privacy@avelabo.com or through our contact page.',
        },
    ];

    return (
        <FrontendLayout>
            <Head title={pageContent.meta_title || pageContent.title || "Privacy Policy"} />

            {/* Breadcrumb */}
            <section className="bg-gray-50 py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-400 hover:text-brand transition-colors flex items-center gap-1">
                            <i className="fi fi-rs-home text-xs"></i> Home
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-brand">Privacy Policy</span>
                    </nav>
                </div>
            </section>

            {/* Privacy Policy Content */}
            <section className="py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Column - Main Content */}
                            <div className="lg:w-9/12">
                                <article className="lg:pr-8">
                                    {/* Article Header */}
                                    <header className="mb-8 border-b border-gray-200 pb-6">
                                        <h1 className="font-quicksand font-bold text-3xl lg:text-4xl text-heading mb-4">
                                            {pageContent.title || 'Privacy Policy'}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                            <span>Last updated: {content.last_updated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    </header>

                                    {/* Article Content */}
                                    <div className="prose prose-lg max-w-none">
                                        {sections.map((section, index) => (
                                            <div key={index} className="mb-8">
                                                <h4 className="font-quicksand font-bold text-xl text-heading mb-4 mt-8">{section.title}</h4>
                                                <p className="text-gray-500 mb-4">{section.content}</p>
                                                {section.items && section.items.length > 0 && (
                                                    <ul className="list-disc list-outside ml-6 space-y-2 text-gray-500">
                                                        {section.items.map((item, itemIndex) => (
                                                            <li key={itemIndex}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Contact Section */}
                                    <div className="mt-12 bg-gray-50 rounded-xl p-8">
                                        <h3 className="text-xl font-bold text-heading font-quicksand mb-4">Questions?</h3>
                                        <p className="text-gray-600 mb-4">
                                            If you have any questions about our Privacy Policy, please don't hesitate to contact us.
                                        </p>
                                        <Link
                                            href={route('contact')}
                                            className="inline-block bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                        >
                                            Contact Us
                                        </Link>
                                    </div>
                                </article>
                            </div>

                            {/* Right Column - Sidebar */}
                            <aside className="lg:w-3/12">
                                {/* Quick Links */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                                    <h5 className="font-quicksand font-bold text-heading text-lg mb-6 pb-4 border-b border-gray-200">Quick Links</h5>
                                    <ul className="space-y-3">
                                        {sections.map((section, index) => (
                                            <li key={index}>
                                                <a href={`#section-${index}`} className="text-heading hover:text-brand transition-colors text-sm">
                                                    {section.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Category Widget */}
                                {categories.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h5 className="font-quicksand font-bold text-heading text-lg mb-6 pb-4 border-b border-gray-200">Browse Categories</h5>
                                        <ul className="space-y-3">
                                            {categories.map((category) => (
                                                <li key={category.id}>
                                                    <Link href={route('shop') + `?category=${category.slug}`} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            {category.icon && <img src={category.icon} alt="" className="w-7" />}
                                                            <span className="text-heading group-hover:text-brand transition-colors">{category.name}</span>
                                                        </div>
                                                        <span className="text-brand font-semibold">{category.products_count}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Other Legal Links */}
                                <div className="bg-gray-50 rounded-xl p-6 mt-6">
                                    <h5 className="font-quicksand font-bold text-heading text-lg mb-4">Legal</h5>
                                    <ul className="space-y-2">
                                        <li>
                                            <Link href={route('privacy.policy')} className="text-brand hover:text-brand-dark text-sm font-medium">
                                                Privacy Policy
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route('purchase.guide')} className="text-heading hover:text-brand text-sm">
                                                Purchase Guide
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route('vendor.guide')} className="text-heading hover:text-brand text-sm">
                                                Seller Guide
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}

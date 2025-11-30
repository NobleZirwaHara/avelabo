import { Head, Link, useForm } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function VendorGuide({ pageContent = {} }) {
    const content = pageContent.content || {};

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        telephone: '',
        subject: 'Seller Inquiry',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('contact.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setData({
                    name: '',
                    email: '',
                    telephone: '',
                    subject: 'Seller Inquiry',
                    message: ''
                });
            },
        });
    };

    const hero = content.hero || {
        title: 'Start selling on Avelabo today',
        subtitle: 'Join our marketplace and reach thousands of customers across Malawi.',
    };

    const features = content.features || [
        {
            icon: '/images/frontend/icons/icon-1.svg',
            title: 'Low Commission Rates',
            description: 'Keep more of your profits with our competitive commission structure.',
        },
        {
            icon: '/images/frontend/icons/icon-2.svg',
            title: 'Wide Customer Base',
            description: 'Access thousands of customers across Malawi.',
        },
        {
            icon: '/images/frontend/icons/icon-3.svg',
            title: 'Secure Payments',
            description: 'Receive payments via mobile money or bank transfer.',
        },
    ];

    const steps = content.steps || [
        {
            title: '1. Register Your Account',
            content: 'Create your seller account by providing your business details and contact information.',
            items: ['Business name and type', 'Contact information', 'ID verification'],
        },
        {
            title: '2. Complete KYC Verification',
            content: 'Submit your KYC documents for review. Our team will verify within 24-48 hours.',
        },
        {
            title: '3. Add Your Products',
            content: 'Start adding products with clear photos, descriptions, and competitive pricing.',
        },
        {
            title: '4. Start Selling',
            content: 'Your products will be visible to customers. Manage orders from your dashboard.',
        },
        {
            title: '5. Receive Payments',
            content: 'Get paid via Airtel Money, TNM Mpamba, or bank transfer.',
        },
    ];

    return (
        <FrontendLayout>
            <Head title={pageContent.meta_title || pageContent.title || "Become a Seller"} />

            {/* Breadcrumb */}
            <div className="bg-white py-4 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-brand transition-colors">
                            <i className="fi fi-rs-home"></i>
                        </Link>
                        <span className="text-gray-500">/</span>
                        <span className="text-brand">Become a Seller</span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="py-12 lg:py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center mb-16">
                        <h1 className="text-3xl lg:text-5xl font-bold text-heading font-quicksand mb-6">
                            {hero.title}
                        </h1>
                        <p className="text-lg text-gray-500">
                            {hero.subtitle}
                        </p>
                        <Link
                            href={route('seller.register')}
                            className="inline-block mt-8 bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-lg font-semibold transition-colors"
                        >
                            Start Selling Now
                        </Link>
                    </div>

                    {/* Feature Cards */}
                    <div className="max-w-5xl mx-auto mb-16">
                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-white rounded-xl p-8 text-center border border-gray-100 hover:shadow-lg hover:border-brand transition-all">
                                    <img src={feature.icon} alt={feature.title} className="w-16 h-16 mx-auto mb-6" />
                                    <h4 className="text-xl font-bold text-heading font-quicksand mb-4">{feature.title}</h4>
                                    <p className="text-gray-500 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Guide Content */}
                    <div className="max-w-3xl mx-auto">
                        <div className="prose prose-lg mb-12">
                            {steps.map((step, index) => (
                                <div key={index} className="mb-10">
                                    <h3 className="text-2xl font-bold text-heading font-quicksand mb-4">{step.title}</h3>
                                    <p className="text-gray-500 mb-4">{step.content}</p>
                                    {step.items && step.items.length > 0 && (
                                        <ul className="list-disc list-inside space-y-2 text-gray-500 mb-6">
                                            {step.items.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="bg-brand/10 rounded-xl p-8 text-center mb-12">
                            <h3 className="text-2xl font-bold text-heading font-quicksand mb-4">Ready to start selling?</h3>
                            <p className="text-gray-600 mb-6">Join thousands of successful sellers on Avelabo</p>
                            <Link
                                href={route('seller.register')}
                                className="inline-block bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-lg font-semibold transition-colors"
                            >
                                Register as a Seller
                            </Link>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-xl p-8 lg:p-10 border border-gray-100">
                            <h5 className="text-brand font-semibold mb-2">Have questions?</h5>
                            <h2 className="text-2xl font-bold text-heading font-quicksand mb-2">Contact Us</h2>
                            <p className="text-gray-500 text-sm mb-8">We're here to help you get started</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Your Email"
                                            className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                        />
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>
                                </div>
                                <div>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
                                        placeholder="Your Phone"
                                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none"
                                    />
                                </div>
                                <textarea
                                    name="message"
                                    rows="5"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Your Message"
                                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:border-brand focus:outline-none resize-none"
                                ></textarea>
                                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-md font-semibold transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Blog({ posts = [] }) {
    return (
        <FrontendLayout>
            <Head title="Blog" />

            {/* Breadcrumb */}
            <div className="bg-gray-50 py-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-body hover:text-brand">Home</Link>
                        <span className="text-body">/</span>
                        <span className="text-brand">Blog</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-heading mb-4 font-quicksand">Our Blog</h1>
                    <p className="text-body max-w-2xl mx-auto">
                        Stay updated with the latest news, tips, and insights from Avelabo marketplace.
                    </p>
                </div>

                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <article key={post.id} className="bg-white rounded-xl shadow-card overflow-hidden group">
                                <Link href={`/blog/${post.slug}`}>
                                    <img
                                        src={post.image || '/images/frontend/placeholder-blog.png'}
                                        alt={post.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </Link>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-sm text-body mb-3">
                                        <span>{post.category}</span>
                                        <span>•</span>
                                        <span>{post.date}</span>
                                    </div>
                                    <Link href={`/blog/${post.slug}`}>
                                        <h2 className="text-xl font-bold text-heading mb-3 hover:text-brand transition-colors line-clamp-2">
                                            {post.title}
                                        </h2>
                                    </Link>
                                    <p className="text-body mb-4 line-clamp-3">{post.excerpt}</p>
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="text-brand font-semibold hover:text-brand-dark transition-colors inline-flex items-center gap-2"
                                    >
                                        Read More
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-heading mb-2">No Blog Posts Yet</h3>
                        <p className="text-body mb-6">We're working on some great content. Check back soon!</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                )}
            </div>
        </FrontendLayout>
    );
}

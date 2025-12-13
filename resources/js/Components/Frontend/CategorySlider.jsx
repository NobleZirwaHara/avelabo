import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Link } from '@inertiajs/react';

import 'swiper/css';
import 'swiper/css/navigation';

// Default background colors for categories
const bgColors = ['#F2FCE4', '#FFFCEB', '#ECFFEC', '#FEEFEA', '#FFF3EB', '#FFF3FF', '#F2FCE4', '#FEEFEA', '#FFFCEB', '#FEEFEA'];

// Default categories for fallback
const defaultCategories = [
    { name: 'Electronics', slug: 'electronics', image: '/images/frontend/shop/cat-1.png', products_count: 0 },
    { name: 'Fashion', slug: 'fashion', image: '/images/frontend/shop/cat-2.png', products_count: 0 },
    { name: 'Home & Garden', slug: 'home-garden', image: '/images/frontend/shop/cat-3.png', products_count: 0 },
    { name: 'Sports', slug: 'sports', image: '/images/frontend/shop/cat-4.png', products_count: 0 },
    { name: 'Beauty', slug: 'beauty', image: '/images/frontend/shop/cat-5.png', products_count: 0 },
];

export default function CategorySlider({ categories = [] }) {
    // Use passed categories or fall back to defaults
    const displayCategories = categories.length > 0 ? categories : defaultCategories;

    return (
        <div className="relative">
            <Swiper
                modules={[Navigation]}
                slidesPerView={2}
                spaceBetween={16}
                navigation={{
                    nextEl: '.category-next',
                    prevEl: '.category-prev',
                }}
                breakpoints={{
                    480: { slidesPerView: 3, spaceBetween: 16 },
                    640: { slidesPerView: 4, spaceBetween: 16 },
                    768: { slidesPerView: 5, spaceBetween: 20 },
                    1024: { slidesPerView: 8, spaceBetween: 20 },
                    1280: { slidesPerView: 10, spaceBetween: 24 },
                }}
                className="categories-slider"
            >
                {displayCategories.map((category, index) => (
                    <SwiperSlide key={category.id || index}>
                        <Link
                            href={`/shop?category=${category.slug || category.name?.toLowerCase().replace(/\s+/g, '-')}`}
                            className="category-card block text-center p-4 rounded-xl hover:shadow-lg transition-shadow"
                            style={{ backgroundColor: bgColors[index % bgColors.length] }}
                        >
                            <img
                                src={category.image || `/images/frontend/shop/cat-${(index % 10) + 1}.png`}
                                alt={category.name}
                                className="w-16 h-16 mx-auto mb-3 object-contain"
                                onError={(e) => { e.target.src = '/images/frontend/placeholder-category.png'; }}
                            />
                            <h6 className="text-heading font-semibold text-sm mb-1 h-10 line-clamp-2">{category.name}</h6>
                            <p className="text-body text-xs">{category.products_count || 0} items</p>
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Buttons */}
            <button className="category-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button className="category-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}

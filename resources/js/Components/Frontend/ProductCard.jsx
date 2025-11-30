import { Link } from '@inertiajs/react';

export default function ProductCard({ product }) {
    const {
        id = 1,
        name = 'Product Name',
        slug = 'product-name',
        primary_image,
        image = '/images/frontend/shop/product-1-1.jpg',
        hoverImage = '/images/frontend/shop/product-1-2.jpg',
        category,
        seller,
        rating = 0,
        reviews_count = 0,
        reviews = 0,
        price,
        currentPrice = 28.85,
        compare_price,
        oldPrice = null,
        badge = null, // 'hot', 'new', 'sale', 'best'
        discount = null, // e.g. '-15%'
        is_featured = false,
        is_new = false,
        is_on_sale = false,
    } = product || {};

    // Handle category - could be string or object
    const categoryName = typeof category === 'object' ? category?.name : category || 'General';

    // Handle seller/brand - could be string or object
    const brandName = typeof seller === 'object' ? seller?.shop_name : (seller || 'Avelabo');

    // Handle image
    const productImage = primary_image || image || '/images/frontend/placeholder-product.png';

    // Handle price
    const displayPrice = price || currentPrice || 0;
    const displayOldPrice = compare_price || oldPrice;

    // Handle reviews count
    const reviewCount = reviews_count || reviews || 0;

    // Determine badge
    const displayBadge = badge || (is_featured ? 'hot' : is_new ? 'new' : is_on_sale ? 'sale' : null);

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <svg
                    key={i}
                    className={`w-4 h-4 ${i <= rating ? 'text-brand-2' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }
        return stars;
    };

    return (
        <div className="product-card bg-white border border-gray-100 rounded-xl p-4 relative group">
            {/* Badge */}
            {displayBadge && (
                <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded badge-${displayBadge}`}>
                    {displayBadge.charAt(0).toUpperCase() + displayBadge.slice(1)}
                </span>
            )}

            {/* Discount Badge */}
            {discount && (
                <span className="absolute top-4 right-4 bg-brand-2 text-heading px-2 py-1 text-xs font-semibold rounded">
                    {discount}
                </span>
            )}

            {/* Product Image */}
            <div className="relative overflow-hidden mb-4">
                <Link href={`/product/${slug}`}>
                    <img
                        src={productImage}
                        alt={name}
                        className="w-full aspect-square object-contain transition-all"
                        onError={(e) => { e.target.src = '/images/frontend/placeholder-product.png'; }}
                    />
                </Link>

                {/* Product Actions */}
                <div className="product-actions absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-2">
                    <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Category */}
            <p className="text-xs text-body mb-2">{categoryName}</p>

            {/* Product Name */}
            <h6 className="mb-2">
                <Link href={`/product/${slug}`} className="text-heading hover:text-brand transition-colors font-semibold line-clamp-2">
                    {name}
                </Link>
            </h6>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex">{renderStars()}</div>
                <span className="text-sm text-body">({reviewCount})</span>
            </div>

            {/* Vendor */}
            <p className="text-xs text-body mb-3">
                By <span className="text-brand">{brandName}</span>
            </p>

            {/* Price & Add to Cart */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-brand font-bold text-lg">
                        {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0 }).format(displayPrice)}
                    </span>
                    {displayOldPrice && displayOldPrice > displayPrice && (
                        <span className="text-body line-through text-sm ml-2">
                            {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0 }).format(displayOldPrice)}
                        </span>
                    )}
                </div>
                <button className="bg-brand-light text-brand px-4 py-2 rounded text-sm font-semibold hover:bg-brand hover:text-white transition-colors">
                    Add
                </button>
            </div>
        </div>
    );
}

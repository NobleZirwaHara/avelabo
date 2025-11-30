import { useState } from 'react';
import { Link, Head, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function ProductDetail({ product, relatedProducts }) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState(null);

    const formatCurrency = (amount) => {
        if (typeof amount === 'object' && amount?.formatted) {
            return amount.formatted;
        }
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getCurrentPrice = () => {
        if (selectedVariant) {
            return selectedVariant.price;
        }
        return product.price;
    };

    const getComparePrice = () => {
        return product.compare_price;
    };

    const isInStock = () => {
        if (selectedVariant) {
            return selectedVariant.is_in_stock;
        }
        return product.is_in_stock;
    };

    const handleQuantityChange = (delta) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= (product.stock_quantity || 99)) {
            setQuantity(newQty);
        }
    };

    const handleVariantSelect = (variant) => {
        setSelectedVariant(variant);
    };

    const addToCart = () => {
        if (addingToCart) return;

        // Check if variant is required but not selected
        if (product.variants?.length > 0 && !selectedVariant) {
            setCartMessage({ type: 'error', text: 'Please select an option' });
            return;
        }

        setAddingToCart(true);
        setCartMessage(null);

        router.post(route('cart.add'), {
            product_id: product.id,
            quantity: quantity,
            variant_id: selectedVariant?.id || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCartMessage({ type: 'success', text: 'Added to cart!' });
                setTimeout(() => setCartMessage(null), 3000);
            },
            onError: (errors) => {
                setCartMessage({ type: 'error', text: errors.error || 'Failed to add to cart' });
            },
            onFinish: () => {
                setAddingToCart(false);
            },
        });
    };

    const images = product.images?.length > 0
        ? product.images
        : [{ id: 0, url: null, alt: product.name }];

    return (
        <FrontendLayout>
            <Head title={product.name} />

            {/* Breadcrumb */}
            <div className="py-6">
                <div className="max-w-container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-brand hover:text-brand-dark flex items-center gap-1">
                            <i className="fi-rs-home"></i> Home
                        </Link>
                        <span className="text-muted">•</span>
                        <Link href={route('shop')} className="text-muted hover:text-brand">Shop</Link>
                        {product.category && (
                            <>
                                <span className="text-muted">•</span>
                                <Link href={route('shop', { category: product.category.slug })} className="text-muted hover:text-brand">
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <span className="text-muted">•</span>
                        <span className="text-heading">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* Product Main Section */}
            <div className="max-w-container mx-auto px-4 mb-16">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Product Gallery */}
                    <div className="lg:w-1/2">
                        <div className="bg-white border border-border rounded-xl p-4 mb-4">
                            {images[selectedImage]?.url ? (
                                <img
                                    src={images[selectedImage].url}
                                    alt={images[selectedImage].alt || product.name}
                                    className="w-full aspect-square object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-lg">
                                    <span className="text-gray-400 text-xl">No image available</span>
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all ${
                                            selectedImage === index ? 'border-brand' : 'border-border hover:border-brand/50'
                                        }`}
                                    >
                                        {image.url ? (
                                            <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <i className="fi-rs-picture text-gray-400"></i>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="lg:w-1/2">
                        {/* Badges */}
                        <div className="flex gap-2 mb-3">
                            {product.is_on_sale && (
                                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                    -{product.discount_percentage}%
                                </span>
                            )}
                            {product.is_featured && (
                                <span className="bg-brand text-white text-xs font-semibold px-2 py-1 rounded">Featured</span>
                            )}
                            {product.is_new && (
                                <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">New</span>
                            )}
                        </div>

                        <h1 className="text-3xl font-quicksand font-bold text-heading mb-3">{product.name}</h1>

                        {/* Rating */}
                        {product.rating > 0 && (
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fi-rs-star ${i < Math.floor(product.rating) ? '' : 'text-gray-300'}`}></i>
                                    ))}
                                </div>
                                <span className="text-body">({product.reviews_count || 0} reviews)</span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-4xl font-bold text-brand">{formatCurrency(getCurrentPrice())}</span>
                            {getComparePrice() && (
                                <span className="text-xl text-muted line-through">{formatCurrency(getComparePrice())}</span>
                            )}
                        </div>

                        {/* Short Description */}
                        {product.short_description && (
                            <p className="text-body mb-6 leading-relaxed">{product.short_description}</p>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                isInStock()
                                    ? product.is_low_stock
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                <i className={`fi-rs-${isInStock() ? 'check' : 'cross'} text-xs`}></i>
                                {isInStock()
                                    ? product.is_low_stock
                                        ? 'Low Stock'
                                        : 'In Stock'
                                    : 'Out of Stock'
                                }
                            </span>
                            {isInStock() && product.stock_quantity && (
                                <span className="text-sm text-muted">{product.stock_quantity} units available</span>
                            )}
                        </div>

                        {/* Variants */}
                        {product.variants?.length > 0 && (
                            <div className="mb-6">
                                <h5 className="font-semibold text-heading mb-3">Select Option:</h5>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => handleVariantSelect(variant)}
                                            disabled={!variant.is_in_stock}
                                            className={`px-4 py-2 border rounded-lg text-sm transition-all ${
                                                selectedVariant?.id === variant.id
                                                    ? 'border-brand bg-brand/5 text-brand'
                                                    : variant.is_in_stock
                                                    ? 'border-border hover:border-brand'
                                                    : 'border-border text-gray-400 cursor-not-allowed line-through'
                                            }`}
                                        >
                                            {variant.attributes?.map(attr => attr.value).join(' / ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cart Message */}
                        {cartMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${
                                cartMessage.type === 'success'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {cartMessage.text}
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <div className="flex items-center border border-border rounded-lg">
                                <button
                                    onClick={() => handleQuantityChange(-1)}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                    <i className="fi-rs-minus"></i>
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 h-12 text-center border-x border-border outline-none"
                                />
                                <button
                                    onClick={() => handleQuantityChange(1)}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                    <i className="fi-rs-plus"></i>
                                </button>
                            </div>
                            <button
                                onClick={addToCart}
                                disabled={!isInStock() || addingToCart}
                                className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addingToCart ? (
                                    <>
                                        <i className="fi-rs-spinner animate-spin"></i>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <i className="fi-rs-shopping-cart"></i>
                                        Add to Cart
                                    </>
                                )}
                            </button>
                            <button className="w-12 h-12 flex items-center justify-center border border-border rounded-lg hover:border-brand hover:text-brand transition-colors">
                                <i className="fi-rs-heart"></i>
                            </button>
                            <button className="w-12 h-12 flex items-center justify-center border border-border rounded-lg hover:border-brand hover:text-brand transition-colors">
                                <i className="fi-rs-shuffle"></i>
                            </button>
                        </div>

                        {/* Product Meta */}
                        <div className="border-t border-border pt-6 space-y-2 text-sm">
                            {product.sku && (
                                <p className="text-body">
                                    <span className="font-semibold text-heading">SKU:</span> {product.sku}
                                </p>
                            )}
                            {product.category && (
                                <p className="text-body">
                                    <span className="font-semibold text-heading">Category:</span>{' '}
                                    <Link href={route('shop', { category: product.category.slug })} className="text-brand hover:text-brand-dark">
                                        {product.category.name}
                                    </Link>
                                </p>
                            )}
                            {product.brand && (
                                <p className="text-body">
                                    <span className="font-semibold text-heading">Brand:</span>{' '}
                                    <span className="text-brand">{product.brand.name}</span>
                                </p>
                            )}
                            {product.seller && (
                                <p className="text-body">
                                    <span className="font-semibold text-heading">Seller:</span>{' '}
                                    <span className="text-brand">{product.seller.name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Tabs */}
            <div className="max-w-container mx-auto px-4 mb-16">
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                    {/* Tab Headers */}
                    <div className="flex border-b border-border overflow-x-auto">
                        {['description', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-4 font-semibold text-sm whitespace-nowrap transition-colors ${
                                    activeTab === tab
                                        ? 'text-brand border-b-2 border-brand bg-brand/5'
                                        : 'text-body hover:text-heading'
                                }`}
                            >
                                {tab === 'description' ? 'Description' : `Reviews (${product.reviews_count || 0})`}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">
                        {activeTab === 'description' && (
                            <div className="prose max-w-none">
                                {product.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br>') }} />
                                ) : (
                                    <p className="text-body">No description available.</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'reviews' && (
                            <div>
                                {product.reviews?.length > 0 ? (
                                    <div className="space-y-6">
                                        {product.reviews.map((review) => (
                                            <div key={review.id} className="border-b border-border pb-6 last:border-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <i className="fi-rs-user text-gray-500"></i>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-heading">{review.user_name}</p>
                                                        <p className="text-xs text-muted">{review.created_at}</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-yellow-400 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={`fi-rs-star text-sm ${i < review.rating ? '' : 'text-gray-300'}`}></i>
                                                    ))}
                                                </div>
                                                {review.title && <p className="font-semibold text-heading mb-2">{review.title}</p>}
                                                {review.comment && <p className="text-body">{review.comment}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-body text-center py-8">No reviews yet. Be the first to review this product!</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts?.length > 0 && (
                <div className="max-w-container mx-auto px-4 mb-16">
                    <h2 className="text-2xl font-quicksand font-bold text-heading mb-6">Related Products</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {relatedProducts.map((item) => (
                            <div key={item.id} className="product-cart-wrap bg-white border border-border rounded-xl overflow-hidden hover:border-border-2 hover:shadow-lg transition-all group">
                                <div className="relative">
                                    <Link href={route('product.detail', item.slug)} className="block overflow-hidden">
                                        {item.primary_image ? (
                                            <img src={`/storage/${item.primary_image}`} alt={item.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </Link>
                                </div>
                                <div className="p-4">
                                    <h6 className="font-quicksand font-semibold text-heading text-sm mb-2 line-clamp-2">
                                        <Link href={route('product.detail', item.slug)} className="hover:text-brand">{item.name}</Link>
                                    </h6>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-brand font-bold">{formatCurrency(item.price)}</span>
                                            {item.compare_price && item.compare_price > item.price && (
                                                <span className="text-muted line-through text-sm ml-2">{formatCurrency(item.compare_price)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </FrontendLayout>
    );
}

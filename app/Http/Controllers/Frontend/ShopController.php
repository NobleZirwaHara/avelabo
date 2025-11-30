<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\PriceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function __construct(
        protected PriceService $priceService
    ) {}

    /**
     * Display the shop page with product listings
     */
    public function index(Request $request)
    {
        $query = Product::with(['category:id,name,slug', 'seller:id,shop_name', 'images'])
            ->active()
            ->inStock();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $category = Category::where('slug', $request->category)->first();
            if ($category) {
                // Include subcategory products
                $categoryIds = collect([$category->id]);
                $childIds = $category->children()->pluck('id');
                $categoryIds = $categoryIds->merge($childIds);
                $query->whereIn('category_id', $categoryIds);
            }
        }

        // Brand filter
        if ($request->filled('brand')) {
            $query->where('brand_id', $request->brand);
        }

        // Seller filter
        if ($request->filled('seller')) {
            $query->where('seller_id', $request->seller);
        }

        // Price range filter (using display_price which includes markup)
        if ($request->filled('min_price')) {
            $query->whereRaw('base_price >= ?', [$request->min_price]);
        }
        if ($request->filled('max_price')) {
            $query->whereRaw('base_price <= ?', [$request->max_price]);
        }

        // Featured filter
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // On sale filter
        if ($request->boolean('on_sale')) {
            $query->whereNotNull('compare_at_price')
                ->whereRaw('compare_at_price > base_price');
        }

        // Sorting
        $sortBy = $request->get('sort', 'featured');
        switch ($sortBy) {
            case 'price_low':
                $query->orderBy('base_price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('base_price', 'desc');
                break;
            case 'newest':
                $query->latest();
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'popular':
                $query->orderBy('sales_count', 'desc');
                break;
            case 'featured':
            default:
                $query->orderBy('is_featured', 'desc')->latest();
                break;
        }

        $perPage = min($request->get('per_page', 12), 48);
        $products = $query->paginate($perPage)->withQueryString();

        // Transform products to include display prices
        $products->through(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'short_description' => $product->short_description,
                'price' => $product->display_price,
                'compare_price' => $product->display_compare_price,
                'is_on_sale' => $product->is_on_sale,
                'discount_percentage' => $product->discount_percentage,
                'is_featured' => $product->is_featured,
                'rating' => $product->rating,
                'reviews_count' => $product->reviews_count,
                'stock_quantity' => $product->stock_quantity,
                'is_in_stock' => $product->isInStock(),
                'primary_image' => $product->primary_image_url,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'seller' => $product->seller ? [
                    'id' => $product->seller->id,
                    'name' => $product->seller->shop_name,
                ] : null,
            ];
        });

        // Get categories for sidebar
        $categories = Category::withCount(['products' => function ($query) {
                $query->active()->inStock();
            }])
            ->with(['children' => function ($query) {
                $query->withCount(['products' => function ($q) {
                    $q->active()->inStock();
                }])->active()->ordered();
            }])
            ->whereNull('parent_id')
            ->active()
            ->ordered()
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $category->icon,
                    'products_count' => $category->products_count,
                    'children' => $category->children->map(function ($child) {
                        return [
                            'id' => $child->id,
                            'name' => $child->name,
                            'slug' => $child->slug,
                            'products_count' => $child->products_count,
                        ];
                    }),
                ];
            });

        // Get brands for filter
        $brands = Brand::active()
            ->withCount(['products' => function ($query) {
                $query->active()->inStock();
            }])
            ->having('products_count', '>', 0)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        // Get price range
        $priceRange = [
            'min' => Product::active()->inStock()->min('base_price') ?? 0,
            'max' => Product::active()->inStock()->max('base_price') ?? 10000,
        ];

        // Featured/Deal products for sidebar
        $featuredProducts = Product::with(['images'])
            ->active()
            ->inStock()
            ->featured()
            ->take(3)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => $product->display_price,
                    'rating' => $product->rating,
                    'primary_image' => $product->primary_image_url,
                ];
            });

        // Current category info
        $currentCategory = null;
        if ($request->filled('category')) {
            $cat = Category::where('slug', $request->category)->first();
            if ($cat) {
                $currentCategory = [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'breadcrumb' => collect($cat->getBreadcrumb())->map(fn($c) => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'slug' => $c->slug,
                    ]),
                ];
            }
        }

        return Inertia::render('Frontend/Shop', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'priceRange' => $priceRange,
            'featuredProducts' => $featuredProducts,
            'currentCategory' => $currentCategory,
            'filters' => [
                'search' => $request->search,
                'category' => $request->category,
                'brand' => $request->brand,
                'seller' => $request->seller,
                'min_price' => $request->min_price,
                'max_price' => $request->max_price,
                'sort' => $sortBy,
                'featured' => $request->boolean('featured'),
                'on_sale' => $request->boolean('on_sale'),
            ],
        ]);
    }

    /**
     * Display a single product
     */
    public function show(string $slug)
    {
        $product = Product::with([
            'category',
            'brand',
            'seller:id,shop_name,description,logo',
            'images',
            'variants.attributes.attribute',
            'variants.attributes.attributeValue',
            'reviews' => function ($query) {
                $query->with('user:id,name')->latest()->take(5);
            },
        ])
            ->where('slug', $slug)
            ->active()
            ->firstOrFail();

        // Get price data
        $priceData = $this->priceService->getPrice($product);
        $compareAtPrice = $this->priceService->getCompareAtPrice($product);

        // Transform product data
        $productData = [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'short_description' => $product->short_description,
            'specifications' => $product->specifications,
            'price' => $priceData,
            'compare_price' => $compareAtPrice,
            'is_on_sale' => $product->is_on_sale,
            'discount_percentage' => $product->discount_percentage,
            'is_featured' => $product->is_featured,
            'is_new' => $product->is_new,
            'rating' => $product->rating,
            'reviews_count' => $product->reviews_count,
            'stock_quantity' => $product->stock_quantity,
            'is_in_stock' => $product->isInStock(),
            'is_low_stock' => $product->isLowStock(),
            'sku' => $product->sku,
            'images' => $product->images->map(fn($img) => [
                'id' => $img->id,
                'url' => $img->url,
                'alt' => $img->alt_text,
                'is_primary' => $img->is_primary,
            ]),
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
                'breadcrumb' => collect($product->category->getBreadcrumb())->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                ]),
            ] : null,
            'brand' => $product->brand ? [
                'id' => $product->brand->id,
                'name' => $product->brand->name,
                'slug' => $product->brand->slug,
            ] : null,
            'seller' => $product->seller ? [
                'id' => $product->seller->id,
                'name' => $product->seller->shop_name,
                'description' => $product->seller->description,
                'logo' => $product->seller->logo,
            ] : null,
            'variants' => $product->variants->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'price' => $this->priceService->getVariantPrice($variant),
                    'stock_quantity' => $variant->stock_quantity,
                    'is_in_stock' => $variant->stock_quantity > 0 || $variant->product->allow_backorders,
                    'image' => $variant->image,
                    'attributes' => $variant->attributes->map(fn($attr) => [
                        'name' => $attr->attribute->name,
                        'value' => $attr->attributeValue->value,
                        'color_code' => $attr->attributeValue->color_code,
                    ]),
                ];
            }),
            'reviews' => $product->reviews->map(fn($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'comment' => $review->comment,
                'user_name' => $review->user?->name ?? 'Anonymous',
                'created_at' => $review->created_at->diffForHumans(),
            ]),
        ];

        // Related products (same category)
        $relatedProducts = Product::with(['images'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->active()
            ->inStock()
            ->take(4)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'price' => $p->display_price,
                    'compare_price' => $p->display_compare_price,
                    'rating' => $p->rating,
                    'primary_image' => $p->primary_image_url,
                ];
            });

        // Increment view count
        $product->increment('views_count');

        return Inertia::render('Frontend/ProductDetail', [
            'product' => $productData,
            'relatedProducts' => $relatedProducts,
        ]);
    }
}

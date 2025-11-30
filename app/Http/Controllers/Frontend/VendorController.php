<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorController extends Controller
{
    /**
     * Display list of all vendors
     */
    public function index(Request $request)
    {
        $query = Seller::with(['country:id,name', 'user:id,name'])
            ->active()
            ->withCount(['products' => fn($q) => $q->active()->inStock()]);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('shop_name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort', 'featured');
        switch ($sortBy) {
            case 'newest':
                $query->latest();
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'products':
                $query->orderBy('total_products', 'desc');
                break;
            case 'featured':
            default:
                $query->orderBy('is_featured', 'desc')->orderBy('rating', 'desc');
                break;
        }

        $vendors = $query->paginate(12)->through(fn($seller) => $this->transformSeller($seller));

        // Featured vendors for sidebar
        $featuredVendors = Seller::active()
            ->featured()
            ->withCount(['products' => fn($q) => $q->active()->inStock()])
            ->orderBy('rating', 'desc')
            ->take(5)
            ->get()
            ->map(fn($seller) => $this->transformSeller($seller));

        return Inertia::render('Frontend/Vendors', [
            'vendors' => $vendors,
            'featuredVendors' => $featuredVendors,
            'filters' => [
                'search' => $request->search,
                'sort' => $sortBy,
            ],
        ]);
    }

    /**
     * Display a single vendor's store page
     */
    public function show(Request $request, string $slug)
    {
        $seller = Seller::with(['country:id,name', 'user:id,name,email'])
            ->where('slug', $slug)
            ->active()
            ->firstOrFail();

        // Build product query
        $query = Product::with(['category:id,name,slug', 'images'])
            ->where('seller_id', $seller->id)
            ->active()
            ->inStock();

        // Category filter
        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        // Price filter
        if ($request->filled('min_price')) {
            $query->where('base_price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('base_price', '<=', $request->max_price);
        }

        // Sort
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
                $query->orderBy('views_count', 'desc');
                break;
            case 'featured':
            default:
                $query->orderBy('is_featured', 'desc')->latest();
                break;
        }

        $products = $query->paginate($request->get('per_page', 12))
            ->through(fn($product) => $this->transformProduct($product));

        // Categories for this seller
        $categories = Category::whereHas('products', function ($q) use ($seller) {
                $q->where('seller_id', $seller->id)->active()->inStock();
            })
            ->withCount(['products' => function ($q) use ($seller) {
                $q->where('seller_id', $seller->id)->active()->inStock();
            }])
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'products_count' => $cat->products_count,
            ]);

        // Deal products from this seller
        $dealProducts = Product::with(['category:id,name,slug', 'images'])
            ->where('seller_id', $seller->id)
            ->active()
            ->inStock()
            ->whereNotNull('compare_at_price')
            ->whereRaw('compare_at_price > base_price')
            ->inRandomOrder()
            ->take(4)
            ->get()
            ->map(fn($product) => $this->transformProduct($product));

        return Inertia::render('Frontend/VendorDetails', [
            'vendor' => $this->transformSeller($seller, true),
            'products' => $products,
            'categories' => $categories,
            'dealProducts' => $dealProducts,
            'filters' => [
                'category' => $request->category,
                'sort' => $sortBy,
                'min_price' => $request->min_price,
                'max_price' => $request->max_price,
                'per_page' => $request->get('per_page', 12),
            ],
        ]);
    }

    /**
     * Transform seller for frontend display
     */
    protected function transformSeller(Seller $seller, bool $detailed = false): array
    {
        $data = [
            'id' => $seller->id,
            'shop_name' => $seller->shop_name,
            'slug' => $seller->slug,
            'description' => $seller->description,
            'logo' => $seller->logo ? asset('storage/' . $seller->logo) : null,
            'banner' => $seller->banner ? asset('storage/' . $seller->banner) : null,
            'rating' => $seller->rating ?? 0,
            'total_reviews' => $seller->total_reviews ?? 0,
            'total_products' => $seller->products_count ?? $seller->total_products ?? 0,
            'total_sales' => $seller->total_sales ?? 0,
            'is_verified' => $seller->is_verified,
            'is_featured' => $seller->is_featured,
            'country' => $seller->country?->name,
            'created_at' => $seller->created_at->format('Y'),
        ];

        if ($detailed) {
            $data['business_name'] = $seller->business_name;
            $data['user_name'] = $seller->user?->name;
        }

        return $data;
    }

    /**
     * Transform product for frontend display
     */
    protected function transformProduct(Product $product): array
    {
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
            'is_new' => $product->is_new,
            'rating' => $product->rating ?? 0,
            'reviews_count' => $product->reviews_count ?? 0,
            'primary_image' => $product->primary_image_url,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
        ];
    }
}

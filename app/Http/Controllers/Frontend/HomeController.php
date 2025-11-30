<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    /**
     * Display the homepage
     */
    public function index()
    {
        // Featured products (hot deals, featured items)
        $featuredProducts = Product::with(['category:id,name,slug', 'images'])
            ->active()
            ->inStock()
            ->featured()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($product) => $this->transformProduct($product));

        // Popular products (most viewed or sold)
        $popularProducts = Product::with(['category:id,name,slug', 'images'])
            ->active()
            ->inStock()
            ->orderBy('views_count', 'desc')
            ->take(10)
            ->get()
            ->map(fn($product) => $this->transformProduct($product));

        // New arrivals
        $newProducts = Product::with(['category:id,name,slug', 'images'])
            ->active()
            ->inStock()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($product) => $this->transformProduct($product));

        // On sale products
        $saleProducts = Product::with(['category:id,name,slug', 'images'])
            ->active()
            ->inStock()
            ->whereNotNull('compare_at_price')
            ->whereRaw('compare_at_price > base_price')
            ->orderBy('views_count', 'desc')
            ->take(10)
            ->get()
            ->map(fn($product) => $this->transformProduct($product));

        // Featured categories with product count
        $categories = Category::with(['children' => function ($query) {
                $query->active()->ordered()->take(6);
            }])
            ->withCount(['products' => function ($query) {
                $query->active()->inStock();
            }])
            ->whereNull('parent_id')
            ->active()
            ->ordered()
            ->take(10)
            ->get()
            ->map(fn($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'icon' => $category->icon,
                'image' => $category->image,
                'products_count' => $category->products_count,
                'children' => $category->children->map(fn($child) => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                ]),
            ]);

        // Best selling products
        $bestSellers = Product::with(['category:id,name,slug', 'images'])
            ->active()
            ->inStock()
            ->orderBy('sales_count', 'desc')
            ->take(6)
            ->get()
            ->map(fn($product) => $this->transformProduct($product));

        // Daily deals (random featured on-sale products)
        $dailyDeals = Product::with(['category:id,name,slug', 'images'])
            ->active()
            ->inStock()
            ->featured()
            ->whereNotNull('compare_at_price')
            ->inRandomOrder()
            ->take(4)
            ->get()
            ->map(fn($product) => $this->transformProduct($product, true));

        return Inertia::render('Frontend/Home', [
            'featuredProducts' => $featuredProducts,
            'popularProducts' => $popularProducts,
            'newProducts' => $newProducts,
            'saleProducts' => $saleProducts,
            'categories' => $categories,
            'bestSellers' => $bestSellers,
            'dailyDeals' => $dailyDeals,
        ]);
    }

    /**
     * Transform product data for frontend display
     */
    protected function transformProduct(Product $product, bool $includeDeadline = false): array
    {
        $data = [
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
            'is_in_stock' => $product->isInStock(),
            'primary_image' => $product->primary_image_url,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
        ];

        // Add deadline for daily deals
        if ($includeDeadline && $product->sale_ends_at) {
            $data['sale_ends_at'] = $product->sale_ends_at->toIso8601String();
        }

        return $data;
    }
}

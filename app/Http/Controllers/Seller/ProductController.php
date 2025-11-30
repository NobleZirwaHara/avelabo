<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\PriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function __construct(
        protected PriceService $priceService
    ) {}

    /**
     * Display a listing of seller's products
     */
    public function index(Request $request)
    {
        $seller = Auth::user()->seller;

        $products = Product::where('seller_id', $seller->id)
            ->with(['category:id,name', 'brand:id,name', 'images'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->category_id, fn($q, $catId) => $q->where('category_id', $catId))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Transform to include primary image URL
        $products->through(function ($product) {
            $product->primary_image = $product->primary_image_url;
            return $product;
        });

        return Inertia::render('Seller/Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'status', 'category_id']),
            'categories' => Category::active()->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new product
     */
    public function create()
    {
        return Inertia::render('Seller/Products/Create', [
            'categories' => Category::with('children:id,parent_id,name')
                ->whereNull('parent_id')
                ->active()
                ->ordered()
                ->get(['id', 'name']),
            'brands' => Brand::active()->orderBy('name')->get(['id', 'name']),
            'attributes' => Attribute::with('values:id,attribute_id,value,color_code')
                ->visible()
                ->ordered()
                ->get(['id', 'name', 'type']),
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        $seller = Auth::user()->seller;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'sku' => ['nullable', 'string', 'max:100'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'track_inventory' => ['boolean'],
            'allow_backorders' => ['boolean'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'length' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,active,inactive'],
            'is_featured' => ['boolean'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $product = DB::transaction(function () use ($seller, $validated, $request) {
            // Create product
            $product = Product::create([
                'seller_id' => $seller->id,
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']) . '-' . Str::random(5),
                'description' => $validated['description'] ?? null,
                'short_description' => $validated['short_description'] ?? null,
                'base_price' => $validated['base_price'],
                'compare_at_price' => $validated['compare_at_price'] ?? null,
                'currency_id' => $seller->default_currency_id ?? 1, // Default to MWK
                'sku' => $validated['sku'] ?? strtoupper(Str::random(8)),
                'barcode' => $validated['barcode'] ?? null,
                'stock_quantity' => $validated['stock_quantity'],
                'low_stock_threshold' => $validated['low_stock_threshold'] ?? 5,
                'track_inventory' => $validated['track_inventory'] ?? true,
                'allow_backorders' => $validated['allow_backorders'] ?? false,
                'weight' => $validated['weight'] ?? null,
                'length' => $validated['length'] ?? null,
                'width' => $validated['width'] ?? null,
                'height' => $validated['height'] ?? null,
                'status' => $validated['status'],
                'is_featured' => $validated['is_featured'] ?? false,
            ]);

            // Handle image uploads
            if ($request->hasFile('images')) {
                $sortOrder = 0;
                foreach ($request->file('images') as $index => $image) {
                    $path = $image->store("products/{$product->id}", 'public');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $path,
                        'alt_text' => $product->name,
                        'sort_order' => $sortOrder++,
                        'is_primary' => $index === 0,
                    ]);
                }
            }

            return $product;
        });

        return redirect()->route('seller.products.index')
            ->with('success', 'Product created successfully!');
    }

    /**
     * Display the specified product
     */
    public function show(Product $product)
    {
        $seller = Auth::user()->seller;

        // Ensure product belongs to this seller
        if ($product->seller_id !== $seller->id) {
            abort(403);
        }

        $product->load(['category', 'brand', 'images', 'variants.attributes.attribute', 'variants.attributes.attributeValue']);

        // Get price with markup
        $priceData = $this->priceService->getPrice($product);

        return Inertia::render('Seller/Products/Show', [
            'product' => $product,
            'priceData' => $priceData,
        ]);
    }

    /**
     * Show the form for editing the specified product
     */
    public function edit(Product $product)
    {
        $seller = Auth::user()->seller;

        if ($product->seller_id !== $seller->id) {
            abort(403);
        }

        $product->load(['images', 'variants.attributes']);

        return Inertia::render('Seller/Products/Edit', [
            'product' => $product,
            'categories' => Category::with('children:id,parent_id,name')
                ->whereNull('parent_id')
                ->active()
                ->ordered()
                ->get(['id', 'name']),
            'brands' => Brand::active()->orderBy('name')->get(['id', 'name']),
            'attributes' => Attribute::with('values:id,attribute_id,value,color_code')
                ->visible()
                ->ordered()
                ->get(['id', 'name', 'type']),
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, Product $product)
    {
        $seller = Auth::user()->seller;

        if ($product->seller_id !== $seller->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'sku' => ['nullable', 'string', 'max:100'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'track_inventory' => ['boolean'],
            'allow_backorders' => ['boolean'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'length' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,active,inactive'],
            'is_featured' => ['boolean'],
        ]);

        $product->update($validated);

        return redirect()->route('seller.products.show', $product)
            ->with('success', 'Product updated successfully!');
    }

    /**
     * Remove the specified product
     */
    public function destroy(Product $product)
    {
        $seller = Auth::user()->seller;

        if ($product->seller_id !== $seller->id) {
            abort(403);
        }

        $product->delete();

        return redirect()->route('seller.products.index')
            ->with('success', 'Product deleted successfully!');
    }
}

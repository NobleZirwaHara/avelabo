<?php

namespace Database\Seeders;

use App\Models\Seller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Currency;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $seller = Seller::where('status', 'active')->first();
        $currency = Currency::where('code', 'MWK')->first();
        $categories = Category::whereNotNull('parent_id')->get();

        if (!$seller || !$currency || $categories->isEmpty()) {
            return;
        }

        $products = [
            [
                'name' => 'iPhone 15 Pro Max 256GB',
                'description' => 'Latest Apple iPhone with A17 Pro chip, titanium design, and advanced camera system.',
                'short_description' => 'Apple iPhone 15 Pro Max - The ultimate iPhone',
                'base_price' => 850000,
                'compare_at_price' => 950000,
                'stock_quantity' => 15,
                'status' => 'active',
                'is_featured' => true,
            ],
            [
                'name' => 'Samsung Galaxy S24 Ultra',
                'description' => 'Samsung flagship phone with Galaxy AI, S Pen, and 200MP camera.',
                'short_description' => 'Samsung Galaxy S24 Ultra with AI features',
                'base_price' => 780000,
                'compare_at_price' => null,
                'stock_quantity' => 20,
                'status' => 'active',
                'is_featured' => true,
            ],
            [
                'name' => 'MacBook Air M3 13"',
                'description' => 'Supercharged by M3 chip. Up to 18 hours of battery life.',
                'short_description' => 'Apple MacBook Air with M3 chip',
                'base_price' => 1200000,
                'compare_at_price' => 1350000,
                'stock_quantity' => 8,
                'status' => 'active',
                'is_featured' => false,
            ],
            [
                'name' => 'Sony WH-1000XM5 Headphones',
                'description' => 'Industry-leading noise cancellation headphones with exceptional sound quality.',
                'short_description' => 'Premium wireless noise-cancelling headphones',
                'base_price' => 280000,
                'compare_at_price' => 320000,
                'stock_quantity' => 25,
                'status' => 'active',
                'is_featured' => false,
            ],
            [
                'name' => 'Nike Air Max 90',
                'description' => 'Iconic Nike Air Max 90 sneakers with visible Air cushioning.',
                'short_description' => 'Classic Nike Air Max sneakers',
                'base_price' => 95000,
                'compare_at_price' => null,
                'stock_quantity' => 50,
                'status' => 'active',
                'is_featured' => false,
            ],
            [
                'name' => 'Draft Product Example',
                'description' => 'This is a draft product that is not yet published.',
                'short_description' => 'Draft product for testing',
                'base_price' => 50000,
                'compare_at_price' => null,
                'stock_quantity' => 10,
                'status' => 'draft',
                'is_featured' => false,
            ],
            [
                'name' => 'Low Stock Item',
                'description' => 'A product with low stock for testing alerts.',
                'short_description' => 'Low stock test product',
                'base_price' => 35000,
                'compare_at_price' => 40000,
                'stock_quantity' => 3,
                'status' => 'active',
                'is_featured' => false,
            ],
        ];

        foreach ($products as $index => $productData) {
            Product::create([
                'seller_id' => $seller->id,
                'category_id' => $categories->random()->id,
                'name' => $productData['name'],
                'slug' => Str::slug($productData['name']) . '-' . Str::random(5),
                'description' => $productData['description'],
                'short_description' => $productData['short_description'],
                'base_price' => $productData['base_price'],
                'compare_at_price' => $productData['compare_at_price'],
                'currency_id' => $currency->id,
                'sku' => 'SKU-' . strtoupper(Str::random(6)),
                'stock_quantity' => $productData['stock_quantity'],
                'low_stock_threshold' => 5,
                'track_inventory' => true,
                'status' => $productData['status'],
                'is_featured' => $productData['is_featured'],
            ]);
        }
    }
}

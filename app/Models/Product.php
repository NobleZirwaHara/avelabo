<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'seller_id',
        'category_id',
        'brand_id',
        'name',
        'slug',
        'description',
        'short_description',
        'specifications',
        'base_price',
        'compare_at_price',
        'currency_id',
        'sku',
        'barcode',
        'stock_quantity',
        'low_stock_threshold',
        'track_inventory',
        'allow_backorders',
        'status',
        'is_featured',
        'is_new',
        'is_on_sale',
        'meta_title',
        'meta_description',
        'source',
        'source_id',
        'source_url',
        'views_count',
        'sales_count',
        'rating',
        'reviews_count',
        'weight',
        'length',
        'width',
        'height',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'track_inventory' => 'boolean',
        'allow_backorders' => 'boolean',
        'is_featured' => 'boolean',
        'is_new' => 'boolean',
        'is_on_sale' => 'boolean',
        'views_count' => 'integer',
        'sales_count' => 'integer',
        'rating' => 'decimal:2',
        'reviews_count' => 'integer',
        'weight' => 'decimal:3',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function getPrimaryImageAttribute(): ?ProductImage
    {
        return $this->images->where('is_primary', true)->first()
            ?? $this->images->first();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('track_inventory', false)
                ->orWhere('stock_quantity', '>', 0)
                ->orWhere('allow_backorders', true);
        });
    }

    public function isInStock(): bool
    {
        if (!$this->track_inventory) {
            return true;
        }
        return $this->stock_quantity > 0 || $this->allow_backorders;
    }

    public function isLowStock(): bool
    {
        return $this->track_inventory
            && $this->stock_quantity > 0
            && $this->stock_quantity <= $this->low_stock_threshold;
    }

    /**
     * Get the customer-facing price (base price + markup)
     * Markup is INVISIBLE to customers
     */
    public function getDisplayPriceAttribute(): float
    {
        return app(\App\Services\PriceService::class)->getDisplayPrice($this);
    }

    /**
     * Get the customer-facing compare price (with markup applied)
     */
    public function getDisplayComparePriceAttribute(): ?float
    {
        if (!$this->compare_at_price) {
            return null;
        }

        return app(\App\Services\PriceService::class)->getDisplayComparePrice($this);
    }

    /**
     * Get primary image URL (returns the path for storage, not full URL)
     */
    public function getPrimaryImageUrlAttribute(): ?string
    {
        $primaryImage = $this->images->where('is_primary', true)->first()
            ?? $this->images->first();

        return $primaryImage?->path;
    }

    /**
     * Check if product is on sale (has compare price higher than display price)
     */
    public function getIsOnSaleAttribute(): bool
    {
        $comparePrice = $this->display_compare_price;
        return $comparePrice && $comparePrice > $this->display_price;
    }

    /**
     * Get discount percentage
     */
    public function getDiscountPercentageAttribute(): int
    {
        if (!$this->is_on_sale) {
            return 0;
        }

        $comparePrice = $this->display_compare_price;
        $displayPrice = $this->display_price;

        return (int) round((($comparePrice - $displayPrice) / $comparePrice) * 100);
    }
}

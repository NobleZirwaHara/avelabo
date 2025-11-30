<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'seller_id',
        'product_name',
        'product_sku',
        'variant_name',
        'product_image',
        'quantity',
        'base_price',
        'markup_amount',
        'display_price',
        'line_total',
        'currency_id',
        'seller_currency_id',
        'exchange_rate_used',
        'status',
        'tracking_number',
        'tracking_carrier',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'base_price' => 'decimal:2',
        'markup_amount' => 'decimal:2',
        'display_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'exchange_rate_used' => 'decimal:8',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function sellerCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'seller_currency_id');
    }

    public function isShipped(): bool
    {
        return $this->shipped_at !== null;
    }

    public function isDelivered(): bool
    {
        return $this->delivered_at !== null;
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function scopeForSeller($query, $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}

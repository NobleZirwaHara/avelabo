<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScrapingSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'base_url',
        'seller_id',
        'default_currency_id',
        'default_category_id',
        'config',
        'schedule',
        'is_active',
        'auto_publish',
        'last_scraped_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'auto_publish' => 'boolean',
        'config' => 'array',
        'last_scraped_at' => 'datetime',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function defaultCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'default_currency_id');
    }

    public function defaultCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'default_category_id');
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(ScrapingJob::class, 'source_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ScrapingLog::class, 'source_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getLatestJobAttribute(): ?ScrapingJob
    {
        return $this->jobs()->latest()->first();
    }
}

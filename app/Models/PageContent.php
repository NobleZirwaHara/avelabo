<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_slug',
        'title',
        'meta_title',
        'meta_description',
        'content',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'content' => 'array',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public static function getBySlug(string $slug): ?self
    {
        return static::where('page_slug', $slug)->active()->first();
    }
}

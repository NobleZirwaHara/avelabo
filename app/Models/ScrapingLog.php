<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScrapingLog extends Model
{
    use HasFactory;

    public const LEVEL_DEBUG = 'debug';
    public const LEVEL_INFO = 'info';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_ERROR = 'error';

    protected $fillable = [
        'job_id',
        'level',
        'message',
        'context',
        'url',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(ScrapingJob::class, 'job_id');
    }

    public function scopeLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    public function scopeErrors($query)
    {
        return $query->where('level', 'error');
    }

    public function scopeWarnings($query)
    {
        return $query->where('level', 'warning');
    }

    public function scopeInfo($query)
    {
        return $query->where('level', 'info');
    }
}

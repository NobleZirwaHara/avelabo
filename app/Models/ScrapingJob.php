<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScrapingJob extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const TYPE_FULL = 'full';
    public const TYPE_INCREMENTAL = 'incremental';
    public const TYPE_CATEGORY = 'category';
    public const TYPE_PRODUCT = 'product';

    protected $fillable = [
        'source_id',
        'status',
        'type',
        'config',
        'products_found',
        'products_created',
        'products_updated',
        'products_failed',
        'images_downloaded',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'config' => 'array',
        'products_found' => 'integer',
        'products_created' => 'integer',
        'products_updated' => 'integer',
        'products_failed' => 'integer',
        'images_downloaded' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function source(): BelongsTo
    {
        return $this->belongsTo(ScrapingSource::class, 'source_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ScrapingLog::class, 'job_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }
        return $this->completed_at->diffInSeconds($this->started_at);
    }
}

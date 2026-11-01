<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuanProduct extends Model
{
    protected $fillable = [
        'name',
        'category',
        'price',
        'cost_price',
        'is_active',
        'sort_order',
    ];

    public const CATEGORIES = [
        'dien-thoai' => 'Điện thoại',
        'dich-vu' => 'Dịch vụ',
        'man-hinh' => 'Màn hình',
        'pin' => 'Pin',
        'phu-kien' => 'Phụ kiện',
        'sim-card' => 'Sim / Card',
        'dong-ho' => 'Đồng hồ',
        'khac' => 'Khác',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? self::CATEGORIES['khac'];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(QuanEntry::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppraisalTicket extends Model
{
    public const SLOTS = [
        'front',
        'back',
        'corner_tl',
        'corner_tr',
        'corner_bl',
        'corner_br',
        'side',
        'battery',
    ];

    public const STATUSES = ['draft', 'quoted', 'accepted', 'cancelled', 'rejected'];

    protected $fillable = [
        'code',
        'ticket_qr',
        'user_id',
        'customer_name',
        'customer_phone',
        'brand',
        'model',
        'storage',
        'imei',
        'accessories_note',
        'hardware_checks',
        'ai_ran',
        'ai_mode',
        'ai_grade',
        'ai_result',
        'suggested_price',
        'final_price',
        'status',
        'model_version',
        'appraised_at',
    ];

    protected $casts = [
        'hardware_checks' => 'array',
        'ai_ran' => 'boolean',
        'ai_result' => 'array',
        'suggested_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'appraised_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(AppraisalPhoto::class);
    }
}

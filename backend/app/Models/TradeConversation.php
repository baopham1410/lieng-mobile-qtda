<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradeConversation extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'lao_text',
        'vi_text',
        'customer_name',
        'note',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

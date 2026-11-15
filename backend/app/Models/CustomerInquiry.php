<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerInquiry extends Model
{
    protected $fillable = [
        'code',
        'customer_name',
        'customer_phone',
        'product_id',
        'product_name',
        'topic',
        'notes',
        'status',
        'staff_name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}

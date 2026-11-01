<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'phone', 'email', 'address', 'loyalty_points'];

    protected $casts = ['loyalty_points' => 'integer'];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}

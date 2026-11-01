<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'app' => 'Lieng Mobile API',
    'docs' => url('/api'),
]));

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quan_products', function (Blueprint $table) {
            $table->string('category', 50)->default('khac')->after('name');
            $table->index(['category', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('quan_products', function (Blueprint $table) {
            $table->dropIndex(['category', 'is_active', 'sort_order']);
            $table->dropColumn('category');
        });
    }
};

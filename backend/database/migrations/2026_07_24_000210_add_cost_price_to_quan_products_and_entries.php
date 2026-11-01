<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quan_products', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 2)->nullable()->after('price');
        });

        Schema::table('quan_entries', function (Blueprint $table) {
            $table->decimal('unit_cost', 15, 2)->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('quan_products', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });

        Schema::table('quan_entries', function (Blueprint $table) {
            $table->dropColumn('unit_cost');
        });
    }
};

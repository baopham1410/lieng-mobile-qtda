<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('imei_codes', function (Blueprint $table) {
            $table->index(['status', 'product_variant_id'], 'imei_codes_status_variant_idx');
            $table->index(['status', 'updated_at'], 'imei_codes_status_updated_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['status', 'paid_at'], 'orders_status_paid_idx');
            $table->index(['created_at', 'status'], 'orders_created_status_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'brand'], 'products_category_brand_idx');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->index('product_id', 'product_variants_product_idx');
        });

        Schema::table('product_prices', function (Blueprint $table) {
            $table->index(['product_variant_id', 'price_type', 'effective_from'], 'product_prices_variant_type_from_idx');
            $table->index(['price_type', 'effective_from', 'effective_to'], 'product_prices_type_window_idx');
        });

        Schema::table('stock_imports', function (Blueprint $table) {
            $table->index(['status', 'imported_at'], 'stock_imports_status_imported_idx');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index('transacted_at', 'transactions_transacted_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_transacted_at_idx');
        });

        Schema::table('stock_imports', function (Blueprint $table) {
            $table->dropIndex('stock_imports_status_imported_idx');
        });

        Schema::table('product_prices', function (Blueprint $table) {
            $table->dropIndex('product_prices_variant_type_from_idx');
            $table->dropIndex('product_prices_type_window_idx');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex('product_variants_product_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_brand_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_paid_idx');
            $table->dropIndex('orders_created_status_idx');
        });

        Schema::table('imei_codes', function (Blueprint $table) {
            $table->dropIndex('imei_codes_status_variant_idx');
            $table->dropIndex('imei_codes_status_updated_idx');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imei_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained();
            $table->string('imei', 20)->unique();
            $table->string('status', 20)->default('in_stock'); // in_stock, sold, defective, warranty
            $table->foreignId('stock_import_item_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('order_item_id')->nullable();
            $table->decimal('import_cost', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('product_variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imei_codes');
    }
};

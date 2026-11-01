<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quan_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 15, 2);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::table('quan_entries', function (Blueprint $table) {
            $table->foreignId('quan_product_id')->nullable()->after('title')->constrained('quan_products')->nullOnDelete();
            $table->unsignedInteger('qty')->default(1)->after('quan_product_id');
        });
    }

    public function down(): void
    {
        Schema::table('quan_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quan_product_id');
            $table->dropColumn('qty');
        });

        Schema::dropIfExists('quan_products');
    }
};

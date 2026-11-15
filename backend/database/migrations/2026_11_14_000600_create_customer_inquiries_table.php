<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('customer_name', 100);
            $table->string('customer_phone', 30);
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('product_name', 255)->nullable();
            $table->string('topic', 100)->default('Giữ máy / Tư vấn');
            $table->text('notes')->nullable();
            $table->string('status', 30)->default('ringing'); // ringing, in_progress, done, missed, callback
            $table->string('staff_name', 100)->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_inquiries');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appraisal_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('ticket_qr', 60)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 40)->nullable();
            $table->string('brand', 80)->default('Apple');
            $table->string('model', 120);
            $table->string('storage', 40)->nullable();
            $table->string('imei', 60)->nullable();
            $table->text('accessories_note')->nullable();
            $table->json('hardware_checks')->nullable();
            $table->boolean('ai_ran')->default(false);
            $table->string('ai_mode', 30)->default('pending');
            $table->string('ai_grade', 20)->nullable();
            $table->json('ai_result')->nullable();
            $table->decimal('suggested_price', 15, 2)->default(0);
            $table->decimal('final_price', 15, 2)->default(0);
            $table->string('status', 30)->default('draft');
            $table->string('model_version', 120)->nullable();
            $table->timestamp('appraised_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('ai_grade');
        });

        Schema::create('appraisal_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_ticket_id')->constrained('appraisal_tickets')->cascadeOnDelete();
            $table->string('slot', 20);
            $table->string('disk', 32)->default('public');
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->timestamps();

            $table->unique(['appraisal_ticket_id', 'slot']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisal_photos');
        Schema::dropIfExists('appraisal_tickets');
    }
};

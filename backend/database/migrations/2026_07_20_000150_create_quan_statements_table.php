<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('quan_statements')) {
            return;
        }

        Schema::create('quan_statements', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->date('statement_date')->unique();
            $table->decimal('income_total', 15, 2)->default(0);
            $table->decimal('expense_total', 15, 2)->default(0);
            $table->decimal('cash_total', 15, 2)->default(0);
            $table->decimal('transfer_total', 15, 2)->default(0);
            $table->decimal('net_total', 15, 2)->default(0);
            $table->unsignedInteger('sales_count')->default(0);
            $table->unsignedInteger('expense_count')->default(0);
            $table->unsignedInteger('row_count')->default(0);
            $table->json('rows_snapshot')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->index('statement_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quan_statements');
    }
};

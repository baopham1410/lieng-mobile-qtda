<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_status', 20)->default('unpaid')->after('status');
            $table->string('payment_provider', 30)->nullable()->after('payment_status');
            $table->string('payment_reference', 120)->nullable()->after('payment_provider');
            $table->text('checkout_url')->nullable()->after('payment_reference');
            $table->text('qr_code')->nullable()->after('checkout_url');
            $table->json('payment_payload')->nullable()->after('qr_code');
            $table->dateTime('payment_expires_at')->nullable()->after('payment_payload');
            $table->dateTime('payment_confirmed_at')->nullable()->after('payment_expires_at');

            $table->index('payment_status');
            $table->index('payment_provider');
            $table->unique('payment_reference');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['payment_reference']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['payment_provider']);

            $table->dropColumn([
                'payment_status',
                'payment_provider',
                'payment_reference',
                'checkout_url',
                'qr_code',
                'payment_payload',
                'payment_expires_at',
                'payment_confirmed_at',
            ]);
        });
    }
};

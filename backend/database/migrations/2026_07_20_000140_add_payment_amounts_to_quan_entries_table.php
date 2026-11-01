<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quan_entries')) {
            return;
        }

        Schema::table('quan_entries', function (Blueprint $table) {
            if (! Schema::hasColumn('quan_entries', 'cash_amount')) {
                $table->decimal('cash_amount', 15, 2)->default(0)->after('payment_method');
            }
            if (! Schema::hasColumn('quan_entries', 'transfer_amount')) {
                $table->decimal('transfer_amount', 15, 2)->default(0)->after('cash_amount');
            }
        });

        // Backfill from amount + payment_method for existing rows.
        DB::table('quan_entries')->where('payment_method', 'cash')->update([
            'cash_amount' => DB::raw('amount'),
            'transfer_amount' => 0,
        ]);
        DB::table('quan_entries')->where('payment_method', 'transfer')->update([
            'cash_amount' => 0,
            'transfer_amount' => DB::raw('amount'),
        ]);
        DB::table('quan_entries')->where('payment_method', 'ewallet')->update([
            'cash_amount' => 0,
            'transfer_amount' => DB::raw('amount'),
        ]);
        DB::table('quan_entries')->where('payment_method', 'mixed')->where('cash_amount', 0)->where('transfer_amount', 0)->update([
            'cash_amount' => DB::raw('amount'),
            'transfer_amount' => 0,
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('quan_entries')) {
            return;
        }

        Schema::table('quan_entries', function (Blueprint $table) {
            if (Schema::hasColumn('quan_entries', 'transfer_amount')) {
                $table->dropColumn('transfer_amount');
            }
            if (Schema::hasColumn('quan_entries', 'cash_amount')) {
                $table->dropColumn('cash_amount');
            }
        });
    }
};

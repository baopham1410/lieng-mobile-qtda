<?php

namespace Database\Seeders;

use App\Http\Resources\QuanEntryResource;
use App\Models\QuanEntry;
use App\Models\QuanStatement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/** Bổ sung thêm 1 dòng Màn 450 ngày 11/7 (sổ có 3 lần Màn 450). */
class QuanFixDay11ExtraManSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'quan@liengmobile.com')->first()
            ?? User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))->first();

        $day11 = Carbon::create(2026, 7, 11, 12, 45, 0);

        QuanEntry::create([
            'type' => 'income',
            'title' => 'Màn',
            'qty' => 1,
            'amount' => 450_000,
            'payment_method' => 'cash',
            'cash_amount' => 450_000,
            'transfer_amount' => 0,
            'note' => 'bổ_sung_ngày_11',
            'code' => 'QN-FIX11-'.strtoupper(Str::random(4)),
            'user_id' => $user->id,
            'occurred_at' => $day11,
        ]);

        $entries = QuanEntry::with('user:id,name')
            ->whereDate('occurred_at', '2026-07-11')
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        $snapshot = $entries->map(fn (QuanEntry $e) => (new QuanEntryResource($e))->resolve())->values()->all();
        $income = $entries->where('type', 'income')->sum('amount');
        $cash = $entries->where('type', 'income')->sum('cash_amount');

        QuanStatement::whereDate('statement_date', '2026-07-11')->update([
            'income_total' => $income,
            'cash_total' => $cash,
            'net_total' => $income,
            'row_count' => $entries->count(),
            'sales_count' => $entries->where('type', 'income')->sum('qty'),
            'rows_snapshot' => $snapshot,
        ]);

        $this->command?->info('Đã thêm Màn 450 ngày 11/7 và cập nhật sao kê.');
    }
}

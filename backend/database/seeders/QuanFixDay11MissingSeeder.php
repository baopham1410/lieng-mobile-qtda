<?php

namespace Database\Seeders;

use App\Http\Resources\QuanEntryResource;
use App\Models\QuanEntry;
use App\Models\QuanStatement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QuanFixDay11MissingSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'quan@liengmobile.com')->first()
            ?? User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))->first();

        if (! $user) {
            $this->command?->error('Không tìm thấy user.');

            return;
        }

        $day11 = Carbon::create(2026, 7, 11, 12, 0, 0);
        $day12 = Carbon::create(2026, 7, 12, 12, 0, 0);

        $toAddDay11 = [
            ['title' => 'Màn', 'amount' => 450_000],
            ['title' => 'Samsung', 'amount' => 1_300_000],
            ['title' => 'Pin dự phòng', 'amount' => 550_000],
        ];

        $added = 0;
        $seq = (int) QuanEntry::whereDate('occurred_at', $day11->toDateString())->max('id');

        foreach ($toAddDay11 as $i => $row) {
            $exists = QuanEntry::query()
                ->whereDate('occurred_at', $day11->toDateString())
                ->where('type', 'income')
                ->where('title', $row['title'])
                ->where('amount', $row['amount'])
                ->where(function ($q) {
                    $q->where('note', 'import_sổ_cũ')
                        ->orWhere('note', 'bổ_sung_ngày_11');
                })
                ->exists();

            if ($exists) {
                $this->command?->warn("Đã có: {$row['title']} {$row['amount']} ngày 11/7");

                continue;
            }

            QuanEntry::create([
                'type' => 'income',
                'title' => $row['title'],
                'qty' => 1,
                'amount' => $row['amount'],
                'payment_method' => 'cash',
                'cash_amount' => $row['amount'],
                'transfer_amount' => 0,
                'note' => 'bổ_sung_ngày_11',
                'code' => 'QN-FIX11-'.strtoupper(Str::random(4)),
                'user_id' => $user->id,
                'occurred_at' => $day11->copy()->addMinutes(200 + $i),
            ]);
            $added++;
        }

        // Samsung + Pin dự phòng ghi nhầm ở ngày 12 (trang bổ sung) → xóa
        $removed = QuanEntry::query()
            ->whereDate('occurred_at', $day12->toDateString())
            ->where('note', 'import_sổ_cũ')
            ->whereIn('title', ['SamSung', 'Samsung', 'Pin dự phòng'])
            ->whereIn('amount', [1_300_000, 550_000])
            ->delete();

        $this->rebuildStatement($day11, $user);
        $this->rebuildStatement($day12, $user);

        $this->command?->info("Đã thêm {$added} dòng ngày 11/7, xóa {$removed} dòng nhầm ngày 12/7, cập nhật 2 sao kê.");
    }

    private function rebuildStatement(Carbon $date, User $user): void
    {
        $entries = QuanEntry::with('user:id,name')
            ->whereDate('occurred_at', $date->toDateString())
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        if ($entries->isEmpty()) {
            QuanStatement::whereDate('statement_date', $date->toDateString())->delete();

            return;
        }

        $snapshot = $entries->map(fn (QuanEntry $e) => (new QuanEntryResource($e))->resolve())->values()->all();

        $income = 0.0;
        $expense = 0.0;
        $cash = 0.0;
        $transfer = 0.0;
        $salesCount = 0;
        $expenseCount = 0;

        foreach ($entries as $entry) {
            if ($entry->type === 'income') {
                $income += (float) $entry->amount;
                $cash += (float) ($entry->cash_amount ?? 0);
                $transfer += (float) ($entry->transfer_amount ?? 0);
                $salesCount += (int) ($entry->qty ?? 1);
            } else {
                $expense += (float) $entry->amount;
                $expenseCount++;
            }
        }

        $payload = [
            'income_total' => round($income, 2),
            'expense_total' => round($expense, 2),
            'cash_total' => round($cash, 2),
            'transfer_total' => round($transfer, 2),
            'net_total' => round($income - $expense, 2),
            'sales_count' => $salesCount,
            'expense_count' => $expenseCount,
            'row_count' => $entries->count(),
            'rows_snapshot' => $snapshot,
            'user_id' => $user->id,
        ];

        $existing = QuanStatement::whereDate('statement_date', $date->toDateString())->first();

        if ($existing) {
            $existing->update($payload);
        } else {
            QuanStatement::create([
                ...$payload,
                'code' => 'SK-'.$date->format('Ymd').'-'.strtoupper(Str::random(4)),
                'statement_date' => $date->toDateString(),
                'note' => 'Nhập từ sổ cũ 11–19/7',
            ]);
        }
    }
}

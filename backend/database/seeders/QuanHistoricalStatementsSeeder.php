<?php

namespace Database\Seeders;

use App\Http\Resources\QuanEntryResource;
use App\Models\QuanEntry;
use App\Models\QuanStatement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QuanHistoricalStatementsSeeder extends Seeder
{
  public function run(): void
  {
    $user = User::where('email', 'quan@liengmobile.com')->first()
      ?? User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))->first();

    if (! $user) {
      $this->command?->error('Không tìm thấy user.');

      return;
    }

    $dates = QuanEntry::query()
      ->where('note', 'import_sổ_cũ')
      ->selectRaw('date(occurred_at) as d')
      ->groupBy('d')
      ->orderBy('d')
      ->pluck('d');

    $saved = 0;

    foreach ($dates as $dateStr) {
      $date = Carbon::parse($dateStr)->startOfDay();
      $entries = QuanEntry::with('user:id,name')
        ->whereDate('occurred_at', $date->toDateString())
        ->orderBy('occurred_at')
        ->orderBy('id')
        ->get();

      if ($entries->isEmpty()) {
        continue;
      }

      $snapshot = $entries->map(fn (QuanEntry $e) => (new QuanEntryResource($e))->resolve())->values()->all();

      $income = 0.0;
      $cash = 0.0;
      $transfer = 0.0;
      $salesCount = 0;

      foreach ($entries as $entry) {
        if ($entry->type !== 'income') {
          continue;
        }
        $income += (float) $entry->amount;
        $cash += (float) ($entry->cash_amount ?? 0);
        $transfer += (float) ($entry->transfer_amount ?? 0);
        $salesCount += (int) ($entry->qty ?? 1);
      }

      $payload = [
        'income_total' => round($income, 2),
        'expense_total' => 0,
        'cash_total' => round($cash, 2),
        'transfer_total' => round($transfer, 2),
        'net_total' => round($income, 2),
        'sales_count' => $salesCount,
        'expense_count' => 0,
        'row_count' => $entries->count(),
        'rows_snapshot' => $snapshot,
        'note' => 'Nhập từ sổ cũ 11–19/7',
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
        ]);
      }

      $saved++;
    }

    $this->command?->info("Đã lưu/cập nhật {$saved} sao kê ngày.");
  }
}

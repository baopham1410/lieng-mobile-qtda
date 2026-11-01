<?php

namespace Database\Seeders;

use App\Models\QuanEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QuanHistoricalLedgerSeeder extends Seeder
{
    /** Giá ghi theo nghìn đồng (VD: 120 = 120.000đ). */
    private const YEAR = 2026;

    private const RAW = <<<'LEDGER'
Ngày 11/7
Xim: 100
Cường: 90
Sạc: 180
Cl: 20
Sạc: 190
Sạc: 170
Dự phòng: 280
Kính: 150
Quạt: 270
Sửa: 80
Pin: 70
Sạc: 60
Sạc: 180
Màn: 450
Cl: 90
Sửa: 80
USB + C: 80
Màn: 450
2 Đồng H Tường: 260

Ngày 12/7
Kính: 90
Sửa: 50
Sạc: 80
Cl: 60
Màn: 450
Màn: 350
Sạc: 100
Sửa: 440
Sửa: 80
Sạc: 70
Xim: 120
Quạt: 370
OPPO A6x: 2,998

Ngày 12/7 (Trang bổ sung)
SamSung: 1300
Pin dự phòng: 550

Ngày 13/7
Bạc: 160
Sạc: 80
Đèn chớp: 850
Xim: 120
Vỏ: 65
Pin: 240
Sạc: 80
Sửa: 80
Sạc: 130
OPPO A60: 3,999
Mỹ Càng: 4,200

Ngày 14/7
Sạc: 130
Bao: 150
Sửa: 70
Cl: 50
Xe: 350
Sạc: 70
Màn: 450
Sạc: 120
Xim: 120
Sạc: 100
Nhớt: 50
Nồi cơm: 320
Cl: 50

Ngày 15/7
Màn: 450
Cl: 50
Sửa: 80
Săm: 120
Sạc: 80
Siết: 90
Sạc: 50
Xim: 120
Xim: 120
Sạc: 70
Sạc: 60
Sửa: 70
Sửa: 60
Bịp: 30

Ngày 16/7
Mũ thử: 450
Sửa: 370 + 50
Sửa: 100
Màn: 70
Sửa: 80
Sửa: 300
Màn: 100
Cl: 350
Đầu: 50
USB: 300
Sạc: 150
Màn: 90
Sạc: 350
Xe: 60
Xim: 320
Sạc: 120
Màn: 90 / 350

Ngày 17/7
Kính: 120
Sửa: 50
Sạc: 190
Sạc: 80
Sạc: 200
Mũ thử: 380
Mũ thử: 390
Xim: 120
Pin: 50
CL: 50
Pin: 390
Mũ thử: 450
Pin: 200
Sạc: 450
Màn: 650
Xe: 120
Xim: 120
Xim: 160
Sạc: 50
Sạc: 60
Sửa: 60
Sửa: 70
ĐH: 1000

Ngày 18/7
Xim: 120
Màn: 350
Màn: 600
Sửa: 80
Sửa: 80
Màn: 450
Sửa +: 90
Chạy: 300
Xe: 290
Cl: 50
Màn: 350
Pin: 250
Sửa: 100
Sạc: 80
Chạy: 450
Màn: 50
Sạc: 100
Sạc: 10
Sửa: 370
Mũ thử: 100
Sửa: 100
Tủ Nước: 1700
Sạc: 180
Màn: 450

Ngày 19/7
Sạc: 140
Sửa: 250
Sạc: 200
Sạc: 80
Sạc: 80
Sạc: 140
Màn: 450
Sạc: 80
Xim: 120
USB: 60
Màn: 60
Phim: 350
Cl: 50
Sửa: 150
Sạc: 100
Sạc: 190
Phim: 380
Mũ thử: 250
Pin: 80
Sạc: 70
Kính: 50
POPSP 20: 2,999
Cl: 50
Màn: 350
Sửa: 160
Ốp: 50
Chạy: 100
Màn: 450
LEDGER;

    public function run(): void
    {
        $user = User::where('email', 'quan@liengmobile.com')->first()
            ?? User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))->first();

        if (! $user) {
            $this->command?->error('Không tìm thấy user quan/admin để gán sổ.');

            return;
        }

        $parsed = $this->parseLedger(self::RAW);
        $imported = 0;
        $skipped = 0;

        foreach ($parsed as $row) {
            $exists = QuanEntry::query()
                ->where('type', 'income')
                ->whereDate('occurred_at', $row['date'])
                ->where('title', $row['title'])
                ->where('amount', $row['amount'])
                ->where('note', 'import_sổ_cũ')
                ->exists();

            if ($exists) {
                $skipped++;

                continue;
            }

            QuanEntry::create([
                'type' => 'income',
                'title' => $row['title'],
                'qty' => $row['qty'],
                'amount' => $row['amount'],
                'payment_method' => 'cash',
                'cash_amount' => $row['amount'],
                'transfer_amount' => 0,
                'note' => 'import_sổ_cũ',
                'code' => 'QN-HIST-'.$row['date']->format('Ymd').'-'.strtoupper(Str::random(4)),
                'user_id' => $user->id,
                'occurred_at' => $row['occurred_at'],
            ]);
            $imported++;
        }

        $this->command?->info("Đã nhập {$imported} dòng, bỏ qua {$skipped} dòng trùng.");
    }

    /**
     * @return list<array{date: Carbon, occurred_at: Carbon, title: string, qty: int, amount: float}>
     */
    private function parseLedger(string $raw): array
    {
        $rows = [];
        $currentDate = null;
        $seq = 0;

        foreach (preg_split('/\R+/', trim($raw)) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if (preg_match('/^Ngày\s+(\d{1,2})\/(\d{1,2})/iu', $line, $m)) {
                $currentDate = Carbon::create(self::YEAR, (int) $m[2], (int) $m[1], 12, 0, 0);
                $seq = 0;

                continue;
            }

            if (! $currentDate || ! str_contains($line, ':')) {
                continue;
            }

            [$left, $right] = array_map('trim', explode(':', $line, 2));
            $qty = 1;
            if (preg_match('/^(\d+)\s+(.+)$/', $left, $qm)) {
                $qty = max(1, (int) $qm[1]);
                $left = trim($qm[2]);
            }

            $title = $left;
            $parts = preg_split('/\s*[\+\/]\s*/', $right) ?: [$right];

            foreach ($parts as $part) {
                $part = trim($part);
                if ($part === '') {
                    continue;
                }

                $unit = $this->parseAmountThousands($part);
                if ($unit <= 0) {
                    continue;
                }

                $amount = round($unit * $qty, 2);
                $seq++;

                $rows[] = [
                    'date' => $currentDate->copy(),
                    'occurred_at' => $currentDate->copy()->addMinutes($seq),
                    'title' => $title,
                    'qty' => $qty,
                    'amount' => $amount,
                ];
            }
        }

        return $rows;
    }

    private function parseAmountThousands(string $value): float
    {
        $normalized = str_replace([',', '.'], '', trim($value));
        if ($normalized === '' || ! is_numeric($normalized)) {
            return 0;
        }

        return (float) $normalized * 1000;
    }
}

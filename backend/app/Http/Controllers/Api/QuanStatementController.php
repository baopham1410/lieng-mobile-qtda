<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuanEntryResource;
use App\Http\Resources\QuanStatementResource;
use App\Models\Order;
use App\Models\QuanEntry;
use App\Models\QuanStatement;
use App\Models\Transaction;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class QuanStatementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = QuanStatement::with('user:id,name')
            ->orderByDesc('statement_date')
            ->orderByDesc('id');

        if ($month = $request->query('month')) {
            // YYYY-MM
            try {
                $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
                $end = (clone $start)->endOfMonth();
                $query->whereBetween('statement_date', [$start->toDateString(), $end->toDateString()]);
            } catch (\Throwable) {
                // ignore invalid month
            }
        }

        if ($from = $request->query('from')) {
            $query->whereDate('statement_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('statement_date', '<=', $to);
        }

        $perPage = min($request->integer('per_page', 60), 120);
        $rows = $query->paginate($perPage);

        // List không cần snapshot nặng
        $rows->getCollection()->transform(function (QuanStatement $item) {
            $item->makeHidden(['rows_snapshot']);

            return $item;
        });

        return response()->json([
            'data' => QuanStatementResource::collection($rows),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    public function show(QuanStatement $quanStatement): JsonResponse
    {
        $quanStatement->load('user:id,name');

        return response()->json([
            'data' => new QuanStatementResource($quanStatement),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'statement_date' => 'nullable|date',
            'note' => 'nullable|string|max:500',
            'force' => 'nullable|boolean',
        ]);

        $date = isset($validated['statement_date'])
            ? Carbon::parse($validated['statement_date'])->startOfDay()
            : now()->startOfDay();

        $snapshot = $this->buildDaySnapshot($date->toDateString());

        if ($snapshot->isEmpty()) {
            return response()->json([
                'message' => 'Ngày này chưa có đơn POS / thu chi để lưu sao kê.',
            ], 422);
        }

        $existing = QuanStatement::whereDate('statement_date', $date->toDateString())->first();
        if ($existing && empty($validated['force'])) {
            return response()->json([
                'message' => 'Sao kê ngày này đã tồn tại. Gửi force=true để ghi đè.',
                'data' => new QuanStatementResource($existing->load('user:id,name')),
                'exists' => true,
            ], 409);
        }

        $income = 0.0;
        $expense = 0.0;
        $cash = 0.0;
        $transfer = 0.0;
        $salesCount = 0;
        $expenseCount = 0;

        foreach ($snapshot as $row) {
            $amount = (float) ($row['amount'] ?? 0);
            if (($row['type'] ?? '') === 'income') {
                $income += $amount;
                $cash += (float) ($row['cashAmount'] ?? 0);
                $transfer += (float) ($row['transferAmount'] ?? 0);
                $salesCount += (int) ($row['qty'] ?? 1);
            } else {
                $expense += $amount;
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
            'row_count' => $snapshot->count(),
            'rows_snapshot' => $snapshot->values()->all(),
            'note' => $validated['note'] ?? $existing?->note,
            'user_id' => $request->user()->id,
        ];

        if ($existing) {
            $existing->update($payload);
            $statement = $existing->fresh()->load('user:id,name');
            $message = 'Đã cập nhật sao kê ngày '.$date->format('d/m/Y');
            $action = 'update';
        } else {
            $statement = QuanStatement::create([
                ...$payload,
                'code' => 'SK-'.$date->format('Ymd').'-'.strtoupper(Str::random(4)),
                'statement_date' => $date->toDateString(),
            ])->load('user:id,name');
            $message = 'Đã lưu sao kê ngày '.$date->format('d/m/Y');
            $action = 'create';
        }

        ActivityLogger::record($request->user(), [
            'action' => $action,
            'module' => 'reports',
            'title' => $message,
            'description' => ActivityLogger::formatMoney((float) $statement->net_total),
            'link' => '/reports/statements',
        ]);

        return response()->json([
            'data' => new QuanStatementResource($statement),
            'message' => $message,
        ], $existing ? 200 : 201);
    }

    /**
     * Gộp đơn POS hoàn tất + chi (transactions) + giao dịch Quán (nếu còn) trong ngày.
     */
    private function buildDaySnapshot(string $date): Collection
    {
        $rows = collect();

        $orders = Order::with(['user:id,name', 'items', 'incomeTransactions'])
            ->where('status', 'completed')
            ->where(function ($q) use ($date) {
                $q->whereDate('paid_at', $date)
                    ->orWhere(function ($q2) use ($date) {
                        $q2->whereNull('paid_at')->whereDate('created_at', $date);
                    });
            })
            ->orderBy('paid_at')
            ->orderBy('id')
            ->get();

        foreach ($orders as $order) {
            $amount = (float) $order->total;
            $method = $order->payment_method ?: 'cash';
            $breakdown = $order->paymentBreakdown();
            $cash = 0.0;
            $transfer = 0.0;

            if ($breakdown) {
                $cash = (float) ($breakdown['cashAmount'] ?? 0);
                $transfer = (float) ($breakdown['transferAmount'] ?? 0);
            } elseif (in_array($method, ['transfer', 'ewallet', 'bank'], true)) {
                $transfer = $amount;
            } elseif ($method === 'mixed') {
                $cash = $amount;
            } else {
                $cash = $amount;
            }

            $occurred = $order->paid_at ?? $order->created_at;
            $itemCount = max(1, (int) $order->items->count());

            $rows->push([
                'id' => 'order-'.$order->id,
                'code' => $order->code,
                'type' => 'income',
                'title' => 'Đơn POS '.$order->code,
                'quanProductId' => null,
                'qty' => $itemCount,
                'amount' => $amount,
                'unitCost' => null,
                'paymentMethod' => $method,
                'cashAmount' => $cash,
                'transferAmount' => $transfer,
                'note' => $order->notes,
                'staffName' => $order->user?->name ?? '',
                'occurredAt' => $occurred?->toIso8601String(),
                'createdAt' => $order->created_at?->toIso8601String(),
            ]);
        }

        $expenses = Transaction::with(['user:id,name', 'category:id,name'])
            ->where('type', 'expense')
            ->whereDate('transacted_at', $date)
            ->orderBy('transacted_at')
            ->orderBy('id')
            ->get();

        foreach ($expenses as $tx) {
            $amount = (float) $tx->amount;
            $method = $tx->payment_method ?: 'cash';
            $title = $tx->category?->name
                ?: ($tx->description ?: 'Chi phí '.$tx->code);

            $rows->push([
                'id' => 'tx-'.$tx->id,
                'code' => $tx->code,
                'type' => 'expense',
                'title' => $title,
                'quanProductId' => null,
                'qty' => 1,
                'amount' => $amount,
                'unitCost' => null,
                'paymentMethod' => $method,
                'cashAmount' => $method === 'cash' ? $amount : 0,
                'transferAmount' => in_array($method, ['transfer', 'ewallet', 'bank'], true) ? $amount : 0,
                'note' => $tx->description,
                'staffName' => $tx->user?->name ?? '',
                'occurredAt' => $tx->transacted_at?->toIso8601String(),
                'createdAt' => $tx->created_at?->toIso8601String(),
            ]);
        }

        $quanEntries = QuanEntry::with('user:id,name')
            ->whereDate('occurred_at', $date)
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        foreach ($quanEntries as $entry) {
            $rows->push((new QuanEntryResource($entry))->resolve());
        }

        return $rows->sortBy(fn (array $row) => $row['occurredAt'] ?? '')->values();
    }

    public function destroy(Request $request, QuanStatement $quanStatement): JsonResponse
    {
        $date = $quanStatement->statement_date?->format('d/m/Y');
        $code = $quanStatement->code;
        $quanStatement->delete();

        ActivityLogger::record($request->user(), [
            'action' => 'delete',
            'module' => 'quan',
            'title' => 'Xóa sao kê '.$code,
            'description' => $date,
            'link' => '/reports/statements',
        ]);

        return response()->json([
            'message' => 'Đã xóa sao kê',
        ]);
    }
}

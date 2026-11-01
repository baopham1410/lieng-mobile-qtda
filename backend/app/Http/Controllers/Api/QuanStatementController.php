<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuanEntryResource;
use App\Http\Resources\QuanStatementResource;
use App\Models\QuanEntry;
use App\Models\QuanStatement;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $entries = QuanEntry::with('user:id,name')
            ->whereDate('occurred_at', $date->toDateString())
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        if ($entries->isEmpty()) {
            return response()->json([
                'message' => 'Ngày này chưa có giao dịch để lưu sao kê.',
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

        $snapshot = $entries->map(fn (QuanEntry $entry) => (new QuanEntryResource($entry))->resolve())->values()->all();

        $income = 0.0;
        $expense = 0.0;
        $cash = 0.0;
        $transfer = 0.0;
        $salesCount = 0;
        $expenseCount = 0;

        foreach ($entries as $entry) {
            $amount = (float) $entry->amount;
            if ($entry->type === 'income') {
                $income += $amount;
                $cash += (float) ($entry->cash_amount ?? 0);
                $transfer += (float) ($entry->transfer_amount ?? 0);
                $salesCount += (int) ($entry->qty ?? 1);
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
            'row_count' => $entries->count(),
            'rows_snapshot' => $snapshot,
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
            'module' => 'quan',
            'title' => $message,
            'description' => ActivityLogger::formatMoney((float) $statement->net_total),
            'link' => '/quan/statements',
        ]);

        return response()->json([
            'data' => new QuanStatementResource($statement),
            'message' => $message,
        ], $existing ? 200 : 201);
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
            'link' => '/quan/statements',
        ]);

        return response()->json([
            'message' => 'Đã xóa sao kê',
        ]);
    }
}

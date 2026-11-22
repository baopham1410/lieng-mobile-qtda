<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerInquiry;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CustomerInquiry::query()->orderByDesc('created_at');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                    ->orWhere('customer_name', 'ilike', "%{$search}%")
                    ->orWhere('customer_phone', 'ilike', "%{$search}%")
                    ->orWhere('product_name', 'ilike', "%{$search}%")
                    ->orWhere('notes', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        $items = $query->limit(100)->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'code' => $c->code,
                'direction' => 'inbound',
                'callerPhone' => $c->customer_phone,
                'customerName' => $c->customer_name,
                'customerPhone' => $c->customer_phone,
                'topic' => $c->topic,
                'interestProduct' => $c->product_name,
                'status' => $c->status,
                'staffName' => $c->staff_name ?? 'Chưa tiếp nhận',
                'notes' => $c->notes ?? '',
                'recordingName' => null,
                'recordingDataUrl' => null,
                'startedAt' => $c->created_at?->toIso8601String(),
                'endedAt' => $c->status === 'done' ? $c->updated_at?->toIso8601String() : null,
                'durationSec' => null,
            ];
        });

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'required|string|max:30',
            'topic' => 'nullable|string|max:100',
            'interest_product' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:ringing,in_progress,done,missed,callback',
        ]);

        $todayPrefix = 'TV-'.now()->format('ymd').'-';
        $lastInquiry = CustomerInquiry::where('code', 'like', $todayPrefix.'%')->orderByDesc('id')->first();
        $seq = 1;
        if ($lastInquiry && preg_match('/-(\d+)$/', $lastInquiry->code, $m)) {
            $seq = ((int) $m[1]) + 1;
        }
        $code = $todayPrefix . str_pad($seq, 3, '0', STR_PAD_LEFT);

        $inquiry = CustomerInquiry::create([
            'code' => $code,
            'customer_name' => $validated['customer_name'] ?? 'Khách vãng lai',
            'customer_phone' => $validated['customer_phone'],
            'product_name' => $validated['interest_product'] ?? null,
            'topic' => $validated['topic'] ?? 'Tư vấn chọn máy',
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'] ?? 'in_progress',
            'staff_name' => $request->user()?->name ?? 'Nhân viên hotline',
        ]);

        return response()->json([
            'message' => 'Đã tạo phiên tư vấn thành công.',
            'data' => $inquiry,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $inquiry = CustomerInquiry::findOrFail($id);

        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:30',
            'topic' => 'nullable|string|max:100',
            'interest_product' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:ringing,in_progress,done,missed,callback',
            'staff_name' => 'nullable|string|max:100',
        ]);

        if (isset($validated['status'])) {
            $inquiry->status = $validated['status'];
        }
        if (isset($validated['customer_name'])) {
            $inquiry->customer_name = $validated['customer_name'];
        }
        if (isset($validated['customer_phone'])) {
            $inquiry->customer_phone = $validated['customer_phone'];
        }
        if (isset($validated['topic'])) {
            $inquiry->topic = $validated['topic'];
        }
        if (isset($validated['interest_product'])) {
            $inquiry->product_name = $validated['interest_product'];
        }
        if (array_key_exists('notes', $validated)) {
            $inquiry->notes = $validated['notes'];
        }
        if (isset($validated['staff_name'])) {
            $inquiry->staff_name = $validated['staff_name'];
        } elseif ($request->user()) {
            $inquiry->staff_name = $request->user()->name;
        }

        $inquiry->save();

        return response()->json([
            'message' => 'Cập nhật phiên tư vấn thành công.',
            'data' => $inquiry,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $inquiry = CustomerInquiry::findOrFail($id);
        $inquiry->delete();

        return response()->json(['message' => 'Đã xoá phiên tư vấn.']);
    }
}

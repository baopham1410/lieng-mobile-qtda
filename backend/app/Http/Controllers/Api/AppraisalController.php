<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppraisalTicketResource;
use App\Models\AppraisalPhoto;
use App\Models\AppraisalTicket;
use App\Services\ActivityLogger;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AppraisalController extends Controller
{
    public function health(): JsonResponse
    {
        $base = config('autograde.base_url');
        $timeout = min(10, (int) config('autograde.timeout', 60));

        try {
            $response = Http::timeout($timeout)->get("{$base}/health");
            if (! $response->successful()) {
                return response()->json([
                    'ok' => false,
                    'autograde_service' => false,
                    'message' => 'autograde-service trả lỗi HTTP '.$response->status(),
                ], 503);
            }

            return response()->json([
                'ok' => true,
                'autograde_service' => $response->json(),
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'ok' => false,
                'autograde_service' => false,
                'message' => 'Không kết nối được autograde-service tại '.$base.'. Hãy chạy uvicorn :8091.',
            ], 503);
        }
    }

    public function pricing(): JsonResponse
    {
        $path = base_path('../data/autograde/pricing/iphone_tradein_pricing.json');
        if (! is_file($path)) {
            return response()->json([
                'message' => 'Không tìm thấy file bảng giá iphone_tradein_pricing.json.',
            ], 404);
        }

        $json = json_decode((string) file_get_contents($path), true);
        if (! is_array($json)) {
            return response()->json(['message' => 'File bảng giá không hợp lệ.'], 500);
        }

        $models = [];
        foreach ($json['floor_prices'] ?? [] as $row) {
            $model = (string) ($row['model'] ?? '');
            $storage = (string) ($row['storage'] ?? '');
            if ($model === '') {
                continue;
            }
            $models[$model] ??= [];
            if ($storage !== '' && ! in_array($storage, $models[$model], true)) {
                $models[$model][] = $storage;
            }
        }

        return response()->json([
            'data' => [
                'meta' => $json['meta'] ?? [],
                'models' => $models,
                'floor_prices' => $json['floor_prices'] ?? [],
                'parts_deductions' => $json['parts_deductions'] ?? [],
                'grading_matrix' => $json['grading_matrix'] ?? [],
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = AppraisalTicket::with(['photos', 'user'])->orderByDesc('created_at');

        if ($search = trim((string) $request->query('search', ''))) {
            $likeOp = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $likeOp) {
                $q->where('code', $likeOp, "%{$search}%")
                    ->orWhere('ticket_qr', $likeOp, "%{$search}%")
                    ->orWhere('customer_name', $likeOp, "%{$search}%")
                    ->orWhere('customer_phone', $likeOp, "%{$search}%")
                    ->orWhere('model', $likeOp, "%{$search}%")
                    ->orWhere('imei', $likeOp, "%{$search}%")
                    ->orWhere('ai_grade', $likeOp, "%{$search}%");
            });
        }

        if (($status = $request->query('status')) && $status !== 'all') {
            $query->where('status', $status);
        }

        $tickets = $query->get();

        $stats = [
            'total' => AppraisalTicket::count(),
            'draft' => AppraisalTicket::where('status', 'draft')->count(),
            'quoted' => AppraisalTicket::where('status', 'quoted')->count(),
            'accepted' => AppraisalTicket::where('status', 'accepted')->count(),
            'rejected' => AppraisalTicket::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'data' => AppraisalTicketResource::collection($tickets)->resolve(),
            'stats' => $stats,
        ]);
    }

    public function show(AppraisalTicket $appraisal): JsonResponse
    {
        $appraisal->load(['photos', 'user']);

        return response()->json([
            'data' => new AppraisalTicketResource($appraisal),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateTicketPayload($request, creating: true);

        return DB::transaction(function () use ($validated, $request) {
            $code = $this->allocateTicketCode();
            $hardware = $this->normalizeHardware($validated['hardware'] ?? []);

            $ticket = AppraisalTicket::create([
                'code' => $code,
                'ticket_qr' => 'AG-'.$code,
                'user_id' => $request->user()?->id,
                'customer_name' => $validated['customerName'] ?? null,
                'customer_phone' => $validated['customerPhone'] ?? null,
                'brand' => $validated['brand'] ?? 'Apple',
                'model' => $validated['model'],
                'storage' => $validated['storage'] ?? '256GB',
                'imei' => $validated['imei'] ?? null,
                'accessories_note' => $validated['accessoriesNote'] ?? null,
                'hardware_checks' => $hardware,
                'ai_ran' => false,
                'ai_mode' => 'pending',
                'suggested_price' => (float) ($validated['suggestedPrice'] ?? 0),
                'final_price' => (float) ($validated['finalPrice'] ?? 0),
                'status' => $validated['status'] ?? 'draft',
            ]);

            ActivityLogger::record($request->user(), [
                'action' => 'create',
                'module' => 'appraisal',
                'title' => 'Tạo phiếu thẩm định '.$ticket->code,
                'description' => trim("{$ticket->brand} {$ticket->model} {$ticket->storage}"),
                'link' => '/appraisal',
                'metadata' => ['appraisal_ticket_id' => $ticket->id, 'code' => $ticket->code],
            ]);

            return response()->json([
                'data' => new AppraisalTicketResource($ticket->fresh(['photos', 'user'])),
                'message' => 'Tạo phiếu thẩm định thành công',
            ], 201);
        });
    }

    public function update(Request $request, AppraisalTicket $appraisal): JsonResponse
    {
        $validated = $this->validateTicketPayload($request, creating: false);

        $updates = [];
        $map = [
            'customerName' => 'customer_name',
            'customerPhone' => 'customer_phone',
            'brand' => 'brand',
            'model' => 'model',
            'storage' => 'storage',
            'imei' => 'imei',
            'accessoriesNote' => 'accessories_note',
            'status' => 'status',
            'finalPrice' => 'final_price',
        ];

        foreach ($map as $inputKey => $column) {
            if (array_key_exists($inputKey, $validated)) {
                $updates[$column] = $validated[$inputKey];
            }
        }

        if (array_key_exists('hardware', $validated)) {
            $updates['hardware_checks'] = $this->normalizeHardware(
                array_merge($appraisal->hardware_checks ?? [], $validated['hardware'] ?? [])
            );
        }

        $appraisal->update($updates);

        ActivityLogger::record($request->user(), [
            'action' => 'update',
            'module' => 'appraisal',
            'title' => 'Cập nhật phiếu '.$appraisal->code,
            'description' => 'Trạng thái: '.$appraisal->status.' · Giá chốt: '.ActivityLogger::formatMoney((float) $appraisal->final_price),
            'link' => '/appraisal',
            'metadata' => ['appraisal_ticket_id' => $appraisal->id, 'code' => $appraisal->code],
        ]);

        return response()->json([
            'data' => new AppraisalTicketResource($appraisal->fresh(['photos', 'user'])),
            'message' => 'Cập nhật phiếu thẩm định thành công',
        ]);
    }

    public function destroy(Request $request, AppraisalTicket $appraisal): JsonResponse
    {
        $appraisal->load('photos');
        foreach ($appraisal->photos as $photo) {
            Storage::disk($photo->disk ?: 'public')->delete($photo->path);
        }

        $code = $appraisal->code;
        $id = $appraisal->id;
        $appraisal->delete();

        ActivityLogger::record($request->user(), [
            'action' => 'delete',
            'module' => 'appraisal',
            'title' => 'Xóa phiếu thẩm định '.$code,
            'description' => 'Đã xóa phiếu và ảnh đính kèm',
            'link' => '/appraisal',
            'metadata' => ['appraisal_ticket_id' => $id, 'code' => $code],
        ]);

        return response()->json(['message' => 'Đã xóa phiếu thẩm định']);
    }

    public function uploadPhoto(Request $request, AppraisalTicket $appraisal, string $slot): JsonResponse
    {
        if (! in_array($slot, AppraisalTicket::SLOTS, true)) {
            return response()->json([
                'message' => 'Slot ảnh không hợp lệ (front, back, corner_tl, corner_tr, corner_bl, corner_br, side, battery).',
            ], 422);
        }

        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        $file = $request->file('image');
        $existing = $appraisal->photos()->where('slot', $slot)->first();
        if ($existing) {
            Storage::disk($existing->disk ?: 'public')->delete($existing->path);
        }

        $path = $file->store("appraisals/{$appraisal->id}", 'public');

        AppraisalPhoto::updateOrCreate(
            ['appraisal_ticket_id' => $appraisal->id, 'slot' => $slot],
            [
                'disk' => 'public',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
            ]
        );

        return response()->json([
            'data' => new AppraisalTicketResource($appraisal->fresh(['photos', 'user'])),
            'message' => "Đã tải lên ảnh {$slot}",
        ]);
    }

    public function removePhoto(AppraisalTicket $appraisal, string $slot): JsonResponse
    {
        if (! in_array($slot, AppraisalTicket::SLOTS, true)) {
            return response()->json(['message' => 'Slot ảnh không hợp lệ.'], 422);
        }

        $photo = $appraisal->photos()->where('slot', $slot)->first();
        if ($photo) {
            Storage::disk($photo->disk ?: 'public')->delete($photo->path);
            $photo->delete();
        }

        return response()->json([
            'data' => new AppraisalTicketResource($appraisal->fresh(['photos', 'user'])),
            'message' => "Đã xóa ảnh {$slot}",
        ]);
    }

    public function servePhoto(AppraisalTicket $appraisal, string $slot): StreamedResponse
    {
        if (! in_array($slot, AppraisalTicket::SLOTS, true)) {
            abort(404);
        }

        $photo = $appraisal->photos()->where('slot', $slot)->firstOrFail();
        $disk = Storage::disk($photo->disk ?: 'public');
        if (! $disk->exists($photo->path)) {
            abort(404);
        }

        return $disk->response($photo->path, $photo->original_name ?: "{$slot}.jpg", [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    public function appraise(Request $request, AppraisalTicket $appraisal): JsonResponse
    {
        $appraisal->load(['photos', 'user']);

        if ($appraisal->photos->isEmpty()) {
            return response()->json([
                'message' => 'Cần tải lên ít nhất 1 ảnh (khuyến nghị đủ mặt trước/sau, 4 góc cạnh + màn Pin) trước khi chạy AutoGrade AI.',
            ], 422);
        }

        $validated = $request->validate([
            'brand' => 'nullable|string|max:80',
            'model' => 'nullable|string|max:120',
            'storage' => 'nullable|string|max:40',
            'imei' => 'nullable|string|max:60',
            'hardware' => 'nullable|array',
            'apply_suggested_price' => 'nullable|boolean',
        ]);

        $brand = $validated['brand'] ?? $appraisal->brand;
        $model = $validated['model'] ?? $appraisal->model;
        $storage = $validated['storage'] ?? $appraisal->storage;
        $imei = $validated['imei'] ?? $appraisal->imei;
        $hardware = $this->normalizeHardware(
            array_merge($appraisal->hardware_checks ?? [], $validated['hardware'] ?? [])
        );

        $meta = [
            'brand' => $brand,
            'model' => $model,
            'storage' => $storage,
            'imei' => $imei,
            'hardware' => $hardware,
        ];

        $base = config('autograde.base_url');
        $timeout = (int) config('autograde.timeout', 60);

        $pending = Http::timeout($timeout)->acceptJson();
        $attachedCount = 0;

        foreach ($appraisal->photos as $photo) {
            $bytes = $photo->getContent();
            if ($bytes === null) {
                continue;
            }
            $filename = $photo->original_name ?: ($photo->slot.'.jpg');
            $pending = $pending->attach($photo->slot, $bytes, $filename);
            $attachedCount++;
        }

        if ($attachedCount === 0) {
            return response()->json([
                'message' => 'Không đọc được dữ liệu ảnh đã lưu trên máy chủ.',
            ], 422);
        }

        try {
            $response = $pending->post("{$base}/appraise", [
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'AutoGrade AI service chưa sẵn sàng tại '.$base.'. Hãy khởi chạy autograde-service (:8091).',
            ], 503);
        }

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();

            return response()->json([
                'message' => is_string($detail) ? $detail : 'autograde-service trả lỗi khi thẩm định.',
            ], $response->status() >= 400 && $response->status() < 600 ? $response->status() : 502);
        }

        $aiPayload = $response->json();
        $normalized = $this->normalizeAiResponse($aiPayload);

        $suggestedPrice = (float) ($normalized['pricing']['suggested_price'] ?? 0);
        $applySuggested = array_key_exists('apply_suggested_price', $validated)
            ? (bool) $validated['apply_suggested_price']
            : true;

        $nextStatus = $appraisal->status;
        if ($normalized['reject']) {
            $nextStatus = 'rejected';
        } elseif ($appraisal->status === 'draft' || $appraisal->status === 'rejected') {
            $nextStatus = 'quoted';
        }

        $nextModel = $normalized['ocr']['model'] ?? null;
        $nextStorage = $normalized['ocr']['rom'] ?? null;

        $appraisal->update([
            'brand' => $brand,
            'model' => ($nextModel && $brand === 'Apple') ? $nextModel : $model,
            'storage' => ($nextStorage && $brand === 'Apple') ? $nextStorage : $storage,
            'imei' => $imei,
            'hardware_checks' => $hardware,
            'ai_ran' => true,
            'ai_mode' => 'autograde',
            'ai_grade' => $normalized['grade'],
            'ai_result' => $normalized,
            'suggested_price' => $suggestedPrice,
            'final_price' => $applySuggested ? $suggestedPrice : $appraisal->final_price,
            'status' => $nextStatus,
            'model_version' => $normalized['yolo']['weights'] ?? null,
            'appraised_at' => now(),
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'appraise',
            'module' => 'appraisal',
            'title' => 'Chạy AutoGrade '.$appraisal->code,
            'description' => "Hạng {$normalized['grade']} · Đề xuất ".ActivityLogger::formatMoney($suggestedPrice),
            'link' => '/appraisal',
            'metadata' => [
                'appraisal_ticket_id' => $appraisal->id,
                'grade' => $normalized['grade'],
                'suggested_price' => $suggestedPrice,
            ],
        ]);

        return response()->json([
            'data' => new AppraisalTicketResource($appraisal->fresh(['photos', 'user'])),
            'message' => 'Đã hoàn tất phân tích AutoGrade AI',
        ]);
    }

    public function confirmDetections(Request $request, AppraisalTicket $appraisal): JsonResponse
    {
        $validated = $request->validate([
            'detections' => 'present|array',
            'ocr' => 'nullable|array',
            'hardware' => 'nullable|array',
            'model' => 'nullable|string|max:120',
            'storage' => 'nullable|string|max:40',
            'apply_suggested_price' => 'nullable|boolean',
        ]);

        $hardware = $this->normalizeHardware(
            array_merge($appraisal->hardware_checks ?? [], $validated['hardware'] ?? [])
        );

        $existingAi = is_array($appraisal->ai_result) ? $appraisal->ai_result : [];
        $ocr = $validated['ocr'] ?? ($existingAi['ocr'] ?? null);
        $model = $validated['model'] ?? $appraisal->model;
        $storage = $validated['storage'] ?? $appraisal->storage;

        $base = config('autograde.base_url');
        $timeout = (int) config('autograde.timeout', 60);

        try {
            $response = Http::timeout($timeout)->acceptJson()->post("{$base}/valuate", [
                'brand' => $appraisal->brand,
                'model' => $model,
                'storage' => $storage,
                'hardware' => $hardware,
                'detections' => $validated['detections'],
                'ocr' => $ocr,
                'weights' => $appraisal->model_version,
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'AutoGrade AI service chưa sẵn sàng tại '.$base.'.',
            ], 503);
        }

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();

            return response()->json([
                'message' => is_string($detail) ? $detail : 'Không tính lại được giá từ autograde-service.',
            ], $response->status() >= 400 && $response->status() < 600 ? $response->status() : 502);
        }

        $normalized = $this->normalizeAiResponse($response->json());
        $suggestedPrice = (float) ($normalized['pricing']['suggested_price'] ?? 0);
        $applySuggested = array_key_exists('apply_suggested_price', $validated)
            ? (bool) $validated['apply_suggested_price']
            : true;

        $appraisal->update([
            'model' => $model,
            'storage' => $storage,
            'hardware_checks' => $hardware,
            'ai_ran' => true,
            'ai_mode' => 'autograde',
            'ai_grade' => $normalized['grade'],
            'ai_result' => $normalized,
            'suggested_price' => $suggestedPrice,
            'final_price' => $applySuggested ? $suggestedPrice : $appraisal->final_price,
            'status' => $normalized['reject'] ? 'rejected' : ($appraisal->status === 'draft' ? 'quoted' : $appraisal->status),
        ]);

        return response()->json([
            'data' => new AppraisalTicketResource($appraisal->fresh(['photos', 'user'])),
            'message' => 'Đã cập nhật xác nhận lỗi và tính lại giá',
        ]);
    }

    private function validateTicketPayload(Request $request, bool $creating): array
    {
        return $request->validate([
            'customerName' => 'nullable|string|max:255',
            'customerPhone' => 'nullable|string|max:40',
            'brand' => ($creating ? 'nullable' : 'sometimes').'|string|max:80',
            'model' => ($creating ? 'required' : 'sometimes|required').'|string|max:120',
            'storage' => 'nullable|string|max:40',
            'imei' => 'nullable|string|max:60',
            'accessoriesNote' => 'nullable|string|max:1000',
            'hardware' => 'nullable|array',
            'suggestedPrice' => 'nullable|numeric|min:0',
            'finalPrice' => 'nullable|numeric|min:0',
            'status' => ['nullable', Rule::in(AppraisalTicket::STATUSES)],
        ]);
    }

    private function normalizeHardware(array $hardware): array
    {
        $passFail = static fn ($val): string => $val === 'fail' ? 'fail' : 'pass';

        $allowedScreenDisplay = ['good', 'tint_flicker', 'spots_lines_ink', 'partial_dead'];
        $allowedScreenAuth = [
            'original',
            'history_unknown',
            'history_used_repaired',
            'history_genuine_replaced',
            'abnormal_bezel',
            'dynamic_island_issue',
        ];
        $allowedGlass = ['good', 'cracked', 'glue_bubbles'];

        $screenDisplay = in_array($hardware['screenDisplay'] ?? '', $allowedScreenDisplay, true)
            ? $hardware['screenDisplay']
            : 'good';
        $screenAuth = in_array($hardware['screenAuthenticity'] ?? '', $allowedScreenAuth, true)
            ? $hardware['screenAuthenticity']
            : 'original';
        $glassCondition = in_array($hardware['glassCondition'] ?? '', $allowedGlass, true)
            ? $hardware['glassCondition']
            : 'good';

        return [
            'touch' => $passFail($hardware['touch'] ?? 'pass'),
            'audio' => $passFail($hardware['audio'] ?? 'pass'),
            'vibrate' => $passFail($hardware['vibrate'] ?? 'pass'),
            'faceId' => $passFail($hardware['faceId'] ?? 'pass'),
            'icloudClean' => array_key_exists('icloudClean', $hardware) ? (bool) $hardware['icloudClean'] : true,
            'powerOn' => array_key_exists('powerOn', $hardware) ? (bool) $hardware['powerOn'] : true,
            'wifi' => $passFail($hardware['wifi'] ?? 'pass'),
            'bluetooth' => $passFail($hardware['bluetooth'] ?? 'pass'),
            'backCamera' => $passFail($hardware['backCamera'] ?? 'pass'),
            'frontCamera' => $passFail($hardware['frontCamera'] ?? 'pass'),
            'volumeDown' => $passFail($hardware['volumeDown'] ?? 'pass'),
            'volumeUp' => $passFail($hardware['volumeUp'] ?? 'pass'),
            'earpiece' => $passFail($hardware['earpiece'] ?? 'pass'),
            'speaker' => $passFail($hardware['speaker'] ?? 'pass'),
            'callMic' => $passFail($hardware['callMic'] ?? 'pass'),
            'videoMic' => $passFail($hardware['videoMic'] ?? 'pass'),
            'simSignal' => $passFail($hardware['simSignal'] ?? 'pass'),
            'screenDisplay' => $screenDisplay,
            'screenAuthenticity' => $screenAuth,
            'glassCondition' => $glassCondition,
            'powerButton' => ($hardware['powerButton'] ?? 'good') === 'broken' ? 'broken' : 'good',
            'trueTone' => ($hardware['trueTone'] ?? 'yes') === 'no' ? 'no' : 'yes',
            'charging' => ($hardware['charging'] ?? 'good') === 'unstable' ? 'unstable' : 'good',
        ];
    }

    private function normalizeAiResponse(array $payload): array
    {
        $ocr = $payload['ocr'] ?? [];
        $yolo = $payload['yolo'] ?? [];
        $pricing = $payload['pricing'] ?? [];

        return [
            'ran' => true,
            'mode' => 'autograde',
            'grade' => $payload['grade'] ?? null,
            'grade_label' => $payload['grade_label'] ?? null,
            'reject' => (bool) ($payload['reject'] ?? false),
            'reject_reason' => $payload['reject_reason'] ?? null,
            'yolo' => $yolo,
            'defects' => $yolo['detections'] ?? [],
            'ocr' => [
                'model' => $ocr['model'] ?? null,
                'rom' => $ocr['rom'] ?? null,
                'battery_percent' => $ocr['battery_percent'] ?? null,
                'batteryPercent' => $ocr['battery_percent'] ?? null,
                'unknown_part' => (bool) ($ocr['unknown_part'] ?? false),
                'unknownPart' => (bool) ($ocr['unknown_part'] ?? false),
                'raw_text' => $ocr['raw_text'] ?? '',
                'confidence' => $ocr['confidence'] ?? null,
            ],
            'pricing' => $pricing,
            'basePrice' => (float) ($pricing['floor_applied'] ?? 0),
            'deductions' => $payload['deductions'] ?? [],
            'suggestedPrice' => (float) ($pricing['suggested_price'] ?? 0),
            'formula_note' => $payload['formula_note'] ?? 'floor(Loại) − extras',
            'confidence' => $payload['confidence'] ?? null,
            'note' => $payload['note'] ?? 'Kết quả từ AutoGrade FastAPI (YOLOv8 + PaddleOCR + Bảng giá thu cũ).',
        ];
    }

    private function allocateTicketCode(): string
    {
        $prefix = 'TD-'.now()->format('ymd').'-';
        $latest = AppraisalTicket::where('code', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('code');

        $seq = 1;
        if (is_string($latest) && preg_match('/(\d+)$/', $latest, $m)) {
            $seq = ((int) $m[1]) + 1;
        }

        $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
        while (AppraisalTicket::where('code', $code)->exists()) {
            $seq++;
            $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
        }

        return $code;
    }
}

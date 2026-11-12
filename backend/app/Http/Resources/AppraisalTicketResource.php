<?php

namespace App\Http\Resources;

use App\Models\AppraisalTicket;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AppraisalTicket */
class AppraisalTicketResource extends JsonResource
{
    public function toArray($request): array
    {
        $photosBySlot = $this->photos->keyBy('slot');
        $photosMeta = [];
        $photos = [];

        foreach (AppraisalTicket::SLOTS as $slot) {
            $photo = $photosBySlot->get($slot);
            $photosMeta[$slot] = (bool) $photo;
            $photos[$slot] = $photo ? [
                'slot' => $photo->slot,
                'url' => $photo->publicUrl(),
                'originalName' => $photo->original_name,
                'mimeType' => $photo->mime_type,
                'sizeBytes' => $photo->size_bytes,
            ] : null;
        }

        $aiResult = is_array($this->ai_result) ? $this->ai_result : [];
        $defaultHardware = [
            'touch' => 'pass',
            'audio' => 'pass',
            'vibrate' => 'pass',
            'faceId' => 'pass',
            'icloudClean' => true,
            'powerOn' => true,
            'wifi' => 'pass',
            'bluetooth' => 'pass',
            'backCamera' => 'pass',
            'frontCamera' => 'pass',
            'volumeDown' => 'pass',
            'volumeUp' => 'pass',
            'earpiece' => 'pass',
            'speaker' => 'pass',
            'callMic' => 'pass',
            'videoMic' => 'pass',
            'simSignal' => 'pass',
            'screenDisplay' => 'good',
            'screenAuthenticity' => 'original',
            'glassCondition' => 'good',
            'powerButton' => 'good',
            'trueTone' => 'yes',
            'charging' => 'good',
        ];

        return [
            'id' => $this->id,
            'code' => $this->code,
            'ticketQr' => $this->ticket_qr,
            'customerName' => $this->customer_name ?? '',
            'customerPhone' => $this->customer_phone ?? '',
            'brand' => $this->brand,
            'model' => $this->model,
            'storage' => $this->storage ?? '256GB',
            'imei' => $this->imei ?? '',
            'accessoriesNote' => $this->accessories_note ?? '',
            'hardware' => array_merge($defaultHardware, is_array($this->hardware_checks) ? $this->hardware_checks : []),
            'photosMeta' => $photosMeta,
            'photos' => $photos,
            'aiResult' => [
                'ran' => (bool) $this->ai_ran,
                'mode' => $this->ai_mode ?? 'pending',
                'grade' => $this->ai_grade,
                'gradeLabel' => $aiResult['grade_label'] ?? $aiResult['gradeLabel'] ?? null,
                'reject' => (bool) ($aiResult['reject'] ?? false),
                'rejectReason' => $aiResult['reject_reason'] ?? $aiResult['rejectReason'] ?? null,
                'ocr' => $aiResult['ocr'] ?? null,
                'yolo' => $aiResult['yolo'] ?? null,
                'defects' => $aiResult['defects'] ?? [],
                'pricing' => $aiResult['pricing'] ?? null,
                'basePrice' => $aiResult['basePrice']
                    ?? ($aiResult['pricing']['floor_applied'] ?? null),
                'floorLoai1' => $aiResult['pricing']['floor_loai_1'] ?? null,
                'deductions' => $aiResult['deductions'] ?? [],
                'suggestedPrice' => (float) ($this->suggested_price ?? 0),
                'formula' => $aiResult['formula_note']
                    ?? $aiResult['formula']
                    ?? 'floor(Loại) − extras',
                'confidence' => $aiResult['confidence'] ?? null,
                'note' => $aiResult['note'] ?? '',
            ],
            'suggestedPrice' => (float) ($this->suggested_price ?? 0),
            'finalPrice' => (float) ($this->final_price ?? 0),
            'status' => $this->status,
            'modelVersion' => $this->model_version,
            'appraisedAt' => $this->appraised_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'staffName' => $this->user?->name ?? 'Nhân viên',
        ];
    }
}

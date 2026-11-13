<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class AppraisalPhoto extends Model
{
    protected $fillable = [
        'appraisal_ticket_id',
        'slot',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(AppraisalTicket::class, 'appraisal_ticket_id');
    }

    public function publicUrl(): string
    {
        return URL::temporarySignedRoute(
            'api.appraisals.photos.file',
            now()->addHours(12),
            [
                'appraisal' => $this->appraisal_ticket_id,
                'slot' => $this->slot,
            ]
        );
    }

    public function getContent(): ?string
    {
        $disk = Storage::disk($this->disk ?: 'public');

        return $disk->exists($this->path) ? $disk->get($this->path) : null;
    }
}

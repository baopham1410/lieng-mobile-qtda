<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ActivityLogger
{
    public static function record(?User $user, array $data): ?ActivityLog
    {
        if (! $user) {
            return null;
        }

        $log = ActivityLog::create([
            'user_id' => $user->id,
            'action' => $data['action'],
            'module' => $data['module'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'link' => $data['link'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);

        Cache::forget('dashboard:summary');

        return $log;
    }

    public static function isAdmin(?User $user): bool
    {
        $user?->loadMissing('role');

        return $user?->role?->name === 'admin';
    }

    public static function formatMoney(?float $amount): string
    {
        if ($amount === null) {
            return '—';
        }

        return number_format($amount, 0, ',', '.').' ₫';
    }
}

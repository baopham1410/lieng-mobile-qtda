<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\Cache;

class ReportCacheService
{
    private const TTL_SECONDS = 900;

    public static function rememberDashboard(Closure $callback): array
    {
        return Cache::remember(
            self::key('dashboard', 'summary'),
            self::TTL_SECONDS,
            $callback
        );
    }

    public static function rememberRevenue(string $suffix, Closure $callback): array
    {
        return Cache::remember(
            self::key('revenue', $suffix),
            self::TTL_SECONDS,
            $callback
        );
    }

    public static function rememberInventory(Closure $callback): array
    {
        return Cache::remember(
            self::key('inventory', 'summary'),
            self::TTL_SECONDS,
            $callback
        );
    }

    public static function bustDashboard(): void
    {
        self::bump('dashboard');
    }

    public static function bustRevenue(): void
    {
        self::bump('revenue');
    }

    public static function bustInventory(): void
    {
        self::bump('inventory');
    }

    public static function bustAll(): void
    {
        self::bustDashboard();
        self::bustRevenue();
        self::bustInventory();
    }

    private static function key(string $group, string $suffix): string
    {
        return "reports:{$group}:v".self::version($group).":{$suffix}";
    }

    private static function version(string $group): int
    {
        return (int) Cache::get("reports:{$group}:version", 1);
    }

    private static function bump(string $group): void
    {
        $key = "reports:{$group}:version";
        Cache::forever($key, self::version($group) + 1);
    }
}

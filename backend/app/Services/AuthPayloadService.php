<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class AuthPayloadService
{
    public static function forUser(User $user): array
    {
        $user->loadMissing('role:id,name,display_name');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar_url' => $user->avatar_url,
            'is_active' => (bool) $user->is_active,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'display_name' => $user->role->display_name,
            ] : null,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'permissions' => self::permissionsForRole($user->role_id),
        ];
    }

    public static function permissionsForRole(?int $roleId): array
    {
        if (! $roleId) {
            return [];
        }

        return Cache::rememberForever("auth:role_permissions:{$roleId}", function () use ($roleId) {
            return Permission::query()
                ->select('permissions.name')
                ->join('role_permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('role_permissions.role_id', $roleId)
                ->orderBy('permissions.name')
                ->pluck('permissions.name')
                ->values()
                ->all();
        });
    }

    public static function forgetRolePermissions(?int $roleId): void
    {
        if ($roleId) {
            Cache::forget("auth:role_permissions:{$roleId}");
        }
    }
}

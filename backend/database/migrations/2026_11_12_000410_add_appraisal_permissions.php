<?php

use App\Models\Permission;
use App\Models\Role;
use App\Services\AuthPayloadService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private const PERMISSIONS = [
        'appraisal.view',
        'appraisal.create',
        'appraisal.update',
        'appraisal.delete',
        'appraisal.appraise',
    ];

    public function up(): void
    {
        $permIds = [];
        foreach (self::PERMISSIONS as $name) {
            $perm = Permission::firstOrCreate(
                ['name' => $name],
                ['module' => 'appraisal']
            );
            $permIds[] = $perm->id;
        }

        foreach (['admin', 'sales_staff'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if (! $role) {
                continue;
            }
            foreach ($permIds as $permId) {
                if (! $role->permissions()->where('permissions.id', $permId)->exists()) {
                    $role->permissions()->attach($permId);
                }
            }
            AuthPayloadService::forgetRolePermissions($role->id);
        }
    }

    public function down(): void
    {
        foreach (['admin', 'sales_staff'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                AuthPayloadService::forgetRolePermissions($role->id);
            }
        }

        $perms = Permission::whereIn('name', self::PERMISSIONS)->get();
        foreach ($perms as $perm) {
            $perm->roles()->detach();
            $perm->delete();
        }
    }
};

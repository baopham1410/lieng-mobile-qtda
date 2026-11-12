<?php

use App\Models\Permission;
use App\Models\Role;
use App\Services\AuthPayloadService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
            return;
        }

        $permission = Permission::updateOrCreate(
            ['name' => 'customers.delete'],
            ['module' => 'customers']
        );

        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->permissions()->syncWithoutDetaching([$permission->id]);
            AuthPayloadService::forgetRolePermissions($admin->id);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        Permission::where('name', 'customers.delete')->delete();
        foreach (Role::pluck('id') as $roleId) {
            AuthPayloadService::forgetRolePermissions($roleId);
        }
    }
};

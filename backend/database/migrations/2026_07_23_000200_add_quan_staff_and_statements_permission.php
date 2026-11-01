<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\AuthPayloadService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $statements = Permission::firstOrCreate(
            ['name' => 'quan.statements'],
            ['module' => 'quan']
        );

        $manager = Role::updateOrCreate(
            ['name' => 'quan_manager'],
            ['display_name' => 'Admin Quán']
        );

        $staff = Role::updateOrCreate(
            ['name' => 'quan_staff'],
            ['display_name' => 'Nhân viên Quán']
        );

        foreach (['quan.view', 'quan.create', 'quan.delete', 'quan.statements'] as $name) {
            $perm = Permission::where('name', $name)->first();
            if ($perm && ! $manager->permissions()->where('permissions.id', $perm->id)->exists()) {
                $manager->permissions()->attach($perm->id);
            }
        }

        foreach (['quan.view', 'quan.create'] as $name) {
            $perm = Permission::where('name', $name)->first();
            if ($perm && ! $staff->permissions()->where('permissions.id', $perm->id)->exists()) {
                $staff->permissions()->attach($perm->id);
            }
        }

        // Gỡ quyền kho sao kê khỏi nhân viên nếu từng gắn nhầm
        $staff->permissions()->detach($statements->id);

        AuthPayloadService::forgetRolePermissions($manager->id);
        AuthPayloadService::forgetRolePermissions($staff->id);

        $admin = Role::where('name', 'admin')->first();
        if ($admin && ! $admin->permissions()->where('permissions.id', $statements->id)->exists()) {
            $admin->permissions()->attach($statements->id);
            AuthPayloadService::forgetRolePermissions($admin->id);
        }

        User::updateOrCreate(
            ['email' => 'nvquan@liengmobile.com'],
            [
                'name' => 'Nhân viên Quán',
                'password' => Hash::make('password'),
                'phone' => '0904444444',
                'role_id' => $staff->id,
                'is_active' => true,
            ]
        );
    }

    public function down(): void
    {
        User::where('email', 'nvquan@liengmobile.com')->delete();

        $staff = Role::where('name', 'quan_staff')->first();
        $staff?->permissions()->detach();
        $staff?->delete();

        $perm = Permission::where('name', 'quan.statements')->first();
        if ($perm) {
            $perm->roles()->detach();
            $perm->delete();
        }

        Role::where('name', 'quan_manager')->update(['display_name' => 'Quản lý Quán']);
    }
};

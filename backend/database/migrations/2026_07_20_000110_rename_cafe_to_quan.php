<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cafe_entries') && ! Schema::hasTable('quan_entries')) {
            Schema::rename('cafe_entries', 'quan_entries');
        }

        $this->renameRole('cafe_manager', 'quan_manager', 'Quản lý Quán');

        foreach (['view', 'create', 'delete'] as $action) {
            $this->renamePermission("cafe.{$action}", "quan.{$action}", 'quan');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('quan_entries') && ! Schema::hasTable('cafe_entries')) {
            Schema::rename('quan_entries', 'cafe_entries');
        }

        $this->renameRole('quan_manager', 'cafe_manager', 'Quản lý Quán');

        foreach (['view', 'create', 'delete'] as $action) {
            $this->renamePermission("quan.{$action}", "cafe.{$action}", 'cafe');
        }
    }

    private function renameRole(string $from, string $to, string $displayName): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        $existing = DB::table('roles')->where('name', $from)->first();
        if (! $existing) {
            return;
        }

        $target = DB::table('roles')->where('name', $to)->first();
        if ($target) {
            DB::table('users')->where('role_id', $existing->id)->update(['role_id' => $target->id]);
            if (Schema::hasTable('role_permissions')) {
                DB::table('role_permissions')->where('role_id', $existing->id)->delete();
            }
            DB::table('roles')->where('id', $existing->id)->delete();
        } else {
            DB::table('roles')->where('id', $existing->id)->update([
                'name' => $to,
                'display_name' => $displayName,
                'updated_at' => now(),
            ]);
        }
    }

    private function renamePermission(string $from, string $to, string $module): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $existing = DB::table('permissions')->where('name', $from)->first();
        if (! $existing) {
            return;
        }

        $target = DB::table('permissions')->where('name', $to)->first();
        if ($target) {
            if (Schema::hasTable('role_permissions')) {
                $roleIds = DB::table('role_permissions')->where('permission_id', $existing->id)->pluck('role_id');
                foreach ($roleIds as $roleId) {
                    DB::table('role_permissions')->updateOrInsert(
                        ['role_id' => $roleId, 'permission_id' => $target->id],
                        []
                    );
                }
                DB::table('role_permissions')->where('permission_id', $existing->id)->delete();
            }
            DB::table('permissions')->where('id', $existing->id)->delete();
        } else {
            DB::table('permissions')->where('id', $existing->id)->update([
                'name' => $to,
                'module' => $module,
                'updated_at' => now(),
            ]);
        }
    }
};

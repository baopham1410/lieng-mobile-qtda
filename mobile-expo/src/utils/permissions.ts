import type { AppUser } from '@/types'

export function hasPermission(user: AppUser | null | undefined, permission: string): boolean {
  return (user?.permissions ?? []).includes(permission)
}

/** Admin Quán / admin hệ thống — xem & lưu kho sao kê */
export function canManageQuanStatements(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'quan.statements')
}

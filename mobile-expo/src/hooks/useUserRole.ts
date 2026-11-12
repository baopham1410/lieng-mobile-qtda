import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'

export type UserRoleType = 'admin' | 'sales_staff' | 'warehouse_staff'

export interface UserRoleInfo {
  role: UserRoleType
  isAdmin: boolean
  isStoreOwner: boolean // Admin và Chủ quán dùng chung quyền quản trị cao nhất
  isSalesStaff: boolean
  isWarehouseStaff: boolean

  // Permissions khớp docs/roles-permissions.md và frontend/src/data/adminNav.js
  canAccessPos: boolean
  canManageOrders: boolean
  canApproveDiscount: boolean
  canCancelRefund: boolean
  canAccessVault: boolean
  canSettleVault: boolean
  canManageWarehouse: boolean
  canManageWarranty: boolean

  roleName: string
  roleTitle: string
  roleBadgeText: string
  roleBadgeBg: string
  roleBadgeColor: string
  employeeName: string
  employeeEmail: string
  employeePhone: string
  storeName: string
  storeAddress: string
}

export function useUserRole(): UserRoleInfo {
  const { user } = useAuth()

  return useMemo(() => {
    const rawRole = (user?.roleName || user?.roleDisplayName || (user as any)?.role?.name || '').toLowerCase()
    const email = (user?.email || '').toLowerCase()

    // 1. Phân loại Role chính xác
    let role: UserRoleType = 'sales_staff'

    if (
      rawRole === 'admin' ||
      rawRole === 'quan_manager' ||
      rawRole === 'owner' ||
      rawRole === 'manager' ||
      email.includes('admin') ||
      email.includes('quanly') ||
      email.includes('quan@')
    ) {
      role = 'admin'
    } else if (
      rawRole === 'warehouse_staff' ||
      rawRole === 'warehouse' ||
      rawRole === 'kho' ||
      email.includes('kho@') ||
      email.includes('kho')
    ) {
      role = 'warehouse_staff'
    } else {
      role = 'sales_staff'
    }

    const isAdmin = role === 'admin'
    const isStoreOwner = role === 'admin' // Chủ quán = Admin
    const isWarehouseStaff = role === 'warehouse_staff'
    const isSalesStaff = role === 'sales_staff'

    // 2. Quyền nghiệp vụ khớp chuẩn adminNav.js
    const canAccessPos = isAdmin || isSalesStaff
    const canManageOrders = isAdmin || isSalesStaff
    const canApproveDiscount = isAdmin
    const canCancelRefund = isAdmin
    const canAccessVault = isAdmin
    const canSettleVault = isAdmin
    const canManageWarehouse = isAdmin || isWarehouseStaff
    const canManageWarranty = true

    // 3. Tên và thông tin hiển thị
    let roleTitle = 'POS'
    let roleBadgeText = 'BÁN HÀNG'
    let roleBadgeBg = '#FEE2E2'
    let roleBadgeColor = '#9F1239'
    let defaultName = 'Nguyễn Văn A'
    let defaultEmail = 'banhang@liengmobile.com'
    let defaultPhone = '0901.111.111'

    if (isAdmin) {
      roleTitle = 'CHỦ QUÁN'
      roleBadgeText = 'CHỦ QUÁN'
      roleBadgeBg = '#FFD9DD'
      roleBadgeColor = '#7A0C10'
      defaultName = 'Trần Quốc Bảo'
      defaultEmail = 'quanly@liengmobile.com'
      defaultPhone = '0988.777.666'
    } else if (isWarehouseStaff) {
      roleTitle = 'THỦ KHO'
      roleBadgeText = 'THỦ KHO'
      roleBadgeBg = '#FEF3C7'
      roleBadgeColor = '#B45309'
      defaultName = 'Trần Minh Kho'
      defaultEmail = 'kho@liengmobile.com'
      defaultPhone = '0902.222.222'
    }

    const employeeName = user?.name || defaultName
    const employeeEmail = user?.email || defaultEmail
    const employeePhone = user?.phone || defaultPhone

    return {
      role,
      isAdmin,
      isStoreOwner,
      isSalesStaff,
      isWarehouseStaff,
      canAccessPos,
      canManageOrders,
      canApproveDiscount,
      canCancelRefund,
      canAccessVault,
      canSettleVault,
      canManageWarehouse,
      canManageWarranty,
      roleName: role,
      roleTitle,
      roleBadgeText,
      roleBadgeBg,
      roleBadgeColor,
      employeeName,
      employeeEmail,
      employeePhone,
      storeName: 'Liêng Mobile - Flagship #01',
      storeAddress: '123 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    }
  }, [user])
}

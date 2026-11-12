import { useMemo } from 'react'

import { useAuth } from '@/context/AuthContext'

export interface UserRoleInfo {
  isStoreOwner: boolean
  isAdmin: boolean
  isStaff: boolean
  roleName: string
  roleTitle: string
  employeeName: string
  employeeEmail: string
  employeePhone: string
  storeName: string
  storeAddress: string
}

export function useUserRole(): UserRoleInfo {
  const { user } = useAuth()

  return useMemo(() => {
    const role = (user?.roleName || '').toLowerCase()
    const email = (user?.email || '').toLowerCase()

    // Chủ quán / Quản lý (quan_manager hoặc email quan@)
    const isStoreOwner =
      role === 'quan_manager' ||
      role === 'quan_staff' ||
      role === 'owner' ||
      role === 'manager' ||
      email.includes('quan') ||
      email.includes('quanly')

    // Admin hệ thống
    const isAdmin = role === 'admin' || email.includes('admin')

    // Nhân viên bán hàng
    const isStaff = !isStoreOwner && !isAdmin

    const employeeName = isStoreOwner
      ? (user?.name && user.name !== 'Nguyễn Văn A' ? user.name : 'Trần Quốc Bảo')
      : (user?.name || 'Nguyễn Văn A')

    const employeeEmail = isStoreOwner
      ? (user?.email || 'quanly@liengmobile.com')
      : (user?.email || 'banhang@liengmobile.com')

    const employeePhone = isStoreOwner ? '0988.777.666' : (user?.phone || '0901.111.111')

    return {
      isStoreOwner,
      isAdmin,
      isStaff,
      roleName: isStoreOwner ? 'quan_manager' : isAdmin ? 'admin' : 'sales_staff',
      roleTitle: isStoreOwner ? 'CHỦ QUÁN' : isAdmin ? 'ADMIN' : 'POS',
      employeeName,
      employeeEmail,
      employeePhone,
      storeName: 'Liêng Mobile - Flagship #01',
      storeAddress: '123 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    }
  }, [user])
}


import type { AppUser } from '@/types'

export type MobileTabName =
  | 'home'
  | 'orders'
  | 'pos'
  | 'services'
  | 'account'
  | 'quay'
  | 'statement'
  | 'expense'
  | 'archive'

export function isAdmin(user: AppUser | null | undefined): boolean {
  return user?.roleName === 'admin'
}

export function hasPermission(user: AppUser | null | undefined, permission: string): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return (user.permissions ?? []).includes(permission)
}

export function hasAnyPermission(
  user: AppUser | null | undefined,
  permissions: readonly string[]
): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  const granted = user.permissions ?? []
  return permissions.some((p) => granted.includes(p))
}

/** Vai trò chuyên trách Module Quán (quan_manager, quan_staff) */
export function isQuanRole(user: AppUser | null | undefined): boolean {
  if (!user) return false
  if (user.roleName === 'quan_manager' || user.roleName === 'quan_staff') return true
  return (
    hasPermission(user, 'quan.view') &&
    !hasPermission(user, 'orders.view') &&
    !hasPermission(user, 'products.view')
  )
}

/** Xem tổng quan cửa hàng / kho */
export function canViewDashboard(user: AppUser | null | undefined): boolean {
  return hasAnyPermission(user, ['finance.reports', 'orders.view', 'products.view', 'stock_imports.view'])
}

/** Xem số liệu doanh thu / báo cáo tài chính */
export function canViewFinanceKpis(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'finance.reports')
}

/** Xem danh sách đơn hàng */
export function canViewOrders(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'orders.view')
}

/** Tạo đơn hàng mới */
export function canCreateOrder(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'orders.create')
}

/** Thanh toán tại quầy POS */
export function canCheckoutPos(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'orders.checkout')
}

/** Truy cập tab Quầy POS */
export function canUsePos(user: AppUser | null | undefined): boolean {
  return hasAnyPermission(user, ['orders.create', 'orders.checkout'])
}

/** Hủy / hoàn trả đơn hàng */
export function canCancelOrder(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'orders.cancel')
}

/** Tra cứu bảo hành & IMEI */
export function canLookupWarranty(user: AppUser | null | undefined): boolean {
  return hasAnyPermission(user, ['warranty.view', 'imei.view'])
}

/** Tiếp nhận phiếu sửa chữa / bảo hành */
export function canCreateWarrantyRepair(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'warranty.repair')
}

/** Xem danh sách thẩm định máy cũ (AutoGrade) */
export function canViewAppraisal(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'appraisal.view')
}

/** Tạo / chấm điểm thẩm định máy cũ */
export function canCreateAppraisal(user: AppUser | null | undefined): boolean {
  return hasAnyPermission(user, ['appraisal.create', 'appraisal.appraise'])
}

/** Truy cập tab Dịch vụ (bảo hành, tra IMEI hoặc thẩm định) */
export function canUseServicesTab(user: AppUser | null | undefined): boolean {
  return hasAnyPermission(user, [
    'warranty.view',
    'warranty.repair',
    'imei.view',
    'appraisal.view',
    'appraisal.create',
    'appraisal.appraise',
  ])
}

/** Truy cập Module Quán */
export function canAccessQuay(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'quan.view')
}

/** Tạo / sửa giao dịch & thực đơn Quán */
export function canCreateQuanEntry(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'quan.create')
}

/** Xóa giao dịch Quán */
export function canDeleteQuanEntry(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'quan.delete')
}

/** Admin Quán / admin hệ thống — xem & lưu kho sao kê */
export function canManageQuanStatements(user: AppUser | null | undefined): boolean {
  return hasPermission(user, 'quan.statements')
}

/** Danh sách tab hiển thị trên thanh điều hướng dưới theo quyền user */
export function getVisibleTabs(user: AppUser | null | undefined): MobileTabName[] {
  if (!user) return ['account']

  if (isQuanRole(user)) {
    return ['quay', 'statement', 'expense', 'archive', 'account']
  }

  const tabs: MobileTabName[] = []
  if (canViewDashboard(user)) tabs.push('home')
  if (canViewOrders(user)) tabs.push('orders')
  if (canUsePos(user)) tabs.push('pos')
  if (canUseServicesTab(user)) tabs.push('services')
  tabs.push('account')
  return tabs
}

/** Kiểm tra quyền truy cập từng màn hình tab */
export function canAccessTab(user: AppUser | null | undefined, tab: string): boolean {
  if (!user) return false
  if (isAdmin(user)) return true

  switch (tab) {
    case 'account':
      return true
    case 'home':
      return !isQuanRole(user) && canViewDashboard(user)
    case 'orders':
      return !isQuanRole(user) && canViewOrders(user)
    case 'pos':
      return !isQuanRole(user) && canUsePos(user)
    case 'services':
      return !isQuanRole(user) && canUseServicesTab(user)
    case 'quay':
    case 'statement':
      return canAccessQuay(user)
    case 'expense':
      return canAccessQuay(user) && canCreateQuanEntry(user)
    case 'archive':
      return canAccessQuay(user) && canManageQuanStatements(user)
    default:
      return false
  }
}

/** Màn hình mặc định sau đăng nhập theo vai trò (khớp Web roleRedirect) */
export function getDefaultRouteForUser(user: AppUser | null | undefined): string {
  if (!user) return '/login'

  if (isQuanRole(user)) {
    return '/(app)/(tabs)/quay'
  }
  if (user.roleName === 'sales_staff' && canUsePos(user)) {
    return '/(app)/(tabs)/pos'
  }
  if (canViewDashboard(user)) {
    return '/(app)/(tabs)/home'
  }
  if (canUsePos(user)) {
    return '/(app)/(tabs)/pos'
  }
  if (canUseServicesTab(user)) {
    return '/(app)/(tabs)/services'
  }
  return '/(app)/(tabs)/account'
}

/** Thông tin mô tả vai trò và quyền hạn để hiển thị tại màn Tôi */
export function getRoleDisplayInfo(user: AppUser | null | undefined): {
  title: string
  badge: string
  shiftTitle: string
  summary: string
  highlights: string[]
} {
  const roleName = user?.roleName ?? ''
  const title = user?.roleDisplayName || 'Nhân viên hệ thống'

  switch (roleName) {
    case 'admin':
      return {
        title,
        badge: 'ADMIN',
        shiftTitle: 'Toàn quyền hệ thống • Store & Quán',
        summary: 'Truy cập đầy đủ POS, Đơn hàng, Kho/IMEI, AutoGrade, Báo cáo & Quán.',
        highlights: [
          'Bán hàng POS & quản lý đơn',
          'Báo cáo tài chính & tồn kho',
          'Thẩm định AutoGrade & bảo hành',
          'Quản lý Quán & chốt kho sao kê',
        ],
      }
    case 'sales_staff':
      return {
        title,
        badge: 'BÁN HÀNG',
        shiftTitle: 'Ca chính: Bán lẻ & Quầy POS',
        summary: 'Tạo đơn POS, thanh toán, hủy đơn, tra IMEI, tiếp nhận bảo hành & thẩm định.',
        highlights: [
          'Bán lẻ POS & thanh toán đơn',
          'Xem & hủy đơn hàng tại quầy',
          'Tiếp nhận sửa chữa & bảo hành',
          'Thẩm định máy cũ AutoGrade',
        ],
      }
    case 'warehouse_staff':
      return {
        title,
        badge: 'KHO HÀNG',
        shiftTitle: 'Ca trực: Quản lý Kho & IMEI',
        summary: 'Theo dõi tổng quan tồn kho, tra cứu IMEI & tình trạng bảo hành thiết bị.',
        highlights: [
          'Tổng quan & chỉ số tồn kho',
          'Tra cứu IMEI & bảo hành (chỉ xem)',
          'Không truy cập Quầy POS & Đơn hàng',
        ],
      }
    case 'quan_manager':
      return {
        title,
        badge: 'QUẢN LÝ QUÁN',
        shiftTitle: 'Ca trực: Quản lý Module Quán',
        summary: 'Vận hành quầy Quán, ghi nhận thu/chi, xóa mục và chốt lưu kho sao kê.',
        highlights: [
          'Quầy Quán & gọi món nhanh',
          'Ghi nhận chi phí & sửa/xóa thu chi',
          'Lưu kho & quản lý sao kê Quán',
        ],
      }
    case 'quan_staff':
      return {
        title,
        badge: 'NHÂN VIÊN QUÁN',
        shiftTitle: 'Ca trực: Quầy Phục Vụ Quán',
        summary: 'Bán hàng tại Quầy Quán, ghi nhận chi phí phát sinh và xem sao kê trong ngày.',
        highlights: [
          'Bán hàng tại Quầy Quán',
          'Ghi nhận phiếu chi phí',
          'Kho lưu sao kê bị khóa (chỉ Quản lý)',
        ],
      }
    default:
      return {
        title,
        badge: roleName ? roleName.toUpperCase() : 'USER',
        shiftTitle: 'Phiên làm việc hệ thống',
        summary: `Đang có ${(user?.permissions ?? []).length} quyền được cấp từ máy chủ.`,
        highlights:
          (user?.permissions ?? []).length > 0
            ? (user?.permissions ?? []).slice(0, 4)
            : ['Chưa được cấp quyền nghiệp vụ'],
      }
  }
}

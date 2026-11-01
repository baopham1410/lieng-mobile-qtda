export const rolePermissions = {
  admin: [
    'users.view', 'users.create', 'users.update', 'users.delete',
    'products.view', 'products.create', 'products.update', 'products.delete',
    'imei.view', 'imei.manage', 'stock_imports.view', 'stock_imports.confirm',
    'orders.view', 'orders.checkout', 'customers.view', 'customers.create',
    'finance.view', 'finance.reports', 'warranty.view', 'warranty.repair',
  ],
  sales_staff: [
    'products.view', 'imei.view',
    'orders.view', 'orders.create', 'orders.checkout',
    'customers.view', 'customers.create', 'customers.update',
    'warranty.view', 'warranty.repair',
  ],
  warehouse_staff: [
    'products.view', 'products.create',
    'imei.view', 'imei.manage', 'imei.status',
    'stock_imports.view', 'stock_imports.create', 'stock_imports.confirm',
    'customers.view', 'warranty.view',
  ],
  quan_manager: [
    'quan.view', 'quan.create', 'quan.delete', 'quan.statements',
  ],
  quan_staff: [
    'quan.view', 'quan.create',
  ],
}

export const profileStatsByRole = {
  admin: { ordersToday: 0, revenueToday: 0, importsPending: 0, staffOnline: 0 },
  sales_staff: { ordersToday: 0, revenueToday: 0, customersServed: 0, avgOrderValue: 0 },
  warehouse_staff: { importsToday: 0, imeiScanned: 0, importsPending: 0, lowStockAlerts: 0 },
}

export const loginHistory = []

export const recentActivity = []

export const warehouseActivity = []

export const branches = []

export function formatProfileTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function permissionLabel(key) {
  const map = {
    'users.view': 'Xem nhân viên',
    'users.create': 'Thêm nhân viên',
    'users.update': 'Sửa nhân viên',
    'users.delete': 'Xóa nhân viên',
    'products.view': 'Xem sản phẩm',
    'products.create': 'Thêm sản phẩm',
    'products.update': 'Sửa sản phẩm',
    'products.delete': 'Xóa sản phẩm',
    'imei.view': 'Xem IMEI',
    'imei.manage': 'Quản lý IMEI',
    'imei.status': 'Đổi trạng thái IMEI',
    'stock_imports.view': 'Xem phiếu nhập',
    'stock_imports.create': 'Tạo phiếu nhập',
    'stock_imports.confirm': 'Xác nhận nhập kho',
    'orders.view': 'Xem đơn hàng',
    'orders.create': 'Tạo đơn',
    'orders.checkout': 'Thanh toán POS',
    'orders.cancel': 'Hủy đơn',
    'customers.view': 'Xem khách hàng',
    'customers.create': 'Thêm khách hàng',
    'customers.update': 'Sửa khách hàng',
    'finance.view': 'Xem thu chi',
    'finance.create': 'Tạo phiếu thu/chi',
    'finance.reports': 'Báo cáo tài chính',
    'quan.view': 'Xem Quán',
    'quan.create': 'Ghi bán / chi Quán',
    'quan.delete': 'Xóa giao dịch Quán',
    'quan.statements': 'Kho sao kê Quán',
    'warranty.view': 'Tra cứu bảo hành',
    'warranty.repair': 'Tiếp nhận sửa chữa',
  }
  return map[key] ?? key
}

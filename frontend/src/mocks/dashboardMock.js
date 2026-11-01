/** Mock disabled: keep empty exports so UI never shows fake dashboard data. */
export const dashboardStats = {
  revenueToday: 0,
  ordersToday: 0,
  imeiInStock: 0,
  revenueMonth: 0,
  pendingImports: 0,
  lowStockVariants: 0,
}

export const recentOrders = []

export const quickActions = [
  { label: 'Mở quầy bán', to: '/pos', icon: '🛒', roles: ['admin', 'sales_staff'] },
  { label: 'Tạo phiếu nhập', to: '/inventory/imports/create', icon: '📦', roles: ['admin', 'warehouse_staff'] },
  { label: 'Tra cứu IMEI', to: '/warranty', icon: '🔍', roles: ['admin', 'sales_staff', 'warehouse_staff'] },
]

export const roleWelcome = {
  admin: 'Quản lý toàn bộ hoạt động cửa hàng, nhân viên và báo cáo tài chính.',
  sales_staff: 'Sẵn sàng phục vụ khách tại quầy — mở POS để bắt đầu bán hàng.',
  warehouse_staff: 'Theo dõi nhập kho, quét IMEI và kiểm tra tồn kho hôm nay.',
}

export { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

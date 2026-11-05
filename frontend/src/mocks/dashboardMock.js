export const dashboardStats = {
  revenueToday: 51970000,
  ordersToday: 3,
  imeiInStock: 5,
  revenueMonth: 51970000,
  pendingImports: 1,
  lowStockVariants: 2,
}

export const recentOrders = [
  {
    id: 'HD-20260714-023',
    customer: 'Nguyễn Văn A',
    total: 19990000,
    status: 'completed',
    time: '14:30',
  },
  {
    id: 'HD-20260714-022',
    customer: 'Trần Thị B',
    total: 16990000,
    status: 'completed',
    time: '13:15',
  },
  {
    id: 'HD-20260714-021',
    customer: 'Lê Minh C',
    total: 14990000,
    status: 'completed',
    time: '11:45',
  },
]

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

/** Dữ liệu biểu đồ Doanh thu & Giá vốn thực tế trong bài */
export const revenueCostWeekly = {
  summary: {
    revenue: 51970000,
    profit: 12992500,
    margin: 25.0,
    growth: 15.2,
  },
  labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  revenue: [0, 14990000, 16990000, 19990000, 0, 0, 0],
  cost: [0, 11242500, 12742500, 14992500, 0, 0, 0],
}

export const revenueCostMonthly = {
  summary: {
    revenue: 51970000,
    profit: 12992500,
    margin: 25.0,
    growth: 15.2,
  },
  labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
  revenue: [0, 51970000, 0, 0],
  cost: [0, 38977500, 0, 0],
}

export const revenueCostYearly = {
  summary: {
    revenue: 51970000,
    profit: 12992500,
    margin: 25.0,
    growth: 15.2,
  },
  labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  revenue: [0, 0, 0, 0, 0, 0, 51970000, 0, 0, 0, 0, 0],
  cost: [0, 0, 0, 0, 0, 0, 38977500, 0, 0, 0, 0, 0],
}

/** Dữ liệu biểu đồ Tỷ trọng thiết bị theo thương hiệu thực tế trong bài */
export const deviceShareData = {
  totalSold: 3,
  items: [
    { name: 'Apple (iPhone)', value: 19990000, amountText: '20.0M', percent: 38, color: '#dc2626' },
    { name: 'Samsung Galaxy', value: 16990000, amountText: '17.0M', percent: 33, color: '#ea580c' },
    { name: 'Xiaomi / Redmi', value: 14990000, amountText: '15.0M', percent: 29, color: '#0284c7' },
  ],
}

export { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

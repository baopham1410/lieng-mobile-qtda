export const orderStats = {
  ordersToday: 0,
  revenueToday: 0,
  completedToday: 0,
  cancelledToday: 0,
  avgOrderValue: 0,
}

export const orderStatusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'pending_payment', label: 'Chờ thanh toán' },
  { value: 'draft', label: 'Nháp' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'failed', label: 'Thanh toán lỗi' },
  { value: 'expired', label: 'Hết hạn thanh toán' },
  { value: 'refunded', label: 'Hoàn tiền' },
]

export const paymentMethodOptions = [
  { value: 'all', label: 'Tất cả thanh toán' },
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'ewallet', label: 'Ví điện tử' },
  { value: 'mixed', label: 'Kết hợp' },
]

export const paymentMethodLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  ewallet: 'Ví điện tử',
  mixed: 'Kết hợp',
}

export const orderStatusLabels = {
  completed: 'Hoàn tất',
  pending_payment: 'Chờ thanh toán',
  draft: 'Nháp',
  cancelled: 'Đã hủy',
  failed: 'Thanh toán lỗi',
  expired: 'Hết hạn thanh toán',
  refunded: 'Hoàn tiền',
}

export const orderStatusClass = {
  completed: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-100',
  draft: 'bg-amber-50 text-amber-600 ring-amber-100',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  failed: 'bg-red-50 text-red-600 ring-red-100',
  expired: 'bg-orange-50 text-orange-700 ring-orange-100',
  refunded: 'bg-red-50 text-red-600 ring-red-100',
}

export const orderRows = []

export { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

export function formatOrderTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

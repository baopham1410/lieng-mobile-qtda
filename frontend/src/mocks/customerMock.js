export const customerStats = {
  totalCustomers: 0,
  newThisMonth: 0,
  loyaltyMembers: 0,
  totalRevenue: 0,
}

export const customerTierOptions = [
  { value: 'all', label: 'Tất cả hạng' },
  { value: 'diamond', label: 'Kim cương' },
  { value: 'gold', label: 'Vàng' },
  { value: 'silver', label: 'Bạc' },
  { value: 'regular', label: 'Thường' },
  { value: 'walkin', label: 'Vãng lai' },
]

export const customerTierLabels = {
  diamond: 'Kim cương',
  gold: 'Vàng',
  silver: 'Bạc',
  regular: 'Thường',
  walkin: 'Vãng lai',
}

export const customerTierClass = {
  diamond: 'bg-violet-50 text-violet-600 ring-violet-100',
  gold: 'bg-amber-50 text-amber-600 ring-amber-100',
  silver: 'bg-slate-100 text-slate-600 ring-slate-200',
  regular: 'bg-red-50 text-red-600 ring-red-100',
  walkin: 'bg-slate-50 text-slate-500 ring-slate-100',
}

export const customerRows = []

export { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

export function formatCustomerDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatPoints(value) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function getInitials(name) {
  if (!name || name === 'Khách lẻ') return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

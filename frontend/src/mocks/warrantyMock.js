export const warrantyStats = {
  active: 0,
  expiringSoon: 0,
  inRepair: 0,
  expired: 0,
}

export const warrantyStatusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Còn hiệu lực' },
  { value: 'expiring', label: 'Sắp hết hạn' },
  { value: 'in_repair', label: 'Đang sửa chữa' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'void', label: 'Đã hủy' },
]

export const warrantyStatusLabels = {
  active: 'Còn hiệu lực',
  expiring: 'Sắp hết hạn',
  in_repair: 'Đang sửa chữa',
  expired: 'Hết hạn',
  void: 'Đã hủy',
}

export const warrantyStatusClass = {
  active: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  expiring: 'bg-amber-50 text-amber-600 ring-amber-100',
  in_repair: 'bg-sky-50 text-sky-600 ring-sky-100',
  expired: 'bg-slate-100 text-slate-600 ring-slate-200',
  void: 'bg-red-50 text-red-600 ring-red-100',
}

export const warrantyRows = []

export function formatWarrantyDate(value) {
  if (!value) return '—'
  const d = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatRepairTime(value) {
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

export function normalizeImei(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function isValidImeiFormat(imei) {
  return /^\d{15}$/.test(imei)
}

export function findWarrantyByImei(imei) {
  const normalized = normalizeImei(imei)
  if (!normalized) return null
  return warrantyRows.find((w) => w.imei === normalized) ?? null
}

export function getDisplayStatus(warranty) {
  if (warranty.status === 'in_repair' || warranty.repairStatus === 'in_repair') return 'in_repair'
  return warranty.status
}

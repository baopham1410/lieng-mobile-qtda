export function formatMoney(value?: number | null): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Số tiền có dấu chấm nghìn, không kèm ₫ — dùng trong ô nhập (vd. 190.000) */
export function formatMoneyInput(value?: number | string | null): string {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return ''
  const amount = Number(digits)
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateVi(isoDate?: string | null): string {
  if (!isoDate) return '—'
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function formatDateTimeVi(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function parseMoneyInput(raw: string): number {
  const digits = String(raw ?? '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

/** Giữ chỉ chữ số khi gõ ô tiền (bỏ dấu chấm / ký tự khác) */
export function sanitizeMoneyDigits(raw: string): string {
  return String(raw ?? '').replace(/[^\d]/g, '')
}

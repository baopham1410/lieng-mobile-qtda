export function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0 ₫'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Định dạng tiền cho in/ảnh sao kê — tránh ký hiệu ₫ bị cắt khi export PNG. */
export function formatStatementMoney(value) {
  const amount = Math.round(Number(value) || 0)
  return `${amount.toLocaleString('vi-VN')} đ`
}

/** Số tiền không kèm ký hiệu — dùng trong ô nhập (vd. 190.000) */
export function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0'

  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount)
}

export function parseMoneyInput(raw) {
  if (raw == null || raw === '') return 0
  const digits = String(raw).replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

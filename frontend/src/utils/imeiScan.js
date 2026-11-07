import { isValidImeiFormat, normalizeImei, parseImeiText } from '@/utils/imeiValidation'

/** Lấy IMEI 15 số từ chuỗi súng quét / barcode / OCR. */
export function extractImeiFromScan(raw) {
  const digits = normalizeImei(raw)
  if (!digits) return ''

  if (isValidImeiFormat(digits)) return digits

  // Lấy mọi chuỗi 15 số liên tiếp (tem thường có thêm số serial khác)
  const matches = digits.match(/\d{15}/g) ?? []
  for (const candidate of matches) {
    if (isValidImeiFormat(candidate)) return candidate
  }

  // OCR đôi khi đọc thiếu/thừa 1 số — lấy cửa sổ 15 số tốt nhất
  if (digits.length > 15) {
    for (let i = 0; i <= digits.length - 15; i += 1) {
      const slice = digits.slice(i, i + 15)
      if (isValidImeiFormat(slice)) return slice
    }
  }

  return ''
}

export function appendImeiToText(currentText, imei) {
  const code = extractImeiFromScan(imei)
  if (!code) {
    return { text: currentText, added: false, reason: 'invalid', imei: '' }
  }

  const existing = new Set(parseImeiText(currentText))
  if (existing.has(code)) {
    return { text: currentText, added: false, reason: 'duplicate', imei: code }
  }

  const base = String(currentText ?? '').trim()
  const text = base ? `${base}\n${code}` : code
  return { text, added: true, reason: 'ok', imei: code }
}

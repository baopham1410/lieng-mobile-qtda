import { isValidImeiFormat, normalizeImei, parseImeiText } from '@/utils/imeiValidation'

/** IMEI chuẩn: chữ số kiểm Luhn (từ phải sang). */
export function isValidImeiLuhn(imei) {
  if (!isValidImeiFormat(imei)) return false
  let sum = 0
  for (let i = 0; i < 15; i += 1) {
    let digit = Number(imei[14 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

function collectCandidates(digits) {
  const found = new Set()
  if (!digits) return []

  if (digits.length === 15) found.add(digits)

  const matches = digits.match(/\d{15}/g) ?? []
  matches.forEach((m) => found.add(m))

  if (digits.length > 15) {
    for (let i = 0; i <= digits.length - 15; i += 1) {
      found.add(digits.slice(i, i + 15))
    }
  }

  return [...found].filter(isValidImeiFormat)
}

/**
 * Lấy IMEI 15 số từ chuỗi súng quét / barcode / OCR.
 * Ưu tiên ứng viên đúng Luhn; fallback 15 số đầu tiên.
 */
export function extractImeiFromScan(raw) {
  const digits = normalizeImei(raw)
  if (!digits) return ''

  const candidates = collectCandidates(digits)
  if (!candidates.length) return ''

  const luhnOk = candidates.find(isValidImeiLuhn)
  return luhnOk || candidates[0]
}

/** Liệt kê mọi IMEI hợp lệ trong text (hữu ích khi OCR đọc nhiều số). */
export function extractAllImeisFromScan(raw) {
  const digits = normalizeImei(raw)
  const candidates = collectCandidates(digits)
  const luhn = candidates.filter(isValidImeiLuhn)
  return luhn.length ? luhn : candidates
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

export function appendManyImeisToText(currentText, rawList) {
  let text = currentText
  const added = []
  const skipped = []

  for (const raw of rawList) {
    const result = appendImeiToText(text, raw)
    if (result.added) {
      text = result.text
      added.push(result.imei)
    } else if (result.imei) {
      skipped.push({ imei: result.imei, reason: result.reason })
    }
  }

  return { text, added, skipped }
}

/**
 * Tiền xử lý canvas để OCR dễ đọc số trên tem.
 * Scale 2.5x + grayscale + tăng tương phản + ngưỡng.
 */
export function preprocessCanvasForOcr(sourceCanvas) {
  const scale = 2.5
  const w = Math.max(1, Math.floor(sourceCanvas.width * scale))
  const h = Math.max(1, Math.floor(sourceCanvas.height * scale))
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d', { willReadFrequently: true })

  ctx.imageSmoothingEnabled = true
  ctx.drawImage(sourceCanvas, 0, 0, w, h)

  const image = ctx.getImageData(0, 0, w, h)
  const data = image.data
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    sum += gray
    data[i] = data[i + 1] = data[i + 2] = gray
  }
  const mean = sum / (data.length / 4)
  const threshold = Math.min(200, Math.max(90, mean * 0.92))

  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] > threshold ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = v
  }

  ctx.putImageData(image, 0, 0)
  return out
}

/**
 * Tiện ích xử lý và trích xuất IMEI từ Barcode / QR / Tem máy
 * Đồng bộ chuẩn 100% logic từ Web (frontend/src/utils/imeiScan.js & imeiValidation.js)
 */

const IMEI_PATTERN = /^\d{15}$/

/**
 * Các đầu số TAC (Type Allocation Code) phổ biến của smartphone chính hãng
 * 35: Apple, Samsung, Google, Sony, Xiaomi quốc tế
 * 86: Xiaomi, Oppo, Vivo, Realme, Huawei
 * 01: Bắc Mỹ (Apple, Samsung, Motorola)
 * 99: Multi-mode / CDMA
 * 30, 52, 54: Châu Âu / Châu Á
 * 32: Lô thiết bị điện tử / máy showroom
 */
const COMMON_TAC_PREFIXES = ['35', '86', '01', '99', '30', '52', '54', '98', '32']

export function normalizeImei(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '')
}

export function isValidImeiFormat(imei: string): boolean {
  return IMEI_PATTERN.test(imei)
}

export function isCommonPhoneTac(imei: string): boolean {
  if (!imei || imei.length < 2) return false
  return COMMON_TAC_PREFIXES.some((prefix) => imei.startsWith(prefix))
}

/**
 * Kiểm tra chữ số kiểm tra Luhn của IMEI chuẩn quốc tế
 */
export function isValidImeiLuhn(imei: string): boolean {
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

/**
 * Chuẩn hóa ký tự số dễ bị nhận diện nhầm thành chữ cái trong tem máy
 */
export function normalizeOcrDigits(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/[Oo]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[Zz]/g, '2')
    .replace(/[G]/g, '6')
}

/**
 * Trích xuất các chuỗi ứng viên 15 số từ văn bản hoặc chuỗi quét
 */
export function collectCandidatesWithMetadata(rawText: string): Array<{
  imei: string
  luhn: boolean
  commonTac: boolean
  source: string
}> {
  if (!rawText) return []
  const text = String(rawText)
  const candidates: Array<{ imei: string; luhn: boolean; commonTac: boolean; source: string }> = []
  const seen = new Set<string>()

  function pushCandidate(candidate15: string, src: string) {
    if (!candidate15 || candidate15.length !== 15 || !isValidImeiFormat(candidate15)) return
    if (seen.has(candidate15)) return
    seen.add(candidate15)
    candidates.push({
      imei: candidate15,
      luhn: isValidImeiLuhn(candidate15),
      commonTac: isCommonPhoneTac(candidate15),
      source: src,
    })
  }

  function addCandidate(rawCandidate: string, source = 'general') {
    if (!rawCandidate) return
    const rawStr = String(rawCandidate)

    // 1. Thử trực tiếp dạng số
    const digits = rawStr.replace(/\D/g, '')

    if (digits.length >= 15) {
      pushCandidate(digits.slice(0, 15), source)
      if (digits.length > 15 && !source.startsWith('labeled')) {
        for (let i = 1; i <= digits.length - 15; i += 1) {
          const slice = digits.slice(i, i + 15)
          if (isValidImeiLuhn(slice) || isCommonPhoneTac(slice)) {
            pushCandidate(slice, `${source}-window`)
          }
        }
      }
      return
    }

    // 2. Thử chuẩn hóa OCR
    const cleaned = normalizeOcrDigits(rawStr).replace(/\D/g, '')
    if (cleaned.length >= 15) {
      pushCandidate(cleaned.slice(0, 15), `${source}-ocr-corrected`)
      if (cleaned.length > 15 && !source.startsWith('labeled')) {
        for (let i = 1; i <= cleaned.length - 15; i += 1) {
          const slice = cleaned.slice(i, i + 15)
          if (isValidImeiLuhn(slice) || isCommonPhoneTac(slice)) {
            pushCandidate(slice, `${source}-ocr-window`)
          }
        }
      }
    }
  }

  // --- CHIẾN LƯỢC 1: Tìm theo nhãn tem chính xác (IMEI, IMEI1, IMEI2, MEID) ---
  const labelRegex = /(?:IMEI\s*[12]?|MEID|IMEI\/MEID)[\s:=-]+([0-9OIlSBZg\s/-]{14,35})/gi
  let match: RegExpExecArray | null
  while ((match = labelRegex.exec(text)) !== null) {
    if (match[1]) {
      addCandidate(match[1], 'labeled-imei')
    }
  }

  // --- CHIẾN LƯỢC 2: Duyệt theo từng dòng có nhãn IMEI ---
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/IMEI|MEID/i.test(trimmed)) {
      const afterLabel = trimmed.replace(/^.*?(?:IMEI\s*[12]?|MEID|IMEI\/MEID)[\s:=-]*/i, '')
      if (afterLabel) {
        addCandidate(afterLabel, 'labeled-line')
      }
      const parts = trimmed.split(/[:\s=-]+/)
      for (const part of parts) {
        addCandidate(part, 'line-imei-token')
      }
    }
  }

  // --- CHIẾN LƯỢC 3: Tìm token 15 chữ số ---
  const exact15Regex = /\b\d{15}\b/g
  while ((match = exact15Regex.exec(text)) !== null) {
    if (match[0]) {
      addCandidate(match[0], 'token-15')
    }
  }

  // --- CHIẾN LƯỢC 4: Tìm cụm số gom nhóm ---
  const groupedRegex = /\b([0-9OIlSBZ]{2,4}[\s/-][0-9OIlSBZ\s/-]{10,25})\b/gi
  while ((match = groupedRegex.exec(text)) !== null) {
    if (match[1]) {
      addCandidate(match[1], 'grouped-digits')
    }
  }

  // --- CHIẾN LƯỢC 5: Fallback gom toàn bộ chữ số ---
  if (candidates.length === 0) {
    const allDigits = normalizeImei(text)
    if (allDigits.length === 15) {
      addCandidate(allDigits, 'fallback-exact')
    } else if (allDigits.length > 15) {
      for (let i = 0; i <= allDigits.length - 15; i += 1) {
        const slice = allDigits.slice(i, i + 15)
        if (isValidImeiLuhn(slice) && isCommonPhoneTac(slice)) {
          addCandidate(slice, 'fallback-luhn-tac')
        }
      }
      if (candidates.length === 0) {
        for (let i = 0; i <= allDigits.length - 15; i += 1) {
          const slice = allDigits.slice(i, i + 15)
          if (isValidImeiLuhn(slice)) {
            addCandidate(slice, 'fallback-luhn')
          }
        }
      }
      if (candidates.length === 0) {
        addCandidate(allDigits.slice(0, 15), 'fallback-first15')
      }
    }
  }

  candidates.sort((a, b) => {
    const score = (item: typeof a) => {
      let s = 0
      if (item.source.startsWith('labeled')) s += 100
      if (item.luhn) s += 80
      if (item.commonTac) s += 40
      return s
    }
    return score(b) - score(a)
  })

  return candidates
}

export function extractAllImeisFromScan(raw: string): string[] {
  const candidates = collectCandidatesWithMetadata(raw)
  if (!candidates.length) return []

  const labeledCandidates = candidates.filter((c) => c.source.startsWith('labeled'))
  const luhnCandidates = candidates.filter((c) => c.luhn)

  let targetList = candidates
  if (labeledCandidates.length > 0) {
    targetList = labeledCandidates
  } else if (luhnCandidates.length > 0) {
    targetList = luhnCandidates
  }

  return [...new Set(targetList.map((c) => c.imei))]
}

export function extractImeiFromScan(raw: string): string {
  const all = extractAllImeisFromScan(raw)
  if (all.length > 0) return all[0]
  const candidates = collectCandidatesWithMetadata(raw)
  if (!candidates.length) return ''
  return candidates[0].imei
}

/**
 * Trích xuất IMEI trực tiếp từ chuỗi mã vạch (Barcode 1D / QR Code).
 */
export function extractImeiFromBarcode(raw: string): string {
  if (!raw) return ''
  const str = String(raw).trim()

  // 1. Lọc toàn bộ chữ số
  const digits = str.replace(/\D/g, '')

  // 2. Nếu vừa đúng 15 chữ số
  if (digits.length === 15) {
    return digits
  }

  // 3. Nếu là 16 chữ số (IMEISV) -> cắt 15 số đầu
  if (digits.length === 16) {
    return digits.slice(0, 15)
  }

  // 4. Nếu có tiền tố định danh (GS1 '01' / '91' hoặc đầu đọc gửi kèm mã định danh)
  if (digits.length > 15) {
    for (let i = 0; i <= digits.length - 15; i += 1) {
      const slice = digits.slice(i, i + 15)
      if (isValidImeiLuhn(slice) || isCommonPhoneTac(slice)) {
        return slice
      }
    }
    return digits.slice(0, 15)
  }

  // 5. Fallback: tìm chuỗi 15 số nguyên vẹn trong văn bản quét
  const fromScan = extractImeiFromScan(str)
  if (fromScan) return fromScan

  // Trả về chuỗi nguyên gốc đã làm sạch nếu không phải dạng số thuần
  return str.trim()
}

/**
 * Tiền xử lý canvas tăng cường tương phản và độ sắc nét giúp giải mã barcode/OCR
 */
export function preprocessCanvasForBarcode(
  sourceCanvas: HTMLCanvasElement,
  options: { binarize?: boolean; threshold?: number } = {}
): HTMLCanvasElement {
  if (typeof document === 'undefined') return sourceCanvas

  const w = sourceCanvas.width
  const h = sourceCanvas.height
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) return sourceCanvas

  ctx.drawImage(sourceCanvas, 0, 0, w, h)
  try {
    const image = ctx.getImageData(0, 0, w, h)
    const data = image.data

    let minLum = 255
    let maxLum = 0

    // Bước 1: Grayscale + tìm min/max luminance
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
      data[i] = data[i + 1] = data[i + 2] = gray
      if (gray < minLum) minLum = gray
      if (gray > maxLum) maxLum = gray
    }

    // Bước 2: Kéo dãn tương phản động
    const range = maxLum - minLum
    if (range > 20) {
      for (let i = 0; i < data.length; i += 4) {
        const stretched = Math.round(((data[i] - minLum) / range) * 255)
        data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, stretched))
      }
    }

    // Bước 3: Nhị phân hóa (tùy chọn)
    if (options.binarize) {
      const threshold = options.threshold ?? 128
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i] > threshold ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = v
      }
    }

    ctx.putImageData(image, 0, 0)
    return out
  } catch {
    return sourceCanvas
  }
}

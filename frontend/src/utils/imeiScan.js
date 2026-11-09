import { isValidImeiFormat, normalizeImei, parseImeiText } from '@/utils/imeiValidation'

/**
 * Các đầu số TAC (Type Allocation Code) phổ biến của điện thoại chính hãng
 * 35: Apple, Samsung, Google, Sony, Nokia, Xiaomi quốc tế
 * 86: Xiaomi, Oppo, Vivo, Realme, Huawei
 * 01: Bắc Mỹ (Apple, Samsung, Motorola)
 * 99: Multi-mode / CDMA
 * 30, 52, 54: Châu Âu / Châu Á
 */
const COMMON_TAC_PREFIXES = ['35', '86', '01', '99', '30', '52', '54', '98']

export function isCommonPhoneTac(imei) {
  if (!imei || imei.length < 2) return false
  return COMMON_TAC_PREFIXES.some((prefix) => imei.startsWith(prefix))
}

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

/**
 * Chuẩn hóa ký tự số dễ bị OCR nhận diện nhầm thành chữ cái trong ngữ cảnh tem IMEI.
 * O, o -> 0
 * I, l, |, ! -> 1
 * S, s -> 5
 * B -> 8
 * Z, z -> 2
 * G, b -> 6
 */
export function normalizeOcrDigits(str) {
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
 * Trích xuất các chuỗi ứng viên 15 số từ văn bản OCR hoặc mã quét.
 * Hỗ trợ tem Apple, Samsung, Xiaomi, Oppo (IMEI, IMEI1, IMEI2, MEID, v.v.).
 */
export function collectCandidatesWithMetadata(rawText) {
  if (!rawText) return []
  const text = String(rawText)
  const candidates = []
  const seen = new Set()

  function addCandidate(rawCandidate, source = 'general') {
    if (!rawCandidate) return
    // 1. Thử trực tiếp dạng số
    let digits = rawCandidate.replace(/\D/g, '')

    // 2. Nếu có độ dài 16 số (IMEISV thường có /01 hoặc /02), lấy 15 số đầu
    if (digits.length === 16 && isValidImeiLuhn(digits.slice(0, 15))) {
      digits = digits.slice(0, 15)
    }

    // 3. Nếu là 15 số
    if (digits.length === 15 && isValidImeiFormat(digits)) {
      if (!seen.has(digits)) {
        seen.add(digits)
        candidates.push({
          imei: digits,
          luhn: isValidImeiLuhn(digits),
          commonTac: isCommonPhoneTac(digits),
          source,
        })
      }
      return
    }

    // 4. Nếu bị dính chữ cái OCR nhầm
    const cleaned = normalizeOcrDigits(rawCandidate).replace(/\D/g, '')
    let candidate15 = ''
    if (cleaned.length === 15) {
      candidate15 = cleaned
    } else if (cleaned.length === 16 && isValidImeiLuhn(cleaned.slice(0, 15))) {
      candidate15 = cleaned.slice(0, 15)
    }

    if (candidate15 && isValidImeiFormat(candidate15) && !seen.has(candidate15)) {
      seen.add(candidate15)
      candidates.push({
        imei: candidate15,
        luhn: isValidImeiLuhn(candidate15),
        commonTac: isCommonPhoneTac(candidate15),
        source: `${source}-ocr-corrected`,
      })
    }
  }

  // --- CHIẾN LƯỢC 1: Tìm theo nhãn tem chính xác (IMEI, IMEI1, IMEI2, MEID) ---
  // Ví dụ: "IMEI: 35 6789 12 345678 9", "IMEI1: 351234/56/789012/3", "IMEI 2: 861234567890123"
  const labelRegex =
    /(?:IMEI\s*[12]?|MEID|IMEI\/MEID)[\s:=-]+([0-9OIlSBZg\s/-]{14,24})/gi
  let match
  while ((match = labelRegex.exec(text)) !== null) {
    if (match[1]) {
      addCandidate(match[1], 'labeled-imei')
    }
  }

  // --- CHIẾN LƯỢC 2: Tìm các cụm số 14-16 ký tự được gom nhóm ---
  // Ví dụ: "35 678912 345678 9" hoặc "351234-56-789012-3"
  const groupedRegex = /\b([0-9OIlSBZ]{2,4}[\s/-][0-9OIlSBZ\s/-]{10,20})\b/gi
  while ((match = groupedRegex.exec(text)) !== null) {
    if (match[1]) {
      addCandidate(match[1], 'grouped-digits')
    }
  }

  // --- CHIẾN LƯỢC 3: Tìm các token 15 chữ số đứng liền nhau ---
  const exact15Regex = /\b\d{15}\b/g
  while ((match = exact15Regex.exec(text)) !== null) {
    if (match[0]) {
      addCandidate(match[0], 'token-15')
    }
  }

  // --- CHIẾN LƯỢC 4: Duyệt theo dòng văn bản ---
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Nếu dòng có chữ IMEI hoặc MEID
    if (/IMEI|MEID/i.test(trimmed)) {
      const parts = trimmed.split(/[:\s=-]+/)
      for (const part of parts) {
        addCandidate(part, 'line-imei-token')
      }
    }
  }

  // --- CHIẾN LƯỢC 5: Fallback gom toàn bộ chữ số nếu chưa tìm thấy ---
  if (candidates.length === 0) {
    const allDigits = normalizeImei(text)
    if (allDigits.length === 15) {
      addCandidate(allDigits, 'fallback-exact')
    } else if (allDigits.length > 15) {
      // Slicing window
      for (let i = 0; i <= allDigits.length - 15; i += 1) {
        const slice = allDigits.slice(i, i + 15)
        if (isValidImeiLuhn(slice) && isCommonPhoneTac(slice)) {
          addCandidate(slice, 'fallback-luhn-tac')
        }
      }
    }
  }

  // Xếp hạng ứng viên:
  // 1. Nhãn tem có luhn + common tac
  // 2. Có luhn + common tac
  // 3. Có luhn
  // 4. Nhãn tem (kể cả trượt luhn do 1 số bị mờ)
  // 5. Khác
  candidates.sort((a, b) => {
    const score = (item) => {
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

/**
 * Lấy IMEI 15 số từ chuỗi súng quét / barcode / OCR.
 * Ưu tiên ứng viên đúng Luhn và nhãn IMEI; fallback 15 số đầu tiên.
 */
export function extractImeiFromScan(raw) {
  const candidates = collectCandidatesWithMetadata(raw)
  if (!candidates.length) return ''
  return candidates[0].imei
}

/** Liệt kê mọi IMEI hợp lệ trong text (hữu ích khi tem có IMEI 1 & IMEI 2). */
export function extractAllImeisFromScan(raw) {
  const candidates = collectCandidatesWithMetadata(raw)
  if (!candidates.length) return []

  // Lọc ra các IMEI: ưu tiên luhn hoặc nhãn rõ ràng
  const luhnCandidates = candidates.filter((c) => c.luhn)
  const targetList = luhnCandidates.length ? luhnCandidates : candidates

  // Trả về danh sách chuỗi 15 số duy nhất
  return [...new Set(targetList.map((c) => c.imei))]
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
 * Tiền xử lý canvas nâng cao để OCR đọc tem máy thật chính xác hơn:
 * 1. Upscale tỷ lệ vàng (2.2x)
 * 2. Grayscale với hệ số mắt người
 * 3. Contrast Stretching (kéo dãn tương phản động)
 * 4. Sharpen nhẹ (làm sắc nét nét chữ in tem nhỏ)
 */
export function preprocessCanvasForOcr(sourceCanvas, options = {}) {
  const scale = options.scale ?? 2.2
  const w = Math.max(1, Math.floor(sourceCanvas.width * scale))
  const h = Math.max(1, Math.floor(sourceCanvas.height * scale))

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d', { willReadFrequently: true })

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceCanvas, 0, 0, w, h)

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

  // Bước 2: Kéo dãn tương phản động (Contrast Stretching)
  const range = maxLum - minLum
  if (range > 20) {
    for (let i = 0; i < data.length; i += 4) {
      const stretched = Math.round(((data[i] - minLum) / range) * 255)
      data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, stretched))
    }
  }

  // Bước 3: Nếu yêu cầu binarization (nhị phân hóa)
  if (options.binarize) {
    const threshold = options.threshold ?? 128
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i] > threshold ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = v
    }
  }

  ctx.putImageData(image, 0, 0)
  return out
}

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

/**
 * Trích xuất IMEI trực tiếp từ chuỗi mã vạch (Barcode 1D).
 * Mã vạch có thể chứa:
 * - Dãy 15 số thuần: 356789123456789
 * - Dãy 16 số IMEISV: 3567891234567890
 * - Định dạng GS1: (01)0356789123456789 hoặc 91356789123456789
 * - Tiền tố: IMEI:356789123456789 hoặc S356789123456789
 */
export function extractImeiFromBarcode(raw) {
  if (!raw) return ''
  const str = String(raw).trim()

  // 1. Lấy toàn bộ chữ số
  const digits = str.replace(/\D/g, '')

  // 2. Đúng 15 số
  if (digits.length === 15) return digits

  // 3. 16 số (IMEISV)
  if (digits.length === 16) return digits.slice(0, 15)

  // 4. Nếu có tiền tố định danh (GS1 '91' hoặc '01' + 15 số)
  if (digits.length > 15) {
    for (let i = 0; i <= digits.length - 15; i += 1) {
      const slice = digits.slice(i, i + 15)
      if (isValidImeiLuhn(slice) || isCommonPhoneTac(slice)) {
        return slice
      }
    }
    return digits.slice(0, 15)
  }

  // 5. Fallback dùng hàm trích xuất đa năng
  return extractImeiFromScan(str)
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

  function pushCandidate(candidate15, src) {
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

  function addCandidate(rawCandidate, source = 'general') {
    if (!rawCandidate) return
    const rawStr = String(rawCandidate)

    // 1. Thử trực tiếp dạng số
    const digits = rawStr.replace(/\D/g, '')

    if (digits.length >= 15) {
      // Chuỗi số >= 15 ký tự:
      // Luôn lấy 15 số đầu tiên (đặc biệt khi có nhãn IMEI/MEID hoặc IMEISV 16-17 số)
      pushCandidate(digits.slice(0, 15), source)
      // Nếu chuỗi dài hơn 15 số và không phải nhãn trực tiếp (ví dụ GS1 hoặc chuỗi dài),
      // kiểm tra xem có sliding window nào pass Luhn hoặc TAC không
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

    // 2. Thử chuẩn hóa OCR (thay O->0, l->1, S->5, B->8, Z->2, G->6)
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
  // Ví dụ: "IMEI: 35 6789 12 345678 9", "IMEI1: 351234/56/789012/3", "IMEI 2: 861234567890123"
  const labelRegex =
    /(?:IMEI\s*[12]?|MEID|IMEI\/MEID)[\s:=-]+([0-9OIlSBZg\s/-]{14,35})/gi
  let match
  while ((match = labelRegex.exec(text)) !== null) {
    if (match[1]) {
      addCandidate(match[1], 'labeled-imei')
    }
  }

  // --- CHIẾN LƯỢC 2: Duyệt theo từng dòng văn bản có nhãn IMEI/MEID ---
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Nếu dòng có chữ IMEI hoặc MEID
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

  // --- CHIẾN LƯỢC 3: Tìm các token 15 chữ số đứng liền nhau ---
  const exact15Regex = /\b\d{15}\b/g
  while ((match = exact15Regex.exec(text)) !== null) {
    if (match[0]) {
      addCandidate(match[0], 'token-15')
    }
  }

  // --- CHIẾN LƯỢC 4: Tìm các cụm số 14-16 ký tự được gom nhóm ---
  // Ví dụ: "35 678912 345678 9" hoặc "351234-56-789012-3"
  const groupedRegex = /\b([0-9OIlSBZ]{2,4}[\s/-][0-9OIlSBZ\s/-]{10,25})\b/gi
  while ((match = groupedRegex.exec(text)) !== null) {
    if (match[1]) {
      addCandidate(match[1], 'grouped-digits')
    }
  }

  // --- CHIẾN LƯỢC 5: Fallback gom toàn bộ chữ số nếu chưa tìm thấy ---
  if (candidates.length === 0) {
    const allDigits = normalizeImei(text)
    if (allDigits.length === 15) {
      addCandidate(allDigits, 'fallback-exact')
    } else if (allDigits.length > 15) {
      // 5.1 Thử sliding window có luhn + tac
      for (let i = 0; i <= allDigits.length - 15; i += 1) {
        const slice = allDigits.slice(i, i + 15)
        if (isValidImeiLuhn(slice) && isCommonPhoneTac(slice)) {
          addCandidate(slice, 'fallback-luhn-tac')
        }
      }
      // 5.2 Thử sliding window chỉ cần luhn
      if (candidates.length === 0) {
        for (let i = 0; i <= allDigits.length - 15; i += 1) {
          const slice = allDigits.slice(i, i + 15)
          if (isValidImeiLuhn(slice)) {
            addCandidate(slice, 'fallback-luhn')
          }
        }
      }
      // 5.3 Fallback cuối cùng: lấy 15 số đầu tiên
      if (candidates.length === 0) {
        addCandidate(allDigits.slice(0, 15), 'fallback-first15')
      }
    }
  }

  // Xếp hạng ứng viên:
  // 1. Nhãn tem có luhn + common tac
  // 2. Nhãn tem
  // 3. Có luhn + common tac
  // 4. Có luhn
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
 * Ưu tiên ứng viên nhãn tem và đúng Luhn; fallback 15 số đầu tiên.
 */
export function extractImeiFromScan(raw) {
  const all = extractAllImeisFromScan(raw)
  if (all.length > 0) return all[0]
  const candidates = collectCandidatesWithMetadata(raw)
  if (!candidates.length) return ''
  return candidates[0].imei
}

/** Liệt kê mọi IMEI hợp lệ trong text (hữu ích khi tem có IMEI 1 & IMEI 2). */
export function extractAllImeisFromScan(raw) {
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

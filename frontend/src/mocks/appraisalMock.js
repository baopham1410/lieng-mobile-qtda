import { formatCurrency } from '@/utils/formatCurrency'

/** Bump key để bỏ cache form cũ không khớp AutoGrade */
const STORAGE_KEY = 'lieng_appraisal_autograde_v2'

export const APPRAISAL_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Khác']

export const APPRAISAL_MODELS = {
  Apple: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 13', 'iPhone 12'],
  Samsung: ['Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy S23', 'Galaxy A55', 'Galaxy Z Flip5'],
  Xiaomi: ['Xiaomi 14', 'Redmi Note 13', 'POCO X6'],
  Oppo: ['Find X7', 'Reno 11', 'A78'],
  Vivo: ['V30', 'Y36', 'X100'],
  Realme: ['GT Neo 6', 'C67', '12 Pro'],
  Khác: ['Khác (nhập tay)'],
}

export const APPRAISAL_STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB']

/** 4 hạng máy — Grading Matrix AutoGrade */
export const APPRAISAL_GRADES = [
  { key: 'A', label: 'Hạng A — Như mới', hint: '0–1 lỗi nhẹ' },
  { key: 'B', label: 'Hạng B — Đẹp', hint: 'Xước / cấn nhẹ' },
  { key: 'C', label: 'Hạng C — Trung bình', hint: 'Nhiều xước / móp' },
  { key: 'D', label: 'Hạng D — Kém', hint: 'Nứt / hỏng nền / lỗi nặng' },
]

/** YOLO defect classes (đề tài) */
export const YOLO_DEFECT_CLASSES = [
  { key: 'cracked_screen', label: 'Nứt kính (cracked_screen)', defaultCost: 2500000 },
  { key: 'scratch', label: 'Xước bề mặt (scratch)', defaultCost: 300000 },
  { key: 'dent', label: 'Cấn / móp khung (dent)', defaultCost: 500000 },
  { key: 'damaged', label: 'Hỏng nền / sọc (damaged)', defaultCost: 4500000 },
]

export const PHOTO_SLOTS = [
  { key: 'front', label: 'Mặt trước', hint: 'Góc 1 — màn + khung' },
  { key: 'back', label: 'Mặt sau', hint: 'Góc 2 — lưng máy' },
  { key: 'side', label: 'Cạnh / khung', hint: 'Góc 3 — viền cấn móp' },
  { key: 'battery', label: 'Màn Pin / Giới thiệu', hint: 'OCR: model, ROM, % pin' },
]

export const HARDWARE_TESTS = [
  { key: 'touch', label: 'Cảm ứng', hint: 'Vuốt lưới — điểm liệt' },
  { key: 'audio', label: 'Âm thanh', hint: 'Loa ngoài / trong / mic' },
  { key: 'vibrate', label: 'Động cơ rung', hint: 'Haptic đều' },
  { key: 'faceId', label: 'Face ID / sinh trắc', hint: 'TrueDepth' },
]

export const APPRAISAL_STATUSES = [
  { key: 'draft', label: 'Nháp' },
  { key: 'quoted', label: 'Đã báo giá' },
  { key: 'accepted', label: 'Khách đồng ý' },
  { key: 'cancelled', label: 'Hủy' },
]

export const appraisalStatusClass = {
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  quoted: 'bg-amber-50 text-amber-700 ring-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-600 ring-rose-200',
}

export const gradeClass = {
  A: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  B: 'bg-sky-50 text-sky-700 ring-sky-200',
  C: 'bg-amber-50 text-amber-700 ring-amber-200',
  D: 'bg-rose-50 text-rose-700 ring-rose-200',
}

/** BasePrice demo theo model+ROM (giống iphone_pricing.json) */
const BASE_PRICE_BOOK = {
  'Apple|iPhone 15 Pro Max|256GB': 24500000,
  'Apple|iPhone 15 Pro Max|512GB': 27500000,
  'Apple|iPhone 15 Pro|256GB': 21000000,
  'Apple|iPhone 15 Pro|512GB': 23500000,
  'Apple|iPhone 15|128GB': 15500000,
  'Apple|iPhone 15|256GB': 17000000,
  'Apple|iPhone 14 Pro|256GB': 16000000,
  'Apple|iPhone 13|128GB': 9500000,
  'Apple|iPhone 12|128GB': 6500000,
  'Samsung|Galaxy S24 Ultra|512GB': 22000000,
  'Samsung|Galaxy S24|256GB': 14500000,
}

function emptyPhotos() {
  return Object.fromEntries(PHOTO_SLOTS.map((s) => [s.key, null]))
}

function emptyHardware() {
  return Object.fromEntries(HARDWARE_TESTS.map((t) => [t.key, 'pass']))
}

function emptyAiResult() {
  return {
    ran: false,
    mode: 'pending',
    grade: null,
    ocr: null,
    defects: [],
    basePrice: null,
    deductions: [],
    suggestedPrice: null,
    formula: 'FinalPrice = max(0, BasePrice − ΣC_YOLO − ΣC_OCR)',
    note: '',
  }
}

const seedRows = [
  {
    id: 1,
    code: 'TD-241109-001',
    ticketQr: 'AG-TD-241109-001',
    customerName: 'Somsack Phom',
    customerPhone: '020 55 112 233',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    imei: '',
    accessoriesNote: 'Full box',
    photosMeta: { front: true, back: true, side: true, battery: true },
    hardware: { touch: 'pass', audio: 'pass', vibrate: 'pass', faceId: 'pass' },
    aiResult: {
      ran: true,
      mode: 'mock',
      grade: 'B',
      ocr: {
        model: 'iPhone 15 Pro',
        rom: '256GB',
        batteryPercent: 91,
        unknownPart: false,
      },
      defects: [
        { class: 'scratch', label: 'Xước bề mặt', confidence: 0.92, cost: 300000 },
        { class: 'dent', label: 'Cấn khung', confidence: 0.86, cost: 500000 },
      ],
      basePrice: 21000000,
      deductions: [
        { source: 'yolo', label: 'Xước bề mặt', amount: 300000 },
        { source: 'yolo', label: 'Cấn khung', amount: 500000 },
        { source: 'ocr', label: 'Pin 91% (khấu hao nhẹ)', amount: 200000 },
      ],
      suggestedPrice: 20000000,
      formula: 'FinalPrice = max(0, BasePrice − ΣC_YOLO − ΣC_OCR)',
      note: 'Demo mock — chưa gọi FastAPI / YOLOv8 thật',
    },
    finalPrice: 19800000,
    status: 'quoted',
    createdAt: '2026-11-09T09:20:00',
    staffName: 'Nhân viên demo',
  },
  {
    id: 2,
    code: 'TD-241108-014',
    ticketQr: 'AG-TD-241108-014',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901 234 567',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    storage: '512GB',
    imei: '356938035643809',
    accessoriesNote: '',
    photosMeta: { front: true, back: true, side: false, battery: true },
    hardware: { touch: 'pass', audio: 'pass', vibrate: 'pass', faceId: 'fail' },
    aiResult: {
      ran: true,
      mode: 'mock',
      grade: 'C',
      ocr: {
        model: 'iPhone 15 Pro Max',
        rom: '512GB',
        batteryPercent: 78,
        unknownPart: true,
      },
      defects: [
        { class: 'cracked_screen', label: 'Nứt kính', confidence: 0.94, cost: 2500000 },
      ],
      basePrice: 27500000,
      deductions: [
        { source: 'yolo', label: 'Nứt kính', amount: 2500000 },
        { source: 'ocr', label: 'Pin 78%', amount: 800000 },
        { source: 'ocr', label: 'Unknown Part (linh kiện không xác định)', amount: 1500000 },
        { source: 'hw', label: 'Face ID lỗi', amount: 1200000 },
      ],
      suggestedPrice: 21500000,
      formula: 'FinalPrice = max(0, BasePrice − ΣC_YOLO − ΣC_OCR)',
      note: 'Demo mock — chưa gọi FastAPI / YOLOv8 thật',
    },
    finalPrice: 21000000,
    status: 'accepted',
    createdAt: '2026-11-08T15:40:00',
    staffName: 'Admin',
  },
  {
    id: 3,
    code: 'TD-241107-008',
    ticketQr: 'AG-TD-241107-008',
    customerName: '',
    customerPhone: '',
    brand: 'Apple',
    model: 'iPhone 13',
    storage: '128GB',
    imei: '',
    accessoriesNote: '',
    photosMeta: { front: false, back: false, side: false, battery: false },
    hardware: emptyHardware(),
    aiResult: emptyAiResult(),
    finalPrice: 0,
    status: 'draft',
    createdAt: '2026-11-07T11:05:00',
    staffName: 'Nhân viên demo',
  },
]

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function persist(rows) {
  try {
    // Không lưu dataURL ảnh (tránh vượt quota) — chỉ metadata
    const slim = rows.map((r) => {
      const { photos, ...rest } = r
      return {
        ...rest,
        photosMeta: rest.photosMeta || {
          front: Boolean(photos?.front),
          back: Boolean(photos?.back),
          side: Boolean(photos?.side),
          battery: Boolean(photos?.battery),
        },
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
  } catch {
    // ignore
  }
}

export function getAppraisalRows() {
  return loadStored() ?? structuredClone(seedRows)
}

export function saveAppraisalRows(rows) {
  persist(rows)
  return rows
}

export function computeAppraisalStats(rows) {
  return {
    total: rows.length,
    draft: rows.filter((r) => r.status === 'draft').length,
    quoted: rows.filter((r) => r.status === 'quoted').length,
    accepted: rows.filter((r) => r.status === 'accepted').length,
  }
}

export function statusLabel(key) {
  return APPRAISAL_STATUSES.find((s) => s.key === key)?.label ?? key
}

export function gradeLabel(key) {
  return APPRAISAL_GRADES.find((g) => g.key === key)?.label ?? key ?? '—'
}

export function formatAppraisalDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function nextAppraisalCode(rows) {
  const today = new Date()
  const y = String(today.getFullYear()).slice(-2)
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const prefix = `TD-${y}${m}${d}-`
  const seq = rows.filter((r) => String(r.code).startsWith(prefix)).length + 1
  return `${prefix}${String(seq).padStart(3, '0')}`
}

export function emptyAppraisalForm() {
  return {
    customerName: '',
    customerPhone: '',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    imei: '',
    accessoriesNote: '',
    photos: emptyPhotos(),
    hardware: emptyHardware(),
    aiResult: emptyAiResult(),
    finalPrice: 0,
    status: 'draft',
  }
}

function lookupBasePrice(brand, model, storage) {
  const key = `${brand}|${model}|${storage}`
  if (BASE_PRICE_BOOK[key]) return BASE_PRICE_BOOK[key]
  const loose = Object.entries(BASE_PRICE_BOOK).find(
    ([k]) => k.startsWith(`${brand}|${model}|`),
  )
  if (loose) return loose[1]
  return 12000000
}

function batteryDeduction(percent) {
  if (percent == null) return 0
  if (percent >= 90) return 0
  if (percent >= 85) return 200000
  if (percent >= 80) return 500000
  if (percent >= 75) return 800000
  return 1200000
}

/**
 * Mock AutoGrade pipeline (UI demo).
 * Sau này thay bằng POST FastAPI: YOLO + PaddleOCR + Valuation Engine.
 */
export function mockAutoGradeSuggest(form) {
  const photoCount = PHOTO_SLOTS.filter((s) => form.photos?.[s.key]).length
  if (photoCount < 2) {
    return {
      ok: false,
      message: 'Cần ít nhất 2 ảnh (ưu tiên 3 góc máy + màn Pin/Giới thiệu) trước khi chạy AI.',
    }
  }

  const basePrice = lookupBasePrice(form.brand, form.model, form.storage)
  const batteryPercent = form.photos?.battery ? 86 + Math.floor(Math.random() * 10) : 88

  /** Giả lập YOLO theo slot ảnh có/không */
  const defects = []
  if (form.photos?.front || form.photos?.back) {
    defects.push({
      class: 'scratch',
      label: 'Xước bề mặt',
      confidence: 0.88 + Math.random() * 0.1,
      cost: 300000,
    })
  }
  if (form.photos?.side) {
    defects.push({
      class: 'dent',
      label: 'Cấn khung',
      confidence: 0.8 + Math.random() * 0.15,
      cost: 500000,
    })
  }
  // Đôi khi giả lập nứt nếu thiếu ảnh cạnh (demo đa dạng)
  if (!form.photos?.side && photoCount >= 3 && Math.random() > 0.55) {
    defects.push({
      class: 'cracked_screen',
      label: 'Nứt kính',
      confidence: 0.9,
      cost: 2500000,
    })
  }

  const deductions = defects.map((d) => ({
    source: 'yolo',
    label: d.label,
    amount: d.cost,
  }))

  const batCost = batteryDeduction(batteryPercent)
  if (batCost > 0) {
    deductions.push({
      source: 'ocr',
      label: `Pin ${batteryPercent}%`,
      amount: batCost,
    })
  }

  const unknownPart = Boolean(form.photos?.battery) && Math.random() > 0.82
  if (unknownPart) {
    deductions.push({
      source: 'ocr',
      label: 'Unknown Part (linh kiện không xác định)',
      amount: 1500000,
    })
  }

  for (const t of HARDWARE_TESTS) {
    if (form.hardware?.[t.key] === 'fail') {
      const amount = t.key === 'faceId' ? 1200000 : 400000
      deductions.push({ source: 'hw', label: `${t.label} lỗi`, amount })
    }
  }

  const totalDeduct = deductions.reduce((s, d) => s + d.amount, 0)
  const suggestedPrice = Math.max(0, basePrice - totalDeduct)

  let grade = 'A'
  if (defects.some((d) => d.class === 'damaged' || d.class === 'cracked_screen') || totalDeduct > 4000000) {
    grade = 'D'
  } else if (totalDeduct > 1500000 || defects.length >= 2) {
    grade = 'C'
  } else if (totalDeduct > 0 || defects.length >= 1) {
    grade = 'B'
  }

  return {
    ok: true,
    aiResult: {
      ran: true,
      mode: 'mock',
      grade,
      ocr: {
        model: form.model,
        rom: form.storage,
        batteryPercent,
        unknownPart,
      },
      defects: defects.map((d) => ({
        ...d,
        confidence: Number(d.confidence.toFixed(2)),
      })),
      basePrice,
      deductions,
      suggestedPrice,
      formula: 'FinalPrice = max(0, BasePrice − ΣC_YOLO − ΣC_OCR)',
      note: 'Kết quả MOCK UI — sau khi train sẽ gọi FastAPI (YOLOv8 + PaddleOCR + Valuation).',
    },
  }
}

export function photosMetaFromForm(photos) {
  return Object.fromEntries(PHOTO_SLOTS.map((s) => [s.key, Boolean(photos?.[s.key])]))
}

export { formatCurrency, emptyAiResult, emptyHardware, emptyPhotos }

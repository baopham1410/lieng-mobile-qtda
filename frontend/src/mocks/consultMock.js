/** Quầy tư vấn nội bộ — tiếp nhận cuộc gọi hotline, ghi KH + ghi chú/ghi âm (UI demo). */

const STORAGE_KEY = 'lieng_consult_tickets_v1'

export const CONSULT_STATUSES = [
  { key: 'ringing', label: 'Đang gọi tới' },
  { key: 'in_progress', label: 'Đang tư vấn' },
  { key: 'done', label: 'Đã xong' },
  { key: 'missed', label: 'Nhỡ máy' },
  { key: 'callback', label: 'Hẹn gọi lại' },
]

export const CONSULT_TOPICS = [
  'Chọn máy mới',
  'Giá / khuyến mãi',
  'Thu cũ đổi mới',
  'Bảo hành',
  'Trả góp',
  'Khác',
]

export const consultStatusClass = {
  ringing: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  done: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  missed: 'bg-rose-50 text-rose-700 ring-rose-200',
  callback: 'bg-violet-50 text-violet-700 ring-violet-200',
}

const seed = [
  {
    id: 1,
    code: 'TV-241109-001',
    direction: 'inbound',
    callerPhone: '0383435600',
    customerName: '',
    customerPhone: '0383 435 601',
    topic: 'Chọn máy mới',
    interestProduct: 'iPhone 15 Pro 256GB',
    status: 'in_progress',
    staffName: 'Nhân viên demo',
    notes: 'KH hỏi chênh Titan vs Đen, ngân sách ~28tr.',
    recordingName: null,
    recordingDataUrl: null,
    startedAt: '2026-11-09T16:40:00',
    endedAt: null,
    durationSec: null,
  },
  {
    id: 2,
    code: 'TV-241109-002',
    direction: 'inbound',
    callerPhone: '0901234567',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901 234 567',
    topic: 'Thu cũ đổi mới',
    interestProduct: 'Samsung S24 Ultra',
    status: 'done',
    staffName: 'Admin',
    notes: 'Hẹn mang máy tới chi nhánh Q5 chiều nay.',
    recordingName: 'call-tv-002.webm',
    recordingDataUrl: null,
    startedAt: '2026-11-09T15:10:00',
    endedAt: '2026-11-09T15:18:00',
    durationSec: 480,
  },
  {
    id: 3,
    code: 'TV-241108-014',
    direction: 'inbound',
    callerPhone: '02055112233',
    customerName: '',
    customerPhone: '020 55 112 233',
    topic: 'Bảo hành',
    interestProduct: '',
    status: 'missed',
    staffName: '',
    notes: '',
    recordingName: null,
    recordingDataUrl: null,
    startedAt: '2026-11-08T19:22:00',
    endedAt: null,
    durationSec: null,
  },
]

function load() {
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
    const slim = rows.map(({ recordingDataUrl, ...rest }) => ({
      ...rest,
      // không lưu blob lớn vào localStorage
      hasRecording: Boolean(rest.recordingName || recordingDataUrl),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
  } catch {
    // ignore
  }
}

export function getConsultRows() {
  return load() ?? structuredClone(seed)
}

export function saveConsultRows(rows) {
  persist(rows)
  return rows
}

export function consultStats(rows) {
  return {
    total: rows.length,
    ringing: rows.filter((r) => r.status === 'ringing').length,
    inProgress: rows.filter((r) => r.status === 'in_progress').length,
    done: rows.filter((r) => r.status === 'done').length,
    missed: rows.filter((r) => r.status === 'missed').length,
  }
}

export function statusLabel(key) {
  return CONSULT_STATUSES.find((s) => s.key === key)?.label ?? key
}

export function formatConsultTime(iso) {
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

export function formatDuration(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function nextConsultCode(rows) {
  const today = new Date()
  const y = String(today.getFullYear()).slice(-2)
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const prefix = `TV-${y}${m}${d}-`
  const seq = rows.filter((r) => String(r.code).startsWith(prefix)).length + 1
  return `${prefix}${String(seq).padStart(3, '0')}`
}

export function emptyConsultForm() {
  return {
    direction: 'inbound',
    callerPhone: '',
    customerName: '',
    customerPhone: '',
    topic: 'Chọn máy mới',
    interestProduct: '',
    status: 'in_progress',
    notes: '',
    recordingName: null,
    recordingDataUrl: null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSec: null,
  }
}

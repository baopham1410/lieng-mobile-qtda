export const CHART_SLICE_COLORS = [
  '#dc2626',
  '#f97316',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#64748b',
  '#ec4899',
]

const TW_BG_TO_HEX = {
  'bg-red-500': '#ef4444',
  'bg-orange-400': '#fb923c',
  'bg-amber-500': '#f59e0b',
  'bg-sky-500': '#0ea5e9',
  'bg-violet-500': '#8b5cf6',
  'bg-emerald-500': '#10b981',
}

export function resolveSliceColor(item, index) {
  if (item?.color && TW_BG_TO_HEX[item.color]) return TW_BG_TO_HEX[item.color]
  return CHART_SLICE_COLORS[index % CHART_SLICE_COLORS.length]
}

/** @returns {{ gradient: string, slices: Array, total: number } | null} */
export function buildPieChart(items, valueKey = 'amount') {
  const rows = (items ?? []).filter((item) => Number(item[valueKey]) > 0)
  const total = rows.reduce((sum, item) => sum + Number(item[valueKey]), 0)
  if (!total || !rows.length) return null

  let acc = 0
  const slices = rows.map((item, index) => {
    const value = Number(item[valueKey])
    const percent = (value / total) * 100
    const start = acc
    acc += percent
    return {
      ...item,
      value,
      percent: Math.round(percent),
      color: resolveSliceColor(item, index),
      start,
      end: acc,
    }
  })

  const gradient = `conic-gradient(${slices
    .map((s) => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`)
    .join(', ')})`

  return { gradient, slices, total }
}

/** Đường cong mượt (cubic bezier) qua các điểm */
function buildSmoothLinePath(dots) {
  if (!dots.length) return ''
  if (dots.length === 1) {
    return `M ${dots[0].x.toFixed(1)} ${dots[0].y.toFixed(1)}`
  }

  let path = `M ${dots[0].x.toFixed(1)} ${dots[0].y.toFixed(1)}`
  for (let i = 0; i < dots.length - 1; i += 1) {
    const p0 = dots[i - 1] ?? dots[i]
    const p1 = dots[i]
    const p2 = dots[i + 1]
    const p3 = dots[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return path
}

function formatDayShort(date) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date).replace('.', '')
}

/** Ghép dữ liệu API với các ngày trống trong kỳ để biểu đồ miền đầy đủ */
export function fillDailySeries(rawRows, period = 'month') {
  const map = new Map((rawRows ?? []).map((row) => [row.label, row]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let start
  if (period === 'week') {
    start = new Date(today)
    start.setDate(start.getDate() - 6)
  } else if (period === 'quarter') {
    start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
  }

  const rows = []
  for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const label = `${String(cursor.getDate()).padStart(2, '0')}/${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const hit = map.get(label)
    rows.push(
      hit ?? {
        label,
        day: formatDayShort(cursor),
        revenue: 0,
        orders: 0,
        isEmpty: true,
      },
    )
  }

  return rows
}

/** @returns {{ line: string, area: string, dots: Array, width: number, height: number, max: number, yTicks: Array, baseline: number, xLabels: Array }} */
export function buildAreaChart(values, options = {}) {
  const {
    width = 420,
    height = 220,
    paddingX = 56,
    paddingY = 28,
    paddingRight = 20,
  } = options

  const nums = (values ?? []).map((v) => Number(v))
  if (!nums.length) {
    return { line: '', area: '', dots: [], width, height, max: 0, yTicks: [], baseline: 0, xLabels: [] }
  }

  const max = Math.max(...nums, 1)
  const innerW = width - paddingX - paddingRight
  const innerH = height - paddingY * 2
  const baseline = paddingY + innerH

  const dots = nums.map((value, index) => {
    const x =
      paddingX +
      (nums.length === 1 ? innerW / 2 : (index / (nums.length - 1)) * innerW)
    const y = paddingY + innerH - (value / max) * innerH
    return { x, y, value, index }
  })

  const xLabelEvery = nums.length > 14 ? Math.ceil(nums.length / 7) : nums.length > 7 ? 2 : 1
  const xLabels = dots
    .filter((_, index) => index % xLabelEvery === 0 || index === dots.length - 1)
    .map((dot) => ({ x: dot.x, index: dot.index }))

  const line = buildSmoothLinePath(dots)
  const area = `${line} L ${dots[dots.length - 1].x.toFixed(1)} ${baseline.toFixed(1)} L ${dots[0].x.toFixed(1)} ${baseline.toFixed(1)} Z`

  const tickCount = 4
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const ratio = 1 - i / (tickCount - 1)
    const value = Math.round(max * ratio)
    const y = paddingY + innerH * (1 - ratio)
    return { y, value, label: formatTickLabel(value) }
  })

  return { line, area, dots, width, height, max, yTicks, baseline, paddingX, paddingRight, xLabels }
}

function formatTickLabel(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}t`
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

/** @deprecated use buildAreaChart */
export function buildLineChart(values, options) {
  return buildAreaChart(values, options)
}

export function buildGridLines(count, width, height, paddingX, paddingY, paddingRight = 20) {
  const innerH = height - paddingY * 2
  const x2 = width - paddingRight
  return Array.from({ length: count }, (_, i) => {
    const y = paddingY + (innerH / (count - 1)) * i
    return { y, x1: paddingX, x2 }
  })
}

export const DEFAULT_CATEGORY_ICON = '📦'

export const CATEGORY_ICON_PRESETS = [
  '📱', '📟', '💻', '🔌', '📺', '🧊', '🌀', '🎧', '⌚', '📷',
  '🖨️', '🎮', '🛒', '🏠', '❄️', '💡', '🔋', '📦', '🛍️', '⚡',
]

export const CATEGORY_GRADIENT_BY_SLUG = {
  'dien-thoai': 'from-red-500 to-rose-500',
  tablet: 'from-violet-500 to-purple-500',
  laptop: 'from-sky-500 to-blue-500',
  'phu-kien': 'from-amber-500 to-orange-500',
  tivi: 'from-indigo-500 to-blue-600',
  'tu-lanh': 'from-cyan-500 to-teal-500',
  quat: 'from-emerald-500 to-green-600',
}

export function categoryDisplayIcon(category) {
  if (!category) return DEFAULT_CATEGORY_ICON
  if (typeof category === 'string') return DEFAULT_CATEGORY_ICON
  return category.icon?.trim() || DEFAULT_CATEGORY_ICON
}

export function categoryDisplayGradient(slug) {
  return CATEGORY_GRADIENT_BY_SLUG[slug] ?? 'from-slate-500 to-slate-600'
}

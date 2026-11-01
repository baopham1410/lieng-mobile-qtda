const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:8080'

export function resolveProductImageUrl(src) {
  if (!src) return null
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`
  return `${API_ORIGIN}/${src}`
}

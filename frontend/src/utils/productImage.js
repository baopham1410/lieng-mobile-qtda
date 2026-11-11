const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:8080'

const FRONTEND_ASSET_PREFIXES = ['/products/', '/hero/', '/brand/', '/flags/', '/avatars/']

export function resolveProductImageUrl(src) {
  if (!src) return null
  if (/^https?:\/\//i.test(src)) return src

  const normalized = src.startsWith('/') ? src : `/${src}`

  // Serve frontend public assets directly
  if (FRONTEND_ASSET_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return normalized
  }

  // Backend storage or media catalog assets
  return `${API_ORIGIN}${normalized}`
}

/** Avatar mặc định — chưa upload thì dùng file tĩnh */
export const DEFAULT_USER_AVATAR = '/avatars/default.png'

const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:8080'

export function resolveAvatarUrl(url) {
  if (!url) return DEFAULT_USER_AVATAR
  if (url.startsWith('http') || url.startsWith('/avatars/')) return url
  if (url.startsWith('/storage/')) return `${API_ORIGIN}${url}`
  return url
}

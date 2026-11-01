import axios from 'axios'
import { useLoadingStore } from '@/stores/loading'

/** Axios config: không hiện overlay (autocomplete, poll, refresh nền…) */
export const silentRequest = { skipGlobalLoading: true }

/** Axios config: bật overlay cho GET nặng (export, báo cáo lớn…) */
export const loadingRequest = { globalLoading: true }

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function shouldTrackLoading(config) {
  if (config.skipGlobalLoading) return false
  if (config.globalLoading === true) return true
  if (config.globalLoading === false) return false
  return MUTATING_METHODS.has(String(config.method ?? 'get').toLowerCase())
}

function beginLoading(config) {
  if (!shouldTrackLoading(config)) return
  const loading = useLoadingStore()
  loading.start(config.loadingMessage ?? '')
  config.__globalLoading = true
}

function endLoading(config) {
  if (!config?.__globalLoading) return
  useLoadingStore().stop()
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && !token.startsWith('mock-')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  beginLoading(config)
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    endLoading(response.config)
    return response
  },
  (error) => {
    endLoading(error.config)
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token')
      localStorage.removeItem('token')
      if (token?.startsWith('mock-')) {
        localStorage.removeItem('mock_user')
        return Promise.reject(error)
      }
      const path = window.location.pathname
      const isPublic = path === '/' || path === '/login'
      if (!isPublic) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient

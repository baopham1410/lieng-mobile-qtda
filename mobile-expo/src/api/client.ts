import axios, { AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

import { API_BASE_URL, TOKEN_KEY } from '@/constants/config'

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    return
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
    const data = ax.response?.data
    if (data?.message) return data.message
    if (data?.errors) {
      const first = Object.values(data.errors)[0]
      if (first?.[0]) return first[0]
    }
    if (ax.code === 'ERR_NETWORK') {
      return `Không kết nối được API (${API_BASE_URL}). Kiểm tra backend và Wi‑Fi.`
    }
    return ax.message || 'Có lỗi xảy ra.'
  }
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra.'
}

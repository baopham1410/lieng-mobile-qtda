import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import {
  clearMockSession,
  isMockToken,
  getMockUserFromStorage,
  findMockAccount,
  applyMockSession,
} from '@/mocks/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(isMockToken(token.value) ? getMockUserFromStorage() : null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email, password) {
    loading.value = true
    try {
      try {
        const { data } = await authApi.login({
          email,
          password,
          device_name: 'web',
        })
        clearMockSession()
        token.value = data.token
        user.value = data.user
        localStorage.setItem('token', data.token)
        return data
      } catch (apiError) {
        // Fallback to demo accounts if API fails (offline server, network error, 404, or demo credentials)
        const mockAccount = findMockAccount(email, password)
        if (mockAccount) {
          const session = applyMockSession(mockAccount)
          token.value = session.token
          user.value = session.user
          return {
            token: session.token,
            user: session.user,
            message: 'Đăng nhập thành công (Demo Mode)',
          }
        }
        throw apiError
      }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (!isMockToken(token.value)) {
      try {
        await authApi.logout()
      } catch {
        // ignore if token already invalid
      }
    }
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    clearMockSession()
  }

  async function fetchUser() {
    if (!token.value) return null
    if (isMockToken(token.value)) {
      const mockUser = getMockUserFromStorage()
      if (mockUser) {
        user.value = mockUser
        return user.value
      }
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      clearMockSession()
      throw new Error('mock session expired')
    }
    try {
      const { data } = await authApi.fetchMe()
      user.value = data.data ?? data.user ?? data
      return user.value
    } catch {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      throw new Error('fetchUser failed')
    }
  }

  function patchUser(partial) {
    if (user.value) {
      user.value = { ...user.value, ...partial }
      if (isMockToken(token.value)) {
        localStorage.setItem('mock_user', JSON.stringify(user.value))
      }
    }
  }

  return { user, token, loading, isAuthenticated, login, logout, fetchUser, patchUser }
})

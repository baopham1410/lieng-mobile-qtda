import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import { clearMockSession, isMockToken } from '@/mocks/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email, password) {
    loading.value = true
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
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      clearMockSession()
      throw new Error('mock sessions disabled')
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
    }
  }

  return { user, token, loading, isAuthenticated, login, logout, fetchUser, patchUser }
})

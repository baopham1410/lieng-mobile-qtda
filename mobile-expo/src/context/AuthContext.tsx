import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import * as authApi from '@/api/auth'
import { getErrorMessage, setToken } from '@/api/client'
import { USER_KEY } from '@/constants/config'
import type { AppUser } from '@/types'

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AppUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function saveUser(user: AppUser | null) {
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
  else await AsyncStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.fetchMe()
      setUser(me)
      await saveUser(me)
    } catch {
      setUser(null)
      await setToken(null)
      await saveUser(null)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const cached = await AsyncStorage.getItem(USER_KEY)
        if (cached) setUser(JSON.parse(cached) as AppUser)
        await refresh()
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const u = await authApi.login(email, password)
      setUser(u)
      await saveUser(u)
      return u
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    await saveUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

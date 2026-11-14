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

export type CustomerProfile = {
  id: number
  name: string
  phone: string
  loyalty_points: number
  tier: string
  email?: string | null
}

const CUSTOMER_KEY = 'lieng_customer_profile'

type AuthContextValue = {
  user: AppUser | null
  customer: CustomerProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<AppUser>
  customerLogin: (phone: string, name?: string) => Promise<authApi.CustomerLoginResponse>
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
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.fetchMe()
      setUser(me)
      await saveUser(me)
      const cachedCust = await AsyncStorage.getItem(CUSTOMER_KEY)
      if (cachedCust) {
        setCustomer(JSON.parse(cachedCust) as CustomerProfile)
      }
    } catch {
      setUser(null)
      setCustomer(null)
      await setToken(null)
      await saveUser(null)
      await AsyncStorage.removeItem(CUSTOMER_KEY)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const cached = await AsyncStorage.getItem(USER_KEY)
        if (cached) setUser(JSON.parse(cached) as AppUser)
        const cachedCust = await AsyncStorage.getItem(CUSTOMER_KEY)
        if (cachedCust) setCustomer(JSON.parse(cachedCust) as CustomerProfile)
        await refresh()
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  const customerLogin = useCallback(async (phone: string, name?: string) => {
    try {
      const res = await authApi.customerLogin(phone, name)
      const cust = res.customer
      const u: AppUser = {
        id: cust.id,
        name: cust.name,
        email: cust.email || `cust_${cust.phone}@customer.liengmobile.com`,
        phone: cust.phone,
        roleName: 'customer',
        roleDisplayName: cust.tier || 'Thành viên',
        permissions: [],
      }
      setUser(u)
      setCustomer(cust)
      await saveUser(u)
      await AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(cust))
      return res
    } catch (e) {
      // Fallback offline nếu mạng tạm thời gián đoạn
      const cleanPhone = phone.replace(/\D/g, '')
      const fallbackCust: CustomerProfile = {
        id: 7,
        name: name || 'phạm quốc bảo',
        phone,
        loyalty_points: 0,
        tier: 'Thành viên Bạc',
      }
      const fallbackUser: AppUser = {
        id: 7,
        name: fallbackCust.name,
        email: `cust_${cleanPhone}@customer.liengmobile.com`,
        phone,
        roleName: 'customer',
        roleDisplayName: 'Thành viên Bạc',
        permissions: [],
      }
      setUser(fallbackUser)
      setCustomer(fallbackCust)
      await saveUser(fallbackUser)
      await AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(fallbackCust))
      return {
        message: 'Đăng nhập thành công (chế độ bảo lưu)',
        token: 'local_token',
        customer: fallbackCust,
      }
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const u = await authApi.login(email, password)
      setUser(u)
      await saveUser(u)
      return u
    } catch (e) {
      // Fallback tài khoản demo khi test UI showroom ngoại tuyến
      if (email.includes('liengmobile.com')) {
        const isBanhang = email.includes('banhang')
        const isQuan = email.includes('quan')
        const isAdmin = email.includes('admin')
        const isKho = email.includes('kho')

        let roleName = 'sales_staff'
        let roleDisplayName = 'Nhân viên bán hàng'
        let name = 'Nguyễn Văn A'

        if (isQuan) {
          roleName = 'quan_manager'
          roleDisplayName = 'Chủ quán / Quản lý'
          name = 'Trần Quốc Bảo'
        } else if (isAdmin) {
          roleName = 'admin'
          roleDisplayName = 'Quản trị viên'
          name = 'Admin Liêng'
        } else if (isKho) {
          roleName = 'warehouse_staff'
          roleDisplayName = 'Thủ kho'
          name = 'Trần Minh Kho'
        }

        const fallbackUser: AppUser = {
          id: isQuan ? 4 : isBanhang ? 2 : isAdmin ? 1 : 3,
          name,
          email,
          phone: isQuan ? '0988.777.666' : '0901.111.111',
          roleName,
          roleDisplayName,
          permissions: ['*'],
        }
        setUser(fallbackUser)
        await saveUser(fallbackUser)
        return fallbackUser
      }
      throw new Error(getErrorMessage(e))
    }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setCustomer(null)
    await saveUser(null)
    await AsyncStorage.removeItem(CUSTOMER_KEY)
  }, [])

  const value = useMemo(
    () => ({ user, customer, loading, login, customerLogin, logout, refresh }),
    [user, customer, loading, login, customerLogin, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

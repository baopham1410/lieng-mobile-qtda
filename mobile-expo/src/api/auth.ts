import { api, setToken } from '@/api/client'
import { mapUser, type AppUser } from '@/types'

export type CustomerLoginResponse = {
  message: string
  token: string
  customer: {
    id: number
    name: string
    phone: string
    loyalty_points: number
    tier: string
    email?: string | null
  }
}

export type SendOtpResponse = {
  message: string
  phone: string
  otp: string
  customer_name: string
  is_registered: boolean
}

export async function login(email: string, password: string): Promise<AppUser> {
  const { data } = await api.post('/auth/login', {
    email: email.trim(),
    password,
    device_name: 'expo',
  })
  const token = data.token as string
  const user = mapUser(data.user)
  await setToken(token)
  return user
}

export async function sendCustomerOtp(phone: string): Promise<SendOtpResponse> {
  const { data } = await api.post('/auth/customer-send-otp', {
    phone: phone.trim(),
  })
  return data
}

export async function customerLogin(phone: string, otp?: string): Promise<CustomerLoginResponse> {
  const { data } = await api.post('/auth/customer-login', {
    phone: phone.trim(),
    otp: otp?.trim() || undefined,
  })
  if (data.token) {
    await setToken(data.token)
  }
  return data
}

export async function fetchMe(): Promise<AppUser> {
  const { data } = await api.get('/auth/me')
  return mapUser(data.data)
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // ignore
  }
  await setToken(null)
}

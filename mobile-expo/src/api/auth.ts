import { api, setToken } from '@/api/client'
import { mapUser, type AppUser } from '@/types'

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

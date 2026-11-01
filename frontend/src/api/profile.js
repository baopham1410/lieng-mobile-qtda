import apiClient from './client'

export async function fetchProfileSummary() {
  const { data } = await apiClient.get('/profile/summary')
  return data.data
}

export function updateProfile(payload) {
  return apiClient.put('/profile', payload)
}

export function changePassword(payload) {
  return apiClient.post('/profile/change-password', payload)
}

export function uploadAvatar(file) {
  const form = new FormData()
  form.append('avatar', file)
  return apiClient.post('/profile/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function fetchProfileActivity() {
  const { data } = await apiClient.get('/profile/activity')
  return data.data ?? []
}

export async function fetchLoginHistory() {
  const { data } = await apiClient.get('/profile/login-history')
  return data.data ?? []
}

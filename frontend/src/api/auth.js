import apiClient, { silentRequest } from './client'

export function login(credentials) {
  return apiClient.post('/auth/login', credentials)
}

export function logout() {
  return apiClient.post('/auth/logout')
}

export function fetchMe() {
  return apiClient.get('/auth/me', silentRequest)
}

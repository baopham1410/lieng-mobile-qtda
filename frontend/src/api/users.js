import apiClient from './client'

export function getUsers(params) {
  return apiClient.get('/users', { params })
}

export function getUser(id) {
  return apiClient.get(`/users/${id}`)
}

export function createUser(payload) {
  return apiClient.post('/users', payload)
}

export function updateUser(id, payload) {
  return apiClient.put(`/users/${id}`, payload)
}

export function deleteUser(id) {
  return apiClient.delete(`/users/${id}`)
}

export function getRoles() {
  return apiClient.get('/roles')
}

import apiClient from './client'

export async function fetchConsultations(params) {
  const { data } = await apiClient.get('/consultations', { params })
  return data.data ?? []
}

export async function createConsultation(payload) {
  const { data } = await apiClient.post('/consultations', payload)
  return data.data
}

export async function updateConsultation(id, payload) {
  const { data } = await apiClient.put(`/consultations/${id}`, payload)
  return data.data
}

export async function deleteConsultation(id) {
  const { data } = await apiClient.delete(`/consultations/${id}`)
  return data
}

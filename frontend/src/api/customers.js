import apiClient from './client'
import { mapPaginated, unwrapApiData } from '@/utils/apiFallback'

export async function fetchCustomers(params = {}) {
  const { data } = await apiClient.get('/customers', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, stats: mapped.stats, meta: mapped.meta }
}

export async function fetchCustomer(id) {
  const { data } = await apiClient.get(`/customers/${id}`)
  return unwrapApiData(data)
}

export function createCustomer(payload) {
  return apiClient.post('/customers', payload)
}

export function updateCustomer(id, payload) {
  return apiClient.put(`/customers/${id}`, payload)
}

export function deleteCustomer(id) {
  return apiClient.delete(`/customers/${id}`)
}

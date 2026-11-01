import apiClient from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchCustomers(params) {
  const { data } = await apiClient.get('/customers', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, stats: mapped.stats }
}

export function createCustomer(payload) {
  return apiClient.post('/customers', payload)
}

export function updateCustomer(id, payload) {
  return apiClient.put(`/customers/${id}`, payload)
}

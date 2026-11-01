import apiClient from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchWarranties(params) {
  const { data } = await apiClient.get('/warranties', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, stats: mapped.stats }
}

export async function lookupWarranty(imei) {
  const { data } = await apiClient.get(`/warranties/lookup/${encodeURIComponent(imei)}`)
  return data.data
}

export function createWarrantyRepair(warrantyId, payload) {
  return apiClient.post(`/warranties/${warrantyId}/repairs`, payload)
}

export function createRepairByImei(payload) {
  return apiClient.post('/warranties/repairs', payload)
}

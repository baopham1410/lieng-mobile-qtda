import apiClient from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchOrders(params) {
  const { data } = await apiClient.get('/orders', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, stats: mapped.stats }
}

export function cancelOrder(id) {
  return apiClient.post(`/orders/${id}/cancel`)
}

import apiClient from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchTradeConversations(params = {}) {
  const { data } = await apiClient.get('/trade-conversations', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, meta: mapped.meta }
}

export function createTradeConversation(payload) {
  return apiClient.post('/trade-conversations', payload)
}

export function updateTradeConversation(id, payload) {
  return apiClient.put(`/trade-conversations/${id}`, payload)
}

export function deleteTradeConversation(id) {
  return apiClient.delete(`/trade-conversations/${id}`)
}

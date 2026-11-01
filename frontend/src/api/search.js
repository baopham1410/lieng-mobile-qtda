import apiClient, { silentRequest } from './client'

export async function globalSearch(q) {
  const { data } = await apiClient.get('/search', { params: { q }, ...silentRequest })
  return data.data ?? []
}

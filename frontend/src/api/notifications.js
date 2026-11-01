import apiClient, { silentRequest } from './client'

export async function fetchNotifications() {
  const { data } = await apiClient.get('/notifications', silentRequest)
  return data.data ?? []
}

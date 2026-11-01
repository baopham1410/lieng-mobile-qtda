import apiClient from './client'

export async function fetchStoreCatalog() {
  const { data } = await apiClient.get('/store/catalog')
  return data.data
}

export function submitStoreInquiry(payload) {
  return apiClient.post('/store/inquiry', payload)
}

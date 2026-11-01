import apiClient from './client'

export async function fetchRevenueReport(params) {
  const { data } = await apiClient.get('/reports/revenue', { params })
  return data.data
}

export async function fetchInventoryReport() {
  const { data } = await apiClient.get('/reports/inventory')
  return data.data
}

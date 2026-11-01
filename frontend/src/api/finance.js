import apiClient from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchTransactions(params) {
  const { data } = await apiClient.get('/transactions', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, stats: mapped.stats }
}

export async function fetchExpenseCategories() {
  const { data } = await apiClient.get('/expense-categories')
  return data.data ?? []
}

export function createTransaction(payload) {
  return apiClient.post('/transactions', payload)
}

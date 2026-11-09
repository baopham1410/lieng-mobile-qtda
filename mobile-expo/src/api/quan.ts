import { api } from '@/api/client'
import type { QuanCategory, QuanEntry, QuanProduct, QuanStatement, QuanStats } from '@/types'

/** Fallback nếu API không trả categories */
export const DEFAULT_QUAN_CATEGORIES: QuanCategory[] = [
  { value: 'dien-thoai', label: 'Điện thoại' },
  { value: 'dich-vu', label: 'Dịch vụ' },
  { value: 'man-hinh', label: 'Màn hình' },
  { value: 'pin', label: 'Pin' },
  { value: 'phu-kien', label: 'Phụ kiện' },
  { value: 'sim-card', label: 'Sim / Card' },
  { value: 'dong-ho', label: 'Đồng hồ' },
  { value: 'khac', label: 'Khác' },
]

export async function fetchQuanProducts(params?: { active_only?: boolean }): Promise<{
  rows: QuanProduct[]
  categories: QuanCategory[]
}> {
  const { data } = await api.get('/quan/products', { params })
  const rows = ((data.data ?? []) as QuanProduct[]).map((p) => ({
    ...p,
    category: p.category || 'khac',
    categoryLabel: p.categoryLabel || 'Khác',
  }))
  const categories =
    Array.isArray(data.categories) && data.categories.length > 0
      ? (data.categories as QuanCategory[])
      : DEFAULT_QUAN_CATEGORIES
  return { rows, categories }
}

export async function createQuanProduct(payload: {
  name: string
  category?: string
  price: number
  is_active?: boolean
}) {
  const { data } = await api.post('/quan/products', payload)
  return data.data as QuanProduct
}

export async function updateQuanProduct(
  id: number,
  payload: Partial<{ name: string; category: string; price: number; is_active: boolean }>,
) {
  const { data } = await api.put(`/quan/products/${id}`, payload)
  return data.data as QuanProduct
}

export async function deleteQuanProduct(id: number) {
  await api.delete(`/quan/products/${id}`)
}

export async function fetchQuanEntries(period = 'today', perPage = 200) {
  const { data } = await api.get('/quan/entries', {
    params: { period, per_page: perPage },
  })
  return {
    rows: (data.data ?? []) as QuanEntry[],
    stats: (data.stats ?? {
      incomeToday: 0,
      expenseToday: 0,
      cashToday: 0,
      transferToday: 0,
      netToday: 0,
      salesCountToday: 0,
      expenseCountToday: 0,
    }) as QuanStats,
  }
}

export async function createQuanEntry(payload: Record<string, unknown>) {
  const { data } = await api.post('/quan/entries', payload)
  return data.data as QuanEntry
}

export async function updateQuanEntry(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/quan/entries/${id}`, payload)
  return data.data as QuanEntry
}

export async function deleteQuanEntry(id: number) {
  await api.delete(`/quan/entries/${id}`)
}

export async function fetchQuanStatements(month?: string) {
  const { data } = await api.get('/quan/statements', {
    params: { month, per_page: 100 },
  })
  return (data.data ?? []) as QuanStatement[]
}

export async function fetchQuanStatement(id: number) {
  const { data } = await api.get(`/quan/statements/${id}`)
  return data.data as QuanStatement
}

export async function saveQuanStatement(payload: {
  statement_date?: string
  force?: boolean
} = {}) {
  const { data } = await api.post('/quan/statements', {
    force: true,
    ...payload,
  })
  return data.data as QuanStatement
}

export async function deleteQuanStatement(id: number) {
  await api.delete(`/quan/statements/${id}`)
}

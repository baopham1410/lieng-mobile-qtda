import { api } from './client'

export interface OrderItem {
  id: number
  variant_id: number
  product_name: string
  sku: string
  quantity: number
  price: number
  imeis?: string[]
}

export interface Order {
  id: number
  code: string
  customer_name?: string
  customer_phone?: string
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  created_at: string
  items?: OrderItem[]
}

export async function fetchOrders(params?: { status?: string; page?: number; per_page?: number }) {
  const { data } = await api.get('/orders', { params })
  return data
}

export async function fetchOrderDetail(id: number | string) {
  const { data } = await api.get(`/orders/${id}`)
  return data
}


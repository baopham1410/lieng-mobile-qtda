import { api } from './client'

export interface PosProductUnit {
  id: number
  imei_code_id?: number
  imei?: string
  product_variant_id?: number
  name: string
  sku?: string
  brand?: string
  color?: string
  storage?: string
  price: number
  category?: string
  category_id?: number
  has_imei?: boolean
  image_url?: string
}

export interface PosCategory {
  id: number
  name: string
  code?: string
  slug?: string
}

export interface PosCustomer {
  id: number
  name: string
  phone: string
  email?: string
  address?: string
  total_orders?: number
}

export async function fetchPosAvailable(params?: { search?: string; category_id?: number }) {
  const { data } = await api.get('/pos/available', { params })
  return data
}

export async function fetchPosCategories() {
  const { data } = await api.get('/pos/categories')
  return data
}

export async function suggestPosCustomers(q: string): Promise<PosCustomer[]> {
  try {
    const { data } = await api.get('/pos/customers/suggest', { params: { q } })
    return data?.data ?? data ?? []
  } catch {
    return []
  }
}

export async function lookupPosCustomer(phone: string): Promise<{ found: boolean; data: PosCustomer | null }> {
  try {
    const { data } = await api.get('/pos/customers/lookup', { params: { phone } })
    return data ?? { found: false, data: null }
  } catch {
    return { found: false, data: null }
  }
}

export async function submitPosCheckout(payload: {
  customer_id?: number | null
  customer?: {
    name: string
    phone: string
    address?: string
    email?: string
  }
  items: Array<{
    imei_code_id: number
    quantity?: number
    price?: number
  }>
  payment_method: 'cash' | 'transfer' | 'mixed'
  cash_amount?: number
  transfer_amount?: number
  discount?: number
  notes?: string
}) {
  const { data } = await api.post('/pos/checkout', payload)
  return data
}

export async function fetchOrderPaymentStatus(orderId: number | string) {
  const { data } = await api.get(`/orders/${orderId}/payment-status`)
  return data?.data ?? data
}

export async function confirmPosPayment(orderId: number | string) {
  const { data } = await api.post(`/pos/orders/${orderId}/confirm-payment`)
  return data?.data ?? data
}

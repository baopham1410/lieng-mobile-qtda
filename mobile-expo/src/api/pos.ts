import { api } from './client'

export interface PosProductVariant {
  id: number
  sku: string
  name?: string
  price: number
  stock: number
  has_imei?: boolean
  imei_list?: string[]
}

export interface PosProduct {
  id: number
  name: string
  category_id?: number
  category_name?: string
  image_url?: string
  variants: PosProductVariant[]
}

export interface PosCategory {
  id: number
  name: string
  code?: string
}

export async function fetchPosAvailable(params?: { search?: string; category_id?: number }) {
  const { data } = await api.get('/pos/available', { params })
  return data
}

export async function fetchPosCategories() {
  const { data } = await api.get('/pos/categories')
  return data
}

export async function submitPosCheckout(payload: {
  customer_id?: number | null
  customer_name?: string
  customer_phone?: string
  items: Array<{
    variant_id: number
    quantity: number
    unit_price: number
    imeis?: string[]
  }>
  payment_method: 'cash' | 'transfer' | 'mixed'
  cash_amount?: number
  transfer_amount?: number
  note?: string
}) {
  const { data } = await api.post('/pos/checkout', payload)
  return data
}


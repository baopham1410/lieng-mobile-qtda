import { api } from './client'

export interface WarrantyLookupResult {
  imei: string
  product_name: string
  sku?: string
  status: 'valid' | 'expired' | 'not_found'
  warranty_end?: string
  customer_name?: string
  customer_phone?: string
  repairs?: Array<{
    id: number
    symptom: string
    status: string
    created_at: string
  }>
}

export async function lookupWarrantyByImei(imei: string) {
  const { data } = await api.get(`/warranties/lookup/${encodeURIComponent(imei)}`)
  return data
}

export async function createWarrantyRepair(payload: {
  imei: string
  symptom: string
  notes?: string
  customer_name?: string
  customer_phone?: string
}) {
  const { data } = await api.post('/warranties/repairs', payload)
  return data
}


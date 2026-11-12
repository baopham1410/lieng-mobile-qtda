import { api } from './client'

export interface WarehouseKPIs {
  total_in_stock: number
  total_exported: number
  pending_orders: number
  warranty_receiving: number
  total_imports: number
  audit_accuracy: string
  shift_name: string
  auditor_name: string
}

export interface InventoryCategoryStock {
  category_name: string
  count: number
}

export interface InventoryVariantItem {
  id: number
  product_id: number
  name: string
  sku: string
  category_name: string
  price: number
  stock: number
  imei_list: string[]
  has_imei: boolean
}

export interface StockImportSummary {
  id: number
  code: string
  supplier_name: string
  summary: string
  item_count: number
  total_amount: number
  status: string
  status_label: string
  created_at: string
  imported_at?: string
}

export interface ExportOrderItem {
  id: number
  code: string
  customer_name: string
  customer_phone?: string
  summary: string
  total: number
  status: string
  status_label: string
  time: string
}

export interface SupplierItem {
  id: number
  name: string
  code: string
  phone?: string
}

export interface WarehouseDashboardResponse {
  kpis: WarehouseKPIs
  categories_distribution: InventoryCategoryStock[]
  inventory: InventoryVariantItem[]
  recent_imports: StockImportSummary[]
  export_orders: ExportOrderItem[]
  suppliers: SupplierItem[]
}

export interface StockImportDetailItem {
  id: number
  product_name: string
  variant_name: string
  quantity: number
  unit_cost: number
  subtotal: number
  imeis: string[]
}

export interface StockImportDetail {
  id: number
  code: string
  supplier_name: string
  total_amount: number
  status: string
  notes?: string
  created_at: string
  items: StockImportDetailItem[]
}

export interface ImeiScanResult {
  found: boolean
  imei: string
  status?: 'in_stock' | 'sold' | 'warranty' | string
  status_label?: string
  product?: {
    id: number
    variant_id: number
    name: string
    sku: string
    category: string
    price: number
    import_cost: number
  }
  imported_at?: string
  message?: string
}

export interface CreateStockImportPayload {
  supplier_id?: number
  supplier_name?: string
  notes?: string
  items: Array<{
    product_variant_id: number
    quantity: number
    unit_cost: number
    imeis?: string[]
  }>
}

/**
 * Fetch full warehouse dashboard stats, inventory items, recent imports
 */
export async function fetchWarehouseDashboard(): Promise<WarehouseDashboardResponse> {
  const res = await api.get('/warehouse/dashboard')
  return res.data
}

/**
 * Fetch list of stock imports
 */
export async function fetchWarehouseImports(): Promise<StockImportDetail[]> {
  const res = await api.get('/warehouse/imports')
  return res.data?.data ?? []
}

/**
 * Create a new stock import ticket with real IMEI persistence
 */
export async function createStockImport(payload: CreateStockImportPayload) {
  const res = await api.post('/warehouse/imports', payload)
  return res.data
}

/**
 * Scan barcode or look up an IMEI in database
 */
export async function scanWarehouseImei(imei: string): Promise<ImeiScanResult> {
  const res = await api.get(`/warehouse/imei/${encodeURIComponent(imei.trim())}`)
  return res.data
}

/**
 * Verify order IMEIs before warehouse dispatch
 */
export async function verifyExportOrder(orderCode: string) {
  const res = await api.get(`/warehouse/orders/${encodeURIComponent(orderCode)}/verify`)
  return res.data
}

/**
 * Record stock audit session
 */
export async function auditWarehouseStock() {
  const res = await api.post('/warehouse/audit')
  return res.data
}


import {
  importItems as seedItems,
  suppliers as seedSuppliers,
} from '@/mocks/stockImportMock'
import { registerNewItemsFromImport } from '@/repositories/importProductCatalog'
import { normalizeCategoryId } from '@/data/importCategoryForm'

const IMPORTS_KEY = 'lieng_stock_imports'
const SUPPLIERS_KEY = 'lieng_suppliers'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function todayCodeSuffix() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function buildSeedImports() {
  return [
    {
      code: 'PN-20260624-001',
      supplierId: 1,
      supplierName: 'Công ty Apple Distributor VN',
      notes: 'Nhập đợt iPhone cuối tháng',
      status: 'draft',
      items: [
        { id: 1, category: 'dien-thoai', name: 'iPhone 15 Pro Max', variant: 'Titan Xanh · 256GB', quantity: 3, unitPrice: 25200000 },
        { id: 2, category: 'dien-thoai', name: 'Samsung Galaxy S24', variant: 'Đen · 256GB', quantity: 2, unitPrice: 14500000 },
      ],
      imeis: ['356789123456781', '356789123456782', '356789123456783'],
      createdAt: '2026-06-24T08:00:00.000Z',
      confirmedAt: null,
    },
    {
      code: 'PN-20260623-004',
      supplierId: 2,
      supplierName: 'Samsung SDS Việt Nam',
      notes: '',
      status: 'confirmed',
      items: [
        { id: 1, category: 'dien-thoai', name: 'Samsung Galaxy S24 Ultra', variant: 'Titan Đen · 512GB', quantity: 2, unitPrice: 29000000 },
      ],
      imeis: ['356789123456791', '356789123456792'],
      createdAt: '2026-06-23T14:30:00.000Z',
      confirmedAt: '2026-06-23T15:00:00.000Z',
    },
    {
      code: 'PN-20260622-002',
      supplierId: 3,
      supplierName: 'Mi Việt Nam Trading',
      notes: 'Nhập máy Xiaomi giá tốt',
      status: 'confirmed',
      items: [
        { id: 1, category: 'dien-thoai', name: 'Xiaomi 14', variant: 'Đen · 256GB', quantity: 1, unitPrice: 12800000 },
      ],
      imeis: ['356789123456801'],
      createdAt: '2026-06-22T10:00:00.000Z',
      confirmedAt: '2026-06-22T10:30:00.000Z',
    },
    {
      code: 'PN-20260624-005',
      supplierId: 1,
      supplierName: 'Công ty Apple Distributor VN',
      notes: '',
      status: 'draft',
      items: seedItems.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId,
        category: normalizeCategoryId(item.category ?? 'dien-thoai'),
        name: item.name,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      imeis: ['356789123456781', '356789123456782', '356789123456783', '356789123456784', '356789123456785'],
      createdAt: '2026-06-24T09:00:00.000Z',
      confirmedAt: null,
    },
  ]
}

export function initStockImportStorage() {
  if (!readJson(IMPORTS_KEY, null)) {
    writeJson(IMPORTS_KEY, buildSeedImports())
  }
  if (!readJson(SUPPLIERS_KEY, null)) {
    writeJson(SUPPLIERS_KEY, seedSuppliers)
  }
}

function getImports() {
  initStockImportStorage()
  return readJson(IMPORTS_KEY, [])
}

function saveImports(imports) {
  writeJson(IMPORTS_KEY, imports)
}

function calcTotalAmount(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export function listStockImports() {
  return getImports()
    .map(enrichImport)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getStockImportByCode(code) {
  const found = getImports().find((entry) => entry.code === code)
  return found ? enrichImport(found) : null
}

function enrichImport(entry) {
  return {
    ...entry,
    totalAmount: calcTotalAmount(entry.items),
    totalQuantity: entry.items.reduce((sum, item) => sum + item.quantity, 0),
    importedQuantity: entry.imeis?.length ?? 0,
  }
}

export function generateImportCode() {
  const datePart = todayCodeSuffix()
  const prefix = `PN-${datePart}-`
  const existing = getImports().filter((entry) => entry.code.startsWith(prefix))
  const next = String(existing.length + 1).padStart(3, '0')
  return `${prefix}${next}`
}

export function listSuppliers() {
  initStockImportStorage()
  return readJson(SUPPLIERS_KEY, [])
}

export function addSupplier(supplier) {
  const suppliers = listSuppliers()
  const nextId = suppliers.reduce((max, s) => Math.max(max, s.id), 0) + 1
  const created = { id: nextId, ...supplier }
  writeJson(SUPPLIERS_KEY, [...suppliers, created])
  return created
}

export function saveStockImport(payload) {
  const imports = getImports()
  const index = imports.findIndex((entry) => entry.code === payload.code)
  const record = {
    ...payload,
    totalAmount: calcTotalAmount(payload.items),
    updatedAt: new Date().toISOString(),
  }

  if (index >= 0) {
    imports[index] = { ...imports[index], ...record }
  } else {
    imports.push({
      ...record,
      status: record.status ?? 'draft',
      createdAt: record.createdAt ?? new Date().toISOString(),
      confirmedAt: null,
    })
  }

  saveImports(imports)
  return enrichImport(imports[index >= 0 ? index : imports.length - 1])
}

export function confirmStockImport(code) {
  const imports = getImports()
  const index = imports.findIndex((entry) => entry.code === code)
  if (index < 0) throw new Error('Không tìm thấy phiếu nhập')

  const entry = imports[index]
  if (entry.status === 'confirmed') throw new Error('Phiếu đã được xác nhận trước đó')

  const registeredItems = registerNewItemsFromImport(entry.items)

  imports[index] = {
    ...entry,
    items: registeredItems,
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saveImports(imports)
  return enrichImport(imports[index])
}

export function listUsedImeis(excludeCode = null) {
  const result = []
  getImports().forEach((entry) => {
    if (entry.status !== 'confirmed') return
    ;(entry.imeis ?? []).forEach((imei) => {
      if (excludeCode && entry.code === excludeCode) return
      result.push({ imei, code: entry.code })
    })
  })
  return result
}

export function getStockImportStats() {
  const imports = listStockImports()
  const today = new Date().toISOString().slice(0, 10)

  return {
    draftImports: imports.filter((e) => e.status === 'draft').length,
    waitingConfirm: imports.filter(
      (e) => e.status === 'draft' && e.totalQuantity > 0 && e.importedQuantity >= e.totalQuantity,
    ).length,
    imeiPending: imports
      .filter((e) => e.status === 'draft')
      .reduce((sum, e) => sum + Math.max(0, e.totalQuantity - e.importedQuantity), 0),
    totalAmountToday: imports
      .filter((e) => e.status === 'confirmed' && (e.confirmedAt ?? '').slice(0, 10) === today)
      .reduce((sum, e) => sum + e.totalAmount, 0),
  }
}

export { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

import { categoryRequiresImei } from '@/repositories/productCategoryRepository'

const IMEI_PATTERN = /^\d{15}$/

function itemImeiQuantity(item) {
  return categoryRequiresImei(item.category) ? item.quantity : 0
}

export function getImeiRequiredQuantity(items) {
  return items.reduce((sum, item) => sum + itemImeiQuantity(item), 0)
}

export function normalizeImei(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function parseImeiText(text) {
  return String(text ?? '')
    .split(/[\n,;\s]+/)
    .map(normalizeImei)
    .filter(Boolean)
}

export function isValidImeiFormat(imei) {
  return IMEI_PATTERN.test(imei)
}

/**
 * Phân bổ IMEI tuần tự — chỉ cho dòng yêu cầu IMEI (điện thoại, tablet, laptop...).
 */
export function mapImeisToItems(items, imeis) {
  const result = items.map((item) => ({
    ...item,
    imeis: [],
    imported: categoryRequiresImei(item.category) ? 0 : item.quantity,
    requiresImei: categoryRequiresImei(item.category),
  }))
  let cursor = 0

  for (const item of result) {
    if (!item.requiresImei) continue
    const slice = imeis.slice(cursor, cursor + item.quantity)
    item.imeis = slice
    item.imported = slice.length
    cursor += item.quantity
  }

  return result
}

/**
 * Kiểm tra IMEI: định dạng, trùng trong phiếu, trùng hệ thống, thiếu/dư so với số lượng.
 */
export function validateImportImeis({ items, imeis, usedImeis = [], excludeCode = null }) {
  const errors = []
  const warnings = []
  const entries = []
  const seen = new Set()
  const totalRequired = getImeiRequiredQuantity(items)

  imeis.forEach((raw, index) => {
    const imei = normalizeImei(raw)
    let status = 'valid'
    let message = 'Hợp lệ'

    if (!isValidImeiFormat(imei)) {
      status = 'invalid'
      message = 'Sai định dạng (cần 15 số)'
    } else if (seen.has(imei)) {
      status = 'duplicate'
      message = 'Trùng trong phiếu'
    } else if (usedImeis.some((entry) => entry.imei === imei && entry.code !== excludeCode)) {
      status = 'exists'
      message = `Đã có trong ${usedImeis.find((e) => e.imei === imei)?.code ?? 'hệ thống'}`
    }

    seen.add(imei)
    entries.push({ imei, index, status, message })
  })

  if (imeis.length < totalRequired) {
    errors.push(`Thiếu ${totalRequired - imeis.length} IMEI (cần ${totalRequired}, đã nạp ${imeis.length})`)
  } else if (imeis.length > totalRequired) {
    errors.push(`Dư ${imeis.length - totalRequired} IMEI (cần ${totalRequired}, đã nạp ${imeis.length})`)
  }

  const invalidCount = entries.filter((e) => e.status !== 'valid').length
  if (invalidCount > 0) {
    errors.push(`${invalidCount} IMEI không hợp lệ hoặc bị trùng`)
  }

  const mappedItems = mapImeisToItems(items, imeis)
  mappedItems.forEach((item) => {
    if (!item.requiresImei) return
    if (item.imported < item.quantity) {
      warnings.push(`${item.name} (${item.variant}): thiếu ${item.quantity - item.imported} IMEI`)
    }
  })

  const imeiComplete = totalRequired === 0 || (errors.length === 0 && imeis.length === totalRequired)

  return {
    entries,
    mappedItems,
    errors,
    warnings,
    isComplete: imeiComplete && items.length > 0,
    totalRequired,
    totalImported: imeis.length,
  }
}

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppDetailSkeleton from '@/components/common/AppDetailSkeleton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import {
  addSupplier,
  confirmStockImport,
  createStockImport,
  formatCurrency,
  generateImportCode,
  getStockImport,
  listSuppliers,
  listUsedImeis,
  updateStockImport,
} from '@/api/stockImports'
import { listImportProductVariants } from '@/repositories/importProductCatalog'
import {
  buildImportVariantLabel,
  categoryRequiresImeiById,
  getImportCategoryProfile,
  getCategoryDisplayLabel,
  mergeCategoriesWithFormProfiles,
  normalizeCategoryId,
  validateImportProductForm,
} from '@/data/importCategoryForm'
import { fetchImportProductVariants, fetchProductCategories } from '@/api/products'
import { withApiFallback } from '@/utils/apiFallback'
import { getImeiRequiredQuantity, parseImeiText, validateImportImeis } from '@/utils/imeiValidation'
import {
  addProductCategory,
  listProductCategories,
} from '@/repositories/productCategoryRepository'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const message = ref('')
const error = ref('')

const importCode = ref('')
const selectedSupplier = ref(null)
const notes = ref('')
const items = ref([])
const status = ref('draft')
const imeiText = ref('')
const suppliers = ref([])
const newSupplier = ref({ name: '', phone: '', city: '' })
const showAddProduct = ref(false)
const addProductMode = ref('catalog')
const productSearch = ref('')
const categoryFilter = ref('all')
const catalogVariants = ref([])
const selectedVariant = ref(null)
const addQuantity = ref(1)
const addUnitPrice = ref(0)
const newProductForm = ref({
  name: '',
  category: '',
  brand: 'Apple',
  customBrand: '',
  color: '',
  storage: '',
  variantDesc: '',
})
const newCategoryForm = ref({ label: '', requiresImei: false })
const categories = ref(listProductCategories())
const brandOptions = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'JBL', 'Khác']
let nextItemId = 100

function categoryRequiresImei(categoryId) {
  return categoryRequiresImeiById(
    resolveCategorySlug(categoryId),
    newCategoryForm.value.requiresImei,
  )
}

function resolveCategorySlug(categoryId) {
  if (categoryId === 'new') return 'new'
  const cat = categories.value.find((c) => String(c.id) === String(categoryId) || c.slug === categoryId)
  return cat?.slug ?? normalizeCategoryId(categoryId)
}

const activeCategoryForm = computed(() => {
  if (isAddingCategory.value) {
    return newCategoryForm.value.requiresImei
      ? getImportCategoryProfile('dien-thoai')
      : getImportCategoryProfile('phu-kien')
  }
  return getImportCategoryProfile(resolveCategorySlug(newProductForm.value.category))
})

const isAddingCategory = computed(() => newProductForm.value.category === 'new')

const isCustomBrand = computed(() => newProductForm.value.brand === 'Khác')
const hasNewProducts = computed(() => items.value.some((item) => item.isNew))
const newProductNeedsImei = computed(() => activeCategoryForm.value.requiresImei)
const imeiRequiredCount = computed(() => getImeiRequiredQuantity(items.value))
const accessoryCount = computed(() =>
  items.value
    .filter((item) => !categoryRequiresImei(item.category))
    .reduce((sum, item) => sum + item.quantity, 0),
)

const filteredVariants = computed(() => {
  let list = catalogVariants.value
  if (categoryFilter.value !== 'all') {
    const selected = categories.value.find((c) => String(c.id) === String(categoryFilter.value))
    const slug = selected?.slug ?? normalizeCategoryId(categoryFilter.value)
    list = list.filter((v) => normalizeCategoryId(v.category) === slug)
  }
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (v) =>
      v.name.toLowerCase().includes(q) ||
      v.variant.toLowerCase().includes(q) ||
      (categoryLabel(v.category) ?? '').toLowerCase().includes(q),
  )
})

const canConfirmAdd = computed(() => {
  if (addProductMode.value === 'catalog') return !!selectedVariant.value
  if (isAddingCategory.value && !newCategoryForm.value.label.trim()) return false
  return (
    !validateImportProductForm(
      newProductForm.value.category,
      newProductForm.value,
      newCategoryForm.value.requiresImei,
    ) && addQuantity.value >= 1
  )
})

function categoryLabel(categoryId) {
  const cat = categories.value.find(
    (c) => String(c.id) === String(categoryId) || c.slug === categoryId || c.id === normalizeCategoryId(categoryId),
  )
  if (cat?.label) return cat.label
  return getCategoryDisplayLabel(categoryId)
}

async function loadCategoryOptions() {
  const apiCategories = await withApiFallback(fetchProductCategories, () => [])
  const merged = mergeCategoriesWithFormProfiles(apiCategories)
  const custom = listProductCategories().filter((c) => c.isUserCreated)
  categories.value = [...merged, ...custom]
  if (!newProductForm.value.category && categories.value.length) {
    newProductForm.value.category = categories.value[0].id
  }
}

const isCreate = computed(() => route.name === 'stock-import-create')
const isReadonly = computed(() => status.value === 'confirmed')
const isAddingSupplier = computed(() => selectedSupplier.value === 'new')

const parsedImeis = computed(() => parseImeiText(imeiText.value))

const imeiValidation = computed(() =>
  validateImportImeis({
    items: items.value,
    imeis: parsedImeis.value,
    usedImeis: listUsedImeis(importCode.value),
    excludeCode: importCode.value,
  }),
)

const mappedItems = computed(() => imeiValidation.value.mappedItems)
const totalQuantity = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
const totalAmount = computed(() => items.value.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))

const statusLabel = computed(() => {
  if (status.value === 'confirmed') return 'Đã xác nhận'
  if (imeiValidation.value.isComplete) return 'Draft · Sẵn sàng xác nhận'
  return 'Draft · Chờ nạp đủ IMEI'
})

const imeiStatusClass = {
  valid: 'bg-emerald-50 text-emerald-600',
  invalid: 'bg-red-50 text-red-600',
  duplicate: 'bg-amber-50 text-amber-600',
  exists: 'bg-orange-50 text-orange-600',
}

async function loadSuppliers() {
  suppliers.value = await listSuppliers()
}

async function loadImport() {
  loading.value = true
  error.value = ''
  await Promise.all([loadSuppliers(), loadCategoryOptions()])

  if (isCreate.value) {
    importCode.value = generateImportCode()
    selectedSupplier.value = suppliers.value[0]?.id ?? null
    notes.value = ''
    status.value = 'draft'
    items.value = []
    imeiText.value = ''
    loading.value = false
    return
  }

  const data = await getStockImport(route.params.code)
  if (!data) {
    error.value = 'Không tìm thấy phiếu nhập'
    loading.value = false
    return
  }

  importCode.value = data.code
  selectedSupplier.value = data.supplierId
  notes.value = data.notes ?? ''
  status.value = data.status
  items.value = data.items.map((item) => ({
    ...item,
    category: normalizeCategoryId(item.category ?? 'dien-thoai'),
  }))
  nextItemId = Math.max(nextItemId, ...items.value.map((i) => i.id), 0) + 1
  imeiText.value = (data.imeis ?? []).join('\n')
  loading.value = false
}

function buildPayload() {
  const supplier = suppliers.value.find((s) => s.id === selectedSupplier.value)
  return {
    code: importCode.value,
    supplierId: selectedSupplier.value,
    supplierName: supplier?.name ?? newSupplier.value.name,
    notes: notes.value,
    status: status.value,
    items: items.value,
    imeis: parsedImeis.value,
  }
}

function openAddProduct() {
  productSearch.value = ''
  categoryFilter.value = 'all'
  addProductMode.value = 'catalog'
  selectedVariant.value = null
  addQuantity.value = 1
  addUnitPrice.value = 0
  newProductForm.value = {
    name: '',
    category: categories.value[0]?.id ?? '',
    brand: 'Apple',
    customBrand: '',
    color: '',
    storage: '',
    variantDesc: '',
  }
  newCategoryForm.value = { label: '', requiresImei: false }
  showAddProduct.value = true
  loadCatalogVariants()
}

async function loadCatalogVariants() {
  const localOnly = listImportProductVariants().filter((v) => v.isUserCreated)
  try {
    const fromApi = await fetchImportProductVariants()
    const apiIds = new Set(fromApi.map((v) => v.productVariantId))
    const extras = localOnly.filter((v) => !apiIds.has(v.productVariantId))
    catalogVariants.value = [...fromApi, ...extras]
  } catch {
    catalogVariants.value = listImportProductVariants()
  }
}

function selectVariant(variant) {
  selectedVariant.value = variant
  addUnitPrice.value = variant.unitPrice
}

async function confirmAddProduct() {
  if (addProductMode.value === 'catalog') {
    confirmAddFromCatalog()
  } else {
    await confirmAddNewProduct()
  }
}

function confirmAddFromCatalog() {
  if (!selectedVariant.value) return
  const qty = Math.max(1, Number(addQuantity.value) || 1)
  const price = Math.max(0, Number(addUnitPrice.value) || 0)
  const existing = items.value.find((i) => i.productVariantId === selectedVariant.value.productVariantId)

  if (existing) {
    existing.quantity += qty
    existing.unitPrice = price
  } else {
    items.value.push({
      id: nextItemId++,
      productVariantId: selectedVariant.value.productVariantId,
      category: selectedVariant.value.category ?? 'other',
      name: selectedVariant.value.name,
      variant: selectedVariant.value.variant,
      quantity: qty,
      unitPrice: price,
      isNew: false,
    })
  }

  showAddProduct.value = false
}

async function confirmAddNewProduct() {
  const f = newProductForm.value
  const brand = isCustomBrand.value ? f.customBrand.trim() : f.brand
  if (!f.name.trim() || !brand) return

  let categoryKey = f.category
  if (isAddingCategory.value) {
    try {
      const created = addProductCategory({
        label: newCategoryForm.value.label,
        requiresImei: newCategoryForm.value.requiresImei,
      })
      categoryKey = created.id
      await loadCategoryOptions()
    } catch (err) {
      error.value = err.message ?? 'Không thể tạo danh mục'
      return
    }
  }

  const categorySlug = resolveCategorySlug(categoryKey)
  const qty = Math.max(1, Number(addQuantity.value) || 1)
  const price = Math.max(0, Number(addUnitPrice.value) || 0)
  const variantLabel = buildImportVariantLabel(categorySlug, f)
  const existing = items.value.find(
    (i) => i.isNew && i.name === f.name.trim() && i.variant === variantLabel && i.category === categorySlug,
  )

  if (existing) {
    existing.quantity += qty
    existing.unitPrice = price
  } else {
    items.value.push({
      id: nextItemId++,
      productVariantId: null,
      isNew: true,
      category: categorySlug,
      name: f.name.trim(),
      brand,
      variant: variantLabel,
      quantity: qty,
      unitPrice: price,
    })
  }

  showAddProduct.value = false
  error.value = ''
}

function removeItem(id) {
  items.value = items.value.filter((item) => item.id !== id)
}

function updateItemQuantity(id, value) {
  const item = items.value.find((i) => i.id === id)
  if (item) item.quantity = Math.max(1, Number(value) || 1)
}

function updateItemUnitPrice(id, value) {
  const item = items.value.find((i) => i.id === id)
  if (item) item.unitPrice = Math.max(0, Number(value) || 0)
}

async function persistDraft() {
  message.value = ''
  error.value = ''

  if (isAddingSupplier.value) {
    if (!newSupplier.value.name.trim()) {
      error.value = 'Vui lòng nhập tên nhà cung cấp'
      return false
    }
    const created = await addSupplier({
      name: newSupplier.value.name.trim(),
      phone: newSupplier.value.phone.trim(),
      city: newSupplier.value.city.trim(),
    })
    selectedSupplier.value = created.id
    await loadSuppliers()
  }

  const payload = { ...buildPayload(), status: 'draft' }
  if (isCreate.value) {
    await createStockImport(payload)
    await router.replace({ name: 'stock-import-detail', params: { code: importCode.value } })
  } else {
    await updateStockImport(importCode.value, payload)
  }
  status.value = 'draft'
  return true
}

async function handleSaveDraft() {
  if (isReadonly.value) return
  saving.value = true
  try {
    const ok = await persistDraft()
    if (ok) message.value = 'Đã lưu nháp phiếu nhập'
  } catch (err) {
    error.value = err.message ?? 'Không thể lưu phiếu nhập'
  } finally {
    saving.value = false
  }
}

async function handleConfirm() {
  if (isReadonly.value) return
  if (!imeiValidation.value.isComplete) {
    error.value = imeiValidation.value.errors[0] ?? 'Chưa đủ IMEI hợp lệ để xác nhận'
    return
  }

  saving.value = true
  message.value = ''
  error.value = ''

  try {
    const ok = await persistDraft()
    if (!ok) return

    const hadNewProducts = items.value.some((item) => item.isNew)
    const saved = await confirmStockImport(importCode.value)
    items.value = saved.items.map((item) => ({ ...item }))
    status.value = 'confirmed'
    message.value = hadNewProducts
      ? 'Đã xác nhận phiếu nhập. Sản phẩm mới đã được tạo trong danh mục.'
      : 'Đã xác nhận phiếu nhập thành công'
  } catch (err) {
    error.value = err.message ?? 'Không thể xác nhận phiếu nhập'
  } finally {
    saving.value = false
  }
}

watch(() => route.params.code, loadImport, { immediate: false })
onMounted(loadImport)
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppDetailSkeleton v-if="loading" variant="page" :show-sidebar="true" />

    <div v-else-if="error && !importCode" class="rounded-[24px] border border-red-200 bg-white p-10 text-center">
      <p class="font-semibold text-red-600">{{ error }}</p>
      <button
        class="mt-4 rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
        @click="router.push({ name: 'stock-imports' })"
      >
        Về danh sách phiếu
      </button>
    </div>

    <template v-else>
      <AppContentBreadcrumb />
      <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-red-100">Kho & IMEI</p>
            <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ importCode }}</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
              {{ isReadonly ? 'Phiếu đã xác nhận — chỉ xem, không chỉnh sửa.' : 'Thêm biến thể, nạp IMEI và xác nhận nhập kho.' }}
            </p>
          </div>
          <div class="rounded-[18px] bg-white/10 px-4 py-3 text-right ring-1 ring-white/20 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-widest text-red-100/80">Trạng thái phiếu</p>
            <p class="mt-1 font-bold">{{ statusLabel }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="message"
        class="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
      >
        {{ message }}
      </div>
      <div
        v-if="error && importCode"
        class="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
      >
        {{ error }}
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <div class="space-y-6">
          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 class="text-lg font-bold text-[#111118]">Thông tin phiếu nhập</h3>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Mã phiếu</label>
                <input
                  v-model="importCode"
                  type="text"
                  readonly
                  class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                />
              </div>
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Nhà cung cấp</label>
                <select
                  v-model="selectedSupplier"
                  :disabled="isReadonly"
                  class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 disabled:opacity-60"
                >
                  <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                    {{ supplier.name }}
                  </option>
                  <option v-if="!isReadonly" value="new">+ Thêm nhà cung cấp mới</option>
                </select>
              </div>
              <template v-if="isAddingSupplier && !isReadonly">
                <div>
                  <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên nhà cung cấp</label>
                  <input
                    v-model="newSupplier.name"
                    type="text"
                    placeholder="Ví dụ: Công ty ABC Mobile"
                    class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</label>
                  <input
                    v-model="newSupplier.phone"
                    type="text"
                    placeholder="028 3822 9999"
                    class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Tỉnh / Thành phố</label>
                  <input
                    v-model="newSupplier.city"
                    type="text"
                    placeholder="TP.HCM / Hà Nội / Viêng Chăn..."
                    class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
                  />
                </div>
              </template>
              <div class="md:col-span-2">
                <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú</label>
                <textarea
                  v-model="notes"
                  :disabled="isReadonly"
                  rows="3"
                  placeholder="Ví dụ: nhập theo đợt khuyến mãi cuối tháng..."
                  class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 disabled:opacity-60"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <div class="flex items-center justify-between border-b border-red-100 px-6 py-4">
              <div>
                <h3 class="text-lg font-bold text-[#111118]">Chi tiết sản phẩm nhập</h3>
                <p class="text-sm text-slate-500">
                  {{ totalQuantity }} dòng hàng
                  <template v-if="imeiRequiredCount > 0">
                    · {{ imeiValidation.totalImported }}/{{ imeiRequiredCount }} IMEI đã nạp
                  </template>
                  <template v-if="accessoryCount > 0">
                    · {{ accessoryCount }} phụ kiện/linh kiện theo số lượng
                  </template>
                </p>
              </div>
              <button
                v-if="!isReadonly"
                type="button"
                class="rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                @click="openAddProduct"
              >
                + Thêm sản phẩm
              </button>
            </div>

            <div v-if="mappedItems.length === 0" class="px-6 py-10 text-center">
              <p class="text-sm text-slate-500">Chưa có sản phẩm trong phiếu.</p>
              <button
                v-if="!isReadonly"
                type="button"
                class="mt-3 rounded-[14px] bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
                @click="openAddProduct"
              >
                + Thêm sản phẩm đầu tiên
              </button>
            </div>

            <div v-else class="divide-y divide-red-100">
              <div v-for="item in mappedItems" :key="item.id" class="px-6 py-4">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="font-bold text-[#111118]">{{ item.name }}</p>
                      <span class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-100">
                        {{ categoryLabel(item.category) }}
                      </span>
                      <span
                        v-if="item.isNew"
                        class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 ring-1 ring-amber-100"
                      >
                        Sản phẩm mới
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-slate-500">{{ item.variant }}</p>
                    <button
                      v-if="!isReadonly"
                      type="button"
                      class="mt-2 text-xs font-semibold text-red-500 transition hover:text-red-700"
                      @click="removeItem(item.id)"
                    >
                      Xóa dòng
                    </button>
                  </div>
                  <div class="grid min-w-[280px] grid-cols-3 gap-3 text-sm">
                    <div class="rounded-[16px] bg-red-50/60 px-3 py-2 text-center ring-1 ring-red-100">
                      <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Số lượng</p>
                      <input
                        v-if="!isReadonly"
                        :value="item.quantity"
                        type="number"
                        min="1"
                        class="mt-1 w-full bg-transparent text-center font-bold text-slate-700 outline-none"
                        @input="updateItemQuantity(item.id, $event.target.value)"
                      />
                      <p v-else class="mt-1 font-bold text-slate-700">{{ item.quantity }}</p>
                    </div>
                    <div class="rounded-[16px] bg-red-50/60 px-3 py-2 text-center ring-1 ring-red-100">
                      <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {{ item.requiresImei !== false ? 'Đã nạp IMEI' : 'Theo SL' }}
                      </p>
                      <p
                        v-if="item.requiresImei !== false"
                        class="mt-1 font-bold"
                        :class="item.imported >= item.quantity ? 'text-emerald-600' : 'text-amber-600'"
                      >
                        {{ item.imported }}
                      </p>
                      <p v-else class="mt-1 font-bold text-emerald-600">✓</p>
                    </div>
                    <div class="rounded-[16px] bg-red-50/60 px-3 py-2 text-center ring-1 ring-red-100">
                      <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Đơn giá nhập</p>
                      <AppMoneyInput
                        v-if="!isReadonly"
                        :model-value="item.unitPrice"
                        :hide-zero="false"
                        input-class="mt-1 w-full bg-transparent text-center font-bold text-red-600 outline-none"
                        @update:model-value="updateItemUnitPrice(item.id, $event)"
                      />
                      <p v-else class="mt-1 font-bold text-red-600">{{ formatCurrency(item.unitPrice) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 class="text-lg font-bold text-[#111118]">Danh sách IMEI</h3>
            <p class="mt-1 text-sm text-slate-500">
              <template v-if="imeiRequiredCount > 0">
                Nạp IMEI cho điện thoại, tablet, laptop, đồng hồ ({{ imeiRequiredCount }} thiết bị).
              </template>
              <template v-else>
                Phiếu chỉ có phụ kiện/linh kiện — nhập theo số lượng, không cần IMEI.
              </template>
            </p>

            <div v-if="imeiRequiredCount === 0" class="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Phụ kiện, tai nghe, sạc cáp... được quản lý theo số lượng tồn kho.
            </div>

            <template v-else>
              <div class="mt-4 rounded-[18px] border border-red-200 bg-red-50/60 p-4">
                <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Dán hoặc quét IMEI</label>
                <textarea
                  v-model="imeiText"
                  :disabled="isReadonly"
                  rows="5"
                  placeholder="Mỗi IMEI một dòng hoặc cách nhau bởi dấu phẩy"
                  class="w-full rounded-[16px] border border-red-200 bg-white px-4 py-3 font-mono text-sm text-slate-700 outline-none focus:border-red-400 disabled:opacity-60"
                ></textarea>
                <p class="mt-2 text-xs text-slate-500">
                  {{ imeiValidation.totalImported }}/{{ imeiValidation.totalRequired }} IMEI
                </p>
              </div>

              <div v-if="imeiValidation.errors.length" class="mt-3 space-y-1">
                <p
                  v-for="(err, idx) in imeiValidation.errors"
                  :key="idx"
                  class="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
                >
                  {{ err }}
                </p>
              </div>

              <div class="mt-4 max-h-64 space-y-2 overflow-y-auto">
                <div
                  v-for="entry in imeiValidation.entries"
                  :key="`${entry.imei}-${entry.index}`"
                  class="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 ring-1 ring-red-100"
                >
                  <span class="font-mono text-sm text-slate-700">{{ entry.imei }}</span>
                  <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="imeiStatusClass[entry.status]">
                    {{ entry.message }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 class="text-lg font-bold text-[#111118]">Xác nhận nhập kho</h3>
            <div class="mt-4 space-y-2 rounded-[18px] bg-[#fffafa] p-4 ring-1 ring-red-100">
              <div class="flex items-center justify-between text-sm text-slate-500">
                <span>Tổng dòng hàng</span>
                <span class="font-semibold text-slate-700">{{ totalQuantity }}</span>
              </div>
              <div v-if="imeiRequiredCount > 0" class="flex items-center justify-between text-sm text-slate-500">
                <span>Đã nạp IMEI (thiết bị)</span>
                <span class="font-semibold text-slate-700">{{ imeiValidation.totalImported }}/{{ imeiRequiredCount }}</span>
              </div>
              <div v-if="accessoryCount > 0" class="flex items-center justify-between text-sm text-slate-500">
                <span>Phụ kiện / linh kiện</span>
                <span class="font-semibold text-slate-700">{{ accessoryCount }} (theo SL)</span>
              </div>
              <div class="flex items-center justify-between border-t border-red-100 pt-3">
                <span class="text-sm font-bold text-[#111118]">Tổng tiền nhập</span>
                <span class="text-xl font-black text-red-600">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>

            <div v-if="hasNewProducts && !isReadonly" class="mt-4 rounded-[14px] bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-100">
              Phiếu có sản phẩm mới chưa có trong danh mục. Khi xác nhận, hệ thống sẽ tự tạo biến thể để quản lý IMEI và tồn kho.
            </div>

            <div v-if="!isReadonly" class="mt-5 grid gap-3">
              <button
                :disabled="saving || !imeiValidation.isComplete"
                class="rounded-[16px] bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleConfirm"
              >
                {{ saving ? 'Đang xử lý...' : 'Xác nhận phiếu nhập' }}
              </button>
              <button
                :disabled="saving"
                class="rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-50"
                @click="handleSaveDraft"
              >
                {{ saving ? 'Đang lưu...' : 'Lưu nháp' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AppModal :open="showAddProduct" @close="showAddProduct = false">
        <div class="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-2xl">
          <div class="shrink-0 border-b border-red-100 px-4 py-4 sm:px-6">
            <h3 class="text-lg font-bold text-[#111118]">Thêm sản phẩm vào phiếu</h3>
            <p class="mt-1 text-sm text-slate-500">Chọn từ danh mục hoặc khai báo sản phẩm mới</p>

            <div class="mt-4 flex gap-1.5 rounded-[14px] bg-red-50/60 p-1 ring-1 ring-red-100 sm:gap-2">
              <button
                type="button"
                class="flex-1 rounded-[12px] px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
                :class="addProductMode === 'catalog' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'"
                @click="addProductMode = 'catalog'"
              >
                Có sẵn trong kho
              </button>
              <button
                type="button"
                class="flex-1 rounded-[12px] px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
                :class="addProductMode === 'new' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'"
                @click="addProductMode = 'new'"
              >
                Sản phẩm mới
              </button>
            </div>
          </div>

          <div v-if="addProductMode === 'catalog'" class="custom-scrollbar-content min-h-0 flex-1 overflow-y-auto p-4 sm:p-4">
            <div class="mb-3 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto sm:gap-2">
              <button
                type="button"
                class="shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ring-1 sm:px-3 sm:text-xs"
                :class="categoryFilter === 'all' ? 'bg-red-600 text-white ring-red-600' : 'bg-white text-slate-600 ring-red-100 hover:bg-red-50'"
                @click="categoryFilter = 'all'"
              >
                Tất cả
              </button>
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                class="shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ring-1 sm:px-3 sm:text-xs"
                :class="categoryFilter === cat.id ? 'bg-red-600 text-white ring-red-600' : 'bg-white text-slate-600 ring-red-100 hover:bg-red-50'"
                @click="categoryFilter = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>

            <input
              v-model="productSearch"
              type="text"
              placeholder="Tìm theo tên, biến thể, danh mục..."
              class="mb-3 w-full min-w-0 rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />

            <div class="space-y-2">
              <button
                v-for="variant in filteredVariants"
                :key="variant.productVariantId"
                type="button"
                class="flex w-full items-start gap-3 rounded-[16px] px-3 py-3 text-left ring-1 transition sm:px-4"
                :class="
                  selectedVariant?.productVariantId === variant.productVariantId
                    ? 'bg-red-50 ring-red-300'
                    : 'bg-white ring-red-100 hover:bg-red-50/50'
                "
                @click="selectVariant(variant)"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p class="truncate font-semibold text-[#111118]">{{ variant.name }}</p>
                    <span class="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      {{ categoryLabel(variant.category) }}
                    </span>
                  </div>
                  <p class="truncate text-sm text-slate-500">{{ variant.variant }}</p>
                </div>
                <span class="shrink-0 whitespace-nowrap text-right text-xs font-bold text-red-600 sm:text-sm">
                  {{ formatCurrency(variant.unitPrice) }}
                </span>
              </button>
            </div>

            <p v-if="filteredVariants.length === 0" class="py-6 text-center text-sm text-slate-500">
              Không tìm thấy sản phẩm phù hợp. Hãy chuyển sang tab <strong>Sản phẩm mới</strong>.
            </p>
          </div>

          <div v-else class="custom-scrollbar-content min-h-0 flex-1 overflow-y-auto p-4 sm:p-4">
            <div class="mb-3 rounded-[14px] bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-100">
              Sản phẩm chưa có trong hệ thống. Khi xác nhận phiếu nhập, biến thể sẽ được tạo tự động.
            </div>

            <div class="space-y-3">
              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Danh mục</label>
                <select
                  v-model="newProductForm.category"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
                >
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
                  <option value="new">+ Thêm danh mục mới</option>
                </select>
              </div>

              <template v-if="isAddingCategory">
                <div class="rounded-[14px] border border-red-200 bg-red-50/40 p-3">
                  <div>
                    <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên danh mục mới</label>
                    <input
                      v-model="newCategoryForm.label"
                      type="text"
                      placeholder="Ví dụ: Máy ảnh / Gaming / Phụ kiện ô tô..."
                      class="w-full rounded-[14px] border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>
                  <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input v-model="newCategoryForm.requiresImei" type="checkbox" class="rounded border-red-300 text-red-600" />
                    Theo dõi IMEI / serial từng chiếc
                  </label>
                </div>
              </template>

              <div
                v-if="!isAddingCategory"
                class="rounded-[14px] border px-4 py-3 text-xs ring-1"
                :class="activeCategoryForm.requiresImei ? 'border-amber-200 bg-amber-50 text-amber-800 ring-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-100'"
              >
                {{ activeCategoryForm.hint }}
              </div>

              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên sản phẩm</label>
                <input
                  v-model="newProductForm.name"
                  type="text"
                  :placeholder="activeCategoryForm.namePlaceholder"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
                />
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Thương hiệu</label>
                  <select
                    v-model="newProductForm.brand"
                    class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  >
                    <option v-for="brand in brandOptions" :key="brand" :value="brand">{{ brand }}</option>
                  </select>
                </div>
                <div v-if="isCustomBrand">
                  <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên thương hiệu</label>
                  <input
                    v-model="newProductForm.customBrand"
                    type="text"
                    placeholder="Nhập thương hiệu..."
                    class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div
                class="grid grid-cols-1 gap-3"
                :class="activeCategoryForm.fields.length > 1 ? 'sm:grid-cols-2' : ''"
              >
                <div v-for="field in activeCategoryForm.fields" :key="field.key">
                  <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    {{ field.label }}
                    <span v-if="field.required" class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="newProductForm[field.key]"
                    type="text"
                    :placeholder="field.placeholder"
                    class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số lượng</label>
                  <input
                    v-model.number="addQuantity"
                    type="number"
                    min="1"
                    class="w-full rounded-[14px] border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Đơn giá nhập</label>
                  <AppMoneyInput
                    v-model="addUnitPrice"
                    :hide-zero="false"
                    input-class="w-full rounded-[14px] border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="addProductMode === 'catalog' && selectedVariant" class="shrink-0 border-t border-red-100 bg-red-50/40 px-4 py-4 sm:px-6">
            <p class="truncate text-sm font-semibold text-slate-700">
              {{ selectedVariant.name }} — {{ selectedVariant.variant }}
            </p>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số lượng</label>
                <input
                  v-model.number="addQuantity"
                  type="number"
                  min="1"
                  class="w-full rounded-[14px] border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Đơn giá nhập</label>
                <AppMoneyInput
                  v-model="addUnitPrice"
                  :hide-zero="false"
                  input-class="w-full rounded-[14px] border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>

          <div class="shrink-0 flex flex-col-reverse gap-2 border-t border-red-100 px-4 py-4 sm:flex-row sm:gap-3 sm:px-6">
            <button
              type="button"
              class="w-full rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50 sm:flex-1"
              @click="showAddProduct = false"
            >
              Hủy
            </button>
            <button
              type="button"
              :disabled="!canConfirmAdd"
              class="w-full rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
              @click="confirmAddProduct"
            >
              Thêm vào phiếu
            </button>
          </div>
        </div>
      </AppModal>
    </template>
  </div>
</template>

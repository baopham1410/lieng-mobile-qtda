<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppDetailSkeleton from '@/components/common/AppDetailSkeleton.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppProductImageField from '@/components/products/AppProductImageField.vue'
import {
  buildProductPayload,
  fetchProduct,
  fetchProductCategories,
  updateProduct,
} from '@/api/products'
import { withApiFallback } from '@/utils/apiFallback'
import { useLocaleStore } from '@/stores/locale'
import {
  applyProductVariantToForm,
  getImportCategoryProfile,
  mergeCategoriesWithFormProfiles,
  resolveCategorySlug,
  validateProductEditForm,
} from '@/data/importCategoryForm'
import { formatCurrency } from '@/utils/formatCurrency'

const props = defineProps({
  productId: {
    type: [String, Number],
    required: true,
  },
  mode: {
    type: String,
    default: 'page',
  },
})

const emit = defineEmits(['close', 'saved'])

const router = useRouter()
const locale = useLocaleStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const categories = ref([])
const productImage = ref('')
const hasCustomImage = ref(false)
const categorySlugForImage = ref('')

const form = ref({
  name: '',
  categoryId: null,
  brand: 'Apple',
  customBrand: '',
  modelCode: '',
  description: '',
  isActive: true,
  color: '',
  storage: '',
  ram: '',
  variantDesc: '',
  condition: 'new',
  sku: '',
  importPrice: '',
  retailPrice: '',
  wholesalePrice: '',
})

const brandOptions = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'JBL', 'Khác']
const conditionOptions = [
  { value: 'new', label: 'Mới' },
  { value: 'likenew_99', label: 'Like new 99%' },
  { value: 'used', label: 'Đã qua sử dụng' },
]

const isPanel = computed(() => props.mode === 'panel')
const isCustomBrand = computed(() => form.value.brand === 'Khác')
const statusLabel = computed(() => (form.value.isActive ? 'Đang bán' : 'Tạm ẩn'))
const statusClass = computed(() =>
  form.value.isActive
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : 'bg-slate-100 text-slate-600 ring-slate-200',
)

const inputClass =
  'w-full rounded-[14px] border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-red-400'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400'

const activeCategorySlug = computed(() => resolveCategorySlug(form.value.categoryId, categories.value))
const activeCategoryForm = computed(() => getImportCategoryProfile(activeCategorySlug.value))
const showConditionField = computed(() => ['mobile', 'laptop'].includes(activeCategoryForm.value.profile))
const categoryHintClass = computed(() =>
  activeCategoryForm.value.requiresImei
    ? 'border-amber-200 bg-amber-50 text-amber-800 ring-amber-100'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-100',
)

function categoryLabel(cat) {
  return cat.label ?? cat.name ?? cat.slug
}

function applyBrand(brand) {
  if (!brand) {
    form.value.brand = 'Apple'
    form.value.customBrand = ''
    return
  }
  if (brandOptions.includes(brand)) {
    form.value.brand = brand
    form.value.customBrand = ''
  } else {
    form.value.brand = 'Khác'
    form.value.customBrand = brand
  }
}

function applyProduct(product) {
  form.value.name = product.name ?? ''
  form.value.categoryId = product.categoryId ?? categories.value[0]?.id ?? null
  applyBrand(product.brand)
  form.value.modelCode = product.modelCode ?? ''
  form.value.description = product.description ?? ''
  form.value.isActive = product.isActive !== false
  const slug = product.categorySlug ?? resolveCategorySlug(product.categoryId, categories.value)
  applyProductVariantToForm(form.value, product, slug)
  form.value.importPrice = product.prices?.import ?? ''
  form.value.retailPrice = product.prices?.retail ?? ''
  form.value.wholesalePrice = product.prices?.wholesale ?? ''
  productImage.value = product.image ?? ''
  hasCustomImage.value = !!product.hasCustomImage
  categorySlugForImage.value = product.categorySlug ?? resolveCategorySlug(product.categoryId, categories.value)
}

function handleImageUpdated(payload) {
  productImage.value = payload?.image ?? productImage.value
  hasCustomImage.value = !!payload?.hasCustomImage
  emit('saved')
}

async function loadCategories() {
  if (categories.value.length) return
  const apiCategories = await withApiFallback(fetchProductCategories, () => [])
  categories.value = mergeCategoriesWithFormProfiles(apiCategories)
}

async function loadProduct() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await loadCategories()
    const product = await fetchProduct(props.productId)
    applyProduct(product)
  } catch {
    error.value = 'Không tải được thông tin sản phẩm.'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  error.value = ''
  message.value = ''

  const validationError = validateProductEditForm(form.value.categoryId, form.value, categories.value)
  if (validationError) {
    error.value = validationError
    return
  }
  if (!form.value.categoryId) {
    error.value = 'Vui lòng chọn danh mục.'
    return
  }

  saving.value = true
  try {
    const payload = buildProductPayload(form.value, categories.value)
    const updated = await updateProduct(props.productId, payload)
    if (isPanel.value) {
      emit('saved', updated)
      emit('close')
      return
    }
    message.value = 'Đã cập nhật sản phẩm.'
    setTimeout(() => router.push({ name: 'products' }), 600)
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Không thể lưu sản phẩm. Vui lòng thử lại.'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (isPanel.value) {
    emit('close')
    return
  }
  router.push({ name: 'products' })
}

watch(
  () => form.value.categoryId,
  () => {
    categorySlugForImage.value = activeCategorySlug.value
  },
)

watch(
  () => props.productId,
  () => {
    loadProduct()
  },
  { immediate: true },
)
</script>

<template>
  <!-- Panel slide-over (giống chi tiết đơn hàng) -->
  <template v-if="isPanel">
    <AppDetailSkeleton v-if="loading" variant="panel" show-image />

    <template v-else>
      <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Sửa sản phẩm</p>
            <h3 class="mt-1 truncate text-xl font-black text-[#111118]">{{ form.name || '—' }}</h3>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            @click="handleCancel"
          >
            {{ locale.t('common.close') }}
          </button>
        </div>
        <span class="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1" :class="statusClass">
          {{ statusLabel }}
        </span>
      </div>

      <div class="space-y-6 p-6">
        <div
          v-if="error"
          class="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {{ error }}
        </div>

        <AppProductImageField
          :product-id="productId"
          :name="form.name"
          :image="productImage"
          :category-slug="categorySlugForImage"
          :has-custom-image="hasCustomImage"
          @updated="handleImageUpdated"
        />

        <div class="rounded-[18px] bg-red-50/50 p-4 ring-1 ring-red-100">
          <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin sản phẩm</p>
          <div class="mt-3 space-y-3">
            <div>
              <label :class="labelClass">Tên sản phẩm</label>
              <input
                v-model="form.name"
                type="text"
                :class="inputClass"
                :placeholder="activeCategoryForm.namePlaceholder"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label :class="labelClass">Danh mục</label>
                <select v-model="form.categoryId" :class="inputClass">
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ categoryLabel(cat) }}</option>
                </select>
              </div>
              <div>
                <label :class="labelClass">Trạng thái</label>
                <select v-model="form.isActive" :class="inputClass">
                  <option :value="true">Đang bán</option>
                  <option :value="false">Tạm ẩn</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label :class="labelClass">Thương hiệu</label>
                <select v-model="form.brand" :class="inputClass">
                  <option v-for="item in brandOptions" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>
              <div>
                <label :class="labelClass">Model code</label>
                <input v-model="form.modelCode" type="text" :class="inputClass" placeholder="A3101" />
              </div>
            </div>
            <div v-if="isCustomBrand">
              <label :class="labelClass">Tên thương hiệu</label>
              <input v-model="form.customBrand" type="text" :class="inputClass" />
            </div>
            <div>
              <label :class="labelClass">Mô tả ngắn</label>
              <textarea v-model="form.description" rows="3" :class="inputClass" placeholder="Thông tin nổi bật..." />
            </div>
          </div>
        </div>

        <div class="rounded-[18px] border border-red-100 bg-white p-4">
          <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Biến thể</p>

          <div
            class="mt-3 rounded-[14px] border px-4 py-3 text-xs ring-1"
            :class="categoryHintClass"
          >
            {{ activeCategoryForm.hint }}
          </div>

          <div
            class="mt-3 grid grid-cols-1 gap-3"
            :class="activeCategoryForm.fields.length > 1 ? 'sm:grid-cols-2' : ''"
          >
            <div v-for="field in activeCategoryForm.fields" :key="field.key">
              <label :class="labelClass">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              <input
                v-model="form[field.key]"
                type="text"
                :class="inputClass"
                :placeholder="field.placeholder"
              />
            </div>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-3" :class="showConditionField ? 'sm:grid-cols-2' : ''">
            <div v-if="showConditionField">
              <label :class="labelClass">Tình trạng</label>
              <select v-model="form.condition" :class="inputClass">
                <option v-for="item in conditionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </div>
            <div :class="showConditionField ? '' : 'sm:col-span-2'">
              <label :class="labelClass">SKU</label>
              <input v-model="form.sku" type="text" :class="inputClass" placeholder="IP15PM-256-TITAN" />
            </div>
          </div>
        </div>

        <div class="rounded-[18px] bg-[#fffafa] p-4 ring-1 ring-red-100">
          <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Bảng giá</p>
          <div class="mt-3 space-y-3">
            <div>
              <label :class="labelClass">Giá nhập</label>
              <input
                :value="form.importPrice ? formatCurrency(Number(form.importPrice)) : '—'"
                type="text"
                readonly
                class="w-full cursor-not-allowed rounded-[14px] border border-red-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500"
              />
              <p class="mt-1 text-[11px] text-slate-400">Cập nhật qua phiếu Nhập kho</p>
            </div>
            <div>
              <label :class="labelClass">Giá bán lẻ</label>
              <AppMoneyInput v-model="form.retailPrice" :hide-zero="false" :input-class="inputClass" placeholder="28.990.000" />
            </div>
            <div>
              <label :class="labelClass">Giá bán sỉ</label>
              <AppMoneyInput v-model="form.wholesalePrice" :hide-zero="false" :input-class="inputClass" placeholder="27.900.000" />
            </div>
          </div>
        </div>

        <p class="text-center text-xs text-slate-400">
          Thêm hàng mới hoặc tăng tồn kho tại
          <RouterLink to="/inventory/imports/create" class="font-semibold text-red-600 hover:underline">Nhập kho</RouterLink>
        </p>

        <button
          type="button"
          class="w-full rounded-[14px] bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-60"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? 'Đang lưu...' : 'Cập nhật sản phẩm' }}
        </button>
      </div>
    </template>
  </template>

  <!-- Trang full (fallback) -->
  <div v-else class="space-y-6 p-6 sm:p-8">
    <AppDetailSkeleton v-if="loading" variant="page" show-image />

    <template v-else>
      <AppContentBreadcrumb />

      <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-red-100">Chỉnh sửa hàng hóa</p>
            <h2 class="mt-1 text-2xl font-black sm:text-3xl">Sửa sản phẩm</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
              Cập nhật tên, giá và trạng thái. Thêm hàng mới tại
              <RouterLink to="/inventory/imports/create" class="font-semibold underline underline-offset-2">Nhập kho</RouterLink>.
            </p>
          </div>
        </div>
      </div>

      <div v-if="error" class="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {{ error }}
      </div>
      <div v-if="message" class="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        {{ message }}
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <div class="space-y-6">
          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 class="text-lg font-bold text-[#111118]">Thông tin dòng sản phẩm</h3>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="md:col-span-2">
                <label :class="labelClass">Tên sản phẩm</label>
                <input v-model="form.name" type="text" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400" />
              </div>
              <div>
                <label :class="labelClass">Danh mục</label>
                <select v-model="form.categoryId" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400">
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ categoryLabel(cat) }}</option>
                </select>
              </div>
              <div>
                <label :class="labelClass">Trạng thái</label>
                <select v-model="form.isActive" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400">
                  <option :value="true">Đang bán</option>
                  <option :value="false">Tạm ẩn</option>
                </select>
              </div>
              <div>
                <label :class="labelClass">Thương hiệu</label>
                <select v-model="form.brand" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400">
                  <option v-for="item in brandOptions" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>
              <div v-if="isCustomBrand">
                <label :class="labelClass">Tên thương hiệu</label>
                <input v-model="form.customBrand" type="text" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400" />
              </div>
              <div>
                <label :class="labelClass">Model code</label>
                <input v-model="form.modelCode" type="text" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400" />
              </div>
              <div class="md:col-span-2">
                <label :class="labelClass">Mô tả ngắn</label>
                <textarea v-model="form.description" rows="4" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400" />
              </div>
            </div>
          </div>

          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 class="text-lg font-bold text-[#111118]">Biến thể mặc định</h3>

            <div
              class="mt-4 rounded-[14px] border px-4 py-3 text-xs ring-1"
              :class="categoryHintClass"
            >
              {{ activeCategoryForm.hint }}
            </div>

            <div
              class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
              :class="activeCategoryForm.fields.length === 1 ? 'md:grid-cols-1' : ''"
            >
              <div v-for="field in activeCategoryForm.fields" :key="field.key">
                <label :class="labelClass">
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-500">*</span>
                </label>
                <input
                  v-model="form[field.key]"
                  type="text"
                  :placeholder="field.placeholder"
                  class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <div v-if="showConditionField">
                <label :class="labelClass">Tình trạng</label>
                <select v-model="form.condition" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400">
                  <option v-for="item in conditionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
              </div>
              <div :class="showConditionField ? '' : 'md:col-span-2'">
                <label :class="labelClass">SKU</label>
                <input v-model="form.sku" type="text" class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <AppProductImageField
            :product-id="productId"
            :name="form.name"
            :image="productImage"
            :category-slug="categorySlugForImage"
            :has-custom-image="hasCustomImage"
            @updated="handleImageUpdated"
          />

          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 class="text-lg font-bold text-[#111118]">Bảng giá</h3>
            <div class="mt-5 space-y-4">
              <div>
                <label :class="labelClass">Giá nhập</label>
                <input
                  :value="form.importPrice ? formatCurrency(Number(form.importPrice)) : '—'"
                  type="text"
                  readonly
                  class="w-full cursor-not-allowed rounded-[16px] border border-red-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500"
                />
                <p class="mt-1 text-xs text-slate-400">Cập nhật qua phiếu Nhập kho</p>
              </div>
              <div>
                <label :class="labelClass">Giá bán lẻ</label>
                <AppMoneyInput
                  v-model="form.retailPrice"
                  :hide-zero="false"
                  input-class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label :class="labelClass">Giá bán sỉ</label>
                <AppMoneyInput
                  v-model="form.wholesalePrice"
                  :hide-zero="false"
                  input-class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>

          <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <div class="grid gap-3">
              <button
                type="button"
                class="rounded-[16px] bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-60"
                :disabled="saving"
                @click="handleSave"
              >
                {{ saving ? 'Đang lưu...' : 'Cập nhật sản phẩm' }}
              </button>
              <button
                type="button"
                class="rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50"
                @click="handleCancel"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

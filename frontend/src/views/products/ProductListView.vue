<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppProductThumb from '@/components/common/AppProductThumb.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import { fetchProducts, deleteProduct } from '@/api/products'
import { downloadCsv } from '@/utils/exportCsv'
import { withApiFallback } from '@/utils/apiFallback'
import { useLocaleStore } from '@/stores/locale'
import {
  productBrands as mockBrands,
  productCategories as mockCategories,
  productRows as mockRows,
  productStats as mockStats,
  formatCurrency,
} from '@/mocks/productMock'

const locale = useLocaleStore()
const route = useRoute()
const router = useRouter()
const FILTER_ALL = '__all__'

const keyword = ref('')
const selectedCategory = ref(FILTER_ALL)
const selectedBrand = ref(FILTER_ALL)
const productRows = ref([...mockRows])
const productStats = ref({ ...mockStats })
const categoryOptions = ref([])
const brandOptions = ref([])
const deletingId = ref(null)
const editingProductId = ref(null)
const listReady = ref(false)

function openEdit(product) {
  editingProductId.value = product.id
  router.replace({ query: { ...route.query, edit: String(product.id) } })
}

function closeEdit() {
  editingProductId.value = null
  const { edit, ...rest } = route.query
  router.replace({ query: rest })
}

async function refreshProducts() {
  try {
    const data = await fetchProducts()
    productRows.value = Array.isArray(data.rows) ? data.rows : []
    productStats.value = data.stats ?? { ...productStats.value }
    categoryOptions.value = stripAllOption(data.categories?.length ? data.categories : categoryOptions.value)
    brandOptions.value = stripAllOption(data.brands?.length ? data.brands : brandOptions.value)
  } catch {
    // Chi dung mock khi chua load duoc API lan dau — tranh ghi de list that bang mock sau khi Luu.
    if (!listReady.value) {
      productRows.value = [...mockRows]
      productStats.value = { ...mockStats }
      categoryOptions.value = stripAllOption(mockCategories)
      brandOptions.value = stripAllOption(mockBrands)
    }
  } finally {
    listReady.value = true
  }
}

function handleProductSaved(updated) {
  if (updated?.id) {
    const idx = productRows.value.findIndex((p) => p.id === updated.id)
    if (idx >= 0) {
      const current = productRows.value[idx]
      const prices = updated.prices ?? {}
      productRows.value[idx] = {
        ...current,
        name: updated.name ?? current.name,
        brand: updated.brand ?? current.brand,
        modelCode: updated.modelCode ?? current.modelCode,
        status: updated.isActive === false ? 'Tạm ẩn' : current.status,
        retailPrice: prices.retail != null ? Number(prices.retail) : current.retailPrice,
        wholesalePrice: prices.wholesale != null ? Number(prices.wholesale) : current.wholesalePrice,
        importPrice: prices.import != null ? Number(prices.import) : current.importPrice,
      }
    }
  }
  refreshProducts()
}

function exportProducts() {
  downloadCsv('san-pham.csv', filteredProducts.value, [
    { label: 'Tên', value: (r) => r.name },
    { label: 'Danh mục', value: (r) => r.category },
    { label: 'Hãng', value: (r) => r.brand },
    { label: 'Tồn', value: (r) => r.stock },
    { label: 'Giá bán', value: (r) => r.retailPrice },
    { label: 'Trạng thái', value: (r) => r.status },
  ])
}

async function handleDelete(product) {
  if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return
  deletingId.value = product.id
  try {
    await deleteProduct(product.id)
    productRows.value = productRows.value.filter((p) => p.id !== product.id)
  } catch {
    alert('Không thể xóa sản phẩm.')
  } finally {
    deletingId.value = null
  }
}

function stripAllOption(list = []) {
  return list.filter((item) => item !== 'Tất cả' && item !== FILTER_ALL)
}

onMounted(async () => {
  await refreshProducts()
  if (route.query.edit) {
    editingProductId.value = Number(route.query.edit) || route.query.edit
  }
})

watch(
  () => route.query.edit,
  (editId) => {
    editingProductId.value = editId ? Number(editId) || editId : null
  },
)

const lastUpdated = computed(() => productRows.value[0]?.updatedAt ?? '—')

const hasActiveFilters = computed(
  () =>
    keyword.value.trim() !== '' ||
    selectedCategory.value !== FILTER_ALL ||
    selectedBrand.value !== FILTER_ALL,
)

const filteredProducts = computed(() => {
  return productRows.value.filter((item) => {
    const q = keyword.value.toLowerCase()
    const matchesKeyword =
      !keyword.value ||
      item.name?.toLowerCase().includes(q) ||
      (item.modelCode ?? '').toLowerCase().includes(q)

    const matchesCategory =
      selectedCategory.value === FILTER_ALL || item.category === selectedCategory.value
    const matchesBrand = selectedBrand.value === FILTER_ALL || item.brand === selectedBrand.value

    return matchesKeyword && matchesCategory && matchesBrand
  })
})

function statusClass(status) {
  const map = {
    'Đang bán': 'bg-emerald-50 text-emerald-600',
    'Sắp hết': 'bg-amber-50 text-amber-600',
    'Hết hàng': 'bg-slate-100 text-slate-500',
    'Tạm ẩn': 'bg-slate-100 text-slate-500',
  }
  return map[status] ?? 'bg-slate-100 text-slate-500'
}

function productMetaLine(product) {
  return [product.brand, product.modelCode].filter(Boolean).join(' · ') || '—'
}

function displayPrice(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return locale.t('products.priceUnset')
  }
  return formatCurrency(amount)
}

function stockClass(stock) {
  if (stock <= 0) return 'bg-slate-100 text-slate-500'
  if (stock <= 3) return 'bg-amber-50 text-amber-600'
  return 'bg-emerald-50 text-emerald-600'
}

const statCards = computed(() => [
  {
    label: locale.t('products.stats.total'),
    value: productStats.value.totalProducts,
    hint: locale.t('products.stats.totalHint'),
    icon: 'products',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: locale.t('products.stats.variants'),
    value: productStats.value.totalVariants,
    hint: locale.t('products.stats.variantsHint'),
    icon: 'variants',
    iconColor: 'text-violet-600 bg-violet-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: locale.t('products.stats.lowStock'),
    value: productStats.value.lowStock,
    hint: locale.t('products.stats.lowStockHint'),
    icon: 'lowStock',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
  },
  {
    label: locale.t('products.stats.draft'),
    value: productStats.value.draftProducts,
    hint: locale.t('products.stats.draftHint'),
    icon: 'draft',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-red-600',
  },
])
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('products.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('products.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('products.hero.desc') }}
          </p>
        </div>
        <RouterLink
          to="/inventory/imports/create"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          + Nhập kho mới
        </RouterLink>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AppStatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :hint="card.hint"
        :icon="card.icon"
        :icon-color="card.iconColor"
        :value-class="card.valueClass"
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="rounded-[24px] border border-red-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div class="grid flex-1 gap-4 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.search') }}</label>
            <input
              v-model="keyword"
              type="text"
              :placeholder="locale.t('products.searchPlaceholder')"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.category') }}</label>
            <select
              v-model="selectedCategory"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option :value="FILTER_ALL">{{ locale.t('common.all') }}</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">
                {{ locale.translateCategory(category) }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.brand') }}</label>
            <select
              v-model="selectedBrand"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option :value="FILTER_ALL">{{ locale.t('common.all') }}</option>
              <option v-for="brand in brandOptions" :key="brand" :value="brand">
                {{ brand }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <RouterLink
            to="/products/categories"
            class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50"
          >
            Danh mục
          </RouterLink>
          <button
            type="button"
            class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50"
            @click="exportProducts"
          >
            {{ locale.t('common.exportExcel') }}
          </button>
          <RouterLink
            to="/inventory/imports/create"
            class="rounded-[14px] bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            + Nhập kho mới
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex items-center justify-between border-b border-red-100 px-6 py-4">
        <div>
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('products.listTitle') }}</h3>
          <p class="text-sm text-slate-500">
            <template v-if="hasActiveFilters">
              {{ filteredProducts.length }} / {{ productStats.totalProducts }} {{ locale.t('products.listFiltered') }}
            </template>
            <template v-else>
              {{ locale.t('products.listCount', { count: filteredProducts.length }) }}
            </template>
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <AppInlineLoader v-if="!listReady" block size="md" class="min-h-[280px]" />

        <table v-else class="w-full min-w-[1280px] text-sm">
          <thead>
            <tr class="bg-red-50/60 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th class="px-6 py-4">{{ locale.t('products.col.product') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.category') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.variants') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.condition') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.stock') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.retail') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.wholesale') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.import') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.updated') }}</th>
              <th class="px-6 py-4">{{ locale.t('products.col.status') }}</th>
              <th class="px-6 py-4 text-right">{{ locale.t('products.col.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="cursor-pointer border-t border-red-100 transition hover:bg-red-50/40"
              @click="openEdit(product)"
            >
              <td class="px-6 py-4">
                <div class="flex min-w-[260px] items-start gap-3">
                  <AppProductThumb
                    :src="product.image"
                    :name="product.name"
                    :category-slug="product.categorySlug"
                    size="md"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-[#111118] transition hover:text-red-600">
                      {{ product.name }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">{{ productMetaLine(product) }}</p>
                    <p v-if="product.sku" class="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      SKU: {{ product.sku }}
                    </p>
                    <p v-if="product.description" class="mt-1 line-clamp-2 text-xs text-slate-400">
                      {{ product.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ locale.translateCategory(product.category) }}</td>
              <td class="max-w-[180px] px-6 py-4">
                <p class="font-medium text-slate-700">{{ product.variantLabel || '—' }}</p>
                <p v-if="product.variants > 1" class="mt-0.5 text-xs text-slate-400">
                  +{{ product.variants - 1 }} biến thể khác
                </p>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ product.conditionLabel || '—' }}</td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="stockClass(product.stock)"
                >
                  {{ product.stock }} {{ locale.t('common.units') }}
                </span>
              </td>
              <td class="px-6 py-4 font-bold" :class="Number(product.retailPrice) > 0 ? 'text-red-600' : 'text-slate-400'">
                {{ displayPrice(product.retailPrice) }}
              </td>
              <td class="px-6 py-4 text-slate-700">{{ displayPrice(product.wholesalePrice) }}</td>
              <td class="px-6 py-4 text-slate-700">{{ displayPrice(product.importPrice) }}</td>
              <td class="px-6 py-4 text-slate-500">{{ product.updatedAt || '—' }}</td>
              <td class="px-6 py-4">
                <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="statusClass(product.status)">
                  {{ locale.translateProductStatus(product.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex gap-2">
                  <button
                    type="button"
                    class="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-bold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
                    @click.stop="openEdit(product)"
                  >
                    {{ locale.t('common.edit') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-[12px] bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    :disabled="deletingId === product.id"
                    @click.stop="handleDelete(product)"
                  >
                    {{ deletingId === product.id ? '...' : 'Xóa' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="listReady && filteredProducts.length === 0"
        icon="box"
        :title="hasActiveFilters ? locale.t('products.emptyFilter') : locale.t('products.empty')"
      />
    </div>

    <AppSlideOver :open="!!editingProductId" @close="closeEdit">
      <ProductForm
        v-if="editingProductId"
        :key="editingProductId"
        mode="panel"
        :product-id="editingProductId"
        @close="closeEdit"
        @saved="handleProductSaved"
      />
    </AppSlideOver>
  </div>
</template>

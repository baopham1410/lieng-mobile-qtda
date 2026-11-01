<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppProductThumb from '@/components/common/AppProductThumb.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api/categories'
import { fetchProducts } from '@/api/products'
import { useLocaleStore } from '@/stores/locale'
import {
  CATEGORY_ICON_PRESETS,
  DEFAULT_CATEGORY_ICON,
  categoryDisplayGradient,
  categoryDisplayIcon,
} from '@/data/categoryIcons'
import { formatCurrency } from '@/utils/formatCurrency'
import { withApiFallback } from '@/utils/apiFallback'

const locale = useLocaleStore()
const route = useRoute()
const router = useRouter()
const rows = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const showModal = ref(false)
const editingId = ref(null)
const keyword = ref('')
const selectedCategory = ref(null)
const detailProducts = ref([])
const detailLoading = ref(false)
const form = ref({ name: '', icon: DEFAULT_CATEGORY_ICON })

const modalTitle = computed(() => (editingId.value ? 'Sửa danh mục' : 'Thêm danh mục'))

const stats = computed(() => {
  const list = rows.value
  const totalProducts = list.reduce((sum, row) => sum + (row.productCount ?? 0), 0)
  const activeCount = list.filter((row) => (row.productCount ?? 0) > 0).length
  const emptyCount = list.filter((row) => (row.productCount ?? 0) === 0).length

  return { total: list.length, activeCount, totalProducts, emptyCount }
})

const filteredRows = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return rows.value

  return rows.value.filter(
    (row) =>
      row.name?.toLowerCase().includes(q) ||
      row.slug?.toLowerCase().includes(q),
  )
})

const statCards = computed(() => [
  {
    label: locale.t('categories.stats.total'),
    hint: locale.t('categories.stats.totalHint'),
    icon: 'variants',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
    value: stats.value.total,
  },
  {
    label: locale.t('categories.stats.active'),
    hint: locale.t('categories.stats.activeHint'),
    icon: 'products',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
    value: stats.value.activeCount,
  },
  {
    label: locale.t('categories.stats.products'),
    hint: locale.t('categories.stats.productsHint'),
    icon: 'stock',
    iconColor: 'text-violet-600 bg-violet-50',
    valueClass: 'text-[#111118]',
    value: stats.value.totalProducts,
  },
  {
    label: locale.t('categories.stats.empty'),
    hint: locale.t('categories.stats.emptyHint'),
    icon: 'draft',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
    value: stats.value.emptyCount,
  },
])

function productCountLabel(count) {
  if (count > 0) {
    return locale.t('categories.productCount', { count })
  }
  return locale.t('categories.noProducts')
}

function productCountClass(count) {
  if (count <= 0) return 'bg-slate-100 text-slate-500 ring-slate-200'
  if (count <= 3) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', icon: DEFAULT_CATEGORY_ICON }
  error.value = ''
  showModal.value = true
}

async function openDetail(row) {
  selectedCategory.value = row
  router.replace({ query: { ...route.query, category: String(row.id) } })
  detailLoading.value = true
  detailProducts.value = []
  try {
    const data = await withApiFallback(
      () => fetchProducts({ category_id: row.id, per_page: 20 }),
      () => ({ rows: [] }),
    )
    detailProducts.value = data.rows ?? []
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  selectedCategory.value = null
  detailProducts.value = []
  const { category, ...rest } = route.query
  router.replace({ query: rest })
}

function openEdit(row) {
  editingId.value = row.id
  form.value = { name: row.name, icon: row.icon || DEFAULT_CATEGORY_ICON }
  error.value = ''
  showModal.value = true
}

function openEditSelected() {
  if (selectedCategory.value) openEdit(selectedCategory.value)
}

async function handleDeleteSelected() {
  if (!selectedCategory.value) return
  await handleDelete(selectedCategory.value)
  closeDetail()
}

function closeModal() {
  showModal.value = false
  error.value = ''
}

function selectIcon(icon) {
  form.value.icon = icon
}

async function loadRows() {
  loading.value = true
  try {
    rows.value = await withApiFallback(fetchCategories, () => [])
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const name = form.value.name.trim()
  if (!name) {
    error.value = 'Vui lòng nhập tên danh mục.'
    return
  }

  saving.value = true
  error.value = ''
  const payload = { name, icon: form.value.icon?.trim() || null }
  try {
    if (editingId.value) {
      const updated = await updateCategory(editingId.value, payload)
      rows.value = rows.value.map((row) => (row.id === editingId.value ? { ...row, ...updated } : row))
      if (selectedCategory.value?.id === editingId.value) {
        selectedCategory.value = { ...selectedCategory.value, ...updated }
      }
    } else {
      const created = await createCategory(payload)
      rows.value = [...rows.value, created].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    }
    closeModal()
  } catch (err) {
    error.value = err?.response?.data?.message ?? 'Không lưu được danh mục.'
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  if (!confirm(`Xóa danh mục "${row.name}"?`)) return
  try {
    await deleteCategory(row.id)
    rows.value = rows.value.filter((item) => item.id !== row.id)
  } catch (err) {
    alert(err?.response?.data?.message ?? 'Không thể xóa danh mục.')
  }
}

onMounted(async () => {
  await loadRows()
  const categoryId = route.query.category
  if (categoryId) {
    const row = rows.value.find((item) => String(item.id) === String(categoryId))
    if (row) await openDetail(row)
  }
})

watch(
  () => route.query.category,
  (categoryId) => {
    if (!categoryId) {
      selectedCategory.value = null
      detailProducts.value = []
      return
    }
    if (String(selectedCategory.value?.id) === String(categoryId)) return
    const row = rows.value.find((item) => String(item.id) === String(categoryId))
    if (row) openDetail(row)
  },
)
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('page.categories.subtitle') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('page.categories.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            Icon danh mục hiển thị khi chọn hàng trên POS — giúp nhân viên bán nhanh và trực quan hơn.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            to="/products"
            class="rounded-[16px] bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25"
          >
            ← Sản phẩm
          </RouterLink>
          <button
            type="button"
            class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
            @click="openCreate"
          >
            + Thêm danh mục
          </button>
        </div>
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

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex flex-col gap-4 border-b border-red-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('categories.listTitle') }}</h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ locale.t('categories.listCount', { count: rows.length }) }}
          </p>
        </div>
        <div class="w-full max-w-md">
          <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            {{ locale.t('common.search') }}
          </label>
          <input
            v-model="keyword"
            type="text"
            :placeholder="locale.t('categories.searchPlaceholder')"
            class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
          />
        </div>
      </div>

      <AppInlineLoader v-if="loading" block size="md" class="min-h-[240px]" />

      <AppEmptyState
        v-else-if="rows.length === 0"
        icon="folder"
        :title="locale.t('categories.empty')"
        :description="locale.t('categories.emptyHint')"
      />

      <AppEmptyState
        v-else-if="filteredRows.length === 0"
        icon="search"
        :title="locale.t('common.noResults')"
      />

      <div v-else class="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="row in filteredRows"
          :key="row.id"
          role="button"
          tabindex="0"
          class="group relative cursor-pointer overflow-hidden rounded-[20px] border border-red-100 bg-[#fffafa] p-5 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_8px_24px_rgb(220,38,38,0.08)]"
          @click="openDetail(row)"
          @keydown.enter.prevent="openDetail(row)"
        >
          <div
            class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-100/40 blur-2xl transition group-hover:bg-red-200/50"
            aria-hidden="true"
          />

          <div class="relative flex items-start justify-between gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br text-2xl shadow-sm ring-1 ring-white/60"
              :class="categoryDisplayGradient(row.slug)"
            >
              <span class="drop-shadow-sm">{{ categoryDisplayIcon(row) }}</span>
            </div>
            <span
              class="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1"
              :class="productCountClass(row.productCount ?? 0)"
            >
              {{ productCountLabel(row.productCount ?? 0) }}
            </span>
          </div>

          <div class="relative mt-4 min-w-0">
            <h4 class="truncate text-base font-black text-[#111118]">{{ row.name }}</h4>
            <p class="mt-1 truncate font-mono text-xs text-slate-400">{{ row.slug }}</p>
          </div>

          <div class="relative mt-4 flex items-center gap-2 border-t border-red-100/80 pt-4">
            <button
              type="button"
              class="flex-1 rounded-[12px] bg-red-50 px-3 py-2 text-xs font-bold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
              @click.stop="openEdit(row)"
            >
              {{ locale.t('common.edit') }}
            </button>
            <button
              type="button"
              class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-red-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="(row.productCount ?? 0) > 0"
              :title="(row.productCount ?? 0) > 0 ? locale.t('categories.deleteBlocked') : locale.t('common.delete')"
              @click.stop="handleDelete(row)"
            >
              Xóa
            </button>
          </div>

          <p class="relative mt-3 text-[10px] font-semibold uppercase tracking-widest text-red-400/80">
            {{ locale.t('categories.clickToView') }}
          </p>
        </article>
      </div>
    </div>

    <AppSlideOver :open="!!selectedCategory" @close="closeDetail">
      <template v-if="selectedCategory">
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br text-xl shadow-sm ring-1 ring-white/60"
                :class="categoryDisplayGradient(selectedCategory.slug)"
              >
                {{ categoryDisplayIcon(selectedCategory) }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {{ locale.t('categories.detail') }}
                </p>
                <h3 class="mt-1 truncate text-xl font-black text-[#111118]">{{ selectedCategory.name }}</h3>
              </div>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              @click="closeDetail"
            >
              {{ locale.t('common.close') }}
            </button>
          </div>
          <span
            class="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
            :class="productCountClass(selectedCategory.productCount ?? 0)"
          >
            {{ productCountLabel(selectedCategory.productCount ?? 0) }}
          </span>
        </div>

        <div class="space-y-6 p-6">
          <div class="rounded-[18px] bg-red-50/50 p-4 ring-1 ring-red-100">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
              {{ locale.t('categories.posTileHint') }}
            </p>
            <div class="mt-4 flex flex-col items-center rounded-[18px] border border-red-100 bg-[#fffafa] p-5">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-[16px] bg-gradient-to-br text-3xl shadow-sm ring-1 ring-white/60"
                :class="categoryDisplayGradient(selectedCategory.slug)"
              >
                {{ categoryDisplayIcon(selectedCategory) }}
              </div>
              <p class="mt-3 text-sm font-bold text-[#111118]">{{ selectedCategory.name }}</p>
              <p class="mt-0.5 text-xs text-slate-500">{{ productCountLabel(selectedCategory.productCount ?? 0) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-[16px] bg-red-50/40 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ locale.t('categories.slugLabel') }}</p>
              <p class="mt-1 truncate font-mono text-xs font-semibold text-slate-700">{{ selectedCategory.slug }}</p>
            </div>
            <div class="rounded-[16px] bg-red-50/40 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ locale.t('categories.iconLabel') }}</p>
              <p class="mt-1 text-2xl">{{ categoryDisplayIcon(selectedCategory) }}</p>
            </div>
          </div>

          <div>
            <div class="mb-3 flex items-center justify-between gap-2">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                {{ locale.t('categories.productsInCategory') }}
              </p>
              <RouterLink
                to="/products"
                class="text-xs font-bold text-red-600 hover:underline"
                @click="closeDetail"
              >
                {{ locale.t('categories.viewAllProducts') }}
              </RouterLink>
            </div>

            <AppInlineLoader v-if="detailLoading" block size="sm" />

            <AppEmptyState
              v-else-if="detailProducts.length === 0"
              size="sm"
              icon="box"
              :title="locale.t('categories.noProductsInCategory')"
            />

            <div v-else class="space-y-2">
              <RouterLink
                v-for="product in detailProducts"
                :key="product.id"
                :to="{ path: '/products', query: { edit: String(product.id) } }"
                class="flex items-center gap-3 rounded-[14px] border border-red-100 bg-white p-3 transition hover:border-red-200 hover:bg-red-50/40"
                @click="closeDetail"
              >
                <AppProductThumb
                  :src="product.image"
                  :name="product.name"
                  :category-slug="product.categorySlug"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-[#111118]">{{ product.name }}</p>
                  <p class="truncate text-xs text-slate-500">{{ product.brand }} · {{ product.variantLabel || '—' }}</p>
                </div>
                <p class="shrink-0 text-xs font-bold text-red-600">
                  {{ product.retailPrice > 0 ? formatCurrency(product.retailPrice) : locale.t('products.priceUnset') }}
                </p>
              </RouterLink>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-[14px] bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700"
              @click="openEditSelected"
            >
              {{ locale.t('common.edit') }}
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              :disabled="(selectedCategory.productCount ?? 0) > 0"
              @click="handleDeleteSelected"
            >
              Xóa
            </button>
          </div>
        </div>
      </template>
    </AppSlideOver>

    <AppModal :open="showModal" @close="closeModal">
      <div class="w-full max-w-md overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 bg-gradient-to-r from-red-50 to-[#fffafa] px-6 py-5">
          <h3 class="text-lg font-bold text-[#111118]">{{ modalTitle }}</h3>
          <p class="mt-1 text-sm text-slate-500">Icon sẽ hiển thị trên màn hình POS khi chọn danh mục.</p>
        </div>
        <form class="space-y-4 p-6" @submit.prevent="handleSave">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Icon danh mục</label>
            <div class="flex items-center gap-3">
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br text-2xl shadow-sm ring-1 ring-white/60"
                :class="categoryDisplayGradient('dien-thoai')"
              >
                {{ form.icon || DEFAULT_CATEGORY_ICON }}
              </span>
              <input
                v-model="form.icon"
                type="text"
                maxlength="4"
                placeholder="📦"
                class="min-w-0 flex-1 rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
              />
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <button
                v-for="icon in CATEGORY_ICON_PRESETS"
                :key="icon"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-[10px] text-lg transition ring-1"
                :class="form.icon === icon ? 'bg-red-600 text-white ring-red-600' : 'bg-white text-slate-700 ring-red-100 hover:bg-red-50'"
                @click="selectIcon(icon)"
              >
                {{ icon }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên danh mục</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Ví dụ: Máy lạnh, Loa bluetooth..."
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>

          <p v-if="error" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-red-100">
            {{ error }}
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50"
              @click="closeModal"
            >
              {{ locale.t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="rounded-[12px] bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? locale.t('common.updating') : locale.t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </AppModal>
  </div>
</template>

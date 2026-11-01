<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import { fetchQuanCosts, updateQuanProduct } from '@/api/quan'
import { formatCurrency, formatMoney } from '@/mocks/financeMock'

const loading = ref(false)
const savingId = ref(null)
const loadError = ref('')
const flash = ref('')
const period = ref('today')
const search = ref('')
const categoryFilter = ref('all')

const products = ref([])
const categories = ref([])
const summary = ref({
  revenue: 0,
  cogs: 0,
  grossProfit: 0,
  expense: 0,
  netProfit: 0,
  salesQty: 0,
  missingCostProducts: 0,
  missingCostSoldQty: 0,
})
const byProduct = ref([])
const draftCosts = ref({})

const periodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: 'Tháng này' },
]

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.value.filter((p) => {
    if (categoryFilter.value !== 'all' && p.category !== categoryFilter.value) return false
    if (!q) return true
    return String(p.name || '')
      .toLowerCase()
      .includes(q)
  })
})

const missingCount = computed(
  () => filteredProducts.value.filter((p) => !Number(draftCosts.value[p.id]) || Number(draftCosts.value[p.id]) <= 0).length,
)

function showFlash(message) {
  flash.value = message
  clearTimeout(showFlash._t)
  showFlash._t = setTimeout(() => {
    flash.value = ''
  }, 2600)
}

function syncDrafts(rows) {
  const next = { ...draftCosts.value }
  for (const p of rows) {
    next[p.id] = p.costPrice != null && p.costPrice !== '' ? Number(p.costPrice) : ''
  }
  draftCosts.value = next
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchQuanCosts({ period: period.value })
    products.value = data.products ?? []
    categories.value = data.categories ?? []
    summary.value = data.summary ?? summary.value
    byProduct.value = data.byProduct ?? []
    syncDrafts(products.value)
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không tải được dữ liệu giá nhập.'
    products.value = []
    byProduct.value = []
  } finally {
    loading.value = false
  }
}

async function saveCost(product) {
  const raw = draftCosts.value[product.id]
  const cost = raw === '' || raw == null ? null : Number(raw)
  if (cost != null && (!Number.isFinite(cost) || cost < 0)) {
    showFlash('Giá nhập không hợp lệ')
    return
  }

  savingId.value = product.id
  try {
    const { data } = await updateQuanProduct(product.id, { cost_price: cost })
    const updated = data?.data
    const idx = products.value.findIndex((p) => p.id === product.id)
    if (idx >= 0 && updated) {
      products.value[idx] = { ...products.value[idx], ...updated }
      draftCosts.value[product.id] = updated.costPrice != null ? Number(updated.costPrice) : ''
    }
    showFlash(`Đã lưu giá nhập: ${product.name}`)
    await load()
  } catch (err) {
    showFlash(err.response?.data?.message || 'Không lưu được giá nhập.')
  } finally {
    savingId.value = null
  }
}

function marginText(product) {
  const sell = Number(product.price) || 0
  const cost = Number(draftCosts.value[product.id]) || 0
  if (sell <= 0 || cost <= 0) return '—'
  const profit = sell - cost
  const pct = Math.round((profit / sell) * 100)
  return `${formatMoney(profit)} · ${pct}%`
}

onMounted(load)
watch(period, load)
</script>

<template>
  <div class="space-y-5">
    <AppContentBreadcrumb />

    <div
      v-if="flash"
      class="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
    >
      {{ flash }}
    </div>

    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700">Giá vốn</p>
        <h1 class="text-2xl font-black text-[#111118]">Giá nhập &amp; tiền lời</h1>
        <p class="mt-1 text-sm text-slate-500">
          Tự nhập giá nhập từng sản phẩm — hệ thống tổng hợp doanh thu, giá vốn và lời theo kỳ.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink
          :to="{ name: 'quan' }"
          class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-50"
        >
          Về quầy
        </RouterLink>
        <div class="flex rounded-[12px] bg-amber-50 p-1 ring-1 ring-amber-200">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            type="button"
            class="rounded-[10px] px-3 py-1.5 text-xs font-bold transition"
            :class="
              period === opt.value
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-slate-500 hover:text-amber-800'
            "
            :disabled="loading"
            @click="period = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AppStatCard label="Doanh thu bán" icon="income" icon-color="text-amber-700 bg-amber-50">
        {{ formatCurrency(summary.revenue) }}
      </AppStatCard>
      <AppStatCard label="Giá vốn (COGS)" icon="import" icon-color="text-slate-600 bg-slate-50">
        {{ formatCurrency(summary.cogs) }}
      </AppStatCard>
      <AppStatCard label="Lời gộp" icon="profit" icon-color="text-emerald-700 bg-emerald-50">
        {{ formatCurrency(summary.grossProfit) }}
      </AppStatCard>
      <AppStatCard
        label="Lời sau chi"
        icon="net"
        icon-color="text-red-700 bg-red-50"
        :hint="`Chi ${formatCurrency(summary.expense)}`"
      >
        {{ formatCurrency(summary.netProfit) }}
      </AppStatCard>
    </div>

    <p v-if="summary.missingCostProducts || summary.missingCostSoldQty" class="text-sm text-amber-800">
      Còn
      <strong>{{ summary.missingCostProducts }}</strong>
      sản phẩm chưa có giá nhập
      <span v-if="summary.missingCostSoldQty">
        · đã bán
        <strong>{{ summary.missingCostSoldQty }}</strong>
        đơn vị chưa tính đủ giá vốn
      </span>
      .
    </p>

    <div class="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section class="rounded-[20px] border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-black text-[#111118]">Nhập giá nhập</h2>
            <p class="text-xs text-slate-500">
              {{ filteredProducts.length }} sản phẩm · thiếu giá:
              <span class="font-bold text-amber-800">{{ missingCount }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input
              v-model="search"
              type="search"
              placeholder="Tìm sản phẩm…"
              class="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
            <select
              v-model="categoryFilter"
              class="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
            >
              <option value="all">Tất cả danh mục</option>
              <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="py-10">
          <AppInlineLoader />
        </div>
        <p v-else-if="loadError" class="mt-4 rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ loadError }}
        </p>
        <AppEmptyState
          v-else-if="filteredProducts.length === 0"
          title="Chưa có sản phẩm"
          description="Thêm sản phẩm ở quầy trước, rồi quay lại nhập giá nhập."
        />
        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="border-b border-amber-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th class="py-2 pr-3">Sản phẩm</th>
                <th class="py-2 pr-3">Giá bán</th>
                <th class="py-2 pr-3">Giá nhập</th>
                <th class="py-2 pr-3">Lời / SP</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in filteredProducts"
                :key="p.id"
                class="border-b border-slate-100 last:border-0"
              >
                <td class="py-3 pr-3">
                  <p class="font-bold text-[#111118]">{{ p.name }}</p>
                  <p class="text-xs text-slate-400">{{ p.categoryLabel }}</p>
                </td>
                <td class="py-3 pr-3 font-semibold tabular-nums text-slate-700">
                  {{ formatCurrency(p.price) }}
                </td>
                <td class="py-3 pr-3" style="min-width: 140px">
                  <AppMoneyInput
                    v-model="draftCosts[p.id]"
                    placeholder="0"
                    input-class="w-full rounded-[12px] border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </td>
                <td class="py-3 pr-3 text-xs font-semibold tabular-nums text-emerald-700">
                  {{ marginText(p) }}
                </td>
                <td class="py-3 text-right">
                  <button
                    type="button"
                    class="rounded-[10px] bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-60"
                    :disabled="savingId === p.id"
                    @click="saveCost(p)"
                  >
                    {{ savingId === p.id ? '…' : 'Lưu' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 class="text-lg font-black text-[#111118]">Lời theo mặt hàng (kỳ chọn)</h2>
        <p class="text-xs text-slate-500">Tính từ doanh thu bán − giá vốn × số lượng.</p>

        <div v-if="loading" class="py-10">
          <AppInlineLoader />
        </div>
        <AppEmptyState
          v-else-if="byProduct.length === 0"
          class="mt-4"
          title="Chưa có doanh thu kỳ này"
          description="Khi có bán hàng, bảng lời theo mặt hàng sẽ hiện ở đây."
        />
        <ul v-else class="mt-4 space-y-2">
          <li
            v-for="row in byProduct"
            :key="`${row.quanProductId || row.title}-${row.qty}`"
            class="rounded-[14px] border border-slate-100 bg-slate-50/80 px-3 py-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate font-bold text-[#111118]">{{ row.title }}</p>
                <p class="text-xs text-slate-500">
                  SL {{ row.qty }} · TB bán {{ formatCurrency(row.sellPriceAvg) }} · GV
                  {{ formatCurrency(row.costPrice) }}
                </p>
              </div>
              <p
                class="shrink-0 text-sm font-black tabular-nums"
                :class="row.profit >= 0 ? 'text-emerald-700' : 'text-red-600'"
              >
                {{ formatCurrency(row.profit) }}
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

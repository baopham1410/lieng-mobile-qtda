<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import RevenueTrendChart from '@/components/reports/RevenueTrendChart.vue'
import RevenueBarChart from '@/components/reports/RevenueBarChart.vue'
import RevenueDoughnutChart from '@/components/reports/RevenueDoughnutChart.vue'
import '@/components/reports/chartSetup'
import { fetchRevenueReport, fetchInventoryReport } from '@/api/reports'
import { downloadCsv } from '@/utils/exportCsv'
import { useLocaleStore } from '@/stores/locale'
import {
  formatCompact,
  formatCurrency,
  formatPercent,
} from '@/mocks/reportMock'

const selectedPeriod = ref('month')
const apiReport = ref(null)
const apiInventory = ref(null)
const loading = ref(false)
const loadError = ref('')
const locale = useLocaleStore()

const periodOptions = computed(() => [
  { v: 'week', l: locale.t('reports.period.week') },
  { v: 'month', l: locale.t('reports.period.month') },
  { v: 'quarter', l: locale.t('reports.period.quarter') },
])

const periodLabels = {
  week: '7 ngày qua',
  month: 'Tháng này',
  quarter: 'Quý này',
}

async function loadReports() {
  loading.value = true
  loadError.value = ''
  try {
    const [report, inventory] = await Promise.all([
      fetchRevenueReport({ period: selectedPeriod.value }),
      fetchInventoryReport(),
    ])
    apiReport.value = report
    apiInventory.value = inventory
  } catch (err) {
    apiReport.value = null
    loadError.value =
      err.response?.data?.message ||
      (err.response?.status === 403
        ? 'Bạn không có quyền xem báo cáo tài chính.'
        : 'Không tải được báo cáo. Kiểm tra backend đang chạy và đăng nhập lại.')
  } finally {
    loading.value = false
  }
}

onMounted(loadReports)
watch(selectedPeriod, loadReports)

const inventoryByCategory = computed(() => apiInventory.value?.byCategory ?? [])
const lowStockAlerts = computed(() => {
  const rows = apiInventory.value?.lowStock ?? []
  return rows.map((r) => ({
    name: r.product,
    variant: r.variant,
    stock: r.stock,
    threshold: 3,
  }))
})

const summary = computed(() => {
  const s = apiReport.value?.summary
  return {
    revenue: s?.revenue ?? 0,
    profit: s?.profit ?? 0,
    orders: s?.orders ?? 0,
    avgOrder: s?.avgOrder ?? 0,
    growth: s?.growth ?? 0,
    imeiInStock: s?.imeiInStock ?? apiInventory.value?.totalImei ?? 0,
    lowStock: s?.lowStock ?? lowStockAlerts.value.length,
  }
})

const chartData = computed(() => apiReport.value?.dailyRevenue ?? [])
const expenseBreakdown = computed(() => apiReport.value?.expenseBreakdown ?? [])
const incomeBreakdown = computed(() => apiReport.value?.incomeBreakdown ?? [])

const chartMax = computed(() => Math.max(...chartData.value.map((d) => d.revenue), 1))
const chartAverage = computed(() => {
  if (!chartData.value.length) return 0
  return Math.round(chartData.value.reduce((s, d) => s + d.revenue, 0) / chartData.value.length)
})
const chartOrderTotal = computed(() => chartData.value.reduce((s, d) => s + (d.orders ?? 0), 0))
const profitMargin = computed(() => {
  if (!summary.value.revenue) return 0
  return Math.round((summary.value.profit / summary.value.revenue) * 100)
})

const hasIncome = computed(() => incomeBreakdown.value.some((i) => Number(i.amount) > 0))
const hasExpense = computed(() => expenseBreakdown.value.some((i) => Number(i.amount) > 0))
const hasInventory = computed(() => inventoryByCategory.value.some((i) => Number(i.value) > 0))

const statCards = computed(() => [
  {
    label: 'Doanh thu',
    value: formatCurrency(summary.value.revenue),
    hint: `${formatPercent(summary.value.growth)} so kỳ trước`,
    hintClass: 'text-emerald-600 font-semibold',
    icon: 'revenue',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
    valueSize: 'md',
  },
  {
    label: 'Lợi nhuận gộp',
    value: formatCurrency(summary.value.profit),
    hint: `${profitMargin.value}% biên lợi nhuận`,
    icon: 'profit',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
    valueSize: 'md',
  },
  {
    label: 'Đơn hàng',
    value: summary.value.orders,
    hint: `TB ${formatCurrency(summary.value.avgOrder)}/đơn`,
    icon: 'orders',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: 'Tồn kho IMEI',
    value: summary.value.imeiInStock,
    hint: `${summary.value.lowStock} biến thể sắp hết`,
    hintClass: 'text-amber-600 font-semibold',
    icon: 'stock',
    iconColor: 'text-sky-600 bg-sky-50',
    valueClass: 'text-sky-600',
  },
])

function exportReport() {
  if (!apiReport.value) return
  downloadCsv(`bao-cao-${selectedPeriod.value}.csv`, chartData.value, [
    { label: 'Ngày', value: (r) => r.label },
    { label: 'Doanh thu', value: (r) => r.revenue },
    { label: 'Đơn hàng', value: (r) => r.orders ?? 0 },
    { label: 'Lợi nhuận ước tính', value: (r) => r.profit ?? 0 },
  ])
}
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div
      v-if="loadError"
      class="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100"
    >
      {{ loadError }}
    </div>

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('reports.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('reports.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('reports.hero.desc') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            :to="{ name: 'statements' }"
            class="rounded-[14px] bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/35 transition hover:bg-white/25"
          >
            Sao kê ngày
          </RouterLink>
          <button
            type="button"
            class="rounded-[14px] bg-white px-4 py-2.5 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
            :disabled="!chartData.length"
            @click="exportReport"
          >
            {{ locale.t('reports.exportExcel') }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex w-fit flex-wrap gap-2 rounded-[16px] bg-red-50/60 p-1.5 ring-1 ring-red-100">
      <button
        v-for="p in periodOptions"
        :key="p.v"
        type="button"
        class="rounded-[12px] px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
        :class="selectedPeriod === p.v ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-600'"
        :disabled="loading"
        @click="selectedPeriod = p.v"
      >
        {{ p.l }}
      </button>
    </div>

    <AppInlineLoader
      v-if="loading && !apiReport"
      block
      size="lg"
      message="Đang tải báo cáo..."
      class="rounded-[16px] bg-white ring-1 ring-red-100"
    />

    <template v-else-if="apiReport">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AppStatCard
          v-for="card in statCards"
          :key="card.label"
          :label="card.label"
          :hint="card.hint"
          :icon="card.icon"
          :icon-color="card.iconColor"
          :value-class="card.valueClass"
          :value-size="card.valueSize ?? 'lg'"
          :hint-class="card.hintClass ?? 'text-slate-500'"
        >
          {{ card.value }}
        </AppStatCard>
      </div>

      <!-- Line chart — xu hướng doanh thu & lợi nhuận -->
      <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-[#111118]">Xu hướng doanh thu</h3>
            <p class="text-sm text-slate-500">Biểu đồ đường — {{ periodLabels[selectedPeriod] }}</p>
          </div>
          <span class="rounded-full bg-gradient-to-r from-red-50 to-rose-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100">
            Line · Doanh thu & LN
          </span>
        </div>

        <div class="mt-6">
          <RevenueTrendChart v-if="chartData.length" :rows="chartData" />
          <AppEmptyState
            v-else
            size="sm"
            icon="chart"
            :title="locale.t('reports.noSalesInPeriod')"
          />
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_1fr]">
        <!-- Bar chart -->
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-[#111118]">Doanh thu & đơn hàng</h3>
              <p class="text-sm text-slate-500">Biểu đồ cột — {{ periodLabels[selectedPeriod] }}</p>
            </div>
            <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100">
              Bar · {{ chartData.length }} ngày
            </span>
          </div>

          <div class="mt-6">
            <RevenueBarChart v-if="chartData.length" :rows="chartData" />
            <AppEmptyState
              v-else
              size="sm"
              icon="chart"
              :title="locale.t('reports.noSalesInPeriod')"
            />
          </div>

          <div class="mt-6 grid grid-cols-3 gap-3 border-t border-red-100 pt-4 text-center text-sm">
            <div>
              <p class="text-xs text-slate-400">Cao nhất</p>
              <p class="font-bold text-red-600">{{ formatCompact(chartMax) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Trung bình/ngày</p>
              <p class="font-bold text-slate-700">{{ formatCompact(chartAverage) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Tổng đơn</p>
              <p class="font-bold text-slate-700">{{ chartOrderTotal }}</p>
            </div>
          </div>
        </div>

        <!-- Doughnut — cơ cấu thu -->
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">Cơ cấu doanh thu</h3>
          <p class="mt-1 text-sm text-slate-500">Biểu đồ doughnut — nguồn thu</p>

          <div class="mt-6">
            <RevenueDoughnutChart
              v-if="hasIncome"
              :items="incomeBreakdown"
              value-key="amount"
              label-key="name"
              center-label="Tổng thu"
              accent="emerald"
            />
            <AppEmptyState
              v-else
              size="sm"
              icon="chart"
              :title="locale.t('common.noData')"
            />
          </div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <!-- Doughnut — chi phí -->
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">Cơ cấu chi phí</h3>
          <p class="mt-1 text-sm text-slate-500">Biểu đồ doughnut — {{ periodLabels[selectedPeriod] }}</p>

          <div class="mt-6">
            <RevenueDoughnutChart
              v-if="hasExpense"
              :items="expenseBreakdown"
              value-key="amount"
              label-key="name"
              center-label="Tổng chi"
              accent="red"
            />
            <AppEmptyState
              v-else
              size="sm"
              icon="chart"
              :title="locale.t('reports.noExpenseInPeriod')"
            />
          </div>
        </div>

        <!-- Doughnut — tồn kho -->
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">Giá trị tồn kho</h3>
          <p class="mt-1 text-sm text-slate-500">Biểu đồ doughnut — theo danh mục</p>

          <div class="mt-6">
            <RevenueDoughnutChart
              v-if="hasInventory"
              :items="inventoryByCategory"
              value-key="value"
              label-key="category"
              center-label="Tổng tồn"
              accent="sky"
            />
            <AppEmptyState
              v-else
              size="sm"
              icon="box"
              :title="locale.t('reports.noInventory')"
            />
          </div>
        </div>
      </div>

      <div class="rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('reports.lowStockTitle') }}</h3>
          <p class="text-sm text-slate-500">Biến thể dưới ngưỡng tối thiểu</p>
        </div>
        <div v-if="lowStockAlerts.length" class="divide-y divide-red-100">
          <div
            v-for="item in lowStockAlerts"
            :key="`${item.name}-${item.variant}`"
            class="flex items-center justify-between gap-3 px-6 py-4"
          >
            <div class="min-w-0">
              <p class="font-semibold text-[#111118]">{{ item.name }}</p>
              <p class="text-xs text-slate-500">{{ item.variant }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-black" :class="item.stock === 0 ? 'text-red-600' : 'text-amber-600'">
                {{ item.stock }}
              </p>
              <p class="text-[10px] text-slate-400">ngưỡng {{ item.threshold }}</p>
            </div>
          </div>
        </div>
        <AppEmptyState
          v-else
          size="sm"
          icon="box"
          :title="locale.t('reports.noStockAlert')"
        />
        <div class="border-t border-red-100 px-6 py-4">
          <RouterLink
            :to="{ name: 'stock-import-create' }"
            class="block w-full rounded-[14px] bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {{ locale.t('reports.createImport') }}
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>

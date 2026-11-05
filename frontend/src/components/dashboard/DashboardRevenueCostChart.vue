<script setup>
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import '@/components/reports/chartSetup'
import { chartMoney } from '@/components/reports/chartSetup'
import { downloadCsv } from '@/utils/exportCsv'
import {
  revenueCostWeekly,
  revenueCostMonthly,
  revenueCostYearly,
} from '@/mocks/dashboardMock'

const props = defineProps({
  serverData: {
    type: Object,
    default: null,
  },
})

const currentPeriod = ref('week') // 'week' | 'month' | 'year'

const activeData = computed(() => {
  const source = props.serverData || {
    weekly: revenueCostWeekly,
    monthly: revenueCostMonthly,
    yearly: revenueCostYearly,
  }
  if (currentPeriod.value === 'month') return source.monthly || revenueCostMonthly
  if (currentPeriod.value === 'year') return source.yearly || revenueCostYearly
  return source.weekly || revenueCostWeekly
})

const summaryText = computed(() => {
  if (currentPeriod.value === 'month') return 'Doanh thu tháng'
  if (currentPeriod.value === 'year') return 'Doanh thu năm'
  return 'Doanh thu tuần'
})

const chartData = computed(() => ({
  labels: activeData.value.labels,
  datasets: [
    {
      label: 'Doanh thu',
      data: activeData.value.revenue,
      backgroundColor: '#dc2626',
      hoverBackgroundColor: '#b91c1c',
      borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      maxBarThickness: 24,
      barPercentage: 0.65,
      categoryPercentage: 0.6,
    },
    {
      label: 'Giá vốn',
      data: activeData.value.cost,
      backgroundColor: '#bfdbfe',
      hoverBackgroundColor: '#93c5fd',
      borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      maxBarThickness: 24,
      barPercentage: 0.65,
      categoryPercentage: 0.6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      padding: 12,
      cornerRadius: 10,
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${chartMoney(ctx.parsed.y)}`,
        afterBody: (items) => {
          if (items.length >= 2) {
            const rev = items[0].parsed.y || 0
            const cost = items[1].parsed.y || 0
            const profit = rev - cost
            const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0
            return `\nLợi nhuận gộp: ${chartMoney(profit)} (${margin}%)`
          }
          return ''
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: (ctx) => ({
          weight: ctx.tick.label === 'T7' ? 'bold' : '500',
          size: 12,
        }),
        color: (ctx) => (ctx.tick.label === 'T7' ? '#dc2626' : '#64748b'),
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#f8fafc',
        drawBorder: false,
      },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        callback: (value) => {
          if (value === 0) return '0 đ'
          if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`
          if (value >= 1000000) return `${Math.round(value / 1000000)} tr`
          return String(value)
        },
      },
    },
  },
}))

function handleExport() {
  const rows = activeData.value.labels.map((label, idx) => ({
    time: label,
    revenue: activeData.value.revenue[idx],
    cost: activeData.value.cost[idx],
    profit: activeData.value.revenue[idx] - activeData.value.cost[idx],
  }))
  downloadCsv(`doanh_thu_gia_von_${currentPeriod.value}.csv`, rows, [
    { label: 'Thời gian', value: (r) => r.time },
    { label: 'Doanh thu (VND)', value: (r) => r.revenue },
    { label: 'Giá vốn (VND)', value: (r) => r.cost },
    { label: 'Lợi nhuận gộp (VND)', value: (r) => r.profit },
  ])
}
</script>

<template>
  <div class="h-full rounded-[24px] border border-red-200/60 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
    <!-- Header with Filters & Export -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="text-base sm:text-lg font-bold text-[#111118]">
          Biểu đồ Doanh thu & Giá vốn
        </h3>
        <p class="mt-0.5 text-xs text-slate-400">
          Đối chiếu hiệu quả kinh doanh và biên lợi nhuận gộp
        </p>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1.5 rounded-full bg-slate-100/80 p-1">
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer"
          :class="currentPeriod === 'week' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' : 'text-slate-600 hover:text-slate-900'"
          @click="currentPeriod = 'week'"
        >
          7 ngày qua
        </button>
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer"
          :class="currentPeriod === 'month' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' : 'text-slate-600 hover:text-slate-900'"
          @click="currentPeriod = 'month'"
        >
          Tháng này
        </button>
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer"
          :class="currentPeriod === 'year' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' : 'text-slate-600 hover:text-slate-900'"
          @click="currentPeriod = 'year'"
        >
          Năm nay
        </button>
        <button
          type="button"
          class="ml-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 cursor-pointer"
          @click="handleExport"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Xuất
        </button>
      </div>
    </div>

    <!-- Highlight Metrics & Legend -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[18px] bg-[#f8fafc] p-4 ring-1 ring-slate-100">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm font-semibold text-slate-500">{{ summaryText }}:</span>
          <span class="text-base sm:text-lg font-black text-[#111118]">
            {{ chartMoney(activeData.summary.revenue) }}
          </span>
          <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200/60">
            +{{ activeData.summary.growth }}%
          </span>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Lợi nhuận gộp: <strong class="text-red-600">{{ chartMoney(activeData.summary.profit) }}</strong>
          <span class="text-slate-400"> (Biên {{ activeData.summary.margin }}%)</span>
        </p>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs font-semibold text-slate-600">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-xs bg-[#dc2626]"></span>
          <span>Doanh thu</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-xs bg-[#bfdbfe]"></span>
          <span>Giá vốn</span>
        </div>
      </div>
    </div>

    <!-- Chart Canvas -->
    <div class="mt-5 h-[230px] sm:h-[250px] w-full">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>


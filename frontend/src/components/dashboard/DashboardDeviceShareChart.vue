<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import '@/components/reports/chartSetup'
import { chartMoney } from '@/components/reports/chartSetup'
import { deviceShareData } from '@/mocks/dashboardMock'

const props = defineProps({
  serverData: {
    type: Object,
    default: null,
  },
})

const activeData = computed(() => props.serverData || deviceShareData)
const items = computed(() => activeData.value.items || [])
const totalSold = computed(() => activeData.value.totalSold ?? 0)

const chartData = computed(() => ({
  labels: items.value.map((i) => i.name),
  datasets: [
    {
      data: items.value.map((i) => i.value),
      backgroundColor: items.value.map((i) => i.color),
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '76%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      padding: 10,
      cornerRadius: 10,
      titleFont: { size: 12, weight: 'bold' },
      bodyFont: { size: 11 },
      callbacks: {
        label: (ctx) => {
          const item = items.value[ctx.dataIndex]
          return `${item.name}: ${chartMoney(item.value)} (${item.percent}%)`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="h-full rounded-[24px] border border-red-200/60 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base sm:text-lg font-bold text-[#111118]">
          Tỷ trọng thiết bị
        </h3>
        <p class="mt-0.5 text-xs text-slate-400">
          Doanh số theo thương hiệu
        </p>
      </div>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        title="Tùy chọn"
      >
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    </div>

    <!-- Doughnut with Center Metric -->
    <div class="relative my-3 flex h-[190px] items-center justify-center">
      <Doughnut :data="chartData" :options="chartOptions" />
      <!-- Center Text -->
      <div class="pointer-events-none absolute flex flex-col items-center justify-center text-center">
        <span class="text-3xl font-black tracking-tight text-slate-900 leading-none">
          {{ totalSold }}
        </span>
        <span class="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          MÁY ĐÃ BÁN
        </span>
      </div>
    </div>

    <!-- Legend List -->
    <div class="space-y-1.5 border-t border-slate-100 pt-3">
      <div
        v-for="item in items"
        :key="item.name"
        class="flex items-center justify-between text-xs py-1 transition hover:bg-slate-50/60 rounded-lg px-1.5"
      >
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full shrink-0" :style="{ backgroundColor: item.color }"></span>
          <span class="font-medium text-slate-700">{{ item.name }}</span>
        </div>
        <div class="flex items-center gap-4 text-right">
          <span class="font-semibold text-slate-500">{{ item.amountText }}</span>
          <span class="w-8 font-bold text-slate-900">{{ item.percent }}%</span>
        </div>
      </div>
      <div v-if="items.length === 0" class="py-4 text-center text-xs text-slate-400">
        Chưa có thiết bị bán ra
      </div>
    </div>
  </div>
</template>


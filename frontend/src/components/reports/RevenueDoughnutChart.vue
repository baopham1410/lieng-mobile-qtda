<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { PIE_COLORS, chartCompact, chartMoney } from './chartSetup'

const props = defineProps({
  items: { type: Array, default: () => [] },
  /** Field số tiền: amount | value */
  valueKey: { type: String, default: 'amount' },
  /** Field tên: name | category */
  labelKey: { type: String, default: 'name' },
  centerLabel: { type: String, default: 'Tổng' },
  accent: { type: String, default: 'red' },
})

const slices = computed(() =>
  props.items
    .map((item, index) => ({
      label: item[props.labelKey] ?? item.name ?? item.category ?? `Mục ${index + 1}`,
      value: Number(item[props.valueKey] ?? item.amount ?? item.value) || 0,
      color: PIE_COLORS[index % PIE_COLORS.length],
      meta: item,
    }))
    .filter((s) => s.value > 0),
)

const total = computed(() => slices.value.reduce((s, i) => s + i.value, 0))

const chartData = computed(() => ({
  labels: slices.value.map((s) => s.label),
  datasets: [
    {
      data: slices.value.map((s) => s.value),
      backgroundColor: slices.value.map((s) => s.color),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const v = ctx.parsed
          const pct = total.value ? Math.round((v / total.value) * 100) : 0
          return `${ctx.label}: ${chartMoney(v)} (${pct}%)`
        },
      },
    },
  },
}))

const centerClass = computed(() =>
  props.accent === 'emerald'
    ? 'text-emerald-600'
    : props.accent === 'sky'
      ? 'text-sky-700'
      : 'text-red-600',
)
</script>

<template>
  <div v-if="slices.length" class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
    <div class="relative h-44 w-44 shrink-0">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ centerLabel }}</p>
        <p class="text-sm font-black" :class="centerClass">{{ chartCompact(total) }}</p>
      </div>
    </div>
    <div class="w-full flex-1 space-y-2.5">
      <div
        v-for="item in slices"
        :key="item.label"
        class="flex items-center gap-3 rounded-[14px] bg-red-50/40 px-3 py-2.5 ring-1 ring-red-100"
      >
        <span class="h-3 w-3 shrink-0 rounded-full" :style="{ background: item.color }" />
        <div class="min-w-0 flex-1">
          <div class="flex justify-between gap-2 text-sm">
            <span class="truncate font-medium text-slate-700">{{ item.label }}</span>
            <span class="shrink-0 font-bold text-slate-600">
              {{ total ? Math.round((item.value / total) * 100) : 0 }}%
            </span>
          </div>
          <p class="text-xs text-slate-400">{{ chartMoney(item.value) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

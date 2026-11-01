<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { chartCompact, chartMoney } from './chartSetup'

const props = defineProps({
  rows: { type: Array, default: () => [] },
})

const chartData = computed(() => ({
  labels: props.rows.map((r) => r.label),
  datasets: [
    {
      label: 'Doanh thu',
      data: props.rows.map((r) => Number(r.revenue) || 0),
      borderColor: '#dc2626',
      backgroundColor: (ctx) => {
        const { chart } = ctx
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(220, 38, 38, 0.15)'
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        g.addColorStop(0, 'rgba(220, 38, 38, 0.35)')
        g.addColorStop(1, 'rgba(220, 38, 38, 0.02)')
        return g
      },
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#dc2626',
      borderWidth: 2.5,
    },
    {
      label: 'Lợi nhuận',
      data: props.rows.map((r) => Number(r.profit) || 0),
      borderColor: '#059669',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 4,
      pointBackgroundColor: '#059669',
      borderWidth: 2,
      borderDash: [5, 4],
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${chartMoney(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#64748b' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(248, 113, 113, 0.12)' },
      ticks: {
        font: { size: 11 },
        color: '#64748b',
        callback: (v) => chartCompact(v),
      },
    },
  },
}))
</script>

<template>
  <div class="relative h-[280px] w-full sm:h-[320px]">
    <Line v-if="rows.length" :data="chartData" :options="chartOptions" />
  </div>
</template>

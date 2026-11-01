<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
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
      backgroundColor: 'rgba(220, 38, 38, 0.85)',
      hoverBackgroundColor: '#b91c1c',
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 42,
    },
    {
      label: 'Đơn hàng',
      data: props.rows.map((r) => Number(r.orders) || 0),
      backgroundColor: 'rgba(245, 158, 11, 0.75)',
      hoverBackgroundColor: '#d97706',
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 42,
      yAxisID: 'y1',
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
      labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          if (ctx.dataset.yAxisID === 'y1') return `${ctx.dataset.label}: ${ctx.parsed.y} đơn`
          return `${ctx.dataset.label}: ${chartMoney(ctx.parsed.y)}`
        },
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
      position: 'left',
      grid: { color: 'rgba(248, 113, 113, 0.12)' },
      ticks: {
        font: { size: 11 },
        color: '#64748b',
        callback: (v) => chartCompact(v),
      },
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      ticks: { font: { size: 11 }, color: '#d97706', stepSize: 1 },
    },
  },
}))
</script>

<template>
  <div class="relative h-[280px] w-full sm:h-[300px]">
    <Bar v-if="rows.length" :data="chartData" :options="chartOptions" />
  </div>
</template>

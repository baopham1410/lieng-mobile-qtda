<script setup>
import { computed, ref } from 'vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import { useLocaleStore } from '@/stores/locale'
import { formatCurrency, formatCompact } from '@/mocks/reportMock'
import { buildAreaChart, buildGridLines, fillDailySeries } from '@/utils/reportCharts'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  period: { type: String, default: 'month' },
  periodLabel: { type: String, default: '' },
})

const locale = useLocaleStore()

const W = 640
const H = 280
const PAD_X = 52
const PAD_Y = 32
const PAD_R = 28

const paddedRows = computed(() => fillDailySeries(props.rows, props.period))
const hasRevenue = computed(() => paddedRows.value.some((r) => Number(r.revenue) > 0))

const area = computed(() =>
  buildAreaChart(
    paddedRows.value.map((r) => r.revenue),
    { width: W, height: H, paddingX: PAD_X, paddingY: PAD_Y, paddingRight: PAD_R },
  ),
)

const grid = computed(() => buildGridLines(5, W, H, PAD_X, PAD_Y, PAD_R))

const hoverIdx = ref(null)
const activeRow = computed(() => (hoverIdx.value === null ? null : paddedRows.value[hoverIdx.value]))
const activeDot = computed(() => (hoverIdx.value === null ? null : area.value.dots[hoverIdx.value]))

function showDot(index) {
  return Number(paddedRows.value[index]?.revenue) > 0
}
</script>

<template>
  <div v-if="hasRevenue" class="space-y-4">
    <div class="relative overflow-hidden rounded-[22px] border border-red-100 bg-gradient-to-br from-[#fff5f5] via-white to-[#fff7f7] p-4 shadow-inner shadow-red-100/40 sm:p-6">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="block h-[260px] w-full sm:h-[280px]"
        role="img"
        aria-label="Biểu đồ miền doanh thu"
        @mouseleave="hoverIdx = null"
      >
        <defs>
          <linearGradient id="reportAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.55" />
            <stop offset="45%" stop-color="#f87171" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="reportAreaLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#991b1b" />
            <stop offset="100%" stop-color="#fb7185" />
          </linearGradient>
          <filter id="reportDotGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#dc2626" flood-opacity="0.35" />
          </filter>
        </defs>

        <rect :x="PAD_X" :y="PAD_Y" :width="W - PAD_X - PAD_R" :height="H - PAD_Y * 2" fill="#fef2f2" fill-opacity="0.35" rx="12" />

        <line
          v-for="(g, i) in grid"
          :key="`g-${i}`"
          :x1="g.x1"
          :y1="g.y"
          :x2="g.x2"
          :y2="g.y"
          stroke="#fecaca"
          stroke-width="1"
        />

        <text
          v-for="(tick, i) in area.yTicks"
          :key="`y-${i}`"
          :x="PAD_X - 8"
          :y="tick.y + 4"
          fill="#94a3b8"
          text-anchor="end"
          style="font-size: 11px; font-weight: 600"
        >
          {{ tick.label }}
        </text>

        <line
          :x1="PAD_X"
          :y1="area.baseline"
          :x2="W - PAD_R"
          :y2="area.baseline"
          stroke="#fca5a5"
          stroke-width="1.5"
        />

        <path :d="area.area" fill="url(#reportAreaFill)" />
        <path
          :d="area.line"
          fill="none"
          stroke="url(#reportAreaLine)"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <line
          v-if="activeDot"
          :x1="activeDot.x"
          :y1="PAD_Y"
          :x2="activeDot.x"
          :y2="area.baseline"
          stroke="#dc2626"
          stroke-width="1.5"
          stroke-dasharray="5 4"
          opacity="0.5"
        />

        <g v-for="(dot, i) in area.dots" :key="`dot-${i}`">
          <circle
            :cx="dot.x"
            :cy="dot.y"
            r="16"
            fill="transparent"
            class="cursor-pointer"
            @mouseenter="hoverIdx = i"
          />
          <template v-if="showDot(i)">
            <circle
              v-if="hoverIdx === i"
              :cx="dot.x"
              :cy="dot.y"
              r="10"
              fill="#ef4444"
              fill-opacity="0.18"
            />
            <circle
              :cx="dot.x"
              :cy="dot.y"
              :r="hoverIdx === i ? 6.5 : 4.5"
              fill="#ffffff"
              stroke="#dc2626"
              :stroke-width="hoverIdx === i ? 3 : 2.5"
              :filter="hoverIdx === i ? 'url(#reportDotGlow)' : undefined"
            />
          </template>
        </g>

        <text
          v-for="lbl in area.xLabels"
          :key="`x-${lbl.index}`"
          :x="lbl.x"
          :y="H - 8"
          fill="#64748b"
          text-anchor="middle"
          style="font-size: 10px; font-weight: 600"
        >
          {{ paddedRows[lbl.index]?.label }}
        </text>
      </svg>
    </div>

    <div
      v-if="activeRow && Number(activeRow.revenue) > 0"
      class="mx-auto flex max-w-lg items-center justify-between gap-4 rounded-[18px] border border-red-200 bg-white px-5 py-4 shadow-[0_8px_30px_rgb(220,38,38,0.08)]"
    >
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-red-500">
          {{ activeRow.label }} · {{ activeRow.day }}
        </p>
        <p class="mt-1 text-2xl font-black text-[#111118]">{{ formatCurrency(activeRow.revenue) }}</p>
      </div>
      <div class="rounded-[14px] bg-red-50 px-4 py-2 text-center ring-1 ring-red-100">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đơn</p>
        <p class="text-xl font-black text-red-600">{{ activeRow.orders ?? 0 }}</p>
      </div>
    </div>
    <p v-else class="text-center text-xs text-slate-400">Di chuột lên biểu đồ để xem doanh thu từng ngày</p>

    <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
      <span class="inline-flex items-center gap-2">
        <span class="h-3 w-8 rounded-full bg-gradient-to-r from-red-600 to-rose-300" />
        Doanh thu
      </span>
      <span>Cao nhất: <strong class="text-red-600">{{ formatCompact(area.max) }}</strong></span>
      <span>{{ paddedRows.filter((r) => Number(r.revenue) > 0).length }} ngày có doanh thu</span>
    </div>
  </div>
  <AppEmptyState
    v-else
    size="sm"
    icon="chart"
    :title="locale.t('reports.noSalesInPeriod')"
  />
</template>

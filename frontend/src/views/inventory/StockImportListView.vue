<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import { formatCurrency, fetchStockImportPage } from '@/api/stockImports'
import { silentRequest } from '@/api/client'
import { withApiFallbackEager } from '@/utils/apiFallback'
import { useLocaleStore } from '@/stores/locale'
import * as stockRepo from '@/repositories/stockImportRepository'

const locale = useLocaleStore()
const router = useRouter()

const imports = ref([])
const stats = ref({
  draftImports: 0,
  waitingConfirm: 0,
  imeiPending: 0,
  totalAmountToday: 0,
})
const loading = ref(false)
const refreshing = ref(false)
const loadError = ref('')

function applyPage(page) {
  imports.value = Array.isArray(page?.imports) ? page.imports : []
  stats.value = page?.stats ?? stockRepo.getStockImportStats()
}

async function loadData() {
  loadError.value = ''
  refreshing.value = true
  try {
    const page = await fetchStockImportPage()
    applyPage(page)
  } catch {
    loadError.value = locale.t('imports.loadError')
  } finally {
    refreshing.value = false
  }
}

function openImport(entry) {
  router.push({ name: 'stock-import-detail', params: { code: entry.code } })
}

function formatImportDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function importItemsSummary(entry) {
  const items = entry.items ?? []
  if (items.length === 0) return '—'
  const first = items[0]
  const label = [first.name, first.variant].filter(Boolean).join(' · ')
  return items.length === 1 ? label : `${label} +${items.length - 1}`
}

function importStatusClass(status) {
  return status === 'confirmed'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : 'bg-amber-50 text-amber-700 ring-amber-200'
}

function imeiProgressClass(entry) {
  if (entry.status === 'confirmed') return 'text-emerald-600'
  if (!entry.totalQuantity) return 'text-slate-400'
  const ratio = entry.importedQuantity / entry.totalQuantity
  if (ratio >= 1) return 'text-emerald-600'
  if (ratio > 0) return 'text-amber-600'
  return 'text-red-500'
}

function imeiProgressLabel(entry) {
  return locale.t('imports.imeiOf', {
    imported: entry.importedQuantity ?? 0,
    total: entry.totalQuantity ?? 0,
  })
}

onMounted(() => {
  const initial = withApiFallbackEager(
    () => fetchStockImportPage(silentRequest),
    () => ({
      imports: stockRepo.listStockImports(),
      stats: stockRepo.getStockImportStats(),
    }),
    applyPage,
  )
  applyPage(initial)
})

const statCards = computed(() => [
  {
    label: locale.t('imports.stats.draft'),
    value: stats.value.draftImports,
    hint: locale.t('imports.stats.draftHint'),
    icon: 'draft',
    iconColor: 'text-slate-600 bg-slate-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: locale.t('imports.stats.waiting'),
    value: stats.value.waitingConfirm,
    hint: locale.t('imports.stats.waitingHint'),
    icon: 'waiting',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
  },
  {
    label: locale.t('imports.stats.imeiPending'),
    value: stats.value.imeiPending,
    hint: locale.t('imports.stats.imeiHint'),
    icon: 'imei',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-red-600',
  },
  {
    label: locale.t('imports.stats.amountToday'),
    value: formatCurrency(stats.value.totalAmountToday),
    hint:
      stats.value.totalAmountToday > 0
        ? locale.t('imports.stats.amountHint')
        : locale.t('imports.stats.amountEmpty'),
    icon: 'import',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-[#111118]',
    valueSize: 'md',
  },
])
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('imports.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('imports.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('imports.hero.desc') }}
          </p>
        </div>
        <RouterLink
          :to="{ name: 'stock-import-create' }"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          + {{ locale.t('imports.add') }}
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
        :value-size="card.valueSize ?? 'lg'"
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex items-center justify-between border-b border-red-100 px-6 py-4">
        <div>
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('imports.listTitle') }}</h3>
          <p class="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-500">
            <span>{{ locale.t('imports.listCount', { count: imports.length }) }}</span>
            <AppInlineLoader v-if="refreshing" size="xs" inline />
          </p>
        </div>
      </div>

      <AppInlineLoader v-if="loading" block size="md" />

      <div v-else-if="loadError" class="p-8 text-center">
        <p class="text-slate-500">{{ loadError }}</p>
        <button
          type="button"
          class="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          @click="loadData"
        >
          {{ locale.t('common.retry') }}
        </button>
      </div>

      <AppEmptyState
        v-else-if="imports.length === 0"
        icon="inbox"
        :title="locale.t('imports.empty')"
      />

      <template v-else>
        <div class="hidden overflow-x-auto lg:block">
          <table class="min-w-[920px] w-full text-left text-sm">
            <thead class="bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
              <tr>
                <th class="px-6 py-4">{{ locale.t('imports.col.code') }}</th>
                <th class="px-6 py-4">{{ locale.t('imports.col.supplier') }}</th>
                <th class="px-6 py-4">{{ locale.t('imports.col.items') }}</th>
                <th class="px-6 py-4">{{ locale.t('imports.col.imei') }}</th>
                <th class="px-6 py-4 text-right">{{ locale.t('common.total') }}</th>
                <th class="px-6 py-4">{{ locale.t('common.status') }}</th>
                <th class="px-6 py-4">{{ locale.t('common.time') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-red-100">
              <tr
                v-for="entry in imports"
                :key="entry.code"
                class="cursor-pointer transition hover:bg-red-50/40"
                @click="openImport(entry)"
              >
                <td class="px-6 py-4">
                  <p class="font-bold text-[#111118]">{{ entry.code }}</p>
                  <p v-if="entry.notes" class="mt-0.5 max-w-[180px] truncate text-xs text-slate-400">{{ entry.notes }}</p>
                </td>
                <td class="max-w-[200px] px-6 py-4">
                  <p class="font-semibold text-slate-700">{{ entry.supplierName || '—' }}</p>
                </td>
                <td class="max-w-[220px] px-6 py-4">
                  <p class="truncate text-slate-600">{{ importItemsSummary(entry) }}</p>
                  <p class="text-xs text-slate-400">
                    {{ locale.t('orders.itemLines', { count: entry.items?.length ?? 0 }) }}
                  </p>
                </td>
                <td class="px-6 py-4">
                  <p class="font-bold tabular-nums" :class="imeiProgressClass(entry)">
                    {{ imeiProgressLabel(entry) }}
                  </p>
                  <p class="text-xs text-slate-400">IMEI</p>
                </td>
                <td class="px-6 py-4 text-right font-bold text-red-600">
                  {{ formatCurrency(entry.totalAmount) }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                    :class="importStatusClass(entry.status)"
                  >
                    {{ entry.status === 'confirmed' ? locale.t('common.confirmed') : locale.t('common.draft') }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-500">
                  {{ formatImportDate(entry.confirmedAt || entry.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-red-100 lg:hidden">
          <button
            v-for="entry in imports"
            :key="entry.code"
            type="button"
            class="w-full px-4 py-4 text-left transition hover:bg-red-50/50 sm:px-6"
            @click="openImport(entry)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-bold text-[#111118]">{{ entry.code }}</p>
                <p class="mt-1 truncate text-sm font-medium text-slate-600">{{ entry.supplierName || '—' }}</p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                :class="importStatusClass(entry.status)"
              >
                {{ entry.status === 'confirmed' ? locale.t('common.confirmed') : locale.t('common.draft') }}
              </span>
            </div>

            <p class="mt-3 truncate text-sm text-slate-600">{{ importItemsSummary(entry) }}</p>

            <div class="mt-3 grid grid-cols-3 gap-2">
              <div class="rounded-[14px] bg-red-50/60 px-3 py-2 ring-1 ring-red-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">IMEI</p>
                <p class="mt-0.5 text-sm font-bold tabular-nums" :class="imeiProgressClass(entry)">
                  {{ imeiProgressLabel(entry) }}
                </p>
              </div>
              <div class="rounded-[14px] bg-red-50/60 px-3 py-2 ring-1 ring-red-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ locale.t('common.total') }}</p>
                <p class="mt-0.5 truncate text-sm font-bold text-red-600">{{ formatCurrency(entry.totalAmount) }}</p>
              </div>
              <div class="rounded-[14px] bg-red-50/60 px-3 py-2 ring-1 ring-red-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ locale.t('common.time') }}</p>
                <p class="mt-0.5 text-xs font-medium leading-snug text-slate-600">
                  {{ formatImportDate(entry.confirmedAt || entry.createdAt) }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

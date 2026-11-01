<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { usePageTransitionStore } from '@/stores/pageTransition'
import { storeInfo } from '@/data/storeIntro'
import { getRoleName } from '@/utils/roleRedirect'
import { fetchDashboard } from '@/api/dashboard'
import { silentRequest } from '@/api/client'
import { withApiFallbackEager } from '@/utils/apiFallback'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import {
  dashboardStats as mockStats,
  recentOrders as mockRecentOrders,
  quickActions,
  formatCurrency,
} from '@/mocks/dashboardMock'

const auth = useAuthStore()
const locale = useLocaleStore()
const pageTransition = usePageTransitionStore()
const roleName = computed(() => getRoleName(auth.user) ?? 'admin')

const welcomeKeyMap = {
  admin: 'dashboard.welcome.admin',
  sales_staff: 'dashboard.welcome.sales',
  warehouse_staff: 'dashboard.welcome.warehouse',
}

const actionLabelKeys = {
  '/pos': 'dashboard.action.pos',
  '/inventory/imports/create': 'dashboard.action.import',
  '/warranty': 'dashboard.action.warranty',
}

const welcomeText = computed(() => locale.t(welcomeKeyMap[roleName.value] ?? 'dashboard.welcome.admin'))
const visibleActions = computed(() =>
  quickActions
    .filter((a) => a.roles.includes(roleName.value))
    .map((a) => ({ ...a, label: locale.t(actionLabelKeys[a.to] ?? a.label) })),
)

const stats = ref({ ...mockStats })
const recentOrders = ref([...mockRecentOrders])
const staffActivity = ref([])
const useMock = ref(false)

onMounted(() => {
  const mockPayload = { stats: mockStats, recentOrders: mockRecentOrders, staffActivity: [] }

  const applyData = (data) => {
    stats.value = data.stats
    recentOrders.value = data.recentOrders
    staffActivity.value = data.staffActivity ?? []
    useMock.value = data.stats === mockStats
  }

  const initial = withApiFallbackEager(
    () => fetchDashboard(silentRequest),
    () => mockPayload,
    (data) => {
      if (pageTransition.active) {
        const stop = watch(
          () => pageTransition.active,
          (active) => {
            if (!active) {
              applyData(data)
              stop()
            }
          },
        )
        return
      }
      applyData(data)
    },
  )
  stats.value = initial.stats
  recentOrders.value = initial.recentOrders
  staffActivity.value = initial.staffActivity ?? []
})

const statCards = computed(() => [
  { label: locale.t('dashboard.stat.revenueToday'), value: formatCurrency(stats.value.revenueToday), hint: locale.t('dashboard.stat.revenueHint'), icon: 'revenue', color: 'text-red-600 bg-red-50' },
  { label: locale.t('dashboard.stat.ordersToday'), value: String(stats.value.ordersToday), hint: locale.t('dashboard.stat.ordersHint'), icon: 'orders', color: 'text-amber-600 bg-amber-50' },
  { label: locale.t('dashboard.stat.imeiStock'), value: String(stats.value.imeiInStock), hint: locale.t('dashboard.stat.lowStockHint', { count: stats.value.lowStockVariants }), icon: 'stock', color: 'text-sky-600 bg-sky-50' },
  { label: locale.t('dashboard.stat.revenueMonth'), value: formatCurrency(stats.value.revenueMonth), hint: `T${new Date().getMonth() + 1}/${new Date().getFullYear()}`, icon: 'trend', color: 'text-violet-600 bg-violet-50' },
])
</script>

<template>
  <div class="space-y-6 bg-[#fff7f7] p-6 sm:p-8">
    <AppContentBreadcrumb />

    <!-- Banner -->
    <div
      class="animate-enter-stagger stagger-0 relative overflow-hidden rounded-[24px] border border-red-300/40 bg-gradient-to-r from-red-600 to-red-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8"
    >
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('common.hello') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ auth.user?.name ?? 'Nhân viên' }}</h2>
          <p class="mt-2 max-w-lg text-sm leading-relaxed text-red-100/90">{{ welcomeText }}</p>
          <span
            v-if="auth.user?.role"
            class="mt-4 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/25"
          >
            {{ auth.user.role.display_name }}
          </span>
        </div>
        <div class="rounded-[18px] bg-white/10 px-4 py-3 text-right text-sm ring-1 ring-white/20 backdrop-blur-sm">
          <p class="font-bold">{{ storeInfo.name }}</p>
          <p class="text-xs text-red-100/80">{{ storeInfo.hours }}</p>
        </div>
      </div>
    </div>

    <!-- KPI -->
    <div class="animate-enter-stagger stagger-1 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <AppStatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :hint="card.hint"
        :icon="card.icon"
        :icon-color="card.color"
        hoverable
        hint-class="text-slate-400"
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="animate-enter-stagger stagger-2 grid gap-6 lg:grid-cols-3">
      <!-- Orders table -->
      <div class="lg:col-span-2 overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="flex items-center justify-between border-b border-slate-50 px-6 py-5">
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('dashboard.recentOrders') }}</h3>
          <RouterLink to="/orders" class="text-sm font-bold text-red-600 hover:text-red-700">
            {{ locale.t('common.viewAll') }} →
          </RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                <th class="px-6 py-4">{{ locale.t('dashboard.col.code') }}</th>
                <th class="px-6 py-4">{{ locale.t('common.customer') }}</th>
                <th class="px-6 py-4">{{ locale.t('common.total') }}</th>
                <th class="px-6 py-4">{{ locale.t('common.status') }}</th>
                <th class="px-6 py-4">{{ locale.t('common.time') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in recentOrders"
                :key="order.id"
                class="border-t border-slate-50 transition hover:bg-[#f8f8fb]"
              >
                <td class="px-6 py-4 font-mono text-xs text-slate-600">{{ order.id }}</td>
                <td class="px-6 py-4 font-medium text-[#111118]">{{ order.customer }}</td>
                <td class="px-6 py-4 font-bold text-[#111118]">{{ formatCurrency(order.total) }}</td>
                <td class="px-6 py-4">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-bold"
                    :class="order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ order.status === 'completed' ? locale.t('order.status.completed') : locale.t('order.status.cancelled') }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-400">{{ order.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sidebar actions -->
      <div class="space-y-6">
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('dashboard.todo') }}</h3>
          <ul class="mt-4 space-y-2">
            <li v-for="action in visibleActions" :key="action.to">
              <RouterLink
                :to="action.to"
                class="flex items-center gap-3 rounded-[16px] p-3 transition hover:bg-[#f8f8fb]"
              >
                <span class="flex h-10 w-10 items-center justify-center rounded-[12px] bg-red-50 text-lg">{{ action.icon }}</span>
                <span class="text-[14px] font-bold text-[#111118]">{{ action.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>

        <div
          v-if="roleName === 'admin' || roleName === 'warehouse_staff'"
          class="rounded-[24px] border border-amber-300 bg-amber-50 p-6"
        >
          <h3 class="font-bold text-amber-900">{{ locale.t('dashboard.attention') }}</h3>
          <ul class="mt-3 space-y-2 text-sm text-amber-900/80">
            <li class="flex justify-between"><span>{{ locale.t('dashboard.pendingImports') }}</span><strong>{{ stats.pendingImports }}</strong></li>
            <li class="flex justify-between"><span>{{ locale.t('dashboard.lowStockProducts') }}</span><strong>{{ stats.lowStockVariants }}</strong></li>
          </ul>
          <RouterLink to="/inventory/imports" class="mt-4 inline-flex text-sm font-bold text-amber-900 hover:underline">
            {{ locale.t('dashboard.handleImports') }} →
          </RouterLink>
        </div>
      </div>
    </div>

    <div
      v-if="roleName === 'admin'"
      class="animate-enter-stagger stagger-3 overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 px-6 py-5">
        <div>
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('dashboard.staffActivity') }}</h3>
          <p class="mt-0.5 text-sm text-slate-500">{{ locale.t('dashboard.staffActivityHint') }}</p>
        </div>
      </div>
      <AppEmptyState
        v-if="staffActivity.length === 0"
        size="sm"
        icon="inbox"
        :title="locale.t('dashboard.staffActivityEmpty')"
      />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th class="px-6 py-4">{{ locale.t('dashboard.col.staff') }}</th>
              <th class="px-6 py-4">{{ locale.t('dashboard.col.action') }}</th>
              <th class="px-6 py-4">{{ locale.t('common.time') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in staffActivity"
              :key="row.id"
              class="border-t border-slate-50 transition hover:bg-[#f8f8fb]"
            >
              <td class="px-6 py-4">
                <p class="font-semibold text-[#111118]">{{ row.staff }}</p>
                <p class="text-xs text-slate-500">{{ row.role }}</p>
              </td>
              <td class="px-6 py-4">
                <RouterLink
                  v-if="row.link"
                  :to="row.link"
                  class="font-medium text-red-600 hover:underline"
                >
                  {{ row.title }}
                </RouterLink>
                <p v-else class="font-medium text-[#111118]">{{ row.title }}</p>
                <p v-if="row.description" class="mt-0.5 text-xs text-slate-500">{{ row.description }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-slate-400">{{ formatRelativeTime(row.at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import { fetchOrders, cancelOrder } from '@/api/orders'
import { downloadCsv } from '@/utils/exportCsv'
import { useTranslatedOptions } from '@/composables/useTranslatedOptions'
import {
  formatCurrency,
  formatOrderTime,
  orderStats as emptyStats,
  orderStatusClass,
} from '@/mocks/orderMock'

const {
  locale,
  orderStatusOptions,
  paymentMethodOptions,
  translateOrderStatus,
  translatePayment,
} = useTranslatedOptions()

const keyword = ref('')
const selectedStatus = ref('all')
const selectedPayment = ref('all')
const selectedPeriod = ref('all')
const selectedOrder = ref(null)
const orderRows = ref([])
const orderStats = ref({ ...emptyStats })
const refreshing = ref(false)
const cancelling = ref(false)

function exportOrders() {
  downloadCsv('don-hang.csv', filteredOrders.value, [
    { label: 'Mã đơn', value: (r) => r.code },
    { label: 'Khách hàng', value: (r) => r.customerName },
    { label: 'SĐT', value: (r) => r.customerPhone },
    { label: 'Tổng', value: (r) => r.total },
    { label: 'Thanh toán', value: (r) => r.paymentMethod },
    { label: 'Trạng thái', value: (r) => r.status },
    { label: 'Thời gian', value: (r) => r.paidAt },
  ])
}

const canCancelOrder = computed(() => {
  const s = selectedOrder.value?.status
  return s === 'completed' || s === 'draft' || s === 'pending_payment'
})

async function handleCancelOrder() {
  if (!selectedOrder.value || !canCancelOrder.value) return
  if (!confirm(`Hủy đơn ${selectedOrder.value.code}?`)) return
  cancelling.value = true
  try {
    await cancelOrder(selectedOrder.value.id)
    const idx = orderRows.value.findIndex((o) => o.id === selectedOrder.value.id)
    if (idx >= 0) {
      orderRows.value[idx] = { ...orderRows.value[idx], status: 'cancelled', paymentStatus: 'failed' }
      selectedOrder.value = { ...selectedOrder.value, status: 'cancelled', paymentStatus: 'failed' }
    }
    await refreshOrders()
  } catch (err) {
    alert(err.response?.data?.message || 'Không thể hủy đơn.')
  } finally {
    cancelling.value = false
  }
}

function applyOrders(data) {
  orderRows.value = Array.isArray(data?.rows) ? data.rows : []
  orderStats.value = data?.stats ? { ...emptyStats, ...data.stats } : { ...emptyStats }
}

async function refreshOrders() {
  refreshing.value = true
  try {
    const data = await fetchOrders()
    applyOrders(data)
  } finally {
    refreshing.value = false
  }
}

function displayOrderStatus(order) {
  if (order.paymentStatus === 'failed' || order.paymentStatus === 'expired') return order.paymentStatus
  if (order.status === 'pending_payment') return 'pending_payment'
  return order.status
}

function displayOrderStatusClass(order) {
  return orderStatusClass[displayOrderStatus(order)] ?? orderStatusClass.draft
}

onMounted(refreshOrders)

const filteredOrders = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  return orderRows.value.filter((order) => {
    const q = keyword.value.trim().toLowerCase()
    const matchesKeyword =
      !q ||
      order.code?.toLowerCase().includes(q) ||
      (order.customerName ?? '').toLowerCase().includes(q) ||
      (order.customerPhone ?? '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      (order.itemsSummary ?? '').toLowerCase().includes(q)

    const matchesStatus = selectedStatus.value === 'all' || order.status === selectedStatus.value
    const matchesPayment = selectedPayment.value === 'all' || order.paymentMethod === selectedPayment.value

    const matchesPeriod =
      selectedPeriod.value === 'all' ||
      (selectedPeriod.value === 'today' && order.paidAt?.startsWith(today)) ||
      (selectedPeriod.value === 'yesterday' && order.paidAt?.startsWith(yesterday))

    return matchesKeyword && matchesStatus && matchesPayment && matchesPeriod
  })
})

function openDetail(order) {
  selectedOrder.value = order
}

function closeDetail() {
  selectedOrder.value = null
}

const statCards = computed(() => [
  {
    label: locale.t('orders.stats.today'),
    value: orderStats.value.ordersToday,
    hint: `${orderStats.value.completedToday} ${locale.t('common.completed')}`,
    icon: 'orders',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: locale.t('orders.stats.revenue'),
    value: formatCurrency(orderStats.value.revenueToday),
    hint: locale.t('orders.stats.revenueHint'),
    icon: 'revenue',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-[#111118]',
    valueSize: 'md',
  },
  {
    label: locale.t('orders.stats.avg'),
    value: formatCurrency(orderStats.value.avgOrderValue),
    hint: locale.t('orders.stats.avgHint'),
    icon: 'avg',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
    valueSize: 'md',
  },
  {
    label: locale.t('orders.stats.cancelled'),
    value: orderStats.value.cancelledToday,
    hint: locale.t('orders.stats.cancelledHint'),
    icon: 'cancelled',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-red-600',
  },
])
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('orders.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('orders.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('orders.hero.desc') }}
          </p>
        </div>
        <RouterLink
          to="/pos"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          {{ locale.t('common.openPos') }}
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

    <div class="rounded-[24px] border border-red-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div class="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="xl:col-span-2">
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.search') }}</label>
            <input
              v-model="keyword"
              type="text"
              :placeholder="locale.t('orders.searchPlaceholder')"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.status') }}</label>
            <select
              v-model="selectedStatus"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option v-for="opt in orderStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.payment') }}</label>
            <select
              v-model="selectedPayment"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option v-for="opt in paymentMethodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex rounded-[14px] bg-red-50/60 p-1 ring-1 ring-red-100">
            <button
              type="button"
              class="rounded-[10px] px-3 py-2 text-xs font-semibold transition"
              :class="selectedPeriod === 'today' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'"
              @click="selectedPeriod = 'today'"
            >
              {{ locale.t('common.today') }}
            </button>
            <button
              type="button"
              class="rounded-[10px] px-3 py-2 text-xs font-semibold transition"
              :class="selectedPeriod === 'yesterday' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'"
              @click="selectedPeriod = 'yesterday'"
            >
              {{ locale.t('common.yesterday') }}
            </button>
            <button
              type="button"
              class="rounded-[10px] px-3 py-2 text-xs font-semibold transition"
              :class="selectedPeriod === 'all' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'"
              @click="selectedPeriod = 'all'"
            >
              {{ locale.t('common.all') }}
            </button>
          </div>
          <button
            type="button"
            class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50"
            @click="exportOrders"
          >
            {{ locale.t('common.exportExcel') }}
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex items-center justify-between border-b border-red-100 px-6 py-4">
        <div>
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('orders.listTitle') }}</h3>
          <p class="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-500">
            <span>{{ locale.t('orders.listCount', { count: filteredOrders.length }) }}</span>
            <AppInlineLoader v-if="refreshing" size="xs" inline />
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[960px] w-full text-left text-sm">
          <thead class="bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">{{ locale.t('orders.col.code') }}</th>
              <th class="px-6 py-4">{{ locale.t('common.customer') }}</th>
              <th class="px-6 py-4">{{ locale.t('orders.col.items') }}</th>
              <th class="px-6 py-4">{{ locale.t('common.staff') }}</th>
              <th class="px-6 py-4">{{ locale.t('common.payment') }}</th>
              <th class="px-6 py-4 text-right">{{ locale.t('common.total') }}</th>
              <th class="px-6 py-4">{{ locale.t('common.status') }}</th>
              <th class="px-6 py-4">{{ locale.t('common.time') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-red-100">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="cursor-pointer transition hover:bg-red-50/40"
              @click="openDetail(order)"
            >
              <td class="px-6 py-4 font-bold text-[#111118]">{{ order.code }}</td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-700">{{ order.customerName }}</p>
                <p class="text-xs text-slate-400">{{ order.customerPhone }}</p>
              </td>
              <td class="max-w-[200px] px-6 py-4">
                <p class="truncate text-slate-600">{{ order.itemsSummary }}</p>
                <p class="text-xs text-slate-400">{{ locale.t('orders.itemLines', { count: order.itemCount }) }}</p>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ order.staffName }}</td>
              <td class="px-6 py-4 text-slate-600">{{ translatePayment(order.paymentMethod) }}</td>
              <td class="px-6 py-4 text-right font-bold text-red-600">{{ formatCurrency(order.total) }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1" :class="displayOrderStatusClass(order)">
                  {{ translateOrderStatus(displayOrderStatus(order)) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500">{{ formatOrderTime(order.paidAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="filteredOrders.length === 0"
        icon="inbox"
        :title="locale.t('orders.empty')"
      />
    </div>

    <AppSlideOver :open="!!selectedOrder" @close="closeDetail">
      <template v-if="selectedOrder">
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('orders.detail') }}</p>
              <h3 class="mt-1 text-xl font-black text-[#111118]">{{ selectedOrder.code }}</h3>
            </div>
            <button
              type="button"
              class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              @click="closeDetail"
            >
              {{ locale.t('common.close') }}
            </button>
          </div>
          <span
            class="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
            :class="displayOrderStatusClass(selectedOrder)"
          >
            {{ translateOrderStatus(displayOrderStatus(selectedOrder)) }}
          </span>
        </div>

        <div class="space-y-6 p-6">
          <div class="rounded-[18px] bg-red-50/50 p-4 ring-1 ring-red-100">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.customer') }}</p>
            <p class="mt-2 font-bold text-[#111118]">{{ selectedOrder.customerName }}</p>
            <p class="text-sm text-slate-500">{{ selectedOrder.customerPhone }}</p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-[16px] bg-red-50/40 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.staff') }}</p>
              <p class="mt-1 font-semibold text-slate-700">{{ selectedOrder.staffName }}</p>
            </div>
            <div class="rounded-[16px] bg-red-50/40 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.payment') }}</p>
              <p class="mt-1 font-semibold text-slate-700">{{ translatePayment(selectedOrder.paymentMethod) }}</p>
              <div
                v-if="selectedOrder.paymentMethod === 'mixed' && selectedOrder.paymentBreakdown"
                class="mt-2 space-y-1 text-xs text-slate-600"
              >
                <p>Tiền mặt: <span class="font-semibold">{{ formatCurrency(selectedOrder.paymentBreakdown.cashAmount) }}</span></p>
                <p>Chuyển khoản: <span class="font-semibold">{{ formatCurrency(selectedOrder.paymentBreakdown.transferAmount) }}</span></p>
              </div>
              <p v-if="selectedOrder.paymentStatus" class="mt-1 text-xs text-slate-500">
                {{ translateOrderStatus(displayOrderStatus(selectedOrder)) }}
              </p>
            </div>
          </div>

          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('orders.col.soldItems') }}</p>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in selectedOrder.items"
                :key="idx"
                class="rounded-[16px] border border-red-100 bg-white p-4"
              >
                <p class="font-bold text-[#111118]">{{ item.name }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ item.variant }}</p>
                <p v-if="item.imei" class="mt-2 font-mono text-xs text-slate-500">IMEI: {{ item.imei }}</p>
                <div class="mt-3 flex items-center justify-between text-sm">
                  <span class="text-slate-500">
                    <template v-if="item.discount > 0">{{ locale.t('orders.discountLine', { amount: formatCurrency(item.discount) }) }}</template>
                    <template v-else>{{ locale.t('orders.unitPrice') }}</template>
                  </span>
                  <span class="font-bold text-red-600">{{ formatCurrency(item.total) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-[18px] bg-[#fffafa] p-4 ring-1 ring-red-100">
            <div class="flex justify-between text-sm text-slate-500">
              <span>{{ locale.t('orders.col.subtotal') }}</span>
              <span>{{ formatCurrency(selectedOrder.subtotal) }}</span>
            </div>
            <div v-if="selectedOrder.discount > 0" class="mt-2 flex justify-between text-sm text-slate-500">
              <span>{{ locale.t('orders.col.discount') }}</span>
              <span class="text-emerald-600">-{{ formatCurrency(selectedOrder.discount) }}</span>
            </div>
            <div class="mt-3 flex justify-between border-t border-red-100 pt-3">
              <span class="font-bold text-[#111118]">{{ locale.t('orders.col.paidTotal') }}</span>
              <span class="text-xl font-black text-red-600">{{ formatCurrency(selectedOrder.total) }}</span>
            </div>
          </div>

          <div v-if="selectedOrder.notes" class="rounded-[16px] bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
            <p class="text-xs font-bold uppercase tracking-widest text-amber-600">{{ locale.t('common.notes') }}</p>
            <p class="mt-1">{{ selectedOrder.notes }}</p>
          </div>

          <p class="text-center text-xs text-slate-400">
            {{ locale.t('orders.paidAt') }}: {{ formatOrderTime(selectedOrder.paidAt) }}
          </p>

          <button
            v-if="canCancelOrder"
            type="button"
            class="w-full rounded-[14px] border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            :disabled="cancelling"
            @click="handleCancelOrder"
          >
            {{ cancelling ? 'Đang hủy...' : 'Hủy đơn hàng' }}
          </button>
        </div>
      </template>
    </AppSlideOver>
  </div>
</template>

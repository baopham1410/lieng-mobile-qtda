<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/api/customers'
import { useAuthStore } from '@/stores/auth'
import { getRoleName } from '@/utils/roleRedirect'
import { downloadCsv } from '@/utils/exportCsv'
import { withApiFallback } from '@/utils/apiFallback'
import { useTranslatedOptions } from '@/composables/useTranslatedOptions'
import {
  customerRows as mockRows,
  customerStats as mockStats,
  customerTierClass,
  formatCurrency,
  formatCustomerDate,
  formatPoints,
  getInitials,
} from '@/mocks/customerMock'

const auth = useAuthStore()
const { locale, customerTierOptions, translateTier } = useTranslatedOptions()

const perPage = 15
const keyword = ref('')
const selectedTier = ref('all')
const currentPage = ref(1)
const paginationMeta = ref({ current_page: 1, last_page: 1, per_page: perPage, total: 0 })

const selectedCustomer = ref(null)
const detailTab = ref('orders')
const loadingList = ref(false)
const loadingDetail = ref(false)
const exporting = ref(false)
const deleting = ref(false)
const detailError = ref('')

const showAddModal = ref(false)
const customerRows = ref([...mockRows])
const customerStats = ref({ ...mockStats })
const useMock = ref(false)
const saving = ref(false)
const formError = ref('')
const showEditModal = ref(false)
const editCustomer = ref({ id: null, name: '', phone: '', email: '', address: '', notes: '' })

const newCustomer = ref({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

let searchTimer = null

const canDeleteCustomer = computed(() => {
  const role = getRoleName(auth.user)
  const permissions = auth.user?.permissions || []
  return role === 'admin' || permissions.includes('customers.delete')
})

const filteredCustomers = computed(() => {
  if (!useMock.value) {
    return customerRows.value
  }

  const q = keyword.value.trim().toLowerCase()
  return customerRows.value.filter((customer) => {
    const matchesKeyword =
      !q ||
      customer.name.toLowerCase().includes(q) ||
      customer.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      (customer.email || '').toLowerCase().includes(q) ||
      (customer.address || '').toLowerCase().includes(q)

    const matchesTier = selectedTier.value === 'all' || customer.tier === selectedTier.value
    return matchesKeyword && matchesTier
  })
})

function extractApiError(err, fallbackMsg) {
  if (err?.response?.data?.errors) {
    return Object.values(err.response.data.errors).flat().join(' ')
  }
  return err?.response?.data?.message || fallbackMsg
}

function buildCustomerPayload(form) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email?.trim() || null,
    address: form.address?.trim() || null,
    notes: form.notes?.trim() || null,
  }
}

async function loadCustomers(page = currentPage.value) {
  loadingList.value = true
  try {
    const params = {
      page,
      per_page: perPage,
      search: keyword.value.trim() || undefined,
      tier: selectedTier.value !== 'all' ? selectedTier.value : undefined,
    }
    const data = await withApiFallback(
      () => fetchCustomers(params),
      () => ({
        rows: mockRows,
        stats: mockStats,
        meta: { current_page: 1, last_page: 1, per_page: perPage, total: mockRows.length },
      }),
    )

    customerRows.value = Array.isArray(data.rows) ? data.rows : []
    customerStats.value = data.stats ? { ...mockStats, ...data.stats } : { ...mockStats }
    paginationMeta.value = data.meta || {
      current_page: 1,
      last_page: 1,
      per_page: perPage,
      total: customerRows.value.length,
    }
    currentPage.value = paginationMeta.value.current_page || 1
    useMock.value = data.rows === mockRows
  } finally {
    loadingList.value = false
  }
}

async function openDetail(customer) {
  selectedCustomer.value = customer
  detailTab.value = 'orders'
  detailError.value = ''
  if (useMock.value || !customer?.id) return

  loadingDetail.value = true
  try {
    const fresh = await fetchCustomer(customer.id)
    if (selectedCustomer.value?.id === customer.id && fresh) {
      selectedCustomer.value = fresh
    }
  } catch {
    // Keep existing list payload if detail refresh fails
  } finally {
    loadingDetail.value = false
  }
}

function closeDetail() {
  selectedCustomer.value = null
  detailError.value = ''
}

function openAddModal() {
  newCustomer.value = { name: '', phone: '', email: '', address: '', notes: '' }
  formError.value = ''
  showAddModal.value = true
}

function openEditModal() {
  if (!selectedCustomer.value) return
  editCustomer.value = {
    id: selectedCustomer.value.id,
    name: selectedCustomer.value.name,
    phone: selectedCustomer.value.phone,
    email: selectedCustomer.value.email ?? '',
    address: selectedCustomer.value.address ?? '',
    notes: selectedCustomer.value.notes ?? '',
  }
  formError.value = ''
  showEditModal.value = true
}

async function handleCreateCustomer() {
  saving.value = true
  formError.value = ''
  try {
    await createCustomer(buildCustomerPayload(newCustomer.value))
    showAddModal.value = false
    await loadCustomers(1)
  } catch (err) {
    formError.value = extractApiError(err, 'Không thể tạo khách hàng.')
  } finally {
    saving.value = false
  }
}

async function handleUpdateCustomer() {
  if (!editCustomer.value.id) return
  saving.value = true
  formError.value = ''
  try {
    const res = await updateCustomer(editCustomer.value.id, buildCustomerPayload(editCustomer.value))
    showEditModal.value = false
    await loadCustomers(currentPage.value)
    if (res?.data?.data) {
      await openDetail(res.data.data)
    } else {
      closeDetail()
    }
  } catch (err) {
    formError.value = extractApiError(err, 'Không thể cập nhật khách hàng.')
  } finally {
    saving.value = false
  }
}

async function handleDeleteCustomer() {
  if (!selectedCustomer.value?.id || !canDeleteCustomer.value) return
  const target = selectedCustomer.value
  if (!confirm(`Xóa khách hàng "${target.name}" (${target.phone})? Lịch sử đơn hàng cũ vẫn được giữ nguyên.`)) {
    return
  }

  deleting.value = true
  detailError.value = ''
  try {
    await deleteCustomer(target.id)
    closeDetail()
    const nextPage = customerRows.value.length <= 1 && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
    await loadCustomers(nextPage)
  } catch (err) {
    detailError.value = extractApiError(err, 'Không thể xóa khách hàng.')
  } finally {
    deleting.value = false
  }
}

async function exportCustomers() {
  exporting.value = true
  try {
    let rowsToExport = filteredCustomers.value
    if (!useMock.value) {
      try {
        const res = await fetchCustomers({
          page: 1,
          per_page: 500,
          search: keyword.value.trim() || undefined,
          tier: selectedTier.value !== 'all' ? selectedTier.value : undefined,
        })
        if (Array.isArray(res.rows)) {
          rowsToExport = res.rows
        }
      } catch {
        rowsToExport = filteredCustomers.value
      }
    }

    downloadCsv('khach-hang.csv', rowsToExport, [
      { label: 'Họ tên', value: (r) => r.name },
      { label: 'Số điện thoại', value: (r) => r.phone },
      { label: 'Email', value: (r) => r.email || '' },
      { label: 'Địa chỉ', value: (r) => r.address || '' },
      { label: 'Hạng', value: (r) => translateTier(r.tier) },
      { label: 'Đơn hàng', value: (r) => r.orderCount ?? 0 },
      { label: 'Bảo hành', value: (r) => r.warrantyCount ?? 0 },
      { label: 'Tổng chi tiêu', value: (r) => r.totalSpent ?? 0 },
      { label: 'Điểm tích lũy', value: (r) => r.loyaltyPoints ?? 0 },
      { label: 'Mua gần nhất', value: (r) => formatCustomerDate(r.lastOrderAt) },
      { label: 'Ghi chú', value: (r) => r.notes || '' },
    ])
  } finally {
    exporting.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > (paginationMeta.value.last_page || 1) || page === currentPage.value) return
  loadCustomers(page)
}

function warrantyStatusBadge(status) {
  const map = {
    active: { label: 'Còn hạn', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    expiring: { label: 'Sắp hết hạn', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    expired: { label: 'Hết hạn', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
    void: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  }
  return map[status] || { label: status || '—', cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
}

function appraisalStatusBadge(status) {
  const map = {
    draft: { label: 'Nháp', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
    quoted: { label: 'Đã báo giá', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    accepted: { label: 'Đã chốt thu', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    cancelled: { label: 'Đã hủy', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
    rejected: { label: 'Từ chối thu', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  }
  return map[status] || { label: status || '—', cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
}

watch(keyword, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadCustomers(1)
  }, 300)
})

watch(selectedTier, () => {
  loadCustomers(1)
})

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
})

onMounted(() => loadCustomers(1))

const statCards = computed(() => [
  {
    label: locale.t('customers.stats.total'),
    value: customerStats.value.totalCustomers.toLocaleString('vi-VN'),
    hint: locale.t('customers.stats.totalHint'),
    icon: 'customers',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: locale.t('customers.stats.new'),
    value: `+${customerStats.value.newThisMonth}`,
    hint: locale.t('customers.stats.newHint'),
    icon: 'userPlus',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
  },
  {
    label: locale.t('customers.stats.members'),
    value: customerStats.value.loyaltyMembers,
    hint: locale.t('customers.stats.membersHint'),
    icon: 'members',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
  },
  {
    label: locale.t('customers.stats.spent'),
    value: formatCurrency(customerStats.value.totalRevenue),
    hint: locale.t('customers.stats.spentHint'),
    icon: 'revenue',
    iconColor: 'text-violet-600 bg-violet-50',
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
          <p class="text-sm font-medium text-red-100">{{ locale.t('customers.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('customers.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('customers.hero.desc') }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
          @click="openAddModal"
        >
          + {{ locale.t('customers.add') }}
        </button>
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
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="grid flex-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.search') }}</label>
            <input
              v-model="keyword"
              type="text"
              :placeholder="locale.t('customers.searchPlaceholder')"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Hạng thành viên</label>
            <select
              v-model="selectedTier"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option v-for="opt in customerTierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-60"
          :disabled="exporting || filteredCustomers.length === 0"
          @click="exportCustomers"
        >
          {{ exporting ? 'Đang xuất...' : locale.t('common.exportExcel') }}
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 px-6 py-4">
        <div>
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('customers.listTitle') }}</h3>
          <p class="text-sm text-slate-500">
            {{ locale.t('customers.listCount', { count: paginationMeta.total || filteredCustomers.length }) }}
          </p>
        </div>
        <AppInlineLoader v-if="loadingList" label="Đang tải khách hàng..." />
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[920px] w-full text-left text-sm">
          <thead class="bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">Khách hàng</th>
              <th class="px-6 py-4">Liên hệ</th>
              <th class="px-6 py-4">Hạng</th>
              <th class="px-6 py-4 text-center">Đơn / BH</th>
              <th class="px-6 py-4 text-right">Tổng chi tiêu</th>
              <th class="px-6 py-4 text-right">Điểm tích lũy</th>
              <th class="px-6 py-4">Mua gần nhất</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-red-100">
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="cursor-pointer transition hover:bg-red-50/40"
              @click="openDetail(customer)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-red-500 to-rose-500 text-sm font-bold text-white"
                  >
                    {{ getInitials(customer.name) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-[#111118]">{{ customer.name }}</p>
                    <p v-if="customer.address" class="max-w-[210px] truncate text-xs text-slate-400">{{ customer.address }}</p>
                    <p v-if="customer.notes" class="max-w-[210px] truncate text-[11px] font-medium text-amber-600">
                      Ghi chú: {{ customer.notes }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-slate-700">{{ customer.phone }}</p>
                <p class="text-xs text-slate-400">{{ customer.email || '—' }}</p>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="customerTierClass[customer.tier]"
                >
                  {{ translateTier(customer.tier) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-slate-700">{{ customer.orderCount }} đơn</span>
                <span v-if="customer.warrantyCount" class="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {{ customer.warrantyCount }} BH
                </span>
              </td>
              <td class="px-6 py-4 text-right font-bold text-red-600">{{ formatCurrency(customer.totalSpent) }}</td>
              <td class="px-6 py-4 text-right font-semibold text-amber-600">{{ formatPoints(customer.loyaltyPoints) }}</td>
              <td class="px-6 py-4 text-slate-500">{{ formatCustomerDate(customer.lastOrderAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="!loadingList && filteredCustomers.length === 0"
        icon="users"
        :title="locale.t('common.noResults')"
      />

      <div
        v-if="paginationMeta.last_page > 1"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-red-100 px-6 py-4 text-sm"
      >
        <p class="text-slate-500">
          Trang <strong class="text-[#111118]">{{ paginationMeta.current_page }}</strong> / {{ paginationMeta.last_page }}
          · Tổng <strong class="text-[#111118]">{{ paginationMeta.total }}</strong> khách hàng
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-[12px] border border-red-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="paginationMeta.current_page <= 1 || loadingList"
            @click="goToPage(paginationMeta.current_page - 1)"
          >
            ← Trước
          </button>
          <button
            type="button"
            class="rounded-[12px] border border-red-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="paginationMeta.current_page >= paginationMeta.last_page || loadingList"
            @click="goToPage(paginationMeta.current_page + 1)"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>

    <AppSlideOver :open="!!selectedCustomer" @close="closeDetail">
      <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-red-500 to-rose-500 text-lg font-bold text-white"
            >
              {{ getInitials(selectedCustomer?.name) }}
            </div>
            <div>
              <h3 class="text-xl font-black text-[#111118]">{{ selectedCustomer?.name }}</h3>
              <span
                class="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1"
                :class="customerTierClass[selectedCustomer?.tier]"
              >
                {{ translateTier(selectedCustomer?.tier) }}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            @click="closeDetail"
          >
            {{ locale.t('common.close') }}
          </button>
        </div>
      </div>

      <div v-if="selectedCustomer" class="space-y-6 p-6">
        <p v-if="detailError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-600">{{ detailError }}</p>

        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-[16px] bg-red-50/50 px-3 py-3 text-center ring-1 ring-red-100">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Đơn hàng</p>
            <p class="mt-1 text-xl font-black text-[#111118]">{{ selectedCustomer.orderCount }}</p>
          </div>
          <div class="rounded-[16px] bg-emerald-50/60 px-3 py-3 text-center ring-1 ring-emerald-100">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Bảo hành</p>
            <p class="mt-1 text-xl font-black text-emerald-700">
              {{ selectedCustomer.warranties?.length ?? selectedCustomer.warrantyCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-[16px] bg-amber-50/60 px-3 py-3 text-center ring-1 ring-amber-100">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Điểm</p>
            <p class="mt-1 text-xl font-black text-amber-600">{{ formatPoints(selectedCustomer.loyaltyPoints) }}</p>
          </div>
        </div>

        <div class="rounded-[18px] bg-red-50/40 p-4 ring-1 ring-red-100">
          <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin liên hệ</p>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Số điện thoại</span>
              <span class="font-semibold text-slate-700">{{ selectedCustomer.phone }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Email</span>
              <span class="font-semibold text-slate-700">{{ selectedCustomer.email || '—' }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Địa chỉ</span>
              <span class="text-right font-semibold text-slate-700">{{ selectedCustomer.address || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-[18px] bg-[#fffafa] p-4 ring-1 ring-red-100">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Tổng chi tiêu</span>
            <span class="text-lg font-black text-red-600">{{ formatCurrency(selectedCustomer.totalSpent) }}</span>
          </div>
          <div class="mt-2 flex justify-between text-sm text-slate-500">
            <span>Đơn gần nhất</span>
            <span class="font-medium">{{ selectedCustomer.lastOrderCode || '—' }}</span>
          </div>
        </div>

        <div v-if="selectedCustomer.notes" class="rounded-[16px] bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
          <p class="text-xs font-bold uppercase tracking-widest text-amber-600">Ghi chú nội bộ</p>
          <p class="mt-1 whitespace-pre-line">{{ selectedCustomer.notes }}</p>
        </div>

        <div>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap gap-1.5">
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-bold transition"
                :class="detailTab === 'orders' ? 'bg-red-600 text-white' : 'bg-red-50 text-slate-600 hover:bg-red-100'"
                @click="detailTab = 'orders'"
              >
                Đơn hàng ({{ selectedCustomer.recentOrders?.length ?? 0 }})
              </button>
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-bold transition"
                :class="detailTab === 'warranties' ? 'bg-red-600 text-white' : 'bg-red-50 text-slate-600 hover:bg-red-100'"
                @click="detailTab = 'warranties'"
              >
                Bảo hành ({{ selectedCustomer.warranties?.length ?? selectedCustomer.warrantyCount ?? 0 }})
              </button>
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-bold transition"
                :class="detailTab === 'appraisals' ? 'bg-red-600 text-white' : 'bg-red-50 text-slate-600 hover:bg-red-100'"
                @click="detailTab = 'appraisals'"
              >
                Thẩm định ({{ selectedCustomer.appraisals?.length ?? 0 }})
              </button>
            </div>
            <AppInlineLoader v-if="loadingDetail" label="Đang tải..." />
          </div>

          <div v-if="detailTab === 'orders'" class="space-y-2">
            <div
              v-for="order in selectedCustomer.recentOrders || []"
              :key="order.code"
              class="flex items-center justify-between rounded-[14px] border border-red-100 bg-white px-4 py-3"
            >
              <div>
                <p class="font-semibold text-[#111118]">{{ order.code }}</p>
                <p class="text-xs text-slate-400">{{ formatCustomerDate(order.paidAt) }}</p>
              </div>
              <span class="font-bold text-red-600">{{ formatCurrency(order.total) }}</span>
            </div>
            <p v-if="!selectedCustomer.recentOrders?.length" class="rounded-[14px] border border-dashed border-red-100 px-4 py-5 text-center text-xs text-slate-400">
              Khách hàng chưa có đơn hoàn tất nào.
            </p>
          </div>

          <div v-else-if="detailTab === 'warranties'" class="space-y-2">
            <div
              v-for="w in selectedCustomer.warranties || []"
              :key="w.id"
              class="rounded-[14px] border border-red-100 bg-white px-4 py-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-[#111118]">{{ w.productName }} <span class="text-xs font-normal text-slate-400">{{ w.variant }}</span></p>
                  <p class="mt-0.5 text-xs text-slate-500">{{ w.code }} · IMEI: {{ w.imei || '—' }}</p>
                </div>
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1"
                  :class="warrantyStatusBadge(w.status).cls"
                >
                  {{ warrantyStatusBadge(w.status).label }}
                </span>
              </div>
              <p class="mt-2 text-xs text-slate-400">Hạn BH: {{ w.startDate || '—' }} → {{ w.endDate || '—' }}</p>
            </div>
            <p v-if="!selectedCustomer.warranties?.length" class="rounded-[14px] border border-dashed border-red-100 px-4 py-5 text-center text-xs text-slate-400">
              Chưa ghi nhận phiếu bảo hành cho khách hàng này.
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="ap in selectedCustomer.appraisals || []"
              :key="ap.id"
              class="rounded-[14px] border border-red-100 bg-white px-4 py-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-[#111118]">{{ ap.model }} {{ ap.storage || '' }}</p>
                  <p class="mt-0.5 text-xs text-slate-500">
                    {{ ap.code }} · Hạng AI: <strong>{{ ap.aiGrade || '—' }}</strong>
                  </p>
                </div>
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1"
                  :class="appraisalStatusBadge(ap.status).cls"
                >
                  {{ appraisalStatusBadge(ap.status).label }}
                </span>
              </div>
              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-slate-400">{{ formatCustomerDate(ap.createdAt) }}</span>
                <span class="font-bold text-red-600">{{ formatCurrency(ap.finalPrice) }}</span>
              </div>
            </div>
            <p v-if="!selectedCustomer.appraisals?.length" class="rounded-[14px] border border-dashed border-red-100 px-4 py-5 text-center text-xs text-slate-400">
              Chưa có phiếu thẩm định thu cũ gắn SĐT này.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <RouterLink to="/pos" class="rounded-[12px] border border-red-100 bg-red-50/40 px-2 py-2 text-red-700 hover:bg-red-50">
            Quầy POS
          </RouterLink>
          <RouterLink to="/warranty" class="rounded-[12px] border border-red-100 bg-red-50/40 px-2 py-2 text-slate-700 hover:bg-red-50">
            Bảo hành
          </RouterLink>
          <RouterLink to="/appraisal" class="rounded-[12px] border border-red-100 bg-red-50/40 px-2 py-2 text-slate-700 hover:bg-red-50">
            Thẩm định
          </RouterLink>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-[16px] bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            @click="openEditModal"
          >
            Chỉnh sửa hồ sơ
          </button>
          <button
            v-if="canDeleteCustomer"
            type="button"
            class="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            :disabled="deleting"
            @click="handleDeleteCustomer"
          >
            {{ deleting ? 'Đang xóa...' : 'Xóa' }}
          </button>
        </div>
      </div>
    </AppSlideOver>

    <AppModal :open="showAddModal" @close="showAddModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-bold text-[#111118]">Thêm khách hàng mới</h3>
          <p class="mt-1 text-sm text-slate-500">Tạo hồ sơ để chọn nhanh khi bán tại quầy</p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-600">{{ formError }}</p>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Họ tên</label>
            <input
              v-model="newCustomer.name"
              type="text"
              placeholder="Nguyễn Văn A"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</label>
            <input
              v-model="newCustomer.phone"
              type="text"
              placeholder="0901 234 567"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Email</label>
            <input
              v-model="newCustomer.email"
              type="email"
              placeholder="email@example.com"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Địa chỉ</label>
            <input
              v-model="newCustomer.address"
              type="text"
              placeholder="Quận / Tỉnh thành..."
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú</label>
            <textarea
              v-model="newCustomer.notes"
              rows="2"
              placeholder="Sở thích, lưu ý khi bán hàng..."
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            ></textarea>
          </div>
        </div>
        <div class="flex gap-3 border-t border-red-100 px-6 py-4">
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-red-100 hover:bg-red-50"
            @click="showAddModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            :disabled="saving"
            @click="handleCreateCustomer"
          >
            {{ saving ? 'Đang lưu...' : 'Lưu khách hàng' }}
          </button>
        </div>
      </div>
    </AppModal>

    <AppModal :open="showEditModal" @close="showEditModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-bold text-[#111118]">Chỉnh sửa khách hàng</h3>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-600">{{ formError }}</p>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Họ tên</label>
            <input v-model="editCustomer.name" type="text" class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</label>
            <input v-model="editCustomer.phone" type="text" class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Email</label>
            <input v-model="editCustomer.email" type="email" class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Địa chỉ</label>
            <input v-model="editCustomer.address" type="text" class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú</label>
            <textarea
              v-model="editCustomer.notes"
              rows="2"
              placeholder="Sở thích, lưu ý khi bán hàng..."
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            ></textarea>
          </div>
        </div>
        <div class="flex gap-3 border-t border-red-100 px-6 py-4">
          <button type="button" class="flex-1 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-red-100" @click="showEditModal = false">Hủy</button>
          <button type="button" class="flex-1 rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" :disabled="saving" @click="handleUpdateCustomer">
            {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import { fetchCustomers, createCustomer, updateCustomer } from '@/api/customers'
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

const { locale, customerTierOptions, translateTier } = useTranslatedOptions()

const keyword = ref('')
const selectedTier = ref('all')
const selectedCustomer = ref(null)
const showAddModal = ref(false)
const customerRows = ref([...mockRows])
const customerStats = ref({ ...mockStats })
const useMock = ref(false)
const saving = ref(false)
const formError = ref('')
const showEditModal = ref(false)
const editCustomer = ref({ id: null, name: '', phone: '', email: '', address: '' })

const newCustomer = ref({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const filteredCustomers = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return customerRows.value.filter((customer) => {
    const matchesKeyword =
      !q ||
      customer.name.toLowerCase().includes(q) ||
      customer.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      customer.email.toLowerCase().includes(q)

    const matchesTier = selectedTier.value === 'all' || customer.tier === selectedTier.value
    return matchesKeyword && matchesTier
  })
})

function openDetail(customer) {
  selectedCustomer.value = customer
}

function closeDetail() {
  selectedCustomer.value = null
}

function openAddModal() {
  newCustomer.value = { name: '', phone: '', email: '', address: '', notes: '' }
  showAddModal.value = true
}

async function loadCustomers() {
  const data = await withApiFallback(fetchCustomers, () => ({
    rows: mockRows,
    stats: mockStats,
  }))
  customerRows.value = data.rows
  customerStats.value = data.stats
  useMock.value = data.rows === mockRows
}

function openEditModal() {
  if (!selectedCustomer.value) return
  editCustomer.value = {
    id: selectedCustomer.value.id,
    name: selectedCustomer.value.name,
    phone: selectedCustomer.value.phone,
    email: selectedCustomer.value.email ?? '',
    address: selectedCustomer.value.address ?? '',
  }
  formError.value = ''
  showEditModal.value = true
}

async function handleCreateCustomer() {
  saving.value = true
  formError.value = ''
  try {
    await createCustomer({
      name: newCustomer.value.name,
      phone: newCustomer.value.phone,
      email: newCustomer.value.email || null,
      address: newCustomer.value.address || null,
    })
    showAddModal.value = false
    await loadCustomers()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thể tạo khách hàng.'
    if (err.response?.data?.errors) {
      formError.value = Object.values(err.response.data.errors).flat().join(' ')
    }
  } finally {
    saving.value = false
  }
}

async function handleUpdateCustomer() {
  if (!editCustomer.value.id) return
  saving.value = true
  formError.value = ''
  try {
    await updateCustomer(editCustomer.value.id, {
      name: editCustomer.value.name,
      phone: editCustomer.value.phone,
      email: editCustomer.value.email || null,
      address: editCustomer.value.address || null,
    })
    showEditModal.value = false
    closeDetail()
    await loadCustomers()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thể cập nhật khách hàng.'
  } finally {
    saving.value = false
  }
}

onMounted(loadCustomers)

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
        <button class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50">
          {{ locale.t('common.exportExcel') }}
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="border-b border-red-100 px-6 py-4">
        <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('customers.listTitle') }}</h3>
        <p class="text-sm text-slate-500">{{ locale.t('customers.listCount', { count: filteredCustomers.length }) }}</p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[900px] w-full text-left text-sm">
          <thead class="bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">Khách hàng</th>
              <th class="px-6 py-4">Liên hệ</th>
              <th class="px-6 py-4">Hạng</th>
              <th class="px-6 py-4 text-center">Đơn hàng</th>
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
                  <div>
                    <p class="font-bold text-[#111118]">{{ customer.name }}</p>
                    <p v-if="customer.address" class="max-w-[180px] truncate text-xs text-slate-400">{{ customer.address }}</p>
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
              <td class="px-6 py-4 text-center font-semibold text-slate-700">{{ customer.orderCount }}</td>
              <td class="px-6 py-4 text-right font-bold text-red-600">{{ formatCurrency(customer.totalSpent) }}</td>
              <td class="px-6 py-4 text-right font-semibold text-amber-600">{{ formatPoints(customer.loyaltyPoints) }}</td>
              <td class="px-6 py-4 text-slate-500">{{ formatCustomerDate(customer.lastOrderAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="filteredCustomers.length === 0"
        icon="users"
        :title="locale.t('common.noResults')"
      />
    </div>

    <AppSlideOver :open="!!selectedCustomer" @close="closeDetail">
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-red-500 to-rose-500 text-lg font-bold text-white"
              >
                {{ getInitials(selectedCustomer.name) }}
              </div>
              <div>
                <h3 class="text-xl font-black text-[#111118]">{{ selectedCustomer.name }}</h3>
                <span
                  class="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1"
                  :class="customerTierClass[selectedCustomer.tier]"
                >
                  {{ translateTier(selectedCustomer.tier) }}
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

        <div class="space-y-6 p-6">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-[16px] bg-red-50/50 px-4 py-3 text-center ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Đơn hàng</p>
              <p class="mt-1 text-xl font-black text-[#111118]">{{ selectedCustomer.orderCount }}</p>
            </div>
            <div class="rounded-[16px] bg-red-50/50 px-4 py-3 text-center ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Điểm tích lũy</p>
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
              <span class="font-medium">{{ selectedCustomer.lastOrderCode }}</span>
            </div>
          </div>

          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Lịch sử mua hàng</p>
            <div class="space-y-2">
              <div
                v-for="order in selectedCustomer.recentOrders"
                :key="order.code"
                class="flex items-center justify-between rounded-[14px] border border-red-100 bg-white px-4 py-3"
              >
                <div>
                  <p class="font-semibold text-[#111118]">{{ order.code }}</p>
                  <p class="text-xs text-slate-400">{{ formatCustomerDate(order.paidAt) }}</p>
                </div>
                <span class="font-bold text-red-600">{{ formatCurrency(order.total) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedCustomer.notes" class="rounded-[16px] bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
            <p class="text-xs font-bold uppercase tracking-widest text-amber-600">Ghi chú nội bộ</p>
            <p class="mt-1">{{ selectedCustomer.notes }}</p>
          </div>

          <button
            type="button"
            class="w-full rounded-[16px] bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            @click="openEditModal"
          >
            Chỉnh sửa hồ sơ
          </button>
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

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import { fetchWarranties, lookupWarranty, createRepairByImei } from '@/api/warranty'
import { withApiFallback } from '@/utils/apiFallback'
import { useTranslatedOptions } from '@/composables/useTranslatedOptions'
import {
  findWarrantyByImei,
  formatCurrency,
  formatRepairTime,
  formatWarrantyDate,
  getDisplayStatus,
  isValidImeiFormat,
  normalizeImei,
  warrantyRows as mockRows,
  warrantyStats as mockStats,
  warrantyStatusClass,
} from '@/mocks/warrantyMock'

const {
  locale,
  warrantyStatusOptions,
  translateWarrantyStatus,
} = useTranslatedOptions()

const keyword = ref('')
const selectedStatus = ref('all')
const lookupInput = ref('')
const lookupError = ref('')
const lookupResult = ref(null)
const selectedWarranty = ref(null)
const showRepairModal = ref(false)
const repairForm = ref({ imei: '', description: '', cost: 0 })
const savingRepair = ref(false)
const repairError = ref('')
const warrantyRows = ref([...mockRows])
const warrantyStats = ref({ ...mockStats })
const useMock = ref(false)

onMounted(async () => {
  const data = await withApiFallback(fetchWarranties, () => ({ rows: mockRows, stats: mockStats }))
  warrantyRows.value = data.rows
  warrantyStats.value = data.stats
  useMock.value = data.rows === mockRows
})

const filteredWarranties = computed(() => {
  return warrantyRows.value.filter((w) => {
    const q = keyword.value.trim().toLowerCase()
    const matchesKeyword =
      !q ||
      w.code.toLowerCase().includes(q) ||
      w.imei.includes(q.replace(/\D/g, '')) ||
      w.productName.toLowerCase().includes(q) ||
      w.customerName.toLowerCase().includes(q) ||
      w.customerPhone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))

    const displayStatus = getDisplayStatus(w)
    const matchesStatus =
      selectedStatus.value === 'all' ||
      displayStatus === selectedStatus.value ||
      (selectedStatus.value === 'expiring' && w.status === 'expiring')

    return matchesKeyword && matchesStatus
  })
})

async function runLookup() {
  lookupError.value = ''
  lookupResult.value = null
  const imei = normalizeImei(lookupInput.value)

  if (!imei) {
    lookupError.value = 'Vui lòng nhập mã IMEI.'
    return
  }
  if (!isValidImeiFormat(imei)) {
    lookupError.value = 'IMEI phải đủ 15 chữ số.'
    return
  }

  if (!useMock.value) {
    try {
      const result = await lookupWarranty(imei)
      if (result.warranty === null && result.message) {
        lookupError.value = result.message
        return
      }
      lookupResult.value = result
      return
    } catch {
      // fallback below
    }
  }

  const found = findWarrantyByImei(imei)
  if (!found) {
    lookupError.value = 'Không tìm thấy phiếu bảo hành cho IMEI này.'
    return
  }

  lookupResult.value = found
}

function openDetail(warranty) {
  selectedWarranty.value = warranty
}

function closeDetail() {
  selectedWarranty.value = null
}

function openRepairModal(warranty) {
  if (warranty) selectedWarranty.value = warranty
  repairForm.value = {
    imei: warranty?.imei ?? lookupInput.value ?? '',
    description: '',
    cost: 0,
  }
  showRepairModal.value = true
}

function closeRepairModal() {
  showRepairModal.value = false
}

function daysLabel(warranty) {
  if (warranty.daysRemaining < 0) return `Hết hạn ${Math.abs(warranty.daysRemaining)} ngày`
  if (warranty.daysRemaining <= 30) return `Còn ${warranty.daysRemaining} ngày`
  return `Còn ${warranty.daysRemaining} ngày`
}

function progressPercent(warranty) {
  const total = warranty.warrantyMonths * 30
  const used = total - Math.max(0, warranty.daysRemaining)
  return Math.min(100, Math.max(0, Math.round((used / total) * 100)))
}

async function handleSaveRepair() {
  repairError.value = ''
  const imei = normalizeImei(repairForm.value.imei || selectedWarranty.value?.imei || '')
  if (!repairForm.value.description?.trim()) {
    repairError.value = 'Vui lòng nhập mô tả sửa chữa.'
    return
  }
  savingRepair.value = true
  try {
    if (!useMock.value) {
      await createRepairByImei({
        imei,
        description: repairForm.value.description,
        cost: repairForm.value.cost || 0,
      })
      const data = await withApiFallback(fetchWarranties, () => ({ rows: mockRows, stats: mockStats }))
      warrantyRows.value = data.rows
      warrantyStats.value = data.stats
    }
    closeRepairModal()
  } catch (err) {
    repairError.value = err.response?.data?.message || 'Không thể lưu phiếu sửa.'
  } finally {
    savingRepair.value = false
  }
}

const statCards = computed(() => [
  {
    label: 'Còn hiệu lực',
    value: warrantyStats.value.active,
    hint: 'Phiếu bảo hành đang active',
    icon: 'shield',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
  },
  {
    label: 'Sắp hết hạn',
    value: warrantyStats.value.expiringSoon,
    hint: 'Trong 30 ngày tới',
    icon: 'shieldWarn',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
  },
  {
    label: 'Đang sửa chữa',
    value: warrantyStats.value.inRepair,
    hint: 'Máy đang tại quầy / TTBH',
    icon: 'wrench',
    iconColor: 'text-sky-600 bg-sky-50',
    valueClass: 'text-sky-600',
  },
  {
    label: 'Đã hết hạn',
    value: warrantyStats.value.expired,
    hint: 'Có thể tra cứu lịch sử',
    icon: 'shieldOff',
    iconColor: 'text-slate-600 bg-slate-50',
    valueClass: 'text-slate-500',
  },
])
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('warranty.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('warranty.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('warranty.hero.desc') }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
          @click="openRepairModal(null)"
        >
          + {{ locale.t('warranty.addRepair') }}
        </button>
      </div>
    </div>

    <!-- Tra cứu IMEI nhanh -->
    <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <p class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('warranty.lookup') }}</p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          v-model="lookupInput"
          type="text"
          inputmode="numeric"
          maxlength="17"
          :placeholder="locale.t('warranty.lookupPlaceholder')"
          class="flex-1 rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3.5 font-mono text-sm font-medium text-slate-700 outline-none focus:border-red-400"
          @keyup.enter="runLookup"
        />
        <button
          type="button"
          class="shrink-0 rounded-[16px] bg-red-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-red-700"
          @click="runLookup"
        >
          {{ locale.t('warranty.lookupBtn') }}
        </button>
      </div>
      <p v-if="lookupError" class="mt-3 text-sm font-semibold text-red-600">{{ lookupError }}</p>

      <div
        v-if="lookupResult"
        class="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50/50 p-5 ring-1 ring-emerald-100"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
              :class="warrantyStatusClass[getDisplayStatus(lookupResult)]"
            >
              {{ translateWarrantyStatus(getDisplayStatus(lookupResult)) }}
            </span>
            <h3 class="mt-3 text-xl font-black text-[#111118]">{{ lookupResult.productName }}</h3>
            <p class="text-sm text-slate-500">{{ lookupResult.variant }}</p>
            <p class="mt-2 font-mono text-sm font-semibold text-slate-600">IMEI: {{ lookupResult.imei }}</p>
          </div>
          <button
            type="button"
            class="rounded-[14px] bg-white px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
            @click="openDetail(lookupResult)"
          >
            Xem chi tiết
          </button>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-emerald-100">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Khách hàng</p>
            <p class="mt-1 font-semibold text-slate-700">{{ lookupResult.customerName }}</p>
            <p class="text-xs text-slate-500">{{ lookupResult.customerPhone }}</p>
          </div>
          <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-emerald-100">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Thời hạn</p>
            <p class="mt-1 text-sm font-semibold text-slate-700">
              {{ formatWarrantyDate(lookupResult.startDate) }} → {{ formatWarrantyDate(lookupResult.endDate) }}
            </p>
            <p class="text-xs font-semibold text-emerald-600">{{ daysLabel(lookupResult) }}</p>
          </div>
          <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-emerald-100">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Đơn mua</p>
            <p class="mt-1 font-semibold text-red-600">{{ lookupResult.orderCode }}</p>
            <p class="text-xs text-slate-500">{{ lookupResult.warrantyMonths }} tháng BH</p>
          </div>
        </div>
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
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="rounded-[24px] border border-red-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div class="grid flex-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.search') }}</label>
            <input
              v-model="keyword"
              type="text"
              placeholder="IMEI, mã BH, khách hàng, sản phẩm..."
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.status') }}</label>
            <select
              v-model="selectedStatus"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option v-for="opt in warrantyStatusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        <p class="text-sm text-slate-500">
          <span class="font-bold text-red-600">{{ filteredWarranties.length }}</span> phiếu bảo hành
        </p>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead class="border-b border-red-100 bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">Mã BH / IMEI</th>
              <th class="px-6 py-4">Sản phẩm</th>
              <th class="px-6 py-4">Khách hàng</th>
              <th class="px-6 py-4">Thời hạn</th>
              <th class="px-6 py-4">Trạng thái</th>
              <th class="px-6 py-4">Sửa chữa</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-red-100">
            <tr
              v-for="warranty in filteredWarranties"
              :key="warranty.id"
              class="cursor-pointer transition hover:bg-red-50/40"
              @click="openDetail(warranty)"
            >
              <td class="px-6 py-4">
                <p class="font-bold text-red-600">{{ warranty.code }}</p>
                <p class="mt-1 font-mono text-xs text-slate-500">{{ warranty.imei }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-700">{{ warranty.productName }}</p>
                <p class="text-xs text-slate-400">{{ warranty.variant }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-700">{{ warranty.customerName }}</p>
                <p class="text-xs text-slate-400">{{ warranty.customerPhone }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-slate-600">{{ formatWarrantyDate(warranty.endDate) }}</p>
                <p
                  class="text-xs font-semibold"
                  :class="warranty.daysRemaining <= 30 && warranty.daysRemaining >= 0 ? 'text-amber-600' : warranty.daysRemaining < 0 ? 'text-slate-400' : 'text-emerald-600'"
                >
                  {{ daysLabel(warranty) }}
                </p>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="warrantyStatusClass[getDisplayStatus(warranty)]"
                >
                  {{ translateWarrantyStatus(getDisplayStatus(warranty)) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600">
                <template v-if="warranty.repairs.length === 0">Chưa có</template>
                <template v-else-if="warranty.repairStatus === 'in_repair'">
                  <span class="font-semibold text-sky-600">{{ warranty.repairs.length }} lần · đang xử lý</span>
                </template>
                <template v-else>{{ warranty.repairs.length }} lần</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppEmptyState
        v-if="filteredWarranties.length === 0"
        icon="shield"
        :title="locale.t('common.noResults')"
      />
    </div>

    <AppSlideOver :open="!!selectedWarranty && !showRepairModal" @close="closeDetail">
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Phiếu bảo hành</p>
              <h3 class="mt-1 text-xl font-black text-[#111118]">{{ selectedWarranty.code }}</h3>
            </div>
            <button
              type="button"
              class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              @click="closeDetail"
            >
              Đóng
            </button>
          </div>
          <span
            class="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
            :class="warrantyStatusClass[getDisplayStatus(selectedWarranty)]"
          >
            {{ translateWarrantyStatus(getDisplayStatus(selectedWarranty)) }}
          </span>
        </div>

        <div class="space-y-6 p-6">
          <div class="rounded-[18px] bg-red-50/50 p-4 ring-1 ring-red-100">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Thiết bị</p>
            <p class="mt-2 font-bold text-[#111118]">{{ selectedWarranty.productName }}</p>
            <p class="text-sm text-slate-500">{{ selectedWarranty.variant }}</p>
            <p class="mt-2 font-mono text-sm text-slate-600">IMEI: {{ selectedWarranty.imei }}</p>
          </div>

          <div class="rounded-[18px] bg-red-50/50 p-4 ring-1 ring-red-100">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Khách hàng</p>
            <p class="mt-2 font-bold text-[#111118]">{{ selectedWarranty.customerName }}</p>
            <p class="text-sm text-slate-500">{{ selectedWarranty.customerPhone }}</p>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="font-semibold text-slate-600">Tiến độ bảo hành</span>
              <span class="text-xs font-bold text-slate-500">{{ selectedWarranty.warrantyMonths }} tháng</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-red-100">
              <div
                class="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
                :style="{ width: `${progressPercent(selectedWarranty)}%` }"
              ></div>
            </div>
            <div class="mt-2 flex justify-between text-xs text-slate-500">
              <span>{{ formatWarrantyDate(selectedWarranty.startDate) }}</span>
              <span class="font-semibold" :class="selectedWarranty.daysRemaining < 0 ? 'text-slate-400' : 'text-emerald-600'">
                {{ daysLabel(selectedWarranty) }}
              </span>
              <span>{{ formatWarrantyDate(selectedWarranty.endDate) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-[16px] bg-red-50/40 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Đơn mua</p>
              <p class="mt-1 font-semibold text-red-600">{{ selectedWarranty.orderCode }}</p>
            </div>
            <div class="rounded-[16px] bg-red-50/40 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Lần sửa</p>
              <p class="mt-1 font-semibold text-slate-700">{{ selectedWarranty.repairs.length }} lần</p>
            </div>
          </div>

          <div v-if="selectedWarranty.voidReason" class="rounded-[16px] bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
            {{ selectedWarranty.voidReason }}
          </div>

          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Lịch sử sửa chữa</p>
            <div v-if="selectedWarranty.repairs.length === 0" class="rounded-[16px] bg-red-50/40 px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-red-100">
              Chưa có lần sửa chữa nào.
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="repair in selectedWarranty.repairs"
                :key="repair.id"
                class="rounded-[16px] border border-red-100 bg-white p-4"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="font-semibold text-slate-700">{{ repair.description }}</p>
                  <span
                    v-if="repair.status === 'in_progress'"
                    class="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-sky-100"
                  >
                    Đang xử lý
                  </span>
                </div>
                <p class="mt-2 text-xs text-slate-500">{{ formatRepairTime(repair.repairedAt) }} · {{ repair.staffName }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-600">
                  Chi phí: {{ repair.cost === 0 ? 'Miễn phí (BH)' : formatCurrency(repair.cost) }}
                </p>
              </div>
            </div>
          </div>

          <button
            v-if="selectedWarranty.status !== 'void' && selectedWarranty.status !== 'expired'"
            type="button"
            class="w-full rounded-[14px] bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            @click="openRepairModal(selectedWarranty)"
          >
            Ghi nhận sửa chữa mới
          </button>
        </div>
    </AppSlideOver>

    <AppModal :open="showRepairModal" @close="closeRepairModal">
      <div class="w-full max-w-lg rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-black text-[#111118]">Tiếp nhận sửa chữa</h3>
          <p class="mt-1 text-sm text-slate-500">Ghi nhận lần sửa chữa mới cho thiết bị bảo hành</p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="repairError" class="text-sm font-semibold text-red-600">{{ repairError }}</p>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">IMEI thiết bị</label>
            <input
              v-model="repairForm.imei"
              type="text"
              inputmode="numeric"
              placeholder="Quét hoặc nhập IMEI 15 số"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 font-mono text-sm outline-none focus:border-red-400"
              :readonly="!!selectedWarranty"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Mô tả lỗi / sửa chữa</label>
            <textarea
              v-model="repairForm.description"
              rows="3"
              placeholder="Ví dụ: Màn hình nứt — thay linh kiện chính hãng"
              class="w-full resize-none rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm outline-none focus:border-red-400"
            ></textarea>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Chi phí (VND)</label>
            <AppMoneyInput
              v-model="repairForm.cost"
              placeholder="0 = miễn phí trong BH"
              input-class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm outline-none focus:border-red-400"
            />
          </div>
        </div>
        <div class="flex gap-3 border-t border-red-100 px-6 py-4">
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
            @click="closeRepairModal"
          >
            Hủy
          </button>
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            :disabled="savingRepair"
            @click="handleSaveRepair"
          >
            {{ savingRepair ? 'Đang lưu...' : 'Lưu phiếu sửa' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

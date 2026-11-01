<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import { fetchTransactions, createTransaction, fetchExpenseCategories } from '@/api/finance'
import { downloadCsv } from '@/utils/exportCsv'
import { useTranslatedOptions } from '@/composables/useTranslatedOptions'
import {
  categoryLabels,
  expenseCategories as mockExpenseCategories,
  financeStats as mockStats,
  formatCurrency,
  formatTransactionTime,
  paymentMethodLabels,
  referenceTypeLabels,
  signedAmount,
  transactionCategoryOptions,
  transactionRows as mockRows,
  transactionTypeClass,
} from '@/mocks/financeMock'

const { locale, transactionTypeOptions, translateFinanceType } = useTranslatedOptions()

const keyword = ref('')
const selectedType = ref('all')
const selectedCategory = ref('all')
const selectedPeriod = ref('month')
const selectedTransaction = ref(null)
const showAddModal = ref(false)
const addFormType = ref('expense')
const transactionRows = ref([...mockRows])
const financeStats = ref({ ...mockStats })
const expenseCategoryList = ref([...mockExpenseCategories])
const saving = ref(false)
const formError = ref('')
const loading = ref(false)
const loadError = ref('')
const currentPage = ref(1)
const paginationMeta = ref(null)

const newEntry = ref({
  categoryId: 2,
  amount: '',
  paymentMethod: 'transfer',
  description: '',
  transactedAt: new Date().toISOString().slice(0, 10),
})

const filteredTransactions = computed(() => transactionRows.value)

const periodSummary = computed(() => {
  let income = 0
  let expense = 0
  filteredTransactions.value.forEach((tx) => {
    if (tx.type === 'income') income += tx.amount
    else expense += tx.amount
  })
  return { income, expense, net: income - expense }
})

const totalPages = computed(() => paginationMeta.value?.last_page ?? 1)
const totalRows = computed(() => paginationMeta.value?.total ?? filteredTransactions.value.length)

function buildQueryParams(page = currentPage.value) {
  return {
    page,
    per_page: 50,
    search: keyword.value.trim() || undefined,
    type: selectedType.value !== 'all' ? selectedType.value : undefined,
    category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
    period: selectedPeriod.value !== 'all' ? selectedPeriod.value : undefined,
  }
}

function openDetail(tx) {
  selectedTransaction.value = tx
}

async function loadTransactions(page = 1) {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchTransactions(buildQueryParams(page))
    transactionRows.value = data.rows ?? []
    if (data.stats) financeStats.value = data.stats
    paginationMeta.value = data.meta
    currentPage.value = page
  } catch (err) {
    transactionRows.value = []
    loadError.value =
      err.response?.data?.message ||
      (err.response?.status === 403
        ? 'Bạn không có quyền xem thu chi. Chỉ tài khoản admin được truy cập.'
        : 'Không tải được sổ quỹ. Kiểm tra backend đang chạy và đăng nhập lại.')
  } finally {
    loading.value = false
  }
}

async function handleSaveEntry() {
  const amount = Number(newEntry.value.amount)
  if (!amount || amount <= 0) {
    formError.value = 'Vui lòng nhập số tiền hợp lệ.'
    return
  }

  saving.value = true
  formError.value = ''
  try {
    await createTransaction({
      type: addFormType.value,
      amount,
      payment_method: newEntry.value.paymentMethod,
      category_id: addFormType.value === 'expense' ? newEntry.value.categoryId : undefined,
      description: newEntry.value.description,
      transacted_at: newEntry.value.transactedAt,
    })
    showAddModal.value = false
    await loadTransactions(1)
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thể lưu phiếu.'
  } finally {
    saving.value = false
  }
}

async function exportTransactions() {
  let allRows = []
  let page = 1
  let lastPage = 1

  try {
    do {
      const data = await fetchTransactions({ ...buildQueryParams(page), per_page: 200 })
      allRows = allRows.concat(data.rows)
      lastPage = data.meta?.last_page ?? 1
      page += 1
    } while (page <= lastPage)
  } catch {
    allRows = filteredTransactions.value
  }

  if (!allRows.length) return

  downloadCsv('thu-chi.csv', allRows, [
    { label: 'Mã phiếu', value: (r) => r.code },
    { label: 'Loại', value: (r) => (r.type === 'income' ? 'Thu' : 'Chi') },
    { label: 'Danh mục', value: (r) => categoryLabels[r.category] ?? r.categoryName },
    { label: 'Mô tả', value: (r) => r.description },
    { label: 'Chứng từ', value: (r) => r.referenceCode ?? referenceTypeLabels[r.referenceType] },
    { label: 'Nguồn', value: (r) => (r.isAuto ? 'Tự động' : 'Thủ công') },
    { label: 'Số tiền', value: (r) => r.amount },
    { label: 'Thanh toán', value: (r) => paymentMethodLabels[r.paymentMethod] ?? r.paymentMethod },
    { label: 'Nhân viên', value: (r) => r.staffName },
    { label: 'Thời gian', value: (r) => r.transactedAt },
  ])
}

function resetEntryForm(type) {
  addFormType.value = type
  const firstExpenseCat = expenseCategoryList.value.find((c) => c.type !== 'import')
  newEntry.value = {
    categoryId: firstExpenseCat?.id ?? 2,
    amount: '',
    paymentMethod: 'transfer',
    description: '',
    transactedAt: new Date().toISOString().slice(0, 10),
  }
  formError.value = ''
}

function openAddForm(type) {
  resetEntryForm(type)
  showAddModal.value = true
}

function closeDetail() {
  selectedTransaction.value = null
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  loadTransactions(page)
}

let searchTimer
watch([selectedType, selectedCategory, selectedPeriod], () => {
  loadTransactions(1)
})

watch(keyword, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTransactions(1), 350)
})

onMounted(async () => {
  await loadTransactions()
  try {
    const cats = await fetchExpenseCategories()
    if (cats.length) expenseCategoryList.value = cats
  } catch {
    expenseCategoryList.value = [...mockExpenseCategories]
  }
})

const statCards = computed(() => [
  {
    label: locale.t('finance.stats.incomeToday'),
    value: formatCurrency(financeStats.value.incomeToday),
    hint: 'Từ đơn bán hoàn tất + thu thủ công',
    icon: 'income',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
    valueSize: 'md',
  },
  {
    label: locale.t('finance.stats.expenseToday'),
    value: formatCurrency(financeStats.value.expenseToday),
    hint: 'Nhập hàng + vận hành',
    icon: 'expense',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-red-600',
    valueSize: 'md',
  },
  {
    label: locale.t('finance.stats.netToday'),
    value: formatCurrency(financeStats.value.netToday),
    hint: 'Thu − Chi trong ngày',
    icon: 'net',
    iconColor: financeStats.value.netToday >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50',
    valueClass: financeStats.value.netToday >= 0 ? 'text-emerald-600' : 'text-red-600',
    valueSize: 'md',
  },
  {
    label: locale.t('finance.stats.monthNet'),
    value: formatCurrency(financeStats.value.balanceMonth),
    hint: `Thu ${formatCurrency(financeStats.value.incomeMonth)}`,
    icon: 'calendar',
    iconColor: 'text-violet-600 bg-violet-50',
    valueClass: 'text-[#111118]',
    valueSize: 'md',
  },
])
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div
      v-if="loadError"
      class="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100"
    >
      {{ loadError }}
    </div>

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('finance.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('finance.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('finance.hero.desc') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-[16px] bg-white/95 px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-white"
            @click="openAddForm('income')"
          >
            + {{ locale.t('finance.addIncome') }}
          </button>
          <button
            type="button"
            class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
            @click="openAddForm('expense')"
          >
            + {{ locale.t('finance.addExpense') }}
          </button>
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
        value-size="md"
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
              :placeholder="locale.t('finance.searchPlaceholder')"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Loại</label>
            <select
              v-model="selectedType"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option v-for="opt in transactionTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Danh mục</label>
            <select
              v-model="selectedCategory"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option v-for="opt in transactionCategoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex rounded-[14px] bg-red-50/60 p-1 ring-1 ring-red-100">
            <button
              v-for="p in [
                { v: 'today', l: 'Hôm nay' },
                { v: 'week', l: 'Tuần này' },
                { v: 'month', l: 'Tháng này' },
                { v: 'all', l: 'Tất cả' },
              ]"
              :key="p.v"
              type="button"
              class="rounded-[10px] px-3 py-2 text-xs font-semibold transition"
              :class="selectedPeriod === p.v ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'"
              @click="selectedPeriod = p.v"
            >
              {{ p.l }}
            </button>
          </div>
          <button
            type="button"
            class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50"
            :disabled="filteredTransactions.length === 0"
            @click="exportTransactions"
          >
            {{ locale.t('common.exportExcel') }}
          </button>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-4 rounded-[16px] bg-red-50/40 px-4 py-3 text-sm ring-1 ring-red-100">
        <span class="text-slate-500">
          Kết quả lọc:
          <strong class="text-emerald-600">{{ formatCurrency(periodSummary.income) }}</strong> thu ·
          <strong class="text-red-600">{{ formatCurrency(periodSummary.expense) }}</strong> chi ·
          <strong :class="periodSummary.net >= 0 ? 'text-emerald-600' : 'text-red-600'">
            {{ formatCurrency(periodSummary.net) }}
          </strong>
          còn lại
        </span>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="border-b border-red-100 px-6 py-4">
        <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('finance.listTitle') }}</h3>
        <p class="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-500">
          <span>{{ totalRows }} dòng · bấm để xem chi tiết</span>
          <AppInlineLoader v-if="loading" size="xs" inline class="ml-0.5" />
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[1000px] w-full text-left text-sm">
          <thead class="bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">Mã phiếu</th>
              <th class="px-6 py-4">Loại</th>
              <th class="px-6 py-4">Danh mục</th>
              <th class="px-6 py-4">Mô tả</th>
              <th class="px-6 py-4">Chứng từ</th>
              <th class="px-6 py-4 text-right">Số tiền</th>
              <th class="px-6 py-4">Thanh toán</th>
              <th class="px-6 py-4">Thời gian</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-red-100">
            <tr
              v-for="tx in filteredTransactions"
              :key="tx.id"
              class="cursor-pointer transition hover:bg-red-50/40"
              @click="openDetail(tx)"
            >
              <td class="px-6 py-4">
                <p class="font-bold text-[#111118]">{{ tx.code }}</p>
                <p class="text-xs text-slate-400">{{ tx.staffName }}</p>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="transactionTypeClass[tx.type]"
                >
                  {{ translateFinanceType(tx.type) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ categoryLabels[tx.category] ?? tx.categoryName }}</td>
              <td class="max-w-[200px] px-6 py-4">
                <p class="truncate text-slate-600">{{ tx.description }}</p>
              </td>
              <td class="px-6 py-4">
                <p v-if="tx.referenceCode" class="font-medium text-red-600">{{ tx.referenceCode }}</p>
                <p v-else class="text-slate-400">{{ referenceTypeLabels[tx.referenceType] ?? tx.referenceType }}</p>
                <p v-if="tx.isAuto" class="text-[10px] font-semibold uppercase text-slate-400">Tự động</p>
              </td>
              <td class="px-6 py-4 text-right font-bold" :class="tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'">
                {{ signedAmount(tx.type, tx.amount) }}
              </td>
              <td class="px-6 py-4 text-slate-600">{{ paymentMethodLabels[tx.paymentMethod] }}</td>
              <td class="px-6 py-4 text-slate-500">{{ formatTransactionTime(tx.transactedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="filteredTransactions.length === 0 && !loading"
        icon="search"
        :title="locale.t('finance.emptyFilter')"
      />

      <div
        v-if="totalPages > 1"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-red-100 px-6 py-4"
      >
        <p class="text-sm text-slate-500">
          Trang {{ currentPage }} / {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-[12px] px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-red-100 hover:bg-red-50 disabled:opacity-40"
            :disabled="currentPage <= 1 || loading"
            @click="goToPage(currentPage - 1)"
          >
            Trước
          </button>
          <button
            type="button"
            class="rounded-[12px] px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-red-100 hover:bg-red-50 disabled:opacity-40"
            :disabled="currentPage >= totalPages || loading"
            @click="goToPage(currentPage + 1)"
          >
            Sau
          </button>
        </div>
      </div>
    </div>

    <AppSlideOver v-if="selectedTransaction" :open="!!selectedTransaction" @close="closeDetail">
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Chi tiết phiếu</p>
              <h3 class="mt-1 text-xl font-black text-[#111118]">{{ selectedTransaction.code }}</h3>
              <span
                class="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                :class="transactionTypeClass[selectedTransaction.type]"
              >
                {{ locale.t(`finance.${selectedTransaction.type}`) }}
              </span>
            </div>
            <button
              type="button"
              class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              @click="closeDetail"
            >
              Đóng
            </button>
          </div>
        </div>

        <div class="space-y-6 p-6">
          <div
            class="rounded-[20px] p-5 text-center"
            :class="selectedTransaction.type === 'income' ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'bg-red-50 ring-1 ring-red-100'"
          >
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Số tiền</p>
            <p
              class="mt-2 text-3xl font-black"
              :class="selectedTransaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ signedAmount(selectedTransaction.type, selectedTransaction.amount) }}
            </p>
          </div>

          <div class="space-y-3 rounded-[18px] bg-red-50/40 p-4 ring-1 ring-red-100 text-sm">
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Danh mục</span>
              <span class="font-semibold text-slate-700">{{ selectedTransaction.categoryName }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Thanh toán</span>
              <span class="font-semibold text-slate-700">{{ paymentMethodLabels[selectedTransaction.paymentMethod] }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Nguồn</span>
              <span class="font-semibold text-slate-700">
                {{ selectedTransaction.isAuto ? 'Tự động' : 'Thủ công' }}
                · {{ referenceTypeLabels[selectedTransaction.referenceType] ?? selectedTransaction.referenceType }}
              </span>
            </div>
            <div v-if="selectedTransaction.referenceCode" class="flex justify-between gap-3">
              <span class="text-slate-500">Chứng từ</span>
              <span class="font-bold text-red-600">{{ selectedTransaction.referenceCode }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Nhân viên</span>
              <span class="font-semibold text-slate-700">{{ selectedTransaction.staffName }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Thời gian</span>
              <span class="font-semibold text-slate-700">{{ formatTransactionTime(selectedTransaction.transactedAt) }}</span>
            </div>
          </div>

          <div class="rounded-[16px] border border-red-100 bg-white p-4">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Mô tả</p>
            <p class="mt-2 text-sm text-slate-700">{{ selectedTransaction.description || '—' }}</p>
          </div>
        </div>
    </AppSlideOver>

    <AppModal :open="showAddModal" @close="showAddModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-bold text-[#111118]">
            {{ addFormType === 'income' ? 'Tạo phiếu thu thủ công' : 'Tạo phiếu chi thủ công' }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ addFormType === 'income' ? 'Ghi nhận thu khác (hoàn tiền, thu nợ, v.v.)' : 'Ghi nhận chi phí vận hành, lương, điện nước...' }}
          </p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-600">{{ formError }}</p>
          <div v-if="addFormType === 'expense'">
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Loại chi phí</label>
            <select
              v-model="newEntry.categoryId"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            >
              <option v-for="cat in expenseCategoryList.filter((c) => c.type !== 'import')" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số tiền</label>
            <AppMoneyInput
              v-model="newEntry.amount"
              :hide-zero="false"
              placeholder="3.200.000"
              input-class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Hình thức thanh toán</label>
            <select
              v-model="newEntry.paymentMethod"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            >
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="ewallet">Ví điện tử</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
              {{ addFormType === 'income' ? 'Ngày thu' : 'Ngày chi' }}
            </label>
            <input
              v-model="newEntry.transactedAt"
              type="date"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Mô tả</label>
            <textarea
              v-model="newEntry.description"
              rows="2"
              :placeholder="addFormType === 'income' ? 'Ví dụ: Thu nợ khách hàng...' : 'Ví dụ: Tiền điện tháng 6...'"
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
            class="flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            :class="addFormType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'"
            :disabled="saving"
            @click="handleSaveEntry"
          >
            {{ saving ? 'Đang lưu...' : (addFormType === 'income' ? 'Lưu phiếu thu' : 'Lưu phiếu chi') }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

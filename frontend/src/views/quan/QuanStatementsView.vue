<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import QuanStatementSheet from '@/components/quan/QuanStatementSheet.vue'
import {
  deleteQuanStatement,
  fetchQuanStatement,
  fetchQuanStatements,
  saveQuanStatement,
} from '@/api/quan'
import { formatCurrency } from '@/mocks/financeMock'
import { downloadElementAsPng } from '@/utils/saveAsImage'

const rows = ref([])
const loading = ref(false)
const loadError = ref('')
const flash = ref('')
const saving = ref(false)
const savingImage = ref(false)
const statementSheetRef = ref(null)

const monthFilter = ref(currentMonthValue())
const selectedId = ref(null)
const selected = ref(null)
const loadingDetail = ref(false)

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = computed(() => {
  const [y, m] = monthFilter.value.split('-')
  if (!y || !m) return monthFilter.value
  return `Tháng ${Number(m)}/${y}`
})

function formatDateVi(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function showFlash(message) {
  flash.value = message
  clearTimeout(showFlash._t)
  showFlash._t = setTimeout(() => {
    flash.value = ''
  }, 2800)
}

async function loadList() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchQuanStatements({ month: monthFilter.value, per_page: 100 })
    rows.value = data.rows ?? []
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không tải được kho sao kê.'
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  selectedId.value = row.id
  loadingDetail.value = true
  try {
    selected.value = await fetchQuanStatement(row.id)
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không mở được sao kê.'
    selected.value = null
  } finally {
    loadingDetail.value = false
  }
}

function closeDetail() {
  selectedId.value = null
  selected.value = null
}

async function saveToday() {
  saving.value = true
  loadError.value = ''
  try {
    const { data } = await saveQuanStatement({ force: true })
    showFlash(data?.message || 'Đã lưu sao kê hôm nay')
    await loadList()
    if (data?.data?.id) {
      await openDetail(data.data)
    }
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không lưu được sao kê.'
  } finally {
    saving.value = false
  }
}

async function refreshSelected() {
  if (!selected.value?.statementDate) return
  saving.value = true
  try {
    const { data } = await saveQuanStatement({
      statement_date: selected.value.statementDate,
      force: true,
    })
    showFlash(data?.message || 'Đã cập nhật sao kê')
    await loadList()
    if (data?.data?.id) await openDetail(data.data)
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không cập nhật được.'
  } finally {
    saving.value = false
  }
}

async function removeRow(row) {
  if (!confirm(`Xóa sao kê ngày ${formatDateVi(row.statementDate)}?`)) return
  try {
    await deleteQuanStatement(row.id)
    if (selectedId.value === row.id) closeDetail()
    showFlash('Đã xóa sao kê')
    await loadList()
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không xóa được.'
  }
}

function printSelected() {
  if (!selected.value) return
  document.body.classList.add('printing-quan-statement')
  const cleanup = () => {
    document.body.classList.remove('printing-quan-statement')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.setTimeout(() => {
    window.print()
    window.setTimeout(cleanup, 1000)
  }, 50)
}

async function saveSelectedImage() {
  const el = statementSheetRef.value
  if (!el || !selected.value) return
  savingImage.value = true
  loadError.value = ''
  try {
    const d = selected.value.statementDate || 'sao-ke'
    await downloadElementAsPng(el, `sao-ke-${d}`)
    showFlash('Đã tải ảnh sao kê về máy')
  } catch (err) {
    loadError.value = err.message || 'Không lưu được ảnh.'
  } finally {
    savingImage.value = false
  }
}

watch(monthFilter, loadList)
onMounted(loadList)
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6 lg:p-8">
    <AppContentBreadcrumb />

    <div
      v-if="loadError"
      class="no-print rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      {{ loadError }}
    </div>
    <div
      v-if="flash"
      class="no-print rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
    >
      {{ flash }}
    </div>

    <div class="no-print flex flex-wrap items-start justify-between gap-3 rounded-[20px] border border-red-200 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] sm:p-5">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-red-600">Báo cáo · Sao kê</p>
        <h2 class="mt-1 text-xl font-black text-[#111118]">Sao kê theo ngày</h2>
        <p class="mt-1 max-w-xl text-sm text-slate-500">
          Mỗi ngày một bản sao kê đã chốt — xem lại, in hoặc lưu ảnh bất cứ lúc nào.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          :to="{ name: 'reports' }"
          class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Về báo cáo
        </RouterLink>
        <button
          type="button"
          class="rounded-[12px] bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          :disabled="saving"
          @click="saveToday"
        >
          {{ saving ? 'Đang lưu...' : 'Lưu sao kê hôm nay' }}
        </button>
      </div>
    </div>

    <div class="no-print grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
      <!-- Danh sách theo ngày -->
      <aside class="rounded-[20px] border border-amber-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="border-b border-amber-100 px-4 py-3">
          <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Tháng</label>
          <input
            v-model="monthFilter"
            type="month"
            class="w-full rounded-[12px] border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400"
          />
          <p class="mt-2 text-xs text-slate-500">{{ monthLabel }} · {{ rows.length }} bản</p>
        </div>

        <AppInlineLoader v-if="loading" size="sm" message="Đang tải..." class="m-4" />
        <AppEmptyState
          v-else-if="!rows.length"
          size="sm"
          title="Chưa có sao kê"
          description="Bấm Lưu sao kê hôm nay sau khi đã bán / ghi chi."
          class="m-2"
        />
        <ul v-else class="max-h-[70vh] space-y-1 overflow-y-auto p-2">
          <li v-for="row in rows" :key="row.id">
            <button
              type="button"
              class="flex w-full items-start justify-between gap-2 rounded-[14px] px-3 py-3 text-left transition"
              :class="
                selectedId === row.id
                  ? 'bg-amber-100 ring-1 ring-amber-300'
                  : 'hover:bg-amber-50/80'
              "
              @click="openDetail(row)"
            >
              <div class="min-w-0">
                <p class="font-bold text-[#111118]">{{ formatDateVi(row.statementDate) }}</p>
                <p class="mt-0.5 font-mono text-[10px] text-slate-400">{{ row.code }}</p>
                <p class="mt-1 text-[11px] text-slate-500">
                  {{ row.rowCount }} GD · TM {{ formatCurrency(row.cashTotal) }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p
                  class="text-sm font-black tabular-nums"
                  :class="row.netTotal >= 0 ? 'text-emerald-700' : 'text-red-600'"
                >
                  {{ formatCurrency(row.netTotal) }}
                </p>
                <p class="text-[10px] text-slate-400">còn lại</p>
              </div>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Chi tiết -->
      <section class="min-w-0 rounded-[20px] border border-amber-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <template v-if="selected">
          <div class="no-print flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 px-4 py-3">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700">Bản đã lưu</p>
              <h3 class="text-lg font-black text-[#111118]">
                Ngày {{ formatDateVi(selected.statementDate) }}
              </h3>
              <p class="text-xs text-slate-500">
                Lưu lúc {{ formatDateTime(selected.updatedAt || selected.createdAt) }}
                <span v-if="selected.staffName"> · {{ selected.staffName }}</span>
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                :disabled="saving"
                @click="refreshSelected"
              >
                Cập nhật lại
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
                :disabled="savingImage"
                @click="saveSelectedImage"
              >
                {{ savingImage ? 'Đang tạo...' : 'Lưu ảnh' }}
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-[#111118] px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                @click="printSelected"
              >
                In lại
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                @click="removeRow(selected)"
              >
                Xóa
              </button>
              <button
                type="button"
                class="rounded-[12px] px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                @click="closeDetail"
              >
                Đóng
              </button>
            </div>
          </div>

          <div class="bg-slate-50/80 p-3 sm:p-5">
            <div class="no-print mb-4 grid gap-2 sm:grid-cols-4">
              <div class="rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-emerald-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thu</p>
                <p class="mt-0.5 font-bold tabular-nums text-emerald-700">{{ formatCurrency(selected.incomeTotal) }}</p>
              </div>
              <div class="rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-emerald-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiền mặt</p>
                <p class="mt-0.5 font-bold tabular-nums text-emerald-800">{{ formatCurrency(selected.cashTotal) }}</p>
              </div>
              <div class="rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-sky-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chuyển khoản</p>
                <p class="mt-0.5 font-bold tabular-nums text-sky-700">{{ formatCurrency(selected.transferTotal) }}</p>
              </div>
              <div class="rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-red-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chi</p>
                <p class="mt-0.5 font-bold tabular-nums text-red-600">{{ formatCurrency(selected.expenseTotal) }}</p>
              </div>
            </div>

            <div ref="statementSheetRef" class="rounded-[16px] border border-slate-200 bg-white p-4 sm:p-6">
              <QuanStatementSheet
                class="quan-print-target"
                :rows="selected.rowsSnapshot || []"
                :period-label="`Ngày ${formatDateVi(selected.statementDate)}`"
                :period-from="formatDateVi(selected.statementDate)"
                :period-to="formatDateVi(selected.statementDate)"
                :staff-name="selected.staffName || ''"
                :report-code="selected.code"
                :archived-at="selected.updatedAt || selected.createdAt"
              />
            </div>
          </div>
        </template>

        <AppInlineLoader
          v-else-if="loadingDetail"
          block
          size="md"
          message="Đang mở sao kê..."
          class="m-6"
        />
        <AppEmptyState
          v-else
          class="m-6"
          title="Chọn một ngày"
          description="Bấm vào sao kê bên trái để xem bảng chi tiết và in lại."
        />
      </section>
    </div>
  </div>
</template>

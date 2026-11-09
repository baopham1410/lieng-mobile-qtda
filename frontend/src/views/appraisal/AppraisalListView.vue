<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import {
  APPRAISAL_BRANDS,
  APPRAISAL_MODELS,
  APPRAISAL_STATUSES,
  APPRAISAL_STORAGES,
  HARDWARE_TESTS,
  PHOTO_SLOTS,
  appraisalStatusClass,
  computeAppraisalStats,
  emptyAppraisalForm,
  formatAppraisalDate,
  formatCurrency,
  getAppraisalRows,
  gradeClass,
  gradeLabel,
  mockAutoGradeSuggest,
  nextAppraisalCode,
  photosMetaFromForm,
  saveAppraisalRows,
  statusLabel,
} from '@/mocks/appraisalMock'

const keyword = ref('')
const selectedStatus = ref('all')
const rows = ref([])
const stats = ref({ total: 0, draft: 0, quoted: 0, accepted: 0 })
const selected = ref(null)
const showForm = ref(false)
const editingId = ref(null)
const form = ref(emptyAppraisalForm())
const formError = ref('')
const saving = ref(false)
const aiBusy = ref(false)
const customModel = ref('')
const formStep = ref(1)

const modelOptions = computed(() => APPRAISAL_MODELS[form.value.brand] || APPRAISAL_MODELS.Khác)

watch(
  () => form.value.brand,
  () => {
    const opts = APPRAISAL_MODELS[form.value.brand] || []
    if (!opts.includes(form.value.model)) {
      form.value.model = opts[0] || ''
    }
  },
)

const filteredRows = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const hay = [
      row.code,
      row.ticketQr,
      row.customerName,
      row.customerPhone,
      row.brand,
      row.model,
      row.storage,
      row.imei,
      row.aiResult?.grade,
    ]
      .join(' ')
      .toLowerCase()
    const matchQ = !q || hay.includes(q.replace(/\s/g, '')) || hay.includes(q)
    const matchStatus = selectedStatus.value === 'all' || row.status === selectedStatus.value
    return matchQ && matchStatus
  })
})

const photoReadyCount = computed(
  () => PHOTO_SLOTS.filter((s) => form.value.photos?.[s.key]).length,
)

const aiResult = computed(() => form.value.aiResult)

const deductionTotal = computed(() =>
  (aiResult.value?.deductions || []).reduce((s, d) => s + (d.amount || 0), 0),
)

const statCards = computed(() => [
  {
    label: 'Tổng phiếu',
    value: stats.value.total,
    hint: 'Phiếu thẩm định AutoGrade',
    icon: 'orders',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: 'Nháp',
    value: stats.value.draft,
    hint: 'Chưa chạy / chưa báo giá',
    icon: 'draft',
    iconColor: 'text-slate-600 bg-slate-50',
    valueClass: 'text-slate-600',
  },
  {
    label: 'Đã báo giá',
    value: stats.value.quoted,
    hint: 'Có FinalPrice',
    icon: 'avg',
    iconColor: 'text-amber-600 bg-amber-50',
    valueClass: 'text-amber-600',
  },
  {
    label: 'Đã chốt',
    value: stats.value.accepted,
    hint: 'Khách đồng ý thu máy',
    icon: 'income',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
  },
])

function refreshStats() {
  stats.value = computeAppraisalStats(rows.value)
}

function loadRows() {
  rows.value = getAppraisalRows()
  refreshStats()
}

function resolvedModel() {
  if (form.value.model === 'Khác (nhập tay)' || form.value.brand === 'Khác') {
    return customModel.value.trim() || form.value.model
  }
  return form.value.model
}

function openCreate() {
  editingId.value = null
  form.value = emptyAppraisalForm()
  customModel.value = ''
  formError.value = ''
  formStep.value = 1
  showForm.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    customerName: row.customerName || '',
    customerPhone: row.customerPhone || '',
    brand: row.brand || 'Apple',
    model: row.model || '',
    storage: row.storage || '256GB',
    imei: row.imei || '',
    accessoriesNote: row.accessoriesNote || '',
    photos: {
      front: null,
      back: null,
      side: null,
      battery: null,
      ...(row.photos || {}),
    },
    hardware: { ...emptyAppraisalForm().hardware, ...(row.hardware || {}) },
    aiResult: row.aiResult ? structuredClone(row.aiResult) : emptyAppraisalForm().aiResult,
    finalPrice: row.finalPrice || 0,
    status: row.status || 'draft',
  }
  customModel.value =
    row.model && !(APPRAISAL_MODELS[row.brand] || []).includes(row.model) ? row.model : ''
  formError.value = ''
  formStep.value = 1
  showForm.value = true
}

function openDetail(row) {
  selected.value = row
}

function closeDetail() {
  selected.value = null
}

function onPickPhoto(slotKey, event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    formError.value = 'Chỉ chấp nhận file ảnh.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form.value.photos[slotKey] = {
      name: file.name,
      dataUrl: String(reader.result),
    }
    // Reset AI khi đổi ảnh
    if (form.value.aiResult?.ran) {
      form.value.aiResult = {
        ...emptyAppraisalForm().aiResult,
        note: 'Ảnh đã đổi — chạy lại AutoGrade AI.',
      }
    }
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function clearPhoto(slotKey) {
  form.value.photos[slotKey] = null
}

async function runAutoGrade() {
  formError.value = ''
  if (!resolvedModel()) {
    formError.value = 'Chọn hoặc nhập model máy.'
    return
  }
  aiBusy.value = true
  await new Promise((r) => setTimeout(r, 900))
  const payload = {
    ...form.value,
    model: resolvedModel(),
  }
  const result = mockAutoGradeSuggest(payload)
  aiBusy.value = false
  if (!result.ok) {
    formError.value = result.message
    formStep.value = 2
    return
  }
  form.value.aiResult = result.aiResult
  form.value.finalPrice = result.aiResult.suggestedPrice
  // Đồng bộ OCR → form nếu có
  if (result.aiResult.ocr?.model) form.value.model = result.aiResult.ocr.model
  if (result.aiResult.ocr?.rom) form.value.storage = result.aiResult.ocr.rom
  formStep.value = 4
}

function saveTicket() {
  formError.value = ''
  const model = resolvedModel()
  if (!model) {
    formError.value = 'Vui lòng chọn hoặc nhập model.'
    return
  }

  saving.value = true
  try {
    const payload = {
      customerName: form.value.customerName.trim(),
      customerPhone: form.value.customerPhone.trim(),
      brand: form.value.brand,
      model,
      storage: form.value.storage,
      imei: form.value.imei.trim(),
      accessoriesNote: form.value.accessoriesNote.trim(),
      hardware: { ...form.value.hardware },
      photosMeta: photosMetaFromForm(form.value.photos),
      aiResult: structuredClone(form.value.aiResult),
      finalPrice: Number(form.value.finalPrice) || 0,
      status: form.value.status,
      staffName: 'Nhân viên demo',
    }

    if (editingId.value) {
      rows.value = rows.value.map((r) =>
        r.id === editingId.value
          ? {
              ...r,
              ...payload,
              ticketQr: r.ticketQr || `AG-${r.code}`,
            }
          : r,
      )
    } else {
      const id = Math.max(0, ...rows.value.map((r) => r.id)) + 1
      const code = nextAppraisalCode(rows.value)
      rows.value = [
        {
          id,
          code,
          ticketQr: `AG-${code}`,
          createdAt: new Date().toISOString(),
          ...payload,
        },
        ...rows.value,
      ]
    }

    saveAppraisalRows(rows.value)
    refreshStats()
    showForm.value = false
    if (selected.value && editingId.value === selected.value.id) {
      selected.value = rows.value.find((r) => r.id === editingId.value) || null
    }
  } finally {
    saving.value = false
  }
}

function setStatus(row, status) {
  rows.value = rows.value.map((r) => (r.id === row.id ? { ...r, status } : r))
  saveAppraisalRows(rows.value)
  refreshStats()
  if (selected.value?.id === row.id) {
    selected.value = rows.value.find((r) => r.id === row.id) || null
  }
}

function photoCountLabel(row) {
  const m = row.photosMeta || {}
  const n = PHOTO_SLOTS.filter((s) => m[s.key]).length
  return `${n}/${PHOTO_SLOTS.length} ảnh`
}

onMounted(loadRows)
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div
      class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">AutoGrade AI · Thu máy</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">Thẩm định & định giá</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            Quy trình O2O: chụp 3 góc + màn Pin → YOLO/OCR → công thức khấu hao → FinalPrice & mã QR phiếu.
            AI thật gắn FastAPI sau; UI đã đúng INPUT/OUTPUT đề tài.
          </p>
        </div>
        <button
          type="button"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
          @click="openCreate"
        >
          + Tạo phiếu thẩm định
        </button>
      </div>
    </div>

    <div
      class="flex items-start gap-3 rounded-[20px] border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-950"
    >
      <span
        class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200 text-[10px] font-black"
      >
        AI
      </span>
      <div>
        <p class="font-bold">Pipeline đề tài: YOLOv8 · PaddleOCR · Valuation Engine</p>
        <p class="mt-0.5 text-violet-900/80">
          INPUT: ảnh ngoại quan + ảnh Pin/Giới thiệu + checklist nội vi. OUTPUT: hạng máy, bbox lỗi, % pin,
          breakdown khấu hao, FinalPrice.
          <span class="font-semibold">Nút chạy AI đang trả kết quả MOCK</span> — chưa gọi server train.
        </p>
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
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Tìm kiếm</label>
            <input
              v-model="keyword"
              type="text"
              placeholder="Mã phiếu, QR, khách, model, hạng..."
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Trạng thái</label>
            <select
              v-model="selectedStatus"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
            >
              <option value="all">Tất cả</option>
              <option v-for="s in APPRAISAL_STATUSES" :key="s.key" :value="s.key">{{ s.label }}</option>
            </select>
          </div>
        </div>
        <p class="text-sm text-slate-500">
          <span class="font-bold text-red-600">{{ filteredRows.length }}</span> phiếu
        </p>
      </div>
    </div>

    <div
      v-if="!filteredRows.length"
      class="rounded-[24px] border border-red-200 bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
    >
      <AppEmptyState
        title="Chưa có phiếu thẩm định"
        description="Tạo phiếu: upload ảnh → test nội vi → chạy AutoGrade → lưu FinalPrice."
      >
        <template #action>
          <button
            type="button"
            class="rounded-[14px] bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            @click="openCreate"
          >
            + Tạo phiếu
          </button>
        </template>
      </AppEmptyState>
    </div>

    <div
      v-else
      class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1080px] text-left text-sm">
          <thead class="border-b border-red-100 bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">Mã / QR</th>
              <th class="px-6 py-4">Máy</th>
              <th class="px-6 py-4">Ảnh / AI</th>
              <th class="px-6 py-4">Hạng</th>
              <th class="px-6 py-4">FinalPrice</th>
              <th class="px-6 py-4">Trạng thái</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-red-50">
            <tr
              v-for="row in filteredRows"
              :key="row.id"
              class="cursor-pointer transition hover:bg-red-50/40"
              @click="openDetail(row)"
            >
              <td class="px-6 py-4">
                <p class="font-bold text-[#111118]">{{ row.code }}</p>
                <p class="font-mono text-[11px] text-violet-600">{{ row.ticketQr }}</p>
                <p class="text-xs text-slate-500">{{ formatAppraisalDate(row.createdAt) }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-800">{{ row.brand }} {{ row.model }}</p>
                <p class="text-xs text-slate-500">
                  {{ row.storage }}
                  <span v-if="row.aiResult?.ocr?.batteryPercent">
                    · Pin {{ row.aiResult.ocr.batteryPercent }}%
                  </span>
                </p>
                <p class="text-xs text-slate-500">{{ row.customerName || 'Khách vãng lai' }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-xs font-semibold text-slate-600">{{ photoCountLabel(row) }}</p>
                <span
                  class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1"
                  :class="
                    row.aiResult?.ran
                      ? 'bg-violet-50 text-violet-700 ring-violet-200'
                      : 'bg-amber-50 text-amber-700 ring-amber-200'
                  "
                >
                  {{ row.aiResult?.ran ? (row.aiResult.mode === 'mock' ? 'AI mock' : 'AI ok') : 'Chưa chạy AI' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="row.aiResult?.grade"
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="gradeClass[row.aiResult.grade]"
                >
                  {{ row.aiResult.grade }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-6 py-4 font-bold text-red-600">
                {{ row.finalPrice ? formatCurrency(row.finalPrice) : '—' }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="appraisalStatusClass[row.status]"
                >
                  {{ statusLabel(row.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right" @click.stop>
                <button
                  type="button"
                  class="rounded-[12px] px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                  @click="openEdit(row)"
                >
                  Sửa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form AutoGrade -->
    <AppModal :open="showForm" @close="showForm = false">
      <div
        class="flex max-h-[min(94vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-2xl"
      >
        <div class="shrink-0 border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-black text-[#111118]">
            {{ editingId ? 'Sửa phiếu AutoGrade' : 'Phiếu thẩm định AutoGrade' }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            4 bước: Thông tin → Ảnh AI → Test nội vi → Định giá
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="s in [
                { n: 1, t: '1. Thông tin' },
                { n: 2, t: '2. Ảnh' },
                { n: 3, t: '3. Nội vi' },
                { n: 4, t: '4. Định giá' },
              ]"
              :key="s.n"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition"
              :class="
                formStep === s.n
                  ? 'bg-red-600 text-white ring-red-600'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-red-50'
              "
              @click="formStep = s.n"
            >
              {{ s.t }}
            </button>
          </div>
        </div>

        <div class="custom-scrollbar-content space-y-5 overflow-y-auto p-6">
          <!-- Step 1 -->
          <div v-show="formStep === 1" class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Khách hàng</label>
                <input
                  v-model="form.customerName"
                  type="text"
                  placeholder="Tên (tuỳ chọn)"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">SĐT</label>
                <input
                  v-model="form.customerPhone"
                  type="text"
                  placeholder="Số điện thoại"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                />
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Hãng</label>
                <select
                  v-model="form.brand"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                >
                  <option v-for="b in APPRAISAL_BRANDS" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Model (OCR sẽ ghi đè)
                </label>
                <select
                  v-model="form.model"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                >
                  <option v-for="m in modelOptions" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
            </div>
            <div v-if="form.model === 'Khác (nhập tay)' || form.brand === 'Khác'">
              <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Model nhập tay</label>
              <input
                v-model="customModel"
                type="text"
                class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
              />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">ROM</label>
                <select
                  v-model="form.storage"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                >
                  <option v-for="s in APPRAISAL_STORAGES" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">IMEI / Serial</label>
                <input
                  v-model="form.imei"
                  type="text"
                  placeholder="Chống tráo máy"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 font-mono text-sm outline-none focus:border-red-400"
                />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Phụ kiện / ghi chú</label>
              <textarea
                v-model="form.accessoriesNote"
                rows="2"
                placeholder="Hộp, sạc zin..."
                class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
              />
            </div>
          </div>

          <!-- Step 2 photos -->
          <div v-show="formStep === 2" class="space-y-4">
            <p class="text-sm text-slate-600">
              INPUT thị giác: <strong>{{ photoReadyCount }}/4</strong> ảnh. YOLO dùng 3 góc; OCR dùng màn Pin /
              Giới thiệu.
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="slot in PHOTO_SLOTS"
                :key="slot.key"
                class="rounded-[16px] border border-dashed border-violet-300 bg-violet-50/40 p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-bold text-violet-900">{{ slot.label }}</p>
                    <p class="text-[11px] text-violet-700/80">{{ slot.hint }}</p>
                  </div>
                  <button
                    v-if="form.photos[slot.key]"
                    type="button"
                    class="text-[11px] font-bold text-rose-600"
                    @click="clearPhoto(slot.key)"
                  >
                    Xóa
                  </button>
                </div>
                <div
                  v-if="form.photos[slot.key]?.dataUrl"
                  class="mt-2 overflow-hidden rounded-[12px] bg-white ring-1 ring-violet-100"
                >
                  <img
                    :src="form.photos[slot.key].dataUrl"
                    :alt="slot.label"
                    class="h-28 w-full object-cover"
                  />
                </div>
                <div
                  v-else
                  class="mt-2 flex h-28 items-center justify-center rounded-[12px] bg-white/70 text-xs text-slate-400 ring-1 ring-violet-100"
                >
                  Chưa có ảnh
                </div>
                <label
                  class="mt-2 flex cursor-pointer items-center justify-center rounded-[12px] bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700"
                >
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    class="hidden"
                    @change="onPickPhoto(slot.key, $event)"
                  />
                </label>
              </div>
            </div>
          </div>

          <!-- Step 3 hardware -->
          <div v-show="formStep === 3" class="space-y-4">
            <p class="text-sm text-slate-600">
              Checklist nội vi (~60s) — bổ sung lỗi camera không thấy (Expo sẽ làm test thật sau).
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="t in HARDWARE_TESTS"
                :key="t.key"
                class="rounded-[16px] border border-red-100 bg-red-50/40 p-4"
              >
                <p class="font-bold text-slate-800">{{ t.label }}</p>
                <p class="text-xs text-slate-500">{{ t.hint }}</p>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="flex-1 rounded-[12px] py-2 text-xs font-bold ring-1 transition"
                    :class="
                      form.hardware[t.key] === 'pass'
                        ? 'bg-emerald-600 text-white ring-emerald-600'
                        : 'bg-white text-slate-600 ring-slate-200'
                    "
                    @click="form.hardware[t.key] = 'pass'"
                  >
                    Đạt
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-[12px] py-2 text-xs font-bold ring-1 transition"
                    :class="
                      form.hardware[t.key] === 'fail'
                        ? 'bg-rose-600 text-white ring-rose-600'
                        : 'bg-white text-slate-600 ring-slate-200'
                    "
                    @click="form.hardware[t.key] = 'fail'"
                  >
                    Lỗi
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4 valuation -->
          <div v-show="formStep === 4" class="space-y-4">
            <div class="rounded-[18px] border border-dashed border-violet-300 bg-violet-50/70 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-violet-500">AutoGrade AI</p>
                  <p class="mt-1 text-sm text-violet-900/85">
                    YOLOv8 defects + PaddleOCR + công thức khấu hao (mock UI)
                  </p>
                </div>
                <button
                  type="button"
                  class="rounded-[14px] bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                  :disabled="aiBusy"
                  @click="runAutoGrade"
                >
                  {{ aiBusy ? 'Đang suy luận…' : 'Chạy AutoGrade AI' }}
                </button>
              </div>
            </div>

            <template v-if="aiResult?.ran">
              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-violet-100">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hạng máy</p>
                  <span
                    class="mt-2 inline-flex rounded-full px-2.5 py-1 text-sm font-black ring-1"
                    :class="gradeClass[aiResult.grade]"
                  >
                    {{ aiResult.grade }}
                  </span>
                  <p class="mt-1 text-xs text-slate-500">{{ gradeLabel(aiResult.grade) }}</p>
                </div>
                <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-violet-100">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">OCR</p>
                  <p class="mt-1 text-sm font-bold text-slate-800">
                    {{ aiResult.ocr?.model }} · {{ aiResult.ocr?.rom }}
                  </p>
                  <p class="text-xs text-slate-600">Pin {{ aiResult.ocr?.batteryPercent }}%</p>
                  <p
                    v-if="aiResult.ocr?.unknownPart"
                    class="mt-1 text-xs font-bold text-rose-600"
                  >
                    ⚠ Unknown Part
                  </p>
                </div>
                <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-violet-100">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">BasePrice</p>
                  <p class="mt-1 text-lg font-black text-slate-800">
                    {{ formatCurrency(aiResult.basePrice) }}
                  </p>
                </div>
              </div>

              <div class="rounded-[16px] border border-red-100 bg-red-50/40 p-4">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                  YOLO defects (bounding box — mock)
                </p>
                <ul v-if="aiResult.defects?.length" class="mt-2 space-y-1.5">
                  <li
                    v-for="(d, i) in aiResult.defects"
                    :key="i"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="font-medium text-slate-700">
                      {{ d.label }}
                      <span class="text-xs text-slate-400">({{ Math.round(d.confidence * 100) }}%)</span>
                    </span>
                    <span class="font-bold text-rose-600">−{{ formatCurrency(d.cost) }}</span>
                  </li>
                </ul>
                <p v-else class="mt-2 text-sm text-emerald-700">Không phát hiện khuyết tật ngoại quan.</p>
              </div>

              <div class="rounded-[16px] border border-amber-100 bg-amber-50/50 p-4">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Breakdown khấu hao</p>
                <p class="mt-1 font-mono text-[11px] text-slate-500">{{ aiResult.formula }}</p>
                <ul class="mt-2 space-y-1.5">
                  <li
                    v-for="(d, i) in aiResult.deductions"
                    :key="i"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-slate-700">
                      <span class="mr-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200">
                        {{ d.source }}
                      </span>
                      {{ d.label }}
                    </span>
                    <span class="font-semibold text-amber-800">−{{ formatCurrency(d.amount) }}</span>
                  </li>
                </ul>
                <div class="mt-3 flex justify-between border-t border-amber-200/80 pt-2 text-sm font-bold">
                  <span>Tổng trừ</span>
                  <span class="text-amber-900">−{{ formatCurrency(deductionTotal) }}</span>
                </div>
                <div class="mt-1 flex justify-between text-base font-black">
                  <span>Suggested FinalPrice</span>
                  <span class="text-red-600">{{ formatCurrency(aiResult.suggestedPrice) }}</span>
                </div>
                <p class="mt-2 text-xs text-violet-800">{{ aiResult.note }}</p>
              </div>
            </template>

            <div v-else class="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Chưa có kết quả AI — hoàn tất ảnh (≥2) rồi bấm «Chạy AutoGrade AI».
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  FinalPrice chốt (NV có thể sửa)
                </label>
                <AppMoneyInput v-model="form.finalPrice" :show-preview="true" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Trạng thái phiếu</label>
                <select
                  v-model="form.status"
                  class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                >
                  <option v-for="s in APPRAISAL_STATUSES" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm font-semibold text-red-600">{{ formError }}</p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-red-100 px-6 py-4">
          <div class="flex gap-2">
            <button
              v-if="formStep > 1"
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              @click="formStep -= 1"
            >
              ← Trước
            </button>
            <button
              v-if="formStep < 4"
              type="button"
              class="rounded-[14px] bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
              @click="formStep += 1"
            >
              Tiếp →
            </button>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              @click="showForm = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              :disabled="saving"
              @click="saveTicket"
            >
              {{ saving ? 'Đang lưu…' : 'Lưu phiếu' }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Detail -->
    <AppSlideOver :open="!!selected" @close="closeDetail">
      <template v-if="selected">
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ selected.code }}</p>
              <h3 class="mt-1 text-xl font-black text-[#111118]">
                {{ selected.brand }} {{ selected.model }}
              </h3>
              <p class="font-mono text-xs text-violet-600">QR: {{ selected.ticketQr }}</p>
            </div>
            <button
              type="button"
              class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              @click="closeDetail"
            >
              Đóng
            </button>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
              :class="appraisalStatusClass[selected.status]"
            >
              {{ statusLabel(selected.status) }}
            </span>
            <span
              v-if="selected.aiResult?.grade"
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
              :class="gradeClass[selected.aiResult.grade]"
            >
              Hạng {{ selected.aiResult.grade }}
            </span>
          </div>
        </div>

        <div class="space-y-5 p-6">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-[14px] bg-red-50/80 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Khách</p>
              <p class="mt-1 font-semibold text-slate-800">{{ selected.customerName || '—' }}</p>
              <p class="text-xs text-slate-500">{{ selected.customerPhone || 'Không SĐT' }}</p>
            </div>
            <div class="rounded-[14px] bg-red-50/80 px-4 py-3 ring-1 ring-red-100">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">FinalPrice</p>
              <p class="mt-1 text-lg font-black text-red-600">
                {{ selected.finalPrice ? formatCurrency(selected.finalPrice) : '—' }}
              </p>
              <p class="text-xs text-slate-500">{{ photoCountLabel(selected) }}</p>
            </div>
          </div>

          <div v-if="selected.aiResult?.ran" class="space-y-3 rounded-[16px] border border-violet-200 bg-violet-50/40 p-4">
            <p class="text-xs font-bold uppercase tracking-widest text-violet-500">Kết quả AI</p>
            <p class="text-sm text-slate-700">
              OCR: {{ selected.aiResult.ocr?.model }} · {{ selected.aiResult.ocr?.rom }} · Pin
              {{ selected.aiResult.ocr?.batteryPercent }}%
            </p>
            <ul class="space-y-1 text-sm">
              <li v-for="(d, i) in selected.aiResult.deductions || []" :key="i" class="flex justify-between">
                <span>{{ d.label }}</span>
                <span class="font-semibold text-rose-600">−{{ formatCurrency(d.amount) }}</span>
              </li>
            </ul>
            <p class="text-xs text-violet-800">{{ selected.aiResult.note }}</p>
          </div>

          <div>
            <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Đổi trạng thái</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in APPRAISAL_STATUSES"
                :key="s.key"
                type="button"
                class="rounded-[12px] px-3 py-1.5 text-xs font-bold ring-1 transition"
                :class="
                  selected.status === s.key
                    ? 'bg-red-600 text-white ring-red-600'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-red-50'
                "
                @click="setStatus(selected, s.key)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-[14px] bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
            @click="openEdit(selected); closeDetail()"
          >
            Sửa / chạy lại AI
          </button>
        </div>
      </template>
    </AppSlideOver>
  </div>
</template>

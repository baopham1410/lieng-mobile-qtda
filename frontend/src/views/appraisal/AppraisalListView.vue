<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import {
  confirmAppraisalDetections,
  createAppraisal,
  deleteAppraisal,
  fetchAppraisalHealth,
  fetchAppraisalPricing,
  fetchAppraisals,
  removeAppraisalPhoto,
  runAppraisalAi,
  updateAppraisal,
  uploadAppraisalPhoto,
} from '@/api/appraisals'
import {
  APPRAISAL_BRANDS,
  APPRAISAL_MODELS,
  APPRAISAL_STATUSES,
  APPRAISAL_STORAGES,
  EXTERIOR_PHOTO_SLOTS,
  GLASS_CONDITION_OPTIONS,
  MOBILE_DIAGNOSTIC_TESTS,
  PHOTO_SLOTS,
  SCREEN_AUTHENTICITY_OPTIONS,
  SCREEN_DISPLAY_OPTIONS,
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
const stats = ref({ total: 0, draft: 0, quoted: 0, accepted: 0, rejected: 0 })
const selected = ref(null)
const showForm = ref(false)
const editingId = ref(null)
const form = ref(emptyAppraisalForm())
const removedSlots = ref([])
const formError = ref('')
const formNotice = ref('')
const loadingList = ref(false)
const saving = ref(false)
const aiBusy = ref(false)
const recalcBusy = ref(false)
const deleting = ref(false)
const customModel = ref('')
const formStep = ref(1)
const bboxShapeMode = ref('box') // 'box' | 'both' | 'circle'
const showGoodBoxes = ref(false)
const zoomInspect = ref(null)

// API & Service health + Mock fallback flag
const apiConnected = ref(false)
const serviceHealth = ref({ ok: false, message: 'Đang kiểm tra :8091…' })
const allowMockFallback = ref(true)
const pricingModelsMap = ref({})

function hasRealSession() {
  const token = localStorage.getItem('token')
  return Boolean(token && !token.startsWith('mock-'))
}

const modelOptions = computed(() => {
  if (form.value.brand === 'Apple') {
    const apiModels = Object.keys(pricingModelsMap.value)
    if (apiModels.length) return apiModels
  }
  return APPRAISAL_MODELS[form.value.brand] || APPRAISAL_MODELS.Khác
})

const storageOptions = computed(() => {
  if (form.value.brand === 'Apple') {
    const list = pricingModelsMap.value[form.value.model]
    if (Array.isArray(list) && list.length) return list
  }
  return APPRAISAL_STORAGES
})

watch(
  () => form.value.brand,
  () => {
    const opts = modelOptions.value
    if (!opts.includes(form.value.model)) {
      form.value.model = opts[0] || ''
    }
  },
)

watch(
  () => form.value.model,
  () => {
    const opts = storageOptions.value
    if (opts.length && !opts.includes(form.value.storage)) {
      form.value.storage = opts[0]
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

const yoloDetections = computed(() => {
  if (Array.isArray(aiResult.value?.yolo?.detections)) {
    return aiResult.value.yolo.detections
  }
  return Array.isArray(aiResult.value?.defects) ? aiResult.value.defects : []
})

const deductionTotal = computed(() =>
  (aiResult.value?.deductions || []).reduce((s, d) => s + (Number(d.amount) || 0), 0),
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

function refreshLocalStats() {
  stats.value = computeAppraisalStats(rows.value)
}

async function loadInitialData() {
  loadingList.value = true
  try {
    if (hasRealSession()) {
      const [listRes, pricingRes, healthRes] = await Promise.allSettled([
        fetchAppraisals(),
        fetchAppraisalPricing(),
        fetchAppraisalHealth(),
      ])

      if (listRes.status === 'fulfilled') {
        rows.value = listRes.value.rows
        stats.value = listRes.value.stats || computeAppraisalStats(rows.value)
        apiConnected.value = true
      } else {
        rows.value = getAppraisalRows()
        refreshLocalStats()
        apiConnected.value = false
      }

      if (pricingRes.status === 'fulfilled' && pricingRes.value?.models) {
        pricingModelsMap.value = pricingRes.value.models
      }

      if (healthRes.status === 'fulfilled' && healthRes.value?.ok) {
        serviceHealth.value = { ok: true, message: 'AutoGrade :8091 (YOLOv8 + PaddleOCR) sẵn sàng' }
      } else {
        serviceHealth.value = {
          ok: false,
          message: 'Chưa kết nối autograde-service :8091 (có thể bật lại hoặc dùng fallback mock)',
        }
      }
    } else {
      rows.value = getAppraisalRows()
      refreshLocalStats()
      apiConnected.value = false
      serviceHealth.value = {
        ok: false,
        message: 'Phiên demo offline — dữ liệu lưu localStorage',
      }
    }
  } finally {
    loadingList.value = false
  }
}

function resolvedModel() {
  if (form.value.model === 'Khác (nhập tay)' || form.value.brand === 'Khác') {
    return customModel.value.trim() || form.value.model
  }
  return form.value.model
}

function normalizeFormPhotos(rowPhotos = {}) {
  const result = {}
  for (const slot of PHOTO_SLOTS) {
    const p = rowPhotos?.[slot.key]
    if (p && (p.url || p.dataUrl)) {
      result[slot.key] = {
        name: p.originalName || p.name || `${slot.key}.jpg`,
        url: p.url || null,
        dataUrl: p.dataUrl || p.url || null,
        file: null,
      }
    } else {
      result[slot.key] = null
    }
  }
  return result
}

function hydrateFormFromTicket(ticket) {
  editingId.value = ticket.id
  removedSlots.value = []
  const defaults = emptyAppraisalForm()
  form.value = {
    customerName: ticket.customerName || '',
    customerPhone: ticket.customerPhone || '',
    brand: ticket.brand || 'Apple',
    model: ticket.model || '',
    storage: ticket.storage || '256GB',
    imei: ticket.imei || '',
    accessoriesNote: ticket.accessoriesNote || '',
    photos: normalizeFormPhotos(ticket.photos),
    hardware: { ...defaults.hardware, ...(ticket.hardware || {}) },
    aiResult: ticket.aiResult ? structuredClone(ticket.aiResult) : defaults.aiResult,
    finalPrice: Number(ticket.finalPrice) || 0,
    status: ticket.status || 'draft',
  }
  customModel.value =
    ticket.model && !modelOptions.value.includes(ticket.model) ? ticket.model : ''
}

function openCreate() {
  editingId.value = null
  removedSlots.value = []
  form.value = emptyAppraisalForm()
  customModel.value = ''
  formError.value = ''
  formNotice.value = ''
  formStep.value = 1
  showForm.value = true
}

function openEdit(row) {
  hydrateFormFromTicket(row)
  formError.value = ''
  formNotice.value = ''
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
  removedSlots.value = removedSlots.value.filter((s) => s !== slotKey)
  const reader = new FileReader()
  reader.onload = () => {
    form.value.photos[slotKey] = {
      name: file.name,
      dataUrl: String(reader.result),
      file,
    }
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
  if (form.value.photos[slotKey]?.url && !removedSlots.value.includes(slotKey)) {
    removedSlots.value.push(slotKey)
  }
  form.value.photos[slotKey] = null
}

function buildTicketPayload() {
  return {
    customerName: form.value.customerName.trim(),
    customerPhone: form.value.customerPhone.trim(),
    brand: form.value.brand,
    model: resolvedModel(),
    storage: form.value.storage,
    imei: form.value.imei.trim(),
    accessoriesNote: form.value.accessoriesNote.trim(),
    hardware: { ...form.value.hardware },
    finalPrice: Number(form.value.finalPrice) || 0,
    status: form.value.status,
  }
}

function upsertRow(ticket) {
  const idx = rows.value.findIndex((r) => r.id === ticket.id)
  if (idx >= 0) {
    rows.value.splice(idx, 1, ticket)
  } else {
    rows.value = [ticket, ...rows.value]
  }
  if (selected.value?.id === ticket.id) {
    selected.value = ticket
  }
}

async function syncTicketAndPhotos() {
  const payload = buildTicketPayload()
  let ticket = editingId.value
    ? await updateAppraisal(editingId.value, payload)
    : await createAppraisal(payload)

  editingId.value = ticket.id

  for (const slot of removedSlots.value) {
    ticket = await removeAppraisalPhoto(ticket.id, slot)
  }
  removedSlots.value = []

  for (const slot of PHOTO_SLOTS) {
    const entry = form.value.photos?.[slot.key]
    if (entry?.file) {
      ticket = await uploadAppraisalPhoto(ticket.id, slot.key, entry.file)
      form.value.photos[slot.key] = {
        ...entry,
        url: ticket.photos?.[slot.key]?.url || entry.url,
        dataUrl: ticket.photos?.[slot.key]?.url || entry.dataUrl,
        file: null,
      }
    }
  }

  upsertRow(ticket)
  stats.value = computeAppraisalStats(rows.value)
  return ticket
}

function runMockFallback(messagePrefix = '') {
  const payload = {
    ...form.value,
    model: resolvedModel(),
  }
  const result = mockAutoGradeSuggest(payload)
  if (!result.ok) {
    formError.value = result.message
    formStep.value = 2
    return
  }
  form.value.aiResult = {
    ...result.aiResult,
    note: messagePrefix ? `${messagePrefix} ${result.aiResult.note}` : result.aiResult.note,
  }
  form.value.finalPrice = result.aiResult.suggestedPrice
  if (result.aiResult.ocr?.model) form.value.model = result.aiResult.ocr.model
  if (result.aiResult.ocr?.rom) form.value.storage = result.aiResult.ocr.rom
  formStep.value = 4
}

async function runAutoGrade() {
  formError.value = ''
  formNotice.value = ''
  const model = resolvedModel()
  if (!model) {
    formError.value = 'Chọn hoặc nhập model máy.'
    return
  }

  if (photoReadyCount.value === 0) {
    formError.value = 'Cần ít nhất 1 ảnh (khuyến nghị 3 góc + màn Pin) trước khi chạy AutoGrade AI.'
    formStep.value = 2
    return
  }

  aiBusy.value = true
  try {
    if (apiConnected.value && hasRealSession()) {
      const ticket = await syncTicketAndPhotos()
      const updated = await runAppraisalAi(ticket.id, {
        brand: form.value.brand,
        model,
        storage: form.value.storage,
        imei: form.value.imei.trim(),
        hardware: { ...form.value.hardware },
        apply_suggested_price: true,
      })
      upsertRow(updated)
      hydrateFormFromTicket(updated)
      stats.value = computeAppraisalStats(rows.value)
      serviceHealth.value = { ok: true, message: 'AutoGrade :8091 (YOLOv8 + PaddleOCR) sẵn sàng' }
      formNotice.value = 'Đã chạy xong YOLOv8 + PaddleOCR + Bảng giá thu cũ.'
      formStep.value = 4
      return
    }

    runMockFallback()
  } catch (err) {
    const status = err.response?.status
    const apiMsg = err.response?.data?.message || err.message || 'Không gọi được AutoGrade AI.'
    if ((status === 503 || !status) && allowMockFallback.value) {
      serviceHealth.value = { ok: false, message: apiMsg }
      formNotice.value = 'autograde-service (:8091) chưa bật — đã chuyển sang kết quả Mock để demo.'
      runMockFallback('[Fallback Mock]')
    } else {
      formError.value = apiMsg
    }
  } finally {
    aiBusy.value = false
  }
}

async function applyConfirmedDetections() {
  if (!editingId.value || !apiConnected.value) return
  recalcBusy.value = true
  formError.value = ''
  try {
    const updated = await confirmAppraisalDetections(editingId.value, {
      detections: yoloDetections.value,
      ocr: aiResult.value?.ocr || null,
      hardware: { ...form.value.hardware },
      model: resolvedModel(),
      storage: form.value.storage,
      apply_suggested_price: true,
    })
    upsertRow(updated)
    hydrateFormFromTicket(updated)
    stats.value = computeAppraisalStats(rows.value)
    formNotice.value = 'Đã cập nhật xác nhận bounding box và tính lại giá.'
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không tính lại được giá từ :8091.'
  } finally {
    recalcBusy.value = false
  }
}

async function saveTicket() {
  formError.value = ''
  formNotice.value = ''
  const model = resolvedModel()
  if (!model) {
    formError.value = 'Vui lòng chọn hoặc nhập model.'
    return
  }

  saving.value = true
  try {
    if (apiConnected.value && hasRealSession()) {
      await syncTicketAndPhotos()
      showForm.value = false
      return
    }

    // LocalStorage mock fallback
    const payload = {
      ...buildTicketPayload(),
      photosMeta: photosMetaFromForm(form.value.photos),
      aiResult: structuredClone(form.value.aiResult),
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
    refreshLocalStats()
    showForm.value = false
    if (selected.value && editingId.value === selected.value.id) {
      selected.value = rows.value.find((r) => r.id === editingId.value) || null
    }
  } catch (err) {
    formError.value = err.response?.data?.message || 'Lưu phiếu thất bại.'
  } finally {
    saving.value = false
  }
}

async function setStatus(row, status) {
  if (apiConnected.value && hasRealSession()) {
    try {
      const updated = await updateAppraisal(row.id, { status })
      upsertRow(updated)
      stats.value = computeAppraisalStats(rows.value)
      return
    } catch {
      // ignore
    }
  }
  rows.value = rows.value.map((r) => (r.id === row.id ? { ...r, status } : r))
  saveAppraisalRows(rows.value)
  refreshLocalStats()
  if (selected.value?.id === row.id) {
    selected.value = rows.value.find((r) => r.id === row.id) || null
  }
}

async function removeTicket(row) {
  if (!window.confirm(`Xóa phiếu thẩm định ${row.code}?`)) return
  deleting.value = true
  try {
    if (apiConnected.value && hasRealSession()) {
      await deleteAppraisal(row.id)
    }
    rows.value = rows.value.filter((r) => r.id !== row.id)
    if (!apiConnected.value) saveAppraisalRows(rows.value)
    stats.value = computeAppraisalStats(rows.value)
    if (selected.value?.id === row.id) selected.value = null
  } finally {
    deleting.value = false
  }
}

function photoCountLabel(row) {
  const m = row.photosMeta || {}
  const n = PHOTO_SLOTS.filter((s) => m[s.key]).length
  return `${n}/${PHOTO_SLOTS.length} ảnh`
}

function bboxStyle(det) {
  const bn = det.bbox_norm
  if (!Array.isArray(bn) || bn.length < 4) return null
  return {
    left: `${bn[0]}%`,
    top: `${bn[1]}%`,
    width: `${bn[2]}%`,
    height: `${bn[3]}%`,
  }
}

function bboxColorHex(cls) {
  if (cls === 'damaged_screen' || cls === 'damaged') return '#e11d48' // rose-600
  if (cls === 'cracked_screen' || cls === 'dent') return '#d97706' // amber-600
  if (cls === 'scratch') return '#0284c7' // sky-600
  return '#10b981' // emerald-500
}

function bboxColorClass(cls) {
  if (cls === 'damaged_screen' || cls === 'damaged') return 'border-rose-500 bg-rose-500/15 text-rose-700'
  if (cls === 'cracked_screen' || cls === 'dent') return 'border-amber-500 bg-amber-500/15 text-amber-800'
  if (cls === 'scratch') return 'border-sky-500 bg-sky-500/15 text-sky-800'
  return 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
}

function slotLabel(slotKey) {
  if (slotKey === 'side') return 'Cạnh / khung (cũ)'
  return PHOTO_SLOTS.find((s) => s.key === slotKey)?.label || slotKey
}

function slotDetections(slotKey, sourceAi = aiResult.value) {
  const list = Array.isArray(sourceAi?.yolo?.detections)
    ? sourceAi.yolo.detections
    : Array.isArray(sourceAi?.defects)
      ? sourceAi.defects
      : []
  return list.filter((d) => {
    if (d.image !== slotKey || d.confirmed === false) return false
    const isGood = d.class === 'good' || d.is_defect === false
    if (isGood && !showGoodBoxes.value) return false
    return true
  })
}

function slotDefectCount(slotKey, sourceAi = aiResult.value) {
  const list = Array.isArray(sourceAi?.yolo?.detections)
    ? sourceAi.yolo.detections
    : Array.isArray(sourceAi?.defects)
      ? sourceAi.defects
      : []
  return list.filter(
    (d) =>
      d.image === slotKey &&
      d.confirmed !== false &&
      d.class !== 'good' &&
      d.is_defect !== false,
  ).length
}

function exteriorGalleryItems(photosObj, sourceAi = aiResult.value) {
  const keys = [...EXTERIOR_PHOTO_SLOTS.map((s) => s.key)]
  if (photosObj?.side?.url || photosObj?.side?.dataUrl) {
    keys.push('side')
  }
  return keys
    .map((key) => {
      const p = photosObj?.[key]
      const src = p?.dataUrl || p?.url
      if (!src) return null
      return {
        slotKey: key,
        label: slotLabel(key),
        src,
        detections: slotDetections(key, sourceAi),
        defectCount: slotDefectCount(key, sourceAi),
      }
    })
    .filter(Boolean)
}

function ellipseGeom(det) {
  const bn = det?.bbox_norm
  if (!Array.isArray(bn) || bn.length < 4) return null
  const [x, y, w, h] = bn.map(Number)
  return {
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
    rx: Math.max(4, w * 0.62),
    ry: Math.max(4, h * 0.62),
  }
}

function openZoomInspect(item) {
  zoomInspect.value = item
}

function downloadAnnotatedImage(item) {
  if (!item?.src) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 800
    canvas.height = img.naturalHeight || 800
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    for (const det of item.detections || []) {
      const bn = det.bbox_norm
      if (!Array.isArray(bn) || bn.length < 4) continue
      const x = (bn[0] / 100) * canvas.width
      const y = (bn[1] / 100) * canvas.height
      const w = (bn[2] / 100) * canvas.width
      const h = (bn[3] / 100) * canvas.height
      const color = bboxColorHex(det.class)

      ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.005))
      ctx.strokeStyle = color

      if (bboxShapeMode.value === 'both' || bboxShapeMode.value === 'box') {
        ctx.strokeRect(x, y, w, h)
      }
      if (bboxShapeMode.value === 'both' || bboxShapeMode.value === 'circle') {
        ctx.beginPath()
        ctx.ellipse(
          x + w / 2,
          y + h / 2,
          Math.max(18, w * 0.62),
          Math.max(18, h * 0.62),
          0,
          0,
          Math.PI * 2,
        )
        ctx.stroke()
      }

      const tag = `${det.class} ${Math.round((det.confidence || 0) * 100)}%`
      const fontSize = Math.max(14, Math.round(canvas.width * 0.022))
      ctx.font = `bold ${fontSize}px sans-serif`
      const tw = ctx.measureText(tag).width + 12
      const ty = Math.max(fontSize + 6, y)
      ctx.fillStyle = color
      ctx.fillRect(x, ty - fontSize - 6, tw, fontSize + 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(tag, x + 6, ty - 5)
    }

    const link = document.createElement('a')
    link.download = `autograde-${item.slotKey}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = item.src
}

function setMobileTest(key, val) {
  form.value.hardware[key] = val
  const hw = form.value.hardware
  if (['earpiece', 'speaker', 'callMic', 'videoMic'].includes(key)) {
    const anyAudioFail =
      hw.earpiece === 'fail' ||
      hw.speaker === 'fail' ||
      hw.callMic === 'fail' ||
      hw.videoMic === 'fail'
    hw.audio = anyAudioFail ? 'fail' : 'pass'
  }
}

function setAllMobileTests(val) {
  for (const t of MOBILE_DIAGNOSTIC_TESTS) {
    form.value.hardware[t.key] = val
  }
  form.value.hardware.audio = val
}

function failedMobileItems(hw = {}) {
  return MOBILE_DIAGNOSTIC_TESTS.filter((t) => hw?.[t.key] === 'fail')
}

function mobilePassCount(hw = {}) {
  return MOBILE_DIAGNOSTIC_TESTS.filter((t) => hw?.[t.key] !== 'fail').length
}

onMounted(loadInitialData)
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
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">Thẩm định &amp; định giá</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            Quy trình chuẩn: upload mặt trước/sau + 4 góc cạnh + màn Pin → YOLOv8 khoanh vùng lỗi + PaddleOCR →
            nội vi Mobile &amp; bảng giá sàn Loại 1–4 → nhân viên xác nhận &amp; chốt FinalPrice.
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
      class="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border px-5 py-4 text-sm"
      :class="
        serviceHealth.ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'border-violet-200 bg-violet-50 text-violet-950'
      "
    >
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
          :class="serviceHealth.ok ? 'bg-emerald-200 text-emerald-900' : 'bg-violet-200 text-violet-900'"
        >
          AI
        </span>
        <div>
          <p class="font-bold">
            Pipeline: YOLOv8s · PaddleOCR · Bảng giá Loại 1–4
            <span class="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
              {{ apiConnected ? 'Laravel DB' : 'Local Mock' }}
            </span>
          </p>
          <p class="mt-0.5 opacity-85">{{ serviceHealth.message }}</p>
        </div>
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold">
        <input v-model="allowMockFallback" type="checkbox" class="h-4 w-4 accent-violet-600" />
        Giữ fallback Mock khi :8091 tắt
      </label>
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
      v-if="loadingList"
      class="rounded-[24px] border border-red-200 bg-white p-8 text-center text-sm text-slate-500"
    >
      Đang tải danh sách phiếu thẩm định…
    </div>

    <div
      v-else-if="!filteredRows.length"
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
                  <span v-if="row.aiResult?.ocr?.batteryPercent ?? row.aiResult?.ocr?.battery_percent">
                    · Pin {{ row.aiResult.ocr.batteryPercent ?? row.aiResult.ocr.battery_percent }}%
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
                      ? row.aiResult.mode === 'mock'
                        ? 'bg-violet-50 text-violet-700 ring-violet-200'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-amber-50 text-amber-700 ring-amber-200'
                  "
                >
                  {{
                    row.aiResult?.ran
                      ? row.aiResult.mode === 'mock'
                        ? 'AI mock'
                        : 'AutoGrade AI'
                      : 'Chưa chạy AI'
                  }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="row.aiResult?.grade"
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="gradeClass[row.aiResult.grade]"
                >
                  {{ row.aiResult.grade === 'reject' ? 'Từ chối' : row.aiResult.grade }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-6 py-4 font-bold text-red-600">
                {{ row.finalPrice ? formatCurrency(row.finalPrice) : '—' }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="appraisalStatusClass[row.status] || appraisalStatusClass.draft"
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
                  Model (OCR sẽ tự đối chiếu)
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
                  <option v-for="s in storageOptions" :key="s" :value="s">{{ s }}</option>
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
          <div v-show="formStep === 2" class="space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm text-slate-600">
                INPUT thị giác: <strong>{{ photoReadyCount }}/{{ PHOTO_SLOTS.length }}</strong> ảnh
                (Mặt trước/sau + 4 góc cạnh cho YOLOv8, màn Pin/Giới thiệu cho OCR).
              </p>
              <span class="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-800">
                6 góc ngoại quan + 1 ảnh OCR
              </span>
            </div>

            <!-- Nhóm 1: Mặt trước, Mặt sau & Màn Pin -->
            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Mặt chính &amp; Màn Pin / Giới thiệu
              </p>
              <div class="grid gap-3 sm:grid-cols-3">
                <div
                  v-for="slot in PHOTO_SLOTS.filter((s) => s.group !== 'corner')"
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
                    v-if="form.photos[slot.key]?.dataUrl || form.photos[slot.key]?.url"
                    class="mt-2 overflow-hidden rounded-[12px] bg-white ring-1 ring-violet-100"
                  >
                    <img
                      :src="form.photos[slot.key].dataUrl || form.photos[slot.key].url"
                      :alt="slot.label"
                      class="h-32 w-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="mt-2 flex h-32 items-center justify-center rounded-[12px] bg-white/70 text-xs text-slate-400 ring-1 ring-violet-100"
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

            <!-- Nhóm 2: 4 ảnh 4 góc cạnh -->
            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                4 ảnh 4 góc cạnh (phát hiện cấn móp / trầy viền)
              </p>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  v-for="slot in PHOTO_SLOTS.filter((s) => s.group === 'corner')"
                  :key="slot.key"
                  class="rounded-[16px] border border-dashed border-amber-300 bg-amber-50/40 p-3"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-xs font-bold text-amber-950">{{ slot.label }}</p>
                      <p class="text-[10px] text-amber-800/80">{{ slot.hint }}</p>
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
                    v-if="form.photos[slot.key]?.dataUrl || form.photos[slot.key]?.url"
                    class="mt-2 overflow-hidden rounded-[12px] bg-white ring-1 ring-amber-200"
                  >
                    <img
                      :src="form.photos[slot.key].dataUrl || form.photos[slot.key].url"
                      :alt="slot.label"
                      class="h-28 w-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="mt-2 flex h-28 items-center justify-center rounded-[12px] bg-white/70 text-xs text-slate-400 ring-1 ring-amber-100"
                  >
                    Chưa có ảnh
                  </div>
                  <label
                    class="mt-2 flex cursor-pointer items-center justify-center rounded-[12px] bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    Chọn ảnh góc
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
          </div>

          <!-- Step 3 hardware & mobile diagnostics -->
          <div v-show="formStep === 3" class="space-y-5">
            <div class="rounded-[16px] border border-sky-200 bg-sky-50/70 px-4 py-3 text-xs text-sky-950">
              <p class="font-bold">Luồng Mobile → Web tại quầy</p>
              <p class="mt-0.5 text-sky-800">
                Khách chạy bài test nội vi tự động trên điện thoại → Nhân viên xem màn hình <strong>Tổng quan</strong>
                của máy khách và tích lại bảng dưới đây (sau này hỗ trợ đồng bộ trực tiếp từ Mobile App).
              </p>
            </div>

            <!-- Bảo mật bắt buộc -->
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                class="flex cursor-pointer items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p class="text-sm font-bold text-slate-800">Thoát được tài khoản iCloud</p>
                  <p class="text-xs text-slate-500">Nếu tắt → Từ chối thu mua</p>
                </div>
                <input v-model="form.hardware.icloudClean" type="checkbox" class="h-5 w-5 accent-emerald-600" />
              </label>
              <label
                class="flex cursor-pointer items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p class="text-sm font-bold text-slate-800">Máy lên nguồn bình thường</p>
                  <p class="text-xs text-slate-500">Nếu tắt → Từ chối thu mua</p>
                </div>
                <input v-model="form.hardware.powerOn" type="checkbox" class="h-5 w-5 accent-emerald-600" />
              </label>
            </div>

            <!-- 14 mục Test nội vi Mobile -->
            <div class="rounded-[18px] border border-slate-200 bg-white p-4">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-black text-slate-800">
                    Thông tin máy · Test nội vi từ điện thoại khách
                    <span class="ml-1 text-xs font-bold text-emerald-700">
                      ({{ mobilePassCount(form.hardware) }}/{{ MOBILE_DIAGNOSTIC_TESTS.length }} Tốt)
                    </span>
                  </p>
                  <p class="text-[11px] text-slate-500">
                    Mặc định chọn nhanh Tất cả Tốt rồi chỉ đánh dấu Lỗi cho mục nào không đạt trên máy khách.
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-[10px] bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                    @click="setAllMobileTests('pass')"
                  >
                    ✓ Tích tất cả Tốt
                  </button>
                </div>
              </div>

              <div class="grid gap-2.5 sm:grid-cols-2">
                <div
                  v-for="t in MOBILE_DIAGNOSTIC_TESTS"
                  :key="t.key"
                  class="flex items-center justify-between gap-2 rounded-[12px] border px-3 py-2 transition"
                  :class="
                    form.hardware[t.key] === 'fail'
                      ? 'border-rose-200 bg-rose-50/70'
                      : 'border-slate-100 bg-slate-50/60'
                  "
                >
                  <div class="min-w-0">
                    <p class="truncate text-xs font-bold text-slate-800">{{ t.label }}</p>
                    <p class="truncate text-[10px] text-slate-400">{{ t.hint }}</p>
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <button
                      type="button"
                      class="rounded-[8px] px-2.5 py-1 text-[11px] font-bold ring-1 transition"
                      :class="
                        form.hardware[t.key] !== 'fail'
                          ? 'bg-emerald-600 text-white ring-emerald-600'
                          : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                      "
                      @click="setMobileTest(t.key, 'pass')"
                    >
                      Tốt
                    </button>
                    <button
                      type="button"
                      class="rounded-[8px] px-2.5 py-1 text-[11px] font-bold ring-1 transition"
                      :class="
                        form.hardware[t.key] === 'fail'
                          ? 'bg-rose-600 text-white ring-rose-600'
                          : 'bg-white text-slate-500 ring-slate-200 hover:bg-rose-50'
                      "
                      @click="setMobileTest(t.key, 'fail')"
                    >
                      Lỗi
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Đánh giá ngoại quan & linh kiện tại quầy -->
            <div class="space-y-4 rounded-[18px] border border-red-100 bg-red-50/30 p-4">
              <p class="text-sm font-black text-slate-800">Đánh giá ngoại quan &amp; linh kiện tại quầy</p>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-bold text-slate-700">
                    1. Tình trạng hiển thị màn hình
                  </label>
                  <div class="space-y-1.5">
                    <label
                      v-for="opt in SCREEN_DISPLAY_OPTIONS"
                      :key="opt.value"
                      class="flex cursor-pointer items-center justify-between gap-2 rounded-[10px] border bg-white px-3 py-2 text-xs"
                      :class="
                        form.hardware.screenDisplay === opt.value
                          ? 'border-red-400 ring-1 ring-red-200 font-semibold text-slate-900'
                          : 'border-slate-200 text-slate-600'
                      "
                    >
                      <span class="flex items-center gap-2">
                        <input
                          v-model="form.hardware.screenDisplay"
                          type="radio"
                          :value="opt.value"
                          class="accent-red-600"
                        />
                        {{ opt.label }}
                      </span>
                      <span
                        class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                        :class="
                          opt.value === 'good'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        "
                      >
                        {{ opt.badge }}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-bold text-slate-700">
                    2. Chính hãng &amp; lịch sử sửa chữa màn hình
                  </label>
                  <select
                    v-model="form.hardware.screenAuthenticity"
                    class="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-red-400"
                  >
                    <option v-for="opt in SCREEN_AUTHENTICITY_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>

                  <label class="mb-1.5 mt-3 block text-xs font-bold text-slate-700">
                    3. Tình trạng mặt kính màn hình (kết hợp YOLO)
                  </label>
                  <select
                    v-model="form.hardware.glassCondition"
                    class="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-red-400"
                  >
                    <option v-for="opt in GLASS_CONDITION_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-[12px] border border-slate-200 bg-white p-3">
                  <p class="mb-2 text-xs font-bold text-slate-700">Phím nguồn</p>
                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      class="flex-1 rounded-[8px] py-1.5 text-[11px] font-bold ring-1"
                      :class="
                        form.hardware.powerButton !== 'broken'
                          ? 'bg-emerald-600 text-white ring-emerald-600'
                          : 'bg-white text-slate-600 ring-slate-200'
                      "
                      @click="form.hardware.powerButton = 'good'"
                    >
                      Hoạt động tốt
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-[8px] py-1.5 text-[11px] font-bold ring-1"
                      :class="
                        form.hardware.powerButton === 'broken'
                          ? 'bg-rose-600 text-white ring-rose-600'
                          : 'bg-white text-slate-600 ring-slate-200'
                      "
                      @click="form.hardware.powerButton = 'broken'"
                    >
                      Lún / Lỗi
                    </button>
                  </div>
                </div>

                <div class="rounded-[12px] border border-slate-200 bg-white p-3">
                  <p class="mb-2 text-xs font-bold text-slate-700">Kiểm tra True Tone</p>
                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      class="flex-1 rounded-[8px] py-1.5 text-[11px] font-bold ring-1"
                      :class="
                        form.hardware.trueTone !== 'no'
                          ? 'bg-emerald-600 text-white ring-emerald-600'
                          : 'bg-white text-slate-600 ring-slate-200'
                      "
                      @click="form.hardware.trueTone = 'yes'"
                    >
                      Còn True Tone
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-[8px] py-1.5 text-[11px] font-bold ring-1"
                      :class="
                        form.hardware.trueTone === 'no'
                          ? 'bg-amber-600 text-white ring-amber-600'
                          : 'bg-white text-slate-600 ring-slate-200'
                      "
                      @click="form.hardware.trueTone = 'no'"
                    >
                      Mất True Tone
                    </button>
                  </div>
                </div>

                <div class="rounded-[12px] border border-slate-200 bg-white p-3">
                  <p class="mb-2 text-xs font-bold text-slate-700">Ghim sạc cho máy</p>
                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      class="flex-1 rounded-[8px] py-1.5 text-[11px] font-bold ring-1"
                      :class="
                        form.hardware.charging !== 'unstable'
                          ? 'bg-emerald-600 text-white ring-emerald-600'
                          : 'bg-white text-slate-600 ring-slate-200'
                      "
                      @click="form.hardware.charging = 'good'"
                    >
                      Sạc ổn định
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-[8px] py-1.5 text-[11px] font-bold ring-1"
                      :class="
                        form.hardware.charging === 'unstable'
                          ? 'bg-rose-600 text-white ring-rose-600'
                          : 'bg-white text-slate-600 ring-slate-200'
                      "
                      @click="form.hardware.charging = 'unstable'"
                    >
                      Lỏng / Lỗi
                    </button>
                  </div>
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
                    YOLOv8s + PaddleOCR + Bảng giá sàn Loại 1–4 ({{ serviceHealth.ok ? ':8091 OK' : 'Chưa kết nối :8091' }})
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

            <p v-if="formNotice" class="rounded-[12px] bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              {{ formNotice }}
            </p>

            <template v-if="aiResult?.ran">
              <div
                v-if="aiResult.reject"
                class="rounded-[16px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"
              >
                Từ chối thu mua: {{ aiResult.rejectReason || aiResult.note }}
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-violet-100">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hạng máy</p>
                  <span
                    class="mt-2 inline-flex rounded-full px-2.5 py-1 text-sm font-black ring-1"
                    :class="gradeClass[aiResult.grade]"
                  >
                    {{ aiResult.grade === 'reject' ? 'Từ chối' : aiResult.grade }}
                  </span>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ aiResult.gradeLabel || gradeLabel(aiResult.grade) }}
                  </p>
                </div>
                <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-violet-100">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">OCR (Pin / Model)</p>
                  <p class="mt-1 text-sm font-bold text-slate-800">
                    {{ aiResult.ocr?.model || form.model }} · {{ aiResult.ocr?.rom || form.storage }}
                  </p>
                  <p class="text-xs text-slate-600">
                    Pin:
                    {{
                      (aiResult.ocr?.batteryPercent ?? aiResult.ocr?.battery_percent) != null
                        ? `${aiResult.ocr?.batteryPercent ?? aiResult.ocr?.battery_percent}%`
                        : 'Chưa đọc được'
                    }}
                  </p>
                  <p
                    v-if="aiResult.ocr?.unknownPart ?? aiResult.ocr?.unknown_part"
                    class="mt-1 text-xs font-bold text-rose-600"
                  >
                    ⚠ Unknown Part
                  </p>
                </div>
                <div class="rounded-[14px] bg-white px-4 py-3 ring-1 ring-violet-100">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Giá sàn áp dụng</p>
                  <p class="mt-1 text-lg font-black text-slate-800">
                    {{ formatCurrency(aiResult.basePrice || 0) }}
                  </p>
                  <p v-if="aiResult.floorLoai1" class="text-[11px] text-slate-400">
                    Loại 1: {{ formatCurrency(aiResult.floorLoai1) }}
                  </p>
                </div>
              </div>

              <!-- Annotated exterior photos with YOLO square boxes & circles -->
              <div
                v-if="exteriorGalleryItems(form.photos, aiResult).length"
                class="rounded-[16px] border border-slate-200 bg-slate-50/70 p-3.5"
              >
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-600">
                      Ảnh AI khoanh vùng chỗ hỏng ({{ exteriorGalleryItems(form.photos, aiResult).length }} góc)
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Bấm vào ảnh để phóng to hoặc tải ảnh có khoanh lỗi cho khách xem.
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button
                      v-for="modeOpt in [
                        { k: 'both', l: 'Vuông + Tròn' },
                        { k: 'circle', l: 'Khoanh tròn' },
                        { k: 'box', l: 'Khung vuông' },
                      ]"
                      :key="modeOpt.k"
                      type="button"
                      class="rounded-[8px] px-2.5 py-1 text-[11px] font-bold ring-1 transition"
                      :class="
                        bboxShapeMode === modeOpt.k
                          ? 'bg-violet-600 text-white ring-violet-600'
                          : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100'
                      "
                      @click="bboxShapeMode = modeOpt.k"
                    >
                      {{ modeOpt.l }}
                    </button>
                    <label class="ml-1 flex cursor-pointer items-center gap-1 text-[11px] font-medium text-slate-600">
                      <input v-model="showGoodBoxes" type="checkbox" class="h-3.5 w-3.5 accent-emerald-600" />
                      Hiện vùng good
                    </label>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="item in exteriorGalleryItems(form.photos, aiResult)"
                    :key="item.slotKey"
                    class="rounded-[14px] border bg-white p-2 shadow-sm"
                    :class="item.defectCount > 0 ? 'border-rose-300' : 'border-emerald-200'"
                  >
                    <div class="mb-1.5 flex items-center justify-between gap-1">
                      <p class="truncate text-[11px] font-bold text-slate-700">{{ item.label }}</p>
                      <span
                        class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        :class="
                          item.defectCount > 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        "
                      >
                        {{ item.defectCount > 0 ? `${item.defectCount} lỗi` : 'Đạt · Sạch' }}
                      </span>
                    </div>

                    <div
                      class="group relative cursor-zoom-in overflow-hidden rounded-[10px] bg-slate-900/5"
                      @click="openZoomInspect(item)"
                    >
                      <img :src="item.src" :alt="item.label" class="block h-auto w-full" />

                      <svg
                        v-if="item.detections.length"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        class="pointer-events-none absolute inset-0 h-full w-full"
                      >
                        <g v-for="det in item.detections" :key="det.id">
                          <rect
                            v-if="(bboxShapeMode === 'both' || bboxShapeMode === 'box') && ellipseGeom(det)"
                            :x="ellipseGeom(det).x"
                            :y="ellipseGeom(det).y"
                            :width="ellipseGeom(det).w"
                            :height="ellipseGeom(det).h"
                            :fill="bboxColorHex(det.class)"
                            fill-opacity="0.06"
                            :stroke="bboxColorHex(det.class)"
                            stroke-width="2"
                            vector-effect="non-scaling-stroke"
                          />
                          <ellipse
                            v-if="(bboxShapeMode === 'both' || bboxShapeMode === 'circle') && ellipseGeom(det)"
                            :cx="ellipseGeom(det).cx"
                            :cy="ellipseGeom(det).cy"
                            :rx="ellipseGeom(det).rx"
                            :ry="ellipseGeom(det).ry"
                            :fill="bboxColorHex(det.class)"
                            fill-opacity="0.1"
                            :stroke="bboxColorHex(det.class)"
                            stroke-width="1.6"
                            stroke-dasharray="3 1.5"
                            vector-effect="non-scaling-stroke"
                          />
                        </g>
                      </svg>

                      <template v-for="det in item.detections" :key="`lbl-${det.id}`">
                        <span
                          v-if="bboxStyle(det)"
                          class="pointer-events-none absolute rounded px-1 py-0.5 text-[9px] font-bold leading-none text-white shadow"
                          :class="parseFloat(bboxStyle(det).top) >= 8 ? '-translate-y-full' : ''"
                          :style="{
                            left: Math.min(82, Math.max(0, parseFloat(bboxStyle(det).left))) + '%',
                            top: Math.max(0.5, parseFloat(bboxStyle(det).top)) + '%',
                            backgroundColor: bboxColorHex(det.class),
                          }"
                        >
                          {{ det.class }} {{ Math.round((det.confidence || 0) * 100) }}%
                        </span>
                      </template>
                    </div>

                    <div class="mt-1.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        class="text-[11px] font-semibold text-violet-700 hover:underline"
                        @click="openZoomInspect(item)"
                      >
                        Phóng to
                      </button>
                      <button
                        type="button"
                        class="text-[11px] font-semibold text-slate-600 hover:underline"
                        @click="downloadAnnotatedImage(item)"
                      >
                        Tải ảnh lỗi
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Human-in-the-loop confirm boxes -->
              <div class="rounded-[16px] border border-red-100 bg-red-50/40 p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                    YOLO detections (Nhân viên xác nhận / bỏ chọn lỗi nhận nhầm)
                  </p>
                  <button
                    v-if="apiConnected && editingId && yoloDetections.length"
                    type="button"
                    class="rounded-[10px] bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-60"
                    :disabled="recalcBusy"
                    @click="applyConfirmedDetections"
                  >
                    {{ recalcBusy ? 'Đang tính lại…' : 'Cập nhật xác nhận & Tính lại giá' }}
                  </button>
                </div>

                <ul v-if="yoloDetections.length" class="mt-3 space-y-2">
                  <li
                    v-for="(d, i) in yoloDetections"
                    :key="d.id || i"
                    class="flex items-center justify-between gap-2 rounded-[10px] bg-white px-3 py-2 text-sm ring-1 ring-slate-100"
                  >
                    <label class="flex cursor-pointer items-center gap-2.5">
                      <input
                        v-model="d.confirmed"
                        type="checkbox"
                        :true-value="true"
                        :false-value="false"
                        class="h-4 w-4 accent-red-600"
                      />
                      <span class="font-medium text-slate-700" :class="{ 'line-through opacity-50': d.confirmed === false }">
                        {{ d.label || d.class }}
                        <span class="text-xs text-slate-400">
                          [{{ d.image || 'front' }} · {{ Math.round((d.confidence || 0) * 100) }}%]
                        </span>
                      </span>
                    </label>
                    <span class="text-xs font-bold text-slate-500">{{ d.class }}</span>
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
                  <span>Tổng chênh / khấu hao</span>
                  <span class="text-amber-900">−{{ formatCurrency(deductionTotal) }}</span>
                </div>
                <div class="mt-1 flex justify-between text-base font-black">
                  <span>Suggested FinalPrice</span>
                  <span class="text-red-600">{{ formatCurrency(aiResult.suggestedPrice || 0) }}</span>
                </div>
                <p class="mt-2 text-xs text-violet-800">{{ aiResult.note }}</p>
              </div>
            </template>

            <div v-else class="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Chưa có kết quả AI — tải ảnh rồi bấm «Chạy AutoGrade AI».
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
              :class="appraisalStatusClass[selected.status] || appraisalStatusClass.draft"
            >
              {{ statusLabel(selected.status) }}
            </span>
            <span
              v-if="selected.aiResult?.grade"
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
              :class="gradeClass[selected.aiResult.grade]"
            >
              {{ selected.aiResult.grade === 'reject' ? 'Từ chối' : `Hạng ${selected.aiResult.grade}` }}
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

          <div v-if="selected.photos" class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                Ảnh kiểm tra &amp; Khoanh vùng lỗi AI
              </p>
              <div class="flex gap-1">
                <button
                  v-for="m in [
                    { k: 'both', l: 'Vuông+Tròn' },
                    { k: 'circle', l: 'Tròn' },
                    { k: 'box', l: 'Vuông' },
                  ]"
                  :key="m.k"
                  type="button"
                  class="rounded px-2 py-0.5 text-[10px] font-bold ring-1"
                  :class="
                    bboxShapeMode === m.k
                      ? 'bg-violet-600 text-white ring-violet-600'
                      : 'bg-white text-slate-600 ring-slate-200'
                  "
                  @click="bboxShapeMode = m.k"
                >
                  {{ m.l }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in exteriorGalleryItems(selected.photos, selected.aiResult)"
                :key="item.slotKey"
                class="cursor-zoom-in overflow-hidden rounded-[12px] border bg-slate-50"
                :class="item.defectCount > 0 ? 'border-rose-300' : 'border-slate-200'"
                @click="openZoomInspect(item)"
              >
                <div class="relative bg-slate-900/5">
                  <img :src="item.src" :alt="item.label" class="block h-auto w-full" />
                  <svg
                    v-if="item.detections.length"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    class="pointer-events-none absolute inset-0 h-full w-full"
                  >
                    <g v-for="det in item.detections" :key="det.id">
                      <rect
                        v-if="(bboxShapeMode === 'both' || bboxShapeMode === 'box') && ellipseGeom(det)"
                        :x="ellipseGeom(det).x"
                        :y="ellipseGeom(det).y"
                        :width="ellipseGeom(det).w"
                        :height="ellipseGeom(det).h"
                        fill="none"
                        :stroke="bboxColorHex(det.class)"
                        stroke-width="1.4"
                        vector-effect="non-scaling-stroke"
                      />
                      <ellipse
                        v-if="(bboxShapeMode === 'both' || bboxShapeMode === 'circle') && ellipseGeom(det)"
                        :cx="ellipseGeom(det).cx"
                        :cy="ellipseGeom(det).cy"
                        :rx="ellipseGeom(det).rx"
                        :ry="ellipseGeom(det).ry"
                        :fill="bboxColorHex(det.class)"
                        fill-opacity="0.14"
                        :stroke="bboxColorHex(det.class)"
                        stroke-width="1.4"
                        vector-effect="non-scaling-stroke"
                      />
                    </g>
                  </svg>
                </div>
                <div class="flex items-center justify-between px-2 py-1">
                  <p class="truncate text-[11px] font-semibold text-slate-600">{{ item.label }}</p>
                  <span
                    v-if="selected.aiResult?.ran"
                    class="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    :class="item.defectCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
                  >
                    {{ item.defectCount > 0 ? `${item.defectCount} lỗi` : 'Đạt' }}
                  </span>
                </div>
              </div>

              <div
                v-if="selected.photos.battery?.url"
                class="overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50"
              >
                <img :src="selected.photos.battery.url" alt="Màn Pin / Giới thiệu" class="h-28 w-full object-cover" />
                <p class="px-2 py-1 text-[11px] font-semibold text-slate-600">Màn Pin / Giới thiệu</p>
              </div>
            </div>
          </div>

          <div v-if="selected.hardware" class="rounded-[14px] border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
            <div class="flex items-center justify-between">
              <p class="font-bold uppercase tracking-widest text-slate-400">Nội vi Mobile (14 mục)</p>
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                :class="
                  failedMobileItems(selected.hardware).length
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                "
              >
                {{ mobilePassCount(selected.hardware) }}/{{ MOBILE_DIAGNOSTIC_TESTS.length }} Tốt
              </span>
            </div>
            <p v-if="failedMobileItems(selected.hardware).length" class="mt-1.5 font-semibold text-rose-700">
              Lỗi: {{ failedMobileItems(selected.hardware).map((x) => x.label).join(', ') }}
            </p>
            <p class="mt-1 text-slate-600">
              True Tone: {{ selected.hardware.trueTone === 'no' ? 'Mất' : 'Còn' }} ·
              Phím nguồn: {{ selected.hardware.powerButton === 'broken' ? 'Lỗi' : 'Tốt' }} ·
              Sạc: {{ selected.hardware.charging === 'unstable' ? 'Lỏng/Lỗi' : 'Tốt' }}
            </p>
          </div>

          <div v-if="selected.aiResult?.ran" class="space-y-3 rounded-[16px] border border-violet-200 bg-violet-50/40 p-4">
            <p class="text-xs font-bold uppercase tracking-widest text-violet-500">Kết quả AI</p>
            <p class="text-sm text-slate-700">
              OCR: {{ selected.aiResult.ocr?.model || selected.model }} ·
              {{ selected.aiResult.ocr?.rom || selected.storage }} · Pin
              {{ selected.aiResult.ocr?.batteryPercent ?? selected.aiResult.ocr?.battery_percent ?? '—' }}%
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

          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-[14px] bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
              @click="openEdit(selected); closeDetail()"
            >
              Sửa / chạy lại AI
            </button>
            <button
              type="button"
              class="rounded-[14px] px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-60"
              :disabled="deleting"
              @click="removeTicket(selected)"
            >
              Xóa
            </button>
          </div>
        </div>
      </template>
    </AppSlideOver>

    <!-- Lightbox Phóng to ảnh khoanh vùng lỗi AI -->
    <AppModal :open="!!zoomInspect" @close="zoomInspect = null">
      <div
        v-if="zoomInspect"
        class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl"
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h4 class="text-base font-black text-slate-900">{{ zoomInspect.label }}</h4>
            <p class="text-xs text-slate-500">
              {{ zoomInspect.defectCount > 0 ? `Phát hiện ${zoomInspect.defectCount} vùng lỗi` : 'Không phát hiện lỗi ngoại quan' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[10px] bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
              @click="downloadAnnotatedImage(zoomInspect)"
            >
              Tải ảnh có khoanh lỗi (.png)
            </button>
            <button
              type="button"
              class="rounded-[10px] bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              @click="zoomInspect = null"
            >
              Đóng
            </button>
          </div>
        </div>

        <div class="overflow-auto bg-slate-950/95 p-4 text-center">
          <div class="relative mx-auto inline-block max-w-full">
            <img :src="zoomInspect.src" :alt="zoomInspect.label" class="block max-h-[72vh] w-auto max-w-full rounded-[10px]" />
            <svg
              v-if="zoomInspect.detections?.length"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              class="pointer-events-none absolute inset-0 h-full w-full"
            >
              <g v-for="det in zoomInspect.detections" :key="det.id">
                <rect
                  v-if="(bboxShapeMode === 'both' || bboxShapeMode === 'box') && ellipseGeom(det)"
                  :x="ellipseGeom(det).x"
                  :y="ellipseGeom(det).y"
                  :width="ellipseGeom(det).w"
                  :height="ellipseGeom(det).h"
                  fill="none"
                  :stroke="bboxColorHex(det.class)"
                  stroke-width="2.2"
                  vector-effect="non-scaling-stroke"
                />
                <ellipse
                  v-if="(bboxShapeMode === 'both' || bboxShapeMode === 'circle') && ellipseGeom(det)"
                  :cx="ellipseGeom(det).cx"
                  :cy="ellipseGeom(det).cy"
                  :rx="ellipseGeom(det).rx"
                  :ry="ellipseGeom(det).ry"
                  :fill="bboxColorHex(det.class)"
                  fill-opacity="0.16"
                  :stroke="bboxColorHex(det.class)"
                  stroke-width="2.4"
                  stroke-dasharray="5 3"
                  vector-effect="non-scaling-stroke"
                />
              </g>
            </svg>
            <template v-for="det in zoomInspect.detections || []" :key="`z-${det.id}`">
              <span
                v-if="bboxStyle(det)"
                class="pointer-events-none absolute -translate-y-full rounded px-1.5 py-0.5 text-xs font-bold text-white shadow"
                :style="{
                  left: bboxStyle(det).left,
                  top: Math.max(6, parseFloat(bboxStyle(det).top)) + '%',
                  backgroundColor: bboxColorHex(det.class),
                }"
              >
                {{ det.label || det.class }} ({{ Math.round((det.confidence || 0) * 100) }}%)
              </span>
            </template>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

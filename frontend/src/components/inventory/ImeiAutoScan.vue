<script setup>
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { createWorker } from 'tesseract.js'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import {
  appendImeiToText,
  appendManyImeisToText,
  extractAllImeisFromScan,
  extractImeiFromScan,
  preprocessCanvasForOcr,
} from '@/utils/imeiScan'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  requiredCount: { type: Number, default: 0 },
  importedCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'scanned'])

const scanInput = ref('')
const scanInputEl = ref(null)
const fileInputEl = ref(null)
const scanFlash = ref('')
const scanFlashType = ref('success') // 'success' | 'warning' | 'error'
const cameraOpen = ref(false)
const cameraError = ref('')
const cameraBusy = ref(false)
const scanningLabel = ref('')
const lastRaw = ref('')
const lastFailReason = ref('')
const ocrBusy = ref(false)
const ocrReady = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
const previewUrl = ref('')
const isDragging = ref(false)
const lastDetectedImeis = ref([])

let codeReader = null
let controls = null
let ocrWorker = null
let lastCameraHit = ''
let lastHitAt = 0
let wedgeBuffer = ''
let wedgeTimer = null

const remaining = computed(() => Math.max(0, props.requiredCount - props.importedCount))
const progressLabel = computed(() => `${props.importedCount}/${props.requiredCount}`)
const canUseCamera = computed(
  () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
)

function showFlash(message, type = 'success', duration = 3000) {
  scanFlash.value = message
  scanFlashType.value = type
  clearTimeout(showFlash._t)
  showFlash._t = setTimeout(() => {
    if (scanFlash.value === message) scanFlash.value = ''
  }, duration)
}

function commitImei(raw, source = 'scan') {
  if (props.disabled) return false
  const result = appendImeiToText(props.modelValue, raw)
  if (!result.imei && result.reason === 'invalid') {
    lastFailReason.value = 'Chưa đọc được IMEI 15 số hợp lệ — hãy đưa gần hơn hoặc kiểm tra tem.'
    showFlash(lastFailReason.value, 'error', 4000)
    return false
  }
  if (result.reason === 'duplicate') {
    showFlash(`IMEI ${result.imei} đã có sẵn trong phiếu này`, 'warning', 3500)
    return false
  }

  lastFailReason.value = ''
  lastDetectedImeis.value = [result.imei]
  emit('update:modelValue', result.text)
  emit('scanned', { imei: result.imei, source })
  showFlash(`✓ Đã nạp thành công IMEI: ${result.imei}`, 'success', 3000)
  return true
}

function commitMany(rawText, source) {
  if (props.disabled) return false
  const list = extractAllImeisFromScan(rawText)
  if (!list.length) {
    lastFailReason.value = lastRaw.value
      ? `Không tìm thấy dãy 15 số IMEI trên tem. Văn bản đọc được: "${lastRaw.value.slice(0, 60)}..."`
      : 'Không nhận diện được số IMEI trong ảnh tem.'
    showFlash(lastFailReason.value, 'error', 5000)
    return false
  }

  const result = appendManyImeisToText(props.modelValue, list)
  if (!result.added.length) {
    showFlash('Tất cả IMEI trong ảnh đã có sẵn trong phiếu', 'warning', 3500)
    return false
  }

  lastFailReason.value = ''
  lastDetectedImeis.value = result.added
  emit('update:modelValue', result.text)
  result.added.forEach((imei) => emit('scanned', { imei, source }))

  if (result.added.length === 1) {
    showFlash(`✓ Đã nạp IMEI: ${result.added[0]}`, 'success')
  } else {
    showFlash(
      `✓ Đã nạp ${result.added.length} IMEI (Dual SIM): ${result.added.join(', ')}`,
      'success',
      4000,
    )
  }
  return true
}

function acceptCameraText(raw, source) {
  const text = String(raw ?? '').trim()
  if (!text) return false
  lastRaw.value = text.replace(/\s+/g, ' ').slice(0, 100)

  const imei = extractImeiFromScan(text)
  if (!imei) {
    scanningLabel.value = `Đọc được ký tự nhưng chưa đủ 15 số: ${lastRaw.value.slice(0, 36)}`
    return false
  }

  const now = Date.now()
  if (imei === lastCameraHit && now - lastHitAt < 1600) return false
  lastCameraHit = imei
  lastHitAt = now

  const ok = commitImei(imei, source)
  if (ok) {
    scanningLabel.value = `✓ Quét thành công: ${imei}`
    if (remaining.value <= 0) closeCamera()
  }
  return ok
}

/** Súng quét barcode qua cổng USB: gom ký tự gõ cực nhanh rồi Enter */
function onScanKeydown(event) {
  if (props.disabled) return

  if (event.key === 'Enter') {
    event.preventDefault()
    const raw = scanInput.value || wedgeBuffer
    scanInput.value = ''
    wedgeBuffer = ''
    commitImei(raw, 'wedge')
    return
  }

  if (event.key.length === 1 && /\d/.test(event.key)) {
    wedgeBuffer += event.key
    clearTimeout(wedgeTimer)
    wedgeTimer = setTimeout(() => {
      if (normalizeDigits(wedgeBuffer).length >= 15) {
        const raw = wedgeBuffer
        wedgeBuffer = ''
        scanInput.value = ''
        commitImei(raw, 'wedge-auto')
      }
    }, 80)
  }
}

function normalizeDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function onScanPaste(event) {
  if (props.disabled) return
  const text = event.clipboardData?.getData('text') ?? ''
  if (!extractImeiFromScan(text)) return
  event.preventDefault()
  scanInput.value = ''
  commitMany(text, 'paste')
}

watch(scanInput, (value) => {
  if (props.disabled) return
  if (normalizeDigits(value).length < 15) return
  const imei = extractImeiFromScan(value)
  if (!imei) return
  scanInput.value = ''
  commitImei(imei, 'auto')
})

async function focusScanBox() {
  await nextTick()
  scanInputEl.value?.focus()
}

onMounted(() => {
  focusScanBox()
  window.addEventListener('paste', handleGlobalPaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handleGlobalPaste)
})

function handleGlobalPaste(event) {
  if (props.disabled || cameraOpen.value) return
  const items = event.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i += 1) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile()
      if (file) {
        processImageFile(file)
        break
      }
    }
  }
}

function buildReader() {
  const hints = new Map()
  hints.set(DecodeHintType.TRY_HARDER, true)
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
  ])
  return new BrowserMultiFormatReader(hints)
}

async function ensureOcrWorker() {
  if (ocrWorker) return ocrWorker
  scanningLabel.value = 'Đang khởi động bộ OCR nhận diện số...'
  ocrWorker = await createWorker('eng', 1, { logger: () => {} })
  await ocrWorker.setParameters({
    tessedit_char_whitelist: '0123456789IMEIimeiMEIDmeidSNsn/: -/.',
    tessedit_pageseg_mode: '6',
  })
  ocrReady.value = true
  return ocrWorker
}

function captureFrame() {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || video.readyState < 2) return null
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return null

  const cropW = Math.floor(w * 0.9)
  const cropH = Math.floor(h * 0.4)
  const sx = Math.floor((w - cropW) / 2)
  const sy = Math.floor((h - cropH) / 2)

  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH)
  return canvas
}

async function recognizeCanvas(sourceCanvas, source) {
  // 1. Thử quét mã vạch (Barcode) trước
  try {
    const reader = buildReader()
    const result = reader.decodeFromCanvas(sourceCanvas)
    if (result?.getText?.() && acceptCameraText(result.getText(), `${source}-barcode`)) {
      return true
    }
  } catch {
    /* không có barcode */
  }

  // 2. OCR ảnh với tiền xử lý tương phản động
  const prepared = preprocessCanvasForOcr(sourceCanvas, { scale: 2.2 })
  const worker = await ensureOcrWorker()
  const { data } = await worker.recognize(prepared)
  const text = data?.text ?? ''
  lastRaw.value = text.replace(/\s+/g, ' ').trim().slice(0, 120)

  if (commitMany(text, source)) {
    scanningLabel.value = `✓ Đã nhận diện được IMEI: ${extractAllImeisFromScan(text).join(', ')}`
    if (remaining.value <= 0) closeCamera()
    return true
  }

  // 3. Nếu chưa được, thử pass 2 với nhị phân hóa (Binarization)
  const binaryPrepared = preprocessCanvasForOcr(sourceCanvas, { scale: 2.2, binarize: true })
  const { data: data2 } = await worker.recognize(binaryPrepared)
  const text2 = data2?.text ?? ''
  if (text2) {
    lastRaw.value = text2.replace(/\s+/g, ' ').trim().slice(0, 120)
    if (commitMany(text2, `${source}-bin`)) {
      scanningLabel.value = `✓ Đã nhận diện được IMEI: ${extractAllImeisFromScan(text2).join(', ')}`
      if (remaining.value <= 0) closeCamera()
      return true
    }
  }

  return false
}

async function runOcrOnce() {
  if (ocrBusy.value || !cameraOpen.value) return
  const canvas = captureFrame()
  if (!canvas) {
    scanningLabel.value = 'Camera chưa sẵn sàng — vui lòng đợi 1 giây rồi thử lại'
    return
  }

  ocrBusy.value = true
  scanningLabel.value = 'Đang nhận diện số IMEI trong khung...'
  try {
    const ok = await recognizeCanvas(canvas, 'camera-ocr')
    if (!ok) {
      scanningLabel.value = lastRaw.value
        ? `Đọc được: "${lastRaw.value.slice(0, 45)}" — chưa đủ 15 số, đưa tem gần hơn`
        : 'Chưa đọc được — căn tem vào giữa khung đỏ và giữ vững tay'
    }
  } catch (err) {
    scanningLabel.value = err?.message || 'Lỗi nhận diện — nên dùng chức năng Chọn ảnh tem'
  } finally {
    ocrBusy.value = false
  }
}

async function processImageFile(file) {
  if (!file || props.disabled) return

  ocrBusy.value = true
  lastFailReason.value = ''
  showFlash('Đang phân tích ảnh tem...', 'warning', 10000)

  try {
    const url = URL.createObjectURL(file)
    previewUrl.value = url
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    const maxW = 1800
    const scale = img.width > maxW ? maxW / img.width : 1
    canvas.width = Math.floor(img.width * scale)
    canvas.height = Math.floor(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

    const ok = await recognizeCanvas(canvas, 'file-upload')
    if (!ok) {
      lastFailReason.value = lastRaw.value
        ? `Ảnh tem đọc được: "${lastRaw.value.slice(0, 60)}" nhưng chưa trích xuất được 15 số IMEI.`
        : 'Không tìm thấy thông tin IMEI trong ảnh vừa chọn.'
      showFlash(lastFailReason.value, 'error', 6000)
    }
  } catch (err) {
    lastFailReason.value = err?.message || 'Không thể mở tệp ảnh'
    showFlash(lastFailReason.value, 'error', 4000)
  } finally {
    ocrBusy.value = false
  }
}

function onPickImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) processImageFile(file)
}

function onDrop(event) {
  isDragging.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không thể tải tệp hình ảnh'))
    img.src = url
  })
}

async function openCamera() {
  cameraError.value = ''
  scanningLabel.value = 'Đang mở camera...'
  lastRaw.value = ''
  lastCameraHit = ''
  lastHitAt = 0

  if (!canUseCamera.value) {
    cameraError.value =
      'Thiết bị không hỗ trợ hoặc bị chặn camera. Vui lòng Chọn ảnh tem hoặc dùng súng quét.'
    cameraOpen.value = true
    return
  }

  cameraOpen.value = true
  cameraBusy.value = true
  await nextTick()

  try {
    ensureOcrWorker().catch(() => {})
    codeReader = buildReader()
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    if (!devices.length) throw new Error('Không tìm thấy thiết bị camera.')

    const preferred =
      devices.find((d) => /back|rear|environment|sau/i.test(d.label)) ?? devices[0]

    controls = await codeReader.decodeFromVideoDevice(
      preferred.deviceId,
      videoRef.value,
      (result, _err, ctrl) => {
        controls = ctrl
        if (!result) return
        acceptCameraText(result.getText(), 'barcode')
      },
    )

    scanningLabel.value = 'Camera đã sẵn sàng — Căn tem vào khung rồi bấm "Chụp OCR ngay"'
  } catch (err) {
    cameraError.value =
      err?.message ||
      'Không thể khởi động camera. Hãy cấp quyền truy cập hoặc sử dụng tính năng Chọn ảnh tem.'
    scanningLabel.value = ''
  } finally {
    cameraBusy.value = false
  }
}

async function closeCamera() {
  cameraOpen.value = false
  cameraError.value = ''
  cameraBusy.value = false
  scanningLabel.value = ''
  try {
    controls?.stop()
  } catch {
    /* ignore */
  }
  controls = null
  try {
    codeReader?.reset()
  } catch {
    /* ignore */
  }
  codeReader = null
  focusScanBox()
}

onBeforeUnmount(async () => {
  await closeCamera()
  if (ocrWorker) {
    try {
      await ocrWorker.terminate()
    } catch {
      /* ignore */
    }
    ocrWorker = null
  }
})
</script>

<template>
  <div class="space-y-3.5">
    <!-- Header thông tin tiến độ & nút hành động -->
    <div class="flex flex-wrap items-end justify-between gap-2.5">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-flex h-2 w-2 rounded-full bg-red-600"></span>
          <p class="text-xs font-black uppercase tracking-wider text-[#7A0C10]">
            Nạp IMEI tự động (AutoScan)
          </p>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Hỗ trợ: <strong class="text-slate-700">Ảnh chụp tem</strong> · Súng quét USB · Camera OCR
          — Còn thiếu:
          <span
            class="font-black"
            :class="remaining > 0 ? 'text-red-600' : 'text-emerald-700'"
          >
            {{ remaining }}
          </span>
          ({{ progressLabel }})
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[12px] bg-[#7A0C10] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#5B0B0F] disabled:opacity-50"
          :disabled="disabled || ocrBusy"
          @click="fileInputEl?.click()"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ ocrBusy ? 'Đang đọc ảnh...' : 'Chọn ảnh tem' }}
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[12px] border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="disabled"
          @click="openCamera"
        >
          <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Mở camera
        </button>

        <input
          ref="fileInputEl"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onPickImage"
        />
      </div>
    </div>

    <!-- Dropzone kéo thả ảnh hoặc dán ảnh (Ctrl+V) -->
    <div
      class="relative rounded-[16px] border-2 border-dashed p-3 text-center transition"
      :class="[
        isDragging
          ? 'border-red-500 bg-red-50/80'
          : 'border-slate-300 bg-white/80 hover:border-red-300 hover:bg-red-50/30',
        disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInputEl?.click()"
    >
      <div class="flex items-center justify-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div class="text-left">
          <p class="text-xs font-bold text-slate-800">
            Kéo thả ảnh tem vào đây, hoặc nhấn <kbd class="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh trực tiếp
          </p>
          <p class="text-[11px] text-slate-500">
            Hệ thống tự động lọc số IMEI (15 chữ số), hỗ trợ cả tem Dual SIM (IMEI 1 & 2)
          </p>
        </div>
      </div>
    </div>

    <!-- Ô nhận súng quét barcode USB & gõ tay -->
    <div class="rounded-[16px] border border-emerald-300 bg-emerald-50/60 p-3 ring-1 ring-emerald-200">
      <div class="flex items-center justify-between">
        <label class="mb-1 block text-[10px] font-black uppercase tracking-wider text-emerald-800">
          Ô nhận súng quét USB / Gõ tay IMEI (Nhấn Enter để nạp)
        </label>
        <span class="text-[10px] font-semibold text-emerald-700">Tự động bắt 15 chữ số</span>
      </div>

      <input
        ref="scanInputEl"
        v-model="scanInput"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :disabled="disabled"
        placeholder="Click vào đây rồi bóp súng quét hoặc gõ 15 số..."
        class="w-full rounded-[12px] border border-emerald-300 bg-white px-3.5 py-2.5 font-mono text-sm font-semibold tracking-wider text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 disabled:opacity-60"
        @keydown="onScanKeydown"
        @paste="onScanPaste"
        @focus="wedgeBuffer = ''"
      />
    </div>

    <!-- Thông báo kết quả / Thành công -->
    <div
      v-if="scanFlash"
      class="flex items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-xs font-semibold shadow-sm transition"
      :class="{
        'border border-emerald-300 bg-emerald-50 text-emerald-800': scanFlashType === 'success',
        'border border-amber-300 bg-amber-50 text-amber-900': scanFlashType === 'warning',
        'border border-rose-300 bg-rose-50 text-rose-800': scanFlashType === 'error',
      }"
    >
      <svg
        v-if="scanFlashType === 'success'"
        class="h-4 w-4 shrink-0 text-emerald-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else
        class="h-4 w-4 shrink-0"
        :class="scanFlashType === 'error' ? 'text-rose-600' : 'text-amber-600'"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <p class="leading-relaxed">{{ scanFlash }}</p>
    </div>

    <!-- Hộp gợi ý & Khắc phục khi quét/OCR thất bại (AC2) -->
    <div
      v-if="lastFailReason"
      class="rounded-[16px] border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-900"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-1.5 font-bold text-rose-800">
          <svg class="h-4 w-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Gợi ý khắc phục khi quét tem không nhận:</span>
        </div>
        <button
          type="button"
          class="font-semibold text-rose-600 hover:underline"
          @click="lastFailReason = ''"
        >
          Đóng
        </button>
      </div>

      <ul class="mt-2 list-inside list-disc space-y-1 pl-1 text-[11px] text-rose-800/90 leading-relaxed">
        <li><strong>Chụp cận cảnh:</strong> Đưa camera điện thoại cách tem 10–15cm, đủ sáng, không rung tay.</li>
        <li><strong>Tránh bóng đèn:</strong> Không để ánh đèn neon hoặc flash chiếu thẳng vào tem gây vệt chói trắng.</li>
        <li><strong>Tem có mã vạch:</strong> Căn thẳng thanh mã vạch dài bên dưới dòng chữ IMEI để quét barcode trực tiếp.</li>
        <li><strong>Tem chữ in mờ:</strong> Dùng súng quét mã vạch qua cổng USB hoặc gõ nhanh 15 số vào ô màu xanh ở trên.</li>
      </ul>

      <div class="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-[8px] bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"
          @click="fileInputEl?.click()"
        >
          Chọn ảnh khác
        </button>
        <button
          type="button"
          class="rounded-[8px] border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-800 hover:bg-rose-50"
          @click="focusScanBox"
        >
          Gõ tay / Súng quét
        </button>
      </div>
    </div>

    <!-- Modal Camera quét live -->
    <AppModal :open="cameraOpen" @close="closeCamera">
      <div class="w-full max-w-lg overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-red-100 px-4 py-3 bg-[#FFF7F7]">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-[#7A0C10]">Camera quét</p>
            <h3 class="text-base font-black text-[#111118]">Quét mã vạch & OCR IMEI</h3>
          </div>
          <button
            type="button"
            class="rounded-[10px] px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
            @click="closeCamera"
          >
            Đóng
          </button>
        </div>

        <div class="space-y-3 p-4">
          <p v-if="cameraBusy" class="text-xs font-semibold text-slate-600">Đang khởi động camera...</p>
          <p v-if="cameraError" class="rounded-[12px] bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {{ cameraError }}
          </p>

          <div class="relative overflow-hidden rounded-[16px] bg-black">
            <video
              ref="videoRef"
              class="max-h-[360px] w-full object-cover"
              playsinline
              muted
              autoplay
            />
            <!-- Khung đỏ hướng dẫn căn IMEI -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div class="h-[40%] w-[90%] rounded-[12px] border-2 border-red-500/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                <div class="absolute -top-3 left-3 bg-red-600 px-2 py-0.5 rounded text-[10px] font-black text-white">
                  Căn dòng IMEI hoặc Barcode vào đây
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p class="text-center text-xs font-bold text-white">
                {{ scanningLabel || 'Căn tem vào khung đỏ rồi bấm "Chụp OCR ngay"' }}
              </p>
            </div>
          </div>

          <canvas ref="canvasRef" class="hidden" />

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              class="flex-1 rounded-[12px] bg-[#DC2626] px-4 py-2.5 text-xs font-black text-white shadow transition hover:bg-[#B91C1C] disabled:opacity-50"
              :disabled="!!cameraError || cameraBusy || ocrBusy"
              @click="runOcrOnce"
            >
              {{ ocrBusy ? 'Đang phân tích ảnh...' : 'Chụp OCR ngay' }}
            </button>
            <button
              type="button"
              class="rounded-[12px] border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              :disabled="ocrBusy"
              @click="fileInputEl?.click()"
            >
              Chọn ảnh tem
            </button>
            <button
              type="button"
              class="rounded-[12px] border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              @click="closeCamera"
            >
              Hoàn tất
            </button>
          </div>

          <p class="text-[11px] leading-relaxed text-slate-500">
            Mẹo: Camera webcam laptop có tiêu cự cố định nên khó chụp nét chữ nhỏ. Chụp bằng điện thoại và dùng nút
            <strong>"Chọn ảnh tem"</strong> sẽ cho độ chính xác cao nhất (≥ 98%).
          </p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

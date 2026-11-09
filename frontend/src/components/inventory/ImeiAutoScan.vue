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

// Tính năng tự động quét (Auto-scan) và thông báo thành công
const autoScanEnabled = ref(true)
const modalSuccessImei = ref('')
const isSuccessFlashing = ref(false)

let codeReader = null
let controls = null
let ocrWorker = null
let lastCameraHit = ''
let lastHitAt = 0
let wedgeBuffer = ''
let wedgeTimer = null
let autoScanTimer = null

const remaining = computed(() => Math.max(0, props.requiredCount - props.importedCount))
const progressLabel = computed(() => `${props.importedCount}/${props.requiredCount}`)
const canUseCamera = computed(
  () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
)

/** Phát âm thanh bíp ngắn khi quét thành công */
function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // Nốt La (A5)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    /* audio không hỗ trợ hoặc bị chặn */
  }
}

function showFlash(message, type = 'success', duration = 3500) {
  scanFlash.value = message
  scanFlashType.value = type
  clearTimeout(showFlash._t)
  showFlash._t = setTimeout(() => {
    if (scanFlash.value === message) scanFlash.value = ''
  }, duration)
}

function triggerSuccessUI(imei) {
  playSuccessBeep()
  modalSuccessImei.value = imei
  isSuccessFlashing.value = true

  clearTimeout(triggerSuccessUI._t)
  triggerSuccessUI._t = setTimeout(() => {
    isSuccessFlashing.value = false
  }, 2200)

  // Nếu đã nạp đủ số lượng yêu cầu, tự động đóng camera sau 1.5s
  if (remaining.value <= 0) {
    setTimeout(() => {
      if (cameraOpen.value) closeCamera()
    }, 1500)
  }
}

function commitImei(raw, source = 'scan') {
  if (props.disabled) return false
  const result = appendImeiToText(props.modelValue, raw)
  if (!result.imei && result.reason === 'invalid') {
    lastFailReason.value = 'Chưa đọc được IMEI 15 số hợp lệ — hãy đưa tem gần hơn.'
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
  showFlash(`✓ Quét thành công IMEI: ${result.imei}`, 'success', 3500)
  triggerSuccessUI(result.imei)
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

  const primaryImei = result.added[0]
  if (result.added.length === 1) {
    showFlash(`✓ Quét thành công IMEI: ${primaryImei}`, 'success')
  } else {
    showFlash(
      `✓ Quét thành công ${result.added.length} IMEI (Dual SIM): ${result.added.join(', ')}`,
      'success',
      4000,
    )
  }
  triggerSuccessUI(primaryImei)
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
  if (imei === lastCameraHit && now - lastHitAt < 2000) return false
  lastCameraHit = imei
  lastHitAt = now

  const ok = commitImei(imei, source)
  if (ok) {
    scanningLabel.value = `✓ Quét thành công: ${imei}`
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
  stopAutoScanLoop()
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
  const cropH = Math.floor(h * 0.42)
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
    scanningLabel.value = `✓ Quét thành công: ${extractAllImeisFromScan(text).join(', ')}`
    return true
  }

  // 3. Nếu chưa được, thử pass 2 với nhị phân hóa (Binarization)
  const binaryPrepared = preprocessCanvasForOcr(sourceCanvas, { scale: 2.2, binarize: true })
  const { data: data2 } = await worker.recognize(binaryPrepared)
  const text2 = data2?.text ?? ''
  if (text2) {
    lastRaw.value = text2.replace(/\s+/g, ' ').trim().slice(0, 120)
    if (commitMany(text2, `${source}-bin`)) {
      scanningLabel.value = `✓ Quét thành công: ${extractAllImeisFromScan(text2).join(', ')}`
      return true
    }
  }

  return false
}

/** Vòng lặp tự động quét liên tục (Auto Continuous Scan) */
function startAutoScanLoop() {
  stopAutoScanLoop()
  autoScanTimer = setInterval(async () => {
    if (
      !cameraOpen.value ||
      !autoScanEnabled.value ||
      ocrBusy.value ||
      remaining.value <= 0 ||
      isSuccessFlashing.value
    ) {
      return
    }

    const canvas = captureFrame()
    if (!canvas) return

    try {
      ocrBusy.value = true
      scanningLabel.value = '🟢 Đang tự động quét tem liên tục...'
      await recognizeCanvas(canvas, 'auto-scan')
    } catch {
      /* ignore loop error */
    } finally {
      ocrBusy.value = false
    }
  }, 1100) // quét mỗi 1.1 giây
}

function stopAutoScanLoop() {
  if (autoScanTimer) {
    clearInterval(autoScanTimer)
    autoScanTimer = null
  }
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
    const ok = await recognizeCanvas(canvas, 'manual-ocr')
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
  modalSuccessImei.value = ''
  isSuccessFlashing.value = false

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

    scanningLabel.value = '🟢 Đang tự động quét tem... Căn tem vào khung'
    // Bắt đầu vòng lặp tự động quét liên tục
    startAutoScanLoop()
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
  stopAutoScanLoop()
  cameraOpen.value = false
  cameraError.value = ''
  cameraBusy.value = false
  scanningLabel.value = ''
  modalSuccessImei.value = ''
  isSuccessFlashing.value = false
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
</script>

<template>
  <div class="space-y-3.5">
    <!-- Header thông tin tiến độ & nút hành động -->
    <div class="flex flex-wrap items-end justify-between gap-2.5">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-ping"></span>
          <p class="text-xs font-black uppercase tracking-wider text-[#7A0C10]">
            Nạp IMEI tự động (AutoScan)
          </p>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Chế độ: <strong class="text-emerald-700">Tự động quét liên tục</strong> · Ảnh tem · Súng USB
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
          class="inline-flex items-center gap-1.5 rounded-[12px] bg-red-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          :disabled="disabled"
          @click="openCamera"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          Mở camera tự quét
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
            Tự động nhận diện dãy 15 số IMEI, hỗ trợ cả máy 2 SIM (IMEI 1 & IMEI 2)
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

    <!-- Banner THÔNG BÁO QUÉT THÀNH CÔNG RỰC RỠ -->
    <div
      v-if="scanFlash"
      class="flex items-center justify-between gap-2.5 rounded-[14px] p-3 shadow-md transition-all duration-300"
      :class="{
        'border-2 border-emerald-500 bg-emerald-500 text-white animate-pulse': scanFlashType === 'success',
        'border border-amber-300 bg-amber-50 text-amber-900': scanFlashType === 'warning',
        'border border-rose-300 bg-rose-50 text-rose-800': scanFlashType === 'error',
      }"
    >
      <div class="flex items-center gap-2.5">
        <div
          v-if="scanFlashType === 'success'"
          class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-black tracking-wide" :class="scanFlashType === 'success' ? 'text-white' : ''">
            {{ scanFlash }}
          </p>
          <p v-if="scanFlashType === 'success'" class="text-[11px] text-emerald-100 font-medium">
            Đã tự động thêm vào danh sách IMEI của phiếu nhập
          </p>
        </div>
      </div>

      <span
        v-if="scanFlashType === 'success'"
        class="rounded-full bg-white/20 px-2.5 py-1 font-mono text-[11px] font-black text-white"
      >
        {{ progressLabel }}
      </span>
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

    <!-- Modal Camera TỰ QUÉT LIÊN TỤC & THÔNG BÁO THÀNH CÔNG -->
    <AppModal :open="cameraOpen" @close="closeCamera">
      <div class="w-full max-w-lg overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-red-100 px-4 py-3 bg-[#FFF7F7]">
          <div class="flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-[#7A0C10]">Camera tự động</p>
              <h3 class="text-base font-black text-[#111118]">Tự động quét tem IMEI liên tục</h3>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Nút bật/tắt tự động quét -->
            <button
              type="button"
              class="rounded-full px-2.5 py-1 text-[11px] font-bold transition"
              :class="autoScanEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'"
              @click="autoScanEnabled = !autoScanEnabled"
            >
              {{ autoScanEnabled ? '🟢 Tự quét: BẬT' : '⚪ Tự quét: TẮT' }}
            </button>

            <button
              type="button"
              class="rounded-[10px] px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
              @click="closeCamera"
            >
              Đóng
            </button>
          </div>
        </div>

        <div class="space-y-3 p-4">
          <p v-if="cameraBusy" class="text-xs font-semibold text-slate-600">Đang khởi động camera...</p>
          <p v-if="cameraError" class="rounded-[12px] bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {{ cameraError }}
          </p>

          <div class="relative overflow-hidden rounded-[16px] bg-black">
            <video
              ref="videoRef"
              class="max-h-[380px] w-full object-cover"
              playsinline
              muted
              autoplay
            />

            <!-- Khung căn chỉnh quét (Đổi sang xanh lá khi quét thành công!) -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                class="relative h-[42%] w-[90%] rounded-[14px] border-2 transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                :class="isSuccessFlashing ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)]' : 'border-red-500/90'"
              >
                <!-- Tia quét laser động khi đang tự động quét -->
                <div
                  v-if="autoScanEnabled && !isSuccessFlashing"
                  class="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  style="animation: scanLaser 2s infinite ease-in-out;"
                ></div>

                <div
                  class="absolute -top-3 left-3 px-2 py-0.5 rounded text-[10px] font-black text-white transition-colors"
                  :class="isSuccessFlashing ? 'bg-emerald-600' : 'bg-red-600'"
                >
                  {{ isSuccessFlashing ? '✓ ĐÃ NHẬN DIỆN THÀNH CÔNG!' : 'Căn tem IMEI vào khung này' }}
                </div>
              </div>
            </div>

            <!-- POPUP THÔNG BÁO QUÉT THÀNH CÔNG NỔI BẬT NGAY TRÊN CAMERA -->
            <div
              v-if="isSuccessFlashing && modalSuccessImei"
              class="absolute inset-x-3 top-3 z-20 flex items-center justify-between rounded-[14px] bg-emerald-600 p-3.5 text-white shadow-2xl animate-bounce"
            >
              <div class="flex items-center gap-2.5">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-black uppercase tracking-wider text-emerald-100">
                    🎉 QUÉT THÀNH CÔNG!
                  </p>
                  <p class="font-mono text-base font-black tracking-widest text-white">
                    {{ modalSuccessImei }}
                  </p>
                </div>
              </div>

              <div class="text-right">
                <span class="rounded-full bg-white/20 px-2.5 py-1 text-xs font-black text-white">
                  {{ progressLabel }}
                </span>
                <p class="mt-1 text-[10px] font-semibold text-emerald-100">
                  {{ remaining > 0 ? `Còn thiếu ${remaining}` : 'Đã đủ số lượng!' }}
                </p>
              </div>
            </div>

            <!-- Status bar đáy camera -->
            <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3">
              <p class="text-center text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <span
                  class="inline-block h-2 w-2 rounded-full"
                  :class="autoScanEnabled ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'"
                ></span>
                {{ scanningLabel || 'Đang tự động quét liên tục...' }}
              </p>
            </div>
          </div>

          <canvas ref="canvasRef" class="hidden" />

          <!-- Các nút điều khiển camera -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              class="flex-1 rounded-[12px] bg-[#DC2626] px-4 py-2.5 text-xs font-black text-white shadow transition hover:bg-[#B91C1C] disabled:opacity-50"
              :disabled="!!cameraError || cameraBusy || ocrBusy"
              @click="runOcrOnce"
            >
              {{ ocrBusy ? 'Đang nhận diện...' : 'Chụp OCR ngay' }}
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
              class="rounded-[12px] bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800"
              @click="closeCamera"
            >
              Xong
            </button>
          </div>

          <p class="text-[11px] leading-relaxed text-slate-500">
            💡 <strong>Tự động quét liên tục đang bật:</strong> Chỉ cần giữ tem điện thoại thẳng vào khung đỏ, máy sẽ tự động đọc và kêu bíp khi nạp thành công mà không cần bấm nút.
          </p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
@keyframes scanLaser {
  0% {
    top: 5%;
  }
  50% {
    top: 90%;
  }
  100% {
    top: 5%;
  }
}
</style>

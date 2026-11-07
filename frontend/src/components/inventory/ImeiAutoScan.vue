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
const cameraOpen = ref(false)
const cameraError = ref('')
const cameraBusy = ref(false)
const scanningLabel = ref('')
const lastRaw = ref('')
const ocrBusy = ref(false)
const ocrReady = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
const previewUrl = ref('')

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

function showFlash(message, ok = true) {
  scanFlash.value = message
  clearTimeout(showFlash._t)
  showFlash._t = setTimeout(() => {
    if (scanFlash.value === message) scanFlash.value = ''
  }, ok ? 2000 : 3200)
}

function commitImei(raw, source = 'scan') {
  if (props.disabled) return false
  const result = appendImeiToText(props.modelValue, raw)
  if (!result.imei && result.reason === 'invalid') {
    showFlash('Chưa đọc được IMEI 15 số — đưa gần hơn hoặc chọn ảnh tem', false)
    return false
  }
  if (result.reason === 'duplicate') {
    showFlash(`IMEI ${result.imei} đã có trong phiếu`, false)
    return false
  }
  emit('update:modelValue', result.text)
  emit('scanned', { imei: result.imei, source })
  showFlash(`Đã nạp ${result.imei}`)
  return true
}

function commitMany(rawText, source) {
  if (props.disabled) return false
  const list = extractAllImeisFromScan(rawText)
  if (!list.length) {
    showFlash('Không thấy IMEI 15 số trong ảnh/tem', false)
    return false
  }
  const result = appendManyImeisToText(props.modelValue, list)
  if (!result.added.length) {
    showFlash('IMEI trong ảnh đã có sẵn trong phiếu', false)
    return false
  }
  emit('update:modelValue', result.text)
  result.added.forEach((imei) => emit('scanned', { imei, source }))
  showFlash(
    result.added.length === 1
      ? `Đã nạp ${result.added[0]}`
      : `Đã nạp ${result.added.length} IMEI`,
  )
  return true
}

function acceptCameraText(raw, source) {
  const text = String(raw ?? '').trim()
  if (!text) return false
  lastRaw.value = text.replace(/\s+/g, ' ').slice(0, 100)

  const imei = extractImeiFromScan(text)
  if (!imei) {
    scanningLabel.value = `Đọc được chữ nhưng chưa đủ 15 số: ${lastRaw.value.slice(0, 36)}`
    return false
  }

  const now = Date.now()
  if (imei === lastCameraHit && now - lastHitAt < 1600) return false
  lastCameraHit = imei
  lastHitAt = now

  const ok = commitImei(imei, source)
  if (ok) {
    scanningLabel.value = `Đã quét được ${imei}`
    if (remaining.value <= 0) closeCamera()
  }
  return ok
}

/** Súng quét: gom phím nhanh rồi Enter / đủ 15 số. */
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

onMounted(focusScanBox)

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
  scanningLabel.value = 'Đang tải OCR lần đầu (chỉ 1 lần)...'
  ocrWorker = await createWorker('eng', 1, { logger: () => {} })
  await ocrWorker.setParameters({
    tessedit_char_whitelist: '0123456789IMEIimei:/ -',
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

  const cropW = Math.floor(w * 0.88)
  const cropH = Math.floor(h * 0.34)
  const sx = Math.floor((w - cropW) / 2)
  const sy = Math.floor((h - cropH) / 2)

  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH)
  return canvas
}

async function recognizeCanvas(sourceCanvas, source) {
  // 1) barcode trên ảnh gốc
  try {
    const reader = buildReader()
    const result = reader.decodeFromCanvas(sourceCanvas)
    if (result?.getText?.() && acceptCameraText(result.getText(), `${source}-barcode`)) {
      return true
    }
  } catch {
    /* no barcode */
  }

  // 2) OCR ảnh đã tiền xử lý
  const prepared = preprocessCanvasForOcr(sourceCanvas)
  const worker = await ensureOcrWorker()
  const { data } = await worker.recognize(prepared)
  const text = data?.text ?? ''
  lastRaw.value = text.replace(/\s+/g, ' ').trim().slice(0, 100)

  if (commitMany(text, source)) {
    scanningLabel.value = `OCR OK: ${extractAllImeisFromScan(text).join(', ')}`
    if (remaining.value <= 0) closeCamera()
    return true
  }

  return false
}

async function runOcrOnce() {
  if (ocrBusy.value || !cameraOpen.value) return
  const canvas = captureFrame()
  if (!canvas) {
    scanningLabel.value = 'Camera chưa sẵn sàng — đợi 1 giây rồi thử lại'
    return
  }

  ocrBusy.value = true
  scanningLabel.value = 'Đang đọc IMEI trong khung đỏ...'
  try {
    const ok = await recognizeCanvas(canvas, 'ocr')
    if (!ok) {
      scanningLabel.value = lastRaw.value
        ? `OCR thấy: "${lastRaw.value}" — chưa đủ 15 số, chỉnh góc/ánh sáng`
        : 'Chưa đọc được — đưa tem sát khung đỏ, đủ sáng, chữ rõ'
    }
  } catch (err) {
    scanningLabel.value = err?.message || 'OCR lỗi — thử Chọn ảnh tem'
  } finally {
    ocrBusy.value = false
  }
}

async function onPickImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || props.disabled) return

  ocrBusy.value = true
  showFlash('Đang đọc ảnh tem...', true)
  try {
    const url = URL.createObjectURL(file)
    previewUrl.value = url
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    const maxW = 1600
    const scale = img.width > maxW ? maxW / img.width : 1
    canvas.width = Math.floor(img.width * scale)
    canvas.height = Math.floor(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

    const ok = await recognizeCanvas(canvas, 'file')
    if (!ok) {
      showFlash(
        lastRaw.value
          ? `Ảnh đọc được "${lastRaw.value.slice(0, 28)}" nhưng chưa đủ IMEI`
          : 'Ảnh chưa đọc được IMEI — chụp gần, rõ nét hơn',
        false,
      )
    }
    URL.revokeObjectURL(url)
  } catch (err) {
    showFlash(err?.message || 'Không đọc được ảnh', false)
  } finally {
    ocrBusy.value = false
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không mở được ảnh'))
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
      'Máy không mở được camera. Dùng súng USB, gõ 15 số, hoặc Chọn ảnh tem.'
    cameraOpen.value = true
    return
  }

  cameraOpen.value = true
  cameraBusy.value = true
  await nextTick()

  try {
    // Preload OCR song song
    ensureOcrWorker().catch(() => {})

    codeReader = buildReader()
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    if (!devices.length) throw new Error('Không tìm thấy camera trên máy.')

    const preferred =
      devices.find((d) => /back|rear|environment|sau/i.test(d.label)) ??
      devices[0]

    controls = await codeReader.decodeFromVideoDevice(
      preferred.deviceId,
      videoRef.value,
      (result, _err, ctrl) => {
        controls = ctrl
        if (!result) return
        acceptCameraText(result.getText(), 'barcode')
      },
    )

    scanningLabel.value = 'Camera sẵn sàng — căn IMEI vào khung rồi bấm Chụp OCR'
  } catch (err) {
    cameraError.value =
      err?.message ||
      'Không mở được camera. Cho phép quyền camera, hoặc Chọn ảnh tem / súng quét.'
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
  <div class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Quét IMEI tự động</p>
        <p class="mt-1 text-xs text-slate-500">
          Súng USB · ảnh tem · camera OCR — còn thiếu
          <span class="font-semibold text-slate-700">{{ remaining }}</span>
          ({{ progressLabel }})
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
          :disabled="disabled || ocrBusy"
          @click="fileInputEl?.click()"
        >
          Chọn ảnh tem
        </button>
        <button
          type="button"
          class="rounded-[12px] bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          :disabled="disabled"
          @click="openCamera"
        >
          Quét camera
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

    <div class="rounded-[16px] border border-emerald-200 bg-emerald-50/70 p-3 ring-1 ring-emerald-100">
      <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-emerald-800">
        Ô nhận súng quét / gõ IMEI (ổn định nhất)
      </label>
      <input
        ref="scanInputEl"
        v-model="scanInput"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :disabled="disabled"
        placeholder="Click vào đây rồi quét súng hoặc gõ 15 số + Enter..."
        class="w-full rounded-[12px] border border-emerald-300 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
        @keydown="onScanKeydown"
        @paste="onScanPaste"
        @focus="wedgeBuffer = ''"
      />
      <p class="mt-1.5 text-[11px] leading-relaxed text-emerald-800/90">
        Tem chỉ có chữ in → <strong>Chọn ảnh tem</strong> hoặc camera + <strong>Chụp OCR</strong>.
        Webcam laptop thường khó đọc; ảnh chụp gần từ điện thoại tốt hơn.
      </p>
    </div>

    <p
      v-if="scanFlash"
      class="rounded-[12px] px-3 py-2 text-xs font-semibold"
      :class="scanFlash.includes('Đã nạp') || scanFlash.includes('Đang đọc') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'"
    >
      {{ scanFlash }}
    </p>

    <AppModal :open="cameraOpen" @close="closeCamera">
      <div class="w-full max-w-lg overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-red-100 px-4 py-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-red-600">Camera</p>
            <h3 class="text-lg font-black text-[#111118]">Quét / OCR IMEI</h3>
          </div>
          <button
            type="button"
            class="rounded-[10px] px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            @click="closeCamera"
          >
            Đóng
          </button>
        </div>

        <div class="space-y-3 p-4">
          <p v-if="cameraBusy" class="text-xs font-medium text-slate-500">Đang mở camera...</p>
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
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div class="h-[34%] w-[88%] rounded-[12px] border-2 border-red-500/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <div class="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent px-3 py-2">
              <p class="text-center text-[11px] font-semibold text-white">
                {{ scanningLabel || 'Căn dãy 15 số IMEI vào khung đỏ' }}
              </p>
            </div>
          </div>

          <canvas ref="canvasRef" class="hidden" />

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-[12px] bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="!!cameraError || cameraBusy || ocrBusy"
              @click="runOcrOnce"
            >
              {{ ocrBusy ? 'Đang đọc...' : 'Chụp OCR ngay' }}
            </button>
            <button
              type="button"
              class="rounded-[12px] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
              :disabled="ocrBusy"
              @click="fileInputEl?.click()"
            >
              Chọn ảnh tem
            </button>
            <button
              type="button"
              class="rounded-[12px] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              @click="closeCamera"
            >
              Xong
            </button>
          </div>

          <p class="text-xs leading-relaxed text-slate-500">
            Webcam laptop thường mờ — nên <strong>chụp ảnh tem bằng điện thoại</strong> rồi
            <strong>Chọn ảnh tem</strong>. Trong camera: căn số vào khung → bấm
            <strong>Chụp OCR ngay</strong> (không chờ tự quét).
          </p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

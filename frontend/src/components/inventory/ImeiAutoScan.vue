<script setup>
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { createWorker } from 'tesseract.js'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import { appendImeiToText, extractImeiFromScan } from '@/utils/imeiScan'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  requiredCount: { type: Number, default: 0 },
  importedCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'scanned'])

const scanInput = ref('')
const scanInputEl = ref(null)
const scanFlash = ref('')
const cameraOpen = ref(false)
const cameraError = ref('')
const cameraBusy = ref(false)
const scanningLabel = ref('')
const lastRaw = ref('')
const ocrBusy = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)

let codeReader = null
let controls = null
let ocrTimer = null
let ocrWorker = null
let lastCameraHit = ''
let lastHitAt = 0

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
  }, ok ? 1800 : 2600)
}

function commitImei(raw, source = 'scan') {
  if (props.disabled) return false
  const result = appendImeiToText(props.modelValue, raw)
  if (!result.imei && result.reason === 'invalid') {
    showFlash('Chưa đọc được IMEI 15 số — thử lại gần hơn / bấm Chụp OCR', false)
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

function acceptCameraText(raw, source) {
  const text = String(raw ?? '').trim()
  if (!text) return false
  lastRaw.value = text

  const imei = extractImeiFromScan(text)
  if (!imei) {
    scanningLabel.value = `Đã thấy chữ/mã nhưng chưa đủ 15 số: ${text.slice(0, 40)}`
    return false
  }

  const now = Date.now()
  if (imei === lastCameraHit && now - lastHitAt < 1500) return false
  lastCameraHit = imei
  lastHitAt = now

  const ok = commitImei(imei, source)
  if (ok) {
    scanningLabel.value = `Đã quét được ${imei}`
    if (remaining.value <= 0) closeCamera()
  }
  return ok
}

function onScanKeydown(event) {
  if (props.disabled) return
  if (event.key !== 'Enter') return
  event.preventDefault()
  const raw = scanInput.value
  scanInput.value = ''
  commitImei(raw, 'wedge')
}

function onScanPaste(event) {
  if (props.disabled) return
  const text = event.clipboardData?.getData('text') ?? ''
  const imei = extractImeiFromScan(text)
  if (!imei) return
  event.preventDefault()
  scanInput.value = ''
  commitImei(imei, 'paste')
}

watch(scanInput, (value) => {
  if (props.disabled) return
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length < 15) return
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
  ocrWorker = await createWorker('eng', 1, {
    logger: () => {},
  })
  await ocrWorker.setParameters({
    tessedit_char_whitelist: '0123456789IMEIimei:/ -',
  })
  return ocrWorker
}

function captureFrame() {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || video.readyState < 2) return null
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return null

  // Crop giữa khung (vùng khung quét) để OCR/barcode dễ hơn
  const cropW = Math.floor(w * 0.82)
  const cropH = Math.floor(h * 0.28)
  const sx = Math.floor((w - cropW) / 2)
  const sy = Math.floor((h - cropH) / 2)

  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH)
  return canvas
}

async function runOcrOnce(manual = false) {
  if (ocrBusy.value || !cameraOpen.value) return
  const canvas = captureFrame()
  if (!canvas) return

  ocrBusy.value = true
  if (manual) scanningLabel.value = 'Đang OCR khung hình...'
  try {
    // Thử barcode trên frame trước (nhanh)
    try {
      const reader = buildReader()
      const result = reader.decodeFromCanvas(canvas)
      if (result?.getText?.()) {
        acceptCameraText(result.getText(), 'camera-frame')
        return
      }
    } catch {
      /* no barcode in frame */
    }

    const worker = await ensureOcrWorker()
    const { data } = await worker.recognize(canvas)
    const text = data?.text ?? ''
    lastRaw.value = text.replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!acceptCameraText(text, 'ocr') && manual) {
      scanningLabel.value = lastRaw.value
        ? `OCR thấy: "${lastRaw.value}" — chưa đủ IMEI 15 số`
        : 'OCR chưa đọc được số — đưa tem gần hơn, đủ sáng'
    }
  } catch (err) {
    if (manual) {
      scanningLabel.value = err?.message || 'OCR lỗi — thử lại'
    }
  } finally {
    ocrBusy.value = false
  }
}

async function openCamera() {
  cameraError.value = ''
  scanningLabel.value = 'Đang mở camera...'
  lastRaw.value = ''
  lastCameraHit = ''
  lastHitAt = 0

  if (!canUseCamera.value) {
    cameraError.value =
      'Máy này không mở được camera. Dùng súng quét USB hoặc dán/gõ IMEI vào ô xanh.'
    cameraOpen.value = true
    return
  }

  cameraOpen.value = true
  cameraBusy.value = true
  await nextTick()

  try {
    codeReader = buildReader()
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    if (!devices.length) throw new Error('Không tìm thấy camera trên máy.')

    const backCam =
      devices.find((d) => /back|rear|environment|sau/i.test(d.label)) ?? devices[0]

    controls = await codeReader.decodeFromVideoDevice(
      backCam.deviceId,
      videoRef.value,
      (result, _err, ctrl) => {
        controls = ctrl
        if (!result) return
        acceptCameraText(result.getText(), 'barcode')
      },
    )

    scanningLabel.value = 'Đang quét barcode liên tục — đưa tem vào khung đỏ'
    // OCR định kỳ: tem IMEI nhiều máy chỉ in chữ, không phải barcode
    ocrTimer = window.setInterval(() => {
      runOcrOnce(false)
    }, 1600)
  } catch (err) {
    cameraError.value =
      err?.message ||
      'Không mở được camera. Cho phép quyền camera, hoặc dùng súng quét / gõ IMEI.'
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
  if (ocrTimer) {
    clearInterval(ocrTimer)
    ocrTimer = null
  }
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
          Súng quét · camera (barcode + OCR chữ) — còn thiếu
          <span class="font-semibold text-slate-700">{{ remaining }}</span>
          ({{ progressLabel }})
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
          :disabled="disabled"
          @click="focusScanBox"
        >
          Focus ô quét
        </button>
        <button
          type="button"
          class="rounded-[12px] bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          :disabled="disabled"
          @click="openCamera"
        >
          Quét camera
        </button>
      </div>
    </div>

    <div class="rounded-[16px] border border-emerald-200 bg-emerald-50/70 p-3 ring-1 ring-emerald-100">
      <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-emerald-800">
        Ô nhận súng quét / gõ IMEI
      </label>
      <input
        ref="scanInputEl"
        v-model="scanInput"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :disabled="disabled"
        placeholder="Click vào đây rồi quét hoặc gõ 15 số..."
        class="w-full rounded-[12px] border border-emerald-300 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
        @keydown="onScanKeydown"
        @paste="onScanPaste"
      />
      <p class="mt-1.5 text-[11px] text-emerald-800/80">
        Tem chỉ in chữ (không có vạch) → dùng camera + nút <strong>Chụp OCR</strong>. Có súng USB thì ổn định hơn.
      </p>
    </div>

    <p
      v-if="scanFlash"
      class="rounded-[12px] px-3 py-2 text-xs font-semibold"
      :class="scanFlash.includes('Đã nạp') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'"
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
            <!-- Khung hướng dẫn vùng đọc -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div class="h-[28%] w-[82%] rounded-[12px] border-2 border-red-500/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <div class="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent px-3 py-2">
              <p class="text-center text-[11px] font-semibold text-white">
                {{ scanningLabel || 'Đưa dãy IMEI 15 số vào khung đỏ' }}
              </p>
            </div>
          </div>

          <canvas ref="canvasRef" class="hidden" />

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-[12px] bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="!!cameraError || cameraBusy || ocrBusy"
              @click="runOcrOnce(true)"
            >
              {{ ocrBusy ? 'Đang đọc...' : 'Chụp OCR ngay' }}
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
            1) Căn dãy số IMEI vào <span class="font-semibold text-red-600">khung đỏ</span>, đủ sáng.<br />
            2) Nếu tem có vạch barcode → tự nhận.<br />
            3) Nếu chỉ có chữ in → bấm <span class="font-semibold">Chụp OCR ngay</span>.
          </p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

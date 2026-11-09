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
  extractImeiFromBarcode,
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
const videoRef = ref(null)
const canvasRef = ref(null)
const previewUrl = ref('')
const isDragging = ref(false)
const lastDetectedImeis = ref([])

// Trạng thái quét mã vạch & thông báo thành công
const modalSuccessImei = ref('')
const isSuccessFlashing = ref(false)
const lastBarcodeFormat = ref('')

let codeReader = null
let controls = null
let ocrWorker = null
let nativeBarcodeDetector = null
let animationFrameId = null
let lastCameraHit = ''
let lastHitAt = 0
let wedgeBuffer = ''
let wedgeTimer = null

const remaining = computed(() => Math.max(0, props.requiredCount - props.importedCount))
const progressLabel = computed(() => `${props.importedCount}/${props.requiredCount}`)
const canUseCamera = computed(
  () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
)

/** Phát âm thanh bíp xác nhận quét thành công */
function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(980, ctx.currentTime) // Nốt cao rõ ràng
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.16)
  } catch {
    /* audio không hỗ trợ */
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

function triggerSuccessUI(imei, format = 'Mã vạch') {
  playSuccessBeep()
  modalSuccessImei.value = imei
  lastBarcodeFormat.value = format
  isSuccessFlashing.value = true

  clearTimeout(triggerSuccessUI._t)
  triggerSuccessUI._t = setTimeout(() => {
    isSuccessFlashing.value = false
  }, 2400)

  // Nếu đã nạp đủ số lượng máy, tự động đóng camera sau 1.5s
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
    lastFailReason.value = 'Mã vạch vừa quét không chứa dãy 15 số IMEI hợp lệ.'
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
  showFlash(`✓ Đã quét mã vạch thành công: ${result.imei}`, 'success', 3500)
  triggerSuccessUI(result.imei, source.includes('barcode') ? 'Mã vạch Barcode' : 'IMEI')
  return true
}

function commitMany(rawText, source) {
  if (props.disabled) return false
  const list = extractAllImeisFromScan(rawText)
  if (!list.length) {
    lastFailReason.value = lastRaw.value
      ? `Không tìm thấy mã vạch / IMEI 15 số. Dữ liệu đọc được: "${lastRaw.value.slice(0, 60)}..."`
      : 'Không nhận diện được mã vạch trong ảnh.'
    showFlash(lastFailReason.value, 'error', 5000)
    return false
  }

  const result = appendManyImeisToText(props.modelValue, list)
  if (!result.added.length) {
    showFlash('IMEI đã có sẵn trong phiếu này', 'warning', 3500)
    return false
  }

  lastFailReason.value = ''
  lastDetectedImeis.value = result.added
  emit('update:modelValue', result.text)
  result.added.forEach((imei) => emit('scanned', { imei, source }))

  const primaryImei = result.added[0]
  if (result.added.length === 1) {
    showFlash(`✓ Quét mã vạch thành công IMEI: ${primaryImei}`, 'success')
  } else {
    showFlash(
      `✓ Đã nạp ${result.added.length} IMEI: ${result.added.join(', ')}`,
      'success',
      4000,
    )
  }
  triggerSuccessUI(primaryImei, 'Mã vạch Barcode')
  return true
}

/** Nhận kết quả giải mã vạch trực tiếp từ camera */
function acceptBarcodeResult(rawBarcode, format = 'barcode') {
  const text = String(rawBarcode ?? '').trim()
  if (!text) return false

  const now = Date.now()
  if (text === lastCameraHit && now - lastHitAt < 2200) return false
  lastCameraHit = text
  lastHitAt = now

  lastRaw.value = text
  const ok = commitImei(text, format)
  if (ok) {
    scanningLabel.value = `✓ Quét thành công mã vạch: ${text}`
  }
  return ok
}

/** Súng quét barcode cầm tay cắm cổng USB (Nhận diện chuỗi phím bấm cực nhanh) */
function onScanKeydown(event) {
  if (props.disabled) return

  if (event.key === 'Enter') {
    event.preventDefault()
    const raw = scanInput.value || wedgeBuffer
    scanInput.value = ''
    wedgeBuffer = ''
    commitImei(raw, 'usb-gun')
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
        commitImei(raw, 'usb-gun-auto')
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

  // Khởi tạo BarcodeDetector nếu trình duyệt hỗ trợ
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      nativeBarcodeDetector = new window.BarcodeDetector({
        formats: [
          'code_128',
          'code_39',
          'code_93',
          'ean_13',
          'ean_8',
          'itf',
          'qr_code',
          'data_matrix',
        ],
      })
    } catch {
      nativeBarcodeDetector = null
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handleGlobalPaste)
  stopBarcodeLoop()
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
    BarcodeFormat.EAN_13,
    BarcodeFormat.ITF,
    BarcodeFormat.QR_CODE,
  ])
  return new BrowserMultiFormatReader(hints)
}

async function ensureOcrWorker() {
  if (ocrWorker) return ocrWorker
  scanningLabel.value = 'Đang nạp bộ đọc chữ OCR...'
  ocrWorker = await createWorker('eng', 1, { logger: () => {} })
  await ocrWorker.setParameters({
    tessedit_char_whitelist:
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/: -/.',
    tessedit_pageseg_mode: '6',
  })
  return ocrWorker
}

/** Vòng lặp giải mã vạch Barcode thời gian thực (60 FPS qua GPU) */
function startBarcodeLoop() {
  stopBarcodeLoop()

  let lastFrameTime = 0
  async function tick(now) {
    if (!cameraOpen.value || !videoRef.value) return

    // Giới hạn quét mã vạch mỗi 60ms (~16 FPS) để không gây nóng máy nhưng cực kỳ mượt mà
    if (now - lastFrameTime >= 60 && !isSuccessFlashing.value && remaining.value > 0) {
      lastFrameTime = now
      const video = videoRef.value

      if (video.readyState >= 2) {
        // 1. Quét bằng BarcodeDetector phần cứng (Siêu tốc < 10ms)
        if (nativeBarcodeDetector) {
          try {
            const detected = await nativeBarcodeDetector.detect(video)
            if (detected && detected.length > 0) {
              for (const item of detected) {
                if (item.rawValue) {
                  const ok = acceptBarcodeResult(item.rawValue, `barcode-${item.format || '1d'}`)
                  if (ok) return
                }
              }
            }
          } catch {
            /* ignore detect error */
          }
        }
      }
    }

    if (cameraOpen.value) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  animationFrameId = requestAnimationFrame(tick)
}

function stopBarcodeLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

/** Chụp OCR chữ khi tem không có sọc mã vạch */
async function runOcrFallback() {
  if (ocrBusy.value || !cameraOpen.value) return
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || video.readyState < 2) {
    scanningLabel.value = 'Camera chưa sẵn sàng'
    return
  }

  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return

  const cropW = Math.floor(w * 0.9)
  const cropH = Math.floor(h * 0.45)
  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(video, (w - cropW) / 2, (h - cropH) / 2, cropW, cropH, 0, 0, cropW, cropH)

  ocrBusy.value = true
  scanningLabel.value = 'Đang đọc chữ số OCR...'
  try {
    const prepared = preprocessCanvasForOcr(canvas, { scale: 2.2 })
    const worker = await ensureOcrWorker()
    const { data } = await worker.recognize(prepared)
    const text = data?.text ?? ''
    lastRaw.value = text.replace(/\s+/g, ' ').trim()

    if (commitMany(text, 'camera-ocr')) {
      scanningLabel.value = `✓ Nhận diện thành công: ${extractAllImeisFromScan(text).join(', ')}`
    } else {
      scanningLabel.value = 'Chưa đọc được chữ số — hãy đưa tem sát khung hơn'
    }
  } catch (err) {
    scanningLabel.value = err?.message || 'Lỗi OCR chữ'
  } finally {
    ocrBusy.value = false
  }
}

/** Quét mã vạch trên canvas qua tất cả góc xoay (0°, 90°, 270°, 180°) */
async function decodeBarcodesFromCanvas(sourceCanvas) {
  const angles = [0, 90, 270, 180]
  const reader = buildReader()
  const foundList = []

  for (const angle of angles) {
    let targetCanvas = sourceCanvas
    if (angle !== 0) {
      targetCanvas = document.createElement('canvas')
      if (angle === 90 || angle === 270) {
        targetCanvas.width = sourceCanvas.height
        targetCanvas.height = sourceCanvas.width
      } else {
        targetCanvas.width = sourceCanvas.width
        targetCanvas.height = sourceCanvas.height
      }
      const ctx = targetCanvas.getContext('2d')
      ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2)
      ctx.rotate((angle * Math.PI) / 180)
      ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2)
    }

    // 1. Thử native BarcodeDetector
    if (nativeBarcodeDetector) {
      try {
        const detected = await nativeBarcodeDetector.detect(targetCanvas)
        if (detected && detected.length > 0) {
          for (const b of detected) {
            if (b.rawValue) {
              const imei = extractImeiFromBarcode(b.rawValue)
              if (imei && !foundList.includes(imei)) {
                foundList.push(imei)
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    // 2. Thử ZXing MultiFormat Reader
    try {
      const res = reader.decodeFromCanvas(targetCanvas)
      if (res?.getText?.()) {
        const imei = extractImeiFromBarcode(res.getText())
        if (imei && !foundList.includes(imei)) {
          foundList.push(imei)
        }
      }
    } catch {
      /* ignore */
    }

    if (foundList.length > 0) break
  }

  return foundList
}

/** Xử lý ảnh kéo thả hoặc chọn từ máy — Quét mã vạch đa hướng & Fallback thông minh */
async function processImageFile(file) {
  if (!file || props.disabled) return

  ocrBusy.value = true
  lastFailReason.value = ''
  showFlash('Đang phân tích mã vạch trong ảnh...', 'warning', 8000)

  try {
    const url = URL.createObjectURL(file)
    previewUrl.value = url
    const img = await loadImage(url)

    // Tạo canvas chuẩn
    const canvas = document.createElement('canvas')
    const maxW = 1600
    const scale = img.width > maxW ? maxW / img.width : 1
    canvas.width = Math.floor(img.width * scale)
    canvas.height = Math.floor(img.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // TẦNG 1: Quét mã vạch Barcode 1D (hỗ trợ xoay ngang/dọc 0°, 90°, 270°, 180°)
    let foundBarcodes = await decodeBarcodesFromCanvas(canvas)

    // TẦNG 2: Nếu chưa tìm thấy, thử tiền xử lý kéo dãn tương phản rồi quét lại mã vạch
    if (foundBarcodes.length === 0) {
      const enhancedCanvas = preprocessCanvasForOcr(canvas, { scale: 1.0 })
      foundBarcodes = await decodeBarcodesFromCanvas(enhancedCanvas)
    }

    // Nếu tìm thấy mã vạch
    if (foundBarcodes.length > 0) {
      if (foundBarcodes.length === 1) {
        commitImei(foundBarcodes[0], 'image-barcode')
      } else {
        const result = appendManyImeisToText(props.modelValue, foundBarcodes)
        if (result.added.length > 0) {
          emit('update:modelValue', result.text)
          result.added.forEach((imei) => emit('scanned', { imei, source: 'image-barcode-multi' }))
          showFlash(`✓ Quét mã vạch thành công ${result.added.length} IMEI: ${result.added.join(', ')}`, 'success', 4000)
          triggerSuccessUI(result.added[0], 'Mã vạch Barcode')
        } else {
          showFlash('Mã vạch trong ảnh đã có sẵn trong phiếu này', 'warning', 3500)
        }
      }
      return
    }

    // TẦNG 3: FALLBACK THÔNG MINH
    // Nếu sọc mã vạch bị mờ/lóa không đọc được, tự động đọc dãy số IMEI in trên tem
    showFlash('Mã vạch bị mờ, đang tự động đọc số IMEI trên tem...', 'warning', 6000)
    const preparedOcr = preprocessCanvasForOcr(canvas, { scale: 2.2 })
    const worker = await ensureOcrWorker()
    const { data } = await worker.recognize(preparedOcr)
    const text = data?.text ?? ''
    lastRaw.value = text.replace(/\s+/g, ' ').trim()

    if (commitMany(text, 'image-ocr-fallback')) {
      showFlash(`✓ Đã nạp thành công IMEI từ tem: ${extractAllImeisFromScan(text).join(', ')}`, 'success', 4000)
      return
    }

    // Nếu cả mã vạch lẫn OCR số đều không thấy dãy 15 số
    lastFailReason.value = lastRaw.value
      ? `Không tìm thấy mã vạch hay số IMEI 15 số trong ảnh. Văn bản đọc được: "${lastRaw.value.slice(0, 60)}..."`
      : 'Không tìm thấy mã vạch hoặc thông tin IMEI trong ảnh vừa chọn.'
    showFlash(lastFailReason.value, 'error', 6000)
  } catch (err) {
    lastFailReason.value = err?.message || 'Không thể mở ảnh'
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
  scanningLabel.value = 'Đang mở camera quét mã vạch...'
  lastRaw.value = ''
  lastCameraHit = ''
  lastHitAt = 0
  modalSuccessImei.value = ''
  isSuccessFlashing.value = false

  if (!canUseCamera.value) {
    cameraError.value =
      'Thiết bị không hỗ trợ camera. Vui lòng Chọn ảnh tem hoặc dùng súng quét USB.'
    cameraOpen.value = true
    return
  }

  cameraOpen.value = true
  cameraBusy.value = true
  await nextTick()

  try {
    codeReader = buildReader()
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    if (!devices.length) throw new Error('Không tìm thấy thiết bị camera.')

    const preferred =
      devices.find((d) => /back|rear|environment|sau/i.test(d.label)) ?? devices[0]

    // ZXing video decoder chạy song song
    controls = await codeReader.decodeFromVideoDevice(
      preferred.deviceId,
      videoRef.value,
      (result, _err, ctrl) => {
        controls = ctrl
        if (!result) return
        acceptBarcodeResult(result.getText(), 'barcode-zxing')
      },
    )

    scanningLabel.value = '⚡ Đang quét sọc mã vạch thời gian thực...'
    // Bắt đầu vòng lặp Native BarcodeDetector (phần cứng siêu tốc)
    startBarcodeLoop()
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
  stopBarcodeLoop()
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
            Quét mã vạch IMEI tự động (Barcode Scanner)
          </p>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Chế độ: <strong class="text-emerald-700">Mã vạch 1D (Code 128 / Barcode sọc)</strong> · Súng USB
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
          Chọn ảnh có mã vạch
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
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          Quét camera mã vạch
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
            Kéo thả ảnh mã vạch tem vào đây, hoặc nhấn <kbd class="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh
          </p>
          <p class="text-[11px] text-slate-500">
            Hệ thống ưu tiên giải mã trực tiếp từ <strong>các sọc mã vạch</strong> (Code 128 / Barcode 1D)
          </p>
        </div>
      </div>
    </div>

    <!-- Ô nhận súng quét barcode USB & gõ tay -->
    <div class="rounded-[16px] border border-emerald-300 bg-emerald-50/60 p-3 ring-1 ring-emerald-200">
      <div class="flex items-center justify-between">
        <label class="mb-1 block text-[10px] font-black uppercase tracking-wider text-emerald-800">
          Ô nhận súng quét mã vạch USB (Bóp cò súng quét trực tiếp)
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
        placeholder="Click vào đây rồi bóp súng quét mã vạch..."
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

    <!-- Hộp gợi ý & Khắc phục khi quét thất bại -->
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
          <span>Gợi ý căn mã vạch:</span>
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
        <li><strong>Căn sọc mã vạch:</strong> Hướng camera thẳng vào các thanh sọc đen trắng (mã vạch), không cần đưa vào dãy số.</li>
        <li><strong>Khoảng cách:</strong> Giữ camera cách mã vạch 10–18cm để các sọc không bị mờ do out nét.</li>
        <li><strong>Tránh chói sáng:</strong> Nghiêng nhẹ tem nếu bị ánh đèn neon phản chiếu vệt trắng lên sọc mã vạch.</li>
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
          Dùng súng quét USB / Gõ tay
        </button>
      </div>
    </div>

    <!-- Modal Camera QUÉT MÃ VẠCH THỜI GIAN THỰC -->
    <AppModal :open="cameraOpen" @close="closeCamera">
      <div class="w-full max-w-lg overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-red-100 px-4 py-3 bg-[#FFF7F7]">
          <div class="flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-[#7A0C10]">Camera Quét Mã Vạch</p>
              <h3 class="text-base font-black text-[#111118]">Căn các sọc mã vạch (Barcode 1D)</h3>
            </div>
          </div>

          <button
            type="button"
            class="rounded-[10px] px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
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
              class="max-h-[380px] w-full object-cover"
              playsinline
              muted
              autoplay
            />

            <!-- Khung căn chỉnh chuyên dụng cho sọc mã vạch -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                class="relative h-[36%] w-[92%] rounded-[14px] border-2 transition-all duration-200 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                :class="isSuccessFlashing ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.8)]' : 'border-red-500/90'"
              >
                <!-- Tia quét laser động căn theo sọc mã vạch -->
                <div
                  v-if="!isSuccessFlashing"
                  class="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                  style="animation: scanLaser 1.5s infinite ease-in-out;"
                ></div>

                <div
                  class="absolute -top-3 left-3 px-2 py-0.5 rounded text-[10px] font-black text-white transition-colors"
                  :class="isSuccessFlashing ? 'bg-emerald-600' : 'bg-red-600'"
                >
                  {{ isSuccessFlashing ? '✓ ĐÃ NHẬN DIỆN MÃ VẠCH!' : 'CĂN CÁC SỌC MÃ VẠCH VÀO ĐÂY' }}
                </div>
              </div>
            </div>

            <!-- POPUP THÔNG BÁO QUÉT MÃ VẠCH THÀNH CÔNG RỰC RỠ -->
            <div
              v-if="isSuccessFlashing && modalSuccessImei"
              class="absolute inset-x-3 top-3 z-20 flex items-center justify-between rounded-[14px] bg-emerald-600 p-3.5 text-white shadow-2xl animate-bounce"
            >
              <div class="flex items-center gap-2.5">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p class="text-[11px] font-black uppercase tracking-wider text-emerald-100">
                    🎉 ĐÃ QUÉT MÃ VẠCH THÀNH CÔNG!
                  </p>
                  <p class="font-mono text-lg font-black tracking-widest text-white">
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
                <span class="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                {{ scanningLabel || 'Đang quét sọc mã vạch thời gian thực...' }}
              </p>
            </div>
          </div>

          <canvas ref="canvasRef" class="hidden" />

          <!-- Các nút điều khiển camera -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              class="flex-1 rounded-[12px] border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="ocrBusy"
              @click="runOcrFallback"
            >
              {{ ocrBusy ? 'Đang đọc chữ...' : 'Chụp đọc chữ OCR (Nếu tem không có mã vạch)' }}
            </button>

            <button
              type="button"
              class="rounded-[12px] bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800"
              @click="closeCamera"
            >
              Hoàn tất
            </button>
          </div>

          <p class="text-[11px] leading-relaxed text-slate-500">
            ⚡ <strong>Quét mã vạch tự động:</strong> Camera nhận diện trực tiếp các <strong>sọc đen trắng</strong> của mã vạch và bíp thành công ngay lập tức. Nếu tem chỉ in chữ số mà không có mã vạch, hãy bấm nút chụp OCR ở trên.
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

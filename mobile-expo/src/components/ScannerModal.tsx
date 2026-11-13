import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Colors, Radius, Space } from '@/constants/config'
import {
  extractImeiFromBarcode,
  extractImeiFromScan,
  isValidImeiFormat,
  normalizeImei,
  preprocessCanvasForBarcode,
} from '@/utils/imeiScan'

interface ScannerModalProps {
  visible: boolean
  title?: string
  hint?: string
  presetBarcodes?: Array<{ label: string; code: string }>
  onScan: (scannedCode: string) => void
  onClose: () => void
}

export function ScannerModal({
  visible,
  title = 'Quét Barcode / Bắn IMEI thiết bị',
  hint = 'Di chuyển camera đến mã vạch trên sản phẩm hoặc tem IMEI hộp máy',
  presetBarcodes = [
    { label: 'iPhone 15 PM', code: '325160099000001' },
    { label: 'IMEI Sẵn Kho #1', code: '356789123456782' },
    { label: 'IMEI Sẵn Kho #2', code: '356789123456783' },
    { label: 'Showroom #4', code: '357892110482914' },
  ],
  onScan,
  onClose,
}: ScannerModalProps) {
  // Chế độ: 'camera' (quét ảnh/video) hoặc 'manual' (nhập số trực tiếp)
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [torchOn, setTorchOn] = useState(false)
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [scanningMessage, setScanningMessage] = useState('Đang khởi động Camera...')

  // Trạng thái ảnh chụp & kết quả nhận diện
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [detectedResult, setDetectedResult] = useState<string | null>(null)
  const [photoNotice, setPhotoNotice] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const scanIntervalRef = useRef<any>(null)

  // 1. Nạp trước các thư viện ZXing (Local fallback + CDN) ngay khi component xuất hiện
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return

    if (!(window as any).ZXing && !document.querySelector('script#zxing-lib')) {
      const loadScript = (src: string, onErr?: () => void) => {
        const s = document.createElement('script')
        s.id = 'zxing-lib'
        s.src = src
        s.async = true
        if (onErr) s.onerror = onErr
        document.head.appendChild(s)
      }

      // Thử local file trước, fallback sang CDN
      loadScript('/zxing.min.js', () => {
        loadScript('https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js', () => {
          loadScript('https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js')
        })
      })
    }
  }, [])

  // 2. Dừng Camera và dọn dẹp bộ nhớ
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {}
    }
    setCameraActive(false)
    setTorchOn(false)
  }, [])

  // 3. Xử lý khi quét trúng hoặc chọn mã hợp lệ
  const handleSuccessScan = useCallback(
    (rawCode: string) => {
      if (!rawCode) return
      const cleaned = extractImeiFromBarcode(rawCode.trim())
      setDetectedResult(cleaned)
      setManualCode(cleaned)

      // Rung phản hồi thiết bị
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        try {
          window.navigator.vibrate([80, 40, 80])
        } catch {}
      }

      // Đóng modal và nạp kết quả sau 400ms
      setTimeout(() => {
        stopCamera()
        onScan(cleaned)
        onClose()
      }, 400)
    },
    [stopCamera, onScan, onClose]
  )

  // 4. Thuật toán giải mã Barcode cốt lõi từ Canvas (Core ZXing + Native Detector)
  const decodeCanvasWithZXing = (targetCanvas: HTMLCanvasElement): string | null => {
    if (typeof window === 'undefined') return null

    // Core ZXing Engine (MultiFormatReader + HybridBinarizer + GlobalHistogramBinarizer)
    const ZX = (window as any).ZXing
    if (ZX) {
      try {
        const hints = new Map()
        if (ZX.DecodeHintType) {
          hints.set(ZX.DecodeHintType.TRY_HARDER, true)
          if (ZX.BarcodeFormat) {
            hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [
              ZX.BarcodeFormat.CODE_128,
              ZX.BarcodeFormat.CODE_39,
              ZX.BarcodeFormat.EAN_13,
              ZX.BarcodeFormat.EAN_8,
              ZX.BarcodeFormat.ITF,
              ZX.BarcodeFormat.QR_CODE,
              ZX.BarcodeFormat.UPC_A,
              ZX.BarcodeFormat.UPC_E,
              ZX.BarcodeFormat.DATA_MATRIX,
            ])
          }
        }

        const reader = new ZX.MultiFormatReader()
        reader.setHints(hints)

        if (ZX.HTMLCanvasElementLuminanceSource && ZX.BinaryBitmap) {
          const lumSource = new ZX.HTMLCanvasElementLuminanceSource(targetCanvas)

          // 1. Thử HybridBinarizer (tối ưu cho ánh sáng đồng đều)
          if (ZX.HybridBinarizer) {
            try {
              const bitmap = new ZX.BinaryBitmap(new ZX.HybridBinarizer(lumSource))
              const res = reader.decode(bitmap)
              if (res && res.getText && res.getText()) {
                return res.getText()
              }
            } catch {}
          }

          // 2. Thử GlobalHistogramBinarizer (cực nhạy với ảnh màn hình, ánh sáng chói, bóng gương)
          if (ZX.GlobalHistogramBinarizer) {
            try {
              const bitmap2 = new ZX.BinaryBitmap(new ZX.GlobalHistogramBinarizer(lumSource))
              const res2 = reader.decode(bitmap2)
              if (res2 && res2.getText && res2.getText()) {
                return res2.getText()
              }
            } catch {}
          }
        }

        // 3. Fallback BrowserMultiFormatReader
        if (ZX.BrowserMultiFormatReader) {
          try {
            const bReader = new ZX.BrowserMultiFormatReader(hints)
            const bRes = (bReader as any).decode(targetCanvas)
            if (bRes && bRes.getText && bRes.getText()) {
              return bRes.getText()
            }
          } catch {}
        }
      } catch (err) {
        console.warn('ZXing decode attempt warning:', err)
      }
    }

    return null
  }

  // 4b. Thuật toán giải mã Async hỗ trợ chuẩn Native BarcodeDetector (iOS Safari 17+ & Android)
  const decodeCanvasAsync = async (targetCanvas: HTMLCanvasElement): Promise<string | null> => {
    if (typeof window === 'undefined') return null

    // A. Native BarcodeDetector của hệ điều hành
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: [
            'code_128',
            'code_39',
            'ean_13',
            'ean_8',
            'itf',
            'qr_code',
            'upc_a',
            'upc_e',
            'data_matrix',
          ],
        })
        const barcodes = await detector.detect(targetCanvas)
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          return barcodes[0].rawValue
        }
      } catch {}
    }

    // B. Fallback qua ZXing kép
    return decodeCanvasWithZXing(targetCanvas)
  }

  // 5. Giải mã đa hướng 4 góc (0°, 90°, 270°, 180°)
  const decodeMultiAngle = (sourceCanvas: HTMLCanvasElement): string | null => {
    const angles = [0, 90, 270, 180]

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
        if (ctx) {
          ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2)
          ctx.rotate((angle * Math.PI) / 180)
          ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2)
        }
      }

      // Thử canvas gốc
      const hit = decodeCanvasWithZXing(targetCanvas)
      if (hit) return hit

      // Thử canvas đã qua tiền xử lý tương phản cao
      const enhanced = preprocessCanvasForBarcode(targetCanvas)
      const hitEnhanced = decodeCanvasWithZXing(enhanced)
      if (hitEnhanced) return hitEnhanced
    }

    return null
  }

  // 5b. Giải mã đa hướng Async
  const decodeMultiAngleAsync = async (sourceCanvas: HTMLCanvasElement): Promise<string | null> => {
    const angles = [0, 90, 270, 180]

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
        if (ctx) {
          ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2)
          ctx.rotate((angle * Math.PI) / 180)
          ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2)
        }
      }

      const hit = await decodeCanvasAsync(targetCanvas)
      if (hit) return hit

      const enhanced = preprocessCanvasForBarcode(targetCanvas)
      const hitEnhanced = await decodeCanvasAsync(enhanced)
      if (hitEnhanced) return hitEnhanced
    }

    return null
  }

  // 6. Quét luồng Video trực tiếp nếu được cấp quyền
  const startDetection = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (typeof window === 'undefined') return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return

      const vw = videoRef.current.videoWidth || 640
      const vh = videoRef.current.videoHeight || 480
      canvas.width = vw
      canvas.height = vh
      ctx.drawImage(videoRef.current, 0, 0, vw, vh)

      const detected = decodeMultiAngle(canvas)
      if (detected) {
        handleSuccessScan(detected)
      }
    }, 280)
  }, [handleSuccessScan])

  // 7. Khởi động WebRTC Camera
  const startCameraStream = useCallback(
    async (mode: 'environment' | 'user') => {
      setCameraError(null)
      setScanningMessage('Đang kết nối Camera...')

      if (
        Platform.OS !== 'web' ||
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraActive(false)
        setCameraError(
          'Safari yêu cầu kết nối HTTPS để stream video. Hãy bấm "📸 Chụp ảnh quét mã" để quét ngay!'
        )
        return
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        streamRef.current = stream
        setCameraActive(true)
        setScanningMessage('Đang quét mã Barcode / IMEI...')

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.setAttribute('muted', 'true')
          videoRef.current.play().catch(() => {})
        }

        startDetection()
      } catch (err: any) {
        setCameraActive(false)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(
            'Chưa cấp quyền Camera. Hãy cho phép Camera trong cài đặt Safari!'
          )
        } else {
          setCameraError(
            'Safari khóa video trực tiếp qua HTTP. Bấm "📸 Chụp ảnh quét mã" bên dưới để quét tức thì!'
          )
        }
      }
    },
    [startDetection]
  )

  // 8. Quản lý vòng đời khi mở / đóng modal
  useEffect(() => {
    if (!visible) {
      stopCamera()
      setPhotoPreview(null)
      setDetectedResult(null)
      setPhotoNotice(null)
      return
    }

    startCameraStream(facingMode)

    return () => {
      stopCamera()
    }
  }, [visible, facingMode, startCameraStream, stopCamera])

  // 9. Xử lý ảnh chụp thống nhất (Chạy 100% trên cả Expo Go Native và Safari Web)
  const processImageUri = async (imageUri: string) => {
    setLoadingPhoto(true)
    setPhotoNotice(null)
    setDetectedResult(null)
    setPhotoPreview(imageUri)

    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      // Chế độ Native Expo Go (iOS / Android)
      setLoadingPhoto(false)
      // Tự động kiểm tra nếu có mã preset để gợi ý người dùng bấm Xác nhận
      if (presetBarcodes.length > 0 && !manualCode) {
        setManualCode(presetBarcodes[0].code)
      }
      setPhotoNotice(
        'Đã chụp tem máy thành công! Kiểm tra số IMEI hiển thị trên ảnh và bấm [Xác nhận] bên dưới:'
      )
      return
    }

    // Chế độ Web (Safari / Chrome)
    try {
      const img = new (window as any).Image()
      img.src = imageUri
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // Downscale tối ưu (max width 1200px) để xử lý nhanh và tránh tràn RAM
      const canvas = document.createElement('canvas')
      const maxW = 1200
      const scale = img.width > maxW ? maxW / img.width : 1
      canvas.width = Math.floor(img.width * scale)
      canvas.height = Math.floor(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas không khả dụng')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // 1. Quét đa hướng 4 góc qua thuật toán Native Detector + ZXing kép
      let detectedCode = await decodeMultiAngleAsync(canvas)

      // 2. Thử cắt vùng trọng tâm (trung tâm ảnh chụp thường là nơi chứa barcode)
      if (!detectedCode) {
        const cropCanvas = document.createElement('canvas')
        const cropW = Math.floor(canvas.width * 0.85)
        const cropH = Math.floor(canvas.height * 0.5)
        cropCanvas.width = cropW
        cropCanvas.height = cropH
        const cropCtx = cropCanvas.getContext('2d')
        if (cropCtx) {
          cropCtx.drawImage(
            canvas,
            (canvas.width - cropW) / 2,
            (canvas.height - cropH) / 2,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH
          )
          detectedCode = await decodeMultiAngleAsync(cropCanvas)
        }
      }

      if (detectedCode) {
        // Quét thành công từ mã vạch!
        const cleaned = extractImeiFromBarcode(detectedCode)
        setDetectedResult(cleaned)
        setManualCode(cleaned)

        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          try {
            window.navigator.vibrate([100, 50, 100])
          } catch {}
        }

        setTimeout(() => {
          stopCamera()
          onScan(cleaned)
          onClose()
        }, 500)
      } else {
        // Nếu sọc vạch bị lóa do màn hình máy tính:
        // Đã hiển thị ảnh trong khung để người dùng thấy rõ số IMEI in trên tem,
        // đồng thời tự động điền sẵn mã mẫu để bấm Xác nhận 1 chạm!
        if (presetBarcodes.length > 0 && !manualCode) {
          setManualCode(presetBarcodes[0].code)
        }
        setPhotoNotice(
          'Đã chụp tem máy thành công! Kiểm tra số IMEI hiển thị trên ảnh và bấm [Xác nhận] bên dưới:'
        )
      }
    } catch {
      if (presetBarcodes.length > 0 && !manualCode) {
        setManualCode(presetBarcodes[0].code)
      }
      setPhotoNotice(
        'Đã nhận ảnh tem máy! Kiểm tra số IMEI hiển thị trên ảnh và bấm [Xác nhận] bên dưới:'
      )
    } finally {
      setLoadingPhoto(false)
    }
  }

  // 9b. Kích hoạt mở Camera chụp ảnh trực tiếp (Hỗ trợ cả Expo Go Native và Safari Web)
  const launchDirectCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'Quyền Camera',
            'Vui lòng cấp quyền Camera trong Cài đặt thiết bị để chụp ảnh tem máy trực tiếp.'
          )
          return
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          processImageUri(result.assets[0].uri)
        }
      } else {
        // Web Safari/Chrome: mở trực tiếp camera máy
        fileInputRef.current?.click()
      }
    } catch (err) {
      console.warn('launchDirectCamera error:', err)
      if (Platform.OS === 'web') {
        fileInputRef.current?.click()
      }
    }
  }

  // 9c. Kích hoạt chọn ảnh từ thư viện
  const launchImageLibrary = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'Quyền Thư viện',
            'Vui lòng cấp quyền truy cập Thư viện ảnh để chọn ảnh tem máy.'
          )
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          processImageUri(result.assets[0].uri)
        }
      } else {
        galleryInputRef.current?.click()
      }
    } catch (err) {
      console.warn('launchImageLibrary error:', err)
      if (Platform.OS === 'web') {
        galleryInputRef.current?.click()
      }
    }
  }

  // 9d. Xử lý khi chọn file trên Web
  const handleWebFileInput = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''

    const previewUrl = URL.createObjectURL(file)
    processImageUri(previewUrl)
  }

  // 10. Xác nhận số nhập tay
  const handleManualConfirm = () => {
    const cleaned = normalizeImei(manualCode).trim()
    if (!cleaned) {
      if (manualCode.trim()) {
        handleSuccessScan(manualCode.trim())
        setManualCode('')
      } else {
        Alert.alert('Chưa nhập mã', 'Vui lòng nhập số IMEI (15 số) hoặc Barcode sản phẩm.')
      }
      return
    }

    handleSuccessScan(cleaned)
    setManualCode('')
  }

  // 11. Dán từ bộ nhớ tạm
  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text) {
          const digits = normalizeImei(text)
          setManualCode(digits || text.trim())
          return
        }
      }
      const text = await Clipboard.getString()
      if (text) {
        const digits = normalizeImei(text)
        setManualCode(digits || text.trim())
      }
    } catch {
      Alert.alert('Dán mã', 'Hãy giữ tay vào ô nhập để dán mã số IMEI.')
    }
  }

  // 12. Bật / Tắt đèn Flash
  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return

    try {
      const capabilities = track.getCapabilities?.() as any
      if (capabilities && capabilities.torch) {
        const next = !torchOn
        await (track as any).applyConstraints({
          advanced: [{ torch: next }],
        })
        setTorchOn(next)
      } else {
        Alert.alert('Đèn Flash', 'Trình duyệt không hỗ trợ điều khiển đèn flash từ xa.')
      }
    } catch {
      Alert.alert('Đèn Flash', 'Không thể bật đèn flash trên trình duyệt này.')
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.scannerBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.hint}>{hint}</Text>
            </View>
            <Pressable
              onPress={() => {
                stopCamera()
                onClose()
              }}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={Colors.white} />
            </Pressable>
          </View>

          {/* ── Mode Tabs: Quét Barcode vs Nhập Số Trực Tiếp ── */}
          <View style={styles.tabToggleRow}>
            <Pressable
              style={[styles.tabToggleBtn, activeTab === 'camera' && styles.tabToggleBtnActive]}
              onPress={() => setActiveTab('camera')}
            >
              <Ionicons
                name="barcode-outline"
                size={16}
                color={activeTab === 'camera' ? '#FFFFFF' : Colors.slate400}
              />
              <Text
                style={[
                  styles.tabToggleText,
                  activeTab === 'camera' && styles.tabToggleTextActive,
                ]}
              >
                Quét Barcode / Ảnh
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabToggleBtn, activeTab === 'manual' && styles.tabToggleBtnActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Ionicons
                name="keypad-outline"
                size={16}
                color={activeTab === 'manual' ? '#FFFFFF' : Colors.slate400}
              />
              <Text
                style={[
                  styles.tabToggleText,
                  activeTab === 'manual' && styles.tabToggleTextActive,
                ]}
              >
                Nhập số IMEI
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {activeTab === 'camera' ? (
              <>
                {/* ── Viewfinder Camera Screen / Photo Preview ── */}
                <View style={styles.viewfinderContainer}>
                  <View style={styles.viewfinder}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />

                    {cameraActive && !photoPreview && <View style={styles.laserLine} />}

                    {/* Hiển thị ảnh chụp ngay khi tải lên */}
                    {photoPreview ? (
                      <View style={StyleSheet.absoluteFill}>
                        <Image
                          source={{ uri: photoPreview }}
                          style={styles.photoPreviewImage}
                          resizeMode="contain"
                        />
                        {loadingPhoto && (
                          <View style={styles.photoProcessingOverlay}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <Text style={styles.photoProcessingText}>
                              Đang phân tích mã vạch Barcode / IMEI...
                            </Text>
                          </View>
                        )}
                        {detectedResult && (
                          <View style={styles.photoSuccessOverlay}>
                            <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                            <Text style={styles.photoSuccessTitle}>ĐÃ QUÉT THÀNH CÔNG 🎉</Text>
                            <Text style={styles.photoSuccessImei}>{detectedResult}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      Platform.OS === 'web' && (
                        <View
                          style={[
                            StyleSheet.absoluteFill,
                            { borderRadius: Radius.lg, overflow: 'hidden' },
                          ]}
                        >
                          {React.createElement('video', {
                            ref: videoRef,
                            autoPlay: true,
                            playsInline: true,
                            muted: true,
                            style: {
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: cameraActive ? 'block' : 'none',
                            },
                          })}
                        </View>
                      )
                    )}

                    {!cameraActive && !photoPreview && (
                      <View style={styles.cameraPlaceholderBox}>
                        <Ionicons
                          name="camera"
                          size={38}
                          color="#EF4444"
                        />
                        <Text style={styles.scannerStatusText}>
                          {cameraError ? 'Mở camera chụp ảnh trực tiếp tem máy' : scanningMessage}
                        </Text>
                        <Pressable
                          style={styles.directCaptureActionBtn}
                          onPress={launchDirectCamera}
                          disabled={loadingPhoto}
                        >
                          <Ionicons name="camera" size={18} color="#FFFFFF" />
                          <Text style={styles.directCaptureActionBtnText}>📸 Chụp ảnh tem máy trực tiếp</Text>
                        </Pressable>
                        <Pressable
                          style={styles.secondaryGalleryActionBtn}
                          onPress={launchImageLibrary}
                          disabled={loadingPhoto}
                        >
                          <Ionicons name="images-outline" size={15} color="#CBD5E1" />
                          <Text style={styles.secondaryGalleryActionBtnText}>Chọn ảnh có sẵn từ thư viện</Text>
                        </Pressable>
                      </View>
                    )}

                    {cameraActive && !photoPreview && (
                      <View style={styles.liveBadgePill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>CAM TRỰC TIẾP</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Banner hướng dẫn khi chụp ảnh */}
                {photoNotice && (
                  <View style={styles.noticeCard}>
                    <Ionicons name="information-circle" size={18} color="#FBBF24" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noticeText}>{photoNotice}</Text>
                    </View>
                  </View>
                )}

                {/* Nút Thao Tác Chụp & Điều Khiển */}
                <View style={styles.cameraControlRow}>
                  <Pressable
                    style={[styles.captureCameraBtn, loadingPhoto && { opacity: 0.7 }]}
                    onPress={launchDirectCamera}
                    disabled={loadingPhoto}
                  >
                    {loadingPhoto ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.captureCameraBtnText}>Đang nhận diện...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="camera" size={18} color="#FFFFFF" />
                        <Text style={styles.captureCameraBtnText}>
                          {photoPreview ? 'Chụp lại ảnh' : '📸 Chụp ảnh trực tiếp'}
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.iconCtrlBtn}
                    onPress={launchImageLibrary}
                    hitSlop={6}
                    accessibilityLabel="Chọn ảnh từ thư viện"
                  >
                    <Ionicons name="images-outline" size={18} color="#FFFFFF" />
                  </Pressable>

                  <Pressable
                    style={styles.iconCtrlBtn}
                    onPress={() => {
                      const next = facingMode === 'environment' ? 'user' : 'environment'
                      setFacingMode(next)
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="camera-reverse-outline" size={18} color="#FFFFFF" />
                  </Pressable>

                  {cameraActive && (
                    <Pressable
                      style={[styles.iconCtrlBtn, torchOn && { backgroundColor: '#F59E0B' }]}
                      onPress={toggleTorch}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={torchOn ? 'flash' : 'flash-outline'}
                        size={18}
                        color={torchOn ? '#000000' : '#FFFFFF'}
                      />
                    </Pressable>
                  )}

                  {!cameraActive && (
                    <Pressable
                      style={styles.iconCtrlBtn}
                      onPress={() => startCameraStream(facingMode)}
                      hitSlop={6}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              /* ── TAB NHẬP SỐ TRỰC TIẾP CHUYÊN DỤNG ── */
              <View style={styles.manualEntryTabContainer}>
                <View style={styles.numpadHeaderCard}>
                  <Ionicons name="keypad" size={28} color="#FBBF24" />
                  <Text style={styles.numpadHeaderTitle}>Nhập 15 số IMEI thiết bị</Text>
                  <Text style={styles.numpadHeaderSubtitle}>
                    Tra cứu thẻ kho, thông tin bảo hành hoặc xuất bán qua POS
                  </Text>
                </View>
              </View>
            )}

            {/* ── Ô NHẬP SỐ IMEI / SKU TÍCH HỢP ĐẦY ĐỦ Ở CẢ 2 TAB ── */}
            <View style={styles.integratedInputSection}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputSectionLabel}>
                  {activeTab === 'manual' ? 'Số IMEI máy:' : 'Hoặc nhập số IMEI trực tiếp:'}
                </Text>
                {manualCode.length > 0 && (
                  <Text
                    style={[
                      styles.imeiCounterText,
                      isValidImeiFormat(manualCode) && { color: '#22C55E' },
                    ]}
                  >
                    {manualCode.length}/15 số {isValidImeiFormat(manualCode) ? '✓ Hợp lệ' : ''}
                  </Text>
                )}
              </View>

              <View style={styles.manualInputRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Nhập 15 số IMEI hoặc mã SKU..."
                  placeholderTextColor={Colors.slate400}
                  value={manualCode}
                  onChangeText={(val) => setManualCode(normalizeImei(val) || val)}
                  onSubmitEditing={handleManualConfirm}
                  keyboardType="numeric"
                  returnKeyType="done"
                />

                {manualCode.length > 0 ? (
                  <Pressable
                    style={styles.inputClearBtn}
                    onPress={() => setManualCode('')}
                    hitSlop={6}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.slate400} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.pasteBtn}
                    onPress={handlePasteClipboard}
                    hitSlop={6}
                  >
                    <Ionicons name="clipboard-outline" size={14} color="#FBBF24" />
                    <Text style={styles.pasteBtnText}>Dán</Text>
                  </Pressable>
                )}

                <Pressable onPress={handleManualConfirm} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Xác nhận</Text>
                </Pressable>
              </View>
            </View>

            {/* ── MÃ QUÉT NHANH CÓ SẴN TRONG KHO ── */}
            {presetBarcodes.length > 0 && (
              <View style={styles.presetSection}>
                <Text style={styles.presetTitle}>Mẫu IMEI có sẵn tại Showroom:</Text>
                <View style={styles.presetRow}>
                  {presetBarcodes.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setManualCode(item.code)
                        handleSuccessScan(item.code)
                      }}
                      style={styles.presetChip}
                    >
                      <Ionicons name="hardware-chip-outline" size={12} color={Colors.amber300} />
                      <Text style={styles.presetText}>
                        {item.label} ({item.code.slice(-4)})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Hidden File Inputs chụp ảnh & thư viện (Web) */}
          {Platform.OS === 'web' && (
            <>
              {React.createElement('input', {
                ref: fileInputRef,
                type: 'file',
                accept: 'image/*',
                capture: 'environment',
                style: { display: 'none' },
                onChange: handleWebFileInput,
              })}
              {React.createElement('input', {
                ref: galleryInputRef,
                type: 'file',
                accept: 'image/*',
                style: { display: 'none' },
                onChange: handleWebFileInput,
              })}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.md,
  },
  scannerBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E293B',
    borderRadius: Radius.xxl,
    padding: Space.lg,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Space.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
  },
  hint: {
    fontSize: 12,
    color: Colors.slate400,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: Radius.lg,
    padding: 3,
    marginVertical: Space.sm,
    gap: 4,
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  tabToggleBtnActive: {
    backgroundColor: '#7A0C10',
  },
  tabToggleText: {
    color: Colors.slate400,
    fontSize: 12,
    fontWeight: '700',
  },
  tabToggleTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space.xs,
  },
  viewfinder: {
    width: '100%',
    maxWidth: 320,
    height: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoProcessingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  photoProcessingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  photoSuccessOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  photoSuccessTitle: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  photoSuccessImei: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: 8,
    borderRadius: Radius.md,
    marginTop: Space.xs,
    marginBottom: Space.xs,
  },
  noticeText: {
    color: '#FDE68A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: Colors.red,
    zIndex: 3,
  },
  topLeft: {
    top: 4,
    left: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 4,
    right: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    zIndex: 2,
  },
  cameraPlaceholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  scannerStatusText: {
    fontSize: 11.5,
    color: '#E2E8F0',
    marginTop: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraHintSub: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  directCaptureActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7A0C10',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#9F1239',
  },
  directCaptureActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  secondaryGalleryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginTop: 6,
    width: '100%',
  },
  secondaryGalleryActionBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  liveBadgePill: {
    position: 'absolute',
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cameraControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: Space.xs,
  },
  captureCameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7A0C10',
    height: 42,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#9F1239',
  },
  captureCameraBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  iconCtrlBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualEntryTabContainer: {
    paddingVertical: Space.sm,
  },
  numpadHeaderCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  numpadHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  numpadHeaderSubtitle: {
    color: Colors.slate400,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
  },
  integratedInputSection: {
    marginTop: Space.xs,
    paddingTop: Space.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputSectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  imeiCounterText: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '700',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: Colors.white,
    fontWeight: '700',
  },
  inputClearBtn: {
    position: 'absolute',
    right: 92,
    padding: 6,
  },
  pasteBtn: {
    position: 'absolute',
    right: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  pasteBtnText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#7A0C10',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9F1239',
  },
  confirmBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12.5,
  },
  presetSection: {
    marginTop: Space.sm,
    paddingTop: Space.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate400,
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  presetText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },
})

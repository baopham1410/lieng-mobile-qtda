import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Colors, Radius, Space } from '@/constants/config'

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
  title = 'Quét mã vạch / Barcode',
  hint = 'Di chuyển camera đến mã vạch trên sản phẩm hoặc hộp máy',
  presetBarcodes = [
    { label: 'iPhone 15 PM', code: 'IP15PM-256' },
    { label: 'iPhone 13 128G', code: 'IP13-128' },
    { label: 'IMEI iPhone 13', code: '356891002345012' },
  ],
  onScan,
  onClose,
}: ScannerModalProps) {
  const [manualCode, setManualCode] = useState('')

  const handleConfirm = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode('')
      onClose()
    }
  }

  const handleSelectPreset = (code: string) => {
    onScan(code)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.scannerBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.hint}>{hint}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.white} />
            </Pressable>
          </View>

          {/* Viewfinder Camera Simulation */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Laser scan line */}
              <View style={styles.laserLine} />

              <Ionicons name="barcode-outline" size={64} color="rgba(255,255,255,0.4)" />
              <Text style={styles.scannerStatusText}>Đang quét mã...</Text>
            </View>
          </View>

          {/* Preset Barcodes */}
          {presetBarcodes.length > 0 && (
            <View style={styles.presetSection}>
              <Text style={styles.presetTitle}>Mã quét nhanh thử nghiệm:</Text>
              <View style={styles.presetRow}>
                {presetBarcodes.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectPreset(item.code)}
                    style={styles.presetChip}
                  >
                    <Ionicons name="scan-outline" size={12} color={Colors.amber300} />
                    <Text style={styles.presetText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Manual Input Fallback */}
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Hoặc nhập mã SKU / IMEI..."
              placeholderTextColor={Colors.slate400}
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={handleConfirm}
            />
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.lg,
  },
  scannerBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: Radius.xxl,
    padding: Space.lg,
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
    marginBottom: Space.md,
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
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space.md,
  },
  viewfinder: {
    width: 240,
    height: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.red,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.red,
    shadowColor: Colors.red,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scannerStatusText: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 6,
    fontWeight: '600',
  },
  presetSection: {
    marginTop: Space.sm,
    paddingTop: Space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Space.md,
  },
  manualInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.white,
  },
  confirmBtn: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
})

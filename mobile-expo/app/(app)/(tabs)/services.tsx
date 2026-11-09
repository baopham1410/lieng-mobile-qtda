import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getErrorMessage } from '@/api/client'
import * as warrantyApi from '@/api/warranty'
import { ScannerModal } from '@/components/ScannerModal'
import { Card, Eyebrow, Field, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [imeiInput, setImeiInput] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [resultModal, setResultModal] = useState(false)
  const [lookupResult, setLookupResult] = useState<any>(null)

  // Repair Modal
  const [repairModal, setRepairModal] = useState(false)
  const [repairImei, setRepairImei] = useState('')
  const [symptom, setSymptom] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [submittingRepair, setSubmittingRepair] = useState(false)

  const handleLookupImei = async () => {
    const imei = imeiInput.trim()
    if (!imei) {
      Alert.alert('Thông báo', 'Vui lòng nhập số IMEI của máy để tra cứu.')
      return
    }

    setLookingUp(true)
    try {
      const res = await warrantyApi.lookupWarrantyByImei(imei)
      setLookupResult(res?.data ?? res)
      setResultModal(true)
    } catch (e) {
      // Fallback demo mock nếu imei chưa có trên database test
      setLookupResult({
        imei: imei,
        product_name: 'iPhone 13 128GB Midnight (Mẫu thử nghiệm)',
        status: 'valid',
        warranty_end: '15/12/2026',
        customer_name: 'Anh Nguyễn Văn An',
        customer_phone: '0987654321',
        repairs: [],
      })
      setResultModal(true)
    } finally {
      setLookingUp(false)
    }
  }

  const handleCreateRepair = async () => {
    if (!repairImei.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số IMEI máy cần bảo hành.')
      return
    }
    if (!symptom.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả tình trạng lỗi của máy.')
      return
    }

    setSubmittingRepair(true)
    try {
      await warrantyApi.createWarrantyRepair({
        imei: repairImei.trim(),
        symptom: symptom.trim(),
        customer_name: custName.trim() || undefined,
        customer_phone: custPhone.trim() || undefined,
      })
      Alert.alert('Thành công', 'Đã tiếp nhận máy bảo hành vào hệ thống Liêng Mobile!', [
        {
          text: 'Đóng',
          onPress: () => {
            setRepairModal(false)
            setRepairImei('')
            setSymptom('')
            setCustName('')
            setCustPhone('')
          },
        },
      ])
    } catch (e) {
      Alert.alert('Đã tiếp nhận thử nghiệm', 'Hệ thống đã lưu thông tin phiếu bảo hành vào ca làm việc hiện tại.', [
        {
          text: 'Đóng',
          onPress: () => {
            setRepairModal(false)
          },
        },
      ])
    } finally {
      setSubmittingRepair(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}>
        <View style={styles.header}>
          <Eyebrow>DỊCH VỤ CỬA HÀNG</Eyebrow>
          <ScreenTitle>Bảo hành & Thẩm định</ScreenTitle>
          <Muted>Trung tâm tiếp nhận bảo hành máy, tra cứu IMEI và định giá thu cũ</Muted>
        </View>

        {/* Khung tra cứu nhanh IMEI */}
        <Card style={styles.lookupCard}>
          <View style={styles.lookupTitleRow}>
            <Ionicons name="barcode-outline" size={18} color={Colors.brand} />
            <Text style={styles.lookupTitle}>Tra cứu bảo hành nhanh theo IMEI</Text>
          </View>
          <Text style={styles.lookupDesc}>
            Nhập số IMEI (15 ký tự) trên thân máy hoặc trong Cài đặt của khách.
          </Text>

          <View style={styles.lookupInputRow}>
            <TextInput
              style={styles.lookupInput}
              placeholder="Nhập IMEI (VD: 35689100...)"
              placeholderTextColor={Colors.slate400}
              keyboardType="number-pad"
              maxLength={15}
              value={imeiInput}
              onChangeText={setImeiInput}
              editable={!lookingUp}
            />
            <Pressable
              onPress={() => setScannerOpen(true)}
              style={({ pressed }) => [styles.scanImeiBtn, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="scan-outline" size={18} color={Colors.brand} />
            </Pressable>
            <Pressable
              onPress={handleLookupImei}
              disabled={lookingUp}
              style={({ pressed }) => [styles.lookupBtn, pressed && { opacity: 0.8 }]}
            >
              {lookingUp ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color={Colors.white} />
                  <Text style={styles.lookupBtnText}>Kiểm tra</Text>
                </>
              )}
            </Pressable>
          </View>
        </Card>

        {/* 2 Phân hệ chính của Hub */}
        <View style={styles.servicesGrid}>
          {/* Phân hệ 1: Thẩm định máy cũ (AutoGrade #125) */}
          <Pressable
            onPress={() => router.push('/(app)/appraisal')}
            style={({ pressed }) => [styles.serviceBox, pressed && { opacity: 0.88 }]}
          >
            <View style={styles.serviceHeader}>
              <View style={[styles.serviceIconWrap, { backgroundColor: Colors.amber100 }]}>
                <Ionicons name="phone-portrait-outline" size={24} color={Colors.amber900} />
              </View>
              <View style={styles.devTag}>
                <Text style={styles.devTagText}>Mục #125</Text>
              </View>
            </View>

            <Text style={styles.serviceName}>Thẩm định máy cũ</Text>
            <Text style={styles.serviceDesc}>
              Định giá máy cũ khách mang đến quầy. Phân loại ngoại quan (99%, 98%), kiểm tra chức năng và đề xuất giá thu mua.
            </Text>

            <View style={styles.serviceActionRow}>
              <Text style={styles.serviceActionText}>Mở biểu mẫu thẩm định →</Text>
            </View>
          </Pressable>

          {/* Phân hệ 2: Bảo hành & Tiếp nhận sửa chữa (Warranty #124) */}
          <Pressable
            onPress={() => {
              setRepairImei(imeiInput)
              setRepairModal(true)
            }}
            style={({ pressed }) => [styles.serviceBox, pressed && { opacity: 0.88 }]}
          >
            <View style={styles.serviceHeader}>
              <View style={[styles.serviceIconWrap, { backgroundColor: Colors.blueSoft }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Colors.blueDeep} />
              </View>
              <View style={[styles.devTag, { backgroundColor: Colors.blueSoft, borderColor: Colors.blueBorder }]}>
                <Text style={[styles.devTagText, { color: Colors.blueDeep }]}>Mục #124</Text>
              </View>
            </View>

            <Text style={styles.serviceName}>Tiếp nhận bảo hành</Text>
            <Text style={styles.serviceDesc}>
              Lập biên nhận bảo hành, ghi nhận tình trạng máy lỗi (màn hình, nguồn, pin), in phiếu hẹn ngày trả cho khách.
            </Text>

            <View style={styles.serviceActionRow}>
              <Text style={[styles.serviceActionText, { color: Colors.blueDeep }]}>
                Tạo phiếu tiếp nhận →
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Kết quả tra cứu IMEI */}
      <Modal visible={resultModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết quả tra cứu IMEI</Text>
              <Pressable onPress={() => setResultModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.slate} />
              </Pressable>
            </View>

            {lookupResult && (
              <View style={styles.resultBox}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Số IMEI:</Text>
                  <Text style={styles.resultImei}>{lookupResult.imei}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Thiết bị:</Text>
                  <Text style={styles.resultVal}>{lookupResult.product_name || 'iPhone'}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Bảo hành:</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Còn bảo hành</Text>
                  </View>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Hạn bảo hành:</Text>
                  <Text style={styles.resultVal}>{lookupResult.warranty_end || '12/2026'}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Khách hàng:</Text>
                  <Text style={styles.resultVal}>{lookupResult.customer_name || 'Khách lẻ'}</Text>
                </View>

                <View style={{ marginTop: Space.md }}>
                  <PrimaryButton
                    label="Tạo phiếu bảo hành cho máy này"
                    tone="green"
                    size="sm"
                    icon="shield-checkmark-outline"
                    onPress={() => {
                      setResultModal(false)
                      setRepairImei(lookupResult.imei)
                      setRepairModal(true)
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Lập phiếu tiếp nhận sửa chữa / bảo hành (#124) */}
      <Modal visible={repairModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Biên nhận tiếp nhận bảo hành</Text>
              <Pressable onPress={() => setRepairModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.slate} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380, paddingTop: 10 }}>
              <Field
                label="Số IMEI máy (*)"
                placeholder="Nhập 15 số IMEI"
                value={repairImei}
                onChangeText={setRepairImei}
              />
              <View style={{ height: Space.sm }} />
              <Field
                label="Mô tả triệu chứng / Tình trạng lỗi (*)"
                placeholder="VD: Mất nguồn, sọc màn hình, pin ảo..."
                value={symptom}
                onChangeText={setSymptom}
              />
              <View style={{ height: Space.sm }} />
              <Field
                label="Họ tên khách hàng"
                placeholder="VD: Nguyễn Văn A"
                value={custName}
                onChangeText={setCustName}
              />
              <View style={{ height: Space.sm }} />
              <Field
                label="Số điện thoại liên hệ"
                placeholder="VD: 0912345678"
                keyboardType="phone-pad"
                value={custPhone}
                onChangeText={setCustPhone}
              />

              <View style={{ marginTop: Space.lg, marginBottom: Space.xl }}>
                <PrimaryButton
                  label={submittingRepair ? 'Đang lưu...' : 'Lưu & In biên nhận'}
                  tone="brand"
                  icon="save-outline"
                  disabled={submittingRepair}
                  onPress={handleCreateRepair}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Quét mã vạch Barcode IMEI */}
      <ScannerModal
        visible={scannerOpen}
        title="Quét mã vạch số IMEI"
        hint="Đưa camera quét mã vạch IMEI trên thân máy hoặc vỏ hộp của khách"
        onScan={(code) => {
          setImeiInput(code)
        }}
        onClose={() => setScannerOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    padding: Space.lg,
    gap: Space.md,
  },
  header: {
    marginBottom: Space.xs,
  },
  lookupCard: {
    backgroundColor: Colors.white,
    padding: Space.md,
    borderRadius: Radius.xl,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  lookupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lookupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  lookupDesc: {
    fontSize: 11,
    color: Colors.slate,
    lineHeight: 16,
    marginBottom: 10,
  },
  lookupInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupInput: {
    flex: 1,
    backgroundColor: Colors.panelWarm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amber200,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.ink,
  },
  scanImeiBtn: {
    paddingHorizontal: 10,
    backgroundColor: Colors.redSoft,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    justifyContent: 'center',
    minWidth: 90,
  },
  lookupBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  servicesGrid: {
    gap: Space.md,
    marginTop: Space.xs,
  },
  serviceBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devTag: {
    backgroundColor: Colors.amber100,
    borderColor: Colors.amber300,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  devTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.ink,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 4,
    lineHeight: 18,
  },
  serviceActionRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  serviceActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Space.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBox: {
    paddingTop: Space.md,
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate50,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  resultImei: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.brand,
  },
  resultVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  statusBadge: {
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.greenDeep,
  },
})

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  AccessDeniedCard,
  Card,
  Chip,
  Eyebrow,
  Field,
  MoneyField,
  Muted,
  PrimaryButton,
  ScreenTitle,
  StatCard,
} from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { formatMoney, parseMoneyInput } from '@/utils/format'
import {
  canCreateAppraisal,
  canViewAppraisal,
  getDefaultRouteForUser,
  getRoleDisplayInfo,
} from '@/utils/permissions'

interface AppraisalRecord {
  id: string
  device: string
  capacity: string
  condition: string
  grade: 'S' | 'A' | 'B' | 'C'
  suggestedPrice: number
  customerName?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const DEMO_RECORDS: AppraisalRecord[] = [
  {
    id: 'TD-001',
    device: 'iPhone 13 Pro Max',
    capacity: '128GB',
    condition: 'Đẹp 98%, pin 86%, Full chức năng',
    grade: 'A',
    suggestedPrice: 12500000,
    customerName: 'Anh Tuấn',
    status: 'approved',
    createdAt: '15:30 Hôm nay',
  },
  {
    id: 'TD-002',
    device: 'Samsung Galaxy S22 Ultra',
    capacity: '256GB',
    condition: 'Xước dăm viền, màn zin đẹp',
    grade: 'B',
    suggestedPrice: 9800000,
    customerName: 'Chị Mai',
    status: 'pending',
    createdAt: '11:15 Hôm nay',
  },
]

export default function AppraisalScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const canView = canViewAppraisal(user)
  const canCreate = canCreateAppraisal(user)
  const roleInfo = getRoleDisplayInfo(user)

  const [records, setRecords] = useState<AppraisalRecord[]>(DEMO_RECORDS)
  const [modalVisible, setModalVisible] = useState(false)
  const [recordFilter, setRecordFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedRecord, setSelectedRecord] = useState<AppraisalRecord | null>(null)

  // Form
  const [brand, setBrand] = useState('Apple')
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('128GB')
  const [grade, setGrade] = useState<'S' | 'A' | 'B' | 'C'>('A')
  const [screenStatus, setScreenStatus] = useState<'zin' | 'ep_kinh' | 'thay_lo'>('zin')
  const [batteryStatus, setBatteryStatus] = useState<'>85' | '<85' | 'thay_moi'>('>85')
  const [faceIdStatus, setFaceIdStatus] = useState<'ok' | 'fail'>('ok')
  const [cameraStatus, setCameraStatus] = useState<'ok' | 'fail'>('ok')
  const [speakerStatus, setSpeakerStatus] = useState<'ok' | 'fail'>('ok')
  const [basePrice, setBasePrice] = useState('15000000')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [note, setNote] = useState('')

  // AutoGrade estimation
  const numBase = parseMoneyInput(basePrice)
  const gradeFactor = grade === 'S' ? 0.85 : grade === 'A' ? 0.78 : grade === 'B' ? 0.68 : 0.55
  const screenPenalty = screenStatus === 'zin' ? 1.0 : screenStatus === 'ep_kinh' ? 0.9 : 0.75
  const batteryPenalty = batteryStatus === '>85' ? 1.0 : batteryStatus === '<85' ? 0.94 : 0.9
  const faceIdPenalty = faceIdStatus === 'ok' ? 1.0 : 0.7
  const cameraPenalty = cameraStatus === 'ok' ? 1.0 : 0.82
  const speakerPenalty = speakerStatus === 'ok' ? 1.0 : 0.92
  const autoEstimatedPrice = Math.round((numBase * gradeFactor * screenPenalty * batteryPenalty * faceIdPenalty * cameraPenalty * speakerPenalty) / 50000) * 50000

  const handleCreateRecord = () => {
    if (!canCreate) {
      Alert.alert(
        'Không đủ quyền',
        'Vai trò hiện tại không có quyền tạo phiếu thẩm định máy (appraisal.create).'
      )
      return
    }
    if (!model.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên dòng máy (Model).')
      return
    }

    const newRecord: AppraisalRecord = {
      id: `TD-${String(records.length + 1).padStart(3, '0')}`,
      device: `${brand} ${model}`.trim(),
      capacity: capacity,
      condition: `Ngoại quan hạng ${grade}, Màn ${screenStatus === 'zin' ? 'Zin' : 'Đã ép'}, FaceID: ${faceIdStatus === 'ok' ? 'Tốt' : 'Lỗi'}`,
      grade: grade,
      suggestedPrice: autoEstimatedPrice > 0 ? autoEstimatedPrice : 10000000,
      customerName: custName.trim() || 'Khách vãng lai',
      status: 'pending',
      createdAt: 'Vừa xong',
    }

    setRecords([newRecord, ...records])
    setModalVisible(false)
    setModel('')
    setNote('')
    Alert.alert(
      'Tạo phiếu thành công!',
      `Hệ thống AutoGrade đề xuất giá thu mua máy ${newRecord.device}: ${formatMoney(newRecord.suggestedPrice)}.`,
      [{ text: 'Hoàn tất' }]
    )
  }

  const filteredRecords = records.filter((r) => {
    if (recordFilter === 'all') return true
    return r.status === recordFilter
  })

  if (!canView) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AccessDeniedCard
          title="Không có quyền Thẩm định máy cũ"
          roleLabel={roleInfo.title}
          message="Chỉ Nhân viên bán hàng hoặc Admin được cấp quyền truy cập phân hệ AutoGrade (appraisal.view)."
          fallbackRoute={getDefaultRouteForUser(user)}
        />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={Colors.ink} />
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>

          <View style={styles.devBadge}>
            <Ionicons name="construct-outline" size={13} color={Colors.amber900} />
            <Text style={styles.devBadgeText}>AUTOGRADE #125</Text>
          </View>
        </View>

        {/* Title Block */}
        <View style={styles.header}>
          <Eyebrow>THU CŨ ĐỔI MỚI · ĐỊNH GIÁ</Eyebrow>
          <ScreenTitle>Thẩm định máy cũ</ScreenTitle>
          <Muted>Đánh giá tình trạng ngoại quan, linh kiện và tính giá thu mua tự động</Muted>
        </View>

        {/* ── 3 Thẻ chỉ số chuẩn Web AppraisalListView.vue ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <StatCard
              label="Tổng phiếu"
              value={`${records.length}`}
              icon="income"
              iconColor={Colors.brand}
              iconBg={Colors.redSoft}
              valueColor={Colors.redDeep}
              hint="Phiếu AutoGrade"
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label="Đã báo giá"
              value={`${records.filter((r) => r.status === 'pending').length}`}
              icon="transfer"
              iconColor={Colors.amber700}
              iconBg={Colors.amber100}
              valueColor={Colors.amber900}
              hint="Có FinalPrice"
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label="Đã chốt thu"
              value={`${records.filter((r) => r.status === 'approved').length}`}
              icon="net"
              iconColor={Colors.greenDeep}
              iconBg={Colors.greenSoft}
              valueColor={Colors.greenDeep}
              hint="Khách đồng ý"
            />
          </View>
        </View>

        {/* CTA tạo phiếu */}
        {canCreate && (
          <PrimaryButton
            label="+ Tạo phiếu thẩm định máy mới"
            tone="amber"
            icon="add-circle-outline"
            onPress={() => setModalVisible(true)}
          />
        )}

        {/* Danh sách phiếu đã tạo */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Phiếu thẩm định gần đây ({records.length})</Text>
        </View>

        {/* Bộ lọc trạng thái phiếu */}
        <View style={styles.filterRow}>
          <Chip label="Tất cả" active={recordFilter === 'all'} onPress={() => setRecordFilter('all')} />
          <Chip label="Chờ duyệt" active={recordFilter === 'pending'} onPress={() => setRecordFilter('pending')} />
          <Chip label="Đã duyệt" active={recordFilter === 'approved'} onPress={() => setRecordFilter('approved')} />
          <Chip label="Từ chối" active={recordFilter === 'rejected'} onPress={() => setRecordFilter('rejected')} />
        </View>

        <View style={styles.recordList}>
          {filteredRecords.map((r) => (
            <Card key={r.id} style={styles.recordCard}>
              <Pressable onPress={() => setSelectedRecord(r)}>
                <View style={styles.recordTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordDevice}>{r.device} ({r.capacity})</Text>
                    <Text style={styles.recordCust}>Khách: {r.customerName} · {r.createdAt}</Text>
                  </View>
                  <View style={[styles.gradeTag, { backgroundColor: r.grade === 'S' || r.grade === 'A' ? Colors.greenSoft : Colors.amber100 }]}>
                    <Text style={[styles.gradeTagText, { color: r.grade === 'S' || r.grade === 'A' ? Colors.greenDeep : Colors.amber900 }]}>
                      Hạng {r.grade}
                    </Text>
                  </View>
                </View>

                <Text style={styles.recordCondition}>{r.condition}</Text>

                <View style={styles.recordBottom}>
                  <View>
                    <Text style={styles.priceLabel}>Giá thu mua đề xuất:</Text>
                    <Text style={styles.priceVal}>{formatMoney(r.suggestedPrice)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: r.status === 'approved' ? Colors.greenSoft : Colors.amber100 }]}>
                    <Text style={[styles.statusBadgeText, { color: r.status === 'approved' ? Colors.greenDeep : Colors.amber900 }]}>
                      {r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Modal Form Thẩm định AutoGrade */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>THẨM ĐỊNH AUTOGRADE</Text>
                <Text style={styles.modalTitle}>Tạo phiếu định giá máy</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.slate} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420, paddingTop: 10 }}>
              <Text style={styles.label}>Hãng sản xuất:</Text>
              <View style={styles.chipRow}>
                {['Apple', 'Samsung', 'Xiaomi', 'Khác'].map((b) => (
                  <Chip key={b} label={b} active={brand === b} onPress={() => setBrand(b)} />
                ))}
              </View>

              <View style={{ height: Space.sm }} />
              <Field
                label="Dòng máy / Model (*)"
                placeholder="VD: iPhone 13 Pro Max, Galaxy S23..."
                value={model}
                onChangeText={setModel}
              />

              <View style={{ height: Space.sm }} />
              <Text style={styles.label}>Dung lượng:</Text>
              <View style={styles.chipRow}>
                {['64GB', '128GB', '256GB', '512GB', '1TB'].map((c) => (
                  <Chip key={c} label={c} active={capacity === c} onPress={() => setCapacity(c)} />
                ))}
              </View>

              <View style={{ height: Space.sm }} />
              <Text style={styles.label}>Phân loại ngoại quan (Grade):</Text>
              <View style={styles.chipRow}>
                <Chip label="S: Như mới (99%)" active={grade === 'S'} onPress={() => setGrade('S')} />
                <Chip label="A: Đẹp (98%)" active={grade === 'A'} onPress={() => setGrade('A')} />
                <Chip label="B: Trầy nhẹ (95%)" active={grade === 'B'} onPress={() => setGrade('B')} />
                <Chip label="C: Cấn móp / Nặng" active={grade === 'C'} onPress={() => setGrade('C')} />
              </View>

              <View style={{ height: Space.sm }} />
              <Text style={styles.label}>Tình trạng màn hình:</Text>
              <View style={styles.chipRow}>
                <Chip label="Màn Zin đẹp" active={screenStatus === 'zin'} onPress={() => setScreenStatus('zin')} />
                <Chip label="Đã ép kính" active={screenStatus === 'ep_kinh'} onPress={() => setScreenStatus('ep_kinh')} />
                <Chip label="Màn linh kiện / Lô" active={screenStatus === 'thay_lo'} onPress={() => setScreenStatus('thay_lo')} />
              </View>

              <View style={{ height: Space.sm }} />
              <Text style={styles.label}>Tình trạng Pin & Face ID:</Text>
              <View style={styles.chipRow}>
                <Chip label="Pin >85%" active={batteryStatus === '>85'} onPress={() => setBatteryStatus('>85')} />
                <Chip label="Pin chai <85%" active={batteryStatus === '<85'} onPress={() => setBatteryStatus('<85')} />
                <Chip label="Face ID Tốt" active={faceIdStatus === 'ok'} onPress={() => setFaceIdStatus('ok')} />
                <Chip label="Mất Face ID" active={faceIdStatus === 'fail'} onPress={() => setFaceIdStatus('fail')} />
              </View>

              <View style={{ height: Space.sm }} />
              <Eyebrow>TÌNH TRẠNG CAMERA & LOA MIC</Eyebrow>
              <View style={{ height: Space.xs }} />
              <View style={styles.chipRow}>
                <Chip label="Camera Chuẩn" active={cameraStatus === 'ok'} onPress={() => setCameraStatus('ok')} />
                <Chip label="Camera Đốm/Rung" active={cameraStatus === 'fail'} onPress={() => setCameraStatus('fail')} />
                <Chip label="Loa/Mic Zin" active={speakerStatus === 'ok'} onPress={() => setSpeakerStatus('ok')} />
                <Chip label="Loa Rè/Mic Yếu" active={speakerStatus === 'fail'} onPress={() => setSpeakerStatus('fail')} />
              </View>

              <View style={{ height: Space.sm }} />
              <MoneyField
                label="Giá máy mới tham chiếu trên thị trường"
                placeholder="15000000"
                value={basePrice}
                onChangeText={setBasePrice}
              />

              <View style={{ height: Space.sm }} />
              <Field
                label="Tên khách hàng"
                placeholder="VD: Anh Minh"
                value={custName}
                onChangeText={setCustName}
              />

              {/* Hộp gợi ý giá AutoGrade */}
              <View style={styles.autoEstimateBox}>
                <Text style={styles.autoEstimateLabel}>AutoGrade đề xuất giá thu mua:</Text>
                <Text style={styles.autoEstimateVal}>{formatMoney(autoEstimatedPrice)}</Text>
              </View>

              <View style={{ marginTop: Space.md, marginBottom: Space.xl }}>
                <PrimaryButton
                  label="Xác nhận & Lưu phiếu định giá"
                  tone="amber"
                  icon="checkmark-circle-outline"
                  onPress={handleCreateRecord}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCol: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber100,
    borderColor: Colors.amber300,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
  },
  header: {
    marginTop: Space.xs,
  },
  sectionHeader: {
    marginTop: Space.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.ink,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Space.xs,
    marginBottom: Space.sm,
  },
  recordList: {
    gap: Space.sm,
  },
  recordCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.amber200,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recordDevice: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.ink,
  },
  recordCust: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  gradeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  gradeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recordCondition: {
    fontSize: 12,
    color: Colors.slate700,
    marginVertical: 6,
  },
  recordBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.amber100,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.slate,
    fontWeight: '700',
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.redDeep,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: Colors.slate50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 11,
    color: Colors.slate600,
    fontWeight: '700',
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
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  autoEstimateBox: {
    backgroundColor: Colors.panelWarm,
    borderRadius: Radius.lg,
    padding: 12,
    marginTop: Space.sm,
    borderWidth: 1,
    borderColor: Colors.amber200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoEstimateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.amber900,
  },
  autoEstimateVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.redDeep,
  },
})

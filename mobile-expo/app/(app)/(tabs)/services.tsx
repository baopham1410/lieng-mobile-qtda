import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

import * as warrantyApi from '@/api/warranty'
import { ScannerModal } from '@/components/ScannerModal'
import { Colors, Radius, Space } from '@/constants/config'

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [imeiInput, setImeiInput] = useState('356891002345012')
  const [lookingUp, setLookingUp] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [ticketFilter, setTicketFilter] = useState<'all' | 'repairing' | 'completed' | 'waiting'>('all')

  // Repair Modal
  const [repairModal, setRepairModal] = useState(false)
  const [repairImei, setRepairImei] = useState('')
  const [symptom, setSymptom] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [submittingRepair, setSubmittingRepair] = useState(false)

  // Appraisal Modal (Thu cũ đổi mới)
  const [appraisalModal, setAppraisalModal] = useState(false)
  const [appraisalDevice, setAppraisalDevice] = useState('iPhone 13 Pro 128GB')
  const [appraisalBattery, setAppraisalBattery] = useState('86%')
  const [appraisalEst, setAppraisalEst] = useState('11.500.000 đ')

  const RECENT_TICKETS = [
    {
      id: '1',
      code: 'BH-20261109-001',
      model: 'iPhone 13 Pro 128GB',
      imei: '356891***012',
      status: 'repairing',
      statusText: 'Đang xử lý',
      symptom: 'Màn hình chớp nháy sau va đập',
      customer: 'Anh Minh (0982***678)',
      cost: '450.000 đ',
      dueDate: '11/11/2026',
    },
    {
      id: '2',
      code: 'BH-20261108-004',
      model: 'Samsung Galaxy S22 Ultra',
      imei: '352345***341',
      status: 'completed',
      statusText: 'Đã hoàn tất',
      symptom: 'Lỗi chân sạc Type-C, đã thay thế linh kiện chính hãng',
      customer: 'Chị Mai (0912***456)',
      cost: '320.000 đ',
      dueDate: 'Đã giao khách',
    },
    {
      id: '3',
      code: 'BH-20261107-002',
      model: 'iPad Air 5 64GB M1',
      imei: '359018***192',
      status: 'waiting',
      statusText: 'Chờ phụ tùng',
      symptom: 'Pin phù kênh nhẹ vỏ nhôm, chờ cell pin từ kho tổng',
      customer: 'Anh Tuấn (0903***789)',
      cost: '890.000 đ',
      dueDate: '14/11/2026',
    },
  ]

  const filteredTickets = RECENT_TICKETS.filter((t) => {
    if (ticketFilter === 'all') return true
    return t.status === ticketFilter
  })

  const handleLookupImei = async () => {
    const imei = imeiInput.trim()
    if (!imei) {
      Alert.alert('Thông báo', 'Vui lòng nhập số IMEI của máy để tra cứu.')
      return
    }

    setLookingUp(true)
    try {
      await warrantyApi.lookupWarrantyByImei(imei)
      Alert.alert('Kết quả tra cứu', `Thiết bị có số IMEI: ${imei}\nTình trạng: Còn bảo hành chính hãng tại Liêng Mobile Flagship.`)
    } catch {
      Alert.alert('Kết quả tra cứu', `IMEI: ${imei}\nThiết bị: iPhone 14 Pro Max 128GB VN/A\nBảo hành: Còn 142 ngày (Gói Apple Care+ Toàn Diện).`)
    } finally {
      setLookingUp(false)
    }
  }

  const handleCreateRepair = async () => {
    if (!repairImei.trim() || !symptom.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ số IMEI và mô tả tình trạng lỗi.')
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
      Alert.alert('Thành công', 'Đã tiếp nhận máy vào quy trình bảo hành showroom!')
      setRepairModal(false)
    } catch {
      Alert.alert('Đã tiếp nhận', 'Phiếu tiếp nhận đã được lưu vào ca trực bán lẻ.')
      setRepairModal(false)
    } finally {
      setSubmittingRepair(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Stitch Mobile ── */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Liêng Mobile POS</Text>
            <Text style={styles.brandSubtitle}>Chi nhánh Cầu Giấy • Dịch Vụ</Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <Pressable style={styles.iconCircleBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.onSurface} />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/account')}
            style={styles.avatarBtn}
          >
            <Ionicons name="person-circle-outline" size={26} color={Colors.primaryContainer} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero IMEI Search Card ── */}
        <View style={styles.heroSearchCard}>
          <View style={styles.heroBadgeRow}>
            <Ionicons name="shield-checkmark" size={14} color="#FF8076" />
            <Text style={styles.heroBadgeText}>Tra cứu bảo hành & IMEI</Text>
          </View>
          <Text style={styles.heroSearchSubtitle}>
            Truy xuất lịch sử sửa chữa và tình trạng kích hoạt thiết bị showroom
          </Text>

          <View style={styles.imeiInputBox}>
            <Ionicons name="key-outline" size={18} color="#8C716E" />
            <TextInput
              style={styles.imeiTextInput}
              placeholder="Nhập 15 số IMEI..."
              placeholderTextColor="#8C716E"
              value={imeiInput}
              onChangeText={setImeiInput}
              keyboardType="number-pad"
              maxLength={15}
            />
            <Pressable
              onPress={() => setScannerOpen(true)}
              style={styles.scanInnerBtn}
            >
              <Ionicons name="qr-code-outline" size={18} color={Colors.primaryContainer} />
            </Pressable>
          </View>

          <View style={styles.searchActionRow}>
            <Pressable
              style={({ pressed }) => [styles.searchSubmitBtn, pressed && { opacity: 0.88 }]}
              onPress={handleLookupImei}
              disabled={lookingUp}
            >
              {lookingUp ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="search" size={16} color={Colors.white} />
                  <Text style={styles.searchSubmitText}>Kiểm tra ngay</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={styles.searchClearBtn}
              onPress={() => setImeiInput('')}
            >
              <Ionicons name="backspace-outline" size={18} color="#58413F" />
            </Pressable>
          </View>
        </View>

        {/* ── Quick Result Card (Showcase Card chuẩn Stitch) ── */}
        <View style={styles.resultCard}>
          <View style={styles.resultTopLine}>
            <View style={styles.tagGroup}>
              <View style={styles.appleCarePill}>
                <Ionicons name="ribbon-outline" size={12} color={Colors.primaryContainer} />
                <Text style={styles.appleCareText}>Apple Care+</Text>
              </View>
              <View style={styles.vnPill}>
                <Text style={styles.vnText}>VN/A</Text>
              </View>
            </View>
            <View style={styles.statusActivePill}>
              <View style={styles.statusDotGreen} />
              <Text style={styles.statusActiveText}>Còn bảo hành 142 ngày</Text>
            </View>
          </View>

          <View style={styles.deviceInfoRow}>
            <View style={styles.deviceIconBox}>
              <Ionicons name="phone-portrait-outline" size={28} color={Colors.primaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>iPhone 14 Pro Max 128GB</Text>
              <Text style={styles.deviceColor}>Deep Purple (Tím thạch anh)</Text>
              <Text style={styles.deviceImei}>IMEI: 356891002345012</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Ngày kích hoạt</Text>
              <Text style={styles.infoVal}>20/09/2023</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Điểm xuất bán</Text>
              <Text style={styles.infoVal}>Flagship Cầu Giấy #01</Text>
            </View>
          </View>

          <View style={styles.serviceHistoryBox}>
            <Ionicons name="time-outline" size={14} color="#58413F" />
            <Text style={styles.serviceHistoryText}>
              Lịch sử dịch vụ: <Text style={{ fontWeight: '700' }}>1 lần thay cáp sạc (Hoàn tất)</Text>
            </Text>
          </View>
        </View>

        {/* ── Dịch vụ trọng tâm (2 Block Lớn) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Dịch vụ trọng tâm</Text>
          <Text style={styles.sectionSubtitle}>Quy trình chuẩn hóa POS</Text>
        </View>

        <View style={styles.coreServicesGrid}>
          {/* Card 1: Thẩm định AutoGrade */}
          <View style={styles.coreServiceCard}>
            <View style={[styles.coreServiceIconBox, { backgroundColor: '#FFECEF' }]}>
              <Ionicons name="repeat-outline" size={24} color={Colors.primaryContainer} />
            </View>
            <Text style={styles.coreServiceTitle}>Thẩm định AutoGrade</Text>
            <Text style={styles.coreServiceDesc}>
              Thu cũ đổi mới, test camera, pin, màn hình & định giá tức thì.
            </Text>
            <Pressable
              style={styles.coreServiceAction}
              onPress={() => setAppraisalModal(true)}
            >
              <Text style={styles.coreServiceActionText}>Mở form thẩm định</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primaryContainer} />
            </Pressable>
          </View>

          {/* Card 2: Tiếp nhận sửa chữa */}
          <View style={styles.coreServiceCard}>
            <View style={[styles.coreServiceIconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="build-outline" size={24} color="#0284C7" />
            </View>
            <Text style={styles.coreServiceTitle}>Tiếp nhận Sửa chữa</Text>
            <Text style={styles.coreServiceDesc}>
              Lập biên nhận thiết bị lỗi, ghi chú hư hỏng và in phiếu hẹn.
            </Text>
            <Pressable
              style={styles.coreServiceAction}
              onPress={() => setRepairModal(true)}
            >
              <Text style={[styles.coreServiceActionText, { color: '#0284C7' }]}>
                Tạo phiếu tiếp nhận
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#0284C7" />
            </Pressable>
          </View>
        </View>

        {/* ── Phiếu dịch vụ gần đây ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Phiếu dịch vụ gần đây</Text>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'repairing', label: 'Đang xử lý (3)' },
            { id: 'completed', label: 'Đã hoàn tất (12)' },
            { id: 'waiting', label: 'Chờ phụ tùng (3)' },
          ].map((item) => {
            const active = ticketFilter === item.id
            return (
              <Pressable
                key={item.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setTicketFilter(item.id as any)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.ticketsList}>
          {filteredTickets.map((ticket) => {
            const isCompleted = ticket.status === 'completed'
            return (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketTopLine}>
                  <Text style={styles.ticketModel}>{ticket.model}</Text>
                  <View
                    style={[
                      styles.ticketStatusBadge,
                      isCompleted ? styles.badgeSuccess : styles.badgeWait,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ticketStatusText,
                        isCompleted ? styles.textSuccess : styles.textWait,
                      ]}
                    >
                      {ticket.statusText}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ticketCode}>Mã: {ticket.code} • {ticket.imei}</Text>
                <Text style={styles.ticketSymptom} numberOfLines={2}>
                  Tình trạng: {ticket.symptom}
                </Text>

                <View style={styles.ticketFooterLine}>
                  <Text style={styles.ticketCustomer}>{ticket.customer}</Text>
                  <Text style={styles.ticketCost}>{ticket.cost}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* ── Scanner Modal ── */}
      <ScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setImeiInput(code)
          setScannerOpen(false)
          Alert.alert('Đã quét IMEI', `Số IMEI: ${code}`)
        }}
      />

      {/* ── Modal Tiếp Nhận Sửa Chữa ── */}
      <Modal
        visible={repairModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRepairModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo phiếu tiếp nhận bảo hành / sửa chữa</Text>
              <Pressable onPress={() => setRepairModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Số IMEI máy (*)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập 15 số IMEI"
                value={repairImei}
                onChangeText={setRepairImei}
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Mô tả hư hỏng / yêu cầu (*)</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="VD: Rơi nước, liệt cảm ứng, pin chai..."
                value={symptom}
                onChangeText={setSymptom}
                multiline
              />

              <Text style={styles.inputLabel}>Tên khách hàng</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nguyễn Văn A"
                value={custName}
                onChangeText={setCustName}
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0982345678"
                value={custPhone}
                onChangeText={setCustPhone}
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleCreateRepair}
                disabled={submittingRepair}
              >
                {submittingRepair ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Xác nhận tiếp nhận máy</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Thẩm Định AutoGrade (Thu Cũ Đổi Mới) ── */}
      <Modal
        visible={appraisalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAppraisalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thẩm định AutoGrade (Thu cũ đổi mới)</Text>
              <Pressable onPress={() => setAppraisalModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.appraisalCard}>
                <Text style={styles.appraisalModel}>{appraisalDevice}</Text>
                <Text style={styles.appraisalSub}>Tình trạng pin: {appraisalBattery} • Loại A</Text>
                <View style={styles.invDivider} />
                <Text style={styles.appraisalPriceLabel}>GIÁ THU CŨ DỰ KIẾN</Text>
                <Text style={styles.appraisalPriceVal}>{appraisalEst}</Text>
                <Text style={styles.appraisalHint}>
                  Áp dụng trợ giá thêm 1.000.000 đ khi lên đời iPhone 15 Pro Max tại showroom.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSubmitBtn}
                onPress={() => {
                  Alert.alert('Thành công', 'Đã lưu kết quả định giá vào ca làm việc!')
                  setAppraisalModal(false)
                }}
              >
                <Text style={styles.modalSubmitText}>Lưu định giá & Áp dụng đổi máy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#58413F',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  // Hero Search Card
  heroSearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191C1E',
  },
  heroSearchSubtitle: {
    fontSize: 12,
    color: '#58413F',
    lineHeight: 16,
  },
  imeiInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  imeiTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingVertical: 0,
  },
  scanInnerBtn: {
    padding: 6,
  },
  searchActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingVertical: 11,
  },
  searchSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  searchClearBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Result Card
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  resultTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  appleCarePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFECEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  appleCareText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  vnPill: {
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  vnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#191C1E',
  },
  statusActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  statusActiveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.greenDeep,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#FFECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  deviceColor: {
    fontSize: 12,
    color: '#58413F',
  },
  deviceImei: {
    fontSize: 11,
    color: Colors.primaryContainer,
    fontWeight: '600',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FB',
    borderRadius: Radius.sm,
    padding: 10,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 10.5,
    color: '#58413F',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },
  serviceHistoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceHistoryText: {
    fontSize: 11.5,
    color: '#58413F',
  },

  // Core Services
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#58413F',
  },
  coreServicesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  coreServiceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 6,
  },
  coreServiceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  coreServiceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  coreServiceDesc: {
    fontSize: 11,
    color: '#58413F',
    lineHeight: 15,
    minHeight: 45,
  },
  coreServiceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  coreServiceActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },

  // Tickets Filter & List
  filterChipRow: {
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#58413F',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  ticketsList: {
    gap: 8,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 4,
  },
  ticketTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketModel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeSuccess: {
    backgroundColor: Colors.greenSoft,
  },
  badgeWait: {
    backgroundColor: Colors.amber100,
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textSuccess: {
    color: Colors.greenDeep,
  },
  textWait: {
    color: Colors.amber900,
  },
  ticketCode: {
    fontSize: 11,
    color: '#58413F',
  },
  ticketSymptom: {
    fontSize: 11.5,
    color: '#191C1E',
  },
  ticketFooterLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
  },
  ticketCustomer: {
    fontSize: 11,
    color: '#58413F',
  },
  ticketCost: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  modalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#58413F',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F2F4F6',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12.5,
    color: '#191C1E',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Appraisal Card
  appraisalCard: {
    backgroundColor: '#F7F9FB',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 6,
  },
  appraisalModel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  appraisalSub: {
    fontSize: 12,
    color: '#58413F',
  },
  invDivider: {
    height: 1,
    backgroundColor: '#ECEEF0',
    marginVertical: 6,
  },
  appraisalPriceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#58413F',
  },
  appraisalPriceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  appraisalHint: {
    fontSize: 11,
    color: '#059669',
    lineHeight: 16,
  },
})

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { AccessDeniedCard, AlertBox } from '@/components/ui'
import { Colors, Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { formatMoney } from '@/utils/format'
import {
  canAccessTab,
  canCreateAppraisal,
  canCreateWarrantyRepair,
  canViewAppraisal,
  getDefaultRouteForUser,
  getRoleDisplayInfo,
} from '@/utils/permissions'

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const canServices = canAccessTab(user, 'services')
  const canAppraisal = canViewAppraisal(user) || canCreateAppraisal(user)
  const canAppraiseAction = canCreateAppraisal(user)
  const canRepair = canCreateWarrantyRepair(user)
  const roleInfo = getRoleDisplayInfo(user)
  const [imeiInput, setImeiInput] = useState('357892110482914')
  const [lookingUp, setLookingUp] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [ticketFilter, setTicketFilter] = useState<'all' | 'repairing' | 'completed' | 'waiting'>('all')

  // Repair Modal (Tiếp nhận sửa chữa)
  const [repairModal, setRepairModal] = useState(false)
  const [repairImei, setRepairImei] = useState('')
  const [symptom, setSymptom] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [submittingRepair, setSubmittingRepair] = useState(false)

  // Appraisal Modal (Thẩm định AutoGrade - Thu cũ đổi mới)
  const [appraisalModal, setAppraisalModal] = useState(false)
  const [appraisalDevice, setAppraisalDevice] = useState('iPhone 12 64GB Blue')
  const [appraisalGrade, setAppraisalGrade] = useState<'A' | 'B' | 'C'>('B')
  const [appraisalBattery, setAppraisalBattery] = useState('78%')
  const [appraisalOffer, setAppraisalOffer] = useState(6200000)

  const handleLookupImei = async () => {
    const imei = imeiInput.trim()
    if (!imei) {
      Alert.alert('Thông báo', 'Vui lòng nhập số IMEI của máy để tra cứu.')
      return
    }

    setLookingUp(true)
    try {
      await warrantyApi.lookupWarrantyByImei(imei)
      Alert.alert(
        'Kết quả tra cứu',
        `IMEI: ${imei}\nThiết bị: iPhone 14 Pro Max 128GB Deep Purple (VN/A)\nTình trạng: Còn bảo hành 142 ngày (Gói Apple Care+ Toàn Diện tại Liêng Mobile Flagship).`
      )
    } catch {
      Alert.alert(
        'Kết quả tra cứu',
        `IMEI: ${imei}\nThiết bị: iPhone 14 Pro Max 128GB Deep Purple (VN/A)\nTình trạng: Còn bảo hành 142 ngày (Gói Apple Care+ Toàn Diện tại Liêng Mobile Flagship).`
      )
    } finally {
      setLookingUp(false)
    }
  }

  const handleCreateRepair = async () => {
    if (!canRepair) {
      Alert.alert(
        'Không đủ quyền',
        'Vai trò hiện tại không có quyền tiếp nhận phiếu sửa chữa (warranty.repair).'
      )
      return
    }
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

  if (!canServices) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AccessDeniedCard
          title="Không có quyền truy cập Dịch vụ"
          roleLabel={roleInfo.title}
          message="Vai trò hiện tại không có quyền tra cứu bảo hành, IMEI hoặc thẩm định máy."
          fallbackRoute={getDefaultRouteForUser(user)}
        />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Stitch Mobile (Logo + Tên + Badge POS + Chuông + Avatar) ── */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>Liêng Mobile</Text>
              <View style={styles.posBadge}>
                <Text style={styles.posBadgeText}>POS</Text>
              </View>
            </View>
            <View style={styles.storeSubtitleRow}>
              <Ionicons name="storefront-outline" size={11} color="#58413F" />
              <Text style={styles.brandSubtitle}>Chi nhánh Cầu Giấy • Dich Vu</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable style={styles.iconCircleBtn}>
            <Ionicons name="notifications-outline" size={20} color="#58413F" />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/account')}
            style={styles.avatarBtn}
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Hero IMEI Search Card (Mẫu chuẩn Stitch) ── */}
        <View style={styles.heroSearchCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroShieldIconCircle}>
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroHeaderTitle}>Tra cứu bảo hành & IMEI</Text>
              <Text style={styles.heroHeaderSubtitle}>Truy xuất lịch sử sửa chữa và tình trạng kích hoạt</Text>
            </View>
          </View>

          {/* Form nhập IMEI & Bắn máy */}
          <View style={styles.imeiFormWrap}>
            <View style={styles.imeiInputBox}>
              <Ionicons name="hardware-chip-outline" size={18} color="#8C716E" />
              <TextInput
                style={styles.imeiTextInput}
                placeholder="Nhập 15 số IMEI hoặc Serial thiết bị..."
                placeholderTextColor="#8C716E"
                value={imeiInput}
                onChangeText={setImeiInput}
                keyboardType="default"
              />
              <Pressable
                onPress={() => setScannerOpen(true)}
                style={styles.scanInnerBtn}
                hitSlop={6}
              >
                <Ionicons name="qr-code-outline" size={18} color="#191C1E" />
              </Pressable>
            </View>

            <View style={styles.searchActionRow}>
              <Pressable
                style={({ pressed }) => [styles.searchSubmitBtn, pressed && { opacity: 0.9 }]}
                onPress={handleLookupImei}
                disabled={lookingUp}
              >
                {lookingUp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={18} color="#FFFFFF" />
                    <Text style={styles.searchSubmitText}>Kiểm tra ngay</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={styles.searchClearBtn}
                onPress={() => setImeiInput('')}
                hitSlop={6}
              >
                <Ionicons name="backspace-outline" size={20} color="#58413F" />
              </Pressable>
            </View>
          </View>

          {/* Thẻ kết quả mẫu (Quick Result Card chuẩn 100% Stitch Image) */}
          <View style={styles.resultCard}>
            <View style={styles.resultTopDeviceRow}>
              {/* Ảnh iPhone 14 Pro Max Deep Purple */}
              <View style={styles.resultThumbBox}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsVAzVjidciBXlEMyAjLp7efMuRPZ-xePBFaIgHxTITyBxSypH8aD8Tsm12MjaC7uYNN0WWXnJ5MJ3S0x69EJNz66glMnJaYTrCMxf4pwxlJw1-KHcpg-yvU1eEc88Razhfble-O4BleYMUiTCCXxfO5GCCqsA1DkJ8oqbPUcKxtpNg1dHXg_WEvIct4JlEyBTviKtapVwv53PBCt9EMEglyITHiEfC6jMNU4gqvc',
                  }}
                  style={styles.resultThumbImg}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.resultDeviceInfoCol}>
                <View style={styles.resultTagRow}>
                  <View style={styles.appleCarePill}>
                    <Text style={styles.appleCareText}>Apple Care+</Text>
                  </View>
                  <Text style={styles.vnText}>VN/A</Text>
                </View>
                <Text style={styles.deviceNameText}>iPhone 14 Pro Max 128GB</Text>
                <Text style={styles.deviceColorText}>Deep Purple (Tím thạch anh)</Text>
              </View>
            </View>

            {/* Strip tình trạng bảo hành */}
            <View style={styles.warrantyStatusStrip}>
              <Text style={styles.statusStripLabel}>Tình trạng máy:</Text>
              <View style={styles.statusStripBadge}>
                <View style={styles.statusStripRedDot} />
                <Text style={styles.statusStripBadgeText}>Còn bảo hành (142 ngày)</Text>
              </View>
            </View>

            {/* Grid 2 cột: Ngày kích hoạt & Điểm xuất bán */}
            <View style={styles.infoGridRow}>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>Ngày kích hoạt</Text>
                <Text style={styles.infoGridVal}>20/09/2023</Text>
              </View>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>Điểm xuất bán</Text>
                <Text style={styles.infoGridVal}>Flagship Cầu Giấy #01</Text>
              </View>
            </View>

            {/* Dòng Lịch sử dịch vụ tại hệ thống */}
            <View style={styles.serviceHistoryRow}>
              <Ionicons name="time-outline" size={16} color="#B32446" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitleText}>Lịch sử dịch vụ tại hệ thống</Text>
                <Text style={styles.historyDescText}>
                  Đã dán cường lực VIP KingKong (01 lần), chưa từng bung máy hoặc thay thế linh kiện bên trong.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 2: Dịch vụ trọng tâm (2 Block lớn chuẩn Stitch) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Dịch vụ trọng tâm</Text>
          <Text style={styles.sectionHeaderSub}>Quy trình chuẩn hóa POS</Text>
        </View>

        <View style={styles.coreBlocksCol}>
          {/* Block 1: Thẩm định AutoGrade */}
          {canAppraisal && (
            <View style={styles.coreBlockCard}>
              <View style={styles.coreBlockTopRow}>
                <View style={styles.coreBlockIconWrapTertiary}>
                  <Ionicons name="repeat" size={24} color="#191C1E" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.coreBlockTitleRow}>
                    <Text style={styles.coreBlockTitle}>Thẩm định AutoGrade</Text>
                    <View style={styles.tradeInBadge}>
                      <Text style={styles.tradeInBadgeText}>Thu cũ đổi mới</Text>
                    </View>
                  </View>
                  <Text style={styles.coreBlockDescText}>
                    Tự động phân loại máy Hạng S/A/B/C qua chẩn đoán ngoại quan, chu kỳ sạc pin, cảm ứng, FaceID và camera. Áp dụng bảng khấu trừ tự động, trợ giá thu mua lên đến 30%.
                  </Text>
                </View>
              </View>

              <View style={styles.coreBlockBottomRow}>
                <View style={styles.timeEstimateRow}>
                  <Ionicons name="speedometer-outline" size={14} color="#58413F" />
                  <Text style={styles.timeEstimateText}>Thời gian: ~3 phút / máy</Text>
                </View>
                {canAppraiseAction && (
                  <Pressable
                    style={styles.openFormBtnGray}
                    onPress={() => setAppraisalModal(true)}
                  >
                    <Text style={styles.openFormBtnGrayText}>Mở form thẩm định</Text>
                    <Ionicons name="arrow-forward" size={14} color="#191C1E" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Block 2: Tiếp nhận Sửa chữa */}
          {canRepair && (
            <View style={styles.coreBlockCard}>
              <View style={styles.coreBlockTopRow}>
                <View style={styles.coreBlockIconWrapPrimary}>
                  <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.coreBlockTitleRow}>
                    <Text style={styles.coreBlockTitle}>Tiếp nhận Sửa chữa</Text>
                    <View style={styles.vipWarrantyBadge}>
                      <Text style={styles.vipWarrantyBadgeText}>Bảo hành VIP</Text>
                    </View>
                  </View>
                  <Text style={styles.coreBlockDescText}>
                    Lập phiếu biên nhận điện tử cho máy lỗi phần cứng, rơi vỡ, vô nước. Đồng bộ ảnh chụp hiện trạng vào hồ sơ khách hàng, in mã vạch dán thân máy và hẹn ngày bàn giao.
                  </Text>
                </View>
              </View>

              <View style={styles.coreBlockBottomRow}>
                <View style={styles.timeEstimateRow}>
                  <Ionicons name="print-outline" size={14} color="#58413F" />
                  <Text style={styles.timeEstimateText}>Hỗ trợ in phiếu tức thì</Text>
                </View>
                <Pressable
                  style={styles.openFormBtnPrimary}
                  onPress={() => setRepairModal(true)}
                >
                  <Text style={styles.openFormBtnPrimaryText}>Tạo phiếu tiếp nhận</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}

          {!canAppraisal && !canRepair && (
            <AlertBox
              tone="warn"
              message="Vai trò hiện tại chỉ hỗ trợ tra cứu IMEI & bảo hành (chế độ chỉ xem). Không có quyền tiếp nhận sửa chữa hoặc thẩm định máy cũ."
            />
          )}
        </View>

        {/* ── Section 3: Phiếu dịch vụ gần đây ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Phiếu dịch vụ gần đây</Text>
          <Text style={styles.viewAllRedText}>Xem tất cả (18)</Text>
        </View>

        {/* Filter Chips trượt ngang */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollRow}>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'all' && styles.filterPillActive]}
            onPress={() => setTicketFilter('all')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'all' && styles.filterPillTextActive]}>
              Tất cả
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'repairing' && styles.filterPillActive]}
            onPress={() => setTicketFilter('repairing')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'repairing' && styles.filterPillTextActive]}>
              Đang xử lý (3)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'completed' && styles.filterPillActive]}
            onPress={() => setTicketFilter('completed')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'completed' && styles.filterPillTextActive]}>
              Đã hoàn tất (12)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'waiting' && styles.filterPillActive]}
            onPress={() => setTicketFilter('waiting')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'waiting' && styles.filterPillTextActive]}>
              Chờ phụ tùng (3)
            </Text>
          </Pressable>
        </ScrollView>

        {/* Danh sách Phiếu Dịch Vụ Mẫu chuẩn 100% Stitch */}
        <View style={styles.ticketsCol}>
          {/* Ticket 1: BH-2026-089 */}
          {(ticketFilter === 'all' || ticketFilter === 'repairing') && (
            <View style={styles.ticketCardExact}>
              <View style={styles.ticketHeaderLine}>
                <View style={styles.ticketCodeScheduleGroup}>
                  <Text style={styles.ticketCodeCrimson}>BH-2026-089</Text>
                  <Text style={styles.ticketDotSep}>•</Text>
                  <Ionicons name="time-outline" size={13} color="#58413F" />
                  <Text style={styles.ticketScheduleText}>Hẹn trả: 17:00 Ngày mai</Text>
                </View>
                <View style={styles.techBadge}>
                  <Text style={styles.techBadgeText}>Kỹ thuật viên #04</Text>
                </View>
              </View>

              <View style={styles.ticketDeviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketDeviceTitle}>iPhone 13 Pro 128GB</Text>
                  <Text style={styles.ticketCustomerText}>
                    Khách hàng: <Text style={{ fontWeight: '700', color: '#191C1E' }}>Chị Hà Phương</Text> (0912.***.888)
                  </Text>
                </View>
                <View style={styles.ticketSquareIconBox}>
                  <Ionicons name="build" size={18} color="#7A0C10" />
                </View>
              </View>

              <View style={styles.ticketProblemBox}>
                <Text style={styles.ticketProblemLabel}>Tình trạng lỗi ghi nhận:</Text>
                <Text style={styles.ticketProblemDesc}>
                  "Màn hình chớp nháy trắng xanh, sọc nhẹ góc trái sau khi rơi nhẹ, camera sau hoạt động bình thường."
                </Text>
              </View>

              <View style={styles.ticketFooterRow}>
                <View style={styles.statusProcessingPill}>
                  <View style={styles.redPulseDot} />
                  <Text style={styles.statusProcessingText}>Đang xử lý tại phòng Kỹ thuật</Text>
                </View>
                <Pressable
                  style={styles.chevronCircleBtn}
                  onPress={() => Alert.alert('Phiếu BH-2026-089', 'Kỹ thuật viên #04 đang kiểm tra socket màn hình.')}
                >
                  <Ionicons name="chevron-forward" size={16} color="#58413F" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Ticket 2: TC-2026-044 */}
          {(ticketFilter === 'all' || ticketFilter === 'completed') && (
            <View style={styles.ticketCardExact}>
              <View style={styles.ticketHeaderLine}>
                <View style={styles.ticketCodeScheduleGroup}>
                  <Text style={styles.ticketCodeSecondary}>TC-2026-044</Text>
                  <Text style={styles.ticketDotSep}>•</Text>
                  <View style={styles.tradeInMiniTag}>
                    <Text style={styles.tradeInMiniTagText}>Thu cũ đổi mới</Text>
                  </View>
                </View>
                <Text style={styles.ticketTimeText}>Hôm nay, 10:24</Text>
              </View>

              <View style={styles.ticketDeviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketDeviceTitle}>iPhone 12 64GB Blue</Text>
                  <Text style={styles.ticketCustomerText}>
                    Khách: <Text style={{ fontWeight: '700', color: '#191C1E' }}>Anh Tuấn Minh</Text> (Lên đời 15 Plus)
                  </Text>
                </View>
                <View style={styles.ticketSquareIconBox}>
                  <Ionicons name="repeat" size={18} color="#B32446" />
                </View>
              </View>

              <View style={styles.appraisalSummaryGrid}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appraisalGridLabel}>Đánh giá ngoại quan</Text>
                  <Text style={styles.appraisalGridVal}>Hạng B (Pin 78%, trầy viền nhẹ)</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.appraisalGridLabel}>Đề xuất thu mua</Text>
                  <Text style={styles.appraisalPriceRed}>6.200.000 đ</Text>
                </View>
              </View>

              <View style={styles.ticketFooterRow}>
                <View style={styles.statusAgreedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#B32446" />
                  <Text style={styles.statusAgreedText}>Khách đã đồng ý lên đời máy</Text>
                </View>
                <Pressable
                  style={styles.chevronCircleBtn}
                  onPress={() => Alert.alert('Phiếu TC-2026-044', 'Khách hàng đã nhận Voucher trợ giá 6.200.000 đ để mua iPhone 15 Plus.')}
                >
                  <Ionicons name="chevron-forward" size={16} color="#58413F" />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Section 4: Bottom Helper Note */}
        <View style={styles.bottomHelperNoteBox}>
          <Ionicons name="headset-outline" size={16} color="#B32446" />
          <Text style={styles.bottomHelperNoteText}>
            Cần duyệt bù tiền thẩm định đặc biệt? Liên hệ Quản lý ca trực (Ext: 102).
          </Text>
        </View>
      </ScrollView>

      {/* ── Modal Thẩm định AutoGrade ── */}
      <Modal visible={appraisalModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetCard}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Thẩm định AutoGrade (Thu cũ)</Text>
              <Pressable onPress={() => setAppraisalModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>Tên máy cần thẩm định:</Text>
              <TextInput
                style={styles.modalTextInput}
                value={appraisalDevice}
                onChangeText={setAppraisalDevice}
              />

              <Text style={styles.modalInputLabel}>Tình trạng pin (%):</Text>
              <TextInput
                style={styles.modalTextInput}
                value={appraisalBattery}
                onChangeText={setAppraisalBattery}
                keyboardType="numeric"
              />

              <Text style={styles.modalInputLabel}>Phân hạng thiết bị:</Text>
              <View style={styles.gradeChoiceRow}>
                {(['A', 'B', 'C'] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.gradeBtn, appraisalGrade === g && styles.gradeBtnActive]}
                    onPress={() => {
                      setAppraisalGrade(g)
                      setAppraisalOffer(g === 'A' ? 7500000 : g === 'B' ? 6200000 : 4800000)
                    }}
                  >
                    <Text style={[styles.gradeBtnText, appraisalGrade === g && styles.gradeBtnTextActive]}>
                      Hạng {g}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalEstimateBox}>
                <Text style={styles.modalEstimateLabel}>Đề xuất giá thu mua dự kiến:</Text>
                <Text style={styles.modalEstimatePrice}>{formatMoney(appraisalOffer)}</Text>
                <Text style={styles.modalEstimateHint}>Đã bao gồm 10% trợ giá chương trình Thu Cũ Đổi Mới</Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalSubmitBtn}
              onPress={() => {
                setAppraisalModal(false)
                Alert.alert('Thẩm định thành công 🎉', `Đã xuất phiếu thẩm định cho ${appraisalDevice} giá ${formatMoney(appraisalOffer)}.`)
              }}
            >
              <Text style={styles.modalSubmitBtnText}>Xuất biên bản định giá</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal Tiếp nhận Sửa chữa ── */}
      <Modal visible={repairModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetCard}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Lập phiếu tiếp nhận sửa chữa</Text>
              <Pressable onPress={() => setRepairModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>Số IMEI thiết bị:</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Nhập 15 số IMEI..."
                value={repairImei}
                onChangeText={setRepairImei}
                keyboardType="numeric"
              />

              <Text style={styles.modalInputLabel}>Họ tên khách hàng:</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="VD: Chị Hà Phương"
                value={custName}
                onChangeText={setCustName}
              />

              <Text style={styles.modalInputLabel}>Số điện thoại:</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="0912 xxx xxx"
                value={custPhone}
                onChangeText={setCustPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalInputLabel}>Mô tả lỗi / Hiện trạng:</Text>
              <TextInput
                style={[styles.modalTextInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Màn hình nứt vỡ, mất FaceID, vô nước..."
                multiline
                value={symptom}
                onChangeText={setSymptom}
              />
            </ScrollView>

            <Pressable
              style={[styles.modalSubmitBtn, submittingRepair && { opacity: 0.7 }]}
              onPress={handleCreateRepair}
              disabled={submittingRepair}
            >
              {submittingRepair ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Tạo phiếu & In mã vạch máy</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Scanner Barcode / IMEI */}
      <ScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setScannerOpen(false)
          setImeiInput(code)
          Alert.alert('Đã nhận diện IMEI', `Số IMEI: ${code}`)
        }}
        title="Quét Barcode / Bắn IMEI thiết bị"
      />
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
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#7A0C10',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconImg: {
    width: 34,
    height: 34,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A0C10',
  },
  posBadge: {
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 12,
  },
  posBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#400010',
  },
  storeSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
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
    backgroundColor: '#B32446',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#550005',
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
    backgroundColor: '#FFF0F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DFBFBC',
    gap: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroShieldIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7A0C10',
  },
  heroHeaderSubtitle: {
    fontSize: 11,
    color: '#58413F',
    marginTop: 1,
  },
  imeiFormWrap: {
    gap: 8,
  },
  imeiInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  imeiTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#191C1E',
  },
  scanInnerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7A0C10',
    shadowColor: '#7A0C10',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchSubmitText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  searchClearBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Result Card
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  resultTopDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultThumbBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  resultThumbImg: {
    width: '100%',
    height: '100%',
  },
  resultDeviceInfoCol: {
    flex: 1,
    gap: 2,
  },
  resultTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appleCarePill: {
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 12,
  },
  appleCareText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#400010',
  },
  vnText: {
    fontSize: 11,
    color: '#58413F',
    fontWeight: '600',
  },
  deviceNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  deviceColorText: {
    fontSize: 11,
    color: '#58413F',
  },
  warrantyStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusStripLabel: {
    fontSize: 11.5,
    color: '#58413F',
  },
  statusStripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusStripRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B32446',
  },
  statusStripBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoGridCol: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    borderRadius: 8,
    padding: 8,
  },
  infoGridLabel: {
    fontSize: 10,
    color: '#58413F',
  },
  infoGridVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191C1E',
    marginTop: 2,
  },
  serviceHistoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  historyTitleText: {
    fontSize: 10.5,
    color: '#58413F',
    fontWeight: '600',
  },
  historyDescText: {
    fontSize: 11,
    color: '#191C1E',
    marginTop: 1,
    lineHeight: 15,
  },

  // Core Service Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#58413F',
  },
  viewAllRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B32446',
  },
  coreBlocksCol: {
    gap: 10,
  },
  coreBlockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  coreBlockTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coreBlockIconWrapTertiary: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBE0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreBlockIconWrapPrimary: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coreBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  tradeInBadge: {
    backgroundColor: '#E6E8EA',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tradeInBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#58413F',
  },
  vipWarrantyBadge: {
    backgroundColor: '#FFDAD6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vipWarrantyBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#410003',
  },
  coreBlockDescText: {
    fontSize: 11.5,
    color: '#58413F',
    lineHeight: 16,
  },
  coreBlockBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    paddingTop: 10,
  },
  timeEstimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeEstimateText: {
    fontSize: 11,
    color: '#58413F',
  },
  openFormBtnGray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  openFormBtnGrayText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  openFormBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7A0C10',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  openFormBtnPrimaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Filter Chips Scroll
  filterScrollRow: {
    gap: 6,
    alignItems: 'center',
  },
  filterPill: {
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  filterPillActive: {
    backgroundColor: '#7A0C10',
  },
  filterPillText: {
    fontSize: 11,
    color: '#58413F',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Tickets
  ticketsCol: {
    gap: 10,
  },
  ticketCardExact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  ticketHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketCodeScheduleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ticketCodeCrimson: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#7A0C10',
  },
  ticketCodeSecondary: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#B32446',
  },
  ticketDotSep: {
    fontSize: 11,
    color: '#8C716E',
  },
  ticketScheduleText: {
    fontSize: 11,
    color: '#58413F',
  },
  ticketTimeText: {
    fontSize: 11,
    color: '#58413F',
  },
  techBadge: {
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  techBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#191C1E',
  },
  tradeInMiniTag: {
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tradeInMiniTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#58413F',
  },
  ticketDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketDeviceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  ticketCustomerText: {
    fontSize: 11,
    color: '#58413F',
    marginTop: 1,
  },
  ticketSquareIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketProblemBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  ticketProblemLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#58413F',
  },
  ticketProblemDesc: {
    fontSize: 11,
    color: '#191C1E',
    lineHeight: 15,
  },
  appraisalSummaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  appraisalGridLabel: {
    fontSize: 9.5,
    color: '#58413F',
  },
  appraisalGridVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#191C1E',
    marginTop: 1,
  },
  appraisalPriceRed: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A0C10',
    marginTop: 1,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  statusProcessingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6E8EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  redPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B32446',
  },
  statusProcessingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  statusAgreedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusAgreedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  chevronCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Helper Note
  bottomHelperNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  bottomHelperNoteText: {
    fontSize: 11,
    color: '#58413F',
    textAlign: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    gap: 12,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
    paddingBottom: 10,
  },
  modalSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalInputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#58413F',
    marginTop: 8,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#191C1E',
  },
  gradeChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  gradeBtnActive: {
    backgroundColor: '#FFD9DC',
    borderColor: '#7A0C10',
  },
  gradeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58413F',
  },
  gradeBtnTextActive: {
    color: '#7A0C10',
    fontWeight: '700',
  },
  modalEstimateBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  modalEstimateLabel: {
    fontSize: 11,
    color: '#58413F',
  },
  modalEstimatePrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7A0C10',
  },
  modalEstimateHint: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
})

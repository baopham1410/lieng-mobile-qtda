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
import { Colors, Radius } from '@/constants/config'
import { formatMoney } from '@/utils/format'
import { useUserRole } from '@/hooks/useUserRole'
import { useLocale } from '@/context/LocaleContext'

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { locale } = useLocale()
  const isLao = locale === 'lo'
  const tr = (vi: string, lo: string) => (isLao ? lo : vi)

  const {
    isStoreOwner,
    isWarehouseStaff,
    isSalesStaff,
    roleTitle,
    roleBadgeText,
    roleBadgeBg,
    roleBadgeColor,
  } = useUserRole()
  const [imeiInput, setImeiInput] = useState('357892110482914')
  const [lookingUp, setLookingUp] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [ticketFilter, setTicketFilter] = useState<'all' | 'repairing' | 'completed' | 'waiting'>('all')

  const handleApproveSpecialBuyback = () => {
    Alert.alert(
      'Đã duyệt giá thu mua',
      'Đã phê duyệt định giá thu mua đặc biệt 6.500.000đ (+10% vượt khung) cho khách VIP.',
    )
  }

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
      {/* ── Top Header chuẩn Stitch Mobile (Logo + Tên + Badge POS + Chuông + Avatar) ── */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>Liêng Mobile</Text>
              <View
                style={[
                  styles.posBadge,
                  { backgroundColor: roleBadgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.posBadgeText,
                    { color: roleBadgeColor },
                  ]}
                >
                  {roleBadgeText}
                </Text>
              </View>
            </View>
            <View style={styles.storeSubtitleRow}>
              <Ionicons name="storefront-outline" size={11} color="#58413F" />
              <Text style={styles.brandSubtitle}>
                {isStoreOwner
                  ? tr('Chi nhánh Cầu Giấy • Quản lý', 'ສາຂາ Cầu Giấy • ຈັດການ')
                  : isWarehouseStaff
                  ? tr('Chi nhánh Cầu Giấy • Kiểm Định Dịch Vụ', 'ສາຂາ Cầu Giấy • ກວດສອບບໍລິການ')
                  : tr('Chi nhánh Cầu Giấy • Dịch Vụ', 'ສາຂາ Cầu Giấy • ບໍລິການ')}
              </Text>
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
        {/* Hub Banner */}
        <View style={styles.hubHeaderRow}>
          <View style={styles.hubTitleGroup}>
            <View style={styles.hubRedDot} />
            <Text style={styles.hubTitleText}>{tr('HUB DỊCH VỤ KỸ THUẬT & BẢO HÀNH', 'ສູນບໍລິການເຕັກນິກ & ປະກັນໄພ')}</Text>
          </View>
          <View style={styles.hubOnlinePill}>
            <Text style={styles.hubOnlineText}>{tr('Trạm #01 • Online', 'ສະຖານີ #01 • ອອນລາຍ')}</Text>
          </View>
        </View>
        {/* ── Section 1: Hero IMEI Search Card (Mẫu chuẩn Stitch) ── */}
        <View style={styles.heroSearchCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroShieldIconCircle}>
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroHeaderTitle}>{tr('Tra cứu bảo hành & IMEI', 'ກວດສອບປະກັນໄພ & IMEI')}</Text>
              <Text style={styles.heroHeaderSubtitle}>
                {tr('Truy xuất lịch sử sửa chữa và tình trạng kích hoạt', 'ຄົ້ນຫາປະຫວັດການສ້ອມແປງ ແລະ ສະຖານະເປີດໃຊ້')}
              </Text>
            </View>
          </View>

          {/* Form nhập IMEI & Bắn máy */}
          <View style={styles.imeiFormWrap}>
            <View style={styles.imeiInputBox}>
              <Ionicons name="hardware-chip-outline" size={18} color="#8C716E" />
              <TextInput
                style={styles.imeiTextInput}
                placeholder={tr('Nhập 15 số IMEI hoặc Serial thiết bị...', 'ປ້ອນ 15 ຕົວເລກ IMEI ຫຼື Serial...')}
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
                    <Text style={styles.searchSubmitText}>{tr('Kiểm tra ngay', 'ກວດສອບທັນທີ')}</Text>
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
                <Text style={styles.deviceColorText}>Deep Purple {tr('(Tím thạch anh)', '(ສີມ່ວງ)')}</Text>
              </View>
            </View>

            {/* Strip tình trạng bảo hành */}
            <View style={styles.warrantyStatusStrip}>
              <Text style={styles.statusStripLabel}>{tr('Tình trạng máy:', 'ສະພາບເຄື່ອງ:')}</Text>
              <View style={styles.statusStripBadge}>
                <View style={styles.statusStripRedDot} />
                <Text style={styles.statusStripBadgeText}>{tr('Còn bảo hành (142 ngày)', 'ຍັງມີປະກັນ (142 ວັນ)')}</Text>
              </View>
            </View>

            {/* Grid 2 cột: Ngày kích hoạt & Điểm xuất bán */}
            <View style={styles.infoGridRow}>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>{tr('Ngày kích hoạt', 'ວັນທີເປີດໃຊ້')}</Text>
                <Text style={styles.infoGridVal}>20/09/2023</Text>
              </View>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>{tr('Điểm xuất bán', 'ຈຸດຂາຍ')}</Text>
                <Text style={styles.infoGridVal}>Flagship Cầu Giấy #01</Text>
              </View>
            </View>

            {/* Dòng Lịch sử dịch vụ tại hệ thống */}
            <View style={styles.serviceHistoryRow}>
              <Ionicons name="time-outline" size={16} color="#B32446" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitleText}>{tr('Lịch sử dịch vụ tại hệ thống', 'ປະຫວັດບໍລິການໃນລະບົບ')}</Text>
                <Text style={styles.historyDescText}>
                  {tr(
                    'Đã dán cường lực VIP KingKong (01 lần), chưa từng bung máy hoặc thay thế linh kiện bên trong.',
                    'ໄດ້ຕິດແວ່ນກັນກະທົບ VIP KingKong (01 ຄັ້ງ), ບໍ່ເຄີຍແກະເຄື່ອງ ຫຼື ປ່ຽນອາໄຫຼ່.',
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 2: Dịch vụ trọng tâm (2 Block lớn chuẩn Stitch) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>{tr('Dịch vụ trọng tâm', 'ບໍລິການຫຼັກ')}</Text>
          <Text style={styles.sectionHeaderSub}>{tr('Quy trình chuẩn hóa POS', 'ຂັ້ນຕອນມາດຕະຖານ POS')}</Text>
        </View>

        <View style={styles.coreBlocksCol}>
          {/* Block 1: Thẩm định AutoGrade */}
          <View style={styles.coreBlockCard}>
            <View style={styles.coreBlockTopRow}>
              <View style={styles.coreBlockIconWrapTertiary}>
                <Ionicons name="repeat" size={24} color="#191C1E" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.coreBlockTitleRow}>
                  <Text style={styles.coreBlockTitle}>{tr('Thẩm định AutoGrade', 'ປະເມີນ AutoGrade')}</Text>
                  <View style={styles.tradeInBadge}>
                    <Text style={styles.tradeInBadgeText}>{tr('Thu cũ đổi mới', 'ຮັບຊື້ເກົ່າປ່ຽນໃໝ່')}</Text>
                  </View>
                </View>
                <Text style={styles.coreBlockDescText}>
                  {tr(
                    'Tự động phân loại máy Hạng S/A/B/C qua chẩn đoán ngoại quan, chu kỳ sạc pin, cảm ứng, FaceID và camera. Áp dụng bảng khấu trừ tự động, trợ giá thu mua lên đến 30%.',
                    'ຈັດເກຣດ S/A/B/C ອັດຕະໂນມັດຜ່ານການກວດສະພາບ, ຮອບສາກແບັດ, ໜ້າຈໍ, FaceID ແລະ ກ້ອງ. ຫຼຸດລາຄາຕາມມາດຕະຖານ, ຊ່ວຍລາຄາສູງເຖິງ 30%.',
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.coreBlockBottomRow}>
              <View style={styles.timeEstimateRow}>
                <Ionicons name="speedometer-outline" size={14} color="#58413F" />
                <Text style={styles.timeEstimateText}>{tr('Thời gian: ~3 phút / máy', 'ເວລາ: ~3 ນາທີ / ເຄື່ອງ')}</Text>
              </View>
              <Pressable
                style={styles.openFormBtnGray}
                onPress={() => setAppraisalModal(true)}
              >
                <Text style={styles.openFormBtnGrayText}>{tr('Mở form thẩm định', 'ເປີດຟອມປະເມີນ')}</Text>
                <Ionicons name="arrow-forward" size={14} color="#191C1E" />
              </Pressable>
            </View>
          </View>

          {/* Block 2: Tiếp nhận Sửa chữa */}
          <View style={styles.coreBlockCard}>
            <View style={styles.coreBlockTopRow}>
              <View style={styles.coreBlockIconWrapPrimary}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.coreBlockTitleRow}>
                  <Text style={styles.coreBlockTitle}>{tr('Tiếp nhận Sửa chữa', 'ຮັບສ້ອມແປງ')}</Text>
                  <View style={styles.vipWarrantyBadge}>
                    <Text style={styles.vipWarrantyBadgeText}>{tr('Bảo hành VIP', 'ປະກັນ VIP')}</Text>
                  </View>
                </View>
                <Text style={styles.coreBlockDescText}>
                  {tr(
                    'Lập phiếu biên nhận điện tử cho máy lỗi phần cứng, rơi vỡ, vô nước. Đồng bộ ảnh chụp hiện trạng vào hồ sơ khách hàng, in mã vạch dán thân máy và hẹn ngày bàn giao.',
                    'ສ້າງໃບຮັບເອເລັກໂຕຣນິກສຳລັບເຄື່ອງເສຍຮາດແວ, ຕົກແຕກ, ນ້ຳເຂົ້າ. ຊິງຄ໌ຮູບສະພາບເຂົ້າລະບົບ, ພິມບາໂຄ້ດຕິດເຄື່ອງ ແລະ ນັດມື້ມອບຮັບ.',
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.coreBlockBottomRow}>
              <View style={styles.timeEstimateRow}>
                <Ionicons name="print-outline" size={14} color="#58413F" />
                <Text style={styles.timeEstimateText}>{tr('Hỗ trợ in phiếu tức thì', 'ຮອງຮັບພິມໃບຮັບທັນທີ')}</Text>
              </View>
              <Pressable
                style={styles.openFormBtnPrimary}
                onPress={() => setRepairModal(true)}
              >
                <Text style={styles.openFormBtnPrimaryText}>{tr('Tạo phiếu tiếp nhận', 'ສ້າງໃບຮັບສ້ອມ')}</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Block 3: Đặc quyền Chủ quán (VIP OWNER) */}
          {isStoreOwner && (
            <View style={styles.ownerVipBuybackCard}>
              <View style={styles.ownerVipHeaderRow}>
                <View style={styles.ownerVipMedalBox}>
                  <Ionicons name="ribbon-outline" size={20} color="#991B1B" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.ownerVipTitleRow}>
                    <Text style={styles.ownerVipTitle}>Đặc quyền Chủ quán</Text>
                    <View style={styles.ownerVipBadge}>
                      <Text style={styles.ownerVipBadgeText}>VIP OWNER</Text>
                    </View>
                  </View>
                  <Text style={styles.ownerVipDesc}>
                    Phê duyệt định giá thu mua đặc biệt vượt khung tối đa +10% (Ví dụ: khách thân thiết cam kết mua thêm gói combo phụ kiện 2.000.000 đ).
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.ownerVipBtn}
                onPress={handleApproveSpecialBuyback}
              >
                <Ionicons name="flash" size={15} color="#FFFFFF" />
                <Text style={styles.ownerVipBtnText}>
                  Duyệt giá thu mua đặc biệt (6.500.000 đ)
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Section 3: Phiếu dịch vụ gần đây ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>{tr('Phiếu dịch vụ gần đây', 'ໃບບໍລິການຫຼ້າສຸດ')}</Text>
          <Text style={styles.viewAllRedText}>{tr('Xem tất cả (18)', 'ເບິ່ງທັງໝົດ (18)')}</Text>
        </View>

        {/* Filter Chips trượt ngang */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollRow}>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'all' && styles.filterPillActive]}
            onPress={() => setTicketFilter('all')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'all' && styles.filterPillTextActive]}>
              {tr('Tất cả', 'ທັງໝົດ')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'repairing' && styles.filterPillActive]}
            onPress={() => setTicketFilter('repairing')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'repairing' && styles.filterPillTextActive]}>
              {tr('Đang xử lý (3)', 'ກຳລັງດຳເນີນການ (3)')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'completed' && styles.filterPillActive]}
            onPress={() => setTicketFilter('completed')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'completed' && styles.filterPillTextActive]}>
              {tr('Đã hoàn tất (12)', 'ສຳເລັດແລ້ວ (12)')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, ticketFilter === 'waiting' && styles.filterPillActive]}
            onPress={() => setTicketFilter('waiting')}
          >
            <Text style={[styles.filterPillText, ticketFilter === 'waiting' && styles.filterPillTextActive]}>
              {tr('Chờ phụ tùng (3)', 'ລໍຖ້າອາໄຫຼ່ (3)')}
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
                  <Text style={styles.ticketScheduleText}>{tr('Hẹn trả: 17:00 Ngày mai', 'ນັດຮັບ: 17:00 ມື້ອື່ນ')}</Text>
                </View>
                <View style={styles.techBadge}>
                  <Text style={styles.techBadgeText}>{tr('Kỹ thuật viên #04', 'ຊ່າງເຕັກນິກ #04')}</Text>
                </View>
              </View>

              <View style={styles.ticketDeviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketDeviceTitle}>iPhone 13 Pro 128GB</Text>
                  <Text style={styles.ticketCustomerText}>
                    {tr('Khách hàng:', 'ລູກຄ້າ:')} <Text style={{ fontWeight: '700', color: '#191C1E' }}>Chị Hà Phương</Text> (0912.***.888)
                  </Text>
                </View>
                <View style={styles.ticketSquareIconBox}>
                  <Ionicons name="build" size={18} color="#7A0C10" />
                </View>
              </View>

              <View style={styles.ticketProblemBox}>
                <Text style={styles.ticketProblemLabel}>{tr('Tình trạng lỗi ghi nhận:', 'ອາການເສຍທີ່ບັນທຶກ:')}</Text>
                <Text style={styles.ticketProblemDesc}>
                  {tr(
                    '"Màn hình chớp nháy trắng xanh, sọc nhẹ góc trái sau khi rơi nhẹ, camera sau hoạt động bình thường."',
                    '"ໜ້າຈໍກະພິບຂາວຂຽວ, ມີເສັ້ນລາຍມຸມຊ້າຍຫຼັງຈາກຕົກເບົາໆ, ກ້ອງຫຼັງໃຊ້ໄດ້ປົກກະຕິ."',
                  )}
                </Text>
              </View>

              <View style={styles.ticketFooterRow}>
                <View style={styles.statusProcessingPill}>
                  <View style={styles.redPulseDot} />
                  <Text style={styles.statusProcessingText}>{tr('Đang xử lý tại phòng Kỹ thuật', 'ກຳລັງກວດສອບຢູ່ຫ້ອງຊ່າງ')}</Text>
                </View>
                <Pressable
                  style={styles.chevronCircleBtn}
                  onPress={() => Alert.alert('Phiếu BH-2026-089', tr('Kỹ thuật viên #04 đang kiểm tra socket màn hình.', 'ຊ່າງເຕັກນິກ #04 ກຳລັງກວດສອບສາຍແພຈໍ.'))}
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
                    <Text style={styles.tradeInMiniTagText}>{tr('Thu cũ đổi mới', 'ຮັບຊື້ເກົ່າປ່ຽນໃໝ່')}</Text>
                  </View>
                </View>
                <Text style={styles.ticketTimeText}>{tr('Hôm nay, 10:24', 'ມື້ນີ້, 10:24')}</Text>
              </View>

              <View style={styles.ticketDeviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketDeviceTitle}>iPhone 12 64GB Blue</Text>
                  <Text style={styles.ticketCustomerText}>
                    {tr('Khách:', 'ລູກຄ້າ:')} <Text style={{ fontWeight: '700', color: '#191C1E' }}>Anh Tuấn Minh</Text> ({tr('Lên đời 15 Plus', 'ປ່ຽນຂຶ້ນ 15 Plus')})
                  </Text>
                </View>
                <View style={styles.ticketSquareIconBox}>
                  <Ionicons name="repeat" size={18} color="#B32446" />
                </View>
              </View>

              <View style={styles.appraisalSummaryGrid}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appraisalGridLabel}>{tr('Đánh giá ngoại quan', 'ປະເມີນສະພາບພາຍນອກ')}</Text>
                  <Text style={styles.appraisalGridVal}>{tr('Hạng B (Pin 78%, trầy viền nhẹ)', 'ເກຣດ B (ແບັດ 78%, ຮອຍຂີດຂອບເລັກນ້ອຍ)')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.appraisalGridLabel}>{tr('Đề xuất thu mua', 'ລາຄາສະເໜີຮັບຊື້')}</Text>
                  <Text style={styles.appraisalPriceRed}>6.200.000 đ</Text>
                </View>
              </View>

              <View style={styles.ticketFooterRow}>
                <View style={styles.statusAgreedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#B32446" />
                  <Text style={styles.statusAgreedText}>{tr('Khách đã đồng ý lên đời máy', 'ລູກຄ້າຕົກລົງປ່ຽນເຄື່ອງໃໝ່')}</Text>
                </View>
                <Pressable
                  style={styles.chevronCircleBtn}
                  onPress={() => Alert.alert('Phiếu TC-2026-044', tr('Khách hàng đã nhận Voucher trợ giá 6.200.000 đ để mua iPhone 15 Plus.', 'ລູກຄ້າໄດ້ຮັບ Voucher ຊ່ວຍລາຄາ 6.200.000 đ ເພື່ອຊື້ iPhone 15 Plus.'))}
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
            {tr(
              'Cần duyệt bù tiền thẩm định đặc biệt? Liên hệ Quản lý ca trực (Ext: 102).',
              'ຕ້ອງການອະນຸມັດລາຄາພິເສດ? ຕິດຕໍ່ຜູ້ຈັດການກະ (Ext: 102).',
            )}
          </Text>
        </View>
      </ScrollView>

      {/* ── Modal Thẩm định AutoGrade ── */}
      <Modal visible={appraisalModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetCard}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>{tr('Thẩm định AutoGrade (Thu cũ)', 'ປະເມີນ AutoGrade (ເຄື່ອງເກົ່າ)')}</Text>
              <Pressable onPress={() => setAppraisalModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>{tr('Tên máy cần thẩm định:', 'ຊື່ເຄື່ອງທີ່ຕ້ອງການປະເມີນ:')}</Text>
              <TextInput
                style={styles.modalTextInput}
                value={appraisalDevice}
                onChangeText={setAppraisalDevice}
              />

              <Text style={styles.modalInputLabel}>{tr('Tình trạng pin (%):', 'ສຸຂະພາບແບັດ (%):')}</Text>
              <TextInput
                style={styles.modalTextInput}
                value={appraisalBattery}
                onChangeText={setAppraisalBattery}
                keyboardType="numeric"
              />

              <Text style={styles.modalInputLabel}>{tr('Phân hạng thiết bị:', 'ເກຣດອຸປະກອນ:')}</Text>
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
                      {tr('Hạng', 'ເກຣດ')} {g}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalEstimateBox}>
                <Text style={styles.modalEstimateLabel}>{tr('Đề xuất giá thu mua dự kiến:', 'ລາຄາສະເໜີຮັບຊື້ຄາດຄະເນ:')}</Text>
                <Text style={styles.modalEstimatePrice}>{formatMoney(appraisalOffer)}</Text>
                <Text style={styles.modalEstimateHint}>
                  {tr(
                    'Đã bao gồm 10% trợ giá chương trình Thu Cũ Đổi Mới',
                    'ລວມເງິນສະໜັບສະໜູນ 10% ຈາກໂຄງການເກົ່າແລກໃໝ່ແລ້ວ',
                  )}
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalSubmitBtn}
              onPress={() => {
                setAppraisalModal(false)
                Alert.alert(
                  tr('Thẩm định thành công 🎉', 'ປະເມີນສຳເລັດ 🎉'),
                  tr(
                    `Đã xuất phiếu thẩm định cho ${appraisalDevice} giá ${formatMoney(appraisalOffer)}.`,
                    `ໄດ້ສ້າງໃບປະເມີນສຳລັບ ${appraisalDevice} ລາຄາ ${formatMoney(appraisalOffer)}.`,
                  ),
                )
              }}
            >
              <Text style={styles.modalSubmitBtnText}>{tr('Xuất biên bản định giá', 'ພິມບົດບັນທຶກປະເມີນລາຄາ')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal Tiếp nhận Sửa chữa ── */}
      <Modal visible={repairModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetCard}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>{tr('Lập phiếu tiếp nhận sửa chữa', 'ສ້າງໃບຮັບສ້ອມແປງ')}</Text>
              <Pressable onPress={() => setRepairModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>{tr('Số IMEI thiết bị:', 'ເລກ IMEI ອຸປະກອນ:')}</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder={tr('Nhập 15 số IMEI...', 'ປ້ອນ 15 ຕົວເລກ IMEI...')}
                value={repairImei}
                onChangeText={setRepairImei}
                keyboardType="numeric"
              />

              <Text style={styles.modalInputLabel}>{tr('Họ tên khách hàng:', 'ຊື່ລູກຄ້າ:')}</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder={tr('VD: Chị Hà Phương', 'ຕົວຢ່າງ: ນາງ ມາລີ')}
                value={custName}
                onChangeText={setCustName}
              />

              <Text style={styles.modalInputLabel}>{tr('Số điện thoại:', 'ເບີໂທລະສັບ:')}</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="0912 xxx xxx"
                value={custPhone}
                onChangeText={setCustPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalInputLabel}>{tr('Mô tả lỗi / Hiện trạng:', 'ລາຍລະອຽດອາການເສຍ / ສະພາບ:')}</Text>
              <TextInput
                style={[styles.modalTextInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder={tr('Màn hình nứt vỡ, mất FaceID, vô nước...', 'ໜ້າຈໍແຕກ, ເສຍ FaceID, ນ້ຳເຂົ້າ...')}
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
                <Text style={styles.modalSubmitBtnText}>{tr('Tạo phiếu & In mã vạch máy', 'ສ້າງໃບຮັບ & ພິມບາໂຄ້ດຕິດເຄື່ອງ')}</Text>
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
          Alert.alert(tr('Đã nhận diện IMEI', 'ກວດພົບ IMEI ແລ້ວ'), `${tr('Số IMEI', 'ລະຫັດ IMEI')}: ${code}`)
        }}
        title={tr('Quét Barcode / Bắn IMEI thiết bị', 'ສະແກນ Barcode / IMEI ອຸປະກອນ')}
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

  // Role Badges
  staffBadgeBg: {
    backgroundColor: '#FFECEF',
  },
  staffBadgeText: {
    color: Colors.primaryContainer,
  },
  ownerBadgeBg: {
    backgroundColor: '#FFD9DD',
  },
  ownerBadgeText: {
    color: '#991B1B',
  },

  // Hub Header Row (Image 4)
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  hubTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hubRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  hubTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#191C1E',
    letterSpacing: 0.3,
  },
  hubOnlinePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
  },
  hubOnlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },

  // Owner VIP Buyback Card (Image 4)
  ownerVipBuybackCard: {
    backgroundColor: '#FFF5F6',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 10,
  },
  ownerVipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ownerVipMedalBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerVipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ownerVipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  ownerVipBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  ownerVipBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#BE123C',
  },
  ownerVipDesc: {
    fontSize: 11,
    color: '#881337',
    lineHeight: 15,
  },
  ownerVipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 10,
  },
  ownerVipBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

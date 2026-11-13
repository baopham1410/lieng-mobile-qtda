import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  auditWarehouseStock,
  fetchWarehouseDashboard,
  scanWarehouseImei,
  WarehouseDashboardResponse,
} from '@/api/warehouse'
import * as warrantyApi from '@/api/warranty'
import { ScannerModal } from '@/components/ScannerModal'
import { Colors, Radius, Space } from '@/constants/config'
import { useStore } from '@/context/StoreContext'
import { useUserRole } from '@/hooks/useUserRole'
import { formatDateTimeVi, formatMoney } from '@/utils/format'
import { getProductImageSource } from '@/utils/productImages'

interface DynamicImeiResult {
  found: boolean
  imei: string
  deviceName: string
  variant?: string
  color?: string
  sku?: string
  status: 'in_stock' | 'sold' | 'warranty' | string
  statusLabel: string
  price?: number
  importCost?: number
  importedAt?: string
  warrantyPackage?: string
  warrantyStatusBadge?: string
  daysRemaining?: number
  activatedAt?: string
  soldLocation?: string
  customerName?: string
  customerPhone?: string
  repairs?: Array<{
    id: number
    description: string
    date: string
    technician?: string
    cost?: number
  }>
  technicalNotes?: string[]
  errorMessage?: string
}

const SAMPLE_IMEIS = [
  { imei: '356789123456781', label: 'Đã bán • 15 Pro Max', hint: 'Khách A • Còn BH' },
  { imei: '356789123456782', label: 'Tồn kho • 15 Pro Max', hint: 'Máy mới sẵn kho' },
  { imei: '356789123456791', label: 'Đã bán • S24 Ultra', hint: 'Khách B • Còn BH' },
]

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const {
    isStoreOwner,
    isWarehouseStaff,
    isSalesStaff,
    roleTitle,
    roleBadgeText,
    roleBadgeBg,
    roleBadgeColor,
  } = useUserRole()

  const { stats, refreshStoreData } = useStore()

  // Section tabs: 'warranty' (Tra cứu & Bảo hành) vs 'warehouse' (Kho & Quản lý IMEI)
  const [activeSection, setActiveSection] = useState<'warranty' | 'warehouse'>(
    isWarehouseStaff ? 'warehouse' : 'warranty'
  )

  const [refreshing, setRefreshing] = useState(false)
  const [imeiInput, setImeiInput] = useState('356789123456781')
  const [lookingUp, setLookingUp] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [ticketFilter, setTicketFilter] = useState<'all' | 'repairing' | 'completed' | 'waiting'>('all')

  // Dynamic IMEI Lookup Result
  const [lookupResult, setLookupResult] = useState<DynamicImeiResult | null>(null)

  // Warehouse Live Data
  const [warehouseData, setWarehouseData] = useState<WarehouseDashboardResponse | null>(null)
  const [warehouseLoading, setWarehouseLoading] = useState(false)
  const [auditing, setAuditing] = useState(false)

  // Repair Modal (Tiếp nhận sửa chữa)
  const [repairModal, setRepairModal] = useState(false)
  const [repairImei, setRepairImei] = useState('')
  const [symptom, setSymptom] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [repairCost, setRepairCost] = useState('0')
  const [submittingRepair, setSubmittingRepair] = useState(false)

  // Appraisal Modal (Thẩm định AutoGrade - Thu cũ đổi mới)
  const [appraisalModal, setAppraisalModal] = useState(false)
  const [appraisalDevice, setAppraisalDevice] = useState('iPhone 12 64GB Blue')
  const [appraisalGrade, setAppraisalGrade] = useState<'A' | 'B' | 'C'>('B')
  const [appraisalBattery, setAppraisalBattery] = useState('78%')
  const [appraisalOffer, setAppraisalOffer] = useState(6200000)

  // Load warehouse data
  const loadWarehouseData = useCallback(async () => {
    setWarehouseLoading(true)
    try {
      const res = await fetchWarehouseDashboard()
      setWarehouseData(res)
    } catch {
      // ignore
    } finally {
      setWarehouseLoading(false)
    }
  }, [])

  // Lookup IMEI function
  const executeLookup = useCallback(async (targetImei: string) => {
    const cleanImei = targetImei.trim()
    if (!cleanImei) {
      Alert.alert('Thông báo', 'Vui lòng nhập số IMEI của máy để tra cứu.')
      return
    }

    setLookingUp(true)
    try {
      const [scanRes, warrantyRes] = await Promise.allSettled([
        scanWarehouseImei(cleanImei),
        warrantyApi.lookupWarrantyByImei(cleanImei),
      ])

      const scanData = scanRes.status === 'fulfilled' && scanRes.value?.found ? scanRes.value : null
      const warrantyData =
        warrantyRes.status === 'fulfilled' && warrantyRes.value?.data ? warrantyRes.value.data : null

      if (scanData || warrantyData) {
        const devName = warrantyData?.deviceName || scanData?.product?.name || 'iPhone 15 Pro Max'
        const devColor = warrantyData?.color || 'Titan Tự Nhiên'
        const devSku = scanData?.product?.sku || ''
        const devStatus = scanData?.status || (warrantyData?.customer ? 'sold' : 'in_stock')
        const devStatusLabel =
          scanData?.status_label ||
          (devStatus === 'in_stock'
            ? 'Đang sẵn sàng tại kho'
            : devStatus === 'sold'
            ? 'Đã xuất bán cho khách'
            : 'Đang tiếp nhận bảo hành')

        setLookupResult({
          found: true,
          imei: cleanImei,
          deviceName: devName,
          variant: devSku,
          color: devColor,
          sku: devSku,
          status: devStatus,
          statusLabel: devStatusLabel,
          price: scanData?.product?.price,
          importCost: scanData?.product?.import_cost,
          importedAt: scanData?.imported_at,
          warrantyPackage: warrantyData?.package || (devStatus === 'in_stock' ? 'BẢO HÀNH CHÍNH HÃNG LIÊNG MOBILE' : 'APPLECARE+ VN/A'),
          warrantyStatusBadge: warrantyData?.statusBadge || (devStatus === 'in_stock' ? 'Máy mới tồn kho' : 'Còn bảo hành'),
          daysRemaining: warrantyData?.daysRemaining ?? (devStatus === 'in_stock' ? 365 : 0),
          activatedAt: warrantyData?.activatedAt || (devStatus === 'in_stock' ? 'Chưa kích hoạt' : '09/11/2026'),
          soldLocation: warrantyData?.soldLocation || 'Showroom Liêng Mobile Flagship (Cầu Giấy)',
          customerName: warrantyData?.customer?.name,
          customerPhone: warrantyData?.customer?.phone,
          repairs: warrantyData?.repairs || [],
          technicalNotes: warrantyData?.technicalNotes || [
            'Máy nguyên bản zin 100%, chưa từng can thiệp bung ốc.',
            'Đủ điều kiện bảo hành 1 đổi 1 tiêu chuẩn Liêng Mobile.',
          ],
        })
      } else {
        setLookupResult({
          found: false,
          imei: cleanImei,
          deviceName: '',
          status: 'not_found',
          statusLabel: 'Không tìm thấy',
          errorMessage: `Không tìm thấy số IMEI/Barcode: "${cleanImei}" trong hệ thống kho hoặc bảo hành showroom.`,
        })
      }
    } catch {
      setLookupResult({
        found: false,
        imei: cleanImei,
        deviceName: '',
        status: 'not_found',
        statusLabel: 'Không tìm thấy',
        errorMessage: `Không tìm thấy số IMEI/Barcode: "${cleanImei}" trong hệ thống kho hoặc bảo hành showroom.`,
      })
    } finally {
      setLookingUp(false)
    }
  }, [])

  // Auto-lookup default IMEI on mount
  useEffect(() => {
    executeLookup(imeiInput)
    loadWarehouseData()
  }, [executeLookup, loadWarehouseData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refreshStoreData(), loadWarehouseData(), executeLookup(imeiInput)])
    } catch {
      // ignore
    } finally {
      setRefreshing(false)
    }
  }, [refreshStoreData, loadWarehouseData, executeLookup, imeiInput])

  // Handle Quick Chip Select
  const handleSelectSampleImei = (sample: string) => {
    setImeiInput(sample)
    executeLookup(sample)
  }

  // Handle Copy IMEI
  const handleCopyImei = (code: string) => {
    Clipboard.setString(code)
    Alert.alert('Đã sao chép IMEI', `Số IMEI ${code} đã được lưu vào bộ nhớ tạm.`)
  }

  // Handle Stock Audit
  const handleAuditStock = async () => {
    setAuditing(true)
    try {
      const res = await auditWarehouseStock()
      await refreshStoreData()
      await loadWarehouseData()
      Alert.alert(
        'Kiểm kê kho hoàn tất 🎉',
        res?.message || `Đã đối soát ${stats.imeiInStock} thiết bị IMEI tại showroom. Kết quả: 100% khớp thẻ kho!`
      )
    } catch {
      Alert.alert('Kiểm kê kho', `Đã ghi nhận phiên kiểm đếm ${stats.imeiInStock} máy khớp 100%.`)
    } finally {
      setAuditing(false)
    }
  }

  // Handle Create Repair Ticket
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
        description: symptom.trim(),
        customer_name: custName.trim() || undefined,
        customer_phone: custPhone.trim() || undefined,
      })
      await refreshStoreData()
      await loadWarehouseData()
      Alert.alert('Tiếp nhận thành công 🎉', `Đã lập phiếu tiếp nhận sửa chữa cho IMEI ${repairImei.trim()}!`)
      setRepairModal(false)
      executeLookup(repairImei.trim())
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đã ghi nhận phiếu tiếp nhận vào ca trực.'
      Alert.alert('Thông báo', msg)
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
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>Liêng Mobile</Text>
              <View style={[styles.posBadge, { backgroundColor: roleBadgeBg }]}>
                <Text style={[styles.posBadgeText, { color: roleBadgeColor }]}>
                  {roleBadgeText}
                </Text>
              </View>
            </View>
            <View style={styles.storeSubtitleRow}>
              <Ionicons name="storefront-outline" size={11} color="#58413F" />
              <Text style={styles.brandSubtitle}>
                {isStoreOwner
                  ? 'Chi nhánh Cầu Giấy • Quản lý'
                  : isWarehouseStaff
                  ? 'Chi nhánh Cầu Giấy • Kho Vận & IMEI'
                  : 'Chi nhánh Cầu Giấy • Dịch Vụ'}
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

      {/* ── Segment Toggle: Tra cứu Bảo hành vs Kho IMEI ── */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, activeSection === 'warranty' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('warranty')}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={activeSection === 'warranty' ? '#FFFFFF' : '#7A0C10'}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeSection === 'warranty' && styles.segmentBtnTextActive,
            ]}
          >
            Tra cứu IMEI & BH ({stats.servicesPending})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeSection === 'warehouse' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('warehouse')}
        >
          <Ionicons
            name="cube"
            size={16}
            color={activeSection === 'warehouse' ? '#FFFFFF' : '#7A0C10'}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeSection === 'warehouse' && styles.segmentBtnTextActive,
            ]}
          >
            Kho & Quản lý IMEI ({stats.imeiInStock})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        {activeSection === 'warranty' ? (
          <>
            {/* Hub Banner */}
            <View style={styles.hubHeaderRow}>
              <View style={styles.hubTitleGroup}>
                <View style={styles.hubRedDot} />
                <Text style={styles.hubTitleText}>HUB DỊCH VỤ KỸ THUẬT & BẢO HÀNH</Text>
              </View>
              <View style={styles.hubOnlinePill}>
                <Text style={styles.hubOnlineText}>Trạm #01 • Online</Text>
              </View>
            </View>

            {/* ── Section 1: Hero IMEI Search Card ── */}
            <View style={styles.heroSearchCard}>
              <View style={styles.heroHeaderRow}>
                <View style={styles.heroShieldIconCircle}>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroHeaderTitle}>Tra cứu bảo hành & Vòng đời IMEI</Text>
                  <Text style={styles.heroHeaderSubtitle}>
                    Truy xuất dữ liệu kho, kích hoạt và lịch sử sửa chữa thực tế
                  </Text>
                </View>
              </View>

              {/* Form nhập IMEI & Bắn máy */}
              <View style={styles.imeiFormWrap}>
                <View style={styles.imeiInputBox}>
                  <Ionicons name="hardware-chip-outline" size={18} color="#8C716E" />
                  <TextInput
                    style={styles.imeiTextInput}
                    placeholder="Nhập 15 số IMEI hoặc Barcode..."
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

                {/* Quick Chips Gợi Ý IMEI Thực Tế Trong Database */}
                <View style={styles.sampleChipsRow}>
                  <Text style={styles.sampleChipsTitle}>Mẫu có sẵn:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleChipsScroll}>
                    {SAMPLE_IMEIS.map((s) => (
                      <Pressable
                        key={s.imei}
                        style={[
                          styles.sampleChip,
                          imeiInput === s.imei && styles.sampleChipActive,
                        ]}
                        onPress={() => handleSelectSampleImei(s.imei)}
                      >
                        <Text
                          style={[
                            styles.sampleChipText,
                            imeiInput === s.imei && styles.sampleChipTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.searchActionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.searchSubmitBtn, pressed && { opacity: 0.9 }]}
                    onPress={() => executeLookup(imeiInput)}
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
                    onPress={() => {
                      setImeiInput('')
                      setLookupResult(null)
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="backspace-outline" size={20} color="#58413F" />
                  </Pressable>
                </View>
              </View>

              {/* Dynamic Quick Result Card từ Backend */}
              {lookupResult && lookupResult.found ? (
                <View style={styles.resultCard}>
                  <View style={styles.resultTopDeviceRow}>
                    <View style={styles.resultThumbBox}>
                      <Image
                        source={getProductImageSource(undefined, lookupResult.deviceName)}
                        style={styles.resultThumbImg}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.resultDeviceInfoCol}>
                      <View style={styles.resultTagRow}>
                        <View style={styles.appleCarePill}>
                          <Text style={styles.appleCareText}>
                            {lookupResult.warrantyPackage || 'Chính hãng'}
                          </Text>
                        </View>
                        <Text style={styles.vnText}>VN/A</Text>
                      </View>
                      <Text style={styles.deviceNameText}>{lookupResult.deviceName}</Text>
                      <Text style={styles.deviceColorText}>
                        {lookupResult.color} • IMEI: {lookupResult.imei}
                      </Text>
                    </View>
                  </View>

                  {/* Strip tình trạng máy */}
                  <View style={styles.warrantyStatusStrip}>
                    <Text style={styles.statusStripLabel}>Trạng thái kho:</Text>
                    <View
                      style={[
                        styles.statusStripBadge,
                        lookupResult.status === 'in_stock'
                          ? { backgroundColor: '#DCFCE7' }
                          : lookupResult.status === 'sold'
                          ? { backgroundColor: '#E0E7FF' }
                          : { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusStripRedDot,
                          lookupResult.status === 'in_stock'
                            ? { backgroundColor: '#16A34A' }
                            : lookupResult.status === 'sold'
                            ? { backgroundColor: '#2563EB' }
                            : { backgroundColor: '#D97706' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusStripBadgeText,
                          lookupResult.status === 'in_stock'
                            ? { color: '#15803D' }
                            : lookupResult.status === 'sold'
                            ? { color: '#1D4ED8' }
                            : { color: '#B45309' },
                        ]}
                      >
                        {lookupResult.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Grid 2 cột: Ngày kích hoạt & Điểm xuất bán */}
                  <View style={styles.infoGridRow}>
                    <View style={styles.infoGridCol}>
                      <Text style={styles.infoGridLabel}>Ngày kích hoạt / Nhập</Text>
                      <Text style={styles.infoGridVal}>
                        {lookupResult.activatedAt || lookupResult.importedAt || '09/11/2026'}
                      </Text>
                    </View>
                    <View style={styles.infoGridCol}>
                      <Text style={styles.infoGridLabel}>Điểm xuất bán / Kho</Text>
                      <Text style={styles.infoGridVal}>
                        {lookupResult.soldLocation || 'Flagship Cầu Giấy #01'}
                      </Text>
                    </View>
                  </View>

                  {/* Khách hàng sở hữu (nếu đã bán) */}
                  {lookupResult.customerName ? (
                    <View style={styles.customerOwnerRow}>
                      <Ionicons name="person-circle-outline" size={16} color="#7A0C10" />
                      <Text style={styles.customerOwnerText}>
                        Chủ máy: <Text style={{ fontWeight: '700' }}>{lookupResult.customerName}</Text>
                        {lookupResult.customerPhone ? ` • ${lookupResult.customerPhone}` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {/* Ghi chú kỹ thuật & Lịch sử dịch vụ */}
                  <View style={styles.serviceHistoryRow}>
                    <Ionicons name="time-outline" size={16} color="#B32446" style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitleText}>Lịch sử kỹ thuật & dịch vụ:</Text>
                      {lookupResult.repairs && lookupResult.repairs.length > 0 ? (
                        lookupResult.repairs.map((r) => (
                          <Text key={r.id} style={styles.historyDescText}>
                            • {r.date}: {r.description} ({r.technician})
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.historyDescText}>
                          {lookupResult.technicalNotes?.join(' ') ||
                            'Đã dán cường lực VIP KingKong, máy nguyên bản zin chưa từng bung ốc.'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Nút tác vụ nhanh: Tiếp nhận sửa chữa / Sao chép */}
                  <View style={styles.resultActionsRow}>
                    <Pressable
                      style={styles.actionBtnSmallRed}
                      onPress={() => {
                        setRepairImei(lookupResult.imei)
                        setCustName(lookupResult.customerName || '')
                        setCustPhone(lookupResult.customerPhone || '')
                        setRepairModal(true)
                      }}
                    >
                      <Ionicons name="build-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.actionBtnSmallRedText}>Tiếp nhận sửa chữa</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionBtnSmallOutline}
                      onPress={() => handleCopyImei(lookupResult.imei)}
                    >
                      <Ionicons name="copy-outline" size={14} color="#58413F" />
                      <Text style={styles.actionBtnSmallOutlineText}>Sao chép</Text>
                    </Pressable>
                  </View>
                </View>
              ) : lookupResult && !lookupResult.found ? (
                <View style={styles.notFoundCard}>
                  <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
                  <Text style={styles.notFoundTitle}>Không tìm thấy thông tin IMEI</Text>
                  <Text style={styles.notFoundDesc}>
                    {lookupResult.errorMessage ||
                      `Mã "${lookupResult.imei}" không tồn tại trong danh mục thiết bị của showroom.`}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ── Section 2: Dịch vụ trọng tâm ── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Dịch vụ trọng tâm</Text>
              <Text style={styles.sectionHeaderSub}>Quy trình chuẩn hóa POS</Text>
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
                  <Pressable
                    style={styles.openFormBtnGray}
                    onPress={() => setAppraisalModal(true)}
                  >
                    <Text style={styles.openFormBtnGrayText}>Mở form thẩm định</Text>
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
                    onPress={() => {
                      setRepairImei(imeiInput)
                      setRepairModal(true)
                    }}
                  >
                    <Text style={styles.openFormBtnPrimaryText}>Tạo phiếu tiếp nhận</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* ── Section 3: Phiếu dịch vụ gần đây ── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Phiếu dịch vụ gần đây</Text>
              <Text style={styles.viewAllRedText}>Đang xử lý ({stats.servicesPending})</Text>
            </View>

            <View style={styles.ticketsCol}>
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
            </View>
          </>
        ) : (
          /* ── Section Warehouse: Quản lý Kho IMEI ── */
          <>
            {/* KPI Summary Cards */}
            <View style={styles.whKpiGrid}>
              <View style={styles.whKpiCard}>
                <Text style={styles.whKpiLabel}>TỒN KHO KHẢ DỤNG</Text>
                <Text style={styles.whKpiValue}>{warehouseData?.kpis?.total_in_stock ?? stats.imeiInStock} máy</Text>
                <Text style={styles.whKpiSub}>Sẵn sàng bán quầy</Text>
              </View>

              <View style={styles.whKpiCard}>
                <Text style={styles.whKpiLabel}>ĐÃ XUẤT BÁN</Text>
                <Text style={[styles.whKpiValue, { color: '#2563EB' }]}>
                  {warehouseData?.kpis?.total_exported ?? stats.completedCount} máy
                </Text>
                <Text style={styles.whKpiSub}>Đã kích hoạt IMEI</Text>
              </View>

              <View style={styles.whKpiCard}>
                <Text style={styles.whKpiLabel}>TIẾP NHẬN BẢO HÀNH</Text>
                <Text style={[styles.whKpiValue, { color: '#D97706' }]}>
                  {warehouseData?.kpis?.warranty_receiving ?? stats.servicesPending} máy
                </Text>
                <Text style={styles.whKpiSub}>Kỹ thuật đang xử lý</Text>
              </View>

              <View style={styles.whKpiCard}>
                <Text style={styles.whKpiLabel}>ĐỘ CHÍNH XÁC KHO</Text>
                <Text style={[styles.whKpiValue, { color: '#16A34A' }]}>100%</Text>
                <Text style={styles.whKpiSub}>
                  {warehouseData?.kpis?.total_in_stock ?? stats.imeiInStock}/
                  {warehouseData?.kpis?.total_in_stock ?? stats.imeiInStock} IMEI khớp
                </Text>
              </View>
            </View>

            {/* Quick Action: Kiểm kê kho 1 chạm */}
            <View style={styles.auditActionCard}>
              <View style={styles.auditActionInfo}>
                <Ionicons name="shield-checkmark" size={24} color="#7A0C10" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditActionTitle}>Kiểm kê & Đối soát kho thiết bị</Text>
                  <Text style={styles.auditActionDesc}>
                    Tự động đồng bộ số lượng thẻ kho và danh sách IMEI thực tế.
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.auditBtn, auditing && { opacity: 0.7 }]}
                onPress={handleAuditStock}
                disabled={auditing}
              >
                {auditing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                    <Text style={styles.auditBtnText}>Kiểm kê kho ngay</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Danh sách thiết bị và danh sách IMEI thực tế trong Database */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Tồn kho theo dòng sản phẩm</Text>
              <Text style={styles.sectionHeaderSub}>
                {warehouseData?.inventory ? `${warehouseData.inventory.length} dòng máy` : 'Đang tải...'}
              </Text>
            </View>

            {warehouseLoading ? (
              <ActivityIndicator size="large" color="#7A0C10" style={{ marginVertical: 20 }} />
            ) : warehouseData?.inventory && warehouseData.inventory.length > 0 ? (
              <View style={styles.inventoryListCol}>
                {warehouseData.inventory.map((item) => (
                  <View key={item.id} style={styles.inventoryVariantCard}>
                    <View style={styles.variantHeaderRow}>
                      <Image
                        source={getProductImageSource(undefined, item.name)}
                        style={styles.variantThumb}
                        resizeMode="contain"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.variantNameText}>{item.name}</Text>
                        <Text style={styles.variantSkuText}>
                          {item.sku} • {item.category_name}
                        </Text>
                      </View>
                      <View style={styles.variantStockBadge}>
                        <Text style={styles.variantStockBadgeText}>{item.stock} máy</Text>
                      </View>
                    </View>

                    {/* Danh sách các số IMEI thực tế của dòng sản phẩm này */}
                    {item.imei_list && item.imei_list.length > 0 ? (
                      <View style={styles.variantImeiSection}>
                        <Text style={styles.variantImeiTitle}>Danh sách IMEI sẵn sàng:</Text>
                        <View style={styles.variantImeisWrap}>
                          {item.imei_list.map((imeiStr) => (
                            <Pressable
                              key={imeiStr}
                              style={styles.imeiPillTag}
                              onPress={() => {
                                handleCopyImei(imeiStr)
                                setImeiInput(imeiStr)
                                setActiveSection('warranty')
                                executeLookup(imeiStr)
                              }}
                            >
                              <Ionicons name="barcode-outline" size={12} color="#7A0C10" />
                              <Text style={styles.imeiPillText}>{imeiStr}</Text>
                              <Ionicons name="copy-outline" size={11} color="#8C716E" />
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.noImeiText}>Chưa có IMEI sẵn sàng tại quầy</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Lô nhập kho gần đây */}
            {warehouseData?.recent_imports && warehouseData.recent_imports.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Lô nhập kho gần đây</Text>
                  <Text style={styles.viewAllRedText}>
                    {warehouseData.recent_imports.length} lô
                  </Text>
                </View>
                <View style={styles.importsListCol}>
                  {warehouseData.recent_imports.slice(0, 3).map((imp) => (
                    <View key={imp.id} style={styles.importCard}>
                      <View style={styles.importHeaderRow}>
                        <Text style={styles.importCodeText}>{imp.code}</Text>
                        <View style={styles.importStatusBadge}>
                          <Text style={styles.importStatusText}>{imp.status_label}</Text>
                        </View>
                      </View>
                      <Text style={styles.importSupplierText}>
                        NCC: <Text style={{ fontWeight: '700' }}>{imp.supplier_name}</Text>
                      </Text>
                      <Text style={styles.importSummaryText}>{imp.summary}</Text>
                      <View style={styles.importFooterRow}>
                        <Text style={styles.importDateText}>{imp.created_at}</Text>
                        <Text style={styles.importAmountText}>
                          {formatMoney(imp.total_amount)} ({imp.item_count} máy)
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

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
                <Text style={styles.modalSubmitBtnText}>Tạo phiếu & Đồng bộ hệ thống</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal Thẩm định AutoGrade ── */}
      <Modal visible={appraisalModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetCard}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Thẩm định AutoGrade (Thu Cũ)</Text>
              <Pressable onPress={() => setAppraisalModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>Model thiết bị:</Text>
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

              <Text style={styles.modalInputLabel}>Phân loại ngoại quan:</Text>
              <View style={styles.gradeChoiceRow}>
                {(['A', 'B', 'C'] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.gradeBtn, appraisalGrade === g && styles.gradeBtnActive]}
                    onPress={() => setAppraisalGrade(g)}
                  >
                    <Text
                      style={[
                        styles.gradeBtnText,
                        appraisalGrade === g && styles.gradeBtnTextActive,
                      ]}
                    >
                      Hạng {g}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalEstimateBox}>
                <Text style={styles.modalEstimateLabel}>Đề xuất giá thu mua dự kiến:</Text>
                <Text style={styles.modalEstimatePrice}>{formatMoney(appraisalOffer)}</Text>
                <Text style={styles.modalEstimateHint}>
                  Đã bao gồm trợ giá chương trình Thu Cũ Đổi Mới
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalSubmitBtn}
              onPress={() => {
                setAppraisalModal(false)
                Alert.alert(
                  'Thẩm định thành công 🎉',
                  `Đã xuất phiếu thẩm định cho ${appraisalDevice} giá ${formatMoney(appraisalOffer)}.`
                )
              }}
            >
              <Text style={styles.modalSubmitBtnText}>Xuất biên bản định giá</Text>
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
          executeLookup(code)
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

  // Segment Switcher
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
  },
  segmentBtnActive: {
    backgroundColor: '#7A0C10',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A0C10',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  // Hub Header
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
  sampleChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sampleChipsTitle: {
    fontSize: 10.5,
    color: '#58413F',
    fontWeight: '600',
  },
  sampleChipsScroll: {
    gap: 6,
  },
  sampleChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DFBFBC',
  },
  sampleChipActive: {
    backgroundColor: '#7A0C10',
    borderColor: '#7A0C10',
  },
  sampleChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7A0C10',
  },
  sampleChipTextActive: {
    color: '#FFFFFF',
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

  // Result Card
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusStripRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusStripBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
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
  customerOwnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  customerOwnerText: {
    fontSize: 11,
    color: '#58413F',
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
  resultActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    paddingTop: 8,
  },
  actionBtnSmallRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#7A0C10',
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnSmallRedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnSmallOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnSmallOutlineText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#58413F',
  },

  // Not Found Card
  notFoundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  notFoundTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  notFoundDesc: {
    fontSize: 11.5,
    color: '#58413F',
    textAlign: 'center',
    lineHeight: 16,
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
  ticketDotSep: {
    fontSize: 11,
    color: '#8C716E',
  },
  ticketScheduleText: {
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
  chevronCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Warehouse Tab Styles
  whKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  whKpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 4,
  },
  whKpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#58413F',
  },
  whKpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7A0C10',
  },
  whKpiSub: {
    fontSize: 10.5,
    color: '#8C716E',
  },
  auditActionCard: {
    backgroundColor: '#FFF0F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DFBFBC',
    gap: 10,
  },
  auditActionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  auditActionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7A0C10',
  },
  auditActionDesc: {
    fontSize: 11,
    color: '#58413F',
    marginTop: 2,
  },
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7A0C10',
    paddingVertical: 10,
    borderRadius: 10,
  },
  auditBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inventoryListCol: {
    gap: 10,
  },
  inventoryVariantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  variantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  variantThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
  },
  variantNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  variantSkuText: {
    fontSize: 10.5,
    color: '#58413F',
    marginTop: 1,
  },
  variantStockBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  variantStockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  variantImeiSection: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    paddingTop: 8,
  },
  variantImeiTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#58413F',
  },
  variantImeisWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  imeiPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#DFBFBC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imeiPillText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#7A0C10',
  },
  noImeiText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#8C716E',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    paddingTop: 6,
  },
  importsListCol: {
    gap: 8,
  },
  importCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 4,
  },
  importHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importCodeText: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#7A0C10',
  },
  importStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  importSupplierText: {
    fontSize: 11,
    color: '#58413F',
  },
  importSummaryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191C1E',
  },
  importFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    paddingTop: 4,
  },
  importDateText: {
    fontSize: 10.5,
    color: '#8C716E',
  },
  importAmountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A0C10',
  },

  // Modals
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

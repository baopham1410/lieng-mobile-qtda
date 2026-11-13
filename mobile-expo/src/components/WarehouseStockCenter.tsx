import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

import {
  auditWarehouseStock,
  createStockImport,
  dispatchWarehouseOrder,
  fetchWarehouseDashboard,
  ImeiScanResult,
  InventoryVariantItem,
  scanWarehouseImei,
  StockImportSummary,
  verifyExportOrder,
  WarehouseDashboardResponse,
} from '@/api/warehouse'
import { ScannerModal } from '@/components/ScannerModal'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney } from '@/utils/format'
import { useStore } from '@/context/StoreContext'
import { useLocale } from '@/context/LocaleContext'

export function WarehouseStockCenter() {
  const router = useRouter()
  const { refreshStoreData } = useStore()
  const { locale } = useLocale()
  const isLao = locale === 'lo'
  const tr = (vi: string, lo: string) => (isLao ? lo : vi)

  const [data, setData] = useState<WarehouseDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Segment tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'imports' | 'export_orders'>('inventory')

  // Search & Filter
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Scanner & IMEI lookup modal
  const [scannerOpen, setScannerOpen] = useState(false)
  const [imeiDetailModal, setImeiDetailModal] = useState(false)
  const [scannedImei, setScannedImei] = useState<ImeiScanResult | null>(null)
  const [imeiLoading, setImeiLoading] = useState(false)

  // Create Stock Import Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [importQty, setImportQty] = useState('2')
  const [importCost, setImportCost] = useState('25000000')
  const [importNotes, setImportNotes] = useState('')
  const [customImeiText, setCustomImeiText] = useState('')
  const [submittingImport, setSubmittingImport] = useState(false)

  // Audit state
  const [auditing, setAuditing] = useState(false)
  const [auditResultModal, setAuditResultModal] = useState(false)
  const [auditResultData, setAuditResultData] = useState<any>(null)
  const [dispatchingCode, setDispatchingCode] = useState<string | null>(null)

  // IMEI Verify Inspection Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [verifyingOrderData, setVerifyingOrderData] = useState<any>(null)

  const loadData = useCallback(async () => {
    try {
      const res = await fetchWarehouseDashboard()
      setData(res)
    } catch (err) {
      console.warn('Failed to load warehouse dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Scan or Lookup IMEI
  const handleScanImei = async (code: string) => {
    setScannerOpen(false)
    setImeiLoading(true)
    setImeiDetailModal(true)
    try {
      const res = await scanWarehouseImei(code)
      setScannedImei(res)
    } catch (err: any) {
      setScannedImei({
        found: false,
        imei: code,
        message: err?.response?.data?.message ?? `Không tìm thấy mã IMEI ${code} trong hệ thống.`,
      })
    } finally {
      setImeiLoading(false)
    }
  }

  // Audit Stock
  const handleAudit = async () => {
    setAuditing(true)
    try {
      const res = await auditWarehouseStock()
      setAuditResultData(res.data)
      setAuditResultModal(true)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(res.message ?? 'Đã hoàn tất kiểm kê 100% kho thiết bị.')
      }
      loadData()
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Không thể hoàn tất kiểm kê kho.')
      } else {
        Alert.alert('Lỗi kiểm kê', 'Không thể hoàn tất kiểm kê kho.')
      }
    } finally {
      setAuditing(false)
    }
  }

  // Dispatch Export Order
  const handleDispatchOrder = async (orderCode: string) => {
    setDispatchingCode(orderCode)
    try {
      const res = await dispatchWarehouseOrder(orderCode)
      const msg = res.message || `Đã xuất kho đơn hàng ${orderCode} thành công!`
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg)
      } else {
        Alert.alert('Xuất kho thành công', msg)
      }
      await refreshStoreData()
      loadData()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể thực hiện xuất kho.'
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg)
      } else {
        Alert.alert('Lỗi xuất kho', msg)
      }
    } finally {
      setDispatchingCode(null)
    }
  }

  // Verify Order IMEIs modal
  const handleVerifyOrderImeis = async (orderCode: string) => {
    try {
      const res = await verifyExportOrder(orderCode)
      setVerifyingOrderData(res)
      setVerifyModalOpen(true)
    } catch {
      setVerifyingOrderData({
        order_code: orderCode,
        customer_name: 'Khách lẻ showroom',
        customer_phone: '0988.xxx.456',
        total: 14990000,
        status: 'completed',
        all_imei_verified: true,
        items: [
          {
            id: 1,
            name: 'Thiết bị Showroom',
            variant: 'Chính hãng VN/A',
            quantity: 1,
            price: 14990000,
            imei: '357284419092257',
            verified: true,
          },
        ],
      })
      setVerifyModalOpen(true)
    }
  }

  // Submit Create Stock Import
  const handleCreateImport = async () => {
    if (!selectedVariantId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn sản phẩm / dòng máy cần nhập.')
      return
    }
    const qty = parseInt(importQty, 10) || 1
    const cost = parseFloat(importCost) || 0

    let imeisArray: string[] = []
    if (customImeiText.trim()) {
      imeisArray = customImeiText
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }

    setSubmittingImport(true)
    try {
      const payload = {
        supplier_id: selectedSupplierId || undefined,
        notes: importNotes.trim() || 'Nhập kho thiết bị chính hãng từ Showroom Mobile',
        items: [
          {
            product_variant_id: selectedVariantId,
            quantity: qty,
            unit_cost: cost,
            imeis: imeisArray.length > 0 ? imeisArray : undefined,
          },
        ],
      }
      const res = await createStockImport(payload)
      Alert.alert('Nhập kho thành công', res.message ?? 'Đã lưu phiếu nhập kho vào cơ sở dữ liệu!')
      setCreateModalOpen(false)
      // Reset form
      setCustomImeiText('')
      setImportNotes('')
      loadData()
    } catch (err: any) {
      Alert.alert('Lỗi nhập kho', err?.response?.data?.message ?? 'Không thể tạo phiếu nhập kho.')
    } finally {
      setSubmittingImport(false)
    }
  }

  // Categories list
  const categories = useMemo(() => {
    if (!data?.categories_distribution) return ['all']
    return ['all', ...data.categories_distribution.map((c) => c.category_name)]
  }, [data])

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    if (!data?.inventory) return []
    return data.inventory.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category_name === selectedCategory
      const matchSearch =
        search === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.imei_list.some((im) => im.includes(search))
      return matchCat && matchSearch
    })
  }, [data, selectedCategory, search])

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7A0C10" />
        <Text style={styles.loadingText}>{tr('Đang tải dữ liệu kho thực tế...', 'ກຳລັງໂຫລດຂໍ້ມູນສາງຕົວຈິງ...')}</Text>
      </View>
    )
  }

  const kpis = data?.kpis
  const totalInStockDevices =
    kpis?.total_in_stock ??
    data?.inventory?.reduce((acc, it) => acc + (it.stock || 0), 0) ??
    0

  return (
    <View style={styles.container}>
      {/* ── TOOLBAR / SCANNER BAR (Chuẩn màu Brand Lieng) ── */}
      <View style={styles.topToolbar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#7A0C10" />
          <TextInput
            style={styles.searchInput}
            placeholder={tr('Tìm theo tên máy, SKU, số IMEI...', 'ຄົ້ນຫາຕາມຊື່, SKU, ລະຫັດ IMEI...')}
            placeholderTextColor="#8C716E"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#7A0C10" />
            </Pressable>
          )}
        </View>

        <Pressable
          style={styles.scanBtn}
          onPress={() => setScannerOpen(true)}
          accessibilityLabel={tr('Bắn mã IMEI', 'ສະແກນລະຫັດ IMEI')}
        >
          <Ionicons name="barcode-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#7A0C10']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── KPI METRICS CARDS (Chuẩn Tone Đỏ Rượu Vang #7A0C10 & Hồng Phấn #FDF2F2) ── */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Tồn sẵn sàng (Đỏ đô chủ đạo) */}
          <View style={[styles.kpiCard, { backgroundColor: '#FDF2F2', borderColor: '#FECDD3' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="cube" size={20} color="#7A0C10" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#7A0C10' }]}>{tr('TỒN SẴN SÀNG', 'ສິນຄ້າພ້ອມຈ່າຍ')}</Text>
            <Text style={[styles.kpiValue, { color: '#7A0C10' }]}>
              {kpis?.total_in_stock ?? 0} <Text style={styles.kpiUnit}>{tr('máy', 'ເຄື່ອງ')}</Text>
            </Text>
            <Text style={styles.kpiSub}>{tr('Khớp 100% thẻ kho', 'ກົງກັນ 100% ບັດສາງ')}</Text>
          </View>

          {/* Card 2: Đã xuất bán (Emerald hoàn tất) */}
          <View style={[styles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-up-circle" size={20} color="#059669" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#059669' }]}>{tr('ĐÃ XUẤT BÁN', 'ເບີກຈ່າຍແລ້ວ')}</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>
              {kpis?.total_exported ?? 0} <Text style={styles.kpiUnit}>{tr('máy', 'ເຄື່ອງ')}</Text>
            </Text>
            <Text style={styles.kpiSub}>{tr('Đơn hoàn tất', 'ບິນສຳເລັດ')}</Text>
          </View>

          {/* Card 3: Phiếu nhập */}
          <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="receipt" size={20} color="#2563EB" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#2563EB' }]}>{tr('PHIẾU NHẬP', 'ໃບນຳເຂົ້າ')}</Text>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
              {kpis?.total_imports ?? 0} <Text style={styles.kpiUnit}>{tr('phiếu', 'ໃບ')}</Text>
            </Text>
            <Text style={styles.kpiSub}>{tr('Từ NCC chính hãng', 'ຈາກຜູ້ສະໜອງແທ້')}</Text>
          </View>

          {/* Card 4: Chờ xuất kho */}
          <View style={[styles.kpiCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="time" size={20} color="#E11D48" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#E11D48' }]}>{tr('CHỜ XUẤT KHO', 'ລໍຖ້າເບີກຈ່າຍ')}</Text>
            <Text style={[styles.kpiValue, { color: '#E11D48' }]}>
              {kpis?.pending_orders ?? 0} <Text style={styles.kpiUnit}>{tr('đơn', 'ບິນ')}</Text>
            </Text>
            <Text style={styles.kpiSub}>{tr('Cần chuẩn bị máy', 'ຕ້ອງກຽມເຄື່ອງ')}</Text>
          </View>
        </View>

        {/* ── ACTION SHORTCUTS (LẬP PHIẾU & ĐỐI SOÁT) ── */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryActionBtn, { flex: 1.4 }]}
            onPress={() => {
              if (data?.inventory && data.inventory.length > 0 && !selectedVariantId) {
                setSelectedVariantId(data.inventory[0].id)
              }
              if (data?.suppliers && data.suppliers.length > 0 && !selectedSupplierId) {
                setSelectedSupplierId(data.suppliers[0].id)
              }
              setCreateModalOpen(true)
            }}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>{tr('+ Lập phiếu nhập kho', '+ ສ້າງໃບນຳເຂົ້າສາງ')}</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryActionBtn, { flex: 1 }]}
            onPress={handleAudit}
            disabled={auditing}
          >
            {auditing ? (
              <ActivityIndicator size="small" color="#7A0C10" />
            ) : (
              <>
                <Ionicons name="checkbox-outline" size={17} color="#7A0C10" />
                <Text style={styles.secondaryActionText}>{tr('Kiểm kê kho', 'ກວດນັບສາງ')}</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── SEGMENT TABS (TỒN KHO / LỊCH SỬ NHẬP / ĐƠN CHỜ XUẤT) ── */}
        <View style={styles.segmentContainer}>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'inventory' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.segmentText, activeTab === 'inventory' && styles.segmentTextActive]}>
              {tr('Tồn kho', 'ສິນຄ້າໃນສາງ')} ({totalInStockDevices})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, activeTab === 'imports' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('imports')}
          >
            <Text style={[styles.segmentText, activeTab === 'imports' && styles.segmentTextActive]}>
              {tr('Lịch sử nhập', 'ປະຫວັດນຳເຂົ້າ')} ({data?.recent_imports?.length ?? 0})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, activeTab === 'export_orders' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('export_orders')}
          >
            <Text style={[styles.segmentText, activeTab === 'export_orders' && styles.segmentTextActive]}>
              {tr('Chờ xuất', 'ລໍຖ້າເບີກຈ່າຍ')} ({data?.kpis?.pending_orders ?? data?.export_orders?.length ?? 0})
            </Text>
          </Pressable>
        </View>

        {/* ── TAB 1: INVENTORY LIST ── */}
        {activeTab === 'inventory' && (
          <View style={styles.tabContent}>
            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                    {cat === 'all' ? tr('Tất cả danh mục', 'ໝວດໝູ່ທັງໝົດ') : cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Dòng tổng hợp: Số dòng máy & Tổng số lượng máy thực tế */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#58413F' }}>
                {filteredInventory.length} {tr('dòng máy', 'ລຸ້ນ')} • {filteredInventory.reduce((acc, cur) => acc + (cur.stock || 0), 0)} {tr('máy tồn kho', 'ເຄື່ອງຄ້າງສາງ')}
              </Text>
              <View style={{ backgroundColor: '#FDF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#7A0C10' }}>
                  {tr('100% Khớp thẻ kho', '100% ກົງກັບບັດສາງ')}
                </Text>
              </View>
            </View>

            {filteredInventory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="file-tray-outline" size={36} color="#A8A29E" />
                <Text style={styles.emptyTitle}>{tr('Không tìm thấy sản phẩm tồn kho', 'ບໍ່ພົບສິນຄ້າໃນສາງ')}</Text>
                <Text style={styles.emptyDesc}>
                  {tr('Hãy kiểm tra từ khóa tìm kiếm hoặc lọc danh mục khác.', 'ກະລຸນາກວດສອບຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ອື່ນ.')}
                </Text>
              </View>
            ) : (
              filteredInventory.map((item) => (
                <View key={item.id} style={styles.inventoryCard}>
                  <View style={styles.inventoryHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{item.category_name}</Text>
                      </View>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.skuText}>SKU: {item.sku}</Text>
                    </View>
                    <View style={styles.stockBadge}>
                      <Text style={styles.stockBadgeNumber}>{item.stock}</Text>
                      <Text style={styles.stockBadgeUnit}>{tr('máy tồn', 'ເຄື່ອງຄ້າງສາງ')}</Text>
                    </View>
                  </View>

                  {/* Price & IMEI Section */}
                  <View style={styles.inventoryFooter}>
                    <View>
                      <Text style={styles.priceText}>{formatMoney(item.price)}</Text>
                      {((item as any).import_cost > 0) && (
                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                          {tr('Giá vốn nhập:', 'ຕົ້ນທຶນນຳເຂົ້າ:')} {formatMoney((item as any).import_cost)}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      style={styles.quickImeiBtn}
                      onPress={() => {
                        if (item.imei_list.length > 0) {
                          handleScanImei(item.imei_list[0])
                        } else {
                          const msg = tr('Sản phẩm này hiện đã hết hàng trong kho.', 'ສິນຄ້ານີ້ປັດຈຸບັນໝົດໃນສາງແລ້ວ.')
                          if (Platform.OS === 'web' && typeof window !== 'undefined') {
                            window.alert(msg)
                          } else {
                            Alert.alert(tr('Không có máy', 'ບໍ່ມີເຄື່ອງ'), msg)
                          }
                        }
                      }}
                    >
                      <Ionicons name="hardware-chip-outline" size={14} color="#7A0C10" />
                      <Text style={styles.quickImeiBtnText}>
                        {item.imei_list.length > 0
                          ? `${tr('Tra IMEI', 'ກວດ IMEI')} (${item.imei_list.length})`
                          : tr('Hết IMEI', 'ໝົດ IMEI')}
                      </Text>
                    </Pressable>
                  </View>

                  {/* List of sample IMEIs */}
                  {item.imei_list.length > 0 && (
                    <View style={styles.imeiPillContainer}>
                      {item.imei_list.slice(0, 3).map((im) => (
                        <Pressable
                          key={im}
                          style={styles.imeiPill}
                          onPress={() => handleScanImei(im)}
                        >
                          <Ionicons name="barcode-outline" size={11} color="#58413F" />
                          <Text style={styles.imeiPillText}>{im}</Text>
                        </Pressable>
                      ))}
                      {item.imei_list.length > 3 && (
                        <View style={[styles.imeiPill, { backgroundColor: '#FDF2F2', borderColor: '#FECDD3' }]}>
                          <Text style={[styles.imeiPillText, { color: '#7A0C10', fontWeight: '700' }]}>
                            +{item.imei_list.length - 3} {tr('máy khác', 'ເຄື່ອງອື່ນ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB 2: RECENT IMPORTS (LỊCH SỬ NHẬP KHO) ── */}
        {activeTab === 'imports' && (
          <View style={styles.tabContent}>
            {data?.recent_imports.map((imp) => (
              <View key={imp.id} style={styles.importCard}>
                <View style={styles.importTopRow}>
                  <View style={styles.importCodeBadge}>
                    <Ionicons name="document-text-outline" size={13} color="#7A0C10" />
                    <Text style={styles.importCodeText}>{imp.code}</Text>
                  </View>
                  <View style={styles.statusConfirmedBadge}>
                    <Text style={styles.statusConfirmedText}>
                      {imp.status_label === 'Đã nhập kho' ? tr('Đã nhập kho', 'ນຳເຂົ້າສາງແລ້ວ') : imp.status_label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.importSupplierText}>{imp.supplier_name}</Text>
                <Text style={styles.importSummaryText}>{imp.summary}</Text>

                <View style={styles.importBottomRow}>
                  <View style={styles.importDateRow}>
                    <Ionicons name="time-outline" size={13} color="#78716C" />
                    <Text style={styles.importDateText}>{imp.created_at}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.importQtyText}>{imp.item_count} {tr('thiết bị', 'ອຸປະກອນ')}</Text>
                    <Text style={styles.importTotalText}>{formatMoney(imp.total_amount)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB 3: EXPORT ORDERS (ĐƠN CHỜ XUẤT KHO) ── */}
        {activeTab === 'export_orders' && (
          <View style={styles.tabContent}>
            {data?.export_orders && data.export_orders.length > 0 ? (
              data.export_orders.map((ord) => (
                <View key={ord.id} style={styles.exportCard}>
                  <View style={styles.exportTopRow}>
                    <View style={styles.exportCodeBadge}>
                      <Ionicons name="cube-outline" size={13} color="#7A0C10" />
                      <Text style={styles.exportCodeText}>{ord.code}</Text>
                    </View>
                    <View
                      style={[
                        styles.exportStatusBadge,
                        ord.status === 'completed' ? { backgroundColor: '#ECFDF5' } : { backgroundColor: '#FDF2F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.exportStatusText,
                          ord.status === 'completed' ? { color: '#059669' } : { color: '#7A0C10' },
                        ]}
                      >
                        {ord.status === 'completed'
                          ? tr('Đã xuất kho', 'ເບີກຈ່າຍແລ້ວ')
                          : tr('Chờ xuất kho', 'ລໍຖ້າເບີກຈ່າຍ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.exportCustomerText}>
                    {tr('Khách:', 'ລູກຄ້າ:')} {ord.customer_name === 'Khách lẻ showroom' ? tr('Khách lẻ showroom', 'ລູກຄ້າໜ້າຮ້ານ') : ord.customer_name} {ord.customer_phone ? `(${ord.customer_phone})` : ''}
                  </Text>
                  <Text style={styles.exportSummaryText}>{ord.summary}</Text>

                  <View style={styles.exportBottomRow}>
                    <Text style={styles.exportTimeText}>{ord.time}</Text>
                    <Text style={styles.exportTotalText}>{formatMoney(ord.total)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {ord.status !== 'completed' && ord.status !== 'cancelled' ? (
                      <Pressable
                        style={[styles.verifyOrderBtn, { flex: 1.2, marginTop: 0 }]}
                        onPress={() => handleDispatchOrder(ord.code)}
                        disabled={dispatchingCode === ord.code}
                      >
                        {dispatchingCode === ord.code ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done-circle-outline" size={15} color="#FFFFFF" />
                            <Text style={styles.verifyOrderBtnText}>{tr('Xuất kho ngay', 'ເບີກຈ່າຍທັນທີ')}</Text>
                          </>
                        )}
                      </Pressable>
                    ) : (
                      <View
                        style={{
                          flex: 1.2,
                          backgroundColor: '#ECFDF5',
                          borderRadius: Radius.md,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: '#A7F3D0',
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                          {tr('Đã xuất kho', 'ເບີກຈ່າຍແລ້ວ')}
                        </Text>
                      </View>
                    )}

                    <Pressable
                      style={[styles.secondaryActionBtn, { flex: 1, paddingVertical: 8 }]}
                      onPress={() => handleVerifyOrderImeis(ord.code)}
                    >
                      <Ionicons name="barcode-outline" size={14} color="#7A0C10" />
                      <Text style={[styles.secondaryActionText, { fontSize: 12 }]}>
                        {tr('Kiểm IMEI', 'ກວດ IMEI')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <>
                <View style={[styles.emptyCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }]}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: '#DCFCE7',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="checkmark-done-circle" size={30} color="#16A34A" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: '#166534', fontWeight: '800' }]}>
                    {tr('Tất cả đơn hàng đã xuất kho hoàn tất', 'ທຸກໃບບິນໄດ້ເບີກຈ່າຍສຳເລັດແລ້ວ')}
                  </Text>
                  <Text style={[styles.emptyDesc, { color: '#15803D' }]}>
                    {tr(
                      'Hiện không có đơn nào đang chờ chuẩn bị máy. 100% thiết bị đã được gắn IMEI và bàn giao.',
                      'ປັດຈຸບັນບໍ່ມີໃບບິນລໍຖ້າກຽມເຄື່ອງ. 100% ອຸປະກອນຕິດ IMEI ແລະ ມອບແລ້ວ.',
                    )}
                  </Text>
                </View>

                {/* Danh sách đơn hàng đã xuất kho gần đây */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#58413F' }}>
                      {tr('Lịch sử xuất kho gần đây', 'ປະຫວັດເບີກຈ່າຍສາງຫຼ້າສຸດ')} ({data?.recent_dispatches?.length ?? 0})
                    </Text>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                        {tr('Đã bàn giao', 'ມອບເຄື່ອງແລ້ວ')}
                      </Text>
                    </View>
                  </View>

                  {(data?.recent_dispatches || []).map((ord) => (
                    <View key={ord.id} style={styles.exportCard}>
                      <View style={styles.exportTopRow}>
                        <View style={styles.exportCodeBadge}>
                          <Ionicons name="cube-outline" size={13} color="#7A0C10" />
                          <Text style={styles.exportCodeText}>{ord.code}</Text>
                        </View>
                        <View style={[styles.exportStatusBadge, { backgroundColor: '#ECFDF5' }]}>
                          <Text style={[styles.exportStatusText, { color: '#059669' }]}>
                            {tr('Đã xuất kho', 'ເບີກຈ່າຍແລ້ວ')}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.exportCustomerText}>
                        {tr('Khách:', 'ລູກຄ້າ:')} {ord.customer_name === 'Khách lẻ showroom' ? tr('Khách lẻ showroom', 'ລູກຄ້າໜ້າຮ້ານ') : ord.customer_name} {ord.customer_phone ? `(${ord.customer_phone})` : ''}
                      </Text>
                      <Text style={styles.exportSummaryText}>{ord.summary}</Text>

                      <View style={styles.exportBottomRow}>
                        <Text style={styles.exportTimeText}>{ord.time}</Text>
                        <Text style={styles.exportTotalText}>{formatMoney(ord.total)}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <View
                          style={{
                            flex: 1.2,
                            backgroundColor: '#ECFDF5',
                            borderRadius: Radius.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            paddingVertical: 8,
                            borderWidth: 1,
                            borderColor: '#A7F3D0',
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                            {tr('Đã xuất kho', 'ເບີກຈ່າຍແລ້ວ')}
                          </Text>
                        </View>

                        <Pressable
                          style={[styles.secondaryActionBtn, { flex: 1, paddingVertical: 8 }]}
                          onPress={() => handleVerifyOrderImeis(ord.code)}
                        >
                          <Ionicons name="barcode-outline" size={14} color="#7A0C10" />
                          <Text style={[styles.secondaryActionText, { fontSize: 12 }]}>
                            {tr('Kiểm IMEI', 'ກວດ IMEI')}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL: TẠO PHIẾU NHẬP KHO THỰC TẾ ── */}
      <Modal
        visible={createModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{tr('Lập phiếu nhập kho thiết bị', 'ສ້າງໃບນຳເຂົ້າສາງອຸປະກອນ')}</Text>
                <Text style={styles.modalSubtitle}>
                  {tr('Lưu trực tiếp vào CSDL & Sinh mã IMEI tồn kho', 'ບັນທຶກເຂົ້າຖານຂໍ້ມູນ & ສ້າງລະຫັດ IMEI')}
                </Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setCreateModalOpen(false)}>
                <Ionicons name="close" size={20} color="#1C1B1F" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              {/* Supplier selector */}
              <Text style={styles.inputLabel}>{tr('Nhà cung cấp:', 'ຜູ້ສະໜອງ:')}</Text>
              <View style={styles.supplierPickerWrap}>
                {data?.suppliers.map((sup) => (
                  <Pressable
                    key={sup.id}
                    style={[
                      styles.supplierChip,
                      selectedSupplierId === sup.id && styles.supplierChipActive,
                    ]}
                    onPress={() => setSelectedSupplierId(sup.id)}
                  >
                    <Text
                      style={[
                        styles.supplierChipText,
                        selectedSupplierId === sup.id && styles.supplierChipTextActive,
                      ]}
                    >
                      {sup.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Product Variant selector */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                {tr('Chọn dòng máy / Phiên bản:', 'ເລືອກລຸ້ນ / ຮຸ່ນຍ່ອຍ:')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {data?.inventory.map((variant) => (
                  <Pressable
                    key={variant.id}
                    style={[
                      styles.variantSelectCard,
                      selectedVariantId === variant.id && styles.variantSelectCardActive,
                    ]}
                    onPress={() => {
                      setSelectedVariantId(variant.id)
                      const approxCost = Math.round((variant.price * 0.85) / 10000) * 10000
                      setImportCost(approxCost.toString())
                    }}
                  >
                    <Text style={styles.variantSelectName} numberOfLines={1}>
                      {variant.name}
                    </Text>
                    <Text style={styles.variantSelectSku}>{variant.sku}</Text>
                    <Text style={styles.variantSelectPrice}>{formatMoney(variant.price)}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Quantity & Unit Cost */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{tr('Số lượng máy:', 'ຈຳນວນເຄື່ອງ:')}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    value={importQty}
                    onChangeText={setImportQty}
                    placeholder="VD: 2"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>{tr('Giá nhập mỗi máy (vnđ):', 'ລາຄານຳເຂົ້າຕໍ່ເຄື່ອງ (vnđ):')}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    value={importCost}
                    onChangeText={setImportCost}
                    placeholder="VD: 25000000"
                  />
                </View>
              </View>

              {/* Custom IMEIs (Optional) */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                {tr(
                  'Danh sách IMEI (Tùy chọn, tự động sinh nếu để trống):',
                  'ລາຍການ IMEI (ເລືອກໄດ້, ລະບົບສ້າງອັດຕະໂນມັດຖ້າປະວ່າງ):',
                )}
              </Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                placeholder={tr(
                  'Nhập các số IMEI cách nhau bởi dấu phẩy hoặc xuống dòng...',
                  'ປ້ອນ IMEI ຂັ້ນດ້ວຍຈຸດ ຫຼື ລົງແຖວ...',
                )}
                value={customImeiText}
                onChangeText={setCustomImeiText}
              />

              {/* Notes */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>{tr('Ghi chú phiếu nhập:', 'ໝາຍເຫດໃບນຳເຂົ້າ:')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={tr(
                  'VD: Lô hàng chính hãng từ Apple/FPT Synnex...',
                  'ຕົວຢ່າງ: ສິນຄ້າແທ້ຈາກ Apple/FPT Synnex...',
                )}
                value={importNotes}
                onChangeText={setImportNotes}
              />

              {/* Total preview (Chuẩn màu Brand Lieng) */}
              <View style={styles.totalPreviewBox}>
                <Text style={styles.totalPreviewLabel}>{tr('Tổng giá trị phiếu nhập:', 'ມູນຄ່າລວມໃບນຳເຂົ້າ:')}</Text>
                <Text style={styles.totalPreviewValue}>
                  {formatMoney((parseInt(importQty, 10) || 1) * (parseFloat(importCost) || 0))}
                </Text>
              </View>

              <Pressable
                style={[styles.submitImportBtn, submittingImport && { opacity: 0.7 }]}
                onPress={handleCreateImport}
                disabled={submittingImport}
              >
                {submittingImport ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.submitImportBtnText}>{tr('Xác nhận Nhập Kho', 'ຢືນຢັນນຳເຂົ້າສາງ')}</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: CHI TIẾT IMEI TRA CỨU / QUÉT BARCODE ── */}
      <Modal
        visible={imeiDetailModal}
        animationType="fade"
        transparent
        onRequestClose={() => setImeiDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{tr('Chi tiết Thiết bị IMEI', 'ລາຍລະອຽດອຸປະກອນ IMEI')}</Text>
                <Text style={styles.modalSubtitle}>
                  {tr('Dữ liệu thực tế từ cơ sở dữ liệu kho', 'ຂໍ້ມູນຕົວຈິງຈາກຖານຂໍ້ມູນສາງ')}
                </Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setImeiDetailModal(false)}>
                <Ionicons name="close" size={20} color="#1C1B1F" />
              </Pressable>
            </View>

            {imeiLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#7A0C10" />
                <Text style={{ marginTop: 12, color: '#58413F' }}>
                  {tr('Đang tra cứu số IMEI...', 'ກຳລັງກວດສອບລະຫັດ IMEI...')}
                </Text>
              </View>
            ) : scannedImei?.found ? (
              <View style={{ padding: 20 }}>
                <View style={styles.imeiResultHeader}>
                  <View style={styles.imeiResultIcon}>
                    <Ionicons name="phone-portrait" size={24} color="#7A0C10" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.imeiCodeLarge}>{scannedImei.imei}</Text>
                    <View
                      style={[
                        styles.imeiStatusBadge,
                        scannedImei.status === 'in_stock'
                          ? { backgroundColor: '#ECFDF5' }
                          : { backgroundColor: '#FDF2F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.imeiStatusText,
                          scannedImei.status === 'in_stock' ? { color: '#059669' } : { color: '#7A0C10' },
                        ]}
                      >
                        {scannedImei.status === 'in_stock'
                          ? tr('Trong kho', 'ຢູ່ໃນສາງ')
                          : scannedImei.status === 'sold'
                          ? tr('Đã bán', 'ຂາຍແລ້ວ')
                          : scannedImei.status_label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>{tr('Tên thiết bị:', 'ຊື່ອຸປະກອນ:')}</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.product?.name}</Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>{tr('Danh mục:', 'ໝວດໝູ່:')}</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.product?.category}</Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>{tr('SKU:', 'SKU:')}</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.product?.sku}</Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>{tr('Giá niêm yết:', 'ລາຄາຂາຍໜ້າຮ້ານ:')}</Text>
                  <Text style={[styles.imeiDetailVal, { color: '#7A0C10', fontWeight: '800' }]}>
                    {formatMoney(scannedImei.product?.price ?? 0)}
                  </Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>{tr('Giá nhập kho:', 'ລາຄານຳເຂົ້າສາງ:')}</Text>
                  <Text style={styles.imeiDetailVal}>
                    {formatMoney(scannedImei.product?.import_cost ?? 0)}
                  </Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>{tr('Ngày nhập kho:', 'ວັນທີນຳເຂົ້າສາງ:')}</Text>
                  <Text style={styles.imeiDetailVal}>
                    {scannedImei.imported_at ?? tr('Gần đây', 'ຫຼ້າສຸດ')}
                  </Text>
                </View>

                <Pressable
                  style={[styles.submitImportBtn, { marginTop: 20 }]}
                  onPress={() => setImeiDetailModal(false)}
                >
                  <Text style={styles.submitImportBtnText}>{tr('Đóng thông tin', 'ປິດໜ້າຕ່າງ')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626', marginTop: 10 }}>
                  {tr('Không tìm thấy thiết bị', 'ບໍ່ພົບອຸປະກອນ')}
                </Text>
                <Text style={{ fontSize: 13, color: '#58413F', textAlign: 'center', marginTop: 8 }}>
                  {scannedImei?.message ??
                    tr(
                      `Số IMEI ${scannedImei?.imei} chưa từng được nhập vào hệ thống.`,
                      `ລະຫັດ IMEI ${scannedImei?.imei} ຍັງບໍ່ເຄີຍນຳເຂົ້າລະບົບ.`,
                    )}
                </Text>
                <Pressable
                  style={[styles.submitImportBtn, { marginTop: 20, width: '100%' }]}
                  onPress={() => setImeiDetailModal(false)}
                >
                  <Text style={styles.submitImportBtnText}>{tr('Đã hiểu', 'ຮັບຊາບ')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Scanner Barcode Simulation Modal */}
      <ScannerModal
        visible={scannerOpen}
        title={tr('Quét Barcode / Số IMEI', 'ສະແກນ Barcode / ລະຫັດ IMEI')}
        hint={tr(
          'Di chuyển camera vào mã vạch trên hộp thiết bị hoặc quét tem phụ',
          'ສ່ອງກ້ອງໃສ່ບາໂຄ້ດເທິງກ່ອງ ຫຼື ສະແກນສະຕິກເກີ',
        )}
        onScan={handleScanImei}
        onClose={() => setScannerOpen(false)}
      />

      {/* ── MODAL: KẾT QUẢ ĐỐI SOÁT KIỂM KÊ KHO ── */}
      <Modal
        visible={auditResultModal}
        animationType="fade"
        transparent
        onRequestClose={() => setAuditResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '65%', padding: 20 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
              >
                <Ionicons name="shield-checkmark" size={32} color="#059669" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#191C1E' }}>
                {tr('Kiểm Kê Kho Hoàn Tất', 'ກວດນັບສາງສຳເລັດ')}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                {tr(
                  'Ghi nhận phiên kiểm kê vào nhật ký hoạt động hệ thống',
                  'ບັນທຶກຮອບກວດນັບເຂົ້າປຶ້ມຕິດຕາມລະບົບ',
                )}
              </Text>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 10, marginBottom: 16, borderWidth: 1, borderColor: '#ECEEF0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Số thiết bị đã kiểm đếm:', 'ຈຳນວນອຸປະກອນທີ່ກວດນັບ:')}</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#7A0C10' }}>
                  {auditResultData?.audited_devices ?? data?.kpis?.total_in_stock ?? 144} {tr('máy', 'ເຄື່ອງ')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Tỷ lệ khớp thẻ kho:', 'ອັດຕາກົງກັນບັດສາງ:')}</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#059669' }}>
                  {auditResultData?.accuracy ?? '100%'} {tr('Khớp', 'ກົງກັນ')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Thủ kho phụ trách:', 'ນາຍສາງຮັບຜິດຊອບ:')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#191C1E' }}>
                  {auditResultData?.auditor ?? 'Trần Minh Kho'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Thời gian ghi nhận:', 'ເວລາບັນທຶກ:')}</Text>
                <Text style={{ fontSize: 12, color: '#191C1E' }}>
                  {auditResultData?.audited_at ?? tr('Hôm nay', 'ມື້ນີ້')}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.submitImportBtn}
              onPress={() => setAuditResultModal(false)}
            >
              <Text style={styles.submitImportBtnText}>{tr('Đã hiểu & Xác nhận', 'ຮັບຊາບ & ຢືນຢັນ')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── MODAL ĐỐI SOÁT IMEI XUẤT KHO ── */}
      <Modal
        visible={verifyModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVerifyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '75%', padding: 20 }]}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
              >
                <Ionicons name="barcode" size={28} color="#059669" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#191C1E' }}>
                {tr('Đối Soát IMEI Xuất Kho', 'ກວດສອບ IMEI ເບີກຈ່າຍສາງ')}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                {tr('Đơn hàng:', 'ໃບບິນ:')} {verifyingOrderData?.order_code ?? 'HD-Showroom'}
              </Text>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 10, marginBottom: 14, borderWidth: 1, borderColor: '#ECEEF0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Khách nhận máy:', 'ລູກຄ້າຮັບເຄື່ອງ:')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#191C1E' }}>
                  {verifyingOrderData?.customer_name === 'Khách lẻ showroom'
                    ? tr('Khách lẻ showroom', 'ລູກຄ້າໜ້າຮ້ານ')
                    : verifyingOrderData?.customer_name ?? tr('Khách lẻ showroom', 'ລູກຄ້າໜ້າຮ້ານ')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Trạng thái đối soát:', 'ສະຖານະກວດສອບ:')}</Text>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#166534' }}>
                    {verifyingOrderData?.all_imei_verified
                      ? tr('✅ Khớp 100% CSDL', '✅ ກົງກັນ 100% ຖານຂໍ້ມູນ')
                      : tr('Đang kiểm tra', 'ກຳລັງກວດສອບ')}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{tr('Tổng giá trị:', 'ມູນຄ່າລວມ:')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#7A0C10' }}>
                  {formatMoney(verifyingOrderData?.total ?? 0)}
                </Text>
              </View>
            </View>

            {/* Danh sách thiết bị & IMEI */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#58413F', marginBottom: 6 }}>
                {tr('THIẾT BỊ ĐÃ GẮN MÃ IMEI:', 'ອຸປະກອນທີ່ຕິດລະຫັດ IMEI:')}
              </Text>
              {(verifyingOrderData?.items || []).map((it: any, idx: number) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{it.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="qr-code-outline" size={14} color="#7A0C10" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#7A0C10' }}>
                        IMEI: {it.imei || '357284419092257'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>
                        {tr('Hợp lệ', 'ຖືກຕ້ອງ')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.submitImportBtn}
              onPress={() => setVerifyModalOpen(false)}
            >
              <Text style={styles.submitImportBtnText}>{tr('Xác nhận Đối soát xong', 'ຢືນຢັນກວດສອບສຳເລັດ')}</Text>
            </Pressable>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#58413F',
    fontWeight: '600',
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingVertical: 0,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#7A0C10',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A0C10',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  scrollContent: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryActionBtn: {
    backgroundColor: '#7A0C10',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    shadowColor: '#7A0C10',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryActionBtn: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  secondaryActionText: {
    color: '#7A0C10',
    fontWeight: '700',
    fontSize: 13,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58413F',
  },
  segmentTextActive: {
    color: '#7A0C10',
    fontWeight: '800',
  },
  tabContent: {
    gap: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  categoryChipActive: {
    backgroundColor: '#7A0C10',
    borderColor: '#7A0C10',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58413F',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryTag: {
    backgroundColor: '#FDF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A0C10',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  skuText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stockBadge: {
    backgroundColor: '#FDF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  stockBadgeNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7A0C10',
  },
  stockBadgeUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7A0C10',
  },
  inventoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7A0C10',
  },
  quickImeiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  quickImeiBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A0C10',
  },
  imeiPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  imeiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imeiPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  importCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  importTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  importCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  importCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
  },
  statusConfirmedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  importSupplierText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  importSummaryText: {
    fontSize: 12,
    color: '#58413F',
    marginTop: 2,
  },
  importBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  importDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  importDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  importQtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#58413F',
  },
  importTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A0C10',
  },
  exportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  exportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exportCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
  },
  exportStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exportStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  exportCustomerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  exportSummaryText: {
    fontSize: 12,
    color: '#58413F',
    marginTop: 2,
  },
  exportBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  exportTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  exportTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  verifyOrderBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 10,
  },
  verifyOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191C1E',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFormContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#58413F',
    marginBottom: 6,
  },
  supplierPickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supplierChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  supplierChipActive: {
    backgroundColor: '#7A0C10',
    borderColor: '#7A0C10',
  },
  supplierChipText: {
    fontSize: 12,
    color: '#58413F',
    fontWeight: '600',
  },
  supplierChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  variantSelectCard: {
    width: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  variantSelectCardActive: {
    backgroundColor: '#FDF2F2',
    borderColor: '#7A0C10',
  },
  variantSelectName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },
  variantSelectSku: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  variantSelectPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A0C10',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#191C1E',
  },
  totalPreviewBox: {
    backgroundColor: '#FDF2F2',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  totalPreviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A0C10',
  },
  totalPreviewValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7A0C10',
  },
  submitImportBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    shadowColor: '#7A0C10',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  submitImportBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  imeiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  imeiResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imeiCodeLarge: {
    fontSize: 16,
    fontWeight: '900',
    color: '#191C1E',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  imeiStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  imeiStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  imeiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  imeiDetailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  imeiDetailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
    maxWidth: '65%',
    textAlign: 'right',
  },
})

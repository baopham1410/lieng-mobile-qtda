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
  fetchWarehouseDashboard,
  ImeiScanResult,
  InventoryVariantItem,
  scanWarehouseImei,
  StockImportSummary,
  WarehouseDashboardResponse,
} from '@/api/warehouse'
import { ScannerModal } from '@/components/ScannerModal'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney } from '@/utils/format'

export function WarehouseStockCenter() {
  const router = useRouter()
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
      Alert.alert('Kiểm kê thành công', res.message ?? 'Đã hoàn tất kiểm kê 100% kho thiết bị.')
      loadData()
    } catch (err) {
      Alert.alert('Lỗi kiểm kê', 'Không thể hoàn tất kiểm kê kho.')
    } finally {
      setAuditing(false)
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
        <Text style={styles.loadingText}>Đang tải dữ liệu kho thực tế...</Text>
      </View>
    )
  }

  const kpis = data?.kpis

  return (
    <View style={styles.container}>
      {/* ── TOOLBAR / SCANNER BAR (Chuẩn màu Brand Lieng) ── */}
      <View style={styles.topToolbar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#7A0C10" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên máy, SKU, số IMEI..."
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
          accessibilityLabel="Bắn mã IMEI"
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
            <Text style={[styles.kpiLabel, { color: '#7A0C10' }]}>TỒN SẴN SÀNG</Text>
            <Text style={[styles.kpiValue, { color: '#7A0C10' }]}>
              {kpis?.total_in_stock ?? 0} <Text style={styles.kpiUnit}>máy</Text>
            </Text>
            <Text style={styles.kpiSub}>Khớp 100% thẻ kho</Text>
          </View>

          {/* Card 2: Đã xuất bán (Emerald hoàn tất) */}
          <View style={[styles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-up-circle" size={20} color="#059669" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#059669' }]}>ĐÃ XUẤT BÁN</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>
              {kpis?.total_exported ?? 0} <Text style={styles.kpiUnit}>máy</Text>
            </Text>
            <Text style={styles.kpiSub}>Đơn hoàn tất</Text>
          </View>

          {/* Card 3: Phiếu nhập */}
          <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="receipt" size={20} color="#2563EB" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#2563EB' }]}>PHIẾU NHẬP</Text>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
              {kpis?.total_imports ?? 0} <Text style={styles.kpiUnit}>phiếu</Text>
            </Text>
            <Text style={styles.kpiSub}>Từ NCC chính hãng</Text>
          </View>

          {/* Card 4: Chờ xuất kho */}
          <View style={[styles.kpiCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="time" size={20} color="#E11D48" />
            </View>
            <Text style={[styles.kpiLabel, { color: '#E11D48' }]}>CHỜ XUẤT KHO</Text>
            <Text style={[styles.kpiValue, { color: '#E11D48' }]}>
              {kpis?.pending_orders ?? 0} <Text style={styles.kpiUnit}>đơn</Text>
            </Text>
            <Text style={styles.kpiSub}>Cần chuẩn bị máy</Text>
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
            <Text style={styles.primaryActionText}>+ Lập phiếu nhập kho</Text>
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
                <Text style={styles.secondaryActionText}>Kiểm kê kho</Text>
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
              Tồn kho ({data?.inventory?.length ?? 0})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, activeTab === 'imports' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('imports')}
          >
            <Text style={[styles.segmentText, activeTab === 'imports' && styles.segmentTextActive]}>
              Lịch sử nhập ({data?.recent_imports?.length ?? 0})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, activeTab === 'export_orders' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('export_orders')}
          >
            <Text style={[styles.segmentText, activeTab === 'export_orders' && styles.segmentTextActive]}>
              Chờ xuất ({data?.export_orders?.length ?? 0})
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
                    {cat === 'all' ? 'Tất cả danh mục' : cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredInventory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="file-tray-outline" size={36} color="#A8A29E" />
                <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm tồn kho</Text>
                <Text style={styles.emptyDesc}>Hãy kiểm tra từ khóa tìm kiếm hoặc lọc danh mục khác.</Text>
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
                      <Text style={styles.stockBadgeUnit}>máy tồn</Text>
                    </View>
                  </View>

                  {/* Price & IMEI Section */}
                  <View style={styles.inventoryFooter}>
                    <Text style={styles.priceText}>{formatMoney(item.price)}</Text>
                    <Pressable
                      style={styles.quickImeiBtn}
                      onPress={() => {
                        if (item.imei_list.length > 0) {
                          handleScanImei(item.imei_list[0])
                        } else {
                          Alert.alert('Không có máy', 'Sản phẩm này hiện đã hết hàng trong kho.')
                        }
                      }}
                    >
                      <Ionicons name="hardware-chip-outline" size={14} color="#7A0C10" />
                      <Text style={styles.quickImeiBtnText}>
                        {item.imei_list.length > 0 ? `Tra IMEI (${item.imei_list.length})` : 'Hết IMEI'}
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
                            +{item.imei_list.length - 3} máy khác
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
                    <Text style={styles.statusConfirmedText}>{imp.status_label}</Text>
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
                    <Text style={styles.importQtyText}>{imp.item_count} thiết bị</Text>
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
            {data?.export_orders.map((ord) => (
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
                      {ord.status_label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.exportCustomerText}>
                  Khách: {ord.customer_name} {ord.customer_phone ? `(${ord.customer_phone})` : ''}
                </Text>
                <Text style={styles.exportSummaryText}>{ord.summary}</Text>

                <View style={styles.exportBottomRow}>
                  <Text style={styles.exportTimeText}>{ord.time}</Text>
                  <Text style={styles.exportTotalText}>{formatMoney(ord.total)}</Text>
                </View>

                <Pressable
                  style={styles.verifyOrderBtn}
                  onPress={() => router.push('/(app)/(tabs)/orders')}
                >
                  <Ionicons name="checkmark-done-circle-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.verifyOrderBtnText}>Xem đơn & Kiểm tra IMEI xuất kho</Text>
                </Pressable>
              </View>
            ))}
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
                <Text style={styles.modalTitle}>Lập phiếu nhập kho thiết bị</Text>
                <Text style={styles.modalSubtitle}>Lưu trực tiếp vào CSDL & Sinh mã IMEI tồn kho</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setCreateModalOpen(false)}>
                <Ionicons name="close" size={20} color="#1C1B1F" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              {/* Supplier selector */}
              <Text style={styles.inputLabel}>Nhà cung cấp:</Text>
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
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Chọn dòng máy / Phiên bản:</Text>
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
                  <Text style={styles.inputLabel}>Số lượng máy:</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    value={importQty}
                    onChangeText={setImportQty}
                    placeholder="VD: 2"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Giá nhập mỗi máy (vnđ):</Text>
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
                Danh sách IMEI (Tùy chọn, tự động sinh nếu để trống):
              </Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                placeholder="Nhập các số IMEI cách nhau bởi dấu phẩy hoặc xuống dòng..."
                value={customImeiText}
                onChangeText={setCustomImeiText}
              />

              {/* Notes */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Ghi chú phiếu nhập:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Lô hàng chính hãng từ Apple/FPT Synnex..."
                value={importNotes}
                onChangeText={setImportNotes}
              />

              {/* Total preview (Chuẩn màu Brand Lieng) */}
              <View style={styles.totalPreviewBox}>
                <Text style={styles.totalPreviewLabel}>Tổng giá trị phiếu nhập:</Text>
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
                    <Text style={styles.submitImportBtnText}>Xác nhận Nhập Kho</Text>
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
                <Text style={styles.modalTitle}>Chi tiết Thiết bị IMEI</Text>
                <Text style={styles.modalSubtitle}>Dữ liệu thực tế từ cơ sở dữ liệu kho</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setImeiDetailModal(false)}>
                <Ionicons name="close" size={20} color="#1C1B1F" />
              </Pressable>
            </View>

            {imeiLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#7A0C10" />
                <Text style={{ marginTop: 12, color: '#58413F' }}>Đang tra cứu số IMEI...</Text>
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
                        {scannedImei.status_label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>Tên thiết bị:</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.product?.name}</Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>Danh mục:</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.product?.category}</Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>SKU:</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.product?.sku}</Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>Giá niêm yết:</Text>
                  <Text style={[styles.imeiDetailVal, { color: '#7A0C10', fontWeight: '800' }]}>
                    {formatMoney(scannedImei.product?.price ?? 0)}
                  </Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>Giá nhập kho:</Text>
                  <Text style={styles.imeiDetailVal}>
                    {formatMoney(scannedImei.product?.import_cost ?? 0)}
                  </Text>
                </View>
                <View style={styles.imeiDetailRow}>
                  <Text style={styles.imeiDetailLabel}>Ngày nhập kho:</Text>
                  <Text style={styles.imeiDetailVal}>{scannedImei.imported_at ?? 'Gần đây'}</Text>
                </View>

                <Pressable
                  style={[styles.submitImportBtn, { marginTop: 20 }]}
                  onPress={() => setImeiDetailModal(false)}
                >
                  <Text style={styles.submitImportBtnText}>Đóng thông tin</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626', marginTop: 10 }}>
                  Không tìm thấy thiết bị
                </Text>
                <Text style={{ fontSize: 13, color: '#58413F', textAlign: 'center', marginTop: 8 }}>
                  {scannedImei?.message ?? `Số IMEI ${scannedImei?.imei} chưa từng được nhập vào hệ thống.`}
                </Text>
                <Pressable
                  style={[styles.submitImportBtn, { marginTop: 20, width: '100%' }]}
                  onPress={() => setImeiDetailModal(false)}
                >
                  <Text style={styles.submitImportBtnText}>Đã hiểu</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Scanner Barcode Simulation Modal */}
      <ScannerModal
        visible={scannerOpen}
        title="Quét Barcode / Số IMEI"
        hint="Di chuyển camera vào mã vạch trên hộp thiết bị hoặc quét tem phụ"
        onScan={handleScanImei}
        onClose={() => setScannerOpen(false)}
      />
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

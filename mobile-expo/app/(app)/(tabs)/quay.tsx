import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getErrorMessage } from '@/api/client'
import * as quanApi from '@/api/quan'
import {
  AlertBox,
  Chip,
  EntryRow,
  Eyebrow,
  Field,
  MoneyField,
  Muted,
  PrimaryButton,
  ProductShelfCard,
  SearchBox,
  StatCard,
} from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import type { QuanCategory, QuanEntry, QuanProduct, QuanStats } from '@/types'
import { formatDateTimeVi, formatMoney, parseMoneyInput } from '@/utils/format'
import { canManageQuanStatements } from '@/utils/permissions'

const emptyStats: QuanStats = {
  incomeToday: 0,
  expenseToday: 0,
  cashToday: 0,
  transferToday: 0,
  netToday: 0,
  salesCountToday: 0,
  expenseCountToday: 0,
}

export default function QuayScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { t, cat } = useLocale()
  const canArchive = canManageQuanStatements(user)

  // Data
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [products, setProducts] = useState<QuanProduct[]>([])
  const [categories, setCategories] = useState<QuanCategory[]>(quanApi.DEFAULT_QUAN_CATEGORIES)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [entries, setEntries] = useState<QuanEntry[]>([])
  const [stats, setStats] = useState<QuanStats>(emptyStats)

  // Sell Modal
  const [sellProduct, setSellProduct] = useState<QuanProduct | null>(null)
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [qty, setQty] = useState(1)
  const [sellMethod, setSellMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash')
  const [sellCashInput, setSellCashInput] = useState('')
  const [savingSell, setSavingSell] = useState(false)

  // Product Add / Edit Modal
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('dich-vu')
  const [productPrice, setProductPrice] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)

  // Quick Expense Modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseMethod, setExpenseMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash')
  const [expenseCashInput, setExpenseCashInput] = useState('')
  const [expenseNote, setExpenseNote] = useState('')
  const [savingExpense, setSavingExpense] = useState(false)

  // Edit Entry Modal
  const [editingEntry, setEditingEntry] = useState<QuanEntry | null>(null)
  const [editEntryTitle, setEditEntryTitle] = useState('')
  const [editEntryAmount, setEditEntryAmount] = useState('')
  const [editEntryMethod, setEditEntryMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash')
  const [editEntryCashInput, setEditEntryCashInput] = useState('')
  const [savingEditEntry, setSavingEditEntry] = useState(false)

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2500)
  }

  const load = useCallback(async () => {
    setError('')
    try {
      const [prodResult, result] = await Promise.all([
        quanApi.fetchQuanProducts({ active_only: true }),
        quanApi.fetchQuanEntries('today', 200),
      ])
      setProducts(prodResult.rows.filter((p) => p.isActive))
      setCategories(prodResult.categories)
      setEntries(result.rows)
      setStats(result.stats)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Computed data
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryFilter !== 'all' && (p.category || 'khac') !== categoryFilter) {
        return false
      }
      if (q && !p.name.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [products, categoryFilter, searchQuery])

  const productsByCategory = useMemo(() => {
    const map = new Map<string, { value: string; label: string; items: QuanProduct[] }>()
    for (const c of categories) {
      map.set(c.value, { ...c, items: [] })
    }
    for (const p of filteredProducts) {
      const key = p.category || 'khac'
      if (!map.has(key)) {
        map.set(key, { value: key, label: p.categoryLabel || key, items: [] })
      }
      map.get(key)!.items.push(p)
    }
    return [...map.values()].filter((g) => g.items.length > 0)
  }, [categories, filteredProducts])

  const salesToday = useMemo(() => entries.filter((e) => e.type === 'income'), [entries])
  const expensesToday = useMemo(() => entries.filter((e) => e.type === 'expense'), [entries])

  const soldByProduct = useMemo(() => {
    const map = new Map<string, { title: string; qty: number; amount: number }>()
    for (const row of salesToday) {
      const key = row.quanProductId ? `p-${row.quanProductId}` : `t-${row.title}`
      const cur = map.get(key) || { title: row.title, qty: 0, amount: 0 }
      cur.qty += row.qty || 1
      cur.amount += row.amount
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount)
  }, [salesToday])

  // Sell actions
  function openSell(product: QuanProduct) {
    setSellProduct(product)
    setUnitPriceInput(String(Math.round(product.price)))
    setQty(1)
    setSellMethod('cash')
    setSellCashInput('')
  }

  function closeSell() {
    setSellProduct(null)
    setUnitPriceInput('')
    setQty(1)
    setSellMethod('cash')
    setSellCashInput('')
  }

  const sellTotal = parseMoneyInput(unitPriceInput) * qty
  const sellTransferAmount =
    sellMethod === 'mixed'
      ? Math.max(0, sellTotal - parseMoneyInput(sellCashInput))
      : sellMethod === 'transfer'
        ? sellTotal
        : 0

  async function confirmSell() {
    if (!sellProduct) return
    const unitPrice = parseMoneyInput(unitPriceInput)
    if (unitPrice <= 0) {
      Alert.alert(t('common.error'), t('quay.needPrice'))
      return
    }
    const total = unitPrice * qty
    setSavingSell(true)
    try {
      const payload: Record<string, unknown> = {
        type: 'income',
        quan_product_id: sellProduct.id,
        qty,
        amount: unitPrice,
        payment_method: sellMethod,
      }
      if (sellMethod === 'cash') {
        payload.cash_amount = total
        payload.transfer_amount = 0
      } else if (sellMethod === 'transfer') {
        payload.cash_amount = 0
        payload.transfer_amount = total
      } else {
        const cash = parseMoneyInput(sellCashInput)
        if (cash <= 0 || cash >= total) {
          throw new Error('Số tiền mặt phải lớn hơn 0 và nhỏ hơn tổng thu.')
        }
        payload.cash_amount = cash
        payload.transfer_amount = Math.max(0, total - cash)
      }

      await quanApi.createQuanEntry(payload)
      closeSell()
      showFlash(`Đã bán: ${sellProduct.name} · ${formatMoney(total)}`)
      await load()
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSavingSell(false)
    }
  }

  // Product Add / Edit
  function openAddProduct() {
    setEditingProductId(null)
    setProductName('')
    setProductCategory(categoryFilter !== 'all' ? categoryFilter : 'dich-vu')
    setProductPrice('')
    setProductModalOpen(true)
  }

  function openEditProduct(product: QuanProduct) {
    setEditingProductId(product.id)
    setProductName(product.name)
    setProductCategory(product.category || 'khac')
    setProductPrice(String(Math.round(product.price)))
    setProductModalOpen(true)
  }

  async function saveProduct() {
    const name = productName.trim()
    const price = parseMoneyInput(productPrice)
    if (!name) {
      Alert.alert(t('common.error'), t('quay.needName'))
      return
    }
    if (price <= 0) {
      Alert.alert(t('common.error'), t('quay.needRefPrice'))
      return
    }

    setSavingProduct(true)
    try {
      if (editingProductId) {
        await quanApi.updateQuanProduct(editingProductId, {
          name,
          category: productCategory || 'khac',
          price,
        })
        showFlash(`Đã cập nhật: ${name}`)
      } else {
        await quanApi.createQuanProduct({
          name,
          category: productCategory || 'khac',
          price,
        })
        showFlash(`Đã thêm: ${name}`)
      }
      setProductModalOpen(false)
      await load()
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSavingProduct(false)
    }
  }

  async function deleteProduct() {
    if (!editingProductId) return
    Alert.alert('Xóa sản phẩm', 'Ẩn sản phẩm này khỏi danh sách quầy?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await quanApi.deleteQuanProduct(editingProductId)
            setProductModalOpen(false)
            showFlash('Đã ẩn sản phẩm')
            await load()
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e))
          }
        },
      },
    ])
  }

  // Quick Expense
  function openExpenseModal() {
    setExpenseTitle('')
    setExpenseAmount('')
    setExpenseMethod('cash')
    setExpenseCashInput('')
    setExpenseNote('')
    setExpenseModalOpen(true)
  }

  async function saveExpense() {
    const title = expenseTitle.trim()
    const amount = parseMoneyInput(expenseAmount)
    if (!title) {
      Alert.alert(t('common.error'), 'Vui lòng nhập tên khoản chi.')
      return
    }
    if (amount <= 0) {
      Alert.alert(t('common.error'), 'Số tiền chi phải lớn hơn 0.')
      return
    }

    setSavingExpense(true)
    try {
      const payload: Record<string, unknown> = {
        type: 'expense',
        title,
        amount,
        payment_method: expenseMethod,
        note: expenseNote.trim() || undefined,
      }
      if (expenseMethod === 'cash') {
        payload.cash_amount = amount
        payload.transfer_amount = 0
      } else if (expenseMethod === 'transfer') {
        payload.cash_amount = 0
        payload.transfer_amount = amount
      } else {
        const cash = parseMoneyInput(expenseCashInput)
        if (cash <= 0 || cash >= amount) {
          throw new Error('Số tiền mặt phải lớn hơn 0 và nhỏ hơn tổng chi.')
        }
        payload.cash_amount = cash
        payload.transfer_amount = Math.max(0, amount - cash)
      }

      await quanApi.createQuanEntry(payload)
      setExpenseModalOpen(false)
      showFlash(`Đã ghi chi: ${title} · ${formatMoney(amount)}`)
      await load()
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSavingExpense(false)
    }
  }

  // Edit / Delete Entry
  function openEditEntry(entry: QuanEntry) {
    setEditingEntry(entry)
    setEditEntryTitle(entry.title)
    setEditEntryAmount(String(Math.round(entry.amount)))
    setEditEntryMethod((entry.paymentMethod as 'cash' | 'transfer' | 'mixed') || 'cash')
    setEditEntryCashInput(entry.cashAmount ? String(Math.round(entry.cashAmount)) : '')
  }

  async function saveEditEntry() {
    if (!editingEntry) return
    const title = editEntryTitle.trim()
    const amount = parseMoneyInput(editEntryAmount)
    if (!title) {
      Alert.alert(t('common.error'), 'Vui lòng nhập nội dung giao dịch.')
      return
    }
    if (amount <= 0) {
      Alert.alert(t('common.error'), 'Số tiền phải lớn hơn 0.')
      return
    }

    setSavingEditEntry(true)
    try {
      const payload: Record<string, unknown> = {
        title,
        amount,
        payment_method: editEntryMethod,
      }
      if (editEntryMethod === 'cash') {
        payload.cash_amount = amount
        payload.transfer_amount = 0
      } else if (editEntryMethod === 'transfer') {
        payload.cash_amount = 0
        payload.transfer_amount = amount
      } else {
        const cash = parseMoneyInput(editEntryCashInput)
        payload.cash_amount = cash
        payload.transfer_amount = Math.max(0, amount - cash)
      }

      await quanApi.updateQuanEntry(editingEntry.id, payload)
      setEditingEntry(null)
      showFlash('Đã cập nhật giao dịch')
      await load()
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSavingEditEntry(false)
    }
  }

  async function deleteEntry(entry: QuanEntry) {
    Alert.alert('Xóa giao dịch', `Xác nhận xóa "${entry.title}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await quanApi.deleteQuanEntry(entry.id)
            showFlash('Đã xóa giao dịch')
            await load()
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e))
          }
        },
      },
    ])
  }

  async function archiveToday() {
    try {
      const s = await quanApi.saveQuanStatement({ force: true })
      showFlash(`Đã lưu sao kê vào kho: ${s.statementDate || ''}`)
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    }
  }

  const paymentDetailText = (row: QuanEntry) => {
    if (row.paymentMethod === 'cash') return 'TM'
    if (row.paymentMethod === 'transfer') return 'CK'
    if (row.paymentMethod === 'mixed') return 'TM + CK'
    return 'TM'
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 10 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={Colors.brand}
            onRefresh={() => {
              setRefreshing(true)
              load()
            }}
          />
        }
      >
        {/* Flash banner */}
        {!!flash && (
          <View style={styles.flashBanner}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.greenDeep} />
            <Text style={styles.flashText}>{flash}</Text>
          </View>
        )}

        {/* Header — Đồng bộ thanh tiêu đề Web */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Eyebrow>QUẦY BÁN HÀNG</Eyebrow>
            <Text style={styles.headerTitle}>Quản lý Quán</Text>
            <Muted>Quầy bán nhanh, ghi chi và sao kê ngày</Muted>
          </View>
          <Pressable onPress={() => load()} style={styles.syncBtn} hitSlop={6}>
            <Ionicons name="refresh" size={18} color={Colors.slate600} />
          </Pressable>
        </View>

        {/* Nút hành động nhanh (Toolbar) */}
        <View style={styles.quickBar}>
          <PrimaryButton
            label="+ Thêm SP"
            tone="green"
            size="sm"
            onPress={openAddProduct}
            icon="add"
          />
          <PrimaryButton
            label="+ Ghi chi"
            tone="outline"
            size="sm"
            onPress={openExpenseModal}
            icon="receipt-outline"
          />
          {canArchive && (
            <PrimaryButton
              label="Lưu kho"
              tone="slate"
              size="sm"
              onPress={archiveToday}
              icon="save-outline"
            />
          )}
        </View>

        {/* Banner dẫn vào Thẩm định máy (Chừa chỗ theo roadmap TD-01) */}
        <Pressable
          onPress={() => router.push('/(app)/appraisal')}
          style={({ pressed }) => [styles.appraisalBanner, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.appraisalLeft}>
            <View style={styles.appraisalIconWrap}>
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.amber900} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.appraisalTitle}>Thẩm định & Thu cũ đổi mới</Text>
                <View style={styles.devTag}>
                  <Text style={styles.devTagText}>Đang phát triển</Text>
                </View>
              </View>
              <Text style={styles.appraisalSub}>Tạo phiếu định giá máy cũ khách mang tới quầy</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.slate400} />
        </Pressable>

        {/* 3 Thẻ thống kê — Đồng bộ AppStatCard Web */}
        <View style={styles.statCardsRow}>
          <StatCard
            label="Thu hôm nay"
            value={formatMoney(stats.incomeToday)}
            hint={`${stats.salesCountToday} món`}
            icon="income"
            iconColor={Colors.green}
            iconBg={Colors.greenSoft}
            valueColor={Colors.greenDeep}
          />
          <StatCard
            label="Chi hôm nay"
            value={formatMoney(stats.expenseToday)}
            hint={`${stats.expenseCountToday} khoản`}
            icon="expense"
            iconColor={Colors.red}
            iconBg={Colors.redSoft}
            valueColor={Colors.red}
          />
          <StatCard
            label="Còn lại"
            value={formatMoney(stats.netToday)}
            hint="Thu − Chi"
            icon="net"
            iconColor={stats.netToday >= 0 ? Colors.green : Colors.red}
            iconBg={stats.netToday >= 0 ? Colors.greenSoft : Colors.redSoft}
            valueColor={stats.netToday >= 0 ? Colors.greenDeep : Colors.red}
          />
        </View>

        {/* Tóm tắt phương thức thu (TM / CK) */}
        <View style={styles.paymentSummaryBar}>
          <View style={styles.paySumCol}>
            <Text style={styles.paySumLabel}>Tiền mặt nhận</Text>
            <Text style={styles.paySumCash}>{formatMoney(stats.cashToday)}</Text>
          </View>
          <View style={styles.paySumDivider} />
          <View style={styles.paySumCol}>
            <Text style={styles.paySumLabel}>Chuyển khoản</Text>
            <Text style={styles.paySumTransfer}>{formatMoney(stats.transferToday)}</Text>
          </View>
        </View>

        {!!error && <AlertBox message={error} />}

        {/* Khung sản phẩm theo danh mục — Panel chuẩn Web */}
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelTitle}>Sản phẩm theo danh mục</Text>
              <Text style={styles.panelSub}>
                Giá trên thẻ là giá tham chiếu — mỗi lần bán có thể chỉnh lại.
              </Text>
            </View>
          </View>

          {/* Ô tìm kiếm */}
          <View style={{ marginTop: 10 }}>
            <SearchBox
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </View>

          {/* Dải Tag lọc danh mục (Pills chuẩn Web) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            style={{ marginTop: 10 }}
          >
            <Chip
              label="Tất cả"
              count={products.length}
              active={categoryFilter === 'all'}
              onPress={() => setCategoryFilter('all')}
            />
            {categories.map((c) => {
              const count = products.filter((p) => (p.category || 'khac') === c.value).length
              return (
                <Chip
                  key={c.value}
                  label={cat(c.value, c.label)}
                  count={count}
                  active={categoryFilter === c.value}
                  onPress={() => setCategoryFilter(c.value)}
                />
              )
            })}
          </ScrollView>

          {/* Danh sách thẻ sản phẩm */}
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={Colors.brand} />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyProductsBox}>
              <Ionicons name="basket-outline" size={36} color={Colors.slate400} />
              <Text style={styles.emptyProductsText}>Không có sản phẩm nào</Text>
              <Pressable onPress={openAddProduct} style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>+ Thêm sản phẩm mới</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.groupsContainer}>
              {productsByCategory.map((group) => (
                <View key={group.value} style={styles.categoryGroup}>
                  {/* Category Section Header với đường kẻ chuẩn Web */}
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>{group.label}</Text>
                    <View style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>{group.items.length}</Text>
                    </View>
                    <View style={styles.groupLine} />
                  </View>

                  <View style={styles.productGrid}>
                    {group.items.map((p) => (
                      <ProductShelfCard
                        key={p.id}
                        name={p.name}
                        categoryLabel={cat(p.category, p.categoryLabel || 'Khác')}
                        price={p.price}
                        formattedPrice={formatMoney(p.price)}
                        onSell={() => openSell(p)}
                        onEdit={() => openEditProduct(p)}
                        selling={sellProduct?.id === p.id && savingSell}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Khung Tổng kết cuối ngày — Đồng bộ Cột phải Web */}
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <View>
              <Eyebrow>CUỐI NGÀY</Eyebrow>
              <Text style={styles.panelTitle}>Tổng kết hôm nay</Text>
            </View>
            <Pressable onPress={() => load()} style={styles.smallRefreshBtn}>
              <Text style={styles.smallRefreshText}>Làm mới</Text>
            </Pressable>
          </View>

          {/* Bán theo mặt hàng */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>BÁN THEO MẶT HÀNG</Text>
            {soldByProduct.length === 0 ? (
              <Text style={styles.emptyText}>Chưa bán món nào hôm nay.</Text>
            ) : (
              <View style={styles.soldItemsList}>
                {soldByProduct.map((item, idx) => (
                  <View key={idx} style={styles.soldItemRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.soldItemName} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.soldItemQty}>x{item.qty}</Text>
                    </View>
                    <Text style={styles.soldItemAmount}>{formatMoney(item.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Chi trong ngày */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>CHI TRONG NGÀY</Text>
            {expensesToday.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có khoản chi nào.</Text>
            ) : (
              <View style={styles.entriesList}>
                {expensesToday.map((e) => (
                  <EntryRow
                    key={e.id}
                    title={e.title}
                    subtitle={e.occurredAt ? formatDateTimeVi(e.occurredAt) : undefined}
                    amount={formatMoney(e.amount)}
                    income={false}
                    paymentBadge={paymentDetailText(e)}
                    onEdit={() => openEditEntry(e)}
                    onDelete={() => deleteEntry(e)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Lịch sử bán hôm nay */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>LỊCH SỬ BÁN HÔM NAY</Text>
            {salesToday.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có đơn bán nào hôm nay.</Text>
            ) : (
              <View style={styles.entriesList}>
                {salesToday.map((e) => (
                  <EntryRow
                    key={e.id}
                    title={e.title}
                    subtitle={e.occurredAt ? formatDateTimeVi(e.occurredAt) : undefined}
                    amount={formatMoney(e.amount)}
                    income={true}
                    paymentBadge={paymentDetailText(e)}
                    onEdit={() => openEditEntry(e)}
                    onDelete={() => deleteEntry(e)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: BÁN HÀNG LINH HOẠT */}
      <Modal visible={!!sellProduct} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeSell} />
          <View style={styles.modalSheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.sheetHandle} />
              <Eyebrow>BÁN HÀNG TẠI QUẦY</Eyebrow>
              <Text style={styles.modalMainTitle}>{sellProduct?.name}</Text>
              <Muted>
                Giá catalog: {formatMoney(sellProduct?.price)} · Có thể chỉnh giá riêng lần này
              </Muted>

              <View style={{ height: Space.md }} />
              <MoneyField
                label="Giá bán lần này (VNĐ)"
                value={unitPriceInput}
                onChangeText={setUnitPriceInput}
              />

              <Text style={styles.fieldLabel}>Số lượng</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  style={styles.stepperBtn}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepperVal}>{qty}</Text>
                <Pressable onPress={() => setQty((q) => q + 1)} style={styles.stepperBtn}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>Phương thức thanh toán</Text>
              <View style={styles.methodChips}>
                <Chip
                  label="Tiền mặt"
                  active={sellMethod === 'cash'}
                  onPress={() => setSellMethod('cash')}
                />
                <Chip
                  label="Chuyển khoản"
                  active={sellMethod === 'transfer'}
                  onPress={() => setSellMethod('transfer')}
                />
                <Chip
                  label="Cả hai"
                  active={sellMethod === 'mixed'}
                  onPress={() => setSellMethod('mixed')}
                />
              </View>

              {sellMethod === 'mixed' && (
                <View style={styles.mixedBox}>
                  <MoneyField
                    label="Tiền mặt khách đưa"
                    value={sellCashInput}
                    onChangeText={setSellCashInput}
                    placeholder="0"
                  />
                  <Text style={styles.transferRemainHint}>
                    Phần chuyển khoản còn lại:{' '}
                    <Text style={{ fontWeight: '900', color: Colors.blueDeep }}>
                      {formatMoney(sellTransferAmount)}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Hộp tổng tiền bán */}
              <View style={styles.totalBox}>
                <Text style={styles.totalBoxLabel}>Tổng tiền bán</Text>
                <Text style={styles.totalBoxVal}>{formatMoney(sellTotal)}</Text>
              </View>

              <View style={styles.modalBtns}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Hủy" tone="outline" onPress={closeSell} />
                </View>
                <View style={{ flex: 1.4 }}>
                  <PrimaryButton
                    label={savingSell ? 'Đang lưu...' : 'Xác nhận bán'}
                    tone="green"
                    disabled={savingSell}
                    onPress={confirmSell}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: THÊM / SỬA SẢN PHẨM */}
      <Modal visible={productModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setProductModalOpen(false)} />
          <View style={styles.modalSheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.sheetHandle} />
              <Eyebrow>{editingProductId ? 'SỬA SẢN PHẨM' : 'THÊM SẢN PHẨM'}</Eyebrow>
              <Text style={styles.modalMainTitle}>
                {editingProductId ? 'Chỉnh sửa mặt hàng quầy' : 'Tạo sản phẩm mới'}
              </Text>
              <Muted>Sản phẩm sẽ xuất hiện trên quầy để nhân viên bán nhanh.</Muted>

              <View style={{ height: Space.md }} />
              <Field
                label="Tên sản phẩm"
                placeholder="VD: Thay pin iPhone 11"
                value={productName}
                onChangeText={setProductName}
              />

              <Text style={styles.fieldLabel}>Danh mục</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, marginVertical: 4 }}
              >
                {categories.map((c) => (
                  <Chip
                    key={c.value}
                    label={cat(c.value, c.label)}
                    active={productCategory === c.value}
                    onPress={() => setProductCategory(c.value)}
                  />
                ))}
              </ScrollView>

              <View style={{ height: Space.xs }} />
              <MoneyField
                label="Giá tham chiếu (VNĐ)"
                placeholder="0"
                value={productPrice}
                onChangeText={setProductPrice}
              />

              <View style={styles.modalBtns}>
                {editingProductId ? (
                  <Pressable onPress={deleteProduct} style={styles.deleteProductBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.red} />
                  </Pressable>
                ) : null}
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Hủy"
                    tone="outline"
                    onPress={() => setProductModalOpen(false)}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <PrimaryButton
                    label={savingProduct ? 'Đang lưu...' : 'Lưu sản phẩm'}
                    tone="brand"
                    disabled={savingProduct}
                    onPress={saveProduct}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: GHI KHOẢN CHI */}
      <Modal visible={expenseModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setExpenseModalOpen(false)} />
          <View style={styles.modalSheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.sheetHandle} />
              <Eyebrow>THU CHI TRONG NGÀY</Eyebrow>
              <Text style={styles.modalMainTitle}>Ghi khoản chi mới</Text>
              <Muted>Khoản chi sẽ được trừ trực tiếp vào số dư Còn lại hôm nay.</Muted>

              <View style={{ height: Space.md }} />
              <Field
                label="Nội dung khoản chi"
                placeholder="VD: Mua nước, tiền cơm trưa, mua sim..."
                value={expenseTitle}
                onChangeText={setExpenseTitle}
              />

              <MoneyField
                label="Số tiền chi (VNĐ)"
                placeholder="0"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />

              <Text style={styles.fieldLabel}>Nguồn tiền chi</Text>
              <View style={styles.methodChips}>
                <Chip
                  label="Tiền mặt"
                  active={expenseMethod === 'cash'}
                  onPress={() => setExpenseMethod('cash')}
                />
                <Chip
                  label="Chuyển khoản"
                  active={expenseMethod === 'transfer'}
                  onPress={() => setExpenseMethod('transfer')}
                />
                <Chip
                  label="Cả hai"
                  active={expenseMethod === 'mixed'}
                  onPress={() => setExpenseMethod('mixed')}
                />
              </View>

              {expenseMethod === 'mixed' && (
                <View style={styles.mixedBox}>
                  <MoneyField
                    label="Chi bằng tiền mặt"
                    value={expenseCashInput}
                    onChangeText={setExpenseCashInput}
                  />
                </View>
              )}

              <Field
                label="Ghi chú thêm (tuỳ chọn)"
                placeholder="Ghi chú chi tiết nếu cần..."
                value={expenseNote}
                onChangeText={setExpenseNote}
              />

              <View style={styles.modalBtns}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Hủy"
                    tone="outline"
                    onPress={() => setExpenseModalOpen(false)}
                  />
                </View>
                <View style={{ flex: 1.4 }}>
                  <PrimaryButton
                    label={savingExpense ? 'Đang lưu...' : 'Lưu khoản chi'}
                    tone="red"
                    disabled={savingExpense}
                    onPress={saveExpense}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: SỬA GIAO DỊCH */}
      <Modal visible={!!editingEntry} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setEditingEntry(null)} />
          <View style={styles.modalSheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.sheetHandle} />
              <Eyebrow>SỬA GIAO DỊCH</Eyebrow>
              <Text style={styles.modalMainTitle}>{editingEntry?.title}</Text>

              <View style={{ height: Space.md }} />
              <Field
                label="Tên / Nội dung"
                value={editEntryTitle}
                onChangeText={setEditEntryTitle}
              />

              <MoneyField
                label="Số tiền"
                value={editEntryAmount}
                onChangeText={setEditEntryAmount}
              />

              <Text style={styles.fieldLabel}>Phương thức</Text>
              <View style={styles.methodChips}>
                <Chip
                  label="Tiền mặt"
                  active={editEntryMethod === 'cash'}
                  onPress={() => setEditEntryMethod('cash')}
                />
                <Chip
                  label="Chuyển khoản"
                  active={editEntryMethod === 'transfer'}
                  onPress={() => setEditEntryMethod('transfer')}
                />
                <Chip
                  label="Cả hai"
                  active={editEntryMethod === 'mixed'}
                  onPress={() => setEditEntryMethod('mixed')}
                />
              </View>

              {editEntryMethod === 'mixed' && (
                <View style={styles.mixedBox}>
                  <MoneyField
                    label="Tiền mặt"
                    value={editEntryCashInput}
                    onChangeText={setEditEntryCashInput}
                  />
                </View>
              )}

              <View style={styles.modalBtns}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Hủy"
                    tone="outline"
                    onPress={() => setEditingEntry(null)}
                  />
                </View>
                <View style={{ flex: 1.4 }}>
                  <PrimaryButton
                    label={savingEditEntry ? 'Đang lưu...' : 'Cập nhật'}
                    tone="brand"
                    disabled={savingEditEntry}
                    onPress={saveEditEntry}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  container: {
    paddingHorizontal: Space.md,
    paddingBottom: 110,
    gap: 12,
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.greenBorder,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  flashText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.greenDeep,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.4,
    marginTop: 2,
    marginBottom: 2,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentSummaryBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(254, 243, 199, 0.45)',
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  paySumCol: {
    flex: 1,
  },
  paySumLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
    marginBottom: 2,
  },
  paySumCash: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.greenDeep,
  },
  paySumTransfer: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.blueDeep,
  },
  paySumDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderAmber,
    marginHorizontal: 12,
  },
  panel: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  panelSub: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  emptyProductsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyProductsText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate400,
  },
  emptyAddBtn: {
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    marginTop: 4,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.greenDeep,
  },
  groupsContainer: {
    gap: 16,
    marginTop: 14,
  },
  categoryGroup: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.amber800,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  groupBadge: {
    backgroundColor: Colors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.amber100,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  smallRefreshBtn: {
    backgroundColor: Colors.amber50,
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  smallRefreshText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.amber900,
  },
  sectionBlock: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate400,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  soldItemsList: {
    gap: 6,
  },
  soldItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  soldItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  soldItemQty: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 1,
  },
  soldItemAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.greenDeep,
    letterSpacing: -0.2,
  },
  entriesList: {
    gap: 8,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(17, 17, 24, 0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  modalBody: {
    padding: Space.lg,
    paddingBottom: 38,
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.slate200,
    marginBottom: 6,
  },
  modalMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.amber50,
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
  },
  stepperVal: {
    fontSize: 22,
    fontWeight: '900',
    minWidth: 32,
    textAlign: 'center',
    color: Colors.ink,
  },
  methodChips: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  mixedBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.4)',
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    borderRadius: Radius.md,
    padding: 10,
    gap: 6,
  },
  transferRemainHint: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  totalBoxLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.greenDeep,
  },
  totalBoxVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.greenDeep,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  deleteProductBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appraisalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.panelWarm,
    borderWidth: 1,
    borderColor: Colors.amber200,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: Space.sm,
  },
  appraisalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appraisalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appraisalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  appraisalSub: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  devTag: {
    backgroundColor: Colors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.amber200,
  },
  devTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.amber900,
  },
})

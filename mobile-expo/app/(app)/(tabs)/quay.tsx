import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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
  StatCard,
} from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import type { QuanCategory, QuanEntry, QuanProduct, QuanStats } from '@/types'
import { formatDateTimeVi, formatMoney, parseMoneyInput } from '@/utils/format'
import { canManageQuanStatements } from '@/utils/permissions'

const quayBannerBg = require('../../../assets/images/quay-banner-bg.png')

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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<QuanProduct[]>([])
  const [categories, setCategories] = useState<QuanCategory[]>(quanApi.DEFAULT_QUAN_CATEGORIES)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [entries, setEntries] = useState<QuanEntry[]>([])
  const [stats, setStats] = useState<QuanStats>(emptyStats)

  const [sellProduct, setSellProduct] = useState<QuanProduct | null>(null)
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [qty, setQty] = useState(1)
  const [method, setMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash')
  const [cashInput, setCashInput] = useState('')
  const [saving, setSaving] = useState(false)

  const [productOpen, setProductOpen] = useState(false)
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('dich-vu')
  const [productPrice, setProductPrice] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [prodResult, result] = await Promise.all([
        quanApi.fetchQuanProducts(),
        quanApi.fetchQuanEntries('today'),
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

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return products
    return products.filter((p) => (p.category || 'khac') === categoryFilter)
  }, [products, categoryFilter])

  function openSell(product: QuanProduct) {
    setSellProduct(product)
    setUnitPriceInput(String(Math.round(product.price)))
    setQty(1)
    setMethod('cash')
    setCashInput('')
  }

  function closeSell() {
    setSellProduct(null)
    setUnitPriceInput('')
    setQty(1)
    setMethod('cash')
    setCashInput('')
  }

  async function onSell() {
    if (!sellProduct) return
    const unitPrice = parseMoneyInput(unitPriceInput)
    if (unitPrice <= 0) {
      Alert.alert(t('common.error'), t('quay.needPrice'))
      return
    }
    const total = unitPrice * qty
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        type: 'income',
        quan_product_id: sellProduct.id,
        qty,
        amount: unitPrice,
        payment_method: method,
      }
      if (method === 'mixed') {
        const cash = parseMoneyInput(cashInput)
        if (cash <= 0 || cash >= total) {
          throw new Error(t('quay.mixedCashError'))
        }
        payload.cash_amount = cash
      }
      await quanApi.createQuanEntry(payload)
      closeSell()
      await load()
      Alert.alert(
        t('common.ok'),
        t('quay.soldOk', { name: sellProduct.name, total: formatMoney(total) }),
      )
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function archiveToday() {
    try {
      const s = await quanApi.saveQuanStatement({ force: true })
      Alert.alert(t('quay.saved'), t('quay.savedStatement', { date: s.statementDate }))
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    }
  }

  function openAddProduct() {
    setProductName('')
    setProductCategory(categoryFilter !== 'all' ? categoryFilter : 'dich-vu')
    setProductPrice('')
    setProductOpen(true)
  }

  async function onSaveProduct() {
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
    setSaving(true)
    try {
      const created = await quanApi.createQuanProduct({
        name,
        category: productCategory || 'khac',
        price,
      })
      setProductOpen(false)
      setCategoryFilter(created.category || productCategory || 'all')
      await load()
      Alert.alert(t('quay.added'), `${created.name} · ${formatMoney(created.price)}`)
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const sellTotal = parseMoneyInput(unitPriceInput) * qty

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
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
        <ImageBackground
          source={quayBannerBg}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
        >
          <Text style={styles.heroEyebrow}>{t('app.name')}</Text>
          <Text style={styles.heroHello}>
            {t('quay.hello', { name: user?.name ?? t('quay.owner') })}
          </Text>
          <Text style={styles.heroHint}>{t('quay.balanceHint')}</Text>
          <Text style={styles.heroBalance}>{formatMoney(stats.netToday)}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaText}>
              {t('common.income')} {formatMoney(stats.incomeToday)}
            </Text>
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroMetaText}>
              {t('common.expense')} {formatMoney(stats.expenseToday)}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.quickCard}>
          <View style={styles.statsGrid}>
            <StatCard
              label={t('common.cash')}
              value={formatMoney(stats.cashToday)}
              color={Colors.green}
            />
            <StatCard
              label={t('common.transfer')}
              value={formatMoney(stats.transferToday)}
              color={Colors.blue}
            />
          </View>
          {canArchive ? (
            <Pressable style={styles.archiveBtn} onPress={archiveToday}>
              <Text style={styles.archiveBtnText}>{t('quay.saveStatement')}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.archiveBtn, styles.archiveBtnLocked]}
              onPress={() => Alert.alert(t('perm.lockedTitle'), t('perm.lockedArchive'))}
            >
              <Text style={styles.archiveBtnLockedText}>{t('perm.lockSave')}</Text>
            </Pressable>
          )}
        </View>

        {!!error && <AlertBox message={error} />}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 28 }} color={Colors.brand} />
        ) : (
          <>
            <View style={styles.panel}>
              <View style={styles.panelHeadRow}>
                <View style={{ flex: 1 }}>
                  <Eyebrow>{t('quay.products')}</Eyebrow>
                  <Text style={styles.panelTitle}>{t('quay.byCategory')}</Text>
                  <Muted>{t('quay.priceHint')}</Muted>
                </View>
                <Pressable style={styles.addProductBtn} onPress={openAddProduct}>
                  <Text style={styles.addProductBtnText}>{t('quay.add')}</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                style={{ marginTop: 12 }}
              >
                <Chip
                  label={t('common.all')}
                  active={categoryFilter === 'all'}
                  onPress={() => setCategoryFilter('all')}
                />
                {categories.map((c) => (
                  <Chip
                    key={c.value}
                    label={cat(c.value, c.label)}
                    active={categoryFilter === c.value}
                    onPress={() => setCategoryFilter(c.value)}
                  />
                ))}
              </ScrollView>

              {filteredProducts.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Text style={styles.empty}>{t('quay.emptyProducts')}</Text>
                  <Pressable onPress={openAddProduct}>
                    <Text style={styles.emptyLink}>{t('quay.addProduct')}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.productGrid}>
                  {filteredProducts.map((p) => (
                    <Pressable key={p.id} style={styles.productCard} onPress={() => openSell(p)}>
                      <Text style={styles.productCat} numberOfLines={1}>
                        {cat(p.category, p.categoryLabel || 'Khác')}
                      </Text>
                      <Text style={styles.productName} numberOfLines={2}>
                        {p.name}
                      </Text>
                      <Text style={styles.productPrice}>{formatMoney(p.price)}</Text>
                      <View style={styles.sellPill}>
                        <Text style={styles.sellPillText}>{t('quay.sell')}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionHead}>
              <Eyebrow>{t('common.today')}</Eyebrow>
              <Text style={styles.panelTitle}>{t('quay.transactions')}</Text>
            </View>
            {entries.length === 0 ? (
              <Text style={styles.empty}>{t('quay.emptyTx')}</Text>
            ) : (
              entries.map((e) => (
                <EntryRow
                  key={e.id}
                  title={e.title}
                  subtitle={`${e.type === 'income' ? t('common.income') : t('common.expense')} · ${formatDateTimeVi(e.occurredAt)}`}
                  amount={formatMoney(e.amount)}
                  income={e.type === 'income'}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!sellProduct} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <Pressable style={styles.modalBackdropFill} onPress={closeSell} />
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.modalHandle} />
              <Eyebrow>{t('quay.sellTitle')}</Eyebrow>
              <Text style={styles.modalTitle}>{sellProduct?.name}</Text>
              <Muted>{t('quay.catalogPrice', { price: formatMoney(sellProduct?.price) })}</Muted>
              <View style={{ height: Space.md }} />
              <MoneyField
                label={t('quay.unitPrice')}
                value={unitPriceInput}
                onChangeText={setUnitPriceInput}
              />
              <Text style={styles.fieldHint}>{t('quay.qty')}</Text>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{qty}</Text>
                <Pressable onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>{t('quay.totalIncome')}</Text>
                <Text style={styles.totalValue}>{formatMoney(sellTotal)}</Text>
              </View>
              <View style={styles.chipRow}>
                {(['cash', 'transfer', 'mixed'] as const).map((m) => (
                  <Chip
                    key={m}
                    label={
                      m === 'cash'
                        ? t('common.cash')
                        : m === 'transfer'
                          ? t('common.transfer')
                          : t('common.mixed')
                    }
                    active={method === m}
                    onPress={() => setMethod(m)}
                  />
                ))}
              </View>
              {method === 'mixed' && (
                <MoneyField
                  label={t('quay.cashReceived')}
                  value={cashInput}
                  onChangeText={setCashInput}
                />
              )}
              <View style={styles.modalActions}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label={t('common.cancel')} tone="outline" onPress={closeSell} />
                </View>
                <View style={{ flex: 1 }}>
                  {saving ? (
                    <View style={styles.busyBtn}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                    <PrimaryButton label={t('quay.confirm')} tone="green" onPress={onSell} />
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={productOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <Pressable style={styles.modalBackdropFill} onPress={() => setProductOpen(false)} />
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.modalHandle} />
              <Eyebrow>{t('quay.catalog')}</Eyebrow>
              <Text style={styles.modalTitle}>{t('quay.addProductTitle')}</Text>
              <Muted>{t('quay.addProductHint')}</Muted>
              <View style={{ height: Space.md }} />
              <Field
                label={t('quay.productName')}
                placeholder={t('quay.productNamePh')}
                value={productName}
                onChangeText={setProductName}
              />
              <Text style={styles.fieldHint}>{t('quay.category')}</Text>
              <View style={styles.chipRow}>
                {categories.map((c) => (
                  <Chip
                    key={c.value}
                    label={cat(c.value, c.label)}
                    active={productCategory === c.value}
                    onPress={() => setProductCategory(c.value)}
                  />
                ))}
              </View>
              <View style={{ height: Space.sm }} />
              <MoneyField
                label={t('quay.refPrice')}
                placeholder="0"
                value={productPrice}
                onChangeText={setProductPrice}
              />
              <View style={styles.modalActions}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label={t('common.cancel')}
                    tone="outline"
                    onPress={() => setProductOpen(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  {saving ? (
                    <View style={[styles.busyBtn, { backgroundColor: Colors.brand }]}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                    <PrimaryButton label={t('quay.saveProduct')} onPress={onSaveProduct} />
                  )}
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
  root: { flex: 1, backgroundColor: Colors.canvas },
  container: { paddingHorizontal: Space.lg, paddingBottom: 120, gap: 14 },
  hero: {
    backgroundColor: Colors.brandDeep,
    paddingHorizontal: Space.lg,
    paddingTop: Space.md,
    paddingBottom: Space.lg,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    minHeight: 168,
    justifyContent: 'center',
  },
  heroImage: {
    borderRadius: Radius.xxl,
  },
  heroEyebrow: {
    color: 'rgba(254,226,226,0.92)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroHello: { color: Colors.white, fontSize: 20, fontWeight: '900', marginTop: 6 },
  heroHint: { color: 'rgba(255,255,255,0.78)', marginTop: 12, fontSize: 12, fontWeight: '600' },
  heroBalance: { color: Colors.white, fontSize: 28, fontWeight: '900', marginTop: 4 },
  heroMeta: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  heroMetaText: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700' },
  heroDot: { color: 'rgba(255,255,255,0.45)' },
  quickCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  archiveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  archiveBtnText: { color: Colors.white, fontWeight: '800' },
  archiveBtnLocked: {
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  archiveBtnLockedText: { color: Colors.tabInactive, fontWeight: '800' },
  panel: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.md,
    gap: 4,
    marginBottom: 8,
  },
  panelHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addProductBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addProductBtnText: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  panelTitle: { fontSize: 18, fontWeight: '900', color: Colors.ink },
  sectionHead: { marginTop: Space.md, marginBottom: 6, gap: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  emptyBlock: { paddingVertical: 12, gap: 8 },
  emptyLink: { color: Colors.brand, fontWeight: '800', fontSize: 13 },
  empty: { color: Colors.slate, paddingVertical: 4 },
  productCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.amber100,
    minHeight: 128,
  },
  productCat: {
    color: Colors.brand,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: { fontWeight: '800', color: Colors.ink, fontSize: 14, lineHeight: 18 },
  productPrice: { marginTop: 10, color: Colors.ink, fontWeight: '900', fontSize: 15 },
  sellPill: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sellPillText: { color: Colors.white, fontWeight: '800', fontSize: 11 },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(91,11,15,0.45)',
  },
  modalCard: {
    backgroundColor: Colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    zIndex: 2,
  },
  modalScroll: {
    padding: Space.lg,
    paddingBottom: 36,
    gap: 8,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.ink },
  fieldHint: { fontWeight: '700', color: Colors.ink, fontSize: 13, marginTop: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 4 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.amber50,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  qtyValue: { fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'center' },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: { fontWeight: '700', color: Colors.green },
  totalValue: { fontWeight: '900', fontSize: 18, color: Colors.green },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: Space.md },
  busyBtn: {
    backgroundColor: Colors.green,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
})

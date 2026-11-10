import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { AlertBox, Card, Chip, Eyebrow, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import type { QuanStatement } from '@/types'
import { formatDateVi, formatMoney } from '@/utils/format'
import { canManageQuanStatements } from '@/utils/permissions'

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLocale()
  const canArchive = canManageQuanStatements(user)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingToday, setSavingToday] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [statements, setStatements] = useState<QuanStatement[]>([])
  const [monthFilter, setMonthFilter] = useState<'this' | 'last' | 'all'>('this')

  const currentMonthStr = useMemo(() => {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${d.getFullYear()}-${m}`
  }, [])

  const lastMonthStr = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${d.getFullYear()}-${m}`
  }, [])

  const targetMonth = useMemo(() => {
    if (monthFilter === 'this') return currentMonthStr
    if (monthFilter === 'last') return lastMonthStr
    return undefined
  }, [monthFilter, currentMonthStr, lastMonthStr])

  const load = useCallback(async () => {
    if (!canArchive) {
      setLoading(false)
      setRefreshing(false)
      return
    }
    setError('')
    try {
      const rows = await quanApi.fetchQuanStatements(targetMonth)
      setStatements(rows)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canArchive, targetMonth])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const handleSaveToday = async () => {
    setSavingToday(true)
    setError('')
    try {
      const saved = await quanApi.saveQuanStatement()
      setFlash(`Đã lưu sao kê hôm nay (${saved.statementDate})`)
      setTimeout(() => setFlash(''), 4000)
      await load()
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSavingToday(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
        }
      >
        {/* Header Block */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Eyebrow>{t('archive.eyebrow')}</Eyebrow>
            <ScreenTitle>{t('archive.title')}</ScreenTitle>
            <Muted>{t('archive.hint')}</Muted>
          </View>
          {canArchive && (
            <View style={{ marginTop: 4 }}>
              <PrimaryButton
                label={savingToday ? 'Đang lưu...' : '+ Lưu hôm nay'}
                size="sm"
                tone="green"
                icon="save-outline"
                disabled={savingToday}
                onPress={handleSaveToday}
              />
            </View>
          )}
        </View>

        {/* Flash Message */}
        {!!flash && (
          <View style={styles.flashBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.greenDeep} />
            <Text style={styles.flashText}>{flash}</Text>
          </View>
        )}

        {!canArchive ? (
          <View style={{ marginTop: Space.md }}>
            <AlertBox message={t('perm.lockedArchive')} tone="warn" />
            <Text style={styles.lockHint}>{t('perm.lockArchiveHint')}</Text>
          </View>
        ) : (
          <>
            {/* Filter Chips */}
            <View style={styles.filterRow}>
              <Chip
                label={t('common.thisMonth')}
                active={monthFilter === 'this'}
                onPress={() => setMonthFilter('this')}
              />
              <Chip
                label={t('common.lastMonth')}
                active={monthFilter === 'last'}
                onPress={() => setMonthFilter('last')}
              />
              <Chip
                label={t('common.all')}
                active={monthFilter === 'all'}
                onPress={() => setMonthFilter('all')}
              />
            </View>

            {!!error && (
              <View style={{ marginBottom: Space.xs }}>
                <AlertBox message={error} tone="error" />
              </View>
            )}

            {/* List or Empty State */}
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color={Colors.brand} size="large" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            ) : statements.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="folder-open-outline" size={42} color={Colors.amber700} />
                <Text style={styles.emptyTitle}>{t('archive.emptyTitle')}</Text>
                <Text style={styles.emptyHint}>{t('archive.emptyHint')}</Text>
              </Card>
            ) : (
              <View style={styles.list}>
                {statements.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/statement/${item.id}`)}
                    style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
                  >
                    <View style={styles.itemTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.calendarIconWrap}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.brand} />
                        </View>
                        <View>
                          <Text style={styles.itemDate}>
                            {formatDateVi(item.statementDate)}
                          </Text>
                          <Text style={styles.itemCode}>{item.code}</Text>
                        </View>
                      </View>
                      <View style={styles.netBox}>
                        <Text
                          style={[
                            styles.itemNetValue,
                            { color: item.netTotal >= 0 ? Colors.greenDeep : Colors.redDeep },
                          ]}
                        >
                          {formatMoney(item.netTotal)}
                        </Text>
                        <Text style={styles.itemNetLabel}>còn lại</Text>
                      </View>
                    </View>

                    <View style={styles.itemDivider} />

                    {/* Summary row */}
                    <View style={styles.metricsRow}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Thu:</Text>
                        <Text style={[styles.metricVal, { color: Colors.greenDeep }]}>
                          +{formatMoney(item.incomeTotal)}
                        </Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Chi:</Text>
                        <Text style={[styles.metricVal, { color: Colors.redDeep }]}>
                          -{formatMoney(item.expenseTotal)}
                        </Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>GD:</Text>
                        <Text style={styles.metricVal}>{item.rowCount}</Text>
                      </View>
                    </View>

                    {/* Payment methods row */}
                    <View style={styles.itemBottom}>
                      <View style={styles.payBadge}>
                        <Ionicons name="cash-outline" size={12} color={Colors.amber800} />
                        <Text style={styles.payBadgeText}>
                          TM: {formatMoney(item.cashTotal)}
                        </Text>
                      </View>
                      <View style={styles.payBadge}>
                        <Ionicons name="card-outline" size={12} color={Colors.blueDeep} />
                        <Text style={styles.payBadgeText}>
                          CK: {formatMoney(item.transferTotal)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.slate400} style={{ marginLeft: 'auto' }} />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Space.md,
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.greenBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  flashText: {
    color: Colors.greenDeep,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  lockHint: {
    marginTop: Space.sm,
    fontSize: 13,
    color: Colors.slate,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  centerBox: {
    paddingVertical: Space.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Space.sm,
    fontSize: 13,
    color: Colors.slate,
  },
  emptyCard: {
    padding: Space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderColor: Colors.amber200,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.slate,
    textAlign: 'center',
  },
  list: {
    gap: Space.sm,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.amber200,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  itemCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.slate400,
    marginTop: 1,
  },
  netBox: {
    alignItems: 'flex-end',
  },
  itemNetValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  itemNetLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.amber100,
    marginVertical: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.panelWarm,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
  },
  metricDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.amber200,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  payBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate700,
  },
})

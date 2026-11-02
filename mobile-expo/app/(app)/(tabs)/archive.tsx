import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
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
import { AlertBox, Card, Chip, Eyebrow, Muted, ScreenTitle } from '@/components/ui'
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
  const [error, setError] = useState('')
  const [statements, setStatements] = useState<QuanStatement[]>([])
  const [monthFilter, setMonthFilter] = useState<'all' | 'this' | 'last'>('this')

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Eyebrow>{t('archive.eyebrow')}</Eyebrow>
          <ScreenTitle>{t('archive.title')}</ScreenTitle>
          <Muted>{t('archive.hint')}</Muted>
        </View>

        {!canArchive ? (
          <View style={{ marginTop: Space.md }}>
            <AlertBox message={t('perm.lockedArchive')} tone="warn" />
            <Text style={styles.lockHint}>{t('perm.lockArchiveHint')}</Text>
          </View>
        ) : (
          <>
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
              <View style={{ marginBottom: Space.md }}>
                <AlertBox message={error} tone="error" />
              </View>
            )}

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color={Colors.brand} size="large" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            ) : statements.length === 0 ? (
              <Card style={styles.emptyCard}>
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
                      <Text style={styles.itemDate}>
                        {t('archive.day', { date: formatDateVi(item.statementDate) })}
                      </Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.code}</Text>
                      </View>
                    </View>

                    <Text style={styles.itemSummary}>
                      {t('archive.rowSummary', {
                        n: item.rowCount,
                        income: formatMoney(item.incomeTotal),
                        expense: formatMoney(item.expenseTotal),
                      })}
                    </Text>

                    <View style={styles.itemDivider} />

                    <View style={styles.itemBottom}>
                      <View style={{ gap: 2 }}>
                        <Text style={styles.itemSubDetail}>
                          {t('common.cash')}: {formatMoney(item.cashTotal)}
                        </Text>
                        <Text style={styles.itemSubDetail}>
                          {t('common.transfer')}: {formatMoney(item.transferTotal)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemNetLabel}>{t('common.remaining')}</Text>
                        <Text
                          style={[
                            styles.itemNetValue,
                            { color: item.netTotal >= 0 ? Colors.green : Colors.red },
                          ]}
                        >
                          {formatMoney(item.netTotal)}
                        </Text>
                      </View>
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
  },
  header: {
    marginBottom: Space.md,
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
    marginBottom: Space.md,
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
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    gap: Space.md,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  badge: {
    backgroundColor: Colors.amber100,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand,
  },
  itemSummary: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 6,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemSubDetail: {
    fontSize: 11,
    color: Colors.slate400,
  },
  itemNetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  itemNetValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
})

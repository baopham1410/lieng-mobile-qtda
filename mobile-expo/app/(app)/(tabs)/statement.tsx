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
import {
  AlertBox,
  Card,
  Chip,
  EntryRow,
  Eyebrow,
  Muted,
  PrimaryButton,
  ScreenTitle,
  StatCard,
} from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import type { QuanEntry, QuanStats } from '@/types'
import { formatDateTimeVi, formatMoney } from '@/utils/format'
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

export default function StatementScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLocale()
  const canArchive = canManageQuanStatements(user)

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingVault, setSavingVault] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [entries, setEntries] = useState<QuanEntry[]>([])
  const [stats, setStats] = useState<QuanStats>(emptyStats)

  const periodLabel = useMemo(() => {
    if (period === 'week') return t('common.week')
    if (period === 'month') return t('common.month')
    return t('common.today')
  }, [period, t])

  const load = useCallback(async () => {
    setError('')
    try {
      const result = await quanApi.fetchQuanEntries(period)
      setEntries(result.rows)
      setStats(result.stats)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const handleSaveVault = async () => {
    setSavingVault(true)
    try {
      const saved = await quanApi.saveQuanStatement()
      setFlash(`Đã chốt sổ sao kê ngày ${saved.statementDate}`)
      setTimeout(() => setFlash(''), 4000)
      Alert.alert(t('quay.saved'), t('quay.savedStatement', { date: saved.statementDate }), [
        { text: t('common.ok') },
        {
          text: t('tab.archive'),
          onPress: () => router.push('/(app)/(tabs)/archive'),
        },
      ])
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSavingVault(false)
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
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Eyebrow>{t('statement.eyebrow')}</Eyebrow>
            <ScreenTitle>{t('statement.title', { period: periodLabel })}</ScreenTitle>
            <Muted>{t('statement.count', { n: entries.length })}</Muted>
          </View>
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [styles.syncBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="sync-outline" size={18} color={Colors.brand} />
          </Pressable>
        </View>

        {/* Flash Message */}
        {!!flash && (
          <View style={styles.flashBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.greenDeep} />
            <Text style={styles.flashText}>{flash}</Text>
          </View>
        )}

        {/* Period Chips Filter */}
        <View style={styles.periodRow}>
          <Chip
            label={t('common.today')}
            active={period === 'today'}
            onPress={() => setPeriod('today')}
          />
          <Chip
            label={t('common.week')}
            active={period === 'week'}
            onPress={() => setPeriod('week')}
          />
          <Chip
            label={t('common.month')}
            active={period === 'month'}
            onPress={() => setPeriod('month')}
          />
        </View>

        {!!error && (
          <View style={{ marginBottom: Space.xs }}>
            <AlertBox message={error} tone="error" />
          </View>
        )}

        {/* 4 Stat Cards in 2x2 Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <StatCard
              label={t('common.income')}
              value={formatMoney(stats.incomeToday)}
              icon="income"
              valueColor={Colors.greenDeep}
              hint={`${stats.salesCountToday} ${t('quay.sell').toLowerCase()}`}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label={t('common.expense')}
              value={formatMoney(stats.expenseToday)}
              icon="expense"
              valueColor={Colors.redDeep}
              hint={`${stats.expenseCountToday} ${t('common.expense').toLowerCase()}`}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label={t('statement.cash')}
              value={formatMoney(stats.cashToday)}
              icon="cash"
              iconColor={Colors.amber700}
              iconBg={Colors.amber100}
              valueColor={Colors.ink}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label={t('statement.transfer')}
              value={formatMoney(stats.transferToday)}
              icon="transfer"
              iconColor={Colors.blueDeep}
              iconBg={Colors.blueSoft}
              valueColor={Colors.ink}
            />
          </View>
        </View>

        {/* Balance Net Card with Vault Action */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.balanceLabelRow}>
                <Ionicons name="wallet-outline" size={15} color={Colors.slate} />
                <Text style={styles.balanceLabel}>{t('common.remaining')}</Text>
              </View>
              <Text
                style={[
                  styles.balanceValue,
                  { color: stats.netToday >= 0 ? Colors.greenDeep : Colors.redDeep },
                ]}
              >
                {formatMoney(stats.netToday)}
              </Text>
            </View>
            {canArchive && (
              <View style={styles.saveBtnWrap}>
                <PrimaryButton
                  label={savingVault ? t('common.loading') : t('statement.saveVault')}
                  tone="amber"
                  icon="archive-outline"
                  size="sm"
                  disabled={savingVault}
                  onPress={handleSaveVault}
                />
              </View>
            )}
          </View>
        </Card>

        {/* Detail entries list */}
        <View style={styles.entriesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>{t('statement.detail')}</Text>
            <Text style={styles.sectionCountBadge}>{entries.length} giao dịch</Text>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.brand} size="large" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : entries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={36} color={Colors.slate400} />
              <Text style={styles.emptyText}>{t('quay.emptyTx')}</Text>
            </Card>
          ) : (
            <View style={{ gap: 8 }}>
              {entries.map((entry) => {
                const isIncome = entry.type === 'income'
                const subtitleParts = [
                  entry.staffName,
                  entry.occurredAt ? formatDateTimeVi(entry.occurredAt) : undefined,
                  entry.paymentMethod
                    ? entry.paymentMethod === 'cash'
                      ? t('common.cash')
                      : entry.paymentMethod === 'transfer'
                        ? t('common.transfer')
                        : t('common.mixed')
                    : undefined,
                ].filter(Boolean)

                return (
                  <EntryRow
                    key={entry.id}
                    title={entry.title}
                    subtitle={subtitleParts.join(' · ')}
                    amount={formatMoney(entry.amount)}
                    income={isIncome}
                    paymentMethod={entry.paymentMethod}
                  />
                )
              })}
            </View>
          )}
        </View>
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
  syncBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  periodRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  statCol: {
    width: '48.5%',
  },
  balanceCard: {
    padding: Space.lg,
    backgroundColor: Colors.white,
    borderColor: Colors.amber200,
    borderWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Space.md,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  saveBtnWrap: {
    minWidth: 120,
  },
  entriesSection: {
    marginTop: Space.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.ink,
  },
  sectionCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
    backgroundColor: Colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
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
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate,
  },
})

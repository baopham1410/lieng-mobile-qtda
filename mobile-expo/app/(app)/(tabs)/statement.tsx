import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Eyebrow>{t('statement.eyebrow')}</Eyebrow>
          <ScreenTitle>{t('statement.title', { period: periodLabel })}</ScreenTitle>
          <Muted>{t('statement.count', { n: entries.length })}</Muted>
        </View>

        {/* Period Chips */}
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
          <View style={{ marginBottom: Space.sm }}>
            <AlertBox message={error} tone="error" />
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label={t('common.income')}
            value={formatMoney(stats.incomeToday)}
            color={Colors.green}
            hint={`${stats.salesCountToday} ${t('quay.sell').toLowerCase()}`}
          />
          <StatCard
            label={t('common.expense')}
            value={formatMoney(stats.expenseToday)}
            color={Colors.red}
            hint={`${stats.expenseCountToday} ${t('common.expense').toLowerCase()}`}
          />
          <StatCard
            label={t('statement.cash')}
            value={formatMoney(stats.cashToday)}
            color={Colors.ink}
          />
          <StatCard
            label={t('statement.transfer')}
            value={formatMoney(stats.transferToday)}
            color={Colors.ink}
          />
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>{t('common.remaining')}</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: stats.netToday >= 0 ? Colors.green : Colors.red },
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
                  disabled={savingVault}
                  onPress={handleSaveVault}
                />
              </View>
            )}
          </View>
        </Card>

        {/* Entries list */}
        <View style={styles.entriesSection}>
          <Text style={styles.sectionHeading}>{t('statement.detail')}</Text>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.brand} size="large" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : entries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('quay.emptyTx')}</Text>
            </Card>
          ) : (
            entries.map((entry) => {
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
                />
              )
            })
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
  header: {
    marginBottom: Space.xs,
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
  balanceCard: {
    padding: Space.md,
    backgroundColor: Colors.white,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  saveBtnWrap: {
    minWidth: 110,
  },
  entriesSection: {
    marginTop: Space.xs,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: Space.sm,
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
    padding: Space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate,
  },
})

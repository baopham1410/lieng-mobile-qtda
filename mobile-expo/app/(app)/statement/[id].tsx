import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
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
import type { QuanStatement } from '@/types'
import { formatDateTimeVi, formatDateVi, formatMoney } from '@/utils/format'
import { canManageQuanStatements } from '@/utils/permissions'

export default function StatementDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLocale()
  const canArchive = canManageQuanStatements(user)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [statement, setStatement] = useState<QuanStatement | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError('')
    try {
      const data = await quanApi.fetchQuanStatement(Number(id))
      setStatement(data)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const handleDelete = () => {
    if (!statement) return
    Alert.alert(t('detail.delete'), t('detail.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            await quanApi.deleteQuanStatement(statement.id)
            Alert.alert(t('detail.deleted'), t('detail.deletedMsg'), [
              {
                text: t('common.ok'),
                onPress: () => router.back(),
              },
            ])
          } catch (e) {
            Alert.alert(t('common.error'), getErrorMessage(e))
          } finally {
            setDeleting(false)
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← {t('common.cancel')}</Text>
        </Pressable>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.brand} size="large" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={{ marginTop: Space.md }}>
            <AlertBox message={error} tone="error" />
          </View>
        ) : !statement ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('archive.emptyTitle')}</Text>
          </Card>
        ) : (
          <>
            <View style={styles.header}>
              <Eyebrow>{t('detail.saved')}</Eyebrow>
              <ScreenTitle>
                {t('archive.day', { date: formatDateVi(statement.statementDate) })}
              </ScreenTitle>
              <Muted>
                {t('detail.code')}: {statement.code} ·{' '}
                {t('detail.byStaff', { name: statement.staffName || 'Admin' })}
              </Muted>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label={t('common.income')}
                value={formatMoney(statement.incomeTotal)}
                color={Colors.green}
                hint={`${statement.salesCount} ${t('quay.sell').toLowerCase()}`}
              />
              <StatCard
                label={t('common.expense')}
                value={formatMoney(statement.expenseTotal)}
                color={Colors.red}
                hint={`${statement.expenseCount} ${t('common.expense').toLowerCase()}`}
              />
              <StatCard
                label={t('statement.cash')}
                value={formatMoney(statement.cashTotal)}
                color={Colors.ink}
              />
              <StatCard
                label={t('statement.transfer')}
                value={formatMoney(statement.transferTotal)}
                color={Colors.ink}
              />
            </View>

            {/* Remaining Net Card */}
            <Card style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>{t('common.remaining')}</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: statement.netTotal >= 0 ? Colors.green : Colors.red },
                ]}
              >
                {formatMoney(statement.netTotal)}
              </Text>
            </Card>

            {/* Rows Section */}
            <View style={styles.entriesSection}>
              <Text style={styles.sectionHeading}>
                {t('detail.lines', {
                  n: statement.rowsSnapshot?.length ?? statement.rowCount,
                })}
              </Text>

              {statement.rowsSnapshot && statement.rowsSnapshot.length > 0 ? (
                statement.rowsSnapshot.map((row) => {
                  const isIncome = row.type === 'income'
                  const subtitleParts = [
                    row.staffName,
                    row.occurredAt ? formatDateTimeVi(row.occurredAt) : undefined,
                    row.paymentMethod
                      ? row.paymentMethod === 'cash'
                        ? t('common.cash')
                        : row.paymentMethod === 'transfer'
                          ? t('common.transfer')
                          : t('common.mixed')
                      : undefined,
                  ].filter(Boolean)

                  return (
                    <EntryRow
                      key={row.id}
                      title={row.title}
                      subtitle={subtitleParts.join(' · ')}
                      amount={formatMoney(row.amount)}
                      income={isIncome}
                    />
                  )
                })
              ) : (
                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('quay.emptyTx')}</Text>
                </Card>
              )}
            </View>

            {/* Delete Statement (Admin only) */}
            {canArchive && (
              <View style={styles.deleteWrap}>
                <PrimaryButton
                  label={deleting ? t('common.loading') : t('detail.delete')}
                  tone="outline"
                  disabled={deleting}
                  onPress={handleDelete}
                />
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
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Space.xs,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate,
  },
  header: {
    marginBottom: Space.xs,
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
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
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
  deleteWrap: {
    marginTop: Space.md,
  },
})

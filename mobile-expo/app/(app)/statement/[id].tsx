import { Ionicons } from '@expo/vector-icons'
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
        }
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={Colors.ink} />
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>

          {canArchive && statement && (
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              style={({ pressed }) => [styles.deleteIconBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.red} />
            </Pressable>
          )}
        </View>

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
            {/* Sheet Banner */}
            <View style={styles.sheetHeaderCard}>
              <View style={styles.headerBadgeRow}>
                <View style={styles.badgeAmber}>
                  <Text style={styles.badgeAmberText}>BẢN SAO KÊ ĐÃ CHỐT</Text>
                </View>
                <Text style={styles.codeText}>{statement.code}</Text>
              </View>

              <Text style={styles.statementDayTitle}>
                Ngày {formatDateVi(statement.statementDate)}
              </Text>
              <Text style={styles.staffSub}>
                Nhân viên chốt sổ: <Text style={{ fontWeight: '700', color: Colors.ink }}>{statement.staffName || 'Admin'}</Text>
              </Text>
            </View>

            {/* 4 Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <StatCard
                  label={t('common.income')}
                  value={formatMoney(statement.incomeTotal)}
                  icon="income"
                  valueColor={Colors.greenDeep}
                  hint={`${statement.salesCount} ${t('quay.sell').toLowerCase()}`}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label={t('common.expense')}
                  value={formatMoney(statement.expenseTotal)}
                  icon="expense"
                  valueColor={Colors.redDeep}
                  hint={`${statement.expenseCount} ${t('common.expense').toLowerCase()}`}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label={t('statement.cash')}
                  value={formatMoney(statement.cashTotal)}
                  icon="cash"
                  iconColor={Colors.amber700}
                  iconBg={Colors.amber100}
                  valueColor={Colors.ink}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label={t('statement.transfer')}
                  value={formatMoney(statement.transferTotal)}
                  icon="transfer"
                  iconColor={Colors.blueDeep}
                  iconBg={Colors.blueSoft}
                  valueColor={Colors.ink}
                />
              </View>
            </View>

            {/* Remaining Net Card */}
            <Card style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>{t('common.remaining')}</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: statement.netTotal >= 0 ? Colors.greenDeep : Colors.redDeep },
                    ]}
                  >
                    {formatMoney(statement.netTotal)}
                  </Text>
                </View>
                <View style={[
                  styles.statusTag,
                  { backgroundColor: statement.netTotal >= 0 ? Colors.greenSoft : Colors.redSoft }
                ]}>
                  <Text style={[
                    styles.statusTagText,
                    { color: statement.netTotal >= 0 ? Colors.greenDeep : Colors.redDeep }
                  ]}>
                    {statement.netTotal >= 0 ? 'Dương quỹ' : 'Âm quỹ'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Rows Detail Section */}
            <View style={styles.entriesSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>
                  {t('detail.lines', {
                    n: statement.rowsSnapshot?.length ?? statement.rowCount,
                  })}
                </Text>
              </View>

              {statement.rowsSnapshot && statement.rowsSnapshot.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {statement.rowsSnapshot.map((row) => {
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
                        paymentMethod={row.paymentMethod}
                      />
                    )
                  })}
                </View>
              ) : (
                <Card style={styles.emptyCard}>
                  <Ionicons name="receipt-outline" size={36} color={Colors.slate400} />
                  <Text style={styles.emptyText}>{t('quay.emptyTx')}</Text>
                </Card>
              )}
            </View>

            {/* Action buttons at bottom */}
            {canArchive && (
              <View style={styles.deleteWrap}>
                <PrimaryButton
                  label={deleting ? t('common.loading') : t('detail.delete')}
                  tone="outline"
                  icon="trash-outline"
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  deleteIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.redSoft,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.amber200,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeAmber: {
    backgroundColor: Colors.amber100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeAmberText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.slate400,
    fontWeight: '600',
  },
  statementDayTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
  },
  staffSub: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 4,
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
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  entriesSection: {
    marginTop: Space.xs,
  },
  sectionHeaderRow: {
    marginBottom: Space.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.ink,
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
  deleteWrap: {
    marginTop: Space.sm,
  },
})

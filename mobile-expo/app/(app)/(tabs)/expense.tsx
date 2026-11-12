import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getErrorMessage } from '@/api/client'
import * as quanApi from '@/api/quan'
import {
  AccessDeniedCard,
  Chip,
  Eyebrow,
  Field,
  MoneyField,
  Muted,
  PrimaryButton,
  ScreenTitle,
} from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { formatMoney, parseMoneyInput } from '@/utils/format'
import {
  canAccessQuay,
  canCreateQuanEntry,
  getDefaultRouteForUser,
  getRoleDisplayInfo,
} from '@/utils/permissions'

export default function ExpenseScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { t } = useLocale()
  const canExpense = canAccessQuay(user) && canCreateQuanEntry(user)
  const roleInfo = getRoleDisplayInfo(user)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  const numAmount = parseMoneyInput(amount)
  const numCash = parseMoneyInput(cashAmount)
  const transferRemainder = method === 'mixed' ? Math.max(0, numAmount - numCash) : 0

  async function onSave() {
    if (!canExpense) {
      Alert.alert(
        'Không đủ quyền',
        'Vai trò hiện tại không có quyền ghi nhận chi phí Quán (quan.create).'
      )
      return
    }
    const content = title.trim()
    const money = parseMoneyInput(amount)
    if (!content) {
      Alert.alert(t('common.error'), t('expense.needTitle'))
      return
    }
    if (money <= 0) {
      Alert.alert(t('common.error'), t('expense.needAmount'))
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        type: 'expense',
        title: content,
        amount: money,
        payment_method: method,
        note: note.trim() || undefined,
      }
      if (method === 'cash') {
        payload.cash_amount = money
        payload.transfer_amount = 0
      } else if (method === 'transfer') {
        payload.cash_amount = 0
        payload.transfer_amount = money
      } else {
        if (numCash <= 0 || numCash >= money) {
          throw new Error('Số tiền mặt phải lớn hơn 0 và nhỏ hơn tổng chi.')
        }
        payload.cash_amount = numCash
        payload.transfer_amount = Math.max(0, money - numCash)
      }

      await quanApi.createQuanEntry(payload)
      setTitle('')
      setAmount('')
      setNote('')
      setMethod('cash')
      setCashAmount('')
      setFlash(`Đã ghi nhận khoản chi ${formatMoney(money)}`)
      setTimeout(() => setFlash(''), 4000)
      Alert.alert(t('common.ok'), t('expense.ok', { amount: formatMoney(money) }))
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (!canExpense) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.canvas, paddingTop: insets.top }}>
        <AccessDeniedCard
          title="Không có quyền ghi Chi phí Quán"
          roleLabel={roleInfo.title}
          message="Chỉ Quản lý Quán, Nhân viên Quán hoặc Admin được cấp quyền ghi nhận phiếu chi Quán (quan.create)."
          fallbackRoute={getDefaultRouteForUser(user)}
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 120 },
        ]}
      >
        <Eyebrow>{t('expense.eyebrow')}</Eyebrow>
        <ScreenTitle>{t('expense.title')}</ScreenTitle>
        <Muted>{t('expense.hint')}</Muted>

        {!!flash && (
          <View style={styles.flashBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.greenDeep} />
            <Text style={styles.flashText}>{flash}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Field
            label={t('expense.content')}
            placeholder={t('expense.contentPh')}
            value={title}
            onChangeText={setTitle}
          />

          <View style={{ height: Space.sm }} />

          <MoneyField
            label={t('expense.amount')}
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
          />

          {numAmount > 0 && (
            <View style={styles.amountPreview}>
              <Text style={styles.amountPreviewLabel}>Xem trước số tiền chi:</Text>
              <Text style={styles.amountPreviewVal}>-{formatMoney(numAmount)}</Text>
            </View>
          )}

          <View style={{ height: Space.sm }} />

          <Field
            label={t('expense.note')}
            placeholder={t('expense.notePh')}
            value={note}
            onChangeText={setNote}
          />

          <Text style={styles.payLabel}>{t('expense.payment')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('common.cash')}
              active={method === 'cash'}
              onPress={() => setMethod('cash')}
            />
            <Chip
              label={t('common.transfer')}
              active={method === 'transfer'}
              onPress={() => setMethod('transfer')}
            />
            <Chip
              label={t('common.mixed')}
              active={method === 'mixed'}
              onPress={() => setMethod('mixed')}
            />
          </View>

          {method === 'mixed' && (
            <View style={styles.mixedBox}>
              <MoneyField
                label="Số tiền mặt chi"
                placeholder="0"
                value={cashAmount}
                onChangeText={setCashAmount}
              />
              <Text style={styles.mixedHint}>
                Phần chuyển khoản còn lại:{' '}
                <Text style={{ fontWeight: '800', color: Colors.blueDeep }}>
                  {formatMoney(transferRemainder)}
                </Text>
              </Text>
            </View>
          )}

          <View style={{ marginTop: Space.xl }}>
            {saving ? (
              <ActivityIndicator color={Colors.red} />
            ) : (
              <PrimaryButton
                label={t('expense.save')}
                tone="red"
                icon="remove-circle-outline"
                onPress={onSave}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Space.lg,
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
    marginTop: Space.sm,
  },
  flashText: {
    color: Colors.greenDeep,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  form: {
    marginTop: Space.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.lg,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  amountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.redSoft,
    borderColor: Colors.redBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  amountPreviewLabel: {
    fontSize: 12,
    color: Colors.redDeep,
    fontWeight: '600',
  },
  amountPreviewVal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.redDeep,
  },
  payLabel: {
    fontWeight: '800',
    color: Colors.ink,
    marginTop: Space.md,
    marginBottom: 8,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mixedBox: {
    marginTop: 10,
    backgroundColor: Colors.amber50,
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    borderRadius: Radius.md,
    padding: 12,
    gap: 6,
  },
  mixedHint: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
})

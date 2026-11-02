import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getErrorMessage } from '@/api/client'
import * as quanApi from '@/api/quan'
import { Chip, Eyebrow, Field, MoneyField, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { Colors, Space } from '@/constants/config'
import { useLocale } from '@/context/LocaleContext'
import { formatMoney, parseMoneyInput } from '@/utils/format'

export default function ExpenseScreen() {
  const insets = useSafeAreaInsets()
  const { t } = useLocale()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [saving, setSaving] = useState(false)

  async function onSave() {
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
      await quanApi.createQuanEntry({
        type: 'expense',
        title: content,
        amount: money,
        payment_method: method,
        note: note.trim() || undefined,
      })
      setTitle('')
      setAmount('')
      setNote('')
      setMethod('cash')
      Alert.alert(t('common.ok'), t('expense.ok', { amount: formatMoney(money) }))
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
      >
        <Eyebrow>{t('expense.eyebrow')}</Eyebrow>
        <ScreenTitle>{t('expense.title')}</ScreenTitle>
        <Muted>{t('expense.hint')}</Muted>

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
          </View>
          <View style={{ marginTop: Space.lg }}>
            {saving ? (
              <ActivityIndicator color={Colors.red} />
            ) : (
              <PrimaryButton label={t('expense.save')} tone="red" onPress={onSave} />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.lg },
  form: {
    marginTop: Space.lg,
    backgroundColor: Colors.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.lg,
  },
  payLabel: { fontWeight: '700', color: Colors.ink, marginTop: Space.md, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})

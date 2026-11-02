import type { ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'

import { Colors, Radius, Space } from '@/constants/config'
import { formatMoneyInput, sanitizeMoneyDigits } from '@/utils/format'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.screenTitle}>{children}</Text>
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>
}

export function Card({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
}) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function StatCard({
  label,
  value,
  color = Colors.ink,
  hint,
}: {
  label: string
  value: string
  color?: string
  hint?: string
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </View>
  )
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipOn : styles.chipOff]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  )
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'ink',
}: {
  label: string
  onPress?: () => void
  disabled?: boolean
  tone?: 'ink' | 'green' | 'red' | 'amber' | 'outline'
}) {
  const bg =
    tone === 'green'
      ? Colors.green
      : tone === 'red'
        ? Colors.red
        : tone === 'amber'
          ? Colors.accent
          : tone === 'outline'
            ? Colors.white
            : Colors.brand
  const color = tone === 'outline' ? Colors.brand : Colors.white
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.55 : 1 },
        tone === 'outline' && styles.btnOutline,
      ]}
    >
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </Pressable>
  )
}

export function Field({
  label,
  ...props
}: { label?: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        placeholderTextColor={Colors.slate400}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  )
}

/** Ô nhập tiền — hiện dấu chấm nghìn khi gõ (vd. 190.000) */
export function MoneyField({
  label,
  value,
  onChangeText,
  placeholder = '0',
  ...props
}: {
  label?: string
  value: string
  onChangeText: (digits: string) => void
  placeholder?: string
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'>) {
  return (
    <Field
      label={label}
      placeholder={placeholder}
      keyboardType="number-pad"
      inputMode="numeric"
      value={formatMoneyInput(value)}
      onChangeText={(text) => onChangeText(sanitizeMoneyDigits(text))}
      {...props}
    />
  )
}

export function EntryRow({
  title,
  subtitle,
  amount,
  income,
}: {
  title: string
  subtitle?: string
  amount: string
  income?: boolean
}) {
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryDotWrap}>
        <View
          style={[
            styles.entryDot,
            { backgroundColor: income ? Colors.greenSoft : Colors.redSoft },
          ]}
        >
          <View
            style={[
              styles.entryDotInner,
              { backgroundColor: income ? Colors.green : Colors.red },
            ]}
          />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryTitle} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && <Text style={styles.entrySub}>{subtitle}</Text>}
      </View>
      <Text style={[styles.entryAmount, { color: income ? Colors.green : Colors.red }]}>
        {income ? '+' : '−'}
        {amount}
      </Text>
    </View>
  )
}

export function AlertBox({
  message,
  tone = 'error',
}: {
  message: string
  tone?: 'error' | 'warn' | 'ok'
}) {
  const palette =
    tone === 'ok'
      ? { bg: Colors.greenSoft, border: Colors.greenBorder, text: Colors.green }
      : tone === 'warn'
        ? { bg: Colors.amber50, border: Colors.amberBorder, text: Colors.amber }
        : { bg: Colors.redSoft, border: Colors.redBorder, text: Colors.red }
  return (
    <View style={[styles.alert, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={{ color: palette.text, fontWeight: '600', fontSize: 13 }}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.brand,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 2,
  },
  muted: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.md,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '46%',
  },
  statLabel: { color: Colors.slate, fontSize: 11, fontWeight: '700' },
  statValue: { marginTop: 8, fontWeight: '900', fontSize: 15 },
  statHint: { marginTop: 4, fontSize: 10, color: Colors.slate400, fontWeight: '600' },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: Colors.brand },
  chipOff: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontWeight: '700', fontSize: 12, color: Colors.slate },
  chipTextOn: { color: Colors.white },
  btn: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: { fontWeight: '800', fontSize: 14 },
  fieldLabel: { fontWeight: '700', color: Colors.ink, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.amber50,
    color: Colors.ink,
    fontSize: 15,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.amber100,
    gap: 10,
  },
  entryDotWrap: { justifyContent: 'center' },
  entryDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDotInner: { width: 8, height: 8, borderRadius: 4 },
  entryTitle: { fontWeight: '700', color: Colors.ink, fontSize: 14 },
  entrySub: { color: Colors.slate, fontSize: 11, marginTop: 2 },
  entryAmount: { fontWeight: '900', fontSize: 14 },
  alert: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
})

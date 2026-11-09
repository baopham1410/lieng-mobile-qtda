import { Ionicons } from '@expo/vector-icons'
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
  hint,
  icon = 'net',
  iconColor,
  iconBg,
  valueColor,
  color,
}: {
  label: string
  value: string
  hint?: string
  icon?: 'income' | 'expense' | 'net' | 'cash' | 'transfer' | 'orders' | 'stock'
  iconColor?: string
  iconBg?: string
  valueColor?: string
  color?: string
}) {
  const resolvedValueColor = valueColor || color || Colors.ink
  const resolvedIconColor = iconColor || (icon === 'expense' ? Colors.red : Colors.green)
  const resolvedIconBg = iconBg || (icon === 'expense' ? Colors.redSoft : Colors.greenSoft)

  const iconName: keyof typeof Ionicons.glyphMap =
    icon === 'income'
      ? 'trending-up'
      : icon === 'expense'
        ? 'trending-down'
        : icon === 'cash'
          ? 'cash-outline'
          : icon === 'transfer'
            ? 'card-outline'
            : icon === 'orders'
              ? 'receipt-outline'
              : icon === 'stock'
                ? 'cube-outline'
                : 'wallet-outline'

  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.statIconWrap, { backgroundColor: resolvedIconBg }]}>
          <Ionicons name={iconName} size={18} color={resolvedIconColor} />
        </View>
      </View>
      <Text style={[styles.statValue, { color: resolvedValueColor }]} numberOfLines={1}>
        {value}
      </Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </View>
  )
}

export function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string
  count?: number
  active?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipOn : styles.chipOff]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.chipBadge, active && styles.chipBadgeOn]}>
          <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextOn]}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

export function SearchBox({
  value,
  onChangeText,
  placeholder = 'Tìm theo tên sản phẩm...',
  onClear,
}: {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  onClear?: () => void
}) {
  return (
    <View style={styles.searchBox}>
      <Ionicons name="search" size={17} color={Colors.slate400} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.slate400}
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!!value && (
        <Pressable onPress={onClear || (() => onChangeText(''))} hitSlop={8} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={Colors.slate400} />
        </Pressable>
      )}
    </View>
  )
}

export function ProductShelfCard({
  name,
  categoryLabel,
  price,
  formattedPrice,
  onSell,
  onEdit,
  selling,
}: {
  name: string
  categoryLabel?: string
  price: number
  formattedPrice: string
  onSell: () => void
  onEdit?: () => void
  selling?: boolean
}) {
  return (
    <View style={styles.productCard}>
      {!!categoryLabel && (
        <Text style={styles.productCat} numberOfLines={1}>
          {categoryLabel}
        </Text>
      )}
      <Text style={styles.productName} numberOfLines={2}>
        {name}
      </Text>
      <Text style={styles.productRefLabel}>GIÁ THAM CHIẾU</Text>
      <Text style={styles.productPrice}>{formattedPrice}</Text>

      <View style={styles.productActions}>
        {onEdit && (
          <Pressable onPress={onEdit} style={styles.productEditBtn}>
            <Text style={styles.productEditBtnText}>Sửa</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onSell}
          disabled={selling}
          style={[styles.productSellBtn, selling && { opacity: 0.6 }]}
        >
          <Text style={styles.productSellBtnText}>{selling ? '...' : 'Bán'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'brand',
  size = 'md',
  icon,
}: {
  label: string
  onPress?: () => void
  disabled?: boolean
  tone?: 'brand' | 'green' | 'red' | 'amber' | 'outline' | 'slate'
  size?: 'sm' | 'md'
  icon?: keyof typeof Ionicons.glyphMap
}) {
  const bg =
    tone === 'green'
      ? Colors.green
      : tone === 'red'
        ? Colors.red
        : tone === 'amber'
          ? Colors.amber
          : tone === 'outline'
            ? Colors.white
            : tone === 'slate'
              ? Colors.slateLight
              : Colors.brand

  const textColor =
    tone === 'outline'
      ? Colors.brand
      : tone === 'slate'
        ? Colors.slate700
        : Colors.white

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        size === 'sm' ? styles.btnSm : styles.btnMd,
        { backgroundColor: bg, opacity: disabled ? 0.55 : 1 },
        tone === 'outline' && styles.btnOutline,
      ]}
    >
      {!!icon && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 14 : 17}
          color={textColor}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.btnText, size === 'sm' && styles.btnTextSm, { color: textColor }]}>
        {label}
      </Text>
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
  paymentBadge,
  paymentMethod,
  onEdit,
  onDelete,
}: {
  title: string
  subtitle?: string
  amount: string
  income?: boolean
  paymentBadge?: string
  paymentMethod?: string | null
  onEdit?: () => void
  onDelete?: () => void
}) {
  const badge =
    paymentBadge ||
    (paymentMethod === 'cash'
      ? 'Tiền mặt'
      : paymentMethod === 'transfer'
        ? 'CK'
        : paymentMethod === 'mixed'
          ? 'Hỗn hợp'
          : undefined)

  return (
    <View
      style={[
        styles.entryRow,
        {
          backgroundColor: income ? 'rgba(236, 253, 245, 0.55)' : 'rgba(254, 242, 242, 0.65)',
          borderColor: income ? Colors.greenBorder : Colors.redBorder,
        },
      ]}
    >
      <View style={styles.entryDotWrap}>
        <View
          style={[
            styles.entryDot,
            { backgroundColor: income ? Colors.greenSoft : Colors.redSoft },
          ]}
        >
          <Ionicons
            name={income ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={income ? Colors.green : Colors.red}
          />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.entryTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.entrySubRow}>
          {!!badge && (
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeText}>{badge}</Text>
            </View>
          )}
          {!!subtitle && <Text style={styles.entrySub}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.entryRight}>
        <Text
          style={[styles.entryAmount, { color: income ? Colors.greenDeep : Colors.red }]}
        >
          {income ? '+' : '−'}
          {amount}
        </Text>
        {(onEdit || onDelete) && (
          <View style={styles.entryActionRow}>
            {onEdit && (
              <Pressable onPress={onEdit} hitSlop={6} style={styles.entryActionBtn}>
                <Text style={styles.entryActionEdit}>Sửa</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={6} style={styles.entryActionBtn}>
                <Text style={styles.entryActionDelete}>Xóa</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

export function AlertBox({
  message,
  tone = 'error',
}: {
  message: string
  tone?: 'error' | 'success' | 'warn'
}) {
  const bg =
    tone === 'success'
      ? Colors.greenSoft
      : tone === 'warn'
        ? Colors.amber50
        : Colors.redSoft
  const border =
    tone === 'success'
      ? Colors.greenBorder
      : tone === 'warn'
        ? Colors.amberBorder
        : Colors.redBorder
  const text =
    tone === 'success'
      ? Colors.greenDeep
      : tone === 'warn'
        ? Colors.amber900
        : Colors.redDeep

  return (
    <View style={[styles.alertBox, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.alertText, { color: text }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    color: Colors.amber700,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  muted: {
    color: Colors.slate,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  statHint: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 3,
    fontWeight: '500',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  chipOn: {
    backgroundColor: Colors.ink,
  },
  chipOff: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderAmber,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate600,
  },
  chipTextOn: {
    color: Colors.white,
  },
  chipBadge: {
    backgroundColor: Colors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  chipBadgeOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
  },
  chipBadgeTextOn: {
    color: Colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 243, 199, 0.4)',
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  productCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.amber100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  productCat: {
    color: Colors.amber800,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    fontWeight: '800',
    color: Colors.ink,
    fontSize: 14,
    lineHeight: 18,
    minHeight: 36,
  },
  productRefLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.slate400,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  productPrice: {
    marginTop: 2,
    color: Colors.greenDeep,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  productActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  productEditBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: Radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  productSellBtn: {
    flex: 1.3,
    backgroundColor: Colors.green,
    borderRadius: Radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productSellBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  btn: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnMd: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnTextSm: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.ink,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
  },
  entryDotWrap: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  entryDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: {
    fontWeight: '700',
    color: Colors.ink,
    fontSize: 13,
    lineHeight: 17,
  },
  entrySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  payBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  payBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  entrySub: {
    fontSize: 11,
    color: Colors.slate500,
  },
  entryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  entryAmount: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  entryActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  entryActionBtn: {
    paddingVertical: 2,
  },
  entryActionEdit: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.amber800,
  },
  entryActionDelete: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.red,
  },
  alertBox: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '700',
  },
})

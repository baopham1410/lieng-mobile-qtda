import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'

export function useTranslatedOptions() {
  const locale = useLocaleStore()

  const orderStatusOptions = computed(() => [
    { value: 'all', label: locale.t('order.status.all') },
    { value: 'completed', label: locale.t('order.status.completed') },
    { value: 'pending_payment', label: locale.t('order.status.pending_payment') },
    { value: 'draft', label: locale.t('order.status.draft') },
    { value: 'cancelled', label: locale.t('order.status.cancelled') },
    { value: 'failed', label: locale.t('order.status.failed') },
    { value: 'expired', label: locale.t('order.status.expired') },
    { value: 'refunded', label: locale.t('order.status.refunded') },
  ])

  const paymentMethodOptions = computed(() => [
    { value: 'all', label: locale.t('payment.all') },
    { value: 'cash', label: locale.t('payment.cash') },
    { value: 'transfer', label: locale.t('payment.transfer') },
    { value: 'ewallet', label: locale.t('payment.ewallet') },
    { value: 'mixed', label: locale.t('payment.mixed') },
  ])

  const customerTierOptions = computed(() => [
    { value: 'all', label: locale.t('tier.all') },
    { value: 'regular', label: locale.t('tier.regular') },
    { value: 'silver', label: locale.t('tier.silver') },
    { value: 'gold', label: locale.t('tier.gold') },
    { value: 'diamond', label: locale.t('tier.diamond') },
  ])

  const warrantyStatusOptions = computed(() => [
    { value: 'all', label: locale.t('warranty.all') },
    { value: 'active', label: locale.t('warranty.active') },
    { value: 'expiring', label: locale.t('warranty.expiring') },
    { value: 'expired', label: locale.t('warranty.expired') },
    { value: 'repairing', label: locale.t('warranty.repairing') },
  ])

  const transactionTypeOptions = computed(() => [
    { value: 'all', label: locale.t('finance.type.all') },
    { value: 'income', label: locale.t('finance.income') },
    { value: 'expense', label: locale.t('finance.expense') },
  ])

  function translateOrderStatus(status) {
    return locale.t(`order.status.${status}`) || status
  }

  function translatePayment(method) {
    return locale.t(`payment.${method}`) || method
  }

  function translateTier(tier) {
    return locale.t(`tier.${tier}`) || tier
  }

  function translateWarrantyStatus(status) {
    return locale.t(`warranty.${status}`) || status
  }

  function translateFinanceType(type) {
    return locale.t(`finance.${type}`) || type
  }

  return {
    locale,
    orderStatusOptions,
    paymentMethodOptions,
    customerTierOptions,
    warrantyStatusOptions,
    transactionTypeOptions,
    translateOrderStatus,
    translatePayment,
    translateTier,
    translateWarrantyStatus,
    translateFinanceType,
  }
}

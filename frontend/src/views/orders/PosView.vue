<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import AppProductThumb from '@/components/common/AppProductThumb.vue'
import { cancelOrder } from '@/api/orders'
import {
  checkoutPos,
  fetchOrderPaymentStatus,
  fetchPosCategories,
  fetchPosProducts,
  lookupPosCustomer,
  suggestPosCustomers,
} from '@/api/pos'
import { useLocaleStore } from '@/stores/locale'
import {
  categoryDisplayGradient,
  categoryDisplayIcon,
} from '@/data/categoryIcons'
import { paymentMethods } from '@/mocks/posMock'
import { formatCurrency } from '@/utils/formatCurrency'
import QRCode from 'qrcode'

const locale = useLocaleStore()
const search = ref('')
const selectedCategory = ref(null)
const selectedSubFilter = ref('all')
const discount = ref(0)
const selectedPayment = ref('cash')
const mixedCashAmount = ref(0)
const customerPhone = ref('')
const customerState = ref('idle')
const customerSearching = ref(false)
const customerLookupError = ref('')
const customerSuggestions = ref([])
const showCustomerSuggestions = ref(false)
const activeSuggestionIndex = ref(-1)
let customerSuggestTimer = null
const matchedCustomer = ref(null)
const selectedCustomer = ref(null)
const newCustomerForm = ref({ name: '', phone: '', address: '' })
const posProducts = ref([])
const posCategories = ref([])
const cartItems = ref([])
const loading = ref(true)
const checkingOut = ref(false)
const checkoutMessage = ref('')
const checkoutError = ref('')
const checkingPaymentStatus = ref(false)
const pendingPayment = ref(null)
const pendingPaymentQrImage = ref('')
const pendingCheckoutSnapshot = ref(null)
const changingPaymentMethod = ref(false)
const showPaymentModal = ref(false)
const paymentModalPhase = ref('pending')
const draftCode = ref(`POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`)
let paymentPollTimer = null
let paymentSuccessTimer = null
let paymentAudioContext = null

const subtotal = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.qty, 0))
const total = computed(() => Math.max(0, subtotal.value - (discount.value || 0)))
const mixedTransferAmount = computed(() => Math.max(0, total.value - (Number(mixedCashAmount.value) || 0)))
const cartCount = computed(() => cartItems.value.reduce((sum, item) => sum + (item.qty || 1), 0))
const awaitingTransfer = computed(() => Boolean(pendingPayment.value && paymentModalPhase.value === 'pending'))
const checkoutButtonLabel = computed(() => {
  if (awaitingTransfer.value) return 'Đang chờ CK…'
  if (checkingOut.value) return locale.t('common.updating')
  return `${locale.t('pos.checkout')} · ${formatCurrency(total.value)}`
})

watch(total, (nextTotal) => {
  if ((Number(mixedCashAmount.value) || 0) > nextTotal) {
    mixedCashAmount.value = nextTotal
  }
})

function dismissCheckoutError() {
  checkoutError.value = ''
}

function clearCart() {
  if (awaitingTransfer.value) return
  cartItems.value = []
  discount.value = 0
  mixedCashAmount.value = 0
  checkoutError.value = ''
  checkoutMessage.value = ''
}

function needsTransferQr(payment, transferAmount = 0) {
  return payment === 'transfer' || (payment === 'mixed' && transferAmount > 0)
}

function formatRequestError(err, fallback) {
  if (err?.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (err?.code === 'ECONNABORTED') return 'Kết nối POS bị timeout. Máy chủ phản hồi quá chậm, vui lòng thử lại.'
  return err?.response?.data?.message || fallback
}

function clearPaymentPolling() {
  if (paymentPollTimer) {
    clearTimeout(paymentPollTimer)
    paymentPollTimer = null
  }
}

function clearPaymentSuccessTimer() {
  if (paymentSuccessTimer) {
    clearTimeout(paymentSuccessTimer)
    paymentSuccessTimer = null
  }
}

function ensurePaymentAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null

  if (!paymentAudioContext) {
    paymentAudioContext = new AudioContext()
  }

  if (paymentAudioContext.state === 'suspended') {
    paymentAudioContext.resume().catch(() => {})
  }

  return paymentAudioContext
}

function playPaymentSuccessSound() {
  try {
    const ctx = ensurePaymentAudioContext()
    if (!ctx) return

    const start = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      gain.connect(ctx.destination)

      const noteStart = start + index * 0.11
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.18, noteStart + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.42)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.45)
    })
  } catch {
    // Bỏ qua nếu trình duyệt chặn autoplay audio.
  }
}

function openPaymentModal() {
  showPaymentModal.value = true
}

function closePaymentModal() {
  if (paymentModalPhase.value === 'success') return
  showPaymentModal.value = false
}

function clearPendingPayment() {
  clearPaymentPolling()
  clearPaymentSuccessTimer()
  pendingPayment.value = null
  pendingPaymentQrImage.value = ''
  paymentModalPhase.value = 'pending'
  showPaymentModal.value = false
}

function saveCheckoutSnapshot() {
  pendingCheckoutSnapshot.value = {
    cartItems: cartItems.value.map((item) => ({ ...item })),
    discount: discount.value,
    selectedPayment: selectedPayment.value,
    mixedCashAmount: mixedCashAmount.value,
    customerPhone: customerPhone.value,
    customerState: customerState.value,
    matchedCustomer: matchedCustomer.value ? { ...matchedCustomer.value } : null,
    selectedCustomer: selectedCustomer.value,
    newCustomerForm: { ...newCustomerForm.value },
  }
}

function restoreCheckoutSnapshot() {
  const snap = pendingCheckoutSnapshot.value
  if (!snap) return

  cartItems.value = snap.cartItems.map((item) => ({ ...item }))
  discount.value = snap.discount
  selectedPayment.value = snap.selectedPayment
  mixedCashAmount.value = snap.mixedCashAmount ?? 0
  customerPhone.value = snap.customerPhone
  customerState.value = snap.customerState
  matchedCustomer.value = snap.matchedCustomer ? { ...snap.matchedCustomer } : null
  selectedCustomer.value = snap.selectedCustomer
  newCustomerForm.value = { ...snap.newCustomerForm }
  pendingCheckoutSnapshot.value = null
}

function clearCheckoutSnapshot() {
  pendingCheckoutSnapshot.value = null
}

async function completePaymentSuccess(data) {
  clearPaymentPolling()
  paymentModalPhase.value = 'success'
  showPaymentModal.value = true
  playPaymentSuccessSound()
  checkoutMessage.value = `Đơn ${data.orderCode} đã thanh toán thành công.`

  clearPaymentSuccessTimer()
  paymentSuccessTimer = window.setTimeout(async () => {
    cartItems.value = []
    discount.value = 0
    mixedCashAmount.value = 0
    resetCustomerLookup()
    clearCheckoutSnapshot()
    clearPendingPayment()
    await loadPosData()
  }, 2800)
}

async function changePaymentMethod() {
  if (!pendingPayment.value?.orderId || changingPaymentMethod.value) return

  const orderCode = pendingPayment.value.orderCode
  const confirmed = window.confirm(
    `Hủy QR và quay lại chọn phương thức thanh toán khác?\n\nĐơn ${orderCode} sẽ bị hủy, giỏ hàng được giữ nguyên.`,
  )
  if (!confirmed) return

  changingPaymentMethod.value = true
  checkoutError.value = ''
  try {
    await cancelOrder(pendingPayment.value.orderId)
    restoreCheckoutSnapshot()
    clearPendingPayment()
    checkoutMessage.value = `Đã hủy đơn ${orderCode}. Chọn lại phương thức thanh toán và bấm thanh toán.`
    await loadPosData()
  } catch (err) {
    checkoutError.value = formatRequestError(err, 'Không hủy được đơn chờ thanh toán.')
    await checkPaymentStatus()
  } finally {
    changingPaymentMethod.value = false
  }
}

async function renderPendingPaymentQr(payload) {
  pendingPaymentQrImage.value = ''
  if (!payload) return

  try {
    pendingPaymentQrImage.value = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
  } catch {
    pendingPaymentQrImage.value = ''
  }
}

watch(
  () => pendingPayment.value?.qrCode,
  (qrCode) => {
    renderPendingPaymentQr(qrCode)
  },
  { immediate: true },
)

function schedulePaymentPolling() {
  clearPaymentPolling()
  if (!pendingPayment.value || pendingPayment.value.paymentStatus !== 'pending') return
  paymentPollTimer = setTimeout(checkPaymentStatus, 5000)
}

function itemNeedsWarranty(item) {
  const cat = (item.category ?? '').toLowerCase()
  const noWarranty = ['phụ kiện', 'phu kien', 'tivi', 'tủ lạnh', 'tu lanh', 'quạt', 'quat']
  return !noWarranty.some((key) => cat.includes(key))
}

const cartNeedsCustomer = computed(() => cartItems.value.some((item) => itemNeedsWarranty(item)))

const needsWarrantyInfo = computed(
  () => cartNeedsCustomer.value && customerState.value === 'idle',
)

const CATEGORY_ORDER = ['dien-thoai', 'tablet', 'laptop', 'phu-kien', 'tivi', 'tu-lanh', 'quat']

function categoryVisual(cat) {
  const slug = typeof cat === 'string' ? cat : cat?.slug
  return {
    emoji: categoryDisplayIcon(cat),
    gradient: categoryDisplayGradient(slug),
  }
}

const activeCategory = computed(() =>
  posCategories.value.find((c) => String(c.id) === String(selectedCategory.value)) ?? null,
)

const visibleCategories = computed(() => {
  const list = [...posCategories.value]
  return list.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a.slug)
    const ib = CATEGORY_ORDER.indexOf(b.slug)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
})

const totalCatalogUnits = computed(() => posProducts.value.length)

const BRAND_SHORT = {
  Apple: '🍎',
  Samsung: 'S',
  Xiaomi: 'Mi',
  OPPO: 'O',
  Lieng: 'L',
  JBL: 'J',
  LG: 'LG',
  Panasonic: 'P',
  Senko: 'Se',
  Mitsubishi: 'M',
}

function openCategory(categoryId) {
  selectedCategory.value = categoryId
  selectedSubFilter.value = 'all'
  search.value = ''
}

function backToCategoryPicker() {
  selectedCategory.value = null
  selectedSubFilter.value = 'all'
  search.value = ''
}

const productsInCategory = computed(() => {
  if (selectedCategory.value == null) return []
  return posProducts.value.filter((item) => String(item.categoryId) === String(selectedCategory.value))
})

const subFilterOptions = computed(() => {
  const items = productsInCategory.value
  if (!items.length) return []

  const brands = [...new Set(items.map((i) => i.brand).filter(Boolean))]
  if (brands.length > 1) {
    return [
      { key: 'all', label: 'Tất cả', count: items.length, icon: '◆' },
      ...brands.map((brand) => ({
        key: `brand:${brand}`,
        label: brand,
        count: items.filter((i) => i.brand === brand).length,
        icon: BRAND_SHORT[brand] ?? brand.charAt(0),
      })),
    ]
  }

  const names = [...new Set(items.map((i) => i.name))]
  if (names.length <= 1) {
    return [{ key: 'all', label: 'Tất cả', count: items.length, icon: '◆' }]
  }

  return [
    { key: 'all', label: 'Tất cả', count: items.length, icon: '◆' },
    ...names.map((name) => ({
      key: `name:${name}`,
      label: name.length > 18 ? `${name.slice(0, 16)}…` : name,
      count: items.filter((i) => i.name === name).length,
      icon: name.charAt(0),
    })),
  ]
})

const showSubFilters = computed(() => subFilterOptions.value.length > 1)

function normalizePhone(phone) {
  return String(phone ?? '').replace(/\s+/g, '')
}

function resetCustomerLookup() {
  customerPhone.value = ''
  customerState.value = 'idle'
  customerLookupError.value = ''
  customerSuggestions.value = []
  showCustomerSuggestions.value = false
  activeSuggestionIndex.value = -1
  matchedCustomer.value = null
  selectedCustomer.value = null
  newCustomerForm.value = { name: '', phone: '', address: '' }
}

function selectCustomer(customer) {
  customerState.value = 'found'
  matchedCustomer.value = customer
  selectedCustomer.value = customer.id
  customerPhone.value = customer.phone
  customerLookupError.value = ''
  customerSuggestions.value = []
  showCustomerSuggestions.value = false
  activeSuggestionIndex.value = -1
}

function prepareNewCustomer(phone) {
  customerState.value = 'new'
  matchedCustomer.value = null
  selectedCustomer.value = null
  newCustomerForm.value = { name: '', phone: phone.trim(), address: '' }
  showCustomerSuggestions.value = false
  activeSuggestionIndex.value = -1
}

async function runCustomerSuggest(q) {
  const trimmed = q.trim()
  const digits = normalizePhone(trimmed)

  if (digits.length < 2 && trimmed.length < 2) {
    customerSuggestions.value = []
    showCustomerSuggestions.value = false
    return
  }

  customerSearching.value = true
  try {
    customerSuggestions.value = await suggestPosCustomers(trimmed)
    showCustomerSuggestions.value = customerSuggestions.value.length > 0
    customerLookupError.value = ''

    if (digits.length >= 9) {
      const exact = customerSuggestions.value.find((c) => normalizePhone(c.phone) === digits)
      if (exact) {
        selectCustomer(exact)
        return
      }
      const result = await lookupPosCustomer(trimmed)
      if (result.found && result.data) {
        selectCustomer(result.data)
        return
      }
      prepareNewCustomer(trimmed)
    }
  } catch {
    customerLookupError.value = 'Không tải được gợi ý khách hàng.'
  } finally {
    customerSearching.value = false
  }
}

function onCustomerPhoneInput() {
  if (customerState.value === 'found' || customerState.value === 'new') {
    customerState.value = 'idle'
    matchedCustomer.value = null
    selectedCustomer.value = null
    newCustomerForm.value = { name: '', phone: '', address: '' }
  }
  customerLookupError.value = ''
  activeSuggestionIndex.value = -1

  clearTimeout(customerSuggestTimer)
  customerSuggestTimer = setTimeout(() => {
    runCustomerSuggest(customerPhone.value)
  }, 280)
}

function onCustomerPhoneFocus() {
  if (customerSuggestions.value.length) {
    showCustomerSuggestions.value = true
  } else if (normalizePhone(customerPhone.value).length >= 2 || customerPhone.value.trim().length >= 2) {
    runCustomerSuggest(customerPhone.value)
  }
}

function onCustomerPhoneBlur() {
  setTimeout(() => {
    showCustomerSuggestions.value = false
  }, 150)
}

function onCustomerPhoneKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!customerSuggestions.value.length) return
    activeSuggestionIndex.value = Math.min(
      activeSuggestionIndex.value + 1,
      customerSuggestions.value.length - 1,
    )
    showCustomerSuggestions.value = true
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeSuggestionIndex.value = Math.max(activeSuggestionIndex.value - 1, 0)
    return
  }

  if (event.key === 'Escape') {
    showCustomerSuggestions.value = false
    activeSuggestionIndex.value = -1
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    if (activeSuggestionIndex.value >= 0 && customerSuggestions.value[activeSuggestionIndex.value]) {
      selectCustomer(customerSuggestions.value[activeSuggestionIndex.value])
      return
    }
    if (customerSuggestions.value.length === 1) {
      selectCustomer(customerSuggestions.value[0])
      return
    }
    runCustomerSuggest(customerPhone.value)
  }
}

watch(customerPhone, (val) => {
  if (customerState.value === 'found') return
  const digits = normalizePhone(val)
  if (digits.length < 2 && val.trim().length < 2) {
    customerSuggestions.value = []
    showCustomerSuggestions.value = false
  }
})

const filteredProducts = computed(() => {
  let list = posProducts.value
  if (selectedCategory.value != null) {
    list = list.filter((item) => String(item.categoryId) === String(selectedCategory.value))
  } else {
    return []
  }
  if (selectedSubFilter.value !== 'all') {
    if (selectedSubFilter.value.startsWith('brand:')) {
      const brand = selectedSubFilter.value.slice(6)
      list = list.filter((item) => item.brand === brand)
    } else if (selectedSubFilter.value.startsWith('name:')) {
      const name = selectedSubFilter.value.slice(5)
      list = list.filter((item) => item.name === name)
    }
  }
  if (search.value.trim()) {
    const keyword = search.value.trim().toLowerCase()
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.brand.toLowerCase().includes(keyword) ||
        (item.category ?? '').toLowerCase().includes(keyword) ||
        item.imei.toLowerCase().includes(keyword),
    )
  }
  return list
})

const groupedCatalog = computed(() => {
  const map = new Map()
  for (const unit of filteredProducts.value) {
    const key = unit.productVariantId ?? unit.id
    if (!map.has(key)) {
      map.set(key, {
        productVariantId: unit.productVariantId ?? unit.id,
        name: unit.name,
        brand: unit.brand,
        color: unit.color,
        storage: unit.storage,
        category: unit.category ?? 'Khác',
        categorySlug: unit.categorySlug ?? '',
        image: unit.image ?? '',
        price: unit.price,
        units: [],
      })
    }
    map.get(key).units.push(unit)
  }
  return [...map.values()].map((group) => ({ ...group, stock: group.units.length }))
})

function isInCart(imeiCodeId) {
  return cartItems.value.some((item) => item.imeiCodeId === imeiCodeId)
}

function cartQtyForVariant(variantId) {
  return cartItems.value.filter((item) => item.productVariantId === variantId).length
}

function availableUnitsForVariant(variantId) {
  return posProducts.value.filter(
    (unit) => (unit.productVariantId ?? unit.id) === variantId && !isInCart(unit.imeiCodeId ?? unit.id),
  )
}

function addToCart(product) {
  const imeiCodeId = product.imeiCodeId ?? product.id
  if (isInCart(imeiCodeId)) return
  cartItems.value.push({
    id: imeiCodeId,
    imeiCodeId,
    productVariantId: product.productVariantId ?? product.id,
    name: product.name,
    imei: product.imei,
    category: product.category,
    categorySlug: product.categorySlug ?? '',
    image: product.image ?? '',
    qty: 1,
    price: product.price,
  })
}

function addVariantToCart(group) {
  const next = availableUnitsForVariant(group.productVariantId)[0]
  if (next) addToCart(next)
}

function removeVariantFromCart(group) {
  const inCart = cartItems.value.filter((item) => item.productVariantId === group.productVariantId)
  if (inCart.length) removeFromCart(inCart[inCart.length - 1].id)
}

function removeFromCart(id) {
  cartItems.value = cartItems.value.filter((item) => item.id !== id)
}

async function loadPosData() {
  loading.value = true
  checkoutError.value = ''
  try {
    const [products, categories] = await Promise.all([
      fetchPosProducts(),
      fetchPosCategories(),
    ])
    posProducts.value = products
    posCategories.value = categories
  } catch (err) {
    posProducts.value = []
    posCategories.value = []
    checkoutError.value = formatRequestError(err, 'Không tải được dữ liệu POS từ máy chủ.')
  } finally {
    loading.value = false
  }
}

async function handleCheckout() {
  checkoutMessage.value = ''
  checkoutError.value = ''

  if (cartItems.value.length === 0) {
    checkoutError.value = 'Giỏ hàng trống.'
    return
  }

  if (cartNeedsCustomer.value) {
    if (customerState.value === 'new') {
      if (!newCustomerForm.value.name.trim()) {
        checkoutError.value = 'Nhập họ tên khách hàng để lập phiếu bảo hành.'
        return
      }
    } else if (customerState.value === 'found') {
      if (!selectedCustomer.value) {
        checkoutError.value = 'Không xác định được khách hàng.'
        return
      }
    } else {
      checkoutError.value = 'Bán máy/thiết bị cần SĐT khách hàng để lập bảo hành.'
      return
    }
  }

  if (pendingPayment.value?.orderId && paymentModalPhase.value === 'pending') {
    checkoutError.value = 'Đang chờ chuyển khoản. Hủy QR hoặc đổi phương thức thanh toán trước khi tạo đơn mới.'
    return
  }

  checkingOut.value = true
  try {
    const payment = selectedPayment.value === 'bank' ? 'transfer' : selectedPayment.value
    let transferPart = 0
    let cashPart = 0

    if (payment === 'mixed') {
      cashPart = Math.max(0, Number(mixedCashAmount.value) || 0)
      transferPart = mixedTransferAmount.value
      if (cashPart <= 0 && transferPart <= 0) {
        checkoutError.value = 'Nhập số tiền mặt đã thu hoặc phần chuyển khoản.'
        return
      }
    }

    const payload = {
      payment_method: payment,
      discount: discount.value || 0,
      items: cartItems.value.map((item) => ({ imei_code_id: item.imeiCodeId })),
    }

    if (payment === 'mixed') {
      payload.cash_amount = cashPart
      payload.transfer_amount = transferPart
    }

    if (cartNeedsCustomer.value) {
      if (customerState.value === 'new') {
        payload.customer = {
          name: newCustomerForm.value.name.trim(),
          phone: newCustomerForm.value.phone.trim(),
          address: newCustomerForm.value.address.trim() || undefined,
        }
      } else if (customerState.value === 'found') {
        payload.customer_id = selectedCustomer.value
      }
    } else if (customerState.value === 'found') {
      payload.customer_id = selectedCustomer.value
    } else if (customerState.value === 'new' && newCustomerForm.value.name.trim()) {
      payload.customer = {
        name: newCustomerForm.value.name.trim(),
        phone: newCustomerForm.value.phone.trim(),
        address: newCustomerForm.value.address.trim() || undefined,
      }
    }

    const { data } = await checkoutPos(payload)
    const isAwaitingTransfer = needsTransferQr(payment, transferPart)
    if (isAwaitingTransfer) {
      saveCheckoutSnapshot()
      checkoutMessage.value = payment === 'mixed' && cashPart > 0
        ? `Đã thu ${formatCurrency(cashPart)} tiền mặt — chờ chuyển khoản ${formatCurrency(transferPart || data.data.transferAmount || data.data.total)}.`
        : ''
      ensurePaymentAudioContext()
      paymentModalPhase.value = 'pending'
      pendingPayment.value = {
        orderId: data.data.orderId,
        orderCode: data.data.orderCode,
        total: data.data.total,
        transferAmount: data.data.transferAmount ?? data.data.total,
        cashAmount: data.data.cashAmount ?? cashPart,
        isMixed: payment === 'mixed',
        paymentStatus: data.data.paymentStatus,
        checkoutUrl: data.data.checkoutUrl,
        qrCode: data.data.qrCode,
        paymentReference: data.data.paymentReference,
        paymentExpiresAt: data.data.paymentExpiresAt,
      }
      openPaymentModal()
      schedulePaymentPolling()
      await loadPosData()
    } else {
      clearPendingPayment()
      clearCheckoutSnapshot()
      const warrantyNote = cartNeedsCustomer.value ? ' Phiếu bảo hành đã được tạo.' : ''
      checkoutMessage.value = `${data.message} — Mã đơn: ${data.data.orderCode}.${warrantyNote}`
      cartItems.value = []
      discount.value = 0
      mixedCashAmount.value = 0
      resetCustomerLookup()
      await loadPosData()
    }
  } catch (err) {
    checkoutError.value = formatRequestError(err, 'Thanh toán thất bại.')
  } finally {
    checkingOut.value = false
  }
}

async function checkPaymentStatus() {
  if (!pendingPayment.value?.orderId) return
  checkingPaymentStatus.value = true
  try {
    const data = await fetchOrderPaymentStatus(pendingPayment.value.orderId)
    pendingPayment.value = { ...pendingPayment.value, ...data }

    if (data.paymentStatus === 'paid') {
      pendingPayment.value = { ...pendingPayment.value, ...data }
      await completePaymentSuccess(data)
      return
    }

    if (['failed', 'expired'].includes(data.paymentStatus)) {
      checkoutError.value = `Thanh toán đơn ${data.orderCode} ${data.paymentStatus === 'expired' ? 'đã hết hạn' : 'thất bại'}. Giỏ hàng đã được khôi phục.`
      restoreCheckoutSnapshot()
      clearPendingPayment()
      await loadPosData()
      return
    }

    schedulePaymentPolling()
  } catch (err) {
    checkoutError.value = formatRequestError(err, 'Không kiểm tra được trạng thái thanh toán.')
    schedulePaymentPolling()
  } finally {
    checkingPaymentStatus.value = false
  }
}

onMounted(loadPosData)
onBeforeUnmount(() => {
  clearPaymentPolling()
  clearPaymentSuccessTimer()
})
</script>

<template>
  <div class="min-w-0 space-y-4 p-4 sm:p-5">
    <AppContentBreadcrumb />

    <div v-if="checkoutMessage" class="rounded-[14px] bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
      {{ checkoutMessage }}
    </div>
    <div
      v-if="checkoutError"
      class="flex items-start justify-between gap-3 rounded-[14px] bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-100"
      role="alert"
    >
      <p class="min-w-0 flex-1">{{ checkoutError }}</p>
      <button
        type="button"
        class="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold text-red-500 hover:bg-red-100"
        aria-label="Đóng lỗi"
        @click="dismissCheckoutError"
      >
        Đóng
      </button>
    </div>

    <AppModal
      :open="showPaymentModal"
      :persistent="paymentModalPhase === 'pending'"
      @close="closePaymentModal"
    >
      <div class="w-full max-w-md overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div v-if="paymentModalPhase === 'pending'" class="p-6">
          <div class="text-center">
            <p class="text-[11px] font-bold uppercase tracking-widest text-amber-600">
              {{ pendingPayment?.isMixed ? 'Thanh toán kết hợp' : 'Chuyển khoản PayOS' }}
            </p>
            <h3 class="mt-2 text-xl font-black text-[#111118]">Quét mã QR để thanh toán</h3>
            <p class="mt-1 text-sm text-slate-500">
              Đơn <span class="font-semibold text-[#111118]">{{ pendingPayment?.orderCode }}</span>
            </p>
            <p v-if="pendingPayment?.isMixed && pendingPayment?.cashAmount > 0" class="mt-2 text-sm text-emerald-700">
              Đã thu tiền mặt: <span class="font-bold">{{ formatCurrency(pendingPayment.cashAmount) }}</span>
            </p>
            <p v-if="pendingPayment?.transferAmount != null" class="mt-2 text-2xl font-black text-red-600">
              {{ formatCurrency(pendingPayment.transferAmount) }}
            </p>
            <p v-if="pendingPayment?.isMixed" class="mt-1 text-[11px] text-slate-400">
              Tổng đơn {{ formatCurrency(pendingPayment.total) }}
            </p>
          </div>

          <div class="mt-5 flex flex-col items-center rounded-[20px] bg-[#fffafa] p-4 ring-1 ring-red-100">
            <img
              v-if="pendingPaymentQrImage"
              :src="pendingPaymentQrImage"
              alt="QR thanh toán PayOS"
              class="h-[280px] w-[280px] rounded-[16px] object-contain bg-white"
            >
            <div v-else class="flex h-[280px] w-[280px] items-center justify-center rounded-[16px] bg-white text-sm text-slate-500">
              Đang tạo mã QR...
            </div>
          </div>

          <div class="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span
              class="inline-block h-2 w-2 rounded-full bg-amber-400"
              :class="checkingPaymentStatus ? 'animate-pulse' : 'animate-ping'"
            />
            {{ checkingPaymentStatus ? 'Đang kiểm tra…' : 'Chờ thanh toán' }}
          </div>

          <p v-if="pendingPayment?.paymentExpiresAt" class="mt-2 text-center text-[11px] text-slate-400">
            Hết hạn: {{ new Date(pendingPayment.paymentExpiresAt).toLocaleString('vi-VN') }}
          </p>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              class="flex-1 rounded-[12px] bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              :disabled="checkingPaymentStatus"
              @click="checkPaymentStatus"
            >
              {{ checkingPaymentStatus ? 'Đang kiểm tra...' : 'Kiểm tra ngay' }}
            </button>
            <a
              v-if="pendingPayment?.checkoutUrl"
              :href="pendingPayment.checkoutUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 rounded-[12px] bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-600 ring-1 ring-red-100 hover:bg-red-100"
            >
              Mở PayOS
            </a>
          </div>

          <button
            type="button"
            class="mt-3 w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            :disabled="changingPaymentMethod"
            @click="changePaymentMethod"
          >
            {{ changingPaymentMethod ? 'Đang hủy…' : 'Đổi phương thức' }}
          </button>

          <button
            type="button"
            class="mt-2 w-full rounded-[12px] px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            @click="closePaymentModal"
          >
            Thu nhỏ
          </button>
        </div>

        <div v-else class="px-6 py-10 text-center">
          <div class="payment-success-icon mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <svg class="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path class="payment-success-check" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="payment-success-title mt-6 text-2xl font-black text-emerald-700">Thanh toán thành công!</h3>
          <p class="mt-2 text-sm text-slate-600">
            Đơn <span class="font-bold text-[#111118]">{{ pendingPayment?.orderCode }}</span> đã được xác nhận.
          </p>
          <p v-if="pendingPayment?.total != null" class="mt-3 text-lg font-black text-red-600">
            {{ formatCurrency(pendingPayment.total) }}
          </p>
        </div>
      </div>
    </AppModal>

    <div
      v-if="pendingPayment && !showPaymentModal && paymentModalPhase === 'pending'"
      class="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p>
          Đang chờ thanh toán đơn <strong>{{ pendingPayment.orderCode }}</strong>
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-[10px] bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"
            @click="openPaymentModal"
          >
            Mở lại QR
          </button>
          <button
            type="button"
            class="rounded-[10px] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-amber-200 hover:text-red-600"
            :disabled="changingPaymentMethod"
            @click="changePaymentMethod"
          >
            Đổi PT thanh toán
          </button>
        </div>
      </div>
    </div>

    <div class="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <div class="min-w-0 space-y-4">
        <div class="rounded-[20px] border border-red-200 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-widest text-red-500">{{ locale.t('pos.title') }}</p>
              <h2 class="text-xl font-black text-[#111118]">{{ locale.t('pos.title') }}</h2>
            </div>
            <span class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-100">
              API
            </span>
          </div>
        </div>

        <div class="min-w-0 rounded-[20px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <!-- Bước 1: chọn danh mục -->
          <template v-if="selectedCategory === null">
            <div class="border-b border-red-100 px-4 py-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="text-base font-bold text-[#111118]">Chọn danh mục</h3>
                  <p class="flex items-center gap-1.5 text-xs text-slate-500">
                    <AppInlineLoader v-if="loading" size="xs" inline />
                    <span v-else>{{ totalCatalogUnits }} đơn vị sẵn bán</span>
                  </p>
                </div>
                <button type="button" class="shrink-0 rounded-[12px] bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100" @click="loadPosData">
                  Đồng bộ
                </button>
              </div>
            </div>

            <AppEmptyState
              v-if="visibleCategories.length === 0 && !loading"
              size="sm"
              icon="box"
              :title="locale.t('pos.noStock')"
            />

            <div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              <button
                v-for="cat in visibleCategories"
                :key="cat.id"
                type="button"
                class="group flex flex-col items-center rounded-[18px] border border-red-100 bg-[#fffafa] p-4 text-center transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
                @click="openCategory(cat.id)"
              >
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br text-2xl shadow-sm ring-1 ring-white/60"
                  :class="categoryVisual(cat).gradient"
                >
                  <span class="drop-shadow-sm">{{ categoryVisual(cat).emoji }}</span>
                </div>
                <p class="mt-3 text-sm font-bold text-[#111118]">{{ cat.name }}</p>
                <p class="mt-0.5 text-[11px] font-medium" :class="cat.count > 0 ? 'text-slate-500' : 'text-slate-400'">
                  {{ cat.count > 0 ? `${cat.count} sẵn bán` : 'Chưa có hàng' }}
                </p>
              </button>
            </div>
          </template>

          <!-- Bước 2: sản phẩm trong danh mục -->
          <template v-else>
            <div class="border-b border-red-100 px-4 py-3">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1 rounded-[12px] bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-100 hover:bg-red-100"
                  @click="backToCategoryPicker"
                >
                  <span aria-hidden="true">←</span> Danh mục
                </button>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ categoryVisual(activeCategory).emoji }}</span>
                    <h3 class="truncate text-base font-bold text-[#111118]">{{ activeCategory?.name }}</h3>
                  </div>
                  <p class="text-xs text-slate-500">
                    {{ groupedCatalog.length }} mặt hàng · {{ filteredProducts.length }} đơn vị
                  </p>
                </div>
                <button type="button" class="shrink-0 rounded-[12px] bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100" @click="loadPosData">
                  Đồng bộ
                </button>
              </div>

              <div class="mt-3 flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50/60 px-3 py-2.5">
                <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                </svg>
                <input
                  v-model="search"
                  type="text"
                  placeholder="Tìm hoặc quét IMEI..."
                  class="min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-[#111118] outline-none placeholder:text-slate-400"
                />
              </div>

              <div
                v-if="showSubFilters"
                class="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <button
                  v-for="opt in subFilterOptions"
                  :key="opt.key"
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition ring-1"
                  :class="
                    selectedSubFilter === opt.key
                      ? 'bg-red-600 text-white ring-red-600'
                      : 'bg-white text-slate-600 ring-red-100 hover:bg-red-50'
                  "
                  @click="selectedSubFilter = opt.key"
                >
                  <span class="flex h-4 w-4 items-center justify-center rounded-full bg-black/5 text-[9px]">{{ opt.icon }}</span>
                  {{ opt.label }}
                  <span class="opacity-75">({{ opt.count }})</span>
                </button>
              </div>
            </div>

            <AppEmptyState
              v-if="groupedCatalog.length === 0"
              size="sm"
              icon="search"
              :title="locale.t('pos.noProducts')"
            />

            <div class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
              <div
                v-for="group in groupedCatalog"
                :key="group.productVariantId"
                class="min-w-0 rounded-[12px] border border-red-100 bg-[#fffafa] p-2.5"
              >
                <div class="mb-2 flex justify-center">
                  <AppProductThumb
                    :src="group.image"
                    :name="group.name"
                    :category-slug="group.categorySlug"
                    size="lg"
                  />
                </div>
                <div class="flex items-start justify-between gap-1">
                  <div class="min-w-0">
                    <p class="truncate text-[9px] font-bold uppercase text-red-500">{{ group.brand }}</p>
                    <h4 class="line-clamp-2 text-[11px] font-bold leading-tight text-[#111118]">{{ group.name }}</h4>
                    <p class="mt-0.5 truncate text-[10px] text-slate-500">{{ group.color }}</p>
                  </div>
                  <span class="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                    {{ group.stock }}
                  </span>
                </div>

                <div class="mt-2 flex items-center justify-between gap-1">
                  <p class="min-w-0 truncate text-[11px] font-black text-red-600">{{ formatCurrency(group.price) }}</p>
                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-[8px] bg-red-50 text-sm font-bold text-red-600 ring-1 ring-red-100 disabled:opacity-40"
                      :disabled="cartQtyForVariant(group.productVariantId) === 0"
                      @click="removeVariantFromCart(group)"
                    >
                      −
                    </button>
                    <span class="w-4 text-center text-[10px] font-bold text-slate-700">
                      {{ cartQtyForVariant(group.productVariantId) }}
                    </span>
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-[8px] bg-red-600 text-sm font-bold text-white disabled:opacity-40"
                      :disabled="cartQtyForVariant(group.productVariantId) >= group.stock"
                      @click="addVariantToCart(group)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="min-w-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:overscroll-contain">
        <div class="space-y-3 rounded-[20px] border border-red-200 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-bold text-[#111118]">
              Giỏ
              <span class="ml-1 text-sm font-semibold text-slate-400">{{ cartCount }}</span>
            </h3>
            <span class="max-w-[120px] truncate rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-100">
              #{{ draftCode }}
            </span>
          </div>

          <div class="max-h-36 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            <AppEmptyState
              v-if="cartItems.length === 0"
              size="sm"
              icon="cart"
              :title="locale.t('pos.emptyCart')"
            />
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="rounded-[12px] border border-red-100 bg-[#fffafa] p-2.5"
            >
              <div class="flex items-start gap-2">
                <AppProductThumb
                  :src="item.image"
                  :name="item.name"
                  :category-slug="item.categorySlug"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-[#111118]">{{ item.name }}</p>
                      <p class="truncate font-mono text-[10px] text-slate-500">{{ item.imei }}</p>
                    </div>
                    <p class="shrink-0 text-[11px] font-bold leading-tight text-red-600">{{ formatCurrency(item.price) }}</p>
                  </div>
                  <button type="button" class="mt-1.5 text-[11px] font-medium text-slate-400 hover:text-red-600" @click="removeFromCart(item.id)">Xóa</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="cartNeedsCustomer" class="border-t border-red-100 pt-3">
            <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              SĐT / tên khách <span class="text-red-500">*</span>
            </label>
            <div class="relative min-w-0">
              <input
                v-model="customerPhone"
                type="text"
                placeholder="Gõ SĐT hoặc tên..."
                autocomplete="off"
                class="w-full rounded-[12px] border border-red-200 bg-red-50/60 px-3 py-2 pr-8 text-sm outline-none focus:border-red-400"
                @input="onCustomerPhoneInput"
                @focus="onCustomerPhoneFocus"
                @blur="onCustomerPhoneBlur"
                @keydown="onCustomerPhoneKeydown"
              />
              <span
                v-if="customerSearching"
                class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"
              >
                ...
              </span>

              <ul
                v-if="showCustomerSuggestions && customerSuggestions.length"
                class="absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-[12px] border border-red-200 bg-white py-1 shadow-lg ring-1 ring-red-100"
              >
                <li
                  v-for="(customer, index) in customerSuggestions"
                  :key="customer.id"
                  class="cursor-pointer px-3 py-2 transition hover:bg-red-50"
                  :class="index === activeSuggestionIndex ? 'bg-red-50' : ''"
                  @mousedown.prevent="selectCustomer(customer)"
                >
                  <p class="truncate text-sm font-semibold text-[#111118]">{{ customer.name }}</p>
                  <p class="text-xs text-slate-500">{{ customer.phone }}</p>
                </li>
              </ul>
            </div>
            <p v-if="customerLookupError" class="mt-1 text-[11px] text-red-600">{{ customerLookupError }}</p>

            <div
              v-if="customerState === 'found' && matchedCustomer"
              class="mt-2 rounded-[12px] border border-emerald-200 bg-emerald-50/60 p-2.5"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-[#111118]">{{ matchedCustomer.name }}</p>
                  <p class="text-xs text-slate-600">{{ matchedCustomer.phone }}</p>
                </div>
                <button type="button" class="shrink-0 text-[10px] font-semibold text-slate-400 hover:text-red-600" @click="resetCustomerLookup">Đổi</button>
              </div>
            </div>

            <div v-else-if="customerState === 'new'" class="mt-2 space-y-2 rounded-[12px] border border-amber-200 bg-amber-50/40 p-2.5">
              <input
                v-model="newCustomerForm.name"
                type="text"
                placeholder="Họ tên *"
                class="w-full rounded-[10px] border border-red-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-red-400"
              />
              <input
                v-model="newCustomerForm.address"
                type="text"
                placeholder="Địa chỉ"
                class="w-full rounded-[10px] border border-red-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-red-400"
              />
            </div>
          </div>

          <div class="border-t border-red-100 pt-3">
            <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Thanh toán</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                class="rounded-[10px] px-1.5 py-2.5 text-[11px] font-bold leading-tight transition"
                :class="
                  selectedPayment === method.value
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'bg-white text-slate-600 ring-1 ring-red-100 hover:bg-red-50'
                "
                @click="selectedPayment = method.value"
              >
                {{ method.label }}
              </button>
            </div>
            <div class="mt-2">
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Giảm giá</label>
              <AppMoneyInput v-model="discount" placeholder="0" />
            </div>
          </div>

          <div class="space-y-1.5 rounded-[14px] bg-[#fffafa] p-3 ring-1 ring-red-100">
            <div class="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span class="shrink-0">Tạm tính</span>
              <span class="min-w-0 truncate text-right font-semibold text-slate-700">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div v-if="discount > 0" class="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span class="shrink-0">Giảm giá</span>
              <span class="text-red-600">- {{ formatCurrency(discount || 0) }}</span>
            </div>
            <template v-if="selectedPayment === 'mixed'">
              <div class="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span class="shrink-0">Tiền mặt</span>
                <AppMoneyInput
                  v-model="mixedCashAmount"
                  :max="total"
                  placeholder="0"
                  input-class="w-28 rounded-[10px] border border-red-200 bg-white px-2 py-1 text-right text-sm font-semibold text-[#111118] outline-none focus:border-red-400"
                />
              </div>
              <div class="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span class="shrink-0">Chuyển khoản</span>
                <span class="font-semibold text-slate-700">{{ formatCurrency(mixedTransferAmount) }}</span>
              </div>
            </template>
            <div class="flex items-center justify-between gap-2 border-t border-red-100 pt-2">
              <span class="text-sm font-bold text-[#111118]">Tổng</span>
              <span class="min-w-0 truncate text-right text-xl font-black text-red-600">{{ formatCurrency(total) }}</span>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-[14px] bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="checkingOut || cartItems.length === 0 || awaitingTransfer"
            @click="handleCheckout"
          >
            {{ checkoutButtonLabel }}
          </button>
          <button
            v-if="cartItems.length"
            type="button"
            class="w-full rounded-[12px] px-3 py-1 text-[11px] font-medium text-slate-400 hover:text-red-600"
            :disabled="awaitingTransfer"
            @click="clearCart"
          >
            Xóa giỏ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-success-icon {
  animation: payment-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.payment-success-title {
  animation: payment-fade-up 0.4s ease 0.15s both;
}

.payment-success-check {
  stroke-dasharray: 28;
  stroke-dashoffset: 28;
  animation: payment-draw-check 0.35s ease 0.35s forwards;
}

@keyframes payment-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes payment-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes payment-draw-check {
  to {
    stroke-dashoffset: 0;
  }
}
</style>

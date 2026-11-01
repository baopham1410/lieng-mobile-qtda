<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'
import QuanStatementSheet from '@/components/quan/QuanStatementSheet.vue'
import QuanEntryEditModal from '@/components/quan/QuanEntryEditModal.vue'
import {
  createQuanEntry,
  createQuanProduct,
  updateQuanProduct,
  updateQuanEntry,
  deleteQuanEntry,
  deleteQuanProduct,
  fetchQuanEntries,
  fetchQuanProducts,
  saveQuanStatement,
} from '@/api/quan'
import { formatCurrency, paymentMethodLabels } from '@/mocks/financeMock'
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'
import { downloadElementAsPng } from '@/utils/saveAsImage'

const auth = useAuthStore()
const canManageStatements = computed(() =>
  (auth.user?.permissions || []).includes('quan.statements'),
)
const statementSheetRef = ref(null)
const products = ref([])
const todayEntries = ref([])
const stats = ref({
  incomeToday: 0,
  expenseToday: 0,
  cashToday: 0,
  transferToday: 0,
  netToday: 0,
  salesCountToday: 0,
  expenseCountToday: 0,
  balanceMonth: 0,
  incomeMonth: 0,
  expenseMonth: 0,
})

const productSearch = ref('')
const categoryFilter = ref('all')
const quanCategories = ref([
  { value: 'dien-thoai', label: 'Điện thoại' },
  { value: 'dich-vu', label: 'Dịch vụ' },
  { value: 'man-hinh', label: 'Màn hình' },
  { value: 'pin', label: 'Pin' },
  { value: 'phu-kien', label: 'Phụ kiện' },
  { value: 'sim-card', label: 'Sim / Card' },
  { value: 'dong-ho', label: 'Đồng hồ' },
  { value: 'khac', label: 'Khác' },
])
const loadingProducts = ref(false)
const loadingDay = ref(false)
const loadError = ref('')
const flash = ref('')
const sellingId = ref(null)

const showStatementModal = ref(false)
const statementPeriod = ref('today')
const statementRows = ref([])
const loadingStatement = ref(false)
const statementError = ref('')
const savingStatement = ref(false)
const savingImage = ref(false)
const editingEntry = ref(null)
const showEditEntry = ref(false)

const statementPeriodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày qua' },
  { value: 'month', label: 'Tháng này' },
]

const statementPeriodLabel = computed(
  () => statementPeriodOptions.find((p) => p.value === statementPeriod.value)?.label || 'Hôm nay',
)

const statementDateRange = computed(() => {
  const to = new Date()
  const from = new Date()
  if (statementPeriod.value === 'week') {
    from.setDate(from.getDate() - 6)
  } else if (statementPeriod.value === 'month') {
    from.setDate(1)
  }
  const fmt = (d) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return { from: fmt(from), to: fmt(to) }
})

const salePaymentOptions = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'mixed', label: 'Cả hai' },
]

const showProductModal = ref(false)
const productModalMode = ref('create') // create | edit
const editingProductId = ref(null)
const showSellModal = ref(false)
const showExpenseModal = ref(false)
const saving = ref(false)
const formError = ref('')

const productForm = ref({
  name: '',
  category: 'dich-vu',
  price: '',
  paymentMethod: 'cash',
  cashAmount: '',
})

const sellForm = ref({
  product: null,
  price: '',
  qty: 1,
  paymentMethod: 'cash',
  cashAmount: '',
})

const expenseForm = ref({
  title: '',
  amount: '',
  paymentMethod: 'cash',
  cashAmount: '',
  note: '',
})

const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  return products.value.filter((p) => {
    if (categoryFilter.value !== 'all' && (p.category || 'khac') !== categoryFilter.value) {
      return false
    }
    if (q && !String(p.name).toLowerCase().includes(q)) return false
    return true
  })
})

const productsByCategory = computed(() => {
  const map = new Map()
  for (const cat of quanCategories.value) {
    map.set(cat.value, { ...cat, items: [] })
  }
  for (const p of filteredProducts.value) {
    const key = p.category || 'khac'
    if (!map.has(key)) {
      map.set(key, { value: key, label: p.categoryLabel || key, items: [] })
    }
    map.get(key).items.push(p)
  }
  return [...map.values()].filter((g) => g.items.length > 0)
})

const salesToday = computed(() => todayEntries.value.filter((e) => e.type === 'income'))
const expensesToday = computed(() => todayEntries.value.filter((e) => e.type === 'expense'))

const productFormTransfer = computed(() => {
  const total = Number(productForm.value.price) || 0
  if (productForm.value.paymentMethod !== 'mixed') return 0
  return Math.max(0, total - (Number(productForm.value.cashAmount) || 0))
})

const sellTotal = computed(() => {
  const unit = Number(sellForm.value.price) || 0
  const qty = Math.max(1, Number(sellForm.value.qty) || 1)
  return unit * qty
})

const sellFormTransfer = computed(() => {
  if (sellForm.value.paymentMethod !== 'mixed') return 0
  return Math.max(0, sellTotal.value - (Number(sellForm.value.cashAmount) || 0))
})

const expenseFormTransfer = computed(() => {
  const total = Number(expenseForm.value.amount) || 0
  if (expenseForm.value.paymentMethod !== 'mixed') return 0
  return Math.max(0, total - (Number(expenseForm.value.cashAmount) || 0))
})

const soldByProduct = computed(() => {
  const map = new Map()
  for (const row of salesToday.value) {
    const key = row.quanProductId ? `p-${row.quanProductId}` : `t-${row.title}`
    const cur = map.get(key) || { title: row.title, qty: 0, amount: 0 }
    cur.qty += row.qty || 1
    cur.amount += row.amount
    map.set(key, cur)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
})

const cashToday = computed(() =>
  Number(stats.value.cashToday) ||
  salesToday.value.reduce((s, r) => s + (Number(r.cashAmount) || 0), 0),
)
const transferToday = computed(() =>
  Number(stats.value.transferToday) ||
  salesToday.value.reduce((s, r) => s + (Number(r.transferAmount) || 0), 0),
)

const statCards = computed(() => [
  {
    label: 'Thu hôm nay',
    value: formatCurrency(stats.value.incomeToday),
    hint: `${stats.value.salesCountToday || 0} món`,
    icon: 'income',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
  },
  {
    label: 'Chi hôm nay',
    value: formatCurrency(stats.value.expenseToday),
    hint: `${stats.value.expenseCountToday || 0} khoản`,
    icon: 'expense',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-red-600',
  },
  {
    label: 'Còn lại',
    value: formatCurrency(stats.value.netToday),
    hint: 'Thu − Chi trong ngày',
    icon: 'net',
    iconColor: stats.value.netToday >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50',
    valueClass: stats.value.netToday >= 0 ? 'text-emerald-600' : 'text-red-600',
  },
])

watch(
  () => productForm.value.paymentMethod,
  (method) => {
    if (method === 'mixed' && !productForm.value.cashAmount) {
      const half = Math.floor((Number(productForm.value.price) || 0) / 2)
      productForm.value.cashAmount = half || ''
    }
  },
)

watch(
  () => sellForm.value.paymentMethod,
  (method) => {
    if (method === 'mixed' && !sellForm.value.cashAmount) {
      const half = Math.floor(sellTotal.value / 2)
      sellForm.value.cashAmount = half || ''
    }
  },
)

function showFlash(message) {
  flash.value = message
  clearTimeout(showFlash._t)
  showFlash._t = setTimeout(() => {
    flash.value = ''
  }, 2200)
}

function buildPaymentPayload(method, total, cashInput) {
  if (method === 'cash') {
    return { payment_method: 'cash', cash_amount: total, transfer_amount: 0 }
  }
  if (method === 'transfer') {
    return { payment_method: 'transfer', cash_amount: 0, transfer_amount: total }
  }
  const cash = Number(cashInput) || 0
  const transfer = Math.max(0, total - cash)
  return {
    payment_method: 'mixed',
    cash_amount: cash,
    transfer_amount: transfer,
  }
}

function validateMixed(method, total, cashInput) {
  if (method !== 'mixed') return ''
  const cash = Number(cashInput) || 0
  if (cash <= 0 || cash >= total) {
    return 'Với cả hai: nhập số tiền mặt (lớn hơn 0 và nhỏ hơn tổng).'
  }
  return ''
}

function paymentDetailText(row) {
  const method = row.paymentMethod
  const label = paymentMethodLabels[method] || method
  const cash = Number(row.cashAmount) || 0
  const transfer = Number(row.transferAmount) || 0

  if (method === 'cash') return `${label} · nhận TM ${formatCurrency(cash || row.amount)}`
  if (method === 'transfer') return `${label} · TK ${formatCurrency(transfer || row.amount)}`
  if (method === 'mixed') {
    return `${label} · TM ${formatCurrency(cash)} + TK ${formatCurrency(transfer)}`
  }
  return label
}

async function loadProducts() {
  loadingProducts.value = true
  try {
    const result = await fetchQuanProducts({ active_only: true })
    products.value = result.rows ?? result
    if (result.categories?.length) {
      quanCategories.value = result.categories
    }
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không tải được danh sách sản phẩm.'
  } finally {
    loadingProducts.value = false
  }
}

async function loadToday() {
  loadingDay.value = true
  try {
    const data = await fetchQuanEntries({ period: 'today', per_page: 200 })
    todayEntries.value = data.rows ?? []
    if (data.stats) stats.value = { ...stats.value, ...data.stats }
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không tải được sổ ngày.'
  } finally {
    loadingDay.value = false
  }
}

async function refreshAll() {
  loadError.value = ''
  await Promise.all([loadProducts(), loadToday()])
}

function openSell(product) {
  sellForm.value = {
    product,
    price: product.price ?? '',
    qty: 1,
    paymentMethod: 'cash',
    cashAmount: '',
  }
  formError.value = ''
  showSellModal.value = true
}

async function confirmSell() {
  const product = sellForm.value.product
  if (!product || sellingId.value) return

  const unitPrice = Number(sellForm.value.price)
  const qty = Math.max(1, Number(sellForm.value.qty) || 1)
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    formError.value = 'Nhập giá bán lần này.'
    return
  }

  const total = unitPrice * qty
  const mixedErr = validateMixed(sellForm.value.paymentMethod, total, sellForm.value.cashAmount)
  if (mixedErr) {
    formError.value = mixedErr
    return
  }

  sellingId.value = product.id
  saving.value = true
  formError.value = ''
  const pay = buildPaymentPayload(sellForm.value.paymentMethod, total, sellForm.value.cashAmount)
  const payLabel = paymentMethodLabels[pay.payment_method] || pay.payment_method

  try {
    await createQuanEntry({
      type: 'income',
      quan_product_id: product.id,
      qty,
      amount: unitPrice,
      ...pay,
    })
    showSellModal.value = false
    showFlash(`Đã bán: ${product.name} · ${formatCurrency(total)} · ${payLabel}`)
    await loadToday()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không ghi được bán hàng.'
  } finally {
    sellingId.value = null
    saving.value = false
  }
}

function openAddProduct() {
  productModalMode.value = 'create'
  editingProductId.value = null
  productForm.value = {
    name: '',
    category: categoryFilter.value !== 'all' ? categoryFilter.value : 'dich-vu',
    price: '',
    paymentMethod: 'cash',
    cashAmount: '',
  }
  formError.value = ''
  showProductModal.value = true
}

function openEditProduct(product) {
  productModalMode.value = 'edit'
  editingProductId.value = product.id
  productForm.value = {
    name: product.name || '',
    category: product.category || 'khac',
    price: product.price ?? '',
    paymentMethod: 'cash',
    cashAmount: '',
  }
  formError.value = ''
  showProductModal.value = true
}

async function saveProduct() {
  const name = productForm.value.name.trim()
  const category = productForm.value.category || 'khac'
  const price = Number(productForm.value.price)
  if (!name) {
    formError.value = 'Nhập tên sản phẩm.'
    return
  }
  if (!Number.isFinite(price) || price <= 0) {
    formError.value = 'Nhập giá tham chiếu hợp lệ.'
    return
  }

  if (productModalMode.value === 'edit') {
    saving.value = true
    formError.value = ''
    try {
      await updateQuanProduct(editingProductId.value, { name, category, price })
      showProductModal.value = false
      showFlash(`Đã cập nhật: ${name}`)
      await loadProducts()
    } catch (err) {
      formError.value = err.response?.data?.message || 'Không cập nhật được sản phẩm.'
    } finally {
      saving.value = false
    }
    return
  }

  const mixedErr = validateMixed(productForm.value.paymentMethod, price, productForm.value.cashAmount)
  if (mixedErr) {
    formError.value = mixedErr
    return
  }

  saving.value = true
  formError.value = ''
  try {
    const { data } = await createQuanProduct({ name, category, price })
    const created = data?.data
    if (!created?.id) {
      showProductModal.value = false
      showFlash('Đã thêm sản phẩm')
      await loadProducts()
      return
    }

    const pay = buildPaymentPayload(productForm.value.paymentMethod, price, productForm.value.cashAmount)
    await createQuanEntry({
      type: 'income',
      quan_product_id: created.id,
      qty: 1,
      amount: price,
      ...pay,
    })
    showProductModal.value = false
    showFlash(`Đã bán: ${created.name} · ${paymentMethodLabels[pay.payment_method]}`)
    await Promise.all([loadProducts(), loadToday()])
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thêm được sản phẩm.'
  } finally {
    saving.value = false
  }
}

function openExpense() {
  expenseForm.value = {
    title: '',
    amount: '',
    paymentMethod: 'cash',
    cashAmount: '',
    note: '',
  }
  formError.value = ''
  showExpenseModal.value = true
}

async function saveExpense() {
  const title = expenseForm.value.title.trim()
  const amount = Number(expenseForm.value.amount)
  if (!title) {
    formError.value = 'Nhập tên khoản chi.'
    return
  }
  if (!amount || amount <= 0) {
    formError.value = 'Nhập số tiền hợp lệ.'
    return
  }

  const mixedErr = validateMixed(expenseForm.value.paymentMethod, amount, expenseForm.value.cashAmount)
  if (mixedErr) {
    formError.value = mixedErr
    return
  }

  saving.value = true
  formError.value = ''
  try {
    const pay = buildPaymentPayload(expenseForm.value.paymentMethod, amount, expenseForm.value.cashAmount)
    await createQuanEntry({
      type: 'expense',
      title,
      amount,
      note: expenseForm.value.note || undefined,
      ...pay,
    })
    showExpenseModal.value = false
    showFlash('Đã ghi khoản chi')
    await loadToday()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không ghi được khoản chi.'
  } finally {
    saving.value = false
  }
}

async function removeEntry(entry) {
  if (!confirm(`Xóa "${entry.title}"?`)) return
  try {
    await deleteQuanEntry(entry.id)
    await loadToday()
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không xóa được.'
  }
}

function openEditEntry(entry) {
  editingEntry.value = entry
  showEditEntry.value = true
}

async function saveEditEntry(payload) {
  if (!editingEntry.value?.id) return
  try {
    await updateQuanEntry(editingEntry.value.id, payload)
    showEditEntry.value = false
    editingEntry.value = null
    showFlash('Đã cập nhật giao dịch')
    await loadToday()
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không sửa được.'
  }
}

async function hideProduct(product) {
  if (!confirm(`Ẩn "${product.name}" khỏi quầy?`)) return
  try {
    await deleteQuanProduct(product.id)
    await loadProducts()
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Không ẩn được sản phẩm.'
  }
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

async function loadStatement() {
  loadingStatement.value = true
  statementError.value = ''
  try {
    const data = await fetchQuanEntries({ period: statementPeriod.value, per_page: 200 })
    statementRows.value = data.rows ?? []
  } catch (err) {
    statementError.value = err.response?.data?.message || 'Không tải được sao kê.'
    statementRows.value = []
  } finally {
    loadingStatement.value = false
  }
}

async function openStatement() {
  showStatementModal.value = true
  await loadStatement()
}

watch(statementPeriod, () => {
  if (showStatementModal.value) loadStatement()
})

function printStatement() {
  document.body.classList.add('printing-quan-statement')
  const cleanup = () => {
    document.body.classList.remove('printing-quan-statement')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.setTimeout(() => {
    window.print()
    window.setTimeout(cleanup, 1000)
  }, 50)
}

async function saveStatementImage() {
  const el = statementSheetRef.value
  if (!el) return
  savingImage.value = true
  statementError.value = ''
  try {
    const datePart = statementDateRange.value.from?.replace(/\//g, '-') || 'sao-ke'
    await downloadElementAsPng(el, `sao-ke-quan-${datePart}`)
    showFlash('Đã tải ảnh sao kê về máy')
  } catch (err) {
    statementError.value = err.message || 'Không lưu được ảnh.'
  } finally {
    savingImage.value = false
  }
}

async function archiveTodayStatement() {
  savingStatement.value = true
  statementError.value = ''
  try {
    const { data } = await saveQuanStatement({
      statement_date: new Date().toISOString().slice(0, 10),
      force: true,
    })
    showFlash(data?.message || 'Đã lưu sao kê vào kho')
  } catch (err) {
    statementError.value = err.response?.data?.message || 'Không lưu được sao kê.'
  } finally {
    savingStatement.value = false
  }
}

function denyStatementsAccess() {
  showFlash('Chỉ Admin Quán mới mở được Kho sao kê')
}

function onArchiveStatement() {
  if (!canManageStatements.value) {
    denyStatementsAccess()
    return
  }
  archiveTodayStatement()
}

onMounted(refreshAll)
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6 lg:p-8">
    <AppContentBreadcrumb />

    <div
      v-if="loadError"
      class="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      {{ loadError }}
    </div>

    <div
      v-if="flash"
      class="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
    >
      {{ flash }}
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <AppStatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :hint="card.hint"
        :icon="card.icon"
        :icon-color="card.iconColor"
        :value-class="card.valueClass"
        value-size="md"
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
      <div class="min-w-0 rounded-[20px] border border-amber-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="border-b border-amber-100 px-4 py-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700">Quầy bán hàng</p>
              <h2 class="text-xl font-black text-[#111118]">Sản phẩm theo danh mục</h2>
              <p class="text-xs text-slate-500">
                Giá trên thẻ là giá tham chiếu — mỗi lần bán có thể chỉnh lại.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-50"
                @click="openStatement"
              >
                In sao kê
              </button>
              <RouterLink
                :to="{ name: 'quan-costs' }"
                class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                Giá nhập &amp; lời
              </RouterLink>
              <button
                v-if="canManageStatements"
                type="button"
                class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                @click="$router.push({ name: 'quan-statements' })"
              >
                Kho sao kê
              </button>
              <button
                v-else
                type="button"
                class="cursor-not-allowed rounded-[12px] bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 ring-1 ring-slate-200"
                title="Chỉ Admin Quán mới mở được"
                @click="denyStatementsAccess"
              >
                Khóa · Kho sao kê
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                @click="openAddProduct"
              >
                + Thêm sản phẩm
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-white px-3 py-2 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                @click="openExpense"
              >
                + Ghi chi
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-bold transition"
              :class="
                categoryFilter === 'all'
                  ? 'bg-[#111118] text-white'
                  : 'bg-white text-slate-600 ring-1 ring-amber-200 hover:bg-amber-50'
              "
              @click="categoryFilter = 'all'"
            >
              Tất cả
            </button>
            <button
              v-for="cat in quanCategories"
              :key="cat.value"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-bold transition"
              :class="
                categoryFilter === cat.value
                  ? 'bg-[#111118] text-white'
                  : 'bg-white text-slate-600 ring-1 ring-amber-200 hover:bg-amber-50'
              "
              @click="categoryFilter = cat.value"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="mt-3 flex items-center gap-2 rounded-[14px] border border-amber-200 bg-amber-50/60 px-3 py-2.5">
            <input
              v-model="productSearch"
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              class="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <AppInlineLoader v-if="loadingProducts" size="xs" inline />
          </div>
        </div>

        <AppEmptyState
          v-if="!loadingProducts && filteredProducts.length === 0"
          size="sm"
          title="Không có sản phẩm"
          description="Đổi danh mục, hoặc bấm Thêm sản phẩm để tạo mới."
        />

        <div v-else class="space-y-5 p-4">
          <section v-for="group in productsByCategory" :key="group.value">
            <div class="mb-2 flex items-center gap-2">
              <h3 class="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
                {{ group.label }}
              </h3>
              <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {{ group.items.length }}
              </span>
              <div class="h-px flex-1 bg-amber-100" />
            </div>

            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              <article
                v-for="product in group.items"
                :key="product.id"
                class="flex flex-col rounded-[16px] border border-amber-100 bg-gradient-to-b from-white to-[#fff8f0] p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                @contextmenu.prevent="hideProduct(product)"
              >
                <p class="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[#111118]">
                  {{ product.name }}
                </p>
                <p class="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Giá tham chiếu
                </p>
                <p class="text-base font-black tabular-nums text-emerald-700">
                  {{ formatCurrency(product.price) }}
                </p>
                <div class="mt-3 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    class="rounded-[10px] bg-white px-2 py-2 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    @click.stop="openEditProduct(product)"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    class="rounded-[10px] bg-emerald-600 px-2 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    :disabled="sellingId === product.id"
                    @click.stop="openSell(product)"
                  >
                    {{ sellingId === product.id ? '...' : 'Bán' }}
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>

      <aside class="space-y-4 lg:sticky lg:top-4">
        <div class="rounded-[20px] border border-amber-200 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700">Cuối ngày</p>
              <h3 class="text-lg font-black text-[#111118]">Tổng kết hôm nay</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-[10px] bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-100"
                @click="loadToday"
              >
                Làm mới
              </button>
              <button
                type="button"
                class="rounded-[10px] bg-[#111118] px-2.5 py-1.5 text-xs font-semibold text-white"
                @click="openStatement"
              >
                In sao kê
              </button>
            </div>
          </div>

          <div class="mt-4 space-y-2 rounded-[14px] bg-amber-50/70 p-3 text-sm ring-1 ring-amber-100">
            <div class="flex justify-between">
              <span class="text-slate-500">Tổng bán</span>
              <strong class="text-emerald-700">{{ formatCurrency(stats.incomeToday) }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Tiền mặt nhận</span>
              <strong class="text-emerald-800">{{ formatCurrency(cashToday) }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Chuyển khoản</span>
              <strong class="text-sky-700">{{ formatCurrency(transferToday) }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Tổng chi</span>
              <strong class="text-red-600">{{ formatCurrency(stats.expenseToday) }}</strong>
            </div>
            <div class="flex justify-between border-t border-amber-100 pt-2">
              <span class="font-semibold text-slate-700">Còn lại</span>
              <strong :class="stats.netToday >= 0 ? 'text-emerald-700' : 'text-red-600'">
                {{ formatCurrency(stats.netToday) }}
              </strong>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Bán theo mặt hàng</p>
            <AppInlineLoader v-if="loadingDay" size="xs" class="mt-2" />
            <ul v-else-if="soldByProduct.length" class="mt-2 space-y-2">
              <li
                v-for="row in soldByProduct"
                :key="row.title"
                class="flex items-start justify-between gap-2 rounded-[12px] bg-emerald-50/60 px-3 py-2 text-sm ring-1 ring-emerald-100"
              >
                <div class="min-w-0">
                  <p class="truncate font-semibold text-[#111118]">{{ row.title }}</p>
                  <p class="text-[11px] text-slate-500">x{{ row.qty }}</p>
                </div>
                <p class="shrink-0 font-bold tabular-nums text-emerald-700">{{ formatCurrency(row.amount) }}</p>
              </li>
            </ul>
            <p v-else class="mt-2 text-sm text-slate-400">Chưa bán món nào.</p>
          </div>

          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Chi trong ngày</p>
            <ul v-if="expensesToday.length" class="mt-2 space-y-2">
              <li
                v-for="row in expensesToday"
                :key="row.id"
                class="flex items-start justify-between gap-2 rounded-[12px] bg-red-50/70 px-3 py-2 text-sm ring-1 ring-red-100"
              >
                <div class="min-w-0">
                  <p class="truncate font-semibold text-[#111118]">{{ row.title }}</p>
                  <p class="text-[11px] text-slate-500">
                    {{ formatTime(row.occurredAt) }} · {{ paymentDetailText(row) }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="font-bold tabular-nums text-red-600">{{ formatCurrency(row.amount) }}</p>
                  <div class="mt-0.5 flex justify-end gap-2">
                    <button type="button" class="text-[10px] font-semibold text-slate-500 hover:text-amber-800" @click="openEditEntry(row)">
                      Sửa
                    </button>
                    <button type="button" class="text-[10px] font-semibold text-slate-400 hover:text-red-600" @click="removeEntry(row)">
                      Xóa
                    </button>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="mt-2 text-sm text-slate-400">Chưa có khoản chi.</p>
          </div>
        </div>

        <div class="rounded-[20px] border border-amber-200 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Lịch sử bán hôm nay</p>
          <ul v-if="salesToday.length" class="mt-2 max-h-72 space-y-2 overflow-y-auto">
            <li
              v-for="row in salesToday"
              :key="row.id"
              class="rounded-[12px] px-2 py-2 text-sm hover:bg-amber-50/80"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate font-medium text-[#111118]">{{ row.title }}</p>
                  <p class="text-[11px] text-slate-400">
                    {{ formatTime(row.occurredAt) }} · x{{ row.qty || 1 }}
                  </p>
                  <p class="mt-0.5 text-[11px] font-medium text-slate-600">
                    {{ paymentDetailText(row) }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="font-semibold tabular-nums text-emerald-700">+{{ formatCurrency(row.amount) }}</p>
                  <div class="mt-0.5 flex justify-end gap-2">
                    <button type="button" class="text-[10px] text-slate-500 hover:text-amber-800" @click="openEditEntry(row)">
                      Sửa
                    </button>
                    <button type="button" class="text-[10px] text-slate-400 hover:text-red-600" @click="removeEntry(row)">
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          <p v-else class="mt-2 text-sm text-slate-400">Chưa có giao dịch bán.</p>
        </div>
      </aside>
    </div>

    <!-- Modal bán sản phẩm có sẵn -->
    <AppModal :open="showSellModal" @close="showSellModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-amber-200 bg-white shadow-2xl">
        <div class="border-b border-amber-100 px-6 py-4">
          <p class="text-xs font-bold uppercase tracking-widest text-amber-700">Bán hàng</p>
          <h3 class="mt-1 text-lg font-bold text-[#111118]">{{ sellForm.product?.name }}</h3>
          <p class="mt-1 text-xs text-slate-500">
            Tham chiếu: {{ formatCurrency(sellForm.product?.price || 0) }} — chỉnh giá bên dưới cho đúng lần bán này.
          </p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Giá lần này
              </label>
              <AppMoneyInput
                v-model="sellForm.price"
                placeholder="0"
                show-preview
                input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Số lượng
              </label>
              <input
                v-model.number="sellForm.qty"
                type="number"
                min="1"
                max="99"
                class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div class="flex items-center justify-between rounded-[14px] bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-100">
            <span class="font-medium text-slate-600">Tổng thu lần này</span>
            <strong class="tabular-nums text-emerald-700">{{ formatCurrency(sellTotal) }}</strong>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
              Thanh toán
            </label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="opt in salePaymentOptions"
                :key="opt.value"
                type="button"
                class="rounded-[12px] px-2 py-2.5 text-xs font-bold transition"
                :class="
                  sellForm.paymentMethod === opt.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-amber-50/80 text-slate-600 ring-1 ring-amber-100 hover:bg-amber-50'
                "
                @click="sellForm.paymentMethod = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <template v-if="sellForm.paymentMethod === 'mixed'">
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Tiền mặt nhận
              </label>
              <AppMoneyInput
                v-model="sellForm.cashAmount"
                :max="sellTotal"
                placeholder="0"
                show-preview
                input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div class="flex items-center justify-between rounded-[14px] bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-100">
              <span class="font-medium text-slate-600">Chuyển khoản (tài khoản)</span>
              <strong class="tabular-nums text-sky-700">{{ formatCurrency(sellFormTransfer) }}</strong>
            </div>
          </template>
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              @click="showSellModal = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              :disabled="saving"
              @click="confirmSell"
            >
              {{ saving ? 'Đang lưu...' : 'Xác nhận bán' }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Modal thêm / sửa sản phẩm -->
    <AppModal :open="showProductModal" @close="showProductModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-amber-200 bg-white shadow-2xl">
        <div class="border-b border-amber-100 px-6 py-4">
          <p class="text-xs font-bold uppercase tracking-widest text-amber-700">
            {{ productModalMode === 'edit' ? 'Chỉnh sửa' : 'Thêm mới' }}
          </p>
          <h3 class="mt-1 text-lg font-bold text-[#111118]">
            {{ productModalMode === 'edit' ? 'Sửa sản phẩm quầy' : 'Sản phẩm bán tại quầy' }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            {{
              productModalMode === 'edit'
                ? 'Đổi tên, danh mục hoặc giá tham chiếu — không ghi bán mới.'
                : 'Thêm xong sẽ bán luôn 1 lần theo hình thức thanh toán bên dưới.'
            }}
          </p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên sản phẩm</label>
            <input
              v-model="productForm.name"
              type="text"
              placeholder="VD: Thay màn hình, Sạc / cáp sạc..."
              class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Danh mục</label>
            <select
              v-model="productForm.category"
              class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            >
              <option v-for="cat in quanCategories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
              Giá tham chiếu
            </label>
            <AppMoneyInput
              v-model="productForm.price"
              placeholder="50.000"
              show-preview
              input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            />
            <p class="mt-1 text-[11px] text-slate-400">Khi bán có thể nhập giá khác cho từng lần.</p>
          </div>
          <template v-if="productModalMode === 'create'">
            <div>
              <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Thanh toán lần bán này
              </label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="opt in salePaymentOptions"
                  :key="opt.value"
                  type="button"
                  class="rounded-[12px] px-2 py-2.5 text-xs font-bold transition"
                  :class="
                    productForm.paymentMethod === opt.value
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-amber-50/80 text-slate-600 ring-1 ring-amber-100 hover:bg-amber-50'
                  "
                  @click="productForm.paymentMethod = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
            <template v-if="productForm.paymentMethod === 'mixed'">
              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Tiền mặt nhận
                </label>
                <AppMoneyInput
                  v-model="productForm.cashAmount"
                  :max="Number(productForm.price) || 0"
                  placeholder="0"
                  show-preview
                  input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                />
              </div>
              <div class="flex items-center justify-between rounded-[14px] bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-100">
                <span class="font-medium text-slate-600">Chuyển khoản (tài khoản)</span>
                <strong class="tabular-nums text-sky-700">{{ formatCurrency(productFormTransfer) }}</strong>
              </div>
            </template>
          </template>
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              @click="showProductModal = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              :disabled="saving"
              @click="saveProduct"
            >
              {{
                saving
                  ? 'Đang lưu...'
                  : productModalMode === 'edit'
                    ? 'Lưu thay đổi'
                    : 'Thêm & bán'
              }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <AppModal :open="showExpenseModal" @close="showExpenseModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-amber-200 bg-white shadow-2xl">
        <div class="border-b border-amber-100 px-6 py-4">
          <p class="text-xs font-bold uppercase tracking-widest text-amber-700">Chi quán</p>
          <h3 class="mt-1 text-lg font-bold text-[#111118]">Ghi khoản chi</h3>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên khoản chi</label>
            <input
              v-model="expenseForm.title"
              type="text"
              placeholder="VD: Mua đá, Điện nước, Ship hàng..."
              class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số tiền</label>
            <AppMoneyInput
              v-model="expenseForm.amount"
              placeholder="100.000"
              show-preview
              input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Thanh toán</label>
            <select
              v-model="expenseForm.paymentMethod"
              class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            >
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="mixed">Cả hai (TM + CK)</option>
            </select>
          </div>
          <template v-if="expenseForm.paymentMethod === 'mixed'">
            <div>
              <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Phần tiền mặt
              </label>
              <AppMoneyInput
                v-model="expenseForm.cashAmount"
                :max="Number(expenseForm.amount) || 0"
                placeholder="0"
                show-preview
                input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div class="flex items-center justify-between rounded-[14px] bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-100">
              <span class="font-medium text-slate-600">Phần chuyển khoản</span>
              <strong class="tabular-nums text-sky-700">{{ formatCurrency(expenseFormTransfer) }}</strong>
            </div>
          </template>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú</label>
            <textarea
              v-model="expenseForm.note"
              rows="2"
              class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              @click="showExpenseModal = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              :disabled="saving"
              @click="saveExpense"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu chi' }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Xem trước & in sao kê -->
    <Teleport to="body">
      <div
        v-if="showStatementModal"
        class="fixed inset-0 z-[120] flex flex-col bg-slate-900/50 p-3 sm:p-6"
      >
        <div class="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-amber-200 bg-[#fffaf5] shadow-2xl">
          <div class="no-print flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-white px-4 py-3 sm:px-6">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700">Sao kê báo cáo</p>
              <h3 class="text-lg font-black text-[#111118]">Bảng thu — chi quán</h3>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex rounded-[12px] bg-amber-50 p-1 ring-1 ring-amber-100">
                <button
                  v-for="opt in statementPeriodOptions"
                  :key="opt.value"
                  type="button"
                  class="rounded-[10px] px-3 py-1.5 text-xs font-bold transition"
                  :class="
                    statementPeriod === opt.value
                      ? 'bg-white text-amber-900 shadow-sm'
                      : 'text-slate-500 hover:text-amber-800'
                  "
                  :disabled="loadingStatement"
                  @click="statementPeriod = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <button
                type="button"
                class="rounded-[12px] px-4 py-2 text-xs font-bold disabled:opacity-60"
                :class="
                  canManageStatements
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-slate-200'
                "
                :disabled="
                  canManageStatements
                    ? loadingStatement || savingStatement || statementPeriod !== 'today'
                    : false
                "
                :title="
                  !canManageStatements
                    ? 'Chỉ Admin Quán mới lưu kho được'
                    : statementPeriod !== 'today'
                      ? 'Chỉ lưu được sao kê hôm nay từ đây'
                      : ''
                "
                @click="onArchiveStatement"
              >
                {{
                  canManageStatements
                    ? savingStatement
                      ? 'Đang lưu...'
                      : 'Lưu vào kho'
                    : 'Khóa · Lưu vào kho'
                }}
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
                :disabled="loadingStatement || savingImage"
                @click="saveStatementImage"
              >
                {{ savingImage ? 'Đang tạo ảnh...' : 'Lưu ảnh' }}
              </button>
              <button
                type="button"
                class="rounded-[12px] bg-[#111118] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                :disabled="loadingStatement"
                @click="printStatement"
              >
                In báo cáo
              </button>
              <button
                v-if="canManageStatements"
                type="button"
                class="rounded-[12px] px-4 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-50"
                @click="$router.push({ name: 'quan-statements' })"
              >
                Kho sao kê
              </button>
              <button
                v-else
                type="button"
                class="cursor-not-allowed rounded-[12px] px-4 py-2 text-xs font-semibold text-slate-400 ring-1 ring-slate-200"
                title="Chỉ Admin Quán mới mở được"
                @click="denyStatementsAccess"
              >
                Khóa · Kho sao kê
              </button>
              <button
                type="button"
                class="rounded-[12px] px-4 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                @click="showStatementModal = false"
              >
                Đóng
              </button>
            </div>
          </div>

          <div class="custom-scrollbar-content flex-1 overflow-y-auto bg-slate-100/80 p-3 sm:p-6">
            <p v-if="statementError" class="mb-3 rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-700">
              {{ statementError }}
            </p>
            <AppInlineLoader
              v-if="loadingStatement"
              block
              size="md"
              message="Đang tải sao kê..."
              class="rounded-[16px] bg-white"
            />
            <div v-else ref="statementSheetRef" class="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
              <QuanStatementSheet
                class="quan-print-target"
                :rows="statementRows"
                :period-label="statementPeriodLabel"
                :period-from="statementDateRange.from"
                :period-to="statementDateRange.to"
                :staff-name="auth.user?.name || ''"
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <QuanEntryEditModal
      :open="showEditEntry"
      :entry="editingEntry"
      @close="showEditEntry = false"
      @save="saveEditEntry"
    />
  </div>
</template>

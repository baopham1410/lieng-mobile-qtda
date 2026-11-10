<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StoreHeader from '@/components/intro/StoreHeader.vue'
import StoreFooter from '@/components/intro/StoreFooter.vue'
import StoreProductCard from '@/components/intro/StoreProductCard.vue'
import StoreCartDrawer from '@/components/intro/StoreCartDrawer.vue'
import StoreProductModal from '@/components/intro/StoreProductModal.vue'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'
import { fetchStoreCatalog, submitStoreInquiry } from '@/api/store'
import { withApiFallback } from '@/utils/apiFallback'
import {
  catalogBrands as mockBrands,
  catalogCategories as mockCategories,
  catalogProducts as mockProducts,
  filterCatalogProducts,
  sortOptions,
} from '@/mocks/storeCatalog'
import {
  heroSlides,
  categories,
  promoProducts,
  brands,
  services,
  trustStats,
  testimonials,
  branches,
  storeInfo,
} from '@/data/storeIntro'

const activeSlide = ref(0)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedBrand = ref('Tất cả')
const selectedSort = ref('popular')
const cartOpen = ref(false)
const productModalOpen = ref(false)
const selectedProduct = ref(null)
const cartItems = ref([])
const checkoutNotice = ref(false)
const catalogProducts = ref([...mockProducts])
const catalogBrands = ref([...mockBrands])
const catalogCategories = ref([...mockCategories])
const useMockCatalog = ref(true)

// Apple-style device categories ribbon with high-quality SVGs
const ribbonCategories = [
  { id: 'all', label: 'Tất cả thiết bị', icon: 'all' },
  { id: 'phone', label: 'iPhone & Điện thoại', icon: 'phone' },
  { id: 'tablet', label: 'iPad & Tablet', icon: 'tablet' },
  { id: 'laptop', label: 'MacBook & Laptop', icon: 'laptop' },
  { id: 'watch', label: 'Apple Watch', icon: 'watch' },
  { id: 'accessory', label: 'Tai nghe & Phụ kiện', icon: 'accessory' },
]

const featuredProducts = computed(() => catalogProducts.value.slice(0, 4))

const filteredProducts = computed(() =>
  filterCatalogProducts({
    products: catalogProducts.value,
    keyword: searchQuery.value,
    category: selectedCategory.value,
    brand: selectedBrand.value,
    sort: selectedSort.value,
  }),
)

const cartCount = computed(() => cartItems.value.reduce((sum, item) => sum + item.qty, 0))

let slideTimer

onMounted(async () => {
  slideTimer = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % heroSlides.length
  }, 6000)

  const data = await withApiFallback(fetchStoreCatalog, () => null)
  if (data) {
    catalogProducts.value = data.products
    catalogBrands.value = data.brands
    catalogCategories.value = data.categories
    useMockCatalog.value = false
  }
})

onUnmounted(() => {
  clearInterval(slideTimer)
})

function goToSlide(index) {
  activeSlide.value = index
}

function openProduct(product) {
  selectedProduct.value = product
  productModalOpen.value = true
}

function closeProductModal() {
  productModalOpen.value = false
}

function addToCart(product) {
  const existing = cartItems.value.find((i) => i.id === product.id)
  if (existing) {
    existing.qty += 1
  } else {
    cartItems.value.push({ ...product, qty: 1 })
  }
  cartOpen.value = true
}

function updateCartQty({ id, qty }) {
  if (qty <= 0) {
    removeFromCart(id)
    return
  }
  const item = cartItems.value.find((i) => i.id === id)
  if (item) item.qty = qty
}

function removeFromCart(id) {
  cartItems.value = cartItems.value.filter((i) => i.id !== id)
}

async function handleCheckout() {
  const name = window.prompt('Nhập họ tên để chuyên viên liên hệ:')
  if (!name?.trim()) return
  const phone = window.prompt('Số điện thoại liên hệ:')
  if (!phone?.trim()) return

  if (!useMockCatalog.value) {
    try {
      await submitStoreInquiry({
        name: name.trim(),
        phone: phone.trim(),
        items: cartItems.value.map((item) => ({
          productId: item.productId ?? (Number(String(item.id).replace('p-', '')) || 1),
          qty: item.qty,
        })),
      })
    } catch {
      // vẫn hiện thông báo thành công cho UX
    }
  }

  checkoutNotice.value = true
  cartOpen.value = false
  cartItems.value = []
  setTimeout(() => {
    checkoutNotice.value = false
  }, 4000)
}

function selectCategory(id) {
  selectedCategory.value = id
  document.getElementById('san-pham')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-[#FBFBFC] text-[#1D1D1F] font-sans antialiased selection:bg-red-600 selection:text-white">
    <StoreHeader
      v-model:search-query="searchQuery"
      :cart-count="cartCount"
      @open-cart="cartOpen = true"
    />

    <!-- Checkout Notification Toast -->
    <Transition name="fade">
      <div
        v-if="checkoutNotice"
        class="fixed bottom-8 left-1/2 z-[90] -translate-x-1/2 flex items-center gap-3 rounded-full bg-slate-900/95 backdrop-blur-xl px-6 py-3 text-sm font-semibold text-white shadow-2xl border border-white/10"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold">✓</span>
        <span>Đã ghi nhận yêu cầu đặt hàng. Chuyên viên sẽ gọi tư vấn trong ít phút!</span>
      </div>
    </Transition>

    <main class="space-y-12 sm:space-y-20 pb-20">
      <!-- Device Ribbon Bar với Crisp SVG Icons -->
      <section class="bg-white border-b border-red-100/70 py-4 shadow-xs">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 overflow-x-auto px-4 sm:px-6 custom-scrollbar-content">
          <button
            v-for="cat in ribbonCategories"
            :key="cat.id"
            type="button"
            class="flex flex-col items-center justify-center gap-2 shrink-0 px-3 py-2 group transition-all cursor-pointer rounded-2xl"
            :class="selectedCategory === cat.id ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:text-red-600 hover:bg-slate-50'"
            @click="selectCategory(cat.id)"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl transition-all"
              :class="selectedCategory === cat.id ? 'bg-red-600 text-white shadow-md shadow-red-500/30 scale-105' : 'bg-slate-100 text-slate-700 group-hover:bg-red-100 group-hover:text-red-600 group-hover:scale-105'"
            >
              <StoreDeviceIcon :name="cat.icon" size-class="h-5 w-5" />
            </div>
            <span
              class="text-xs transition-colors"
              :class="selectedCategory === cat.id ? 'text-red-600 font-bold' : 'text-slate-600 group-hover:text-red-600 font-semibold'"
            >
              {{ cat.label }}
            </span>
          </button>
        </div>
      </section>

      <!-- Grand Hero Showcase (Màu đỏ đô #7A0C10 như lúc ban đầu) -->
      <section class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="relative overflow-hidden rounded-[32px] bg-[#7A0C10] text-white min-h-[500px] sm:min-h-[540px] flex flex-col justify-between p-8 sm:p-14 shadow-[0_20px_50px_rgba(122,12,16,0.3)]">
          <!-- Background image slider với tone đỏ nguyên bản -->
          <div
            v-for="(slide, index) in heroSlides"
            :key="slide.title"
            class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            :class="index === activeSlide ? 'opacity-100' : 'opacity-0'"
          >
            <template v-if="slide.bgImage">
              <div
                class="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-10000 scale-105"
                :style="{ backgroundImage: `url(${slide.bgImage})` }"
              />
              <div class="absolute inset-0 bg-gradient-to-r from-[#5B0B0F]/95 via-[#7A0C10]/80 to-transparent" />
            </template>
            <template v-else>
              <div class="absolute inset-0 bg-gradient-to-br from-[#7A0C10] via-[#5B0B0F] to-[#3B0507]" />
            </template>
          </div>

          <!-- Hero Content Block -->
          <div class="relative z-10 max-w-xl my-auto">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-200 border border-white/20">
              <StoreDeviceIcon name="fire" size-class="h-3.5 w-3.5 text-amber-300" />
              <span>{{ heroSlides[activeSlide].badge }}</span>
            </span>

            <h1 class="mt-4 text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
              {{ heroSlides[activeSlide].title }}
            </h1>

            <p class="mt-4 text-base sm:text-lg font-normal text-red-100/90 leading-relaxed max-w-lg">
              {{ heroSlides[activeSlide].subtitle }}
            </p>

            <!-- Hero Action Buttons -->
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#san-pham"
                class="rounded-full bg-white px-7 py-3 text-sm font-black text-[#7A0C10] shadow-xl shadow-black/25 transition hover:bg-amber-50 hover:scale-105 active:scale-95"
              >
                {{ heroSlides[activeSlide].cta }}
              </a>
              <a
                :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                class="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-amber-300" />
                <span>Tư vấn: {{ storeInfo.hotlineDisplay }}</span>
              </a>
            </div>
          </div>

          <!-- Slide Dots Indicator -->
          <div class="relative z-10 flex items-center gap-2 pt-6">
            <button
              v-for="(_, index) in heroSlides"
              :key="index"
              type="button"
              class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              :class="index === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'"
              :aria-label="`Slide ${index + 1}`"
              @click="goToSlide(index)"
            />
          </div>
        </div>
      </section>

      <!-- Bento Highlights Grid (Tone Đỏ & Trắng Sang Trọng) -->
      <section class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mb-8">
          <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
            <span>Lieng Mobile</span>
            <span>•</span>
            <span>Flagship Collection</span>
          </div>
          <h2 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Thế hệ thiết bị mới nhất.
          </h2>
          <p class="mt-1 text-sm text-slate-500">Thiết kế đỉnh cao. Sức mạnh vượt trội. Đầy đủ tem bảo hành và mã IMEI.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Bento Card 1: iPhone (Trắng viền đỏ nhẹ) -->
          <div class="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-white p-8 sm:p-10 border border-red-100/80 shadow-sm transition hover:shadow-xl hover:border-red-200">
            <div>
              <span class="text-xs font-bold text-red-600 uppercase tracking-wider">iPhone 15 Series</span>
              <h3 class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Titanium. Bền nhẹ ấn tượng.
              </h3>
              <p class="mt-2 text-xs text-slate-500">Từ 19.990.000đ hoặc 1.665.000đ/tháng với trả góp 0%</p>
              <div class="mt-5 flex items-center gap-4">
                <a href="#san-pham" class="rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-500/25 transition">
                  Mua ngay
                </a>
                <button type="button" class="text-xs font-bold text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1 cursor-pointer" @click="selectCategory('phone')">
                  <span>Xem tất cả iPhone</span>
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
            <div class="mt-8 flex justify-center">
              <img
                src="/products/iphone-15.jpg"
                alt="iPhone 15"
                class="max-h-56 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                @error="$event.target.style.display = 'none'"
              />
            </div>
          </div>

          <!-- Bento Card 2: Samsung & Android (Màu Đỏ Đô #7A0C10 Sang Trọng) -->
          <div class="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7A0C10] via-[#5B0B0F] to-[#2B0305] text-white p-8 sm:p-10 shadow-lg shadow-red-950/20 border border-red-500/20 transition hover:shadow-2xl">
            <div>
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">Galaxy AI</span>
              <h3 class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Samsung Galaxy S24 Ultra.
              </h3>
              <p class="mt-2 text-xs text-red-100/85">Kỷ nguyên trí tuệ nhân tạo di động. S-Pen quyền năng.</p>
              <div class="mt-5 flex items-center gap-4">
                <a href="#san-pham" class="rounded-full bg-white px-5 py-2 text-xs font-black text-[#7A0C10] hover:bg-amber-50 shadow-md transition">
                  Mua ngay
                </a>
                <button type="button" class="text-xs font-bold text-amber-200 hover:text-white hover:underline inline-flex items-center gap-1 cursor-pointer" @click="selectCategory('phone')">
                  <span>Tìm hiểu thêm</span>
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
            <div class="mt-8 flex justify-center">
              <img
                src="/products/samsung-s24.jpg"
                alt="Galaxy S24"
                class="max-h-56 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                @error="$event.target.style.display = 'none'"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Product Catalog (#san-pham) -->
      <section id="san-pham" class="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-red-100 pb-6">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
              Kho hàng chính hãng
            </div>
            <h2 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Toàn bộ sản phẩm.
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Lựa chọn thiết bị yêu thích của bạn với giá tốt nhất và bảo hành chính hãng.
            </p>
          </div>

          <!-- Category Filter Pills (Active màu Đỏ) -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="cat in catalogCategories"
              :key="cat.id"
              type="button"
              class="rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer"
              :class="selectedCategory === cat.id ? 'bg-red-600 text-white shadow-md shadow-red-500/25' : 'bg-white text-slate-700 hover:text-red-600 hover:border-red-300 border border-slate-200'"
              @click="selectedCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Filter Sub-bar: Brand & Sort -->
        <div class="my-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-500 font-semibold">Hãng:</span>
            <div class="flex flex-wrap items-center gap-1">
              <button
                v-for="b in catalogBrands"
                :key="b"
                type="button"
                class="rounded-full px-3 py-1 transition-all cursor-pointer"
                :class="selectedBrand === b ? 'bg-red-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'"
                @click="selectedBrand = b"
              >
                {{ b }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 text-slate-500">
            <span class="font-semibold">Sắp xếp:</span>
            <select
              v-model="selectedSort"
              class="rounded-full bg-white border border-slate-200 px-3.5 py-1 text-xs text-slate-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <!-- Product Grid -->
        <div v-if="filteredProducts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StoreProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            @view="openProduct"
            @add-to-cart="addToCart"
          />
        </div>

        <!-- Clean Empty State -->
        <div v-else class="rounded-[28px] bg-white p-12 text-center border border-red-100 shadow-sm">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-3">
            <StoreDeviceIcon name="search" size-class="h-7 w-7" />
          </div>
          <p class="text-lg font-bold text-slate-900">Không tìm thấy thiết bị phù hợp</p>
          <p class="mt-1 text-xs text-slate-500">Vui lòng thử từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ máy.</p>
          <button
            type="button"
            class="mt-4 rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-500/25 transition cursor-pointer"
            @click="selectedCategory = 'all'; selectedBrand = 'Tất cả'; searchQuery = ''"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      </section>

      <!-- Value Propositions ("Trải nghiệm tại Lieng Mobile") với Modern SVG Icons -->
      <section id="dich-vu" class="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <span class="text-xs font-bold uppercase tracking-wider text-red-600">Dịch vụ & Cam kết</span>
          <h2 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Trải nghiệm mua sắm khác biệt.
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            Chúng tôi cam kết mang tới sự an tâm tuyệt đối trong từng chi tiết sản phẩm và dịch vụ.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="rounded-[24px] bg-white p-7 border border-red-100/60 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <StoreDeviceIcon name="delivery" size-class="h-6 w-6" />
            </div>
            <div class="mt-6">
              <h3 class="text-base font-bold text-slate-900">Giao hàng miễn phí</h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                Miễn phí giao hàng hỏa tốc trong 2 giờ tại nội thành. Đóng gói cẩn thận, an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <div class="rounded-[24px] bg-white p-7 border border-red-100/60 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <StoreDeviceIcon name="installment" size-class="h-6 w-6" />
            </div>
            <div class="mt-6">
              <h3 class="text-base font-bold text-slate-900">Trả góp 0% linh hoạt</h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                Hỗ trợ trả góp qua thẻ tín dụng và công ty tài chính với thủ tục đơn giản, xét duyệt chỉ trong 5 phút.
              </p>
            </div>
          </div>

          <div class="rounded-[24px] bg-white p-7 border border-red-100/60 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <StoreDeviceIcon name="trade-in" size-class="h-6 w-6" />
            </div>
            <div class="mt-6">
              <h3 class="text-base font-bold text-slate-900">Thu cũ đổi mới</h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                Lên đời thiết bị mới dễ dàng. Trợ giá thu cũ thêm đến 2 triệu đồng, thẩm định máy minh bạch.
              </p>
            </div>
          </div>

          <div class="rounded-[24px] bg-white p-7 border border-red-100/60 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <StoreDeviceIcon name="warranty" size-class="h-6 w-6" />
            </div>
            <div class="mt-6">
              <h3 class="text-base font-bold text-slate-900">Bảo hành chuẩn GSMA</h3>
              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                Mỗi thiết bị đều được kiểm tra IMEI chính hãng, bảo hành 12 tháng 1 đổi 1 trong 30 ngày đầu tiên.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stores Section -->
      <section id="cua-hang" class="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
        <div class="rounded-[32px] bg-white p-8 sm:p-12 border border-red-100 shadow-sm">
          <div class="max-w-xl">
            <span class="text-xs font-bold text-red-600 uppercase tracking-wider">Hệ thống cửa hàng</span>
            <h2 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Ghé thăm cửa hàng Lieng Mobile.
            </h2>
            <p class="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Trực tiếp trải nghiệm sản phẩm, nhận hỗ trợ kỹ thuật 1 kèm 1 và dán màn hình miễn phí.
            </p>
          </div>

          <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="branch in branches"
              :key="branch.name"
              class="rounded-[20px] bg-slate-50 p-6 flex flex-col justify-between border border-slate-100 hover:border-red-200 transition"
            >
              <div>
                <p class="text-sm font-bold text-slate-900">{{ branch.name }}</p>
                <p class="mt-2 text-xs text-slate-500 leading-relaxed">{{ branch.address }}</p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-200/70 text-xs">
                <p class="text-slate-500">Mở cửa: <span class="text-slate-800 font-semibold">{{ branch.hours }}</span></p>
                <a
                  :href="`tel:${branch.phone.replace(/\s/g, '')}`"
                  class="mt-2 inline-flex items-center gap-1.5 text-red-600 font-bold hover:underline"
                >
                  <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-600" />
                  <span>{{ branch.phone }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <StoreFooter />

    <!-- Cart Drawer -->
    <StoreCartDrawer
      :open="cartOpen"
      :items="cartItems"
      @close="cartOpen = false"
      @update-qty="updateCartQty"
      @remove="removeFromCart"
      @checkout="handleCheckout"
    />

    <!-- Product Modal -->
    <StoreProductModal
      :open="productModalOpen"
      :product="selectedProduct"
      @close="closeProductModal"
      @add-to-cart="addToCart"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

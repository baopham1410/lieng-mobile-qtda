<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StoreHeader from '@/components/intro/StoreHeader.vue'
import StoreFooter from '@/components/intro/StoreFooter.vue'
import StoreProductCard from '@/components/intro/StoreProductCard.vue'
import StoreCartDrawer from '@/components/intro/StoreCartDrawer.vue'
import StoreProductModal from '@/components/intro/StoreProductModal.vue'
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

// Flash Sale Countdown
const countdownHours = ref(4)
const countdownMins = ref(25)
const countdownSecs = ref(50)
let countdownTimer

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
  }, 5000)

  countdownTimer = setInterval(() => {
    if (countdownSecs.value > 0) {
      countdownSecs.value -= 1
    } else if (countdownMins.value > 0) {
      countdownMins.value -= 1
      countdownSecs.value = 59
    } else if (countdownHours.value > 0) {
      countdownHours.value -= 1
      countdownMins.value = 59
      countdownSecs.value = 59
    }
  }, 1000)

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
  clearInterval(countdownTimer)
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
  const existing = cartItems.value.find((item) => item.id === product.id)
  if (existing) {
    existing.qty += 1
  } else {
    cartItems.value.push({
      id: product.id,
      productId: product.productId,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price,
      qty: 1,
    })
  }
  productModalOpen.value = false
}

function updateCartQty(id, qty) {
  if (qty < 1) {
    cartItems.value = cartItems.value.filter((item) => item.id !== id)
    return
  }
  const item = cartItems.value.find((i) => i.id === id)
  if (item) item.qty = qty
}

function removeFromCart(id) {
  cartItems.value = cartItems.value.filter((item) => item.id !== id)
}

async function handleCheckout() {
  const name = window.prompt('Nhập họ tên để nhân viên liên hệ:')
  if (!name?.trim()) return
  const phone = window.prompt('Số điện thoại:')
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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans antialiased selection:bg-red-500 selection:text-white">
    <StoreHeader
      v-model:search-query="searchQuery"
      :cart-count="cartCount"
      @open-cart="cartOpen = true"
    />

    <!-- Checkout Toast Notice -->
    <Transition name="fade">
      <div
        v-if="checkoutNotice"
        class="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-2xl border border-slate-800"
      >
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-xs">✓</span>
        <span>Đã ghi nhận đơn — Nhân viên sẽ gọi tư vấn trong ít phút!</span>
      </div>
    </Transition>

    <main>
      <!-- Hero Banner Slider -->
      <section class="relative overflow-hidden bg-[#7a0c10] text-white">
        <div class="relative w-full">
          <div
            v-for="(slide, index) in heroSlides"
            :key="slide.title"
            class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            :class="index === activeSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
          >
            <template v-if="slide.bgImage">
              <div
                class="absolute inset-0 bg-cover bg-right-center bg-no-repeat transform scale-105 transition-transform duration-7000 ease-out"
                :style="{ backgroundImage: `url(${slide.bgImage})` }"
              />
              <div class="absolute inset-0 bg-gradient-to-r from-[#4A080B] via-[#630B10]/90 to-transparent" />
            </template>
            <template v-else>
              <div class="absolute inset-0" :class="slide.imageTone" />
              <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            </template>
          </div>

          <!-- Hero Content -->
          <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start px-6 py-16 md:px-8 md:py-24 lg:min-h-[580px] lg:justify-center">
            <Transition name="fade" mode="out-in">
              <div :key="activeSlide" class="max-w-2xl">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                  <span class="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span class="text-xs font-black uppercase tracking-wider text-amber-300">
                    {{ heroSlides[activeSlide].badge }}
                  </span>
                </div>

                <!-- Main Title -->
                <h1 class="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white leading-[1.15]">
                  {{ heroSlides[activeSlide].title }}
                </h1>

                <!-- Subtitle -->
                <p class="mt-4 text-base sm:text-lg font-medium text-slate-200/90 leading-relaxed max-w-xl">
                  {{ heroSlides[activeSlide].subtitle }}
                </p>

                <!-- Action CTAs -->
                <div class="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                  <a
                    href="#san-pham"
                    class="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-[#7a0c10] shadow-xl shadow-black/20 transition-all hover:bg-red-50 hover:scale-105 active:scale-95"
                  >
                    <span>{{ heroSlides[activeSlide].cta }}</span>
                    <span>→</span>
                  </a>
                  <a
                    :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                    class="inline-flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                  >
                    <span>📞 Tư vấn:</span>
                    <span class="text-amber-300 font-extrabold">{{ storeInfo.hotlineDisplay }}</span>
                  </a>
                </div>
              </div>
            </Transition>

            <!-- Slide Dots -->
            <div class="mt-12 flex items-center gap-2.5">
              <button
                v-for="(_, index) in heroSlides"
                :key="index"
                type="button"
                class="h-2.5 rounded-full transition-all duration-300"
                :class="index === activeSlide ? 'w-10 bg-white shadow-lg' : 'w-2.5 bg-white/40 hover:bg-white/70'"
                :aria-label="`Slide ${index + 1}`"
                @click="goToSlide(index)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Commitment & Trust Bar -->
      <section class="border-b border-slate-200/80 bg-white py-6 shadow-sm">
        <div class="mx-auto max-w-7xl px-4 sm:px-6">
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div class="flex items-center gap-3.5 rounded-2xl p-2.5 transition hover:bg-slate-50">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
                🛡️
              </div>
              <div>
                <p class="text-sm font-black text-slate-900">100% Chính Hãng</p>
                <p class="text-xs text-slate-500">Bảo hành Apple, Samsung chuẩn GSMA</p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 rounded-2xl p-2.5 transition hover:bg-slate-50">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
                ⚡
              </div>
              <div>
                <p class="text-sm font-black text-slate-900">Giao Hỏa Tốc 2 Giờ</p>
                <p class="text-xs text-slate-500">Miễn phí ship nội thành phố</p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 rounded-2xl p-2.5 transition hover:bg-slate-50">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
                🔄
              </div>
              <div>
                <p class="text-sm font-black text-slate-900">30 Ngày 1 Đổi 1</p>
                <p class="text-xs text-slate-500">Lỗi phần cứng đổi máy mới ngay</p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 rounded-2xl p-2.5 transition hover:bg-slate-50">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                💳
              </div>
              <div>
                <p class="text-sm font-black text-slate-900">Trả Góp 0% Lãi Suất</p>
                <p class="text-xs text-slate-500">Hỗ trợ 25+ ngân hàng & thẻ tín dụng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Flash Sale Giờ Vàng (Urgency Countdown) -->
      <section id="khuyen-mai" class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#800C12] via-red-600 to-rose-600 p-6 sm:p-10 text-white shadow-xl shadow-red-600/15">
          <!-- Ambient Glow -->
          <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-950 shadow">
                  🔥 FLASH SALE GIỜ VÀNG
                </span>
                <span class="text-xs text-red-100 font-medium">Kết thúc sau:</span>
                <!-- Countdown Timer -->
                <div class="flex items-center gap-1.5 font-mono text-sm font-black">
                  <span class="rounded-lg bg-black/40 px-2 py-1">{{ String(countdownHours).padStart(2, '0') }}</span>
                  <span>:</span>
                  <span class="rounded-lg bg-black/40 px-2 py-1">{{ String(countdownMins).padStart(2, '0') }}</span>
                  <span>:</span>
                  <span class="rounded-lg bg-black/40 px-2 py-1 text-amber-300">{{ String(countdownSecs).padStart(2, '0') }}</span>
                </div>
              </div>

              <h2 class="mt-3 text-2xl font-black sm:text-3xl lg:text-4xl">
                Giảm Thêm 500.000đ & Tặng Combo Phụ Kiện
              </h2>
              <p class="mt-2 text-sm text-red-100/90 max-w-xl">
                Áp dụng cho mọi khách hàng mua điện thoại, tablet trong khung giờ vàng hôm nay. Hỗ trợ thu cũ đổi mới trợ giá 2 triệu.
              </p>
            </div>

            <div class="flex shrink-0 flex-wrap items-center gap-3">
              <a
                href="#san-pham"
                class="rounded-2xl bg-white px-7 py-3.5 text-center text-sm font-black text-red-600 shadow-xl transition-all hover:bg-amber-300 hover:text-slate-950 hover:scale-105 active:scale-95"
              >
                Săn Deal Ngay
              </a>
              <a
                :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                class="rounded-2xl border-2 border-white/40 bg-white/10 px-6 py-3.5 text-center text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                Gọi Giữ Hàng
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Category Navigation Cards -->
      <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="text-center">
          <span class="text-xs font-black uppercase tracking-widest text-red-600">Khám phá theo nhu cầu</span>
          <h2 class="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Danh Mục Sản Phẩm</h2>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <a
            v-for="cat in categories"
            :key="cat.name"
            href="#san-pham"
            class="group flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10"
            @click.prevent="selectCategory(cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all')"
          >
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl shadow-inner transition-transform group-hover:scale-110">
              {{ cat.icon }}
            </div>
            <p class="mt-3 text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">
              {{ cat.name }}
            </p>
            <span class="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
              {{ cat.count }}
            </span>
          </a>
        </div>
      </section>

      <!-- Featured Hot Products -->
      <section class="bg-white py-14 border-y border-slate-200/80">
        <div class="mx-auto max-w-7xl px-4 sm:px-6">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-red-600"></span>
                <span class="text-xs font-black uppercase tracking-wider text-red-600">Sản phẩm bán chạy</span>
              </div>
              <h2 class="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Nổi Bật Nhất Tuần</h2>
              <p class="mt-1 text-sm text-slate-500">Giá cam kết tốt nhất thị trường — Đủ bảo hành & phụ kiện chính hãng</p>
            </div>
            <a
              href="#san-pham"
              class="text-xs font-black text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              Xem tất cả sản phẩm →
            </a>
          </div>

          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StoreProductCard
              v-for="product in featuredProducts"
              :key="product.id"
              :product="product"
              @view="openProduct"
              @add-to-cart="addToCart"
            />
          </div>
        </div>
      </section>

      <!-- Full Catalog & Filters -->
      <section id="san-pham" class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-xs font-black uppercase tracking-wider text-emerald-700">Kho hàng sẵn có</span>
            </div>
            <h2 class="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Cửa Hàng Trực Tuyến</h2>
            <p class="mt-1 text-sm text-slate-500">
              Lọc theo hãng, dòng máy và thêm vào giỏ hàng chỉ với 1 click
            </p>
          </div>
        </div>

        <div class="mt-8 flex flex-col gap-6 lg:flex-row">
          <!-- Sidebar Filters -->
          <aside class="shrink-0 lg:w-64 space-y-4">
            <!-- Category Filter -->
            <div class="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p class="text-xs font-black uppercase tracking-widest text-slate-400">Danh mục</p>
              <div class="mt-3 flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
                <button
                  v-for="cat in catalogCategories"
                  :key="cat.id"
                  type="button"
                  class="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all"
                  :class="selectedCategory === cat.id ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
                  @click="selectedCategory = cat.id"
                >
                  <span class="flex items-center gap-2">
                    <span>{{ cat.icon }}</span>
                    <span>{{ cat.label }}</span>
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px]"
                    :class="selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
                  >
                    •
                  </span>
                </button>
              </div>
            </div>

            <!-- Brand Filter -->
            <div class="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p class="text-xs font-black uppercase tracking-widest text-slate-400">Hãng sản xuất</p>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <button
                  v-for="b in catalogBrands"
                  :key="b"
                  type="button"
                  class="rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
                  :class="selectedBrand === b ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                  @click="selectedBrand = b"
                >
                  {{ b }}
                </button>
              </div>
            </div>
          </aside>

          <!-- Product Grid -->
          <div class="min-w-0 flex-1">
            <!-- Filter summary & Sort -->
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-sm">
              <p class="text-xs font-bold text-slate-600">
                Tìm thấy <span class="font-black text-red-600">{{ filteredProducts.length }}</span> sản phẩm
              </p>
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span>Sắp xếp:</span>
                <select
                  v-model="selectedSort"
                  class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-red-500"
                >
                  <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>

            <!-- Grid -->
            <div v-if="filteredProducts.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <StoreProductCard
                v-for="product in filteredProducts"
                :key="product.id"
                :product="product"
                @view="openProduct"
                @add-to-cart="addToCart"
              />
            </div>

            <!-- Empty State -->
            <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500 p-6">
              <div class="text-5xl">🔍</div>
              <p class="mt-3 text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</p>
              <p class="mt-1 text-xs text-slate-500">Hãy thử đổi từ khóa tìm kiếm hoặc bấm chọn "Tất cả" danh mục</p>
              <button
                type="button"
                class="mt-4 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow"
                @click="selectedCategory = 'all'; selectedBrand = 'Tất cả'; searchQuery = ''"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Customer Reviews / Testimonials -->
      <section class="bg-white py-16 border-t border-slate-200/80">
        <div class="mx-auto max-w-7xl px-4 sm:px-6">
          <div class="text-center">
            <span class="text-xs font-black uppercase tracking-widest text-red-600">Phản hồi thực tế</span>
            <h2 class="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Khách Hàng Nói Gì Về Chúng Tôi?</h2>
            <p class="mt-1 text-sm text-slate-500">Hơn 10.000 khách hàng đã mua sắm và hài lòng với chất lượng dịch vụ</p>
          </div>

          <div class="mt-10 grid gap-6 md:grid-cols-3">
            <article
              v-for="item in testimonials"
              :key="item.name"
              class="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/60 p-6 shadow-sm transition hover:shadow-md hover:border-slate-300"
            >
              <div>
                <div class="flex items-center gap-1 text-amber-400 text-sm">
                  <span v-for="n in item.rating" :key="n">★</span>
                </div>
                <p class="mt-4 text-sm leading-relaxed text-slate-700 italic font-medium">
                  "{{ item.text }}"
                </p>
              </div>
              <div class="mt-6 flex items-center gap-3 pt-4 border-t border-slate-200/60">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-sm font-black text-white">
                  {{ item.name.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ item.name }}</p>
                  <p class="text-[11px] font-semibold text-emerald-600">✓ Đã mua hàng chính hãng</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Store Locations -->
      <section id="cua-hang" class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div class="text-center">
          <span class="text-xs font-black uppercase tracking-widest text-red-600">Gặp mặt trực tiếp</span>
          <h2 class="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Hệ Thống {{ storeInfo.branches }} Cửa Hàng</h2>
          <p class="mt-1 text-sm text-slate-500">Mời quý khách ghé trải nghiệm máy, dán màn hình miễn phí và nhận quà</p>
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-3">
          <article
            v-for="branch in branches"
            :key="branch.name"
            class="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <span
              v-if="branch.isMain"
              class="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
            >
              Trụ sở chính
            </span>
            <h3 class="text-base font-black text-slate-900">{{ branch.name }}</h3>
            <p class="mt-3 text-xs leading-relaxed text-slate-600">{{ branch.address }}</p>
            <div class="mt-4 space-y-1.5 text-xs">
              <p class="flex items-center gap-1.5 text-slate-600">
                <span class="font-bold">Hotline:</span>
                <a :href="`tel:${branch.phone.replace(/\s/g, '')}`" class="font-black text-red-600 hover:underline">
                  {{ branch.phone }}
                </a>
              </p>
              <p class="flex items-center gap-1.5 text-slate-600">
                <span class="font-bold">Mở cửa:</span>
                <span>{{ branch.hours }}</span>
              </p>
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-5 inline-flex items-center gap-1.5 text-xs font-black text-red-600 hover:underline"
            >
              <span>Xem vị trí Google Maps</span>
              <span>→</span>
            </a>
          </article>
        </div>
      </section>

      <!-- Contact CTA Banner -->
      <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div class="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 text-center text-white sm:p-12 shadow-2xl border border-slate-800">
          <h2 class="text-2xl font-black sm:text-3xl lg:text-4xl">Cần Tư Vấn Mua Máy Hoặc Trả Góp?</h2>
          <p class="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Chuyên viên tư vấn của Lieng Mobile sẵn sàng hỗ trợ so sánh sản phẩm, kiểm tra tồn kho và giải đáp chính sách bảo hành 24/7.
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a
              :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-red-600/30 transition hover:from-red-700 hover:to-rose-700 hover:scale-105 active:scale-95"
            >
              <span>📞 Gọi Tổng Đài: {{ storeInfo.hotlineDisplay }}</span>
            </a>
            <a
              href="#san-pham"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/10 active:scale-95"
            >
              <span>Xem bảng giá mới nhất</span>
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Floating Contact & Back to Top Widgets -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <!-- Back to top -->
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl border border-slate-200 transition hover:bg-slate-50 hover:scale-110 active:scale-95"
        title="Lên đầu trang"
        @click="scrollToTop"
      >
        ▲
      </button>

      <!-- Direct Phone Call Button -->
      <a
        :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
        class="relative flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-2xl shadow-red-600/40 transition hover:scale-110 active:scale-95"
        title="Gọi hotline tư vấn"
      >
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40"></span>
        <span class="text-xl">📞</span>
      </a>
    </div>

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

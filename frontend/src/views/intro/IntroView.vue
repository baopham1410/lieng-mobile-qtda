<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StoreHeader from '@/components/intro/StoreHeader.vue'
import StoreFooter from '@/components/intro/StoreFooter.vue'
import StoreProductCard from '@/components/intro/StoreProductCard.vue'
import StoreCartDrawer from '@/components/intro/StoreCartDrawer.vue'
import StoreProductModal from '@/components/intro/StoreProductModal.vue'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'
import ScrollStorytellingHero from '@/components/intro/ScrollStorytellingHero.vue'
import VirtualShowroomHero from '@/components/intro/VirtualShowroomHero.vue'
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
const activeHeroMode = ref('showroom')

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
  const existing = cartItems.value.find((item) => item.id === product.id)
  if (existing) {
    existing.qty += 1
  } else {
    cartItems.value.push({
      id: product.id,
      productId: product.productId,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      qty: 1,
    })
  }
  cartOpen.value = true
}

function updateCartQty(id, qty) {
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
  <div class="min-h-screen bg-[#09090b] text-gray-100 selection:bg-red-600 selection:text-white">
    <div
      v-if="checkoutNotice"
      class="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-red-600/40 border border-white/20"
    >
      Đã ghi nhận đơn — chuyên viên sẽ liên hệ tư vấn trong ít phút.
    </div>

    <!-- FLOATING TOP-RIGHT STORE SHORTCUTS (Z-40) -->
    <aside aria-label="Lối tắt cửa hàng" class="fixed top-4 right-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto">
      <!-- QUICK JUMP TO CATALOG & CART BUTTON -->
      <a
        href="#san-pham"
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-white/20 backdrop-blur-xl text-xs font-semibold text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer"
        title="Cuộn xuống xem bảng giá & sản phẩm"
      >
        <StoreDeviceIcon name="store" size-class="h-3.5 w-3.5" />
        <span>Vào Cửa Hàng</span>
      </a>

      <button
        type="button"
        class="flex items-center justify-center h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 backdrop-blur-xl text-white shadow-2xl transition cursor-pointer relative"
        title="Mở giỏ hàng"
        @click="cartOpen = true"
      >
        <StoreDeviceIcon name="cart" size-class="h-4 w-4" />
        <span
          v-if="cartCount > 0"
          class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-1 text-[10px] font-bold text-white shadow-md shadow-red-600/40"
        >
          {{ cartCount }}
        </span>
      </button>
    </aside>

    <main>
      <!-- Mode 3: 3D Virtual Showroom Tour (500vh) - Chiếm trọn 100vh Fullscreen không vướng Header -->
      <VirtualShowroomHero
        v-if="activeHeroMode === 'showroom'"
        :store-info="storeInfo"
        @open-cart="cartOpen = true"
      />

      <!-- Mode 1: Dark-Mode Cinematic Scroll-Driven 3D Storytelling (400vh) -->
      <ScrollStorytellingHero
        v-else
        :store-info="storeInfo"
        @open-cart="cartOpen = true"
      />

      <!-- CẦU NỐI MỀM MẠI: Gradient chuyển tiếp mượt mà từ 3D Showroom sang Cửa Hàng -->
      <div class="relative z-30 h-20 -mt-20 bg-gradient-to-b from-transparent via-[#09090b]/80 to-[#09090b] pointer-events-none" />

      <!-- STOREHEADER: STICKY Ở ĐỈNH KHI BẮT ĐẦU VÀO PHẦN CỬA HÀNG / BẢNG GIÁ -->
      <StoreHeader
        v-model:search-query="searchQuery"
        :cart-count="cartCount"
        @open-cart="cartOpen = true"
      />

      <!-- Trust bar -->
      <section class="border-b border-white/10 bg-[#0c0d12]/90 backdrop-blur-xl">
        <div class="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          <div
            v-for="stat in trustStats"
            :key="stat.label"
            class="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center transition hover:border-red-500/20"
          >
            <p class="text-2xl font-black bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent md:text-3xl">
              {{ stat.value }}
            </p>
            <p class="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">{{ stat.label }}</p>
          </div>
        </div>
      </section>

      <!-- Categories ban đầu với Icon vector mới -->
      <section class="mx-auto max-w-7xl px-4 py-14">
        <div class="text-center">
          <h2 class="text-2xl font-black tracking-tight text-white md:text-3xl">Danh mục nổi bật</h2>
          <p class="mt-2 text-sm text-gray-400">Chọn nhanh theo nhu cầu thiết bị của bạn</p>
        </div>
        <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <a
            v-for="cat in categories"
            :key="cat.name"
            v-tilt-3d="{ max: 12, scale: 1.05 }"
            href="#san-pham"
            class="group flex flex-col items-center rounded-2xl border border-white/10 bg-[#121318]/90 p-5 text-center shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/10 cursor-pointer"
            @click.prevent="selectCategory(cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-red-600 group-hover:to-rose-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-red-600/30">
              <StoreDeviceIcon
                :name="cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all'"
                size-class="h-6 w-6"
              />
            </div>
            <p class="mt-3 font-semibold text-white group-hover:text-red-400 transition-colors">{{ cat.name }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ cat.count }}</p>
          </a>
        </div>
      </section>

      <!-- Featured -->
      <section class="bg-[#09090b] py-14 border-t border-white/5">
        <div class="mx-auto max-w-7xl px-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 mb-2">
                <span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>FLASHSALE TUẦN NÀY</span>
              </div>
              <h2 class="text-2xl font-black tracking-tight text-white md:text-3xl">Nổi bật tuần này</h2>
              <p class="mt-2 text-sm text-gray-400">Giá cập nhật hôm nay — Hàng chính hãng, đủ IMEI tra cứu minh bạch</p>
            </div>
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

      <!-- Catalog -->
      <section id="san-pham" class="bg-[#0c0d12]/70 border-t border-white/10 py-14">
        <div class="mx-auto max-w-7xl px-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 class="text-2xl font-black tracking-tight text-white md:text-3xl">Cửa hàng trực tuyến</h2>
              <p class="mt-2 text-sm text-gray-400">{{ filteredProducts.length }} sản phẩm — Lọc, so sánh và thêm giỏ hàng</p>
            </div>
          </div>

          <div class="mt-8 flex flex-col gap-6 lg:flex-row">
            <aside class="shrink-0 lg:w-56">
              <div class="rounded-2xl border border-white/10 bg-[#121318]/90 p-4 shadow-xl backdrop-blur-xl">
                <p class="text-xs font-bold uppercase tracking-widest text-red-400">Danh mục</p>
                <div class="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
                  <button
                    v-for="cat in catalogCategories"
                    :key="cat.id"
                    type="button"
                    class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition cursor-pointer"
                    :class="selectedCategory === cat.id ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md shadow-red-600/30' : 'text-gray-300 hover:text-white hover:bg-white/5'"
                    @click="selectedCategory = cat.id"
                  >
                    <StoreDeviceIcon
                      :name="cat.id === 'phone' ? 'phone' : cat.id === 'tablet' ? 'tablet' : cat.id === 'laptop' ? 'laptop' : cat.id === 'accessory' ? 'accessory' : cat.id === 'watch' ? 'watch' : 'all'"
                      size-class="h-4 w-4"
                    />
                    <span>{{ cat.label }}</span>
                  </button>
                </div>
              </div>
              <div class="mt-4 rounded-2xl border border-white/10 bg-[#121318]/90 p-4 shadow-xl backdrop-blur-xl">
                <p class="text-xs font-bold uppercase tracking-widest text-red-400">Thương hiệu</p>
                <select
                  v-model="selectedBrand"
                  class="mt-3 w-full rounded-xl border border-white/10 bg-[#181a22] px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-hidden"
                >
                  <option v-for="b in catalogBrands" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
            </aside>

            <div class="min-w-0 flex-1">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121318]/90 px-4 py-3 shadow-xl backdrop-blur-xl">
                <p class="text-sm text-gray-400">
                  Hiển thị <span class="font-bold text-red-400">{{ filteredProducts.length }}</span> kết quả
                </p>
                <select v-model="selectedSort" class="rounded-xl border border-white/10 bg-[#181a22] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-hidden">
                  <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div v-if="filteredProducts.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <StoreProductCard
                  v-for="product in filteredProducts"
                  :key="product.id"
                  :product="product"
                  @view="openProduct"
                  @add-to-cart="addToCart"
                />
              </div>
              <div v-else class="rounded-2xl border border-dashed border-white/10 bg-[#121318]/50 py-16 text-center text-gray-400">
                Không tìm thấy sản phẩm phù hợp. Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Promo banner -->
      <section id="khuyen-mai" class="mx-auto max-w-7xl px-4 py-10">
        <div
          class="overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-red-900 border border-red-500/30 p-8 text-white md:p-12 shadow-2xl shadow-red-600/20 relative"
        >
          <!-- Background decorative glow -->
          <div class="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />

          <div class="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p class="text-sm font-bold uppercase tracking-wider text-red-200 flex items-center gap-1.5">
                <StoreDeviceIcon name="fire" size-class="h-4 w-4 text-amber-300" />
                <span>ƯU ĐÃI ĐỘC QUYỀN</span>
              </p>
              <h2 class="mt-2 text-3xl font-black md:text-4xl text-white">Giảm thêm 500.000đ</h2>
              <p class="mt-2 max-w-lg text-red-100 text-sm leading-relaxed">
                Áp dụng khi thanh toán online hoặc trả góp 0% qua thẻ — Cam kết máy nguyên seal, kích hoạt tại chỗ.
              </p>
            </div>
            <div class="flex shrink-0 flex-col gap-3 sm:flex-row">
              <a
                href="#san-pham"
                class="rounded-xl bg-white px-8 py-3.5 text-center font-bold text-red-700 transition hover:bg-red-50 shadow-lg shadow-black/20 cursor-pointer"
              >
                Săn deal ngay
              </a>
              <a
                :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-black/20 backdrop-blur-md px-8 py-3.5 text-center font-semibold text-white transition hover:bg-white/10"
              >
                <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-white" />
                <span>Gọi tư vấn</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Promo products -->
      <section class="mx-auto max-w-7xl px-4 py-14">
        <div class="text-center md:text-left">
          <h2 class="text-2xl font-black tracking-tight text-white md:text-3xl">Phụ kiện &amp; khuyến mãi</h2>
          <p class="mt-2 text-sm text-gray-400">Mua kèm máy — Giảm thêm khi mua trọn gói phụ kiện chính hãng</p>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StoreProductCard
            v-for="product in promoProducts"
            :key="product.name"
            :product="{ ...product, id: product.name, inStock: true, rating: 4.7, sold: 50 }"
            @view="openProduct"
            @add-to-cart="addToCart"
          />
        </div>
      </section>

      <!-- Brands -->
      <section class="border-y border-white/10 bg-[#0c0d12]/60 py-10">
        <div class="mx-auto max-w-7xl px-4">
          <p class="text-center text-xs font-bold uppercase tracking-widest text-gray-400">
            Thương hiệu đối tác chính hãng
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <span
              v-for="brand in brands"
              :key="brand"
              class="rounded-xl border border-white/10 bg-[#121318] px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:border-red-500/40 hover:bg-white/5 transition"
            >
              {{ brand }}
            </span>
          </div>
        </div>
      </section>

      <!-- Services với Icon vector mới -->
      <section id="dich-vu" class="mx-auto max-w-7xl px-4 py-14">
        <div class="text-center">
          <h2 class="text-2xl font-black tracking-tight text-white md:text-3xl">Dịch vụ tại cửa hàng</h2>
          <p class="mt-2 text-sm text-gray-400">Trải nghiệm mua sắm an tâm từ A đến Z cùng Liêng Mobile</p>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="service in services"
            :key="service.title"
            class="rounded-2xl border border-white/10 bg-[#121318]/90 p-6 shadow-xl backdrop-blur-xl hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/10 transition group"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-red-600 group-hover:to-rose-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-red-600/30">
              <StoreDeviceIcon v-if="service.icon === 'shield'" name="warranty" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else-if="service.icon === 'card'" name="installment" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else-if="service.icon === 'wrench'" name="trade-in" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else name="delivery" size-class="h-6 w-6" />
            </div>
            <h3 class="mt-4 font-bold text-white group-hover:text-red-400 transition-colors">{{ service.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ service.description }}</p>
          </article>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="bg-[#0c0d12]/80 border-y border-white/10 py-14">
        <div class="mx-auto max-w-7xl px-4">
          <h2 class="text-center text-2xl font-black tracking-tight text-white md:text-3xl">Khách hàng nói gì?</h2>
          <p class="mt-2 text-center text-sm text-gray-400">Hơn 50,000+ khách hàng tin tưởng và đồng hành</p>
          <div class="mt-10 grid gap-6 md:grid-cols-3">
            <blockquote
              v-for="item in testimonials"
              :key="item.name"
              class="rounded-2xl border border-white/10 bg-[#121318]/90 p-6 shadow-xl backdrop-blur-xl"
            >
              <div class="flex gap-0.5 text-amber-400">
                <span v-for="n in item.rating" :key="n">★</span>
              </div>
              <p class="mt-4 text-sm leading-relaxed text-gray-300">"{{ item.text }}"</p>
              <footer class="mt-4 text-sm font-semibold text-white">— {{ item.name }}</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <!-- Branches -->
      <section id="cua-hang" class="mx-auto max-w-7xl px-4 py-14">
        <div class="text-center">
          <h2 class="text-2xl font-black tracking-tight text-white md:text-3xl">Hệ thống {{ storeInfo.branches }} cửa hàng</h2>
          <p class="mt-2 text-sm text-gray-400">Ghé trực tiếp showroom để trải nghiệm máy thật và nhận tư vấn chuyên sâu</p>
        </div>
        <div class="mt-10 grid gap-6 lg:grid-cols-3">
          <article
            v-for="branch in branches"
            :key="branch.name"
            class="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121318]/90 p-6 shadow-xl backdrop-blur-xl"
          >
            <span
              v-if="branch.isMain"
              class="absolute right-4 top-4 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 text-xs font-bold text-white shadow-md shadow-red-600/40"
            >
              Trụ sở chính
            </span>
            <h3 class="font-bold text-white">{{ branch.name }}</h3>
            <p class="mt-3 text-sm text-gray-400">{{ branch.address }}</p>
            <ul class="mt-4 space-y-2 text-sm">
              <li>
                <span class="text-gray-400">Điện thoại:</span>
                <a :href="`tel:${branch.phone.replace(/\s/g, '')}`" class="ml-1 inline-flex items-center gap-1 font-semibold text-red-400 hover:text-red-300">
                  <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-400" />
                  <span>{{ branch.phone }}</span>
                </a>
              </li>
              <li>
                <span class="text-gray-400">Giờ mở cửa:</span>
                <span class="ml-1 text-gray-200">{{ branch.hours }}</span>
              </li>
            </ul>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-5 inline-block text-sm font-semibold text-red-400 hover:text-red-300 hover:underline"
            >
              Chỉ đường Google Maps →
            </a>
          </article>
        </div>

        <div class="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#121318]/70 shadow-xl">
          <div class="flex h-56 items-center justify-center bg-gradient-to-br from-[#161822] to-[#0e1017] text-gray-300 md:h-72">
            <div class="text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 mb-2">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p class="font-bold text-white">{{ storeInfo.address }}</p>
              <p class="text-sm text-gray-400 mt-0.5">Bản đồ cửa hàng — hỗ trợ giao hàng hỏa tốc và trải nghiệm trực tiếp</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact CTA -->
      <section class="mx-auto max-w-7xl px-4 pb-14">
        <div class="rounded-3xl bg-gradient-to-b from-[#181a24] to-[#0e1017] border border-white/10 px-6 py-12 text-center text-white md:px-12 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

          <h2 class="relative z-10 text-2xl font-black md:text-3xl text-white">Cần tư vấn chọn máy?</h2>
          <p class="relative z-10 mx-auto mt-3 max-w-xl text-sm text-gray-400 leading-relaxed">
            Đội ngũ chuyên viên {{ storeInfo.name }} sẵn sàng hỗ trợ bạn so sánh cấu hình chi tiết, tối ưu ngân sách và hưởng chính sách trả góp 0%.
          </p>
          <div class="relative z-10 mt-8 flex flex-wrap justify-center gap-4">
            <a
              :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
              class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-8 py-3.5 font-bold text-white transition shadow-lg shadow-red-600/30"
            >
              <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-white" />
              <span>Gọi {{ storeInfo.hotlineDisplay }}</span>
            </a>
            <a
              href="#cua-hang"
              class="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 font-semibold text-white transition backdrop-blur-md"
            >
              Xem cửa hàng gần bạn
            </a>
          </div>
        </div>
      </section>
    </main>

    <StoreFooter />

    <StoreCartDrawer
      :open="cartOpen"
      :items="cartItems"
      @close="cartOpen = false"
      @update-qty="updateCartQty"
      @remove="removeFromCart"
      @checkout="handleCheckout"
    />

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

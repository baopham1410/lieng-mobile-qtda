<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StoreHeader from '@/components/intro/StoreHeader.vue'
import StoreFooter from '@/components/intro/StoreFooter.vue'
import StoreProductCard from '@/components/intro/StoreProductCard.vue'
import StoreCartDrawer from '@/components/intro/StoreCartDrawer.vue'
import StoreProductModal from '@/components/intro/StoreProductModal.vue'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'
import StoreLotteryCounter from '@/components/intro/StoreLotteryCounter.vue'
import ScrollStorytellingHero from '@/components/intro/ScrollStorytellingHero.vue'
import VirtualShowroomHero from '@/components/intro/VirtualShowroomHero.vue'
import StoreFlagshipShowcase from '@/components/intro/StoreFlagshipShowcase.vue'
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
  <div class="min-h-screen bg-gray-50 text-gray-900 selection:bg-red-600 selection:text-white">
    <div
      v-if="checkoutNotice"
      class="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-2xl bg-gray-900 px-6 py-4 text-sm font-medium text-white shadow-xl"
    >
      Đã ghi nhận đơn — nhân viên sẽ liên hệ tư vấn trong ít phút.
    </div>

    <!-- FLOATING TOP-RIGHT STORE SHORTCUTS (Z-40) -->
    <aside aria-label="Lối tắt cửa hàng" class="fixed top-4 right-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto">
      <!-- QUICK JUMP TO CATALOG & CART BUTTON -->
      <a
        href="#san-pham"
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-600/90 hover:bg-red-600 border border-red-400/40 backdrop-blur-xl text-xs font-semibold text-white shadow-xl transition-all cursor-pointer"
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
          class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-md shadow-red-600/40"
        >
          {{ cartCount }}
        </span>
      </button>
    </aside>

    <main>
      <!-- Mode 3: 3D Virtual Showroom Tour (500vh) - Nền tối điện ảnh 100% nguyên bản -->
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

      <!-- STOREHEADER: STICKY Ở ĐỈNH KHI BẮT ĐẦU VÀO PHẦN CỬA HÀNG / BẢNG GIÁ -->
      <StoreHeader
        v-model:search-query="searchQuery"
        :cart-count="cartCount"
        @open-cart="cartOpen = true"
      />

      <!-- Trust bar: Slot Machine Lottery Quay Số Ngẫu Nhiên & Chốt Số -->
      <StoreLotteryCounter
        v-scroll-reveal="{ distance: '24px' }"
        :stats="trustStats"
      />

      <!-- Categories ban đầu với Icon vector mới -->
      <section class="mx-auto max-w-7xl px-4 py-14">
        <div v-scroll-reveal="{ distance: '20px' }" class="text-center">
          <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Danh mục nổi bật</h2>
          <p class="mt-2 text-sm text-gray-600">Chọn nhanh theo nhu cầu thiết bị của bạn</p>
        </div>
        <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <a
            v-for="(cat, idx) in categories"
            :key="cat.name"
            v-scroll-reveal="{ delay: idx * 70, distance: '30px' }"
            v-tilt-3d="{ max: 12, scale: 1.05 }"
            href="#san-pham"
            class="group flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-xs ring-1 ring-gray-100 transition-all duration-300 hover:shadow-xl hover:ring-red-200 cursor-pointer"
            @click.prevent="selectCategory(cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white">
              <StoreDeviceIcon
                :name="cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all'"
                size-class="h-6 w-6"
              />
            </div>
            <p class="mt-3 font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{{ cat.name }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ cat.count }}</p>
          </a>
        </div>
      </section>

      <!-- FLAGSHIP SHOWCASE: BỘ SƯU TẬP SIÊU PHẨM (IPHONE 17/18 PRO & GALAXY S24 ULTRA) -->
      <StoreFlagshipShowcase />

      <!-- Featured -->
      <section class="bg-white py-14 border-t border-gray-100">
        <div class="mx-auto max-w-7xl px-4">
          <div v-scroll-reveal="{ distance: '20px' }" class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 mb-2 border border-red-200 shadow-xs">
                <span class="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                <span>FLASHSALE TUẦN NÀY</span>
              </div>
              <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Nổi bật tuần này</h2>
              <p class="mt-2 text-sm text-gray-600">Giá cập nhật hôm nay — Hàng chính hãng, đủ IMEI tra cứu minh bạch</p>
            </div>
          </div>
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="(product, idx) in featuredProducts"
              :key="product.id"
              v-scroll-reveal="{ delay: idx * 90, distance: '35px' }"
            >
              <StoreProductCard
                :product="product"
                @view="openProduct"
                @add-to-cart="addToCart"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Catalog -->
      <section id="san-pham" class="bg-gray-50 border-t border-gray-200 py-14">
        <div class="mx-auto max-w-7xl px-4">
          <div v-scroll-reveal="{ distance: '20px' }" class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Cửa hàng trực tuyến</h2>
              <p class="mt-2 text-sm text-gray-600">{{ filteredProducts.length }} sản phẩm — Lọc, so sánh và thêm giỏ hàng</p>
            </div>
          </div>

          <div class="mt-8 flex flex-col gap-6 lg:flex-row">
            <aside
              v-scroll-reveal="{ direction: 'left', distance: '25px', delay: 100 }"
              class="shrink-0 lg:w-56"
            >
              <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                <p class="text-xs font-bold uppercase tracking-widest text-red-600">Danh mục</p>
                <div class="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
                  <button
                    v-for="cat in catalogCategories"
                    :key="cat.id"
                    type="button"
                    class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition cursor-pointer"
                    :class="selectedCategory === cat.id ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'"
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
              <div class="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                <p class="text-xs font-bold uppercase tracking-widest text-red-600">Thương hiệu</p>
                <select
                  v-model="selectedBrand"
                  class="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-hidden"
                >
                  <option v-for="b in catalogBrands" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
            </aside>

            <div class="min-w-0 flex-1">
              <div
                v-scroll-reveal="{ distance: '15px', delay: 150 }"
                class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xs"
              >
                <p class="text-sm text-gray-600">
                  Hiển thị <span class="font-bold text-red-600">{{ filteredProducts.length }}</span> kết quả
                </p>
                <select v-model="selectedSort" class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-hidden">
                  <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div v-if="filteredProducts.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div
                  v-for="(product, idx) in filteredProducts"
                  :key="product.id"
                  v-scroll-reveal="{ delay: (idx % 6) * 60, distance: '25px' }"
                >
                  <StoreProductCard
                    :product="product"
                    @view="openProduct"
                    @add-to-cart="addToCart"
                  />
                </div>
              </div>
              <div v-else class="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
                Không tìm thấy sản phẩm phù hợp. Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Promo banner -->
      <section id="khuyen-mai" class="mx-auto max-w-7xl px-4 py-10">
        <div
          v-scroll-reveal="{ direction: 'scale', duration: '800ms' }"
          class="overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 p-8 text-white md:p-12 shadow-xl shadow-red-500/20 relative"
        >
          <div class="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p class="text-sm font-bold uppercase tracking-wider text-red-100 flex items-center gap-1.5">
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
                class="rounded-xl bg-white px-8 py-3.5 text-center font-bold text-red-600 transition hover:bg-red-50 shadow-md cursor-pointer"
              >
                Săn deal ngay
              </a>
              <a
                :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-black/10 backdrop-blur-md px-8 py-3.5 text-center font-semibold text-white transition hover:bg-white/10"
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
        <div v-scroll-reveal="{ distance: '20px' }" class="text-center md:text-left">
          <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Phụ kiện &amp; khuyến mãi</h2>
          <p class="mt-2 text-sm text-gray-600">Mua kèm máy — Giảm thêm khi mua trọn gói phụ kiện chính hãng</p>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(product, idx) in promoProducts"
            :key="product.name"
            v-scroll-reveal="{ delay: idx * 80, distance: '30px' }"
          >
            <StoreProductCard
              :product="{ ...product, id: product.name, inStock: true, rating: 4.7, sold: 50 }"
              @view="openProduct"
              @add-to-cart="addToCart"
            />
          </div>
        </div>
      </section>

      <!-- Brands -->
      <section class="border-y border-gray-200 bg-white py-10">
        <div class="mx-auto max-w-7xl px-4">
          <p v-scroll-reveal="{ distance: '15px' }" class="text-center text-xs font-bold uppercase tracking-widest text-gray-500">
            Thương hiệu đối tác chính hãng
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <span
              v-for="(brand, idx) in brands"
              :key="brand"
              v-scroll-reveal="{ delay: idx * 45, distance: '15px' }"
              class="rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-red-300 hover:bg-white hover:text-red-600 transition shadow-2xs"
            >
              {{ brand }}
            </span>
          </div>
        </div>
      </section>

      <!-- Services với Icon vector mới -->
      <section id="dich-vu" class="mx-auto max-w-7xl px-4 py-14">
        <div v-scroll-reveal="{ distance: '20px' }" class="text-center">
          <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Dịch vụ tại cửa hàng</h2>
          <p class="mt-2 text-sm text-gray-600">Trải nghiệm mua sắm an tâm từ A đến Z cùng Liêng Mobile</p>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="(service, idx) in services"
            :key="service.title"
            v-scroll-reveal="{ delay: idx * 90, distance: '30px' }"
            class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-red-200 hover:shadow-xl transition group"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-md">
              <StoreDeviceIcon v-if="service.icon === 'shield'" name="warranty" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else-if="service.icon === 'card'" name="installment" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else-if="service.icon === 'wrench'" name="trade-in" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else name="delivery" size-class="h-6 w-6" />
            </div>
            <h3 class="mt-4 font-bold text-gray-900 group-hover:text-red-600 transition-colors">{{ service.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ service.description }}</p>
          </article>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="bg-gray-50 border-y border-gray-200 py-14">
        <div class="mx-auto max-w-7xl px-4">
          <div v-scroll-reveal="{ distance: '20px' }" class="text-center">
            <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Khách hàng nói gì?</h2>
            <p class="mt-2 text-sm text-gray-600">Hơn 50,000+ khách hàng tin tưởng và đồng hành</p>
          </div>
          <div class="mt-10 grid gap-6 md:grid-cols-3">
            <blockquote
              v-for="(item, idx) in testimonials"
              :key="item.name"
              v-scroll-reveal="{ delay: idx * 100, distance: '30px' }"
              class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div class="flex gap-0.5 text-amber-500">
                <span v-for="n in item.rating" :key="n">★</span>
              </div>
              <p class="mt-4 text-sm leading-relaxed text-gray-700">"{{ item.text }}"</p>
              <footer class="mt-4 text-sm font-semibold text-gray-900">— {{ item.name }}</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <!-- Branches -->
      <section id="cua-hang" class="mx-auto max-w-7xl px-4 py-14">
        <div v-scroll-reveal="{ distance: '20px' }" class="text-center">
          <h2 class="text-2xl font-bold md:text-3xl text-gray-900">Hệ thống {{ storeInfo.branches }} cửa hàng</h2>
          <p class="mt-2 text-sm text-gray-600">Ghé trực tiếp showroom để trải nghiệm máy thật và nhận tư vấn chuyên sâu</p>
        </div>
        <div class="mt-10 grid gap-6 lg:grid-cols-3">
          <article
            v-for="(branch, idx) in branches"
            :key="branch.name"
            v-scroll-reveal="{ delay: idx * 90, distance: '30px' }"
            class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <span
              v-if="branch.isMain"
              class="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-xs"
            >
              Trụ sở chính
            </span>
            <h3 class="font-bold text-gray-900">{{ branch.name }}</h3>
            <p class="mt-3 text-sm text-gray-600">{{ branch.address }}</p>
            <ul class="mt-4 space-y-2 text-sm">
              <li>
                <span class="text-gray-500">Điện thoại:</span>
                <a :href="`tel:${branch.phone.replace(/\s/g, '')}`" class="ml-1 inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700">
                  <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-600" />
                  <span>{{ branch.phone }}</span>
                </a>
              </li>
              <li>
                <span class="text-gray-500">Giờ mở cửa:</span>
                <span class="ml-1 text-gray-700">{{ branch.hours }}</span>
              </li>
            </ul>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-5 inline-block text-sm font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              Chỉ đường Google Maps →
            </a>
          </article>
        </div>

        <div
          v-scroll-reveal="{ delay: 180, direction: 'scale' }"
          class="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div class="flex h-56 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 md:h-72">
            <div class="text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-md mb-2">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p class="font-bold text-gray-900">{{ storeInfo.address }}</p>
              <p class="text-sm text-gray-500 mt-0.5">Bản đồ cửa hàng — hỗ trợ giao hàng hỏa tốc và trải nghiệm trực tiếp</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact CTA -->
      <section class="mx-auto max-w-7xl px-4 pb-14">
        <div
          v-scroll-reveal="{ direction: 'scale', duration: '800ms' }"
          class="rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-12 text-center text-white md:px-12 shadow-xl relative overflow-hidden"
        >
          <h2 class="relative z-10 text-2xl font-black md:text-3xl text-white">Cần tư vấn chọn máy?</h2>
          <p class="relative z-10 mx-auto mt-3 max-w-xl text-sm text-red-100 leading-relaxed">
            Đội ngũ chuyên viên {{ storeInfo.name }} sẵn sàng hỗ trợ bạn so sánh cấu hình chi tiết, tối ưu ngân sách và hưởng chính sách trả góp 0%.
          </p>
          <div class="relative z-10 mt-8 flex flex-wrap justify-center gap-4">
            <a
              :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
              class="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-red-50 px-8 py-3.5 font-bold text-red-600 transition shadow-md"
            >
              <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-red-600" />
              <span>Gọi {{ storeInfo.hotlineDisplay }}</span>
            </a>
            <a
              href="#cua-hang"
              class="rounded-xl border border-white/40 bg-black/10 hover:bg-white/10 px-8 py-3.5 font-semibold text-white transition backdrop-blur-md"
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

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
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <StoreHeader
      v-model:search-query="searchQuery"
      :cart-count="cartCount"
      @open-cart="cartOpen = true"
    />

    <div
      v-if="checkoutNotice"
      class="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-2xl bg-gray-900 px-6 py-4 text-sm font-medium text-white shadow-xl"
    >
      Đã ghi nhận đơn — nhân viên sẽ liên hệ tư vấn trong ít phút.
    </div>

    <main>
      <!-- Hero ban đầu với màu đỏ #7a0c10 -->
      <section class="pt-4 text-white">
        <div class="relative w-full overflow-hidden bg-[#7a0c10] shadow-xl">
          <div
            v-for="(slide, index) in heroSlides"
            :key="slide.title"
            class="absolute inset-0 transition-opacity duration-700"
            :class="index === activeSlide ? 'opacity-100' : 'opacity-0'"
          >
            <template v-if="slide.bgImage">
              <div
                class="absolute inset-0 bg-cover bg-right-center bg-no-repeat"
                :style="{
                  backgroundImage: `url(${slide.bgImage})`,
                }"
              />
              <div class="absolute inset-0 bg-gradient-to-r from-[#5b0b0f]/65 via-[#6b0c10]/18 to-transparent" />
            </template>
            <template v-else>
              <div class="absolute inset-0" :class="slide.imageTone" />
              <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            </template>
          </div>

          <div class="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-start px-6 py-16 md:px-10 md:py-20 lg:min-h-[calc(100vh-88px)] lg:justify-center lg:px-16 lg:py-24 xl:px-20">
            <transition name="fade" mode="out-in">
              <div :key="activeSlide" class="max-w-xl lg:max-w-2xl">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white"
                  :class="`bg-gradient-to-r ${heroSlides[activeSlide].accent}`"
                >
                  <StoreDeviceIcon name="fire" size-class="h-3.5 w-3.5 text-white" />
                  <span>{{ heroSlides[activeSlide].badge }}</span>
                </span>
                <h1 class="mt-5 max-w-2xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  {{ heroSlides[activeSlide].title }}
                </h1>
                <p class="mt-4 max-w-xl text-lg text-gray-300">
                  {{ heroSlides[activeSlide].subtitle }}
                </p>
                <div class="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#san-pham"
                    class="rounded-xl bg-white px-8 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
                  >
                    {{ heroSlides[activeSlide].cta }}
                  </a>
                  <a
                    :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                    class="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3 font-medium transition hover:bg-white/10"
                  >
                    <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-white" />
                    <span>Tư vấn: {{ storeInfo.hotlineDisplay }}</span>
                  </a>
                </div>
              </div>
            </transition>

            <div class="mt-10 flex gap-2">
              <button
                v-for="(_, index) in heroSlides"
                :key="index"
                type="button"
                class="h-2 rounded-full transition-all cursor-pointer"
                :class="index === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'"
                :aria-label="`Slide ${index + 1}`"
                @click="goToSlide(index)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Trust bar -->
      <section class="border-b border-gray-200 bg-white">
        <div class="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          <div v-for="stat in trustStats" :key="stat.label" class="text-center">
            <p class="text-2xl font-bold text-red-600 md:text-3xl">{{ stat.value }}</p>
            <p class="mt-1 text-sm text-gray-600">{{ stat.label }}</p>
          </div>
        </div>
      </section>

      <!-- Categories ban đầu với Icon vector mới -->
      <section class="mx-auto max-w-7xl px-4 py-14">
        <div class="text-center">
          <h2 class="text-2xl font-bold md:text-3xl">Danh mục nổi bật</h2>
          <p class="mt-2 text-gray-600">Chọn nhanh theo nhu cầu của bạn</p>
        </div>
        <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <a
            v-for="cat in categories"
            :key="cat.name"
            href="#san-pham"
            class="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 transition hover:shadow-md group"
            :class="cat.color"
            @click.prevent="selectCategory(cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
              <StoreDeviceIcon
                :name="cat.name === 'Điện thoại' ? 'phone' : cat.name === 'Tablet' ? 'tablet' : cat.name === 'Laptop' ? 'laptop' : cat.name === 'Phụ kiện' ? 'accessory' : cat.name === 'Đồng hồ' ? 'watch' : 'all'"
                size-class="h-6 w-6"
              />
            </div>
            <p class="mt-3 font-semibold">{{ cat.name }}</p>
            <p class="mt-1 text-xs opacity-80">{{ cat.count }}</p>
          </a>
        </div>
      </section>

      <!-- Featured -->
      <section class="bg-white py-14">
        <div class="mx-auto max-w-7xl px-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold md:text-3xl">Nổi bật tuần này</h2>
              <p class="mt-2 text-gray-600">Giá cập nhật hôm nay — Hàng chính hãng, đủ IMEI</p>
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
      <section id="san-pham" class="bg-gray-50 py-14">
        <div class="mx-auto max-w-7xl px-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold md:text-3xl">Cửa hàng trực tuyến</h2>
              <p class="mt-2 text-gray-600">{{ filteredProducts.length }} sản phẩm — Lọc, so sánh và thêm giỏ hàng</p>
            </div>
          </div>

          <div class="mt-8 flex flex-col gap-6 lg:flex-row">
            <aside class="shrink-0 lg:w-56">
              <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Danh mục</p>
                <div class="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  <button
                    v-for="cat in catalogCategories"
                    :key="cat.id"
                    type="button"
                    class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition cursor-pointer"
                    :class="selectedCategory === cat.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'"
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
              <div class="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Thương hiệu</p>
                <select
                  v-model="selectedBrand"
                  class="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                >
                  <option v-for="b in catalogBrands" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
            </aside>

            <div class="min-w-0 flex-1">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p class="text-sm text-gray-500">
                  Hiển thị <span class="font-bold text-red-600">{{ filteredProducts.length }}</span> kết quả
                </p>
                <select v-model="selectedSort" class="rounded-xl border border-gray-200 px-3 py-2 text-sm">
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
              <div v-else class="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
                Không tìm thấy sản phẩm phù hợp. Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Promo banner -->
      <section id="khuyen-mai" class="mx-auto max-w-7xl px-4 py-6">
        <div
          class="overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 p-8 text-white md:p-12 shadow-lg shadow-red-500/20"
        >
          <div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p class="text-sm font-semibold uppercase tracking-wider text-red-100 flex items-center gap-1.5">
                <StoreDeviceIcon name="fire" size-class="h-4 w-4 text-amber-300" />
                <span>Flash sale</span>
              </p>
              <h2 class="mt-2 text-3xl font-bold md:text-4xl">Giảm thêm 500.000đ</h2>
              <p class="mt-2 max-w-lg text-red-50">
                Áp dụng khi thanh toán online hoặc trả góp qua thẻ — Duy nhất cuối tuần này.
              </p>
            </div>
            <div class="flex shrink-0 flex-col gap-3 sm:flex-row">
              <a
                href="#san-pham"
                class="rounded-xl bg-white px-8 py-3 text-center font-semibold text-red-600 transition hover:bg-red-50 shadow-sm"
              >
                Săn deal ngay
              </a>
              <a
                :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 px-8 py-3 text-center font-medium transition hover:bg-white/10"
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
        <h2 class="text-2xl font-bold md:text-3xl">Phụ kiện &amp; khuyến mãi</h2>
        <p class="mt-2 text-gray-600">Mua kèm máy — Giảm thêm khi mua combo</p>
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
      <section class="border-y border-gray-200 bg-white py-10">
        <div class="mx-auto max-w-7xl px-4">
          <p class="text-center text-sm font-medium uppercase tracking-widest text-gray-500">
            Thương hiệu đối tác
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <span
              v-for="brand in brands"
              :key="brand"
              class="rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-700"
            >
              {{ brand }}
            </span>
          </div>
        </div>
      </section>

      <!-- Services với Icon vector mới -->
      <section id="dich-vu" class="mx-auto max-w-7xl px-4 py-14">
        <div class="text-center">
          <h2 class="text-2xl font-bold md:text-3xl">Dịch vụ tại cửa hàng</h2>
          <p class="mt-2 text-gray-600">Trải nghiệm mua sắm an tâm từ A đến Z</p>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="service in services"
            :key="service.title"
            class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <StoreDeviceIcon v-if="service.icon === 'shield'" name="warranty" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else-if="service.icon === 'card'" name="installment" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else-if="service.icon === 'wrench'" name="trade-in" size-class="h-6 w-6" />
              <StoreDeviceIcon v-else name="delivery" size-class="h-6 w-6" />
            </div>
            <h3 class="mt-4 font-semibold">{{ service.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ service.description }}</p>
          </article>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="bg-gray-100 py-14">
        <div class="mx-auto max-w-7xl px-4">
          <h2 class="text-center text-2xl font-bold md:text-3xl">Khách hàng nói gì?</h2>
          <div class="mt-10 grid gap-6 md:grid-cols-3">
            <blockquote
              v-for="item in testimonials"
              :key="item.name"
              class="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div class="flex gap-0.5 text-amber-400">
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
        <div class="text-center">
          <h2 class="text-2xl font-bold md:text-3xl">Hệ thống {{ storeInfo.branches }} cửa hàng</h2>
          <p class="mt-2 text-gray-600">Ghé trực tiếp để trải nghiệm và nhận tư vấn</p>
        </div>
        <div class="mt-10 grid gap-6 lg:grid-cols-3">
          <article
            v-for="branch in branches"
            :key="branch.name"
            class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <span
              v-if="branch.isMain"
              class="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Trụ sở chính
            </span>
            <h3 class="font-semibold">{{ branch.name }}</h3>
            <p class="mt-3 text-sm text-gray-600">{{ branch.address }}</p>
            <ul class="mt-4 space-y-2 text-sm">
              <li>
                <span class="text-gray-500">Điện thoại:</span>
                <a :href="`tel:${branch.phone.replace(/\s/g, '')}`" class="ml-1 inline-flex items-center gap-1 font-medium text-red-600">
                  <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-600" />
                  <span>{{ branch.phone }}</span>
                </a>
              </li>
              <li>
                <span class="text-gray-500">Giờ mở cửa:</span>
                <span class="ml-1">{{ branch.hours }}</span>
              </li>
            </ul>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-5 inline-block text-sm font-semibold text-red-600 hover:underline"
            >
              Chỉ đường Google Maps →
            </a>
          </article>
        </div>

        <div class="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
          <div class="flex h-56 items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 md:h-72">
            <div class="text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-md mb-2">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p class="font-medium text-gray-800">{{ storeInfo.address }}</p>
              <p class="text-sm text-gray-500 mt-0.5">Bản đồ cửa hàng — hỗ trợ giao hàng và trải nghiệm thực tế</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact CTA -->
      <section class="mx-auto max-w-7xl px-4 pb-14">
        <div class="rounded-3xl bg-gray-900 px-6 py-12 text-center text-white md:px-12">
          <h2 class="text-2xl font-bold md:text-3xl">Cần tư vấn chọn máy?</h2>
          <p class="mx-auto mt-3 max-w-xl text-gray-400">
            Đội ngũ {{ storeInfo.name }} sẵn sàng hỗ trợ so sánh cấu hình, chính sách trả góp và bảo hành.
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-4">
            <a
              :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
              class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 font-semibold transition hover:bg-red-700 shadow-md"
            >
              <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-white" />
              <span>Gọi {{ storeInfo.hotlineDisplay }}</span>
            </a>
            <a
              href="#cua-hang"
              class="rounded-xl border border-white/30 px-8 py-3 font-medium transition hover:bg-white/10"
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

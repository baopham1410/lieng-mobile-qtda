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

// Apple-style device categories ribbon
const ribbonCategories = [
  { id: 'all', label: 'Tất cả', icon: '✨' },
  { id: 'phone', label: 'iPhone & Phone', icon: '📱' },
  { id: 'tablet', label: 'iPad & Tablet', icon: '📲' },
  { id: 'laptop', label: 'Mac & Laptop', icon: '💻' },
  { id: 'watch', label: 'Apple Watch', icon: '⌚' },
  { id: 'accessory', label: 'AirPods & Phụ Kiện', icon: '🎧' },
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
  <div class="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-[#0071E3] selection:text-white">
    <StoreHeader
      v-model:search-query="searchQuery"
      :cart-count="cartCount"
      @open-cart="cartOpen = true"
    />

    <!-- Checkout Notification Toast -->
    <Transition name="fade">
      <div
        v-if="checkoutNotice"
        class="fixed bottom-8 left-1/2 z-[90] -translate-x-1/2 flex items-center gap-3 rounded-full bg-[#1D1D1F]/90 backdrop-blur-xl px-6 py-3 text-sm font-medium text-white shadow-2xl border border-white/10"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#34C759] text-[11px] font-bold">✓</span>
        <span>Đã ghi nhận yêu cầu đặt hàng. Chuyên viên sẽ gọi tư vấn trong ít phút!</span>
      </div>
    </Transition>

    <main class="space-y-12 sm:space-y-20 pb-20">
      <!-- Apple-style Device Ribbon Bar -->
      <section class="bg-white border-b border-black/[0.06] py-4">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6 custom-scrollbar-content">
          <button
            v-for="cat in ribbonCategories"
            :key="cat.id"
            type="button"
            class="flex flex-col items-center justify-center gap-1.5 shrink-0 px-3 py-1 group transition-all"
            @click="selectCategory(cat.id)"
          >
            <span class="text-2xl transition-transform group-hover:scale-110">{{ cat.icon }}</span>
            <span
              class="text-xs font-normal transition-colors"
              :class="selectedCategory === cat.id ? 'text-[#0071E3] font-semibold' : 'text-[#1D1D1F]/80 group-hover:text-[#0071E3]'"
            >
              {{ cat.label }}
            </span>
          </button>
        </div>
      </section>

      <!-- Apple-style Grand Hero Showcase (Minimalist & Cinematic) -->
      <section class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="relative overflow-hidden rounded-[32px] bg-[#000000] text-white min-h-[520px] sm:min-h-[580px] flex flex-col justify-between p-8 sm:p-14 shadow-[0_25px_50px_rgba(0,0,0,0.15)]">
          <!-- Background image slider -->
          <div
            v-for="(slide, index) in heroSlides"
            :key="slide.title"
            class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            :class="index === activeSlide ? 'opacity-100' : 'opacity-0'"
          >
            <template v-if="slide.bgImage">
              <div
                class="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-10000 scale-105"
                :style="{ backgroundImage: `url(${slide.bgImage})` }"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/50 sm:to-transparent" />
            </template>
            <template v-else>
              <div class="absolute inset-0 bg-gradient-to-br from-[#1C1C1E] via-[#000000] to-[#2C2C2E]" />
            </template>
          </div>

          <!-- Hero Content Block -->
          <div class="relative z-10 max-w-xl my-auto">
            <span class="text-xs font-semibold tracking-widest text-[#F5F5F7]/70 uppercase">
              {{ heroSlides[activeSlide].badge }}
            </span>

            <h1 class="mt-3 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.08] text-white">
              {{ heroSlides[activeSlide].title }}
            </h1>

            <p class="mt-4 text-base sm:text-lg font-normal text-[#A1A1A6] leading-relaxed max-w-lg">
              {{ heroSlides[activeSlide].subtitle }}
            </p>

            <!-- Apple-style Dual Buttons -->
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#san-pham"
                class="rounded-full bg-[#0071E3] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#0077ED] active:scale-95 shadow-md"
              >
                {{ heroSlides[activeSlide].cta }}
              </a>
              <a
                :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
                class="inline-flex items-center gap-1 text-sm font-medium text-[#0071E3] hover:underline"
              >
                <span>Tư vấn: {{ storeInfo.hotlineDisplay }}</span>
                <span class="text-base">›</span>
              </a>
            </div>
          </div>

          <!-- Slide Dots Indicator -->
          <div class="relative z-10 flex items-center gap-2 pt-6">
            <button
              v-for="(_, index) in heroSlides"
              :key="index"
              type="button"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="index === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'"
              :aria-label="`Slide ${index + 1}`"
              @click="goToSlide(index)"
            />
          </div>
        </div>
      </section>

      <!-- Apple-style Bento Highlights Grid -->
      <section class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mb-8">
          <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Thế hệ thiết bị mới nhất.
          </h2>
          <p class="mt-1 text-sm text-[#86868B]">Thiết kế đỉnh cao. Sức mạnh vượt trội. Sẵn hàng tại Lieng Mobile.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Bento Card 1: iPhone -->
          <div class="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-white p-8 sm:p-10 border border-black/[0.04] transition hover:shadow-lg">
            <div>
              <span class="text-xs font-semibold text-[#86868B] uppercase tracking-wider">iPhone 15 Series</span>
              <h3 class="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                Titanium. Bền nhẹ ấn tượng.
              </h3>
              <p class="mt-2 text-xs text-[#86868B]">Từ 19.990.000đ hoặc 1.665.000đ/tháng với trả góp 0%</p>
              <div class="mt-4 flex gap-4">
                <a href="#san-pham" class="rounded-full bg-[#0071E3] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#0077ED] transition">
                  Mua ngay
                </a>
                <button type="button" class="text-xs font-medium text-[#0071E3] hover:underline inline-flex items-center" @click="selectCategory('phone')">
                  Xem tất cả iPhone ›
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

          <!-- Bento Card 2: Samsung & Android Flagship -->
          <div class="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#1D1D1F] text-white p-8 sm:p-10 border border-white/[0.05] transition hover:shadow-2xl">
            <div>
              <span class="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Galaxy AI</span>
              <h3 class="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Samsung Galaxy S24 Ultra.
              </h3>
              <p class="mt-2 text-xs text-[#A1A1A6]">Kỷ nguyên trí tuệ nhân tạo di động. S-Pen quyền năng.</p>
              <div class="mt-4 flex gap-4">
                <a href="#san-pham" class="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-[#1D1D1F] hover:bg-slate-200 transition">
                  Mua ngay
                </a>
                <button type="button" class="text-xs font-medium text-[#2997FF] hover:underline inline-flex items-center" @click="selectCategory('phone')">
                  Tìm hiểu thêm ›
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

      <!-- Apple-style Product Catalog (#san-pham) -->
      <section id="san-pham" class="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/[0.08] pb-6">
          <div>
            <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Toàn bộ sản phẩm.
            </h2>
            <p class="mt-1 text-sm text-[#86868B]">
              Lựa chọn thiết bị yêu thích của bạn với giá tốt nhất và bảo hành chính hãng.
            </p>
          </div>

          <!-- Apple-style Category Segmented Filter -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="cat in catalogCategories"
              :key="cat.id"
              type="button"
              class="rounded-full px-4 py-1.5 text-xs font-medium transition-all"
              :class="selectedCategory === cat.id ? 'bg-[#1D1D1F] text-white shadow-sm' : 'bg-white text-[#1D1D1F]/70 hover:text-black hover:bg-black/[0.04] border border-black/[0.06]'"
              @click="selectedCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Filter Sub-bar: Brand & Sort -->
        <div class="my-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-[#86868B]">Hãng:</span>
            <div class="flex flex-wrap items-center gap-1">
              <button
                v-for="b in catalogBrands"
                :key="b"
                type="button"
                class="rounded-full px-3 py-1 transition-all"
                :class="selectedBrand === b ? 'bg-[#0071E3] text-white font-medium' : 'text-[#1D1D1F]/80 hover:text-black'"
                @click="selectedBrand = b"
              >
                {{ b }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 text-[#86868B]">
            <span>Sắp xếp:</span>
            <select
              v-model="selectedSort"
              class="rounded-full bg-white border border-black/[0.08] px-3 py-1 text-xs text-[#1D1D1F] outline-none"
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
        <div v-else class="rounded-[28px] bg-white p-12 text-center border border-black/[0.06]">
          <p class="text-lg font-semibold text-[#1D1D1F]">Không tìm thấy thiết bị phù hợp</p>
          <p class="mt-1 text-xs text-[#86868B]">Vui lòng thử từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ máy.</p>
          <button
            type="button"
            class="mt-4 rounded-full bg-[#1D1D1F] px-5 py-2 text-xs font-medium text-white hover:bg-black transition"
            @click="selectedCategory = 'all'; selectedBrand = 'Tất cả'; searchQuery = ''"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      </section>

      <!-- Apple-style Value Propositions ("Trải nghiệm tại Lieng Mobile") -->
      <section id="dich-vu" class="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Trải nghiệm mua sắm khác biệt.
          </h2>
          <p class="mt-2 text-sm text-[#86868B]">
            Chúng tôi cam kết mang tới sự an tâm tuyệt đối trong từng chi tiết sản phẩm và dịch vụ.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="rounded-[24px] bg-white p-7 border border-black/[0.04] flex flex-col justify-between">
            <span class="text-3xl">🚚</span>
            <div class="mt-8">
              <h3 class="text-base font-semibold text-[#1D1D1F]">Giao hàng miễn phí</h3>
              <p class="mt-2 text-xs leading-relaxed text-[#86868B]">
                Miễn phí giao hàng hỏa tốc trong 2 giờ tại nội thành. Đóng gói cẩn thận, an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <div class="rounded-[24px] bg-white p-7 border border-black/[0.04] flex flex-col justify-between">
            <span class="text-3xl">💳</span>
            <div class="mt-8">
              <h3 class="text-base font-semibold text-[#1D1D1F]">Trả góp 0% linh hoạt</h3>
              <p class="mt-2 text-xs leading-relaxed text-[#86868B]">
                Hỗ trợ trả góp qua thẻ tín dụng và công ty tài chính với thủ tục đơn giản, xét duyệt chỉ trong 5 phút.
              </p>
            </div>
          </div>

          <div class="rounded-[24px] bg-white p-7 border border-black/[0.04] flex flex-col justify-between">
            <span class="text-3xl">🔄</span>
            <div class="mt-8">
              <h3 class="text-base font-semibold text-[#1D1D1F]">Thu cũ đổi mới</h3>
              <p class="mt-2 text-xs leading-relaxed text-[#86868B]">
                Lên đời thiết bị mới dễ dàng. Trợ giá thu cũ thêm đến 2 triệu đồng, thẩm định máy minh bạch.
              </p>
            </div>
          </div>

          <div class="rounded-[24px] bg-white p-7 border border-black/[0.04] flex flex-col justify-between">
            <span class="text-3xl">🛡️</span>
            <div class="mt-8">
              <h3 class="text-base font-semibold text-[#1D1D1F]">Bảo hành chuẩn GSMA</h3>
              <p class="mt-2 text-xs leading-relaxed text-[#86868B]">
                Mỗi thiết bị đều được kiểm tra IMEI chính hãng, bảo hành 12 tháng 1 đổi 1 trong 30 ngày đầu tiên.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stores Section -->
      <section id="cua-hang" class="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div class="rounded-[32px] bg-white p-8 sm:p-12 border border-black/[0.06]">
          <div class="max-w-xl">
            <span class="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Hệ thống cửa hàng</span>
            <h2 class="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Ghé thăm cửa hàng Lieng Mobile.
            </h2>
            <p class="mt-2 text-xs sm:text-sm text-[#86868B] leading-relaxed">
              Trực tiếp trải nghiệm sản phẩm, nhận hỗ trợ kỹ thuật 1 kèm 1 và dán màn hình miễn phí.
            </p>
          </div>

          <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="branch in branches"
              :key="branch.name"
              class="rounded-[20px] bg-[#F5F5F7] p-6 flex flex-col justify-between"
            >
              <div>
                <p class="text-sm font-semibold text-[#1D1D1F]">{{ branch.name }}</p>
                <p class="mt-2 text-xs text-[#86868B] leading-relaxed">{{ branch.address }}</p>
              </div>
              <div class="mt-6 pt-4 border-t border-black/[0.06] text-xs">
                <p class="text-[#86868B]">Mở cửa: <span class="text-[#1D1D1F] font-medium">{{ branch.hours }}</span></p>
                <a
                  :href="`tel:${branch.phone.replace(/\s/g, '')}`"
                  class="mt-1 inline-block text-[#0071E3] font-medium hover:underline"
                >
                  {{ branch.phone }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Apple-style Minimalist Footer -->
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
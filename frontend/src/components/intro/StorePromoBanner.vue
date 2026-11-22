<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentSlide = ref(0)
const isPaused = ref(false)
let timer = null

const slides = [
  {
    id: 'iphone16',
    tabLabel: 'iPhone 16 Series',
    badge: 'SIÊU PHẨM MỚI • CHÍNH HÃNG VN/A',
    badgeClass: 'bg-white/20 text-white border-white/30',
    title: 'iPhone 16 Pro Max',
    slogan: 'Titan Sa Mạc • Đỉnh Cao Công Nghệ',
    description: 'Hiệu năng bứt phá từ vi xử lý Apple A18 Pro 3nm thế hệ mới. Cụm camera 48MP Fusion quay phim 4K 120fps chuẩn điện ảnh và phím bấm Camera Control cảm ứng lực đột phá.',
    bgImage: '/hero/slide1-iphone16-banner.jpg',
    bgClass: 'bg-cover bg-[position:center_right]',
    gradient: 'from-[#8B0000] via-[#B91C1C] to-[#450A0A]',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    isLightTheme: false,
    isPureBanner: false,
    specs: [
      { label: 'Chip Apple A18 Pro', desc: 'Tiến trình 3nm tối tân' },
      { label: 'Camera 48MP Fusion', desc: 'Ghi hình 4K 120fps' },
      { label: 'Titan Cấp 5', desc: 'Siêu nhẹ & viền 1.15mm' },
    ],
    highlights: [
      'Trợ giá Thu cũ đổi mới lên đến 4.000.000₫',
      'Trả góp 0% lãi suất — Duyệt hồ sơ nhanh trong 15 phút',
      'Bảo hành 1 đổi 1 trong 30 ngày chính hãng Apple VN/A',
    ],
    primaryCta: { label: 'Mua ngay', link: '#san-pham' },
    secondaryCta: { label: 'Xem chi tiết', link: '#san-pham' },
  },
  {
    id: 'apple-ecosystem',
    tabLabel: 'Hệ Sinh Thái Apple',
    badge: 'CHÍNH HÃNG APPLE VN/A • TRỌN BỘ COMBO',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    title: 'Hệ Sinh Thái Apple',
    slogan: 'Trọn Bộ Thiết Bị • Trải Nghiệm Liền Mạch',
    description: 'Đầy đủ iPhone, iPad, MacBook, Apple Watch & AirPods chính hãng VN/A. Đồng bộ tức thì qua iCloud và AirDrop, hiệu năng tối thượng cho công việc và giải trí.',
    bgImage: '/hero/slide2-apple-wide.jpg',
    bgClass: 'bg-cover bg-right bg-white',
    gradient: 'from-white via-gray-50 to-white',
    glowColor: 'rgba(220, 38, 38, 0.15)',
    isLightTheme: true,
    isPureBanner: false,
    specs: [
      { label: 'Đồng Bộ Liền Mạch', desc: 'AirDrop & iCloud nhanh' },
      { label: 'Chính Hãng VN/A', desc: 'Bảo hành Apple 12T' },
      { label: 'Trọn Bộ Thiết Bị', desc: 'iPhone, Mac, iPad, Watch' },
    ],
    highlights: [
      'Thu cũ đổi mới trợ giá lên đến 5.000.000₫ cho cả hệ sinh thái',
      'Trả góp 0% lãi suất — Duyệt hồ sơ nhanh chỉ trong 15 phút',
      'Ưu đãi giảm thêm đến 15% khi mua trọn bộ combo Apple chính hãng',
    ],
    primaryCta: { label: 'Khám phá ngay', link: '#san-pham' },
    secondaryCta: { label: 'Tư vấn Combo', link: '#san-pham' },
  },
  {
    id: 'smartwatch',
    tabLabel: 'Đồng Hồ Thông Minh',
    bgImage: '/hero/slide3-smartwatch-banner.jpg',
    bgClass: 'bg-cover bg-center',
    gradient: 'from-[#1a100e] via-[#2d1b17] to-[#120a08]',
    glowColor: 'rgba(217, 119, 6, 0.25)',
    isLightTheme: false,
    isPureBanner: true, // Ảnh đã có sẵn chữ và bố cục hoàn chỉnh, không thêm chữ đè lên
    link: '#san-pham',
  },
]

function nextSlide() {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

function prevSlide() {
  currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length
}

function setSlide(idx) {
  currentSlide.value = idx
}

function toggleAutoplay() {
  isPaused.value = !isPaused.value
}

function startAutoplay() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (!isPaused.value) {
      nextSlide()
    }
  }, 5500)
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="relative w-full bg-gray-50 pt-5 pb-3">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      
      <!-- MAIN MARKETING BANNER CARD -->
      <div
        class="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-xl transition-all duration-500 border border-gray-200/60"
        @mouseenter="isPaused = true"
        @mouseleave="isPaused = false"
      >
        <!-- BACKGROUND IMAGE LAYER -->
        <div
          class="absolute inset-0 w-full h-full transition-all duration-700 pointer-events-none"
          :class="slides[currentSlide].bgClass"
          :style="{ backgroundImage: `url(${slides[currentSlide].bgImage})` }"
        >
          <!-- Soft overlay for Slide 1 text readability on smaller viewports -->
          <div
            v-if="slides[currentSlide].id === 'iphone16'"
            class="absolute inset-0 bg-gradient-to-r from-black/60 via-red-950/40 to-transparent lg:from-transparent"
          />
          <!-- Soft overlay for Slide 2 text readability on smaller viewports -->
          <div
            v-if="slides[currentSlide].id === 'apple-ecosystem'"
            class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent lg:from-transparent"
          />
        </div>

        <!-- AMBIENT GLOW EFFECT -->
        <div
          class="absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-50"
          :style="{ background: slides[currentSlide].glowColor }"
        />
        <div
          class="absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-50"
          :style="{ background: slides[currentSlide].glowColor }"
        />

        <!-- BANNER SLIDE CONTENT -->
        <div
          class="relative p-6 sm:p-8 lg:p-10 transition-colors duration-700 min-h-[380px] lg:min-h-[420px] flex flex-col justify-between"
          :class="[
            slides[currentSlide].isLightTheme ? 'text-gray-900' : 'text-white'
          ]"
        >
          <!-- LAYOUT FOR SLIDES WITH MARKETING COPY (SLIDE 1 & SLIDE 2) -->
          <div
            v-if="!slides[currentSlide].isPureBanner"
            class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center"
          >
            <!-- LEFT PROMO CONTENT -->
            <div class="lg:col-span-7 flex flex-col justify-center space-y-3.5 z-10">
              
              <!-- TOP BADGE -->
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-xs"
                  :class="slides[currentSlide].badgeClass"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full animate-ping"
                    :class="slides[currentSlide].isLightTheme ? 'bg-red-600' : 'bg-white'"
                  />
                  <span>{{ slides[currentSlide].badge }}</span>
                </span>
              </div>

              <!-- MAIN HEADLINE -->
              <div>
                <h2
                  class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight"
                  :class="slides[currentSlide].isLightTheme ? 'text-gray-950' : 'text-white'"
                >
                  {{ slides[currentSlide].title }}
                </h2>
                <p
                  class="text-xs sm:text-sm font-bold tracking-wide mt-1 uppercase"
                  :class="slides[currentSlide].isLightTheme ? 'text-red-600' : 'text-white/90'"
                >
                  {{ slides[currentSlide].slogan }}
                </p>
              </div>

              <!-- SHORT PROMO DESCRIPTION -->
              <p
                class="text-xs sm:text-sm leading-relaxed max-w-xl font-normal line-clamp-2 sm:line-clamp-none"
                :class="slides[currentSlide].isLightTheme ? 'text-gray-600' : 'text-white/80'"
              >
                {{ slides[currentSlide].description }}
              </p>

              <!-- 3 KEY SPEC CHIPS -->
              <div class="grid grid-cols-3 gap-2 pt-1 max-w-lg">
                <div
                  v-for="(spec, sIdx) in slides[currentSlide].specs"
                  :key="sIdx"
                  class="rounded-xl p-2 sm:p-2.5 backdrop-blur-sm border transition-all"
                  :class="slides[currentSlide].isLightTheme
                    ? 'bg-gray-100/90 border-gray-200 shadow-xs'
                    : 'bg-white/10 border-white/15'
                  "
                >
                  <p
                    class="text-[11px] sm:text-xs font-bold truncate"
                    :class="slides[currentSlide].isLightTheme ? 'text-gray-900' : 'text-white'"
                  >
                    {{ spec.label }}
                  </p>
                  <p
                    class="text-[10px] truncate mt-0.5"
                    :class="slides[currentSlide].isLightTheme ? 'text-gray-500' : 'text-white/70'"
                  >
                    {{ spec.desc }}
                  </p>
                </div>
              </div>

              <!-- HIGHLIGHT BULLETS -->
              <div class="space-y-1.5 pt-1">
                <div
                  v-for="(hl, hIdx) in slides[currentSlide].highlights"
                  :key="hIdx"
                  class="flex items-center gap-2 text-xs sm:text-sm"
                  :class="slides[currentSlide].isLightTheme ? 'text-gray-800' : 'text-white/95'"
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    :class="slides[currentSlide].isLightTheme ? 'text-emerald-600' : 'text-amber-300'"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span class="truncate sm:whitespace-normal font-medium">{{ hl }}</span>
                </div>
              </div>

              <!-- CALL TO ACTION BUTTONS -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <a
                  :href="slides[currentSlide].primaryCta.link"
                  class="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  :class="slides[currentSlide].isLightTheme
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-950'
                  "
                >
                  <span>{{ slides[currentSlide].primaryCta.label }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>

                <a
                  :href="slides[currentSlide].secondaryCta.link"
                  class="inline-flex items-center gap-1.5 px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer border"
                  :class="slides[currentSlide].isLightTheme
                    ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                    : 'bg-black/20 hover:bg-black/30 border-white/25 text-white'
                  "
                >
                  <span>{{ slides[currentSlide].secondaryCta.label }}</span>
                </a>
              </div>
            </div>

            <!-- RIGHT PROMO SPACER (Allows background artwork to shine through cleanly without box container) -->
            <div class="hidden lg:block lg:col-span-5 pointer-events-none min-h-[280px]" />
          </div>

          <!-- LAYOUT FOR PURE VISUAL BANNER (SLIDE 3: NO OVERLAY TEXT TO PREVENT COLLISION) -->
          <a
            v-else
            :href="slides[currentSlide].link || '#san-pham'"
            class="flex-1 w-full min-h-[260px] sm:min-h-[300px] lg:min-h-[340px] block cursor-pointer"
            aria-label="Khám phá bộ sưu tập đồng hồ thông minh"
          >
            <!-- Background contains all graphics & typography, no overlapping elements added -->
          </a>

          <!-- BOTTOM CONTROLS BAR: DOTS & ARROWS -->
          <div
            class="flex items-center justify-between pt-3 mt-3 z-10"
            :class="slides[currentSlide].isLightTheme ? 'border-t border-gray-200/80' : 'border-t border-white/15'"
          >
            <!-- DOTS INDICATORS -->
            <div class="flex items-center gap-2">
              <button
                v-for="(slide, idx) in slides"
                :key="`dot-${slide.id}`"
                type="button"
                class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                :class="[
                  currentSlide === idx
                    ? (slides[currentSlide].isLightTheme ? 'w-7 bg-red-600' : 'w-7 bg-white')
                    : (slides[currentSlide].isLightTheme ? 'w-2 bg-gray-300 hover:bg-gray-500' : 'w-2 bg-white/40 hover:bg-white/70')
                ]"
                :aria-label="`Chuyển đến slide ${idx + 1}`"
                @click="setSlide(idx)"
              />
            </div>

            <!-- COUNTER & PREV/NEXT ARROWS -->
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-mono font-medium mr-1"
                :class="slides[currentSlide].isLightTheme ? 'text-gray-600' : 'text-white/80'"
              >
                0{{ currentSlide + 1 }} / 0{{ slides.length }}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer active:scale-90 border"
                :class="slides[currentSlide].isLightTheme
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                  : 'bg-white/15 hover:bg-white/30 border-white/20 text-white'
                "
                aria-label="Slide trước"
                title="Slide trước"
                @click="prevSlide"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer active:scale-90 border"
                :class="slides[currentSlide].isLightTheme
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                  : 'bg-white/15 hover:bg-white/30 border-white/20 text-white'
                "
                aria-label="Slide tiếp theo"
                title="Slide tiếp theo"
                @click="nextSlide"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- BOTTOM QUICK PROMO TABS (TOPZONE / THẾ GIỚI DI ĐỘNG STYLE) -->
      <div class="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-1">
        <!-- TABS -->
        <div class="flex items-center gap-1.5 p-1 rounded-full bg-white border border-gray-200 shadow-xs max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <button
            v-for="(slide, idx) in slides"
            :key="`tab-${slide.id}`"
            type="button"
            class="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="[
              currentSlide === idx
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
            ]"
            @click="setSlide(idx)"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="currentSlide === idx ? 'bg-white' : 'bg-gray-400'"
            />
            <span>{{ slide.tabLabel }}</span>
          </button>
        </div>

        <!-- AUTOPLAY STATUS / PAUSE TOGGLE -->
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition cursor-pointer active:scale-95"
            :title="isPaused ? 'Tiếp tục tự động chuyển' : 'Tạm dừng tự động chuyển'"
            @click="toggleAutoplay"
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'"
            />
            <span class="font-medium">{{ isPaused ? 'Đã tạm dừng' : 'Tự chuyển mỗi 5s' }}</span>
          </button>
        </div>
      </div>

    </div>
  </section>
</template>

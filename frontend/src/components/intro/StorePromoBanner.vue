<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentSlide = ref(0)
const isPaused = ref(false)
let timer = null

const slides = [
  {
    id: 'ecosystem',
    tabLabel: 'Apple Next Era',
    badge: 'KỶ NGUYÊN 2025 • APPLE ECOSYSTEM',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    title: 'Kỷ Nguyên Mới Của Hệ Sinh Thái Apple',
    subtitle: 'Hội tụ trọn bộ siêu phẩm công nghệ đỉnh cao: iPhone Fold màn hình kép, iPhone Pro Max, Apple Watch Ultra & AirPods Pro chính hãng VNA.',
    gradient: 'from-[#0b0f19] via-[#111827] to-[#1e1b4b]',
    accentBorder: 'border-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    highlights: [
      'Trợ giá thu cũ đổi mới lên đến 5.000.000₫',
      'Trả góp 0% lãi suất — Duyệt hồ sơ nhanh 15 phút',
      'Bảo hành chính hãng 1 đổi 1 trong 30 ngày đầu',
    ],
    primaryCta: { label: 'Khám Phá Kỷ Nguyên Mới', link: '#san-pham' },
    secondaryCta: { label: 'Hotline: 0383 435 600', link: 'tel:0383435600' },
    image: '/intro/gallery/apple-ecosystem-banner.jpg',
    imageAlt: 'Apple Next Era Ecosystem',
  },
  {
    id: 'ip17',
    tabLabel: 'iPhone 17 Pro',
    badge: 'PHIÊN BẢN ĐỘC BẢN • COSMIC ORANGE',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    title: 'iPhone 17 Pro Max • Sắc Cam Vũ Trụ',
    subtitle: 'Thiết kế Titan Cấp 5 độc bản với viền siêu mỏng 1.15mm, sức mạnh chip Apple A19 Pro 3nm và cụm 3 camera 48MP Triple Fusion đồng nhất tiêu cự.',
    gradient: 'from-[#140e0a] via-[#1c1917] to-[#29160a]',
    accentBorder: 'border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    highlights: [
      'Màn hình Super Retina XDR ProMotion 120Hz viền 1.15mm',
      'Ghi hình không gian chuẩn điện ảnh Spatial Video 8K',
      'Phím xúc giác sapphire zoom mượt và chụp 2 nấc chuẩn DSLR',
    ],
    primaryCta: { label: 'Chi Tiết Cosmic Orange', link: '#flagship-showcase' },
    secondaryCta: { label: 'Xem Bảng Giá', link: '#san-pham' },
    image: '/intro/gallery/ip17-floating-hand.jpg',
    imageAlt: 'iPhone 17 Pro Cosmic Orange',
  },
  {
    id: 'ip18',
    tabLabel: 'iPhone 18 Pro',
    badge: 'THE NEXT CHAPTER • IPHONE 18 PRO',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    title: 'iPhone 18 Pro • Khí Chất Đỏ Rượu Vang',
    subtitle: 'Kiến trúc Forged in power kết hợp cụm đảo camera liền khối, tản nhiệt buồng hơi Vapor Chamber và pin mở rộng thêm +22 giờ sử dụng.',
    gradient: 'from-[#160b10] via-[#1c1917] to-[#2c0e18]',
    accentBorder: 'border-rose-500/30',
    glowColor: 'rgba(225, 29, 72, 0.25)',
    highlights: [
      'Tốc độ CPU Apple Silicon thế hệ mới tăng +50%',
      'GPU Ray Tracing 2.1x bứt phá mọi giới hạn đồ họa Game AAA',
      'Độ sáng màn hình cực đại 3.200 nits thách thức ánh nắng',
    ],
    primaryCta: { label: 'Trải Nghiệm Siêu Phẩm', link: '#flagship-showcase' },
    secondaryCta: { label: 'Đăng Ký Đặt Sớm', link: '#san-pham' },
    image: '/intro/gallery/ip18-crimson-pedestal.jpg',
    imageAlt: 'iPhone 18 Pro Deep Crimson',
  },
  {
    id: 's24u',
    tabLabel: 'Galaxy S24 Ultra',
    badge: 'NHIẾP ẢNH MẮT THẦN & GALAXY AI',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    title: 'Galaxy S24 Ultra • Quyền Năng Tối Thượng',
    subtitle: 'Đỉnh cao nhiếp ảnh di động với cảm biến Mắt Thần 200MP, Space Zoom 100x AI, bút S-Pen quyền lực và khung vỏ Titanium Violet sang trọng.',
    gradient: 'from-[#0e0f1a] via-[#111827] to-[#1e1338]',
    accentBorder: 'border-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    highlights: [
      'Màn hình phẳng Dynamic AMOLED 2X 120Hz giảm 75% chói lóa',
      'Snapdragon 8 Gen 3 for Galaxy tối ưu hóa đồ họa chuyên sâu',
      'Khoanh tròn để tìm kiếm Circle to Search với Google tiện lợi',
    ],
    primaryCta: { label: 'Xem Giá S24 Ultra', link: '#san-pham' },
    secondaryCta: { label: 'Soi Chi Tiết 3D', link: '#flagship-showcase' },
    image: '/intro/gallery/s24-ultra-poster.jpg',
    imageAlt: 'Samsung Galaxy S24 Ultra',
  },
  {
    id: 'tradein',
    tabLabel: 'Thu Cũ Đổi Mới',
    badge: 'ĐẶC QUYỀN THU CŨ • TRỢ GIÁ 5.000.000₫',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    title: 'Năm Bước Nhảy Vọt • Lên Đời Siêu Phẩm',
    subtitle: 'Hệ thống thẩm định máy tự động AutoGrade AI & OCR giúp bạn biết chính xác giá thu mua chỉ trong 60 giây. Thủ tục nhanh gọn, nhận máy mới ngay.',
    gradient: 'from-[#0a1219] via-[#0f172a] to-[#0c2233]',
    accentBorder: 'border-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    highlights: [
      'Định giá minh bạch bằng AI qua 4 góc chụp và kiểm tra vi mạch',
      'Trợ giá trực tiếp lên đến 5.000.000₫ trừ thẳng vào giá máy mới',
      'Thu mua mọi tình trạng máy — Hỗ trợ bù chênh lệch trả góp 0%',
    ],
    primaryCta: { label: 'Định Giá Máy Cũ Ngay', link: '#flagship-showcase' },
    secondaryCta: { label: 'Bảng Giá Thu Đổi', link: '#san-pham' },
    image: '/intro/gallery/ip-leap-year.jpg',
    imageAlt: 'Trade-in Leap Year Program',
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

function toggleAutoplayPause() {
  isPaused.value = !isPaused.value
}

function startAutoplay() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (!isPaused.value) {
      nextSlide()
    }
  }, 5000)
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="relative w-full bg-gray-50 pt-6 pb-2">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <!-- MAIN BANNER CAROUSEL CARD -->
      <div
        class="relative overflow-hidden rounded-[28px] border shadow-2xl transition-all duration-500"
        :class="slides[currentSlide].accentBorder"
        @mouseenter="isPaused = true"
        @mouseleave="isPaused = false"
      >
        <!-- BACKGROUND AMBIENT GLOW AURAS -->
        <div
          class="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
          :style="{ background: slides[currentSlide].glowColor }"
        />
        <div
          class="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
          :style="{ background: slides[currentSlide].glowColor }"
        />

        <!-- SLIDE CONTENT CONTAINER -->
        <div
          class="relative bg-gradient-to-br text-white p-7 sm:p-9 lg:p-12 transition-colors duration-700 min-h-[460px] flex flex-col justify-between"
          :class="slides[currentSlide].gradient"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <!-- LEFT COLUMN: PROMO DETAILS & CALL-TO-ACTIONS -->
            <div class="lg:col-span-7 flex flex-col justify-center space-y-5 z-10">
              <!-- TOP BADGE & SLIDE COUNTER -->
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 shadow-xs"
                  :class="slides[currentSlide].badgeClass"
                >
                  <span class="h-2 w-2 rounded-full bg-current animate-ping" />
                  <span>{{ slides[currentSlide].badge }}</span>
                </span>
                <span class="text-xs font-mono font-medium text-white/50">
                  0{{ currentSlide + 1 }} / 0{{ slides.length }}
                </span>
              </div>

              <!-- MAIN HEADING -->
              <h2 class="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black tracking-tight text-white leading-[1.2] text-balance">
                {{ slides[currentSlide].title }}
              </h2>

              <!-- SUBTITLE / DESCRIPTION -->
              <p class="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
                {{ slides[currentSlide].subtitle }}
              </p>

              <!-- HIGHLIGHT BULLETS WITH CLEAN SVG CHECKMARKS -->
              <div class="space-y-2.5 pt-1">
                <div
                  v-for="(hl, idx) in slides[currentSlide].highlights"
                  :key="idx"
                  class="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200"
                >
                  <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{{ hl }}</span>
                </div>
              </div>

              <!-- CTA BUTTONS & SLIDE CONTROLS -->
              <div class="flex flex-wrap items-center gap-3.5 pt-3">
                <a
                  :href="slides[currentSlide].primaryCta.link"
                  class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 hover:shadow-red-600/50 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>{{ slides[currentSlide].primaryCta.label }}</span>
                  <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>

                <a
                  :href="slides[currentSlide].secondaryCta.link"
                  class="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>{{ slides[currentSlide].secondaryCta.label }}</span>
                </a>
              </div>
            </div>

            <!-- RIGHT COLUMN: PRODUCT SHOWCASE IMAGE (NO DOUBLE BORDERS, CLEAN FLOATING HERO) -->
            <div class="lg:col-span-5 flex justify-center items-center z-10">
              <div class="relative group w-full max-w-lg flex items-center justify-center py-2">
                <img
                  :src="slides[currentSlide].image"
                  :alt="slides[currentSlide].imageAlt"
                  class="w-full h-64 sm:h-72 md:h-84 lg:h-[350px] object-cover sm:object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/15 transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="eager"
                />
              </div>
            </div>

          </div>

          <!-- BOTTOM-RIGHT SLIDE SWITCHER CONTROLS -->
          <div class="hidden sm:flex items-center justify-end gap-2 pt-4 border-t border-white/10 mt-6">
            <span class="text-xs text-white/50 mr-2">Chuyển banner:</span>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer active:scale-90"
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
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer active:scale-90"
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

      <!-- BOTTOM NAVIGATION SEGMENTED CONTROL (ZERO SCROLLBAR, APPLE HIG STYLE) -->
      <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <!-- SEGMENTED TABS -->
        <div class="flex items-center gap-1.5 p-1 rounded-full bg-gray-100/90 border border-gray-200/90 shadow-xs max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <button
            v-for="(slide, idx) in slides"
            :key="slide.id"
            type="button"
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="[
              currentSlide === idx
                ? 'bg-white text-gray-900 font-bold shadow-sm border border-gray-200/80'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 font-medium'
            ]"
            @click="setSlide(idx)"
          >
            <span
              class="h-1.5 w-1.5 rounded-full transition-all"
              :class="currentSlide === idx ? 'bg-red-600' : 'bg-gray-300'"
            />
            <span>{{ slide.tabLabel }}</span>
          </button>
        </div>

        <!-- AUTOPLAY ACCESSIBLE TOGGLE (WCAG 2.2 AA) -->
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200/80 border border-gray-200 text-gray-700 transition cursor-pointer active:scale-95"
            :title="isPaused ? 'Tiếp tục tự động chuyển slide' : 'Tạm dừng tự động chuyển slide'"
            @click="toggleAutoplayPause"
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

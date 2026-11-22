<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const currentSlide = ref(0)
const isPaused = ref(false)
let timer = null

const slides = [
  {
    id: 'ecosystem',
    tabLabel: 'Apple Next Era',
    tabIcon: 'apple',
    badge: 'KỶ NGUYÊN MỚI 2025 • APPLE ECOSYSTEM',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    title: 'Chào Mừng Đến Kỷ Nguyên Mới Của Apple',
    subtitle: 'Hội tụ trọn bộ siêu phẩm công nghệ tương lai: iPhone Fold màn hình kép, iPhone Pro Max, Apple Watch Ultra & AirPods Pro chính hãng VNA.',
    gradient: 'from-slate-950 via-indigo-950 to-slate-900',
    accentBorder: 'border-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    highlights: [
      'Trợ giá thu cũ đổi mới lên đến 5.000.000₫',
      'Trả góp 0% lãi suất — Duyệt hồ sơ nhanh 15 phút',
      'Bảo hành chính hãng 1 đổi 1 trong 30 ngày',
    ],
    primaryCta: { label: 'Khám Phá Kỷ Nguyên Mới', link: '#san-pham' },
    secondaryCta: { label: 'Hotline: 0383 435 600', link: 'tel:0383435600' },
    image: '/intro/gallery/apple-ecosystem-banner.jpg',
    imageAlt: 'Apple Next Era Ecosystem',
    tagColor: 'text-indigo-400',
  },
  {
    id: 'ip17',
    tabLabel: 'iPhone 17 Pro',
    tabIcon: 'phone',
    badge: 'PHIÊN BẢN ĐỘC BẢN • COSMIC ORANGE',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: 'iPhone 17 Pro Max • Sắc Cam Vũ Trụ',
    subtitle: 'Thiết kế Titan Cấp 5 độc bản với viền siêu mỏng 1.15mm, sức mạnh chip Apple A19 Pro 3nm và cụm 3 camera 48MP Triple Fusion đồng nhất tiêu cự.',
    gradient: 'from-neutral-950 via-stone-900 to-amber-950',
    accentBorder: 'border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    highlights: [
      'Màn hình Super Retina XDR ProMotion 120Hz viền 1.15mm',
      'Ghi hình chuẩn điện ảnh không gian Spatial Video 8K',
      'Phím xúc giác sapphire zoom mượt và chụp 2 nấc chuẩn DSLR',
    ],
    primaryCta: { label: 'Chi Tiết Cosmic Orange', link: '#flagship-showcase' },
    secondaryCta: { label: 'Xem Bảng Giá', link: '#san-pham' },
    image: '/intro/gallery/ip17-floating-hand.jpg',
    imageAlt: 'iPhone 17 Pro Cosmic Orange',
    tagColor: 'text-amber-400',
  },
  {
    id: 'ip18',
    tabLabel: 'iPhone 18 Pro',
    tabIcon: 'phone',
    badge: 'THE NEXT CHAPTER BEGINS • IPHONE 18 PRO',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    title: 'iPhone 18 Pro • Khí Chất Đỏ Rượu Vang',
    subtitle: 'Kiến trúc Forged in power kết hợp cụm đảo camera liền khối, tản nhiệt buồng hơi Vapor Chamber và pin mở rộng thêm +22 giờ sử dụng.',
    gradient: 'from-gray-950 via-rose-950 to-stone-950',
    accentBorder: 'border-rose-500/30',
    glowColor: 'rgba(225, 29, 72, 0.25)',
    highlights: [
      'Tốc độ CPU Apple Silicon thế hệ mới tăng +50%',
      'GPU Ray Tracing 2.1x bứt phá mọi giới hạn đồ họa Game AAA',
      'Độ sáng màn hình cực đại 3.200 nits thách thức ánh nắng hè',
    ],
    primaryCta: { label: 'Trải Nghiệm Siêu Phẩm', link: '#flagship-showcase' },
    secondaryCta: { label: 'Đăng Ký Đặt Sớm', link: '#san-pham' },
    image: '/intro/gallery/ip18-neon-number.jpg',
    imageAlt: 'iPhone 18 Pro Deep Crimson',
    tagColor: 'text-rose-400',
  },
  {
    id: 's24u',
    tabLabel: 'Galaxy S24 Ultra',
    tabIcon: 'phone',
    badge: 'QUÁI VẬT NHIẾP ẢNH & GALAXY AI',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    title: 'Galaxy S24 Ultra • Quyền Năng Tối Thượng',
    subtitle: 'Đỉnh cao nhiếp ảnh di động với cảm biến Mắt Thần 200MP, Space Zoom 100x AI, bút S-Pen quyền lực và khung vỏ Titanium Violet sang trọng.',
    gradient: 'from-slate-950 via-purple-950 to-slate-900',
    accentBorder: 'border-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    highlights: [
      'Màn hình phẳng Dynamic AMOLED 2X 120Hz giảm 75% bóng chói',
      'Snapdragon 8 Gen 3 for Galaxy tối ưu hiệu năng chuyên sâu',
      'Khoanh tròn để tìm kiếm Circle to Search với Google tiện lợi',
    ],
    primaryCta: { label: 'Xem Giá S24 Ultra', link: '#san-pham' },
    secondaryCta: { label: 'Soi Chi Tiết 3D', link: '#flagship-showcase' },
    image: '/intro/gallery/s24-ultra-poster.jpg',
    imageAlt: 'Samsung Galaxy S24 Ultra',
    tagColor: 'text-violet-400',
  },
  {
    id: 'tradein',
    tabLabel: 'Thu Cũ Đổi Mới',
    tabIcon: 'store',
    badge: 'ĐẶC QUYỀN THU CŨ • TRỢ GIÁ 5.000.000₫',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    title: 'Năm Bước Nhảy Vọt • Lên Đời Điện Thoại Mới',
    subtitle: 'Hệ thống thẩm định máy tự động AutoGrade AI & OCR giúp bạn biết chính xác giá thu mua chỉ trong 60 giây. Thủ tục đơn giản, nhận máy mới ngay.',
    gradient: 'from-slate-950 via-slate-900 to-cyan-950',
    accentBorder: 'border-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.25)',
    highlights: [
      'Định giá minh bạch bằng AI qua 4 góc chụp và test vi mạch',
      'Trợ giá trực tiếp lên đến 5.000.000₫ trừ ngay vào giá máy mới',
      'Thu mua mọi tình trạng máy — Hỗ trợ bù chênh lệch trả góp 0%',
    ],
    primaryCta: { label: 'Định Giá Máy Cũ Ngay', link: '#flagship-showcase' },
    secondaryCta: { label: 'Bảng Giá Thu Đổi', link: '#san-pham' },
    image: '/intro/gallery/ip-leap-year.jpg',
    imageAlt: 'Trade-in Leap Year Program',
    tagColor: 'text-sky-400',
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

function startAutoplay() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (!isPaused.value) {
      nextSlide()
    }
  }, 5000)
}

function pauseAutoplay() {
  isPaused.value = true
}

function resumeAutoplay() {
  isPaused.value = false
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
      <!-- MAIN BANNER CAROUSEL CARD -->
      <div
        class="relative overflow-hidden rounded-3xl border shadow-xl transition-all duration-500"
        :class="slides[currentSlide].accentBorder"
        @mouseenter="pauseAutoplay"
        @mouseleave="resumeAutoplay"
      >
        <!-- BACKGROUND AMBIENT GLOW -->
        <div
          class="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
          :style="{ background: slides[currentSlide].glowColor }"
        />
        <div
          class="absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
          :style="{ background: slides[currentSlide].glowColor }"
        />

        <!-- SLIDE CONTENT -->
        <div
          class="relative bg-gradient-to-br text-white p-6 sm:p-8 md:p-10 transition-colors duration-700"
          :class="slides[currentSlide].gradient"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <!-- LEFT COLUMN: PROMO DETAILS -->
            <div class="lg:col-span-7 flex flex-col justify-center space-y-4">
              <!-- TOP BADGE -->
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500"
                  :class="slides[currentSlide].badgeClass"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                  <span>{{ slides[currentSlide].badge }}</span>
                </span>
                <span class="text-xs text-white/50 hidden sm:inline">
                  {{ currentSlide + 1 }} / {{ slides.length }}
                </span>
              </div>

              <!-- HEADING -->
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {{ slides[currentSlide].title }}
              </h2>

              <!-- SUBTITLE -->
              <p class="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                {{ slides[currentSlide].subtitle }}
              </p>

              <!-- HIGHLIGHT BULLETS -->
              <div class="space-y-2 pt-1">
                <div
                  v-for="(hl, idx) in slides[currentSlide].highlights"
                  :key="idx"
                  class="flex items-start gap-2 text-xs sm:text-sm text-gray-200"
                >
                  <span class="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>{{ hl }}</span>
                </div>
              </div>

              <!-- CTA BUTTONS -->
              <div class="flex flex-wrap items-center gap-3 pt-3">
                <a
                  :href="slides[currentSlide].primaryCta.link"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>{{ slides[currentSlide].primaryCta.label }}</span>
                  <span class="text-base">→</span>
                </a>

                <a
                  :href="slides[currentSlide].secondaryCta.link"
                  class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm backdrop-blur-md transition-all cursor-pointer"
                >
                  <span>{{ slides[currentSlide].secondaryCta.label }}</span>
                </a>
              </div>
            </div>

            <!-- RIGHT COLUMN: HERO BANNER IMAGE FRAME -->
            <div class="lg:col-span-5 flex justify-center items-center">
              <div class="relative group w-full max-w-md">
                <!-- IMAGE FRAME WITH GLOW -->
                <div class="relative overflow-hidden rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm shadow-2xl p-2.5">
                  <img
                    :src="slides[currentSlide].image"
                    :alt="slides[currentSlide].imageAlt"
                    class="w-full h-64 sm:h-72 md:h-80 object-contain rounded-xl transition-all duration-700 transform group-hover:scale-105"
                    loading="eager"
                  />
                  <!-- OVERLAY GRADIENT REFLECTION -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-2xl" />
                  
                  <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/80 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <span class="font-semibold">{{ slides[currentSlide].tabLabel }}</span>
                    <span class="text-[10px] text-emerald-400 font-mono">100% CHÍNH HÃNG</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ARROW CONTROLS (DESKTOP) -->
        <button
          type="button"
          class="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          title="Banner trước"
          @click="prevSlide"
        >
          ‹
        </button>
        <button
          type="button"
          class="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          title="Banner tiếp theo"
          @click="nextSlide"
        >
          ›
        </button>
      </div>

      <!-- BOTTOM TAB NAVIGATION PILLS -->
      <div class="mt-3 flex items-center justify-center sm:justify-between flex-wrap gap-2 px-1">
        <!-- TABS FOR LARGE SCREENS -->
        <div class="hidden sm:flex items-center gap-2 overflow-x-auto py-1">
          <button
            v-for="(slide, idx) in slides"
            :key="slide.id"
            type="button"
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border"
            :class="[
              currentSlide === idx
                ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-105'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            ]"
            @click="setSlide(idx)"
          >
            <span
              class="h-1.5 w-1.5 rounded-full transition-all"
              :class="currentSlide === idx ? 'bg-red-500 animate-pulse' : 'bg-gray-400'"
            />
            <span>{{ slide.tabLabel }}</span>
          </button>
        </div>

        <!-- DOTS FOR MOBILE -->
        <div class="flex sm:hidden items-center gap-1.5 py-1">
          <button
            v-for="(slide, idx) in slides"
            :key="slide.id"
            type="button"
            class="h-2 rounded-full transition-all cursor-pointer"
            :class="currentSlide === idx ? 'w-6 bg-red-600' : 'w-2 bg-gray-300'"
            @click="setSlide(idx)"
          />
        </div>

        <!-- AUTOPLAY INDICATOR / PAUSE STATUS -->
        <div class="text-[11px] text-gray-400 flex items-center gap-1.5">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Tự động chuyển mỗi 5s</span>
        </div>
      </div>
    </div>
  </section>
</template>

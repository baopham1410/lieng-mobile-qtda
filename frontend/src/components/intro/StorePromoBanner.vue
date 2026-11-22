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
    gradient: 'from-[#8B0000] via-[#B91C1C] to-[#450A0A]',
    glowColor: 'rgba(239, 68, 68, 0.4)',
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
    image: '/hero/hero-promo.png',
    imageAlt: 'iPhone 16 Pro Max Chính Hãng VN/A',
    isFullGraphic: true,
  },
  {
    id: 's24ultra',
    tabLabel: 'Galaxy S24 Ultra',
    badge: 'GALAXY AI IS HERE • CHÍNH HÃNG SAMSUNG',
    badgeClass: 'bg-white/20 text-white border-white/30',
    title: 'Galaxy S24 Ultra 5G',
    slogan: 'Quyền Năng Mắt Thần & Trí Tuệ Nhân Tạo',
    description: 'Trải nghiệm đỉnh cao công nghệ với vi xử lý Snapdragon 8 Gen 3 for Galaxy, màn hình phẳng Dynamic AMOLED 2X chống chói 75%, camera Mắt Thần 200MP và bút S-Pen quyền năng tích hợp.',
    gradient: 'from-[#0F2042] via-[#1E3A8A] to-[#172554]',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    specs: [
      { label: 'Snapdragon 8 Gen 3', desc: 'Tối ưu đồ họa ray tracing' },
      { label: 'Mắt Thần 200MP', desc: 'Space Zoom 100x AI' },
      { label: 'Bút S-Pen Quyền Năng', desc: 'Khoanh tròn tìm kiếm' },
    ],
    highlights: [
      'Tặng gói bảo hành toàn diện Samsung Care+ trị giá 2.000.000₫',
      'Tặng thêm Voucher 1.000.000₫ khi mua kèm tai nghe Galaxy Buds',
      'Thu cũ đổi mới trợ giá thêm đến 3.000.000₫ trừ ngay vào giá máy',
    ],
    primaryCta: { label: 'Sở hữu ngay', link: '#san-pham' },
    secondaryCta: { label: 'Xem thông số', link: '#san-pham' },
    image: '/hero/hero-samsung.jpg',
    imageAlt: 'Samsung Galaxy S24 Ultra Chính Hãng',
    isFullGraphic: false,
  },
  {
    id: 'tradein',
    tabLabel: 'Thu Cũ Đổi Mới',
    badge: 'ĐẶC QUYỀN THU CŨ • TRỢ GIÁ 5.000.000₫',
    badgeClass: 'bg-white/20 text-white border-white/30',
    title: 'Thu Cũ Đổi Mới — Lên Đời Siêu Phẩm',
    slogan: 'Định Giá Tự Động Minh Bạch Trong 60 Giây',
    description: 'Hệ thống thẩm định AutoGrade AI & OCR phân tích ngoại quan và linh kiện chính xác. Cam kết thu mua mọi tình trạng máy — Hỗ trợ trả góp 0% cho toàn bộ khoản chênh lệch.',
    gradient: 'from-[#064E3B] via-[#047857] to-[#022C22]',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    specs: [
      { label: 'AutoGrade AI 4 Góc', desc: 'Định giá chính xác 60s' },
      { label: 'Trợ Giá 5.000.000₫', desc: 'Trừ thẳng vào máy mới' },
      { label: 'Thu Mọi Tình Trạng', desc: 'Cấn móp, chai pin nhận hết' },
    ],
    highlights: [
      'Không cần bù tiền ngay — Hỗ trợ trả góp 0% khoản chênh lệch',
      'Nhận máy mới dùng ngay — Hỗ trợ chuyển sao lưu dữ liệu miễn phí',
      'Áp dụng cho mọi dòng iPhone, Samsung, Xiaomi, iPad cũ',
    ],
    primaryCta: { label: 'Định giá máy ngay', link: '#san-pham' },
    secondaryCta: { label: 'Bảng giá thu đổi', link: '#san-pham' },
    image: '/hero/iphone-15-pro-max.jpg',
    imageAlt: 'Chương trình Thu cũ đổi mới Liêng Mobile',
    isFullGraphic: false,
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
        class="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-xl transition-all duration-500"
        @mouseenter="isPaused = true"
        @mouseleave="isPaused = false"
      >
        <!-- AMBIENT GLOW EFFECT -->
        <div
          class="absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
          :style="{ background: slides[currentSlide].glowColor }"
        />
        <div
          class="absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
          :style="{ background: slides[currentSlide].glowColor }"
        />

        <!-- BANNER SLIDE CONTENT -->
        <div
          class="relative bg-gradient-to-r text-white p-6 sm:p-8 lg:p-10 transition-colors duration-700 min-h-[380px] lg:min-h-[420px] flex flex-col justify-between"
          :class="slides[currentSlide].gradient"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            <!-- LEFT PROMO CONTENT -->
            <div class="lg:col-span-7 flex flex-col justify-center space-y-3.5 z-10">
              
              <!-- TOP BADGE -->
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-xs"
                  :class="slides[currentSlide].badgeClass"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  <span>{{ slides[currentSlide].badge }}</span>
                </span>
              </div>

              <!-- MAIN HEADLINE -->
              <div>
                <h2 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
                  {{ slides[currentSlide].title }}
                </h2>
                <p class="text-xs sm:text-sm font-semibold tracking-wide text-white/90 mt-1 uppercase">
                  {{ slides[currentSlide].slogan }}
                </p>
              </div>

              <!-- SHORT PROMO DESCRIPTION -->
              <p class="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl font-normal line-clamp-2 sm:line-clamp-none">
                {{ slides[currentSlide].description }}
              </p>

              <!-- 3 KEY SPEC CHIPS (CHIP, CAMERA, VỎ MÁY) -->
              <div class="grid grid-cols-3 gap-2 pt-1 max-w-lg">
                <div
                  v-for="(spec, sIdx) in slides[currentSlide].specs"
                  :key="sIdx"
                  class="rounded-xl bg-white/10 border border-white/15 p-2 sm:p-2.5 backdrop-blur-sm"
                >
                  <p class="text-[11px] sm:text-xs font-bold text-white truncate">{{ spec.label }}</p>
                  <p class="text-[10px] text-white/70 truncate mt-0.5">{{ spec.desc }}</p>
                </div>
              </div>

              <!-- HIGHLIGHT BULLETS -->
              <div class="space-y-1.5 pt-1">
                <div
                  v-for="(hl, hIdx) in slides[currentSlide].highlights"
                  :key="hIdx"
                  class="flex items-center gap-2 text-xs sm:text-sm text-white/95"
                >
                  <svg class="w-4 h-4 text-amber-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span class="truncate sm:whitespace-normal">{{ hl }}</span>
                </div>
              </div>

              <!-- CALL TO ACTION BUTTONS -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <a
                  :href="slides[currentSlide].primaryCta.link"
                  class="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>{{ slides[currentSlide].primaryCta.label }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>

                <a
                  :href="slides[currentSlide].secondaryCta.link"
                  class="inline-flex items-center gap-1.5 px-5 py-2.5 sm:py-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/25 text-white font-semibold text-xs sm:text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{{ slides[currentSlide].secondaryCta.label }}</span>
                </a>
              </div>
            </div>

            <!-- RIGHT PROMO HERO IMAGE (AUTHENTIC RETAIL SHOWCASE) -->
            <div class="lg:col-span-5 flex justify-center items-center z-10">
              <div class="relative w-full max-w-sm sm:max-w-md flex items-center justify-center p-2">
                <!-- If full marketing graphic (Slide 1: iPhone 16) -->
                <div v-if="slides[currentSlide].isFullGraphic" class="relative w-full flex items-center justify-center">
                  <div class="absolute inset-0 bg-white/10 rounded-full blur-2xl transform scale-75" />
                  <img
                    :src="slides[currentSlide].image"
                    :alt="slides[currentSlide].imageAlt"
                    class="relative z-10 w-full h-56 sm:h-64 md:h-72 lg:h-80 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
                    loading="eager"
                  />
                </div>

                <!-- If product cutout on white card (Slide 2: Samsung S24, Slide 3: Trade-in iPhone 15) -->
                <div
                  v-else
                  class="relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/30 transition-transform duration-500 hover:scale-[1.02] max-w-[280px] sm:max-w-[310px] w-full"
                >
                  <img
                    :src="slides[currentSlide].image"
                    :alt="slides[currentSlide].imageAlt"
                    class="w-full h-48 sm:h-56 md:h-60 object-contain"
                    loading="eager"
                  />
                  <div class="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-[11px] font-bold">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Chính hãng • Bảo hành 12T</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- BOTTOM CONTROLS BAR: DOTS & ARROWS -->
          <div class="flex items-center justify-between pt-4 border-t border-white/15 mt-4 z-10">
            <!-- DOTS INDICATORS -->
            <div class="flex items-center gap-2">
              <button
                v-for="(slide, idx) in slides"
                :key="`dot-${slide.id}`"
                type="button"
                class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                :class="currentSlide === idx ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'"
                :aria-label="`Chuyển đến slide ${idx + 1}`"
                @click="setSlide(idx)"
              />
            </div>

            <!-- COUNTER & PREV/NEXT ARROWS -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-medium text-white/80 mr-1">
                0{{ currentSlide + 1 }} / 0{{ slides.length }}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer active:scale-90"
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
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer active:scale-90"
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

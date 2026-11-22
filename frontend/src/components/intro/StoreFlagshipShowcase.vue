<script setup>
import { ref } from 'vue'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'
import { storeInfo } from '@/data/storeIntro'

// Active tab in the Spotlight Section
const activeSpotlight = ref('ip17')

const spotlights = [
  {
    id: 'ip17',
    tag: 'CONCEPT ĐỘT PHÁ 2025',
    title: 'iPhone 17 Pro • Cosmic Orange',
    badgeColor: 'from-amber-500 to-orange-600',
    accentBorder: 'border-amber-500/40',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    subtitle: 'Màu Titan Cam Vũ Trụ độc bản. Bàn tay nâng đỡ công nghệ tương lai với cụm 3 camera 48MP Triple Fusion đồng nhất tiêu cự.',
    heroImg: '/intro/gallery/ip17-floating-hand.jpg',
    secondaryImg: '/intro/gallery/ip17-duo-render.jpg',
    specs: [
      { label: 'Camera Triple Fusion', val: '48MP x 3' },
      { label: 'Viền màn hình', val: '1.15 mm' },
      { label: 'Chip xử lý', val: 'A19 Pro 3nm' },
      { label: 'Khối lượng siêu nhẹ', val: '233 gram' },
    ],
    features: [
      'Ghi hình chuẩn điện ảnh 8K 60fps ProRes RAW',
      'Phím xúc giác phủ đá sapphire điều khiển tiêu cự linh hoạt',
      'Khung vỏ Titan Cấp 5 gia công phay CNC vi mô',
    ],
    ctaText: 'Đặt trước Cosmic Orange',
    ctaLink: '#san-pham',
  },
  {
    id: 'ip18',
    tag: 'SIÊU PHẨM THẾ HỆ KẾ TIẾP',
    title: 'iPhone 18 Pro Max • Deep Crimson',
    badgeColor: 'from-rose-600 to-red-700',
    accentBorder: 'border-rose-500/40',
    glowColor: 'rgba(225, 29, 72, 0.25)',
    subtitle: 'Forged in power. Sắc Đỏ Rượu vang sang trọng kết hợp kiến trúc đảo camera liền khối và vi xử lý Apple Silicon thế hệ mới.',
    heroImg: '/intro/gallery/ip18-crimson-pedestal.jpg',
    secondaryImg: '/intro/gallery/ip18-pro-stats.jpg',
    specs: [
      { label: 'Thời lượng xem video', val: '+22 Giờ' },
      { label: 'Tốc độ CPU', val: '+50% Nhanh' },
      { label: 'GPU Ray Tracing', val: '2.1x Game AAA' },
      { label: 'Tản nhiệt buồng hơi', val: 'Vapor Chamber' },
    ],
    features: [
      'Kiến trúc Neural Engine 32 nhân tối ưu hóa Apple Intelligence',
      'Độ sáng cực đại ngoài trời 3.200 nits chống chói tối ưu',
      'Pin dung lượng mở rộng đáp ứng trọn vẹn 2 ngày sử dụng',
    ],
    ctaText: 'Đăng ký suất sở hữu sớm',
    ctaLink: '#san-pham',
  },
  {
    id: 's24u',
    tag: 'QUÁI VẬT NHIẾP ẢNH & GALAXY AI',
    title: 'Galaxy S24 Ultra • Titanium Violet',
    badgeColor: 'from-violet-600 to-blue-600',
    accentBorder: 'border-violet-500/40',
    glowColor: 'rgba(124, 58, 237, 0.25)',
    subtitle: 'Quyền năng tối thượng từ Snapdragon 8 Gen 3 for Galaxy, cảm biến nhiếp ảnh 200MP và bút S-Pen quyền lực ẩn mình.',
    heroImg: '/intro/gallery/s24-ultra-poster.jpg',
    secondaryImg: '/intro/gallery/ip-leap-year.jpg',
    specs: [
      { label: 'Camera Mắt Thần', val: '200 MP' },
      { label: 'Space Zoom đa tầng', val: '100x AI' },
      { label: 'Màn hình phẳng', val: '6.8" 120Hz' },
      { label: 'Bút S-Pen', val: '2.8ms Latency' },
    ],
    features: [
      'Kính cường lực Corning Gorilla Armor giảm 75% phản xạ chói',
      'Khoanh tròn để tìm kiếm Circle to Search với Google',
      'Khung titan cứng cáp kháng nước bụi chuẩn quân đội IP68',
    ],
    ctaText: 'Xem giá Galaxy S24 Ultra',
    ctaLink: '#san-pham',
  },
]

// Interactive Hotspot popup state for the detail preview
const activeHotspotId = ref(null)
const hotspots17 = [
  { id: 'screen', x: '52%', y: '26%', title: 'Màn hình Super Retina XDR', desc: 'Tấm nền OLED 120Hz ProMotion viền siêu mỏng 1.15mm, kính Ceramic Shield thế hệ mới chống trầy 4x.' },
  { id: 'cam', x: '66%', y: '18%', title: 'Cụm 3 Camera 48MP Triple Fusion', desc: 'Hệ thống 3 ống kính đồng nhất độ phân giải 48MP hỗ trợ quay video không gian Spatial Video 3D.' },
  { id: 'chip', x: '45%', y: '58%', title: 'Chip Apple A19 Pro 3nm', desc: 'Tiến trình N3P thế hệ mới tiết kiệm 35% điện năng, Neural Engine tăng tốc xử lý AI trên thiết bị.' },
  { id: 'frame', x: '35%', y: '40%', title: 'Khung Titan Cấp Hàng Không', desc: 'Hợp kim Titan Grade 5 siêu nhẹ bền chắc, giảm tổng trọng lượng máy xuống chỉ còn 233 gram.' },
]

function toggleHotspot(id) {
  activeHotspotId.value = activeHotspotId.value === id ? null : id
}
</script>

<template>
  <div class="relative w-full overflow-hidden bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10">
    <!-- SUBTLE BACKGROUND AMBIENT GLOWS -->
    <div class="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"></div>
    <div class="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl"></div>

    <div class="relative mx-auto max-w-7xl">
      <!-- HEADER TITLE -->
      <div class="text-center max-w-3xl mx-auto mb-12">
        <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-cyan-300 backdrop-blur-md mb-4 shadow-lg">
          <StoreDeviceIcon name="fire" size-class="h-3.5 w-3.5 text-cyan-400" />
          <span>BỘ SƯU TẬP SIÊU PHẨM • FLAGSHIP GALLERY</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Khám Phá Kỷ Nguyên <span class="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">Đỉnh Cao Công Nghệ</span>
        </h2>
        <p class="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-light">
          Tuyển chọn những thiết kế mang tính biểu tượng thế giới di động. Trải nghiệm trực quan từ phối màu Titan Cam Vũ Trụ, Đỏ Rượu Vang sang trọng đến quái vật nhiếp ảnh Galaxy Ultra.
        </p>

        <!-- SPOTLIGHT SWITCHER TABS -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-2xl mx-auto">
          <button
            v-for="sp in spotlights"
            :key="sp.id"
            type="button"
            class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
            :class="
              activeSpotlight === sp.id
                ? 'bg-white text-gray-950 shadow-xl scale-102 font-extrabold'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            "
            @click="activeSpotlight = sp.id"
          >
            <span>{{ sp.title.split('•')[0].trim() }}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full" :class="activeSpotlight === sp.id ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white/60'">
              {{ sp.title.split('•')[1]?.trim() }}
            </span>
          </button>
        </div>
      </div>

      <!-- MAIN SPOTLIGHT INTERACTIVE STAGE -->
      <div
        v-for="sp in spotlights"
        v-show="activeSpotlight === sp.id"
        :key="sp.id"
        class="rounded-3xl border backdrop-blur-2xl p-6 sm:p-10 lg:p-12 transition-all duration-500 relative overflow-hidden shadow-2xl mb-16"
        :class="sp.accentBorder"
        :style="{ backgroundColor: 'rgba(15, 23, 42, 0.75)', boxShadow: `0 20px 60px ${sp.glowColor}` }"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <!-- LEFT COLUMN: VISUAL ARTWORK (IMAGE CAROUSEL & HOTSPOTS) -->
          <div class="lg:col-span-7 relative">
            <div class="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl group">
              <!-- PRIMARY HERO IMAGE -->
              <img
                :src="sp.heroImg"
                :alt="sp.title"
                class="w-full h-[380px] sm:h-[480px] lg:h-[540px] object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              <!-- GRADIENT OVERLAYS -->
              <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80 pointer-events-none"></div>

              <!-- TAG BADGE OVERLAY -->
              <div class="absolute top-4 left-4 z-10">
                <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase text-white shadow-lg bg-gradient-to-r" :class="sp.badgeColor">
                  <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  {{ sp.tag }}
                </span>
              </div>

              <!-- IF IP17: INTERACTIVE RADAR HOTSPOTS OVERLAY -->
              <div v-if="sp.id === 'ip17'" class="absolute inset-0 pointer-events-auto">
                <div
                  v-for="hs in hotspots17"
                  :key="hs.id"
                  class="absolute z-20"
                  :style="{ left: hs.x, top: hs.y }"
                >
                  <button
                    type="button"
                    class="relative flex h-8 w-8 items-center justify-center rounded-full bg-black/80 border-2 border-amber-400 text-white font-bold text-sm shadow-xl transition-transform hover:scale-125 cursor-pointer"
                    :title="hs.title"
                    @click.stop="toggleHotspot(hs.id)"
                  >
                    <span class="absolute -inset-1 rounded-full bg-amber-400 opacity-60 animate-ping"></span>
                    <span>+</span>
                  </button>

                  <!-- HOTSPOT POPUP TOOLTIP -->
                  <div
                    v-if="activeHotspotId === hs.id"
                    class="absolute left-10 -top-8 w-64 rounded-xl bg-black/95 border border-amber-400/60 p-3.5 shadow-2xl backdrop-blur-xl z-30 animate-in fade-in slide-in-from-left-2"
                  >
                    <div class="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>{{ hs.title }}</span>
                      <button type="button" class="text-white/60 hover:text-white" @click.stop="activeHotspotId = null">✕</button>
                    </div>
                    <p class="mt-1.5 text-xs text-gray-300 leading-relaxed font-light">
                      {{ hs.desc }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- SECONDARY THUMBNAIL PREVIEW CORNER -->
              <div class="absolute bottom-4 right-4 z-10 w-28 sm:w-36 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black/70 backdrop-blur-md">
                <img :src="sp.secondaryImg" :alt="sp.title" class="w-full h-20 sm:h-24 object-cover object-center" />
                <div class="p-1 text-[10px] text-center font-bold text-white/80 uppercase">Cận Cảnh 3D</div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: PRODUCT SPECIFICATIONS & CTAs -->
          <div class="lg:col-span-5 flex flex-col justify-center">
            <span class="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Liêng Mobile Flagship Spotlight
            </span>
            <h3 class="mt-2 text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {{ sp.title }}
            </h3>
            <p class="mt-3 text-sm sm:text-base text-gray-300 font-light leading-relaxed">
              {{ sp.subtitle }}
            </p>

            <!-- 4 KEY SPEC METRIC BOXES -->
            <div class="mt-6 grid grid-cols-2 gap-3">
              <div
                v-for="spec in sp.specs"
                :key="spec.label"
                class="rounded-xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-md hover:border-white/25 transition"
              >
                <div class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                  {{ spec.label }}
                </div>
                <div class="mt-1 text-lg sm:text-xl font-extrabold text-white">
                  {{ spec.val }}
                </div>
              </div>
            </div>

            <!-- KEY BULLET HIGHLIGHTS -->
            <ul class="mt-6 space-y-2.5 text-xs sm:text-sm text-gray-300">
              <li v-for="feat in sp.features" :key="feat" class="flex items-start gap-2.5">
                <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">✓</span>
                <span>{{ feat }}</span>
              </li>
            </ul>

            <!-- ACTION BUTTONS -->
            <div class="mt-8 flex flex-wrap items-center gap-3">
              <a
                :href="sp.ctaLink"
                class="rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-gray-100 hover:scale-105 shadow-xl hover:shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>{{ sp.ctaText }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a
                :href="`tel:${storeInfo.hotline}`"
                class="rounded-xl border border-white/20 backdrop-blur-md bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 cursor-pointer flex items-center gap-2"
              >
                <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-cyan-400" />
                <span>Gọi {{ storeInfo.hotlineDisplay }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: TRADE-IN LEAP YEAR BANNER & AUTOGRADE AI -->
      <div class="mb-16 rounded-3xl overflow-hidden border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 sm:p-10 shadow-2xl relative">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div class="lg:col-span-5 order-2 lg:order-1">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
              CHƯƠNG TRÌNH THU CŨ ĐỔI MỚI • TRADE-IN
            </span>
            <h3 class="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Năm Bước Nhảy Vọt <br />
              <span class="text-cyan-400">Lên Đời Siêu Phẩm</span>
            </h3>
            <p class="mt-3 text-sm text-gray-300 font-light leading-relaxed">
              Trợ giá thu cũ đổi mới lên đến <strong>5.000.000₫</strong>. Định giá công bằng tức thì bằng hệ thống <strong>AutoGrade AI (YOLOv8 + OCR)</strong> không lo ép giá.
            </p>

            <div class="mt-5 flex flex-wrap gap-4 text-xs font-medium text-white/90">
              <div class="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <span class="text-cyan-400 font-bold">✓</span> Trả góp 0% chỉ từ 990.000₫/tháng
              </div>
              <div class="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <span class="text-cyan-400 font-bold">✓</span> Nhận máy ngay sau 5 phút
              </div>
            </div>

            <div class="mt-7 flex items-center gap-3">
              <a
                href="#dich-vu"
                class="rounded-xl bg-cyan-400 hover:bg-cyan-300 px-6 py-3 text-sm font-bold text-gray-950 transition shadow-lg hover:shadow-cyan-400/30 cursor-pointer flex items-center gap-2"
              >
                <span>Định giá máy cũ ngay</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>

          <div class="lg:col-span-7 order-1 lg:order-2 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src="/intro/gallery/ip-leap-year.jpg"
              alt="iPhone Leap Year Trade-in"
              class="w-full h-[260px] sm:h-[320px] object-cover object-center hover:scale-102 transition duration-500"
            />
          </div>
        </div>
      </div>

      <!-- SECTION 3: WELCOME TO APPLE'S NEXT ERA ECOSYSTEM BANNER -->
      <div class="rounded-3xl overflow-hidden border border-white/15 bg-white text-gray-950 p-6 sm:p-10 shadow-2xl relative">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div class="lg:col-span-7 relative rounded-2xl overflow-hidden border border-gray-200 shadow-md">
            <img
              src="/intro/gallery/apple-ecosystem-banner.jpg"
              alt="Apple Next Era Ecosystem"
              class="w-full h-[300px] sm:h-[380px] object-cover object-center"
            />
          </div>

          <div class="lg:col-span-5 flex flex-col justify-center">
            <div class="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.18c.67-.82 1.13-1.96 1.01-3.11-.97.04-2.15.65-2.85 1.47-.61.71-1.14 1.87-1 2.99 1.09.08 2.17-.53 2.84-1.35z"/>
              </svg>
              <span>Trọn Bộ Hệ Sinh Thái Chính Hãng</span>
            </div>

            <h3 class="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
              Welcome To Apple’s Next Era
            </h3>
            <p class="mt-3 text-sm text-gray-600 leading-relaxed font-light">
              Từ điện thoại màn hình gập đột phá, iPhone Pro Max, tai nghe AirPods Pro đến Apple Watch Ultra. Trải nghiệm liền mạch không độ trễ, đồng bộ hóa dữ liệu thông minh trong một chạm.
            </p>

            <div class="mt-5 space-y-2 text-xs text-gray-700 font-medium">
              <div class="flex items-center gap-2">
                <span class="text-emerald-600 font-bold">✓</span> Máy mới 100% nguyên seal VNA & Quốc tế chính hãng
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-600 font-bold">✓</span> Bảo hành đổi mới trong 30 ngày nếu có lỗi kỹ thuật
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-600 font-bold">✓</span> Giao hàng hỏa tốc trong 1 giờ tại TP. Hồ Chí Minh
              </div>
            </div>

            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#san-pham"
                class="rounded-xl bg-gray-950 hover:bg-gray-800 px-6 py-3 text-sm font-bold text-white transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                <span>Xem Toàn Bộ Bảng Giá</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a
                :href="`tel:${storeInfo.hotline}`"
                class="rounded-xl border border-gray-300 bg-gray-100 hover:bg-gray-200 px-5 py-3 text-sm font-bold text-gray-900 transition cursor-pointer flex items-center gap-2"
              >
                <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-rose-600" />
                <span>Hotline: {{ storeInfo.hotlineDisplay }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

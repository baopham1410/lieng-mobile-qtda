<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForUser } from '@/utils/roleRedirect'
import { storeInfo } from '@/data/storeIntro'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

defineProps({
  searchQuery: { type: String, default: '' },
  cartCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:searchQuery', 'open-cart'])

const auth = useAuthStore()
const menuOpen = ref(false)

const navLinks = [
  { label: 'Cửa Hàng', href: '#san-pham' },
  { label: 'iPhone', href: '#san-pham' },
  { label: 'Samsung', href: '#san-pham' },
  { label: 'iPad & Mac', href: '#san-pham' },
  { label: 'Phụ Kiện', href: '#san-pham' },
  { label: 'Dịch Vụ', href: '#dich-vu' },
  { label: 'Hệ Thống', href: '#cua-hang' },
]

function closeMenu() {
  menuOpen.value = false
}

const staffHome = () => getDefaultRouteForUser(auth.user)
</script>

<template>
  <div id="top" class="sticky top-0 z-50 shadow-sm">
    <!-- Top Bar: Màu đỏ cờ truyền thống như lúc ban đầu -->
    <div class="bg-red-600 text-white text-xs py-2 px-4 transition-all">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p class="text-center w-full sm:w-auto font-medium flex items-center justify-center sm:justify-start gap-1.5">
          <StoreDeviceIcon name="fire" size-class="h-4 w-4 text-amber-300 shrink-0" />
          <span>Thu cũ đổi mới trợ giá đến 2.000.000đ — Trả góp 0% thủ tục 5 phút.</span>
          <a href="#san-pham" class="text-amber-200 hover:text-white underline ml-1 font-semibold inline-flex items-center">
            Xem ngay <span class="text-[10px] ml-0.5">›</span>
          </a>
        </p>

        <div class="hidden sm:flex items-center gap-4 text-xs font-medium text-white/90">
          <span class="inline-flex items-center gap-1.5">
            <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-amber-200" />
            <span>Hotline: <strong class="text-white font-bold">{{ storeInfo.hotlineDisplay }}</strong></span>
          </span>
          <span class="text-white/40">|</span>
          <RouterLink
            v-if="auth.isAuthenticated"
            :to="staffHome()"
            class="text-amber-200 hover:text-white underline font-semibold"
          >
            Quản trị viên
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="hover:text-amber-200 transition"
          >
            Khu vực nhân viên
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar: Trắng sáng, logo đỏ đô #7A0C10, hover đỏ -->
    <header class="bg-white/95 backdrop-blur-xl border-b border-red-100 transition-all">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-[56px]">
        <!-- Brand Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 group" @click="closeMenu">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7A0C10] text-white text-sm font-black shadow-md shadow-red-900/20 group-hover:bg-red-600 group-hover:scale-105 transition-all">
            L
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
              {{ storeInfo.name }}
            </span>
            <span class="text-[10px] text-slate-400 font-medium hidden sm:block leading-none -mt-0.5">
              Chính hãng • Giá tốt
            </span>
          </div>
        </RouterLink>

        <!-- Desktop Menu Links -->
        <nav class="hidden md:flex items-center gap-6 text-[13px] font-semibold tracking-tight text-slate-700">
          <a
            v-for="link in navLinks"
            :key="link.label"
            :href="link.href"
            class="transition-colors hover:text-red-600"
          >
            {{ link.label }}
          </a>
        </nav>

        <!-- Right Action Icons (Search, Bag, Hotline Button) -->
        <div class="flex items-center gap-3">
          <!-- Minimalist Search Input -->
          <div class="relative hidden sm:block">
            <input
              :value="searchQuery"
              type="search"
              placeholder="Tìm iPhone, Samsung..."
              class="w-36 md:w-52 rounded-full bg-slate-100 py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 transition-all focus:w-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 border border-transparent"
              @input="emit('update:searchQuery', $event.target.value)"
            />
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <StoreDeviceIcon name="search" size-class="h-3.5 w-3.5" />
            </span>
          </div>

          <!-- Bag Icon with Red Counter -->
          <button
            type="button"
            class="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            aria-label="Túi hàng"
            @click="emit('open-cart')"
          >
            <StoreDeviceIcon name="bag" size-class="h-5 w-5" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-md shadow-red-500/30"
            >
              {{ cartCount }}
            </span>
          </button>

          <!-- Call CTA Button with Phone Icon -->
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-red-600/30 transition hover:bg-red-700 active:scale-95"
          >
            <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-white" />
            <span>Gọi ngay</span>
          </a>

          <!-- Mobile Hamburger Menu Button -->
          <button
            type="button"
            class="p-1.5 text-slate-700 md:hidden hover:text-red-600"
            aria-label="Menu"
            @click="menuOpen = !menuOpen"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown -->
      <div v-if="menuOpen" class="border-t border-red-100 bg-white px-5 py-4 md:hidden">
        <div class="relative mb-3">
          <input
            :value="searchQuery"
            type="search"
            placeholder="Tìm sản phẩm, phụ kiện..."
            class="w-full rounded-xl bg-slate-100 border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white"
            @input="emit('update:searchQuery', $event.target.value)"
          />
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <StoreDeviceIcon name="search" size-class="h-3.5 w-3.5" />
          </span>
        </div>
        <nav class="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
          <a
            v-for="link in navLinks"
            :key="link.label"
            :href="link.href"
            class="py-2 border-b border-slate-100 hover:text-red-600 transition"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="mt-2 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-center text-xs font-bold text-white shadow-sm"
          >
            <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-white" />
            <span>Gọi hotline: {{ storeInfo.hotlineDisplay }}</span>
          </a>
        </nav>
      </div>
    </header>
  </div>
</template>

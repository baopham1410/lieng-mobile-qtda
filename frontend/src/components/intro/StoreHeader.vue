<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForUser } from '@/utils/roleRedirect'
import { storeInfo, navLinks } from '@/data/storeIntro'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

defineProps({
  searchQuery: { type: String, default: '' },
  cartCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:searchQuery', 'open-cart'])

const auth = useAuthStore()
const menuOpen = ref(false)

function closeMenu() {
  menuOpen.value = false
}

const staffHome = () => getDefaultRouteForUser(auth.user)
</script>

<template>
  <div id="top" class="sticky top-0 z-50">
    <!-- Top Bar: Đỏ Ruby thương hiệu với chiều sâu sang trọng -->
    <div class="bg-gradient-to-r from-red-700 via-rose-600 to-red-700 border-b border-red-500/30 text-white shadow-md">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:text-sm">
        <p class="font-medium flex items-center gap-1.5">
          <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-white" />
          <span>Hotline:</span>
          <a :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`" class="underline-offset-2 hover:underline font-bold text-white">
            {{ storeInfo.hotlineDisplay }}
          </a>
          <span class="mx-2 hidden sm:inline text-white/50">|</span>
          <span class="hidden sm:inline text-white/90">{{ storeInfo.hours }}</span>
        </p>
        <p class="hidden md:block text-white/90 font-light">
          Miễn phí giao hàng nội thành — Bảo hành chính hãng — Thu cũ đổi mới
        </p>
        <RouterLink
          v-if="auth.isAuthenticated"
          :to="staffHome()"
          class="font-medium underline-offset-2 hover:underline text-white"
        >
          Quay lại quản lý
        </RouterLink>
        <RouterLink v-else to="/login" class="font-medium underline-offset-2 hover:underline text-white">
          Khu vực nhân viên
        </RouterLink>
      </div>
    </div>

    <!-- Header Dark-Glassmorphism kết hợp Đỏ Ruby thương hiệu -->
    <header class="border-b border-white/10 bg-[#09090b]/90 backdrop-blur-xl text-white shadow-2xl transition-all">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <!-- Brand Logo -->
        <RouterLink to="/" class="flex items-center gap-3" @click="closeMenu">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-500 text-lg font-bold text-white shadow-lg shadow-red-600/30 ring-1 ring-white/20"
          >
            L
          </div>
          <div>
            <p class="text-lg font-bold leading-tight text-white tracking-tight">{{ storeInfo.name }}</p>
            <p class="text-xs text-gray-400 font-light">{{ storeInfo.tagline }}</p>
          </div>
        </RouterLink>

        <!-- Navigation Links -->
        <nav class="hidden items-center gap-6 lg:flex">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="text-sm font-medium text-gray-300 transition hover:text-red-400"
          >
            {{ link.label }}
          </a>
        </nav>

        <!-- Search, Cart & Call Button -->
        <div class="hidden items-center gap-3 md:flex">
          <div class="relative">
            <input
              :value="searchQuery"
              type="search"
              placeholder="Tìm iPhone, Samsung, phụ kiện..."
              class="w-56 rounded-full border border-white/15 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-400 backdrop-blur-md focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 xl:w-72 transition"
              @input="emit('update:searchQuery', $event.target.value)"
            />
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <StoreDeviceIcon name="search" size-class="h-4 w-4" />
            </span>
          </div>

          <!-- Cart Button -->
          <button
            type="button"
            class="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-300 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
            aria-label="Giỏ hàng"
            @click="emit('open-cart')"
          >
            <StoreDeviceIcon name="bag" size-class="h-5 w-5" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-1 text-[10px] font-bold text-white shadow-md shadow-red-600/40"
            >
              {{ cartCount > 9 ? '9+' : cartCount }}
            </span>
          </button>

          <!-- Call CTA Button -->
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer"
          >
            <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-white" />
            <span>Gọi ngay</span>
          </a>
        </div>

        <!-- Mobile Controls -->
        <div class="flex items-center gap-2 md:hidden">
          <button
            type="button"
            class="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gray-200"
            aria-label="Giỏ hàng"
            @click="emit('open-cart')"
          >
            <StoreDeviceIcon name="bag" size-class="h-5 w-5" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm"
            >
              {{ cartCount }}
            </span>
          </button>
          <button
            type="button"
            class="rounded-lg border border-white/15 bg-white/5 p-2 text-gray-200 lg:hidden"
            aria-label="Mở menu"
            @click="menuOpen = !menuOpen"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown -->
      <div v-if="menuOpen" class="border-t border-white/10 bg-[#0e0f14]/95 backdrop-blur-xl px-4 py-4 lg:hidden">
        <div class="relative mb-3">
          <input
            :value="searchQuery"
            type="search"
            placeholder="Tìm sản phẩm..."
            class="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
            @input="emit('update:searchQuery', $event.target.value)"
          />
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <StoreDeviceIcon name="search" size-class="h-4 w-4" />
          </span>
        </div>
        <nav class="flex flex-col gap-3">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 hover:text-red-400 transition"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-red-600/30"
          >
            <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-white" />
            <span>Gọi {{ storeInfo.hotlineDisplay }}</span>
          </a>
        </nav>
      </div>
    </header>
  </div>
</template>

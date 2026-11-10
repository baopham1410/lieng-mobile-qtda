<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForUser } from '@/utils/roleRedirect'
import { storeInfo } from '@/data/storeIntro'

defineProps({
  searchQuery: { type: String, default: '' },
  cartCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:searchQuery', 'open-cart'])

const auth = useAuthStore()
const menuOpen = ref(false)

const appleNavLinks = [
  { label: 'Cửa Hàng', href: '#san-pham' },
  { label: 'iPhone', href: '#san-pham', cat: 'phone' },
  { label: 'iPad & Tablet', href: '#san-pham', cat: 'tablet' },
  { label: 'Mac & Laptop', href: '#san-pham', cat: 'laptop' },
  { label: 'Đồng Hồ', href: '#san-pham', cat: 'watch' },
  { label: 'Phụ Kiện', href: '#san-pham', cat: 'accessory' },
  { label: 'Dịch Vụ', href: '#dich-vu' },
  { label: 'Cửa Hàng', href: '#cua-hang' },
]

function closeMenu() {
  menuOpen.value = false
}

const staffHome = () => getDefaultRouteForUser(auth.user)
</script>

<template>
  <div id="top" class="sticky top-0 z-50">
    <!-- Apple-style Top Notice Ribbon with Red Accent -->
    <div class="bg-[#FBFBFC] text-[#1D1D1F] border-b border-black/[0.06] text-[12px] py-2 px-4 transition-all">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p class="text-center w-full sm:w-auto font-normal text-[#1D1D1F]/80">
          Thu cũ đổi mới trợ giá đến 2.000.000đ. Trả góp 0% duyệt 5 phút.
          <a href="#san-pham" class="text-red-600 hover:text-red-700 hover:underline ml-1 font-semibold inline-flex items-center">
            Tìm hiểu thêm <span class="text-[10px] ml-0.5">›</span>
          </a>
        </p>

        <div class="hidden sm:flex items-center gap-4 text-xs font-normal text-[#1D1D1F]/70">
          <span>Hotline: <strong class="text-red-600 font-bold">{{ storeInfo.hotlineDisplay }}</strong></span>
          <span class="text-black/20">|</span>
          <RouterLink
            v-if="auth.isAuthenticated"
            :to="staffHome()"
            class="text-red-600 hover:text-red-700 hover:underline font-semibold"
          >
            Quản trị viên
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="hover:text-red-600 transition"
          >
            Khu vực nhân viên
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Apple-style Glassmorphism Header Bar -->
    <header class="bg-white/85 backdrop-blur-2xl border-b border-black/[0.08] transition-all">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-[48px] sm:h-[52px]">
        <!-- Brand Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 group" @click="closeMenu">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7A0C10] text-white text-xs font-black shadow-sm group-hover:scale-105 group-hover:bg-red-600 transition-all">
            L
          </div>
          <span class="text-sm font-bold tracking-tight text-[#1D1D1F] group-hover:text-red-600 transition-colors">
            {{ storeInfo.name }}
          </span>
        </RouterLink>

        <!-- Desktop Menu Links -->
        <nav class="hidden md:flex items-center gap-7 text-[12px] font-normal tracking-normal text-[#1D1D1F]/85">
          <a
            v-for="link in appleNavLinks"
            :key="link.label"
            :href="link.href"
            class="transition-colors hover:text-red-600"
          >
            {{ link.label }}
          </a>
        </nav>

        <!-- Right Action Icons (Search, Bag, Mobile Menu) -->
        <div class="flex items-center gap-4 text-[#1D1D1F]">
          <!-- Minimalist Search Input -->
          <div class="relative hidden sm:block">
            <input
              :value="searchQuery"
              type="search"
              placeholder="Tìm kiếm thiết bị..."
              class="w-36 md:w-48 rounded-full bg-[#E8E8ED]/70 py-1 pl-3 pr-8 text-xs text-[#1D1D1F] placeholder-[#86868B] transition-all focus:w-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
              @input="emit('update:searchQuery', $event.target.value)"
            />
            <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#86868B]">
              ⌕
            </span>
          </div>

          <!-- Bag Icon with Red Counter -->
          <button
            type="button"
            class="relative flex items-center justify-center p-1 text-[#1D1D1F]/80 hover:text-red-600 transition"
            aria-label="Túi hàng"
            @click="emit('open-cart')"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span
              v-if="cartCount > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-md shadow-red-500/30"
            >
              {{ cartCount }}
            </span>
          </button>

          <!-- Mobile Hamburger Menu Button -->
          <button
            type="button"
            class="p-1 text-[#1D1D1F] md:hidden"
            aria-label="Menu"
            @click="menuOpen = !menuOpen"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown -->
      <div v-if="menuOpen" class="border-t border-black/[0.08] bg-[#F5F5F7] px-6 py-6 md:hidden animate-in fade-in">
        <input
          :value="searchQuery"
          type="search"
          placeholder="Tìm kiếm thiết bị, phụ kiện..."
          class="mb-4 w-full rounded-xl bg-white border border-black/[0.1] px-4 py-2.5 text-xs text-[#1D1D1F] outline-none focus:border-red-500"
          @input="emit('update:searchQuery', $event.target.value)"
        />
        <nav class="flex flex-col space-y-3 text-sm font-medium text-[#1D1D1F]">
          <a
            v-for="link in appleNavLinks"
            :key="link.label"
            :href="link.href"
            class="py-1 border-b border-black/[0.04] hover:text-red-600 transition"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="mt-3 text-center rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow"
            @click="closeMenu"
          >
            Gọi hỗ trợ: {{ storeInfo.hotlineDisplay }}
          </a>
        </nav>
      </div>
    </header>
  </div>
</template>
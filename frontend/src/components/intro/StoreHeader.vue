<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForUser } from '@/utils/roleRedirect'
import { storeInfo, navLinks } from '@/data/storeIntro'

defineProps({
  searchQuery: { type: String, default: '' },
  cartCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:searchQuery', 'open-cart'])

const auth = useAuthStore()
const menuOpen = ref(false)

const popularKeywords = ['iPhone 15', 'Galaxy S24', 'Xiaomi 14', 'AirPods', 'Sạc 20W']

function closeMenu() {
  menuOpen.value = false
}

function applyKeyword(kw) {
  emit('update:searchQuery', kw)
  document.getElementById('san-pham')?.scrollIntoView({ behavior: 'smooth' })
}

const staffHome = () => getDefaultRouteForUser(auth.user)
</script>

<template>
  <div id="top" class="sticky top-0 z-50">
    <!-- Top Utility Bar -->
    <div class="bg-gradient-to-r from-[#7a0c10] via-[#941318] to-[#7a0c10] text-white text-xs shadow-inner">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:text-xs">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Đang mở cửa: {{ storeInfo.hours }}
          </span>
          <span class="hidden text-white/40 md:inline">|</span>
          <p class="hidden items-center gap-1 text-white/90 md:flex">
            <span>📞 Hotline mua hàng:</span>
            <a :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`" class="font-bold text-amber-300 hover:underline">
              {{ storeInfo.hotlineDisplay }}
            </a>
          </p>
        </div>

        <div class="hidden items-center gap-3 lg:flex text-white/80">
          <span>🛡️ 100% Chính hãng GSMA</span>
          <span>•</span>
          <span>⚡ Giao hỏa tốc 2H</span>
          <span>•</span>
          <span>🔄 30 ngày 1 đổi 1</span>
        </div>

        <div class="flex items-center gap-3">
          <RouterLink
            v-if="auth.isAuthenticated"
            :to="staffHome()"
            class="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-0.5 font-bold text-white transition hover:bg-white hover:text-[#7a0c10]"
          >
            <span>Quản trị hệ thống</span>
            <span>→</span>
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-white/90 transition hover:bg-white/20"
          >
            <span>Nhân viên đăng nhập</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Main Header -->
    <header class="border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm transition-all">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3 group" @click="closeMenu">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7a0c10] via-red-600 to-rose-500 text-xl font-black text-white shadow-md shadow-red-600/30 transition-transform duration-300 group-hover:scale-105"
          >
            L
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xl font-black tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
                {{ storeInfo.name }}
              </span>
              <span class="rounded bg-red-100 px-1 py-0.2 text-[9px] font-black uppercase text-red-700">Store</span>
            </div>
            <p class="text-[11px] font-medium text-slate-500">{{ storeInfo.tagline }}</p>
          </div>
        </RouterLink>

        <!-- Navigation Links -->
        <nav class="hidden items-center gap-1 lg:flex">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-red-50 hover:text-red-600"
          >
            {{ link.label }}
          </a>
        </nav>

        <!-- Search & Actions -->
        <div class="hidden items-center gap-3 md:flex">
          <div class="relative">
            <input
              :value="searchQuery"
              type="search"
              placeholder="Tìm iPhone, Samsung, phụ kiện..."
              class="w-56 rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-4 pr-10 text-xs font-medium text-slate-800 transition-all focus:w-72 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10 xl:w-72"
              @input="emit('update:searchQuery', $event.target.value)"
            />
            <span class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>
          </div>

          <!-- Cart Button -->
          <button
            type="button"
            class="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95"
            aria-label="Giỏ hàng"
            @click="emit('open-cart')"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span
              v-if="cartCount > 0"
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-md shadow-red-600/40 animate-pulse"
            >
              {{ cartCount > 9 ? '9+' : cartCount }}
            </span>
          </button>

          <!-- Call Button -->
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700 hover:shadow-lg active:scale-95"
          >
            <span>📞</span>
            <span>{{ storeInfo.hotlineDisplay }}</span>
          </a>
        </div>

        <!-- Mobile Buttons -->
        <div class="flex items-center gap-2 md:hidden">
          <button
            type="button"
            class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            aria-label="Giỏ hàng"
            @click="emit('open-cart')"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span
              v-if="cartCount > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white"
            >
              {{ cartCount }}
            </span>
          </button>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
            aria-label="Mở menu"
            @click="menuOpen = !menuOpen"
          >
            <span class="text-xl font-bold">{{ menuOpen ? '✕' : '☰' }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Search Keywords Bar -->
      <div class="border-t border-slate-100 bg-slate-50/60 px-4 py-1.5 hidden md:block">
        <div class="mx-auto flex max-w-7xl items-center gap-2 text-xs">
          <span class="font-semibold text-slate-400">Xu hướng:</span>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="kw in popularKeywords"
              :key="kw"
              type="button"
              class="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
              @click="applyKeyword(kw)"
            >
              {{ kw }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div v-if="menuOpen" class="border-t border-slate-200 bg-white px-4 py-4 lg:hidden animate-in fade-in slide-in-from-top-2">
        <div class="relative mb-3">
          <input
            :value="searchQuery"
            type="search"
            placeholder="Tìm sản phẩm, thương hiệu..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
            @input="emit('update:searchQuery', $event.target.value)"
          />
        </div>
        <div class="flex flex-col gap-1">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-red-50 hover:text-red-600"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
        </div>
      </div>
    </header>
  </div>
</template>

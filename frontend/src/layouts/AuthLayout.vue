<script setup>
import { RouterLink } from 'vue-router'
import { storeInfo } from '@/data/storeIntro'

const highlights = [
  'Bán hàng POS tại quầy',
  'Quản lý kho & IMEI',
  'Báo cáo doanh thu',
]
</script>

<template>
  <div class="flex min-h-screen flex-col lg:flex-row">
    <!-- Panel thương hiệu — đồng bộ hero trang chủ -->
    <aside
      class="relative flex flex-col justify-between overflow-hidden bg-[#7a0c10] px-8 py-10 text-white lg:w-1/2 lg:px-14 lg:py-14"
    >
      <div
        class="absolute inset-0 bg-cover bg-right-center bg-no-repeat"
        style="background-image: url('/hero/hero-bg-promo.png')"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-[#5b0b0f]/92 via-[#7a0c10]/80 to-[#9f1239]/60" />

      <div class="relative">
        <RouterLink to="/" class="inline-flex items-center gap-3 transition hover:opacity-90">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/20 backdrop-blur-sm"
          >
            L
          </div>
          <div>
            <p class="text-lg font-bold">{{ storeInfo.name }}</p>
            <p class="text-sm text-red-100/90">{{ storeInfo.tagline }}</p>
          </div>
        </RouterLink>
      </div>

      <div class="relative my-10 hidden lg:block">
        <p class="text-sm font-medium uppercase tracking-widest text-red-200/80">Khu vực nhân viên</p>
        <h2 class="mt-3 text-4xl font-bold leading-tight xl:text-[2.75rem]">
          Đăng nhập<br />hệ thống quản lý
        </h2>
        <p class="mt-5 max-w-sm text-base leading-relaxed text-red-100/90">
          Dành cho nhân viên bán hàng, kho và quản lý cửa hàng Lieng Mobile.
        </p>
        <ul class="mt-8 space-y-3">
          <li
            v-for="item in highlights"
            :key="item"
            class="flex items-center gap-3 text-sm text-white/90"
          >
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">✓</span>
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="relative hidden text-sm text-red-100/80 lg:block">
        <p>{{ storeInfo.address }}</p>
        <p class="mt-2">
          Hotline
          <a
            :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
            class="ml-1 font-semibold text-white hover:underline"
          >
            {{ storeInfo.hotlineDisplay }}
          </a>
          · {{ storeInfo.hours }}
        </p>
      </div>

      <!-- Mobile: chỉ hiện tiêu đề ngắn -->
      <p class="relative text-center text-sm text-red-100/90 lg:hidden">
        Khu vực nhân viên — {{ storeInfo.name }}
      </p>
    </aside>

    <!-- Form -->
    <main class="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:bg-gray-50 lg:px-12">
      <div class="w-full max-w-[520px]">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { storeInfo } from '@/data/storeIntro'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer id="lien-he" class="bg-[#09090b] text-gray-400 border-t border-white/10">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-600 font-black text-white shadow-lg shadow-red-600/30 border border-white/10">
            L
          </div>
          <div>
            <p class="font-bold text-white">{{ storeInfo.name }}</p>
            <p class="text-xs text-gray-500">Từ {{ storeInfo.founded }}</p>
          </div>
        </div>
        <p class="mt-4 text-sm leading-relaxed text-gray-400">
          Hệ thống bán lẻ điện thoại, tablet và phụ kiện chính hãng. Trải nghiệm công nghệ 3D Showroom đỉnh cao và chính sách bảo hành minh bạch.
        </p>
        <div class="mt-4 flex gap-3 text-xs font-semibold">
          <span class="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-gray-300 hover:text-white transition">Facebook</span>
          <span class="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-gray-300 hover:text-white transition">Zalo</span>
          <span class="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-gray-300 hover:text-white transition">TikTok</span>
        </div>
      </div>

      <div>
        <h4 class="font-bold text-white">Hỗ trợ khách hàng</h4>
        <ul class="mt-4 space-y-2 text-sm text-gray-400">
          <li><a href="#dich-vu" class="hover:text-red-400 transition">Chính sách bảo hành</a></li>
          <li><a href="#dich-vu" class="hover:text-red-400 transition">Trả góp 0%</a></li>
          <li><a href="#dich-vu" class="hover:text-red-400 transition">Thu cũ đổi mới</a></li>
          <li><a href="#cua-hang" class="hover:text-red-400 transition">Hệ thống showroom</a></li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-white">Liên hệ</h4>
        <ul class="mt-4 space-y-3 text-sm">
          <li>
            <span class="block text-gray-500 text-xs">Hotline hỗ trợ 24/7</span>
            <a :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`" class="inline-flex items-center gap-1.5 font-bold text-white hover:text-red-400 transition">
              <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-500" />
              <span>{{ storeInfo.hotlineDisplay }}</span>
            </a>
          </li>
          <li>
            <span class="block text-gray-500 text-xs">Zalo tư vấn</span>
            <span class="text-gray-300">{{ storeInfo.zalo }}</span>
          </li>
          <li>
            <span class="block text-gray-500 text-xs">Email doanh nghiệp</span>
            <a :href="`mailto:${storeInfo.email}`" class="text-gray-300 hover:text-white transition">{{ storeInfo.email }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-white">Thanh toán đa dạng</h4>
        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="method in ['Tiền mặt', 'Chuyển khoản', 'Thẻ ATM', 'Visa', 'Trả góp 0%']"
            :key="method"
            class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300"
          >
            {{ method }}
          </span>
        </div>
        <RouterLink
          to="/login"
          class="mt-6 inline-flex items-center gap-1.5 text-xs text-gray-400 underline-offset-2 hover:text-red-400 hover:underline"
        >
          <span>Đăng nhập hệ thống quản lý</span>
          <span>→</span>
        </RouterLink>
      </div>
    </div>

    <div class="border-t border-white/10 py-5 text-center text-xs text-gray-500">
      &copy; {{ year }} {{ storeInfo.name }}. Toàn bộ bản quyền thuộc về Liêng Mobile.
    </div>
  </footer>
</template>

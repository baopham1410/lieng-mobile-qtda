<script setup>
import { RouterLink } from 'vue-router'
import { storeInfo } from '@/data/storeIntro'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer id="lien-he" class="bg-gray-900 text-gray-300">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 font-bold text-white shadow-md">
            L
          </div>
          <div>
            <p class="font-bold text-white">{{ storeInfo.name }}</p>
            <p class="text-xs text-gray-400">Từ {{ storeInfo.founded }}</p>
          </div>
        </div>
        <p class="mt-4 text-sm leading-relaxed">
          Hệ thống bán lẻ điện thoại, tablet và phụ kiện chính hãng. Cam kết giá tốt, bảo hành đúng chuẩn.
        </p>
        <div class="mt-4 flex gap-3 text-sm">
          <span class="rounded-full bg-white/10 px-3 py-1">Facebook</span>
          <span class="rounded-full bg-white/10 px-3 py-1">Zalo</span>
          <span class="rounded-full bg-white/10 px-3 py-1">TikTok</span>
        </div>
      </div>

      <div>
        <h4 class="font-semibold text-white">Hỗ trợ khách hàng</h4>
        <ul class="mt-4 space-y-2 text-sm">
          <li><a href="#dich-vu" class="hover:text-white transition">Chính sách bảo hành</a></li>
          <li><a href="#dich-vu" class="hover:text-white transition">Trả góp 0%</a></li>
          <li><a href="#dich-vu" class="hover:text-white transition">Thu cũ đổi mới</a></li>
          <li><a href="#cua-hang" class="hover:text-white transition">Hệ thống cửa hàng</a></li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold text-white">Liên hệ</h4>
        <ul class="mt-4 space-y-3 text-sm">
          <li>
            <span class="block text-gray-500 text-xs">Hotline</span>
            <a :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`" class="inline-flex items-center gap-1.5 font-medium text-white hover:text-red-400">
              <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-500" />
              <span>{{ storeInfo.hotlineDisplay }}</span>
            </a>
          </li>
          <li>
            <span class="block text-gray-500 text-xs">Zalo</span>
            <span class="text-white">{{ storeInfo.zalo }}</span>
          </li>
          <li>
            <span class="block text-gray-500 text-xs">Email</span>
            <a :href="`mailto:${storeInfo.email}`" class="hover:text-white transition">{{ storeInfo.email }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold text-white">Thanh toán</h4>
        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="method in ['Tiền mặt', 'Chuyển khoản', 'Thẻ ATM', 'Visa', 'Trả góp']"
            :key="method"
            class="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
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
      &copy; {{ year }} {{ storeInfo.name }}. Bản quyền thuộc về Lieng Mobile.
    </div>
  </footer>
</template>

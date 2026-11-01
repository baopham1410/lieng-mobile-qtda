<script setup>
import { RouterLink } from 'vue-router'
import { storeInfo } from '@/data/storeIntro'

const year = new Date().getFullYear()
</script>

<template>
  <footer id="lien-he" class="bg-gray-900 text-gray-300">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 font-bold text-white">
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
          <li><a href="#dich-vu" class="hover:text-white">Chính sách bảo hành</a></li>
          <li><a href="#dich-vu" class="hover:text-white">Trả góp 0%</a></li>
          <li><a href="#dich-vu" class="hover:text-white">Thu cũ đổi mới</a></li>
          <li><a href="#cua-hang" class="hover:text-white">Hệ thống cửa hàng</a></li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold text-white">Liên hệ</h4>
        <ul class="mt-4 space-y-3 text-sm">
          <li>
            <span class="block text-gray-500">Hotline</span>
            <a :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`" class="font-medium text-white hover:text-red-400">
              {{ storeInfo.hotlineDisplay }}
            </a>
          </li>
          <li>
            <span class="block text-gray-500">Zalo</span>
            <span class="text-white">{{ storeInfo.zalo }}</span>
          </li>
          <li>
            <span class="block text-gray-500">Email</span>
            <a :href="`mailto:${storeInfo.email}`" class="hover:text-white">{{ storeInfo.email }}</a>
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
          class="mt-6 inline-block text-xs text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
        >
          Đăng nhập hệ thống quản lý
        </RouterLink>
      </div>
    </div>

    <div class="border-t border-white/10 py-5 text-center text-xs text-gray-500">
      &copy; {{ year }} {{ storeInfo.name }}. Bản quyền thuộc về Lieng Mobile.
    </div>
  </footer>
</template>

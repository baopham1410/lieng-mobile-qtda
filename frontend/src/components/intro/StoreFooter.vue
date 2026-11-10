<script setup>
import { RouterLink } from 'vue-router'
import { storeInfo } from '@/data/storeIntro'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer id="lien-he" class="bg-[#F5F5F7] text-slate-500 border-t border-slate-200/80 text-[12px] font-normal">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <!-- Legal / Disclaimers Note -->
      <div class="border-b border-slate-200 pb-6 space-y-2 text-[11px] leading-relaxed text-slate-400">
        <p>
          * Giá hiển thị là giá đã bao gồm thuế GTGT. Chương trình thu cũ đổi mới trợ giá áp dụng cho thiết bị đủ điều kiện ngoại quan và chức năng theo quy định của Lieng Mobile.
        </p>
        <p>
          Chính sách trả góp 0% lãi suất áp dụng với các dòng máy chính hãng qua các đối tác ngân hàng liên kết.
        </p>
      </div>

      <!-- Footer Columns -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 py-2">
        <div>
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Mua Sắm & Thiết Bị</h4>
          <ul class="mt-3.5 space-y-2.5">
            <li><a href="#san-pham" class="hover:text-red-600 transition">iPhone Series Chính Hãng</a></li>
            <li><a href="#san-pham" class="hover:text-red-600 transition">Samsung Galaxy AI</a></li>
            <li><a href="#san-pham" class="hover:text-red-600 transition">iPad & Máy Tính Bảng</a></li>
            <li><a href="#san-pham" class="hover:text-red-600 transition">MacBook & Laptop</a></li>
            <li><a href="#san-pham" class="hover:text-red-600 transition">Phụ Kiện Cao Cấp</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Dịch Vụ & Hỗ Trợ</h4>
          <ul class="mt-3.5 space-y-2.5">
            <li><a href="#dich-vu" class="hover:text-red-600 transition">Chính sách bảo hành 12T</a></li>
            <li><a href="#dich-vu" class="hover:text-red-600 transition">Chương trình thu cũ đổi mới</a></li>
            <li><a href="#dich-vu" class="hover:text-red-600 transition">Phương thức trả góp 0%</a></li>
            <li><a href="#dich-vu" class="hover:text-red-600 transition">Chính sách giao hàng 2H</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Cửa Hàng Lieng Mobile</h4>
          <ul class="mt-3.5 space-y-2.5">
            <li>
              <a href="#cua-hang" class="hover:text-red-600 transition inline-flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Tìm cửa hàng gần bạn</span>
              </a>
            </li>
            <li class="inline-flex items-center gap-1.5 text-slate-700">
              <StoreDeviceIcon name="phone-call" size-class="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span>Hotline: <strong class="text-slate-900">{{ storeInfo.hotlineDisplay }}</strong></span>
            </li>
            <li class="inline-flex items-center gap-1.5 text-slate-700">
              <svg class="h-3.5 w-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Zalo: {{ storeInfo.zalo }}</span>
            </li>
            <li>
              <a :href="`mailto:${storeInfo.email}`" class="hover:text-red-600 transition inline-flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{{ storeInfo.email }}</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Nội Bộ & Quản Trị</h4>
          <ul class="mt-3.5 space-y-2.5">
            <li>
              <RouterLink to="/login" class="text-red-600 hover:text-red-700 font-bold hover:underline inline-flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Đăng nhập quản lý</span>
              </RouterLink>
            </li>
            <li>
              <a href="#top" class="hover:text-red-600 transition inline-flex items-center gap-1.5 font-medium">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>Về đầu trang</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright row -->
      <div class="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
        <p>Bản quyền &copy; {{ year }} {{ storeInfo.name }}. Bảo lưu mọi quyền.</p>
        <p class="text-xs font-semibold text-slate-500">Hệ thống phân phối điện thoại Lieng Mobile</p>
      </div>
    </div>
  </footer>
</template>

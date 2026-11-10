<script setup>
import { RouterLink } from 'vue-router'
import { storeInfo } from '@/data/storeIntro'

const year = new Date().getFullYear()
</script>

<template>
  <footer id="lien-he" class="bg-[#F5F5F7] text-[#86868B] border-t border-black/[0.08] text-[12px] font-normal">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <!-- Legal / Disclaimers Note (Apple style) -->
      <div class="border-b border-black/[0.08] pb-6 space-y-2 text-[11px] leading-relaxed text-[#86868B]">
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
          <h4 class="text-xs font-semibold text-[#1D1D1F]">Mua Sắm & Tìm Hiểu</h4>
          <ul class="mt-3 space-y-2">
            <li><a href="#san-pham" class="hover:text-[#1D1D1F] transition">iPhone Series</a></li>
            <li><a href="#san-pham" class="hover:text-[#1D1D1F] transition">Samsung Galaxy</a></li>
            <li><a href="#san-pham" class="hover:text-[#1D1D1F] transition">iPad & Tablet</a></li>
            <li><a href="#san-pham" class="hover:text-[#1D1D1F] transition">Mac & Laptop</a></li>
            <li><a href="#san-pham" class="hover:text-[#1D1D1F] transition">Phụ Kiện Chính Hãng</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-semibold text-[#1D1D1F]">Dịch Vụ & Hỗ Trợ</h4>
          <ul class="mt-3 space-y-2">
            <li><a href="#dich-vu" class="hover:text-[#1D1D1F] transition">Chính sách bảo hành 12T</a></li>
            <li><a href="#dich-vu" class="hover:text-[#1D1D1F] transition">Chương trình thu cũ đổi mới</a></li>
            <li><a href="#dich-vu" class="hover:text-[#1D1D1F] transition">Phương thức trả góp 0%</a></li>
            <li><a href="#dich-vu" class="hover:text-[#1D1D1F] transition">Chính sách giao hàng 2H</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-semibold text-[#1D1D1F]">Cửa Hàng Lieng Mobile</h4>
          <ul class="mt-3 space-y-2">
            <li><a href="#cua-hang" class="hover:text-[#1D1D1F] transition">Tìm cửa hàng gần bạn</a></li>
            <li><span class="text-[#1D1D1F]/70">Hotline: {{ storeInfo.hotlineDisplay }}</span></li>
            <li><span class="text-[#1D1D1F]/70">Zalo: {{ storeInfo.zalo }}</span></li>
            <li><a :href="`mailto:${storeInfo.email}`" class="hover:text-[#1D1D1F] transition">{{ storeInfo.email }}</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-semibold text-[#1D1D1F]">Nội Bộ & Quản Trị</h4>
          <ul class="mt-3 space-y-2">
            <li>
              <RouterLink to="/login" class="text-[#0071E3] hover:underline">
                Đăng nhập hệ thống quản lý
              </RouterLink>
            </li>
            <li>
              <a href="#top" class="hover:text-[#1D1D1F] transition">
                Về đầu trang ↑
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright row -->
      <div class="border-t border-black/[0.08] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#86868B]">
        <p>Bản quyền &copy; {{ year }} {{ storeInfo.name }}. Bảo lưu mọi quyền.</p>
        <p class="text-xs">Việt Nam</p>
      </div>
    </div>
  </footer>
</template>
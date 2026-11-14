<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { usePageTransitionStore } from '@/stores/pageTransition'
import { storeInfo } from '@/data/storeIntro'
import { loginCopy } from '@/mocks/auth'
import { resolvePostLoginRoute } from '@/utils/roleRedirect'

const REMEMBER_KEY = 'lieng_login_email'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()
const pageTransition = usePageTransitionStore()

const email = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const error = ref('')

const isBusy = computed(() => auth.loading || pageTransition.running)

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    email.value = saved
    remember.value = true
  }
})

async function finishLogin(data) {
  if (remember.value) {
    localStorage.setItem(REMEMBER_KEY, email.value)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }

  const user = data?.user ?? auth.user
  if (user?.is_active === false) {
    await auth.logout()
    error.value = loginCopy.inactiveAccount
    return
  }

  const target = resolvePostLoginRoute(user, route.query.redirect)
  try {
    await pageTransition.playLoginEnter(router, target, app)
  } catch {
    await router.push(target)
  }
}

async function handleSubmit() {
  error.value = ''
  try {
    const data = await auth.login(email.value, password.value)
    await finishLogin(data)
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    if (msg?.toLowerCase().includes('inactive') || msg?.toLowerCase().includes('khóa')) {
      error.value = loginCopy.inactiveAccount
    } else if (msg?.includes('Network Error') || err.code === 'ERR_NETWORK') {
      error.value = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.'
    } else {
      error.value = msg || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
    }
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-[32px] bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.14)] ring-1 ring-black/5 flex flex-col md:flex-row min-h-[640px] lg:min-h-[680px]">
    <!-- Left Column: Form Đăng nhập -->
    <div class="flex flex-1 flex-col items-center justify-center p-8 sm:p-12 lg:p-14 text-center md:w-1/2">
      <!-- Tiêu đề nhỏ -->
      <p class="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
        HỆ THỐNG QUẢN LÝ
      </p>

      <!-- Logo thương hiệu Lieng Mobile -->
      <div class="mt-3 flex items-center justify-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 font-black text-white shadow-lg shadow-red-600/35 text-xl">
          L
        </div>
        <span class="text-2xl sm:text-3xl font-black tracking-wider text-slate-900">
          LIENG <span class="text-red-600">MOBILE</span>
        </span>
      </div>

      <!-- Mô tả phụ -->
      <p class="mt-3 max-w-[340px] text-xs sm:text-sm leading-relaxed text-slate-500">
        Đăng nhập tài khoản nhân viên để truy cập hệ thống quản trị cửa hàng.
      </p>

      <!-- Form nhập thông tin -->
      <form class="mt-7 w-full max-w-sm space-y-4" @submit.prevent="handleSubmit">
        <!-- Ô nhập Email / Tên tài khoản -->
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </span>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="Email nhân viên"
            :disabled="isBusy"
            class="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition duration-200 hover:border-slate-300 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        <!-- Ô nhập Mật khẩu -->
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </span>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            placeholder="Mật khẩu"
            :disabled="isBusy"
            class="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition duration-200 hover:border-slate-300 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-600 focus:outline-none"
            :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <!-- Tùy chọn nhớ mật khẩu & thông báo lỗi -->
        <div class="flex items-center justify-between px-1 text-xs text-slate-500">
          <label class="flex cursor-pointer items-center gap-2 select-none">
            <input
              v-model="remember"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500/30"
            />
            Ghi nhớ email
          </label>
          <span class="text-slate-400 cursor-pointer hover:text-slate-600 transition">Quên mật khẩu?</span>
        </div>

        <div v-if="error" class="rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 ring-1 ring-red-100 text-left">
          {{ error }}
        </div>

        <!-- Nút Đăng nhập -->
        <button
          type="submit"
          :disabled="isBusy"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 py-3.5 px-6 text-sm sm:text-base font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/35 transition duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            v-if="isBusy"
            class="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>{{ isBusy ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP' }}</span>
        </button>
      </form>

      <!-- Quay lại trang chủ -->
      <p class="mt-8 text-center">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 transition duration-200 hover:text-red-600"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Về trang mua hàng
        </RouterLink>
      </p>
    </div>

    <!-- Right Column: Panel Thương hiệu & Banner Lieng Mobile -->
    <div class="relative overflow-hidden bg-gradient-to-br from-[#7a0c10] via-[#dc2626] to-[#991b1b] p-10 sm:p-14 lg:p-16 text-white flex flex-col items-center justify-center text-center md:w-1/2">
      <!-- Lớp nền phối cảnh cửa hàng / cityscape -->
      <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-overlay"
        style="background-image: url('/hero/hero-bg-promo.png')"
      />
      <!-- Lớp phủ ánh sáng chéo cao cấp -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/20" />

      <!-- Nội dung thương hiệu trung tâm -->
      <div class="relative z-10 flex flex-col items-center justify-center max-w-md">
        <!-- Logo Lieng Mobile lớn -->
        <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-4xl font-black text-white shadow-2xl ring-2 ring-white/30 backdrop-blur-md">
          L
        </div>

        <h2 class="mt-5 text-3xl sm:text-4xl font-black tracking-widest text-white">
          {{ storeInfo.name }}
        </h2>

        <p class="mt-2.5 text-xs sm:text-sm font-bold uppercase tracking-widest text-red-100/90">
          {{ storeInfo.tagline }}
        </p>

        <p class="mt-5 text-sm sm:text-base leading-relaxed text-white/90">
          Hệ thống bán lẻ điện thoại, thiết bị di động và linh kiện chính hãng. Giải pháp quản lý thông minh từ POS quầy đến kho hàng và dịch vụ bảo hành.
        </p>

        <!-- Thông tin liên hệ nhanh -->
        <div class="mt-8 flex flex-wrap justify-center gap-3.5 text-xs sm:text-sm text-red-100/90 border-t border-white/20 pt-6">
          <span>📞 Hotline: <strong class="text-white">{{ storeInfo.hotlineDisplay }}</strong></span>
          <span>•</span>
          <span>📍 {{ storeInfo.address.split(',')[0] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

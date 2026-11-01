<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { usePageTransitionStore } from '@/stores/pageTransition'
import { storeInfo } from '@/data/storeIntro'
import { loginCopy } from '@/mocks/auth'
import { demoLoginAccounts, DEMO_PASSWORD } from '@/data/demoAccounts'
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

  const user = data.user ?? auth.user
  if (user?.is_active === false) {
    await auth.logout()
    error.value = loginCopy.inactiveAccount
    return
  }

  const target = resolvePostLoginRoute(user, route.query.redirect)
  await pageTransition.playLoginEnter(router, target, app)
}

async function handleSubmit() {
  error.value = ''
  try {
    const data = await auth.login(email.value, password.value)
    await finishLogin(data)
  } catch (err) {
    const msg = err.response?.data?.message
    if (msg?.toLowerCase().includes('inactive') || msg?.toLowerCase().includes('khóa')) {
      error.value = loginCopy.inactiveAccount
    } else {
      error.value = msg ?? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
    }
  }
}

function fillAccount(account) {
  email.value = account.email
  password.value = DEMO_PASSWORD
  error.value = ''
}

async function quickLogin(account) {
  if (auth.loading || pageTransition.running) return
  fillAccount(account)
  await handleSubmit()
}
</script>

<template>
  <div>
    <!-- Logo mobile -->
    <div class="mb-8 text-center lg:hidden">
      <div
        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 text-2xl font-bold text-white shadow-lg shadow-red-600/25"
      >
        L
      </div>
    </div>

    <div class="mb-6 text-center lg:text-left">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">Chào bạn trở lại</h1>
      <p class="mt-2 text-sm text-gray-500">Đăng nhập tài khoản nhân viên {{ storeInfo.name }}</p>
    </div>

    <div class="mb-6">
      <p class="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Đăng nhập nhanh theo vai trò</p>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          v-for="account in demoLoginAccounts"
          :key="account.id"
          type="button"
          class="group rounded-xl border p-3 text-left ring-1 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          :class="account.accent"
          :disabled="auth.loading || pageTransition.running"
          @click="quickLogin(account)"
        >
          <span
            class="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            :class="account.badge"
          >
            {{ account.label }}
          </span>
          <p class="mt-2 truncate text-sm font-bold text-gray-900">{{ account.name }}</p>
          <p class="mt-0.5 truncate text-[11px] font-medium opacity-80">{{ account.email }}</p>
          <p class="mt-1.5 text-[10px] leading-snug opacity-70">{{ account.hint }}</p>
        </button>
      </div>
      <p class="mt-2 text-center text-[11px] text-gray-400 lg:text-left">
        Mật khẩu demo: <code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-gray-600">{{ DEMO_PASSWORD }}</code>
      </p>
    </div>

    <div class="relative mb-6">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div class="w-full border-t border-gray-200" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-white px-3 font-semibold tracking-widest text-gray-400 lg:bg-gray-50">hoặc nhập tay</span>
      </div>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="mb-2 block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="username"
          class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
          placeholder="admin@liengmobile.com"
        />
      </div>

      <div>
        <label for="password" class="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</label>
        <div class="relative">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
            placeholder="Nhập mật khẩu"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 transition hover:text-gray-600"
            :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <label class="flex cursor-pointer select-none items-center gap-2.5 text-sm text-gray-600">
          <input
            v-model="remember"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500/30"
          />
          Ghi nhớ email
        </label>
      </div>

      <p
        v-if="error"
        class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
        role="alert"
      >
        {{ error }}
      </p>

      <button
        type="submit"
        :disabled="auth.loading || pageTransition.running"
        class="w-full rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ auth.loading || pageTransition.running ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>
    </form>

    <p class="mt-8 text-center text-sm text-gray-400">
      Quên mật khẩu? Liên hệ quản lý cửa hàng.
    </p>

    <p class="mt-6 text-center">
      <RouterLink
        to="/"
        class="text-sm font-medium text-gray-500 transition hover:text-red-600"
      >
        ← Về trang mua hàng
      </RouterLink>
    </p>
  </div>
</template>

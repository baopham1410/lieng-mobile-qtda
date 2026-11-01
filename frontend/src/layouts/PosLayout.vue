<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-100">
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <h1 class="text-lg font-semibold text-gray-800">POS — Lieng Mobile</h1>
      <button
        class="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
        @click="handleLogout"
      >
        Đăng xuất
      </button>
    </header>
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>

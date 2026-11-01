<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import AppUserAvatar from '@/components/common/AppUserAvatar.vue'
import { fetchNotifications } from '@/api/notifications'
import { globalSearch } from '@/api/search'
import { isMockToken } from '@/mocks/auth'
import { pageMeta as staticPageMeta } from '@/data/adminNav'
import { getRoleName } from '@/utils/roleRedirect'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const locale = useLocaleStore()

const meta = computed(() => {
  return locale.pageMeta(route.name) ?? staticPageMeta[route.name] ?? { title: 'Lieng Mobile', subtitle: '' }
})

const isAdmin = computed(() => getRoleName(auth.user) === 'admin')

const searchQuery = ref('')
const searchResults = ref([])
const apiNotifications = ref(null)
let searchTimer = null

const fallbackNotifications = computed(() => [])

const notifications = computed(() => {
  if (apiNotifications.value?.length) {
    return apiNotifications.value
  }
  return fallbackNotifications.value
})

watch(searchQuery, (q) => {
  clearTimeout(searchTimer)
  if (!q || q.trim().length < 2 || isMockToken(auth.token)) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await globalSearch(q.trim())
    } catch {
      searchResults.value = []
    }
  }, 300)
})

onMounted(async () => {
  try {
    apiNotifications.value = await fetchNotifications()
  } catch {
    apiNotifications.value = null
  }
})

function goSearchResult(item) {
  router.push(item.to)
  searchQuery.value = ''
  searchResults.value = []
  closeMenus()
}

const showProfileMenu = ref(false)
const showLanguageMenu = ref(false)
const showNotificationMenu = ref(false)

function closeMenus() {
  showProfileMenu.value = false
  showLanguageMenu.value = false
  showNotificationMenu.value = false
}

function selectLanguage(code) {
  locale.setLocale(code)
  showLanguageMenu.value = false
}

async function handleLogout() {
  closeMenus()
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div
    v-if="showProfileMenu || showLanguageMenu"
    class="fixed inset-0 z-40"
    @click="closeMenus"
  ></div>
  <header
    class="relative z-50 flex min-h-[84px] shrink-0 flex-wrap items-center justify-between gap-3 rounded-[24px] border border-red-200 bg-[#fff7f7] px-4 py-3 font-sans shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:gap-4 sm:px-6 lg:flex-nowrap lg:px-8 lg:py-0"
    style="font-family: 'Plus Jakarta Sans', sans-serif"
  >
    <div class="min-w-0 flex-1 basis-full lg:basis-auto">
      <h1 class="truncate text-lg font-black tracking-tight text-[#111118] sm:text-[22px]">{{ meta.title }}</h1>
      <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium">
        <span class="min-w-0 max-w-full truncate text-slate-500">{{ meta.subtitle }}</span>
        <span class="hidden shrink-0 text-slate-300 sm:inline">•</span>
        <span class="flex shrink-0 items-center gap-1.5 font-bold uppercase tracking-widest text-emerald-500">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
          {{ locale.t('header.open') }}
        </span>
      </div>
    </div>

    <div class="flex w-full shrink-0 items-center justify-end gap-2 sm:gap-3 lg:w-auto">
      <!-- Search -->
      <div class="relative hidden lg:block">
        <div
          class="flex w-[240px] cursor-text items-center gap-2 rounded-[16px] border border-red-200 bg-red-100/70 px-4 py-2.5 transition-all hover:border-red-300 focus-within:border-red-500/50 focus-within:bg-white focus-within:shadow-sm focus-within:ring-2 focus-within:ring-red-500/10"
        >
          <svg class="h-4.5 w-4.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="locale.t('header.search')"
            class="w-full border-none bg-transparent text-[13px] font-medium text-[#111118] outline-none placeholder:text-slate-400"
            @keydown.escape="searchResults = []"
          />
        </div>
        <div
          v-if="searchResults.length"
          class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] border border-red-100 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
        >
          <button
            v-for="item in searchResults"
            :key="`${item.type}-${item.label}`"
            type="button"
            class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-red-50"
            @click="goSearchResult(item)"
          >
            <span class="font-semibold text-[#111118]">{{ item.label }}</span>
            <span class="text-xs text-slate-400">{{ item.hint }}</span>
          </button>
        </div>
      </div>

      <!-- Language -->
      <div class="relative">
        <button
          class="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-red-600/10 text-red-600 transition-all hover:bg-red-600 hover:text-white"
          :title="locale.t('header.language')"
          @click="showLanguageMenu = !showLanguageMenu"
        >
          <img
            :src="locale.currentLanguage.flag"
            :alt="locale.currentLanguage.label"
            class="h-[18px] w-[26px] rounded-[3px] object-cover shadow-sm ring-1 ring-black/10"
          />
        </button>

        <div
          v-if="showLanguageMenu"
          class="absolute right-0 top-full z-50 mt-3 w-44 rounded-[18px] border border-red-100 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
        >
          <button
            v-for="language in locale.languageOptions"
            :key="language.code"
            class="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium transition"
            :class="
              locale.locale === language.code
                ? 'bg-red-50 text-red-600'
                : 'text-slate-600 hover:bg-slate-50'
            "
            @click="selectLanguage(language.code)"
          >
            <span class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-red-50 ring-1 ring-red-100"
              >
                <img
                  :src="language.flag"
                  :alt="language.label"
                  class="h-5 w-7 rounded-[3px] object-cover"
                />
              </span>
              {{ language.label }}
            </span>
            <svg
              v-if="locale.locale === language.code"
              class="h-4 w-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="relative">
        <button
          class="relative flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-red-200 bg-red-100/70 text-slate-400 transition-all hover:bg-white hover:text-red-600"
          @click="showNotificationMenu = !showNotificationMenu"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 18.75a2.25 2.25 0 0 1-4.5 0m9-1.5H5.25c1.242-1.125 2.25-2.91 2.25-4.875V9.75a4.5 4.5 0 1 1 9 0v2.625c0 1.965 1.008 3.75 2.25 4.875Z" />
          </svg>
          <span v-if="isAdmin && notifications.length" class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <div
          v-if="showNotificationMenu"
          class="absolute right-0 top-full z-50 mt-3 w-[320px] rounded-[20px] border border-red-100 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
        >
          <div class="flex items-center justify-between px-3 py-2">
            <p class="text-[13px] font-bold text-[#111118]">{{ locale.t('header.notifications') }}</p>
            <span class="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-100">
              {{ notifications.length }} {{ locale.t('header.notificationsNew') }}
            </span>
          </div>

          <div class="mt-1 space-y-1">
            <p v-if="notifications.length === 0" class="px-3 py-6 text-center text-xs text-slate-500">
              {{ isAdmin ? 'Chưa có thông báo mới' : 'Thông báo dành cho quản trị' }}
            </p>
            <button
              v-for="item in notifications"
              :key="item.id"
              type="button"
              class="flex w-full items-start gap-3 rounded-[16px] px-3 py-3 text-left transition hover:bg-red-50/60"
              @click="item.to ? (router.push(item.to), (showNotificationMenu = false)) : (showNotificationMenu = false)"
            >
              <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-red-50 text-red-600">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 18.75a2.25 2.25 0 0 1-4.5 0m9-1.5H5.25c1.242-1.125 2.25-2.91 2.25-4.875V9.75a4.5 4.5 0 1 1 9 0v2.625c0 1.965 1.008 3.75 2.25 4.875Z" />
                </svg>
              </span>
              <div class="min-w-0">
                <p class="text-[13px] font-semibold text-[#111118]">{{ item.title }}</p>
                <p class="mt-0.5 text-[12px] leading-relaxed text-slate-500">{{ item.desc }}</p>
                <p class="mt-1 text-[11px] text-slate-400">{{ formatRelativeTime(item.time) }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="mx-1 hidden h-6 w-px bg-slate-100 sm:block"></div>

      <!-- Profile -->
      <div class="relative hidden md:block">
        <button
          class="flex items-center gap-3 rounded-[16px] bg-red-100/70 px-3 py-2 transition hover:bg-red-200/70"
          @click="showProfileMenu = !showProfileMenu"
        >
          <AppUserAvatar :src="auth.user?.avatar_url" :alt="auth.user?.name ?? locale.t('header.staff')" />
          <div class="text-left">
            <p class="text-[13px] font-bold text-[#111118]">{{ auth.user?.name ?? locale.t('header.staff') }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-red-600">
              {{ auth.user?.role?.display_name ?? locale.t('header.internal') }}
            </p>
          </div>
          <svg
            class="h-4 w-4 text-slate-400 transition"
            :class="showProfileMenu ? 'rotate-180' : ''"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        <div
          v-if="showProfileMenu"
          class="absolute right-0 top-full z-50 mt-3 w-64 rounded-[20px] border border-red-100 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
        >
          <div class="rounded-[16px] bg-red-50/70 px-3 py-3">
            <p class="text-[13px] font-bold text-[#111118]">{{ auth.user?.name ?? locale.t('header.staff') }}</p>
            <p class="mt-0.5 text-[11px] text-slate-500">{{ auth.user?.email ?? locale.t('sidebar.internalAccount') }}</p>
            <p class="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-600 ring-1 ring-red-100">
              {{ auth.user?.role?.display_name ?? locale.t('header.internal') }}
            </p>
          </div>

          <div class="mt-2 space-y-1">
            <RouterLink
              to="/profile"
              class="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
              @click="showProfileMenu = false"
            >
              <span class="flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {{ locale.t('header.profile') }}
              </span>
              <svg class="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </RouterLink>

            <button
              class="flex w-full items-center justify-between rounded-[14px] bg-red-600 px-3 py-2.5 text-left text-[13px] font-semibold text-white transition hover:bg-red-700"
              @click="handleLogout"
            >
              <span class="flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-6-3h11.25m0 0-3-3m3 3-3 3" />
                </svg>
                {{ locale.t('header.logout') }}
              </span>
              <svg class="h-3.5 w-3.5 text-red-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <button
        class="rounded-[14px] bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 sm:hidden"
        @click="handleLogout"
      >
        {{ locale.t('header.logout') }}
      </button>
    </div>
  </header>
</template>

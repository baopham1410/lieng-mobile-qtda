<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { usePageTransitionStore } from '@/stores/pageTransition'
import { useLocaleStore } from '@/stores/locale'
import { storeInfo } from '@/data/storeIntro'
import { activeBranch } from '@/mocks/auth'
import { useAdminNav } from '@/composables/useAdminNav'
import { getDefaultRouteForUser } from '@/utils/roleRedirect'
import AdminNavIcon from '@/components/layout/AdminNavIcon.vue'
import AppUserAvatar from '@/components/common/AppUserAvatar.vue'
import AppSidebarEnterOverlay from '@/components/layout/AppSidebarEnterOverlay.vue'

const route = useRoute()
const auth = useAuthStore()
const app = useAppStore()
const pageTransition = usePageTransitionStore()
const locale = useLocaleStore()
const { navGroups, flatNav } = useAdminNav()

const activeName = computed(() => route.name)
const roleLabel = computed(() => auth.user?.role?.display_name ?? 'Nhân viên')
const homeLink = computed(() => getDefaultRouteForUser(auth.user))
const posLink = computed(() => flatNav.value.find((item) => item.isPos))
const sidebarEnterPhase = computed(() => pageTransition.sidebarPhase)
const isSidebarEnter = computed(
  () =>
    pageTransition.active &&
    pageTransition.targetLayout === 'admin' &&
    sidebarEnterPhase.value !== 'idle',
)
const isExpandedDuringEnter = computed(() =>
  ['expand', 'done'].includes(sidebarEnterPhase.value),
)
const isCollapsed = computed(() => {
  if (isSidebarEnter.value) return !isExpandedDuringEnter.value
  return !app.sidebarOpen
})
const sidebarWidthClass = computed(() => {
  if (isSidebarEnter.value) {
    return isExpandedDuringEnter.value ? 'w-[280px]' : 'w-[88px]'
  }
  return isCollapsed.value ? 'w-[88px]' : 'w-[280px]'
})
const branchLabel = computed(() => {
  const prefix = `${storeInfo.name} — `
  return activeBranch.name.startsWith(prefix)
    ? activeBranch.name.slice(prefix.length)
    : activeBranch.name
})

const PRODUCT_ROUTES = new Set(['products', 'product-edit'])
const IMPORT_ROUTES = new Set(['stock-imports', 'stock-import-create', 'stock-import-detail'])

function isLinkActive(link) {
  const name = route.name
  if (link.name === 'products') return PRODUCT_ROUTES.has(name)
  if (link.name === 'stock-imports') return IMPORT_ROUTES.has(name)
  return name === link.name
}

const menuGroups = computed(() =>
  navGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.isPos),
    }))
    .filter((group) => group.items.length > 0),
)

const navIconBoxClass =
  'nav-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-red-50 text-red-600 transition-colors group-hover:bg-red-100 group-hover:text-red-700'
const navIconBoxActiveClass = 'bg-white/20 text-white group-hover:bg-white/20 group-hover:text-white'
const navIconBoxPosClass =
  'nav-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white'
const navIconBoxPosActiveClass = 'bg-white/20 text-white group-hover:bg-white/20 group-hover:text-white'

const navActiveClass =
  'bg-red-600 text-white shadow-md shadow-red-200/50 icon-active'
const navDefaultClass =
  'text-slate-500 hover:bg-[#f8f8fb] hover:text-[#111118]'
</script>

<template>
  <aside
    :class="[
      'admin-chrome-sidebar relative sticky top-4 z-20 my-4 ml-4 hidden h-[calc(100vh-32px)] flex-col justify-between overflow-hidden rounded-[32px] border border-red-200 bg-[#fff7f7] font-sans shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-[width] duration-300 ease-in-out lg:flex',
      isSidebarEnter ? 'sidebar-enter-active' : '',
      sidebarWidthClass,
    ]"
  >
    <AppSidebarEnterOverlay />

    <!-- Brand — bấm logo để thu gọn / mở rộng -->
    <div
      :class="[
        'z-10 shrink-0 bg-[#fff7f7]',
        isCollapsed ? 'px-2 pb-3 pt-4' : 'px-4 pb-3 pt-5',
      ]"
    >
      <button
        v-if="isCollapsed"
        type="button"
        class="flex w-full items-center justify-center rounded-[20px] border border-red-300/60 bg-gradient-to-br from-red-200 via-rose-100 to-red-100 p-2.5 shadow-md shadow-red-400/20 transition hover:from-red-300 hover:to-rose-200 active:scale-[0.98]"
        :title="locale.t('sidebar.expand')"
        @click="app.toggleSidebar()"
      >
        <img
          src="/brand/lieng-logo.png"
          alt="Lieng Mobile"
          class="h-10 w-10 object-contain mix-blend-multiply"
        />
      </button>

      <div
        v-else
        class="flex items-center gap-3 rounded-[20px] border border-red-200 bg-gradient-to-r from-red-50 via-rose-50/80 to-red-50 px-3 py-2.5 shadow-sm"
      >
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-200 via-rose-100 to-red-100 shadow-md shadow-red-400/25 ring-1 ring-red-300/50 transition hover:from-red-300 hover:to-rose-200 active:scale-95"
          :title="locale.t('sidebar.collapse')"
          @click="app.toggleSidebar()"
        >
          <img
            src="/brand/lieng-logo.png"
            alt="Lieng Mobile"
            class="h-[85%] w-[85%] object-contain mix-blend-multiply"
          />
        </button>
        <RouterLink
          :to="homeLink"
          class="min-w-0 flex-1 transition hover:opacity-80"
          :title="storeInfo.name"
        >
          <p class="truncate text-[16px] font-black tracking-tight text-[#111118]">{{ storeInfo.name }}</p>
          <p class="truncate text-[11px] font-medium text-slate-500">{{ branchLabel }}</p>
        </RouterLink>
      </div>
    </div>

    <nav
      :class="[
        'custom-scrollbar min-h-0 flex-1 overflow-y-auto py-2 pb-10',
        isCollapsed ? 'space-y-3 px-2' : 'space-y-6 px-4',
      ]"
    >
      <!-- POS nổi bật -->
      <div v-if="posLink" class="space-y-1">
        <RouterLink
          :to="posLink.to"
          :title="posLink.label"
          :class="[
            'group flex items-center rounded-[20px] transition-all',
            isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-4 py-3',
            activeName === posLink.name
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50 icon-active'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white',
          ]"
        >
          <div :class="['flex items-center', isCollapsed ? '' : '']">
            <span
              :class="[
                navIconBoxPosClass,
                !isCollapsed ? 'mr-3' : '',
                activeName === posLink.name ? navIconBoxPosActiveClass : '',
              ]"
            >
              <AdminNavIcon name="pos" />
            </span>
            <span v-if="!isCollapsed" class="text-[14px] font-bold">{{ posLink.label }}</span>
          </div>
          <svg
            v-if="!isCollapsed"
            class="h-3.5 w-3.5 shrink-0 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
          </svg>
        </RouterLink>
      </div>

      <div v-for="group in menuGroups" :key="group.label" class="space-y-1">
        <p
          v-if="!isCollapsed"
          class="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          {{ group.label }}
        </p>
        <template v-for="link in group.items" :key="link.name">
          <button
            v-if="link.locked"
            type="button"
            :title="`${link.label} — ${locale.t('nav.lockedHint')}`"
            :class="[
              'group flex min-w-0 items-center rounded-[20px] transition-all',
              isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5',
              'cursor-not-allowed text-slate-400 opacity-70',
            ]"
            @click.prevent
          >
            <div class="flex min-w-0 items-center">
              <span :class="[navIconBoxClass, !isCollapsed ? 'mr-3' : '', 'opacity-60']">
                <AdminNavIcon :name="link.name" />
              </span>
              <span v-if="!isCollapsed" class="truncate text-[14px] font-medium">{{ link.label }}</span>
            </div>
            <svg
              v-if="!isCollapsed"
              class="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V7.5a4.5 4.5 0 1 0-9 0v3m-.75 0h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z"
              />
            </svg>
          </button>
          <RouterLink
            v-else
            :to="link.to"
            :title="link.label"
            :class="[
              'group flex min-w-0 items-center rounded-[20px] transition-all',
              isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5',
              isLinkActive(link) ? navActiveClass : navDefaultClass,
            ]"
          >
            <div class="flex min-w-0 items-center">
              <span
                :class="[
                  navIconBoxClass,
                  !isCollapsed ? 'mr-3' : '',
                  isLinkActive(link) ? navIconBoxActiveClass : '',
                ]"
              >
                <AdminNavIcon :name="link.name" />
              </span>
              <span v-if="!isCollapsed" class="truncate text-[14px] font-medium">{{ link.label }}</span>
            </div>
            <svg
              v-if="!isCollapsed"
              class="ml-2 h-3.5 w-3.5 shrink-0 transition-colors"
              :class="isLinkActive(link) ? 'text-white/70' : 'text-slate-300 group-hover:text-red-600'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
            </svg>
          </RouterLink>
        </template>
      </div>
    </nav>

    <!-- Footer -->
    <div
      :class="[
        'z-10 shrink-0 border-t border-red-200 bg-[#fff7f7]',
        isCollapsed ? 'px-2 pb-3 pt-2' : 'px-4 pb-4 pt-3',
      ]"
    >
      <div
        :class="[
          'rounded-[20px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm',
          isCollapsed ? 'flex justify-center p-2' : 'p-2.5',
        ]"
      >
        <RouterLink
          v-if="isCollapsed"
          to="/profile"
          :title="auth.user?.name ?? locale.t('header.staff')"
          class="block"
        >
          <AppUserAvatar
            size="sm"
            :src="auth.user?.avatar_url"
            :alt="auth.user?.name ?? locale.t('header.staff')"
            class="shadow-sm"
          />
        </RouterLink>

        <template v-else>
          <div class="w-full">
            <div class="flex items-center gap-3">
              <AppUserAvatar
                size="sm"
                :src="auth.user?.avatar_url"
                :alt="auth.user?.name ?? locale.t('header.staff')"
                class="shadow-sm"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-bold text-[#111118]">{{ auth.user?.name ?? locale.t('header.staff') }}</p>
                <p class="truncate text-[11px] font-medium text-red-600">{{ roleLabel }}</p>
              </div>
            </div>
            <div class="mt-2.5 flex items-center justify-between border-t border-red-100 pt-2 text-[10px] text-slate-500">
              <span>{{ locale.t('sidebar.internalAccount') }}</span>
              <span class="rounded-full bg-white px-2 py-0.5 font-semibold text-red-600 ring-1 ring-red-100">{{ locale.t('sidebar.online') }}</span>
            </div>
            <div class="mt-2.5 border-t border-red-100 pt-2.5">
              <RouterLink
                to="/"
                class="flex items-center justify-between rounded-[14px] bg-white px-3 py-2.5 text-[12.5px] font-semibold text-slate-700 ring-1 ring-red-100 transition hover:bg-slate-50 hover:text-red-600"
              >
                <span class="flex items-center gap-2">
                  <span class="flex h-7 w-7 items-center justify-center rounded-[10px] bg-slate-100 text-slate-600">
                    <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9.75 4.07 5.47A2.25 2.25 0 0 1 6.26 3.75h11.48a2.25 2.25 0 0 1 2.18 1.72L21 9.75m-18 0A2.25 2.25 0 0 0 5.25 12h.188A2.25 2.25 0 0 0 7.5 10.688 2.25 2.25 0 0 0 9.563 12h.874A2.25 2.25 0 0 0 12.5 10.688 2.25 2.25 0 0 0 14.563 12h.874A2.25 2.25 0 0 0 17.5 10.688 2.25 2.25 0 0 0 19.563 12h.187A2.25 2.25 0 0 0 22 9.75M4.5 11.386V18A2.25 2.25 0 0 0 6.75 20.25h10.5A2.25 2.25 0 0 0 19.5 18v-6.614" />
                    </svg>
                  </span>
                  {{ locale.t('sidebar.storefront') }}
                </span>
                <svg class="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
                </svg>
              </RouterLink>
            </div>
          </div>
        </template>
      </div>
    </div>
  </aside>
</template>

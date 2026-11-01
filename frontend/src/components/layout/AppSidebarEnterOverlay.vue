<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePageTransitionStore } from '@/stores/pageTransition'
import { useAdminNav } from '@/composables/useAdminNav'
import { useLocaleStore } from '@/stores/locale'
import AdminNavIcon from '@/components/layout/AdminNavIcon.vue'
import AppUserAvatar from '@/components/common/AppUserAvatar.vue'

const pageTransition = usePageTransitionStore()
const auth = useAuthStore()
const route = useRoute()
const locale = useLocaleStore()
const { flatNav } = useAdminNav()

const phase = computed(() => pageTransition.sidebarPhase)
const visible = computed(() => phase.value !== 'idle')
const fading = computed(() => phase.value === 'expand' || phase.value === 'done')

const overlayRef = ref(null)
const logoStyle = ref({})
const avStyle = ref({})
const iconsVisible = ref(false)

const animIcons = computed(() => flatNav.value.slice(0, 9))

const PRODUCT_ROUTES = new Set(['products', 'product-edit'])
const IMPORT_ROUTES = new Set(['stock-imports', 'stock-import-create', 'stock-import-detail'])

function isIconActive(name) {
  const current = route.name
  if (name === 'products') return PRODUCT_ROUTES.has(current)
  if (name === 'stock-imports') return IMPORT_ROUTES.has(current)
  return current === name
}

function resetOverlay() {
  logoStyle.value = {}
  avStyle.value = {}
  iconsVisible.value = false
}

async function runSplitMotion() {
  await nextTick()
  const oh = overlayRef.value?.offsetHeight ?? 0
  const logoTo = 44 - (oh / 2 - 23)
  const avTo = oh - 64 - (oh / 2 - 19)
  const transition = 'transform 0.82s cubic-bezier(0.4, 0, 0.2, 1)'

  logoStyle.value = { transform: `translateY(${logoTo}px)`, transition }
  avStyle.value = { transform: `translateY(${avTo}px)`, transition }

  window.setTimeout(() => {
    if (phase.value === 'split' || phase.value === 'expand') {
      iconsVisible.value = true
    }
  }, 130)
}

watch(
  phase,
  async (value) => {
    if (value === 'cluster') {
      resetOverlay()
    } else if (value === 'split') {
      iconsVisible.value = false
      await runSplitMotion()
    } else if (value === 'idle') {
      resetOverlay()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="visible"
    ref="overlayRef"
    class="sidebar-enter-overlay"
    :class="{ 'sidebar-enter-overlay--fading': fading }"
    aria-hidden="true"
  >
    <div class="sidebar-anim-cluster">
      <div class="sidebar-anim-logo" :style="logoStyle">
        <img
          src="/brand/lieng-logo.png"
          alt="Lieng Mobile"
          class="h-[70%] w-[70%] object-contain mix-blend-multiply"
        />
      </div>
      <div class="sidebar-anim-av" :style="avStyle">
        <AppUserAvatar
          size="sm"
          :src="auth.user?.avatar_url"
          :alt="auth.user?.name ?? locale.t('header.staff')"
        />
      </div>
    </div>

    <div class="sidebar-anim-icons" :class="{ 'sidebar-anim-icons--visible': iconsVisible }">
      <div
        v-for="(item, index) in animIcons"
        :key="item.name"
        class="sidebar-anim-icon"
        :class="{
          'sidebar-anim-icon--hl': isIconActive(item.name),
          'sidebar-anim-icon--revealed': iconsVisible,
        }"
        :style="iconsVisible ? { transitionDelay: `${index * 65}ms` } : undefined"
      >
        <AdminNavIcon :name="item.name" />
      </div>
    </div>
  </div>
</template>

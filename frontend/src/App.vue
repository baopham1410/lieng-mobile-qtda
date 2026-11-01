<script setup>
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import PosLayout from '@/layouts/PosLayout.vue'
import IntroLayout from '@/layouts/IntroLayout.vue'
import AdminPageSkeleton from '@/components/common/AdminPageSkeleton.vue'
import AppLoadingOverlay from '@/components/common/AppLoadingOverlay.vue'
import AppPageTransition from '@/components/transitions/AppPageTransition.vue'
import { usePageTransitionStore } from '@/stores/pageTransition'

const route = useRoute()
const router = useRouter()
const pageTransition = usePageTransitionStore()
const isNavigating = ref(false)
const isPathNavigation = ref(false)

router.beforeEach((to, from) => {
  isPathNavigation.value = to.path !== from.path
  isNavigating.value = true
})

router.afterEach(() => {
  isNavigating.value = false
})

const layout = computed(() => {
  switch (route.meta.layout) {
    case 'intro':
      return IntroLayout
    case 'auth':
      return AuthLayout
    case 'pos':
      return PosLayout
    default:
      return AdminLayout
  }
})

const showSkeleton = computed(
  () =>
    isPathNavigation.value &&
    !pageTransition.active &&
    isNavigating.value &&
    (route.meta.layout === 'admin' || route.meta.layout === 'pos' || !route.meta.layout),
)
</script>

<template>
  <AppPageTransition />
  <AppLoadingOverlay />
  <component :is="layout">
    <AdminPageSkeleton v-if="showSkeleton" />
    <RouterView v-else :key="route.path" />
  </component>
</template>

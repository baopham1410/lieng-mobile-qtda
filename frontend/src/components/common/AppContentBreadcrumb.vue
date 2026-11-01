<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { pageMeta as staticPageMeta } from '@/data/adminNav'
import { useLocaleStore } from '@/stores/locale'

const route = useRoute()
const locale = useLocaleStore()

const meta = computed(() => {
  const localized = locale.pageMeta(route.name) ?? staticPageMeta[route.name] ?? { title: 'Lieng Mobile' }
  const parent = staticPageMeta[route.name]?.parent
  return parent ? { ...localized, parent } : localized
})

const displayTitle = computed(() => {
  if (route.name === 'stock-import-detail' && route.params.code) {
    return route.params.code
  }
  return meta.value.title
})

const breadcrumb = computed(() => {
  const parent = meta.value.parent
  if (!parent) return null

  return {
    to: parent.to,
    label: parent.name ? locale.t(`nav.${parent.name}`) : parent.label,
  }
})
</script>

<template>
  <div v-if="breadcrumb" class="flex items-center gap-2 text-[12px] font-semibold">
    <RouterLink :to="breadcrumb.to" class="text-slate-400 transition hover:text-red-600">
      {{ breadcrumb.label }}
    </RouterLink>
    <svg class="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
    </svg>
    <span class="text-red-600">{{ displayTitle }}</span>
  </div>
</template>

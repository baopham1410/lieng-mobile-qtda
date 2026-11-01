<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppDetailSkeleton from '@/components/common/AppDetailSkeleton.vue'

const route = useRoute()

const isDetailRoute = computed(() => {
  const name = route.name
  if (!name) return false
  return (
    name === 'stock-import-detail' ||
    name === 'stock-import-create' ||
    name === 'product-edit'
  )
})
</script>

<template>
  <AppDetailSkeleton v-if="isDetailRoute" variant="page" :show-image="route.name === 'product-edit'" />

  <div v-else class="animate-pulse space-y-6 p-6 sm:p-8">
    <div class="h-4 w-40 rounded-full bg-red-100" />
    <div class="h-36 rounded-[24px] bg-gradient-to-r from-red-100 to-rose-50" />
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="n in 4" :key="n" class="h-28 rounded-[24px] bg-red-50" />
    </div>
    <div class="h-24 rounded-[24px] bg-red-50" />
    <div class="h-80 rounded-[24px] bg-red-50" />
  </div>
</template>

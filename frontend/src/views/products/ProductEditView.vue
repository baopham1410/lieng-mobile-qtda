<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDetailSkeleton from '@/components/common/AppDetailSkeleton.vue'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  router.replace({
    name: 'products',
    query: { edit: route.params.id },
  })
})
</script>

<template>
  <AppDetailSkeleton variant="page" show-image />
</template>

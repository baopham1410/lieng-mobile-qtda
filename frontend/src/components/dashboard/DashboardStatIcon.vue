<script setup>
import AppStatIcon from '@/components/common/AppStatIcon.vue'

defineProps({
  name: { type: String, required: true },
})
</script>

<template>
  <AppStatIcon :name="name" />
</template>

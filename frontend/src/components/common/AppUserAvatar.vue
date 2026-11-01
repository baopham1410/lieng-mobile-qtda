<script setup>
import { computed } from 'vue'
import { DEFAULT_USER_AVATAR, resolveAvatarUrl } from '@/constants/userAvatar'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const sizeClass = {
  sm: 'h-8 w-8 rounded-[6px]',
  md: 'h-9 w-9 rounded-[8px]',
  lg: 'h-20 w-20 rounded-[10px]',
  xl: 'h-24 w-24 rounded-[12px]',
}

const avatarSrc = computed(() => resolveAvatarUrl(props.src || DEFAULT_USER_AVATAR))
</script>

<template>
  <img
    :src="avatarSrc"
    :alt="alt"
    :class="[sizeClass[size] ?? sizeClass.md, 'shrink-0 object-cover ring-2 ring-red-600/20']"
  />
</template>

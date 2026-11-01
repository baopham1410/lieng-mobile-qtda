<script setup>
import { computed, ref } from 'vue'
import { resolveProductImageUrl } from '@/utils/productImage'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: 'Sản phẩm',
  },
  categorySlug: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
  },
})

const imageFailed = ref(false)

const imageUrl = computed(() => resolveProductImageUrl(props.src))

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-10 w-10 rounded-[12px]'
    case 'lg':
      return 'h-16 w-16 rounded-[16px]'
    default:
      return 'h-12 w-12 rounded-[14px]'
  }
})

const fallbackKind = computed(() => {
  const slug = props.categorySlug || ''
  if (slug.includes('phu-kien') || slug.includes('accessory')) return 'accessory'
  if (slug.includes('tablet')) return 'tablet'
  if (slug.includes('tivi') || slug.includes('tu-lanh') || slug.includes('quat')) return 'appliance'
  return 'phone'
})
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden border border-red-100 bg-gradient-to-br from-[#fff7f7] to-red-50 shadow-sm"
    :class="sizeClass"
  >
    <img
      v-if="imageUrl && !imageFailed"
      :src="imageUrl"
      :alt="name"
      class="h-full w-full object-contain p-1"
      loading="lazy"
      @error="imageFailed = true"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center p-1.5"
      aria-hidden="true"
    >
      <div
        v-if="fallbackKind === 'phone'"
        class="h-[88%] w-[46%] rounded-[8px] border-[2px] border-slate-700 bg-slate-800 shadow-inner"
      />
      <div
        v-else-if="fallbackKind === 'tablet'"
        class="h-[72%] w-[58%] rounded-[6px] border-[2px] border-slate-700 bg-slate-800 shadow-inner"
      />
      <div
        v-else-if="fallbackKind === 'accessory'"
        class="h-2.5 w-7 rounded-full bg-red-300/80 ring-2 ring-red-400/40"
      />
      <div
        v-else
        class="h-[70%] w-[70%] rounded-[8px] border-2 border-dashed border-red-200 bg-white/70"
      />
    </div>
  </div>
</template>

<script setup>
import AppStatIcon from '@/components/common/AppStatIcon.vue'

defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: { type: String, required: true },
  iconColor: { type: String, default: 'text-red-600 bg-red-50' },
  valueClass: { type: String, default: 'text-[#111118]' },
  valueSize: { type: String, default: 'lg' },
  hoverable: { type: Boolean, default: false },
  hintClass: { type: String, default: 'text-slate-500' },
})
</script>

<template>
  <div
    :class="[
      'rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]',
      hoverable ? 'group p-6 transition-transform hover:-translate-y-1' : 'p-5',
    ]"
  >
    <div class="flex items-start justify-between">
      <p class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ label }}</p>
      <div
        class="flex h-10 w-10 items-center justify-center rounded-[14px] transition-colors"
        :class="[iconColor, hoverable ? 'group-hover:bg-red-600 group-hover:text-white' : '']"
      >
        <AppStatIcon :name="icon" />
      </div>
    </div>
    <div
      :class="[
        'break-words font-extrabold leading-tight tracking-tight',
        valueSize === 'lg' ? (hoverable ? 'mt-4 text-[26px] xl:text-[28px]' : 'mt-3 text-3xl') : 'mt-3 text-[26px]',
        valueClass,
      ]"
    >
      <slot />
    </div>
    <p v-if="hint" class="mt-1 text-xs font-medium" :class="hintClass">{{ hint }}</p>
  </div>
</template>

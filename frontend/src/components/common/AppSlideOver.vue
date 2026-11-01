<script setup>
defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex justify-end bg-black/40"
      @click.self="emit('close')"
    >
      <div class="custom-scrollbar-content h-full w-full max-w-md overflow-y-auto border-l border-red-200 bg-white shadow-2xl">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

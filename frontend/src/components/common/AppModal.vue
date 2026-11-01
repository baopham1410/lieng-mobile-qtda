<script setup>
defineProps({
  open: { type: Boolean, default: false },
  persistent: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      @click.self="!persistent && emit('close')"
    >
      <slot />
    </div>
  </Teleport>
</template>

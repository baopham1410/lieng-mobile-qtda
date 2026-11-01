<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { usePageTransitionStore } from '@/stores/pageTransition'

const transition = usePageTransitionStore()
const visible = computed(() => transition.splitActive)
const panelOut = ref(false)

watch(
  () => transition.splitActive,
  async (active) => {
    if (!active) {
      panelOut.value = false
      return
    }

    panelOut.value = false
    await nextTick()
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve)
      })
    })
    panelOut.value = true
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="login-split-curtain"
      aria-hidden="true"
    >
      <div
        class="login-split-panel login-split-panel--brand"
        :class="{ 'login-split-panel--out': panelOut }"
      />
      <div
        class="login-split-panel login-split-panel--form"
        :class="{ 'login-split-panel--out': panelOut }"
      />
    </div>
  </Teleport>
</template>

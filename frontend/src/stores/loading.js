import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const SHOW_DELAY_MS = 260
const MIN_VISIBLE_MS = 300

export const useLoadingStore = defineStore('loading', () => {
  const pendingCount = ref(0)
  const message = ref('')
  const visible = ref(false)

  let showTimer = null
  let hideTimer = null
  let shownAt = 0

  function clearShowTimer() {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  function clearHideTimer() {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function scheduleShow() {
    if (visible.value || showTimer) return

    showTimer = setTimeout(() => {
      showTimer = null
      if (pendingCount.value > 0) {
        visible.value = true
        shownAt = Date.now()
      }
    }, SHOW_DELAY_MS)
  }

  function scheduleHide() {
    clearShowTimer()

    if (!visible.value) {
      if (pendingCount.value === 0) message.value = ''
      return
    }

    clearHideTimer()
    const elapsed = Date.now() - shownAt
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)

    hideTimer = setTimeout(() => {
      hideTimer = null
      if (pendingCount.value === 0) {
        visible.value = false
        message.value = ''
      }
    }, wait)
  }

  function start(msg = '') {
    pendingCount.value += 1
    if (msg) message.value = msg
    clearHideTimer()
    scheduleShow()
  }

  function stop() {
    pendingCount.value = Math.max(0, pendingCount.value - 1)
    if (pendingCount.value === 0) {
      scheduleHide()
    }
  }

  function forceHide() {
    pendingCount.value = 0
    clearShowTimer()
    clearHideTimer()
    visible.value = false
    message.value = ''
  }

  async function wrap(promise, msg = '') {
    start(msg)
    try {
      return await promise
    } finally {
      stop()
    }
  }

  const isBusy = computed(() => pendingCount.value > 0)

  return {
    visible,
    message,
    isBusy,
    start,
    stop,
    wrap,
    forceHide,
  }
})

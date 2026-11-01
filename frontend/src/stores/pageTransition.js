import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'

const SPLIT_START_MS = 30
/** Chờ panel overlay vẽ xong + bắt đầu split trước khi đổi route */
const SPLIT_BEFORE_NAV_MS = 90
const SPLIT_END_MS = 1180
const SETTLE_MS = 360
/** Khớp prototype HTML: cluster → split (logo/avatar + icon) → expand */
const SIDEBAR_CLUSTER_MS = 420
const SIDEBAR_SPLIT_MS = 820
const SIDEBAR_EXPAND_MS = 440

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

export const usePageTransitionStore = defineStore('pageTransition', () => {
  const active = ref(false)
  const phase = ref('idle') // idle | splitting | content
  const splitActive = ref(false)
  const targetLayout = ref('admin')
  const running = ref(false)
  /** idle | cluster | split | expand | done */
  const sidebarPhase = ref('idle')

  async function runSidebarEnter(appStore) {
    appStore?.setSidebarOpen(false)
    sidebarPhase.value = 'cluster'
    await wait(SIDEBAR_CLUSTER_MS)
    sidebarPhase.value = 'split'
    await wait(SIDEBAR_SPLIT_MS)
    sidebarPhase.value = 'expand'
    appStore?.setSidebarOpen(true)
    await wait(SIDEBAR_EXPAND_MS)
    sidebarPhase.value = 'done'
    await wait(80)
  }

  async function playLoginEnter(router, to, appStore = null) {
    if (running.value) return
    running.value = true
    active.value = true
    phase.value = 'splitting'
    splitActive.value = false
    sidebarPhase.value = 'idle'
    document.body.classList.add('page-transition-active')

    await wait(SPLIT_START_MS)
    splitActive.value = true
    await waitForPaint()
    await wait(SPLIT_BEFORE_NAV_MS)

    const resolved = router.resolve(to)
    targetLayout.value = resolved.meta?.layout ?? 'admin'

    await router.push(to)
    await nextTick()
    await waitForPaint()

    const splitRemaining = SPLIT_END_MS - SPLIT_START_MS - SPLIT_BEFORE_NAV_MS
    if (splitRemaining > 0) {
      await wait(splitRemaining)
    }
    splitActive.value = false
    await waitForPaint()

    // Sidebar + header + panel reveal cùng lúc khi curtain kết thúc
    phase.value = 'content'
    await runSidebarEnter(appStore)

    await wait(SETTLE_MS)

    phase.value = 'idle'
    active.value = false
    running.value = false
    sidebarPhase.value = 'idle'
    document.body.classList.remove('page-transition-active')
  }

  function reset() {
    active.value = false
    phase.value = 'idle'
    splitActive.value = false
    running.value = false
    sidebarPhase.value = 'idle'
    document.body.classList.remove('page-transition-active')
  }

  return {
    active,
    phase,
    splitActive,
    targetLayout,
    running,
    sidebarPhase,
    playLoginEnter,
    reset,
  }
})

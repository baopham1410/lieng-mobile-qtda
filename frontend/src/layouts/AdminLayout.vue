<script setup>
import { computed } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ChatBubbleWidget from '@/components/chat/ChatBubbleWidget.vue'
import { usePageTransitionStore } from '@/stores/pageTransition'

const pageTransition = usePageTransitionStore()

const layoutEnterClass = computed(() => {
  const isAdminTransition =
    pageTransition.active && pageTransition.targetLayout === 'admin'

  return {
    'admin-enter-active': isAdminTransition,
    'admin-enter-reveal': isAdminTransition && pageTransition.phase === 'content',
  }
})
</script>

<template>
  <div
    :class="[
      'flex h-screen overflow-hidden bg-[#fdf2f2] font-sans text-slate-800 selection:bg-red-500/20 selection:text-red-700',
      layoutEnterClass,
    ]"
    style="font-family: 'Plus Jakarta Sans', sans-serif"
  >
    <AppSidebar class="admin-chrome-sidebar no-print" />

    <main class="admin-content-shell flex h-screen flex-1 flex-col gap-5 overflow-hidden py-4 pl-4 pr-4 lg:pl-6">
      <div class="admin-chrome-header no-print shrink-0">
        <AppHeader />
      </div>

      <div
        class="admin-chrome-panel relative flex flex-1 flex-col overflow-hidden rounded-[32px] border border-red-200 bg-[#fff7f7] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <div class="custom-scrollbar-content admin-page-content relative z-0 flex-1 overflow-y-auto">
          <slot />
        </div>
      </div>
    </main>

    <!-- Bot chat nội bộ — NV đã login -->
    <ChatBubbleWidget variant="internal" />
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 12mm 10mm;
  }

  html,
  body {
    background: white !important;
    height: auto !important;
    overflow: visible !important;
  }

  .no-print {
    display: none !important;
  }

  .admin-content-shell,
  .admin-chrome-panel,
  .admin-page-content {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Chỉ in tờ sao kê */
  body.printing-quan-statement * {
    visibility: hidden !important;
  }

  body.printing-quan-statement .quan-print-target,
  body.printing-quan-statement .quan-print-target * {
    visibility: visible !important;
  }

  body.printing-quan-statement .quan-print-target {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
}
</style>

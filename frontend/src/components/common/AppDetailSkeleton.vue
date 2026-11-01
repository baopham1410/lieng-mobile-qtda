<script setup>
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps({
  /** panel = slide-over · page = trang chi tiết full */
  variant: {
    type: String,
    default: 'page',
  },
  showImage: {
    type: Boolean,
    default: false,
  },
  showSidebar: {
    type: Boolean,
    default: true,
  },
})

const locale = useLocaleStore()
const isPanel = computed(() => props.variant === 'panel')
</script>

<template>
  <div
    class="app-detail-skeleton"
    :class="isPanel ? 'app-detail-skeleton--panel' : 'app-detail-skeleton--page'"
    role="status"
    aria-live="polite"
    :aria-label="locale.t('common.loading')"
  >
    <template v-if="isPanel">
      <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1 space-y-2.5">
            <div class="app-detail-skeleton-shimmer h-3 w-24 rounded-full" />
            <div class="app-detail-skeleton-shimmer h-6 w-44 max-w-full rounded-[10px]" />
          </div>
          <div class="app-detail-skeleton-shimmer h-9 w-16 shrink-0 rounded-[12px]" />
        </div>
        <div class="app-detail-skeleton-shimmer mt-3 h-6 w-20 rounded-full" />
      </div>

      <div class="space-y-6 p-6">
        <div
          v-if="showImage"
          class="flex flex-wrap items-start gap-4 rounded-[18px] border border-red-100 bg-[#fffafa] p-4 ring-1 ring-red-50"
        >
          <div class="app-detail-skeleton-shimmer h-16 w-16 shrink-0 rounded-[16px]" />
          <div class="min-w-0 flex-1 space-y-2.5">
            <div class="app-detail-skeleton-shimmer h-3 w-28 rounded-full" />
            <div class="app-detail-skeleton-shimmer h-3 w-full max-w-xs rounded-full" />
            <div class="flex gap-2 pt-1">
              <div class="app-detail-skeleton-shimmer h-9 w-24 rounded-[12px]" />
              <div class="app-detail-skeleton-shimmer h-9 w-28 rounded-[12px]" />
            </div>
          </div>
        </div>

        <div class="rounded-[18px] bg-red-50/50 p-4 ring-1 ring-red-100">
          <div class="app-detail-skeleton-shimmer h-3 w-32 rounded-full" />
          <div class="mt-4 space-y-3">
            <div class="app-detail-skeleton-shimmer h-10 w-full rounded-[14px]" />
            <div class="grid grid-cols-2 gap-3">
              <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
              <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
              <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            </div>
            <div class="app-detail-skeleton-shimmer h-20 w-full rounded-[14px]" />
          </div>
        </div>

        <div class="rounded-[18px] border border-red-100 bg-white p-4">
          <div class="app-detail-skeleton-shimmer h-3 w-24 rounded-full" />
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
          </div>
        </div>

        <div class="rounded-[18px] border border-red-100 bg-white p-4">
          <div class="app-detail-skeleton-shimmer h-3 w-20 rounded-full" />
          <div class="mt-4 space-y-2.5">
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
            <div class="app-detail-skeleton-shimmer h-10 rounded-[14px]" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="space-y-6 p-6 sm:p-8">
        <div class="app-detail-skeleton-shimmer h-4 w-48 rounded-full" />

        <div class="rounded-[24px] border border-red-200/60 bg-gradient-to-r from-red-100 to-rose-50 p-6 sm:p-8">
          <div class="space-y-3">
            <div class="app-detail-skeleton-shimmer h-3 w-28 rounded-full bg-white/60" />
            <div class="app-detail-skeleton-shimmer h-8 w-56 max-w-full rounded-[12px] bg-white/70" />
            <div class="app-detail-skeleton-shimmer h-3 w-full max-w-xl rounded-full bg-white/50" />
            <div class="app-detail-skeleton-shimmer h-3 w-4/5 max-w-lg rounded-full bg-white/50" />
          </div>
        </div>

        <div class="grid gap-6" :class="showSidebar ? 'xl:grid-cols-[minmax(0,1.5fr)_380px]' : ''">
          <div class="space-y-6">
            <div
              v-if="showImage"
              class="flex flex-wrap items-start gap-4 rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
            >
              <div class="app-detail-skeleton-shimmer h-16 w-16 shrink-0 rounded-[16px]" />
              <div class="min-w-0 flex-1 space-y-2.5">
                <div class="app-detail-skeleton-shimmer h-3 w-28 rounded-full" />
                <div class="app-detail-skeleton-shimmer h-3 w-full max-w-sm rounded-full" />
                <div class="flex gap-2 pt-1">
                  <div class="app-detail-skeleton-shimmer h-9 w-24 rounded-[12px]" />
                  <div class="app-detail-skeleton-shimmer h-9 w-28 rounded-[12px]" />
                </div>
              </div>
            </div>

            <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div class="app-detail-skeleton-shimmer h-5 w-40 rounded-[10px]" />
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px] md:col-span-2" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-24 rounded-[16px] md:col-span-2" />
              </div>
            </div>

            <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div class="app-detail-skeleton-shimmer h-5 w-36 rounded-[10px]" />
              <div class="mt-4 app-detail-skeleton-shimmer h-12 w-full rounded-[14px]" />
              <div class="mt-5 grid grid-cols-2 gap-4">
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
              </div>
            </div>
          </div>

          <div v-if="showSidebar" class="space-y-6">
            <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div class="app-detail-skeleton-shimmer h-5 w-24 rounded-[10px]" />
              <div class="mt-5 space-y-4">
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
                <div class="app-detail-skeleton-shimmer h-11 rounded-[16px]" />
              </div>
            </div>
            <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div class="app-detail-skeleton-shimmer h-11 w-full rounded-[16px]" />
              <div class="app-detail-skeleton-shimmer mt-3 h-11 w-full rounded-[16px]" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app-detail-skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgb(254 242 242 / 95%) 0%,
    rgb(255 255 255 / 98%) 45%,
    rgb(254 226 226 / 90%) 100%
  );
  background-size: 220% 100%;
  animation: app-detail-shimmer 1.35s ease-in-out infinite;
}

.app-detail-skeleton--panel .app-detail-skeleton-shimmer {
  animation-delay: calc(var(--skeleton-i, 0) * 60ms);
}

@keyframes app-detail-shimmer {
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -120% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-detail-skeleton-shimmer {
    animation: none;
    background: rgb(254 242 242);
  }
}
</style>

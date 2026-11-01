<script setup>
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps({
  /** xs | sm | md | lg */
  size: {
    type: String,
    default: 'md',
  },
  /** Căn giữa trong vùng block (bảng, form…) */
  block: {
    type: Boolean,
    default: false,
  },
  /** Spinner nhỏ trong dòng chữ (header bảng) */
  inline: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
})

const locale = useLocaleStore()

const ariaLabel = computed(() => props.message || locale.t('common.loading'))

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'app-inline-loader--xs'
    case 'sm':
      return 'app-inline-loader--sm'
    case 'lg':
      return 'app-inline-loader--lg'
    default:
      return 'app-inline-loader--md'
  }
})
</script>

<template>
  <div
    class="app-inline-loader"
    :class="[
      sizeClass,
      {
        'app-inline-loader--block': block,
        'app-inline-loader--inline': inline,
      },
    ]"
    role="status"
    aria-live="polite"
    :aria-label="ariaLabel"
  >
    <div class="app-inline-loader-spinner" aria-hidden="true">
      <span class="app-inline-loader-ring app-inline-loader-ring--outer" />
      <span class="app-inline-loader-ring app-inline-loader-ring--inner" />
      <span class="app-inline-loader-dot" />
    </div>
  </div>
</template>

<style scoped>
.app-inline-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-inline-loader--block {
  display: flex;
  width: 100%;
  padding: 2.5rem 1rem;
}

.app-inline-loader--inline {
  vertical-align: middle;
}

.app-inline-loader-spinner {
  position: relative;
  flex-shrink: 0;
}

.app-inline-loader--xs .app-inline-loader-spinner {
  width: 16px;
  height: 16px;
}

.app-inline-loader--sm .app-inline-loader-spinner {
  width: 22px;
  height: 22px;
}

.app-inline-loader--md .app-inline-loader-spinner {
  width: 40px;
  height: 40px;
}

.app-inline-loader--lg .app-inline-loader-spinner {
  width: 52px;
  height: 52px;
}

.app-inline-loader-ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 2px solid transparent;
  animation: app-inline-loader-spin 0.85s linear infinite;
}

.app-inline-loader--xs .app-inline-loader-ring {
  border-width: 1.5px;
}

.app-inline-loader--lg .app-inline-loader-ring {
  border-width: 3px;
}

.app-inline-loader-ring--outer {
  border-top-color: #dc2626;
  border-right-color: rgb(220 38 38 / 30%);
}

.app-inline-loader-ring--inner {
  inset: 18%;
  border-bottom-color: #7a0c10;
  border-left-color: rgb(122 12 16 / 25%);
  animation-duration: 0.65s;
  animation-direction: reverse;
}

.app-inline-loader-dot {
  position: absolute;
  inset: 38%;
  border-radius: 9999px;
  background: linear-gradient(135deg, #dc2626, #7a0c10);
  opacity: 0.9;
  animation: app-inline-loader-pulse 1.2s ease-in-out infinite;
}

@keyframes app-inline-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes app-inline-loader-pulse {
  0%,
  100% {
    transform: scale(0.88);
    opacity: 0.65;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-inline-loader-ring {
    animation-duration: 1.4s;
  }

  .app-inline-loader-dot {
    animation: none;
  }
}
</style>

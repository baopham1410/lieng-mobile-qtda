<script setup>
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  /** search | inbox | folder | cart | chart | users | box | shield */
  icon: {
    type: String,
    default: 'search',
  },
  /** sm | md */
  size: {
    type: String,
    default: 'md',
  },
})

const locale = useLocaleStore()

const displayTitle = computed(() => props.title || locale.t('common.noResults'))
</script>

<template>
  <div
    class="app-empty-state"
    :class="size === 'sm' ? 'app-empty-state--sm' : 'app-empty-state--md'"
    role="status"
  >
    <div class="app-empty-state-icon" aria-hidden="true">
      <svg class="app-empty-state-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
        <path
          v-if="icon === 'search'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
        />
        <path
          v-else-if="icon === 'inbox'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.25 7.5v-.243a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V7.5Zm0 0-6.75 4.5-6.75-4.5"
        />
        <path
          v-else-if="icon === 'folder'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 12.75V6A2.25 2.25 0 0 1 4.5 3.75h4.086a1.125 1.125 0 0 1 .795.329l1.086 1.086a1.125 1.125 0 0 0 .795.329H19.5A2.25 2.25 0 0 1 21.75 7.5v10.125A2.25 2.25 0 0 1 19.5 19.875H4.5A2.25 2.25 0 0 1 2.25 17.625v-4.875Z"
        />
        <path
          v-else-if="icon === 'cart'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h9.128a1.125 1.125 0 0 0 1.086-.835l2.928-11.02A.75.75 0 0 0 19.928 2.25H5.106M7.5 14.25 5.106 5.272M7.5 14.25l-1.125 3.75M16.5 14.25l1.125 3.75M9 20.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        />
        <path
          v-else-if="icon === 'chart'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
        <path
          v-else-if="icon === 'users'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.193M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
        <path
          v-else-if="icon === 'box'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
        <path
          v-else-if="icon === 'shield'"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
        <path
          v-else
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
        />
      </svg>
    </div>

    <p class="app-empty-state-title">{{ displayTitle }}</p>

    <p v-if="description" class="app-empty-state-desc">{{ description }}</p>
    <div v-else-if="$slots.description" class="app-empty-state-desc">
      <slot name="description" />
    </div>

    <div v-if="$slots.action" class="app-empty-state-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.app-empty-state--md {
  padding: 2.5rem 1.5rem;
}

.app-empty-state--sm {
  padding: 1.75rem 1rem;
}

.app-empty-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: linear-gradient(145deg, #fff7f7 0%, #fee2e2 100%);
  color: #b91c1c;
  box-shadow:
    0 4px 16px rgb(122 12 16 / 8%),
    inset 0 1px 0 rgb(255 255 255 / 80%);
  border: 1px solid rgb(254 202 202 / 80%);
}

.app-empty-state--md .app-empty-state-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
}

.app-empty-state--sm .app-empty-state-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.625rem;
  border-radius: 14px;
}

.app-empty-state--md .app-empty-state-svg {
  width: 1.75rem;
  height: 1.75rem;
}

.app-empty-state--sm .app-empty-state-svg {
  width: 1.375rem;
  height: 1.375rem;
}

.app-empty-state-title {
  margin: 0;
  max-width: 24rem;
  font-weight: 700;
  color: #111118;
  line-height: 1.45;
}

.app-empty-state--md .app-empty-state-title {
  font-size: 0.9375rem;
}

.app-empty-state--sm .app-empty-state-title {
  font-size: 0.8125rem;
}

.app-empty-state-desc {
  margin: 0.375rem 0 0;
  max-width: 26rem;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: rgb(100 116 139);
}

.app-empty-state-action {
  margin-top: 1rem;
}
</style>

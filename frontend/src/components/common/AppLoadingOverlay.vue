<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import { useLocaleStore } from '@/stores/locale'
import { usePageTransitionStore } from '@/stores/pageTransition'
import { storeInfo } from '@/data/storeIntro'

const loading = useLoadingStore()
const auth = useAuthStore()
const locale = useLocaleStore()
const pageTransition = usePageTransitionStore()

const open = computed(
  () => (loading.visible || auth.loading) && !pageTransition.active,
)

const label = computed(
  () => loading.message || locale.t('common.loading'),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="app-loading-fade">
      <div
        v-if="open"
        class="app-loading-overlay"
        role="status"
        aria-live="polite"
        aria-busy="true"
        :aria-label="label"
      >
        <div class="app-loading-card">
          <div class="app-loading-spinner" aria-hidden="true">
            <span class="app-loading-ring app-loading-ring--outer" />
            <span class="app-loading-ring app-loading-ring--inner" />
            <span class="app-loading-core">
              <img
                src="/brand/lieng-logo.png"
                alt=""
                class="app-loading-logo"
                width="36"
                height="36"
              />
            </span>
          </div>

          <p class="app-loading-title">{{ storeInfo.name }}</p>
          <p class="app-loading-text">{{ label }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(253 242 242 / 72%);
  backdrop-filter: blur(6px);
}

.app-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 220px;
  padding: 1.75rem 2rem 1.5rem;
  border-radius: 28px;
  border: 1px solid rgb(254 202 202);
  background: linear-gradient(180deg, #fff7f7 0%, #ffffff 100%);
  box-shadow:
    0 8px 30px rgb(122 12 16 / 8%),
    0 0 0 1px rgb(255 255 255 / 80%) inset;
}

.app-loading-spinner {
  position: relative;
  width: 72px;
  height: 72px;
}

.app-loading-ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 3px solid transparent;
  animation: app-loading-spin 0.95s linear infinite;
}

.app-loading-ring--outer {
  border-top-color: #dc2626;
  border-right-color: rgb(220 38 38 / 35%);
}

.app-loading-ring--inner {
  inset: 8px;
  border-bottom-color: #7a0c10;
  border-left-color: rgb(122 12 16 / 30%);
  animation-duration: 0.75s;
  animation-direction: reverse;
}

.app-loading-core {
  position: absolute;
  inset: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 2px 8px rgb(122 12 16 / 10%);
}

.app-loading-logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.app-loading-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #7a0c10;
}

.app-loading-text {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(100 116 139);
}

.app-loading-fade-enter-active,
.app-loading-fade-leave-active {
  transition: opacity 0.22s ease;
}

.app-loading-fade-enter-active .app-loading-card,
.app-loading-fade-leave-active .app-loading-card {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-loading-fade-enter-from,
.app-loading-fade-leave-to {
  opacity: 0;
}

.app-loading-fade-enter-from .app-loading-card,
.app-loading-fade-leave-to .app-loading-card {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}

@keyframes app-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-loading-ring {
    animation-duration: 1.4s;
  }
}
</style>

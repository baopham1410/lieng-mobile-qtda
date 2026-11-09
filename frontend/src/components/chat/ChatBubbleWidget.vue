<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { getBotMeta, mockBotReply, splitBotMarkdown } from '@/mocks/chatbotMock'

const props = defineProps({
  /** public = khách ngoài | internal = NV admin */
  variant: {
    type: String,
    default: 'public',
    validator: (v) => ['public', 'internal'].includes(v),
  },
})

const meta = computed(() => getBotMeta(props.variant))
const open = ref(false)
const draft = ref('')
const sending = ref(false)
const listEl = ref(null)

const messages = ref([])

function seedGreeting() {
  messages.value = [
    {
      id: 'greet',
      role: 'assistant',
      content: meta.value.greeting,
      at: new Date().toISOString(),
    },
  ]
}

seedGreeting()

watch(
  () => props.variant,
  () => {
    seedGreeting()
    draft.value = ''
  },
)

const isPublic = computed(() => props.variant === 'public')

const panelTone = computed(() =>
  isPublic.value
    ? {
        header: 'from-rose-600 to-orange-500',
        fab: 'from-rose-600 to-orange-500 shadow-rose-600/40',
        bubbleUser: 'bg-rose-600 text-white',
        chip: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
        ring: 'ring-rose-200',
      }
    : {
        header: 'from-red-700 to-rose-600',
        fab: 'from-red-700 to-rose-600 shadow-red-700/35',
        bubbleUser: 'bg-red-700 text-white',
        chip: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
        ring: 'ring-red-200',
      },
)

async function scrollBottom() {
  await nextTick()
  if (listEl.value) {
    listEl.value.scrollTop = listEl.value.scrollHeight
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) scrollBottom()
}

function close() {
  open.value = false
}

async function sendText(raw) {
  const text = String(raw || '').trim()
  if (!text || sending.value) return

  messages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: text,
    at: new Date().toISOString(),
  })
  draft.value = ''
  sending.value = true
  await scrollBottom()

  try {
    const reply = await mockBotReply(props.variant, text)
    messages.value.push(reply)
  } finally {
    sending.value = false
    await scrollBottom()
  }
}

function onSubmit(e) {
  e?.preventDefault?.()
  sendText(draft.value)
}

function useSuggestion(s) {
  sendText(s)
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
</script>

<template>
  <!-- Teleport body: tránh bị layout admin “nuốt” fixed → bóng đè lên bảng -->
  <Teleport to="body">
    <div
      class="chat-bubble-root no-print pointer-events-none fixed bottom-5 right-5 z-[95] flex flex-col items-end sm:bottom-6 sm:right-6"
    >
    <!-- Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-3 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-3 scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="pointer-events-auto mb-3 flex h-[min(520px,70vh)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-[24px] border border-white/40 bg-white shadow-[0_20px_50px_rgb(0,0,0,0.18)] ring-1"
        :class="panelTone.ring"
        role="dialog"
        :aria-label="meta.title"
      >
        <header
          class="flex shrink-0 items-start gap-3 bg-gradient-to-r px-4 py-3.5 text-white"
          :class="panelTone.header"
        >
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-black backdrop-blur"
          >
            {{ isPublic ? 'LM' : 'AI' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black">{{ meta.title }}</p>
            <p class="truncate text-xs text-white/85">{{ meta.subtitle }}</p>
            <p class="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/80">
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Demo UI · chưa gắn AI
            </p>
          </div>
          <button
            type="button"
            class="rounded-xl bg-white/15 px-2.5 py-1.5 text-sm font-bold hover:bg-white/25"
            aria-label="Đóng chat"
            @click="close"
          >
            ✕
          </button>
        </header>

        <div ref="listEl" class="custom-scrollbar-content flex-1 space-y-3 overflow-y-auto bg-[#fffafa] px-3 py-3">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm"
              :class="
                msg.role === 'user'
                  ? panelTone.bubbleUser
                  : 'border border-red-100 bg-white text-slate-700'
              "
            >
              <p class="whitespace-pre-wrap">
                <template v-for="(part, i) in splitBotMarkdown(msg.content)" :key="i">
                  <strong v-if="part.t === 'bold'">{{ part.v }}</strong>
                  <template v-else>{{ part.v }}</template>
                </template>
              </p>
              <p
                class="mt-1 text-[10px]"
                :class="msg.role === 'user' ? 'text-white/70' : 'text-slate-400'"
              >
                {{ formatTime(msg.at) }}
              </p>
            </div>
          </div>

          <div v-if="sending" class="flex justify-start">
            <div class="rounded-[18px] border border-red-100 bg-white px-4 py-3 text-xs text-slate-400">
              Đang soạn…
            </div>
          </div>
        </div>

        <div class="shrink-0 border-t border-red-50 bg-white px-3 pb-3 pt-2">
          <div class="mb-2 flex flex-wrap gap-1.5">
            <button
              v-for="s in meta.suggestions"
              :key="s"
              type="button"
              class="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition"
              :class="panelTone.chip"
              :disabled="sending"
              @click="useSuggestion(s)"
            >
              {{ s }}
            </button>
          </div>
          <form class="flex gap-2" @submit="onSubmit">
            <input
              v-model="draft"
              type="text"
              :placeholder="meta.placeholder"
              class="min-w-0 flex-1 rounded-[14px] border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm outline-none focus:border-red-400"
              :disabled="sending"
              @keydown.enter.exact.prevent="onSubmit"
            />
            <button
              type="submit"
              class="shrink-0 rounded-[14px] bg-slate-900 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              :disabled="sending || !draft.trim()"
            >
              Gửi
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Bóng chat: chỉ hiện khi đóng panel (tránh nút ✕ đè lên bảng) -->
    <button
      v-show="!open"
      type="button"
      class="pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-xl transition hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      :class="panelTone.fab"
      :aria-expanded="false"
      :aria-label="meta.fabLabel"
      @click="toggle"
    >
      <span
        class="absolute -left-2 top-0 hidden -translate-x-full whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 sm:block"
      >
        {{ meta.fabLabel }}
      </span>
      <svg
        class="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
      <span class="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
    </button>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppModal from '@/components/common/AppModal.vue'
import { translateLaoToVietnamese } from '@/api/translate'
import {
  createTradeConversation,
  deleteTradeConversation,
  fetchTradeConversations,
  updateTradeConversation,
} from '@/api/conversations'
import { getSpeechRecognitionCtor, isSpeechRecognitionSupported, laoShopPhrases } from '@/data/laoPhrases'

const speechSupported = isSpeechRecognitionSupported()
const listening = ref(false)
const interimText = ref('')
const laoText = ref('')
const viText = ref('')
const status = ref('')
const error = ref('')
const translating = ref(false)
const speechLang = ref('lo-LA')
const phraseQuery = ref('')

const conversations = ref([])
const historyQuery = ref('')
const loadingHistory = ref(false)
const saving = ref(false)
const activeId = ref(null)
const customerName = ref('')
const note = ref('')
const showSaveModal = ref(false)
const saveTitle = ref('')
const wantListening = ref(false)

let recognition = null
let translateTimer = null
let translateSeq = 0

const filteredPhrases = computed(() => {
  const q = phraseQuery.value.trim().toLowerCase()
  if (!q) return laoShopPhrases
  return laoShopPhrases.filter(
    (p) => p.lo.includes(q) || p.vi.toLowerCase().includes(q),
  )
})

/** Lào đã chốt + đoạn đang nói (interim) — dịch luôn, không cần bấm Dừng */
const liveLaoSource = computed(() => {
  const base = laoText.value.trim()
  const interim = interimText.value.trim()
  if (!base) return interim
  if (!interim) return base
  return `${base} ${interim}`
})

const filteredHistory = computed(() => {
  const q = historyQuery.value.trim().toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter((c) => {
    const blob = `${c.title || ''} ${c.customerName || ''} ${c.laoText || ''} ${c.viText || ''} ${c.note || ''}`.toLowerCase()
    return blob.includes(q)
  })
})

function clearError() {
  error.value = ''
}

function appendFinal(text) {
  const chunk = String(text || '').trim()
  if (!chunk) return
  laoText.value = laoText.value ? `${laoText.value} ${chunk}` : chunk
}

function formatWhen(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function createRecognition() {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = speechLang.value
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  rec.onstart = () => {
    listening.value = true
    status.value = 'Đang nghe… nói xong một câu (nghỉ ngắn) là tự dịch — không cần bấm Dừng'
    clearError()
  }

  rec.onend = () => {
    // Chrome thường tự dừng sau khoảng lặng — tự bật lại nếu vẫn muốn nghe
    if (wantListening.value) {
      interimText.value = ''
      try {
        recognition?.start()
        listening.value = true
        status.value = 'Đang nghe… tiếp tục nói được'
      } catch {
        listening.value = false
        wantListening.value = false
        status.value = 'Đã dừng nghe'
      }
      return
    }
    listening.value = false
    interimText.value = ''
    status.value = 'Đã dừng nghe'
  }

  rec.onerror = (event) => {
    const code = event?.error
    // aborted khi restart — bỏ qua
    if (code === 'aborted') return

    listening.value = false
    wantListening.value = false
    interimText.value = ''
    if (code === 'not-allowed') {
      error.value = 'Trình duyệt chặn micro. Hãy cho phép quyền microphone rồi thử lại.'
    } else if (code === 'no-speech') {
      // im lặng tạm — nếu còn muốn nghe thì recognition.onend sẽ restart
      if (wantListening.value) return
      error.value = 'Không nghe thấy giọng nói. Thử nói to hơn hoặc kiểm tra micro.'
    } else if (code === 'language-not-supported') {
      error.value = 'Trình duyệt chưa hỗ trợ nhận giọng Lào. Hãy gõ tay bên dưới hoặc đổi sang tiếng Thái (gần với Lào).'
    } else {
      error.value = `Lỗi nhận giọng: ${code || 'không rõ'}`
    }
  }

  rec.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      const transcript = result?.[0]?.transcript || ''
      if (result.isFinal) appendFinal(transcript)
      else interim += transcript
    }
    interimText.value = interim.trim()
  }

  return rec
}

function startListening() {
  clearError()
  if (!speechSupported) {
    error.value = 'Trình duyệt này không hỗ trợ nhận giọng nói. Dùng Chrome/Edge trên máy tính, hoặc gõ chữ Lào bên dưới.'
    return
  }

  stopListening(false)
  wantListening.value = true
  recognition = createRecognition()
  if (!recognition) return

  try {
    recognition.start()
  } catch {
    wantListening.value = false
    error.value = 'Không bật được micro. Thử tải lại trang.'
  }
}

/** @param {boolean} clearWant mặc định true khi user bấm Dừng */
function stopListening(clearWant = true) {
  if (clearWant) wantListening.value = false

  // Chốt luôn đoạn interim đang nói rồi dịch
  if (interimText.value.trim()) {
    appendFinal(interimText.value)
    interimText.value = ''
  }

  if (!recognition) {
    listening.value = false
    return
  }
  try {
    recognition.onend = null
    recognition.stop()
  } catch {
    // ignore
  }
  recognition = null
  listening.value = false
}

function toggleListening() {
  if (listening.value || wantListening.value) stopListening(true)
  else startListening()
}

async function translateNow(sourceOverride) {
  const source = String(sourceOverride ?? liveLaoSource.value).trim()
  if (!source) {
    if (!listening.value) viText.value = ''
    return
  }

  const seq = ++translateSeq
  translating.value = true
  clearError()
  if (!listening.value) status.value = 'Đang dịch sang tiếng Việt…'

  try {
    const translated = await translateLaoToVietnamese(source)
    // Bỏ kết quả cũ nếu đã có lần dịch mới hơn
    if (seq !== translateSeq) return
    viText.value = translated
    if (!listening.value) status.value = 'Đã dịch xong'
    else status.value = 'Đang nghe… đã dịch phần vừa nói'
  } catch (err) {
    if (seq !== translateSeq) return
    error.value = err?.message || 'Không dịch được.'
    if (!listening.value) status.value = ''
  } finally {
    if (seq === translateSeq) translating.value = false
  }
}

function scheduleTranslate() {
  clearTimeout(translateTimer)
  translateTimer = setTimeout(() => {
    translateNow()
  }, listening.value ? 450 : 700)
}

function usePhrase(phrase) {
  laoText.value = laoText.value ? `${laoText.value} ${phrase.lo}` : phrase.lo
  scheduleTranslate()
}

function clearAll() {
  stopListening(true)
  laoText.value = ''
  viText.value = ''
  interimText.value = ''
  customerName.value = ''
  note.value = ''
  activeId.value = null
  status.value = ''
  clearError()
}

function copyVietnamese() {
  if (!viText.value) return
  navigator.clipboard?.writeText(viText.value)
  status.value = 'Đã copy bản tiếng Việt'
}

function openSaveModal() {
  if (!laoText.value.trim()) {
    error.value = 'Chưa có nội dung hội thoại để lưu.'
    return
  }
  saveTitle.value = activeId.value
    ? conversations.value.find((c) => c.id === activeId.value)?.title || ''
    : laoText.value.trim().slice(0, 80)
  showSaveModal.value = true
}

async function loadHistory() {
  loadingHistory.value = true
  try {
    const data = await fetchTradeConversations({ per_page: 50 })
    conversations.value = data.rows ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'Không tải được lịch sử hội thoại.'
  } finally {
    loadingHistory.value = false
  }
}

function loadConversation(row) {
  stopListening(true)
  activeId.value = row.id
  laoText.value = row.laoText || ''
  viText.value = row.viText || ''
  customerName.value = row.customerName || ''
  note.value = row.note || ''
  status.value = `Đã mở: ${row.title || 'Hội thoại'}`
  clearError()
}

async function saveConversation() {
  if (!laoText.value.trim()) {
    error.value = 'Chưa có nội dung hội thoại để lưu.'
    return
  }

  saving.value = true
  clearError()
  const payload = {
    title: saveTitle.value.trim() || undefined,
    lao_text: laoText.value.trim(),
    vi_text: viText.value.trim() || undefined,
    customer_name: customerName.value.trim() || undefined,
    note: note.value.trim() || undefined,
  }

  try {
    if (activeId.value) {
      await updateTradeConversation(activeId.value, payload)
      status.value = 'Đã cập nhật hội thoại'
    } else {
      const { data } = await createTradeConversation(payload)
      status.value = 'Đã lưu hội thoại'
      const created = data?.data
      if (created?.id) activeId.value = created.id
    }
    showSaveModal.value = false
    await loadHistory()
  } catch (err) {
    error.value = err.response?.data?.message || 'Không lưu được hội thoại.'
  } finally {
    saving.value = false
  }
}

async function removeConversation(row) {
  if (!confirm(`Xóa hội thoại "${row.title || row.id}"?`)) return
  try {
    await deleteTradeConversation(row.id)
    conversations.value = conversations.value.filter((c) => c.id !== row.id)
    if (activeId.value === row.id) activeId.value = null
    status.value = 'Đã xóa hội thoại'
  } catch (err) {
    error.value = err.response?.data?.message || 'Không xóa được hội thoại.'
  }
}

watch(liveLaoSource, () => scheduleTranslate())
watch(speechLang, () => {
  if (wantListening.value) {
    stopListening(false)
    startListening()
  }
})

onMounted(loadHistory)

onBeforeUnmount(() => {
  clearTimeout(translateTimer)
  stopListening(true)
})
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div class="rounded-[24px] border border-sky-200/80 bg-gradient-to-r from-sky-700 to-cyan-600 p-6 text-white shadow-lg shadow-sky-700/20 sm:p-8">
      <p class="text-sm font-medium text-sky-100">Công cụ hỗ trợ</p>
      <h2 class="mt-1 text-2xl font-black sm:text-3xl">Nghe hiểu tiếng Lào</h2>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-sky-50/90">
        Nghe / gõ hội thoại bán-mua với khách Lào, dịch sang Việt, rồi lưu lại để xem lại sau.
      </p>
    </div>

    <div v-if="error" class="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>
    <div v-if="status" class="rounded-[16px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
      {{ status }}
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
      <section class="space-y-4 rounded-[24px] border border-sky-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-[#111118]">Hội thoại hiện tại</h3>
            <p class="text-sm text-slate-500">
              {{ activeId ? `Đang sửa bản đã lưu #${activeId}` : 'Hội thoại mới — chưa lưu' }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="speechLang"
              class="rounded-[12px] border border-sky-200 bg-sky-50/60 px-3 py-2 text-sm font-medium outline-none"
              :disabled="listening"
            >
              <option value="lo-LA">Lào (lo-LA)</option>
              <option value="th-TH">Thái (th-TH) — dự phòng</option>
            </select>
            <button
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-50"
              :class="listening ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'"
              :disabled="!speechSupported"
              @click="toggleListening"
            >
              {{ listening ? 'Dừng nghe' : 'Bắt đầu nghe' }}
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              @click="openSaveModal"
            >
              {{ activeId ? 'Cập nhật lưu' : 'Lưu hội thoại' }}
            </button>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên khách (tuỳ chọn)</label>
            <input
              v-model="customerName"
              type="text"
              placeholder="VD: Anh Boun, Chị Noi..."
              class="w-full rounded-[12px] border border-sky-200 bg-sky-50/40 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú giao dịch</label>
            <input
              v-model="note"
              type="text"
              placeholder="VD: hỏi iPhone 13, mặc giá..."
              class="w-full rounded-[12px] border border-sky-200 bg-sky-50/40 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </div>
        </div>

        <div
          class="flex min-h-[72px] items-center justify-center rounded-[18px] border border-dashed px-4 py-4 text-center"
          :class="listening ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50'"
        >
          <div>
            <p class="text-sm font-medium text-slate-600">
              {{ listening ? 'Đang nghe… nghỉ ngắn một nhịp là tự dịch (không cần bấm Dừng)' : 'Nhấn “Bắt đầu nghe” hoặc gõ chữ Lào bên dưới' }}
            </p>
            <p v-if="interimText" class="mt-1 text-base text-sky-800">{{ interimText }}</p>
          </div>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between gap-2">
            <label class="text-xs font-bold uppercase tracking-widest text-slate-400">Chữ tiếng Lào</label>
            <button type="button" class="text-xs font-semibold text-slate-500 hover:text-red-600" @click="clearAll">
              Hội thoại mới
            </button>
          </div>
          <textarea
            v-model="laoText"
            rows="5"
            placeholder="Lời trao đổi tiếng Lào…"
            class="w-full rounded-[16px] border border-sky-200 bg-sky-50/40 px-4 py-3 text-base leading-relaxed outline-none focus:border-sky-400"
            lang="lo"
          />
        </div>

        <div>
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label class="text-xs font-bold uppercase tracking-widest text-slate-400">Nghĩa tiếng Việt</label>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-[10px] bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 ring-1 ring-sky-100 disabled:opacity-50"
                :disabled="translating || !laoText.trim()"
                @click="translateNow"
              >
                {{ translating ? 'Đang dịch…' : 'Dịch lại' }}
              </button>
              <button
                type="button"
                class="rounded-[10px] bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 disabled:opacity-50"
                :disabled="!viText"
                @click="copyVietnamese"
              >
                Copy Việt
              </button>
            </div>
          </div>
          <div class="min-h-[110px] rounded-[16px] border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-base leading-relaxed text-[#111118]">
            <p v-if="viText">{{ viText }}</p>
            <p v-else class="text-slate-400">Bản dịch tiếng Việt sẽ hiện ở đây.</p>
          </div>
        </div>
      </section>

      <aside class="space-y-4">
        <div class="rounded-[24px] border border-sky-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-lg font-bold text-[#111118]">Hội thoại đã lưu</h3>
              <p class="text-sm text-slate-500">Mở lại các cuộc trao đổi bán-mua</p>
            </div>
            <button
              type="button"
              class="rounded-[10px] bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-100"
              @click="loadHistory"
            >
              Làm mới
            </button>
          </div>
          <input
            v-model="historyQuery"
            type="text"
            placeholder="Tìm theo khách, nội dung…"
            class="mt-3 w-full rounded-[12px] border border-sky-200 bg-sky-50/50 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />

          <p v-if="loadingHistory" class="mt-3 text-sm text-slate-400">Đang tải…</p>
          <p v-else-if="filteredHistory.length === 0" class="mt-3 text-sm text-slate-400">
            Chưa có hội thoại nào. Bấm “Lưu hội thoại” để giữ lại.
          </p>
          <ul v-else class="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
            <li v-for="row in filteredHistory" :key="row.id">
              <div
                class="rounded-[14px] border px-3 py-2.5 transition"
                :class="activeId === row.id ? 'border-sky-400 bg-sky-50' : 'border-sky-100 bg-[#f8fcff] hover:border-sky-300'"
              >
                <button type="button" class="w-full text-left" @click="loadConversation(row)">
                  <p class="truncate text-sm font-bold text-[#111118]">{{ row.title || 'Hội thoại' }}</p>
                  <p v-if="row.customerName" class="mt-0.5 text-xs font-medium text-sky-700">Khách: {{ row.customerName }}</p>
                  <p class="mt-1 line-clamp-2 text-xs text-slate-500">{{ row.viText || row.laoText }}</p>
                  <p class="mt-1 text-[11px] text-slate-400">{{ formatWhen(row.updatedAt || row.createdAt) }}</p>
                </button>
                <button
                  type="button"
                  class="mt-2 text-[11px] font-semibold text-slate-400 hover:text-red-600"
                  @click="removeConversation(row)"
                >
                  Xóa
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div class="rounded-[24px] border border-sky-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">Câu hay dùng</h3>
          <input
            v-model="phraseQuery"
            type="text"
            placeholder="Tìm câu…"
            class="mt-3 w-full rounded-[12px] border border-sky-200 bg-sky-50/50 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <ul class="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1">
            <li v-for="phrase in filteredPhrases" :key="phrase.lo">
              <button
                type="button"
                class="w-full rounded-[14px] border border-sky-100 bg-[#f8fcff] px-3 py-2 text-left hover:border-sky-300 hover:bg-sky-50"
                @click="usePhrase(phrase)"
              >
                <p class="text-sm font-semibold text-[#111118]" lang="lo">{{ phrase.lo }}</p>
                <p class="text-xs text-slate-600">{{ phrase.vi }}</p>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <AppModal :open="showSaveModal" @close="showSaveModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-sky-200 bg-white shadow-2xl">
        <div class="border-b border-sky-100 px-6 py-4">
          <p class="text-xs font-bold uppercase tracking-widest text-sky-700">Lưu trữ</p>
          <h3 class="mt-1 text-lg font-bold text-[#111118]">
            {{ activeId ? 'Cập nhật hội thoại' : 'Lưu hội thoại bán-mua' }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">Giữ lại để lần sau mở xem trao đổi với khách.</p>
        </div>
        <div class="space-y-4 p-6">
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tiêu đề</label>
            <input
              v-model="saveTitle"
              type="text"
              placeholder="VD: Khách hỏi iPhone 13 Pro"
              class="w-full rounded-[14px] border border-sky-200 bg-sky-50/50 px-4 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tên khách</label>
            <input
              v-model="customerName"
              type="text"
              class="w-full rounded-[14px] border border-sky-200 bg-sky-50/50 px-4 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú</label>
            <textarea
              v-model="note"
              rows="2"
              class="w-full rounded-[14px] border border-sky-200 bg-sky-50/50 px-4 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200"
              @click="showSaveModal = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              :disabled="saving"
              @click="saveConversation"
            >
              {{ saving ? 'Đang lưu…' : activeId ? 'Cập nhật' : 'Lưu' }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

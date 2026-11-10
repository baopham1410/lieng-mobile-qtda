<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import { storeInfo } from '@/data/storeIntro'
import {
  CONSULT_TOPICS,
  consultStatusClass,
  emptyConsultForm,
  formatConsultTime,
  formatDuration,
  getConsultRows,
  nextConsultCode,
  saveConsultRows,
  statusLabel,
} from '@/mocks/consultMock'

const rows = ref([])
const historyQuery = ref('')
const activeId = ref(null)
const session = ref(emptyConsultForm())
const live = ref(false)
const error = ref('')
const statusMsg = ref('')
const saving = ref(false)

const recording = ref(false)
const mediaRecorder = ref(null)
const recordChunks = ref([])
const recordStartedAt = ref(null)

const phase = computed(() => {
  if (recording.value) return 'recording'
  if (!live.value) return 'idle'
  if (session.value.status === 'ringing') return 'ringing'
  return 'active'
})

const phaseLabel = computed(() => {
  if (phase.value === 'recording') return 'Đang ghi âm'
  if (phase.value === 'ringing') return 'Đang gọi tới'
  if (phase.value === 'active') return 'Đang tư vấn'
  return 'Sẵn sàng nhận'
})

const phaseHint = computed(() => {
  if (phase.value === 'idle') {
    return `Hotline ${storeInfo.hotlineDisplay} — bấm Tiếp nhận khi có khách gọi vào.`
  }
  if (phase.value === 'ringing') return 'Nhập SĐT / tên khách rồi bắt đầu tư vấn.'
  if (phase.value === 'recording') return 'Đang ghi cuộc gọi — có thể ghi chú song song.'
  return activeId.value
    ? `Đang mở ${session.value.code || `#${activeId.value}`}`
    : 'Phiên mới — ghi thông tin rồi bấm Xong khi kết thúc.'
})

const filteredHistory = computed(() => {
  const q = historyQuery.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (!q) return true
    const hay = [r.code, r.customerName, r.customerPhone, r.callerPhone, r.topic, r.notes]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

function loadRows() {
  rows.value = getConsultRows()
}

function resetSession() {
  stopRecording()
  activeId.value = null
  session.value = emptyConsultForm()
  live.value = false
  error.value = ''
}

function acceptCall() {
  stopRecording()
  activeId.value = null
  session.value = {
    ...emptyConsultForm(),
    status: 'ringing',
    notes: `Cuộc gọi vào hotline ${storeInfo.hotlineDisplay}`,
  }
  live.value = true
  error.value = ''
  statusMsg.value = 'Đã tiếp nhận — đang gọi tới'
}

function beginConsult() {
  if (!live.value) acceptCall()
  session.value.status = 'in_progress'
  statusMsg.value = 'Đang tư vấn'
}

function loadFromHistory(row) {
  stopRecording()
  activeId.value = row.id
  session.value = {
    direction: row.direction || 'inbound',
    callerPhone: row.callerPhone || '',
    customerName: row.customerName || '',
    customerPhone: row.customerPhone || '',
    topic: row.topic || 'Chọn máy mới',
    interestProduct: row.interestProduct || '',
    status: row.status || 'in_progress',
    notes: row.notes || '',
    recordingName: row.recordingName || null,
    recordingDataUrl: row.recordingDataUrl || null,
    startedAt: row.startedAt || new Date().toISOString(),
    endedAt: row.endedAt || null,
    durationSec: row.durationSec ?? null,
    code: row.code,
  }
  live.value = true
  error.value = ''
  statusMsg.value = `Đã mở ${row.code}`
}

async function startRecording() {
  error.value = ''
  if (!live.value) beginConsult()
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Trình duyệt không hỗ trợ ghi âm. Hãy tải file ghi âm lên.'
    return
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordChunks.value = []
    const rec = new MediaRecorder(stream)
    mediaRecorder.value = rec
    rec.ondataavailable = (e) => {
      if (e.data?.size) recordChunks.value.push(e.data)
    }
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(recordChunks.value, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onload = () => {
        session.value.recordingDataUrl = String(reader.result)
        session.value.recordingName = `call-${Date.now()}.webm`
        if (recordStartedAt.value) {
          session.value.durationSec = Math.round((Date.now() - recordStartedAt.value) / 1000)
        }
      }
      reader.readAsDataURL(blob)
    }
    recordStartedAt.value = Date.now()
    rec.start()
    recording.value = true
    if (session.value.status === 'ringing') session.value.status = 'in_progress'
    statusMsg.value = 'Đang ghi âm…'
  } catch {
    error.value = 'Không mở được micro. Cho phép quyền micro hoặc tải file ghi âm.'
  }
}

function stopRecording() {
  if (mediaRecorder.value && recording.value) {
    mediaRecorder.value.stop()
    recording.value = false
  }
}

function onPickRecording(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!live.value) beginConsult()
  const reader = new FileReader()
  reader.onload = () => {
    session.value.recordingDataUrl = String(reader.result)
    session.value.recordingName = file.name
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function clearRecording() {
  session.value.recordingName = null
  session.value.recordingDataUrl = null
  session.value.durationSec = null
}

function persistSession(finalStatus) {
  error.value = ''
  if (!session.value.customerPhone.trim() && !session.value.callerPhone.trim()) {
    error.value = 'Nhập SĐT người gọi hoặc SĐT khách trước khi kết thúc.'
    return false
  }

  stopRecording()
  saving.value = true
  try {
    const ended =
      finalStatus === 'done' || finalStatus === 'missed' || finalStatus === 'callback'
        ? new Date().toISOString()
        : session.value.endedAt

    const payload = {
      direction: session.value.direction || 'inbound',
      callerPhone: session.value.callerPhone.trim(),
      customerName: session.value.customerName.trim(),
      customerPhone: session.value.customerPhone.trim() || session.value.callerPhone.trim(),
      topic: session.value.topic,
      interestProduct: session.value.interestProduct.trim(),
      status: finalStatus,
      notes: session.value.notes.trim(),
      recordingName: session.value.recordingName,
      recordingDataUrl: session.value.recordingDataUrl,
      startedAt: session.value.startedAt,
      endedAt: ended,
      durationSec: session.value.durationSec,
      staffName: 'Nhân viên demo',
    }

    if (activeId.value) {
      rows.value = rows.value.map((r) =>
        r.id === activeId.value
          ? { ...r, ...payload, code: r.code, recordingDataUrl: payload.recordingDataUrl }
          : r,
      )
    } else {
      const id = Math.max(0, ...rows.value.map((r) => r.id)) + 1
      rows.value = [
        {
          id,
          code: nextConsultCode(rows.value),
          ...payload,
        },
        ...rows.value,
      ]
    }

    saveConsultRows(rows.value)
    statusMsg.value = `Đã lưu — ${statusLabel(finalStatus)}`
    resetSession()
    return true
  } finally {
    saving.value = false
  }
}

function finishDone() {
  persistSession('done')
}

function finishMissed() {
  persistSession('missed')
}

function finishCallback() {
  persistSession('callback')
}

onMounted(loadRows)
onUnmounted(() => {
  stopRecording()
})
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>
    <div
      v-else-if="statusMsg"
      class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      {{ statusMsg }}
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <!-- Workspace -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div class="flex items-start gap-3">
            <span
              class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              :class="{
                'bg-slate-300': phase === 'idle',
                'bg-sky-500': phase === 'ringing',
                'bg-amber-500': phase === 'active',
                'animate-pulse bg-red-600': phase === 'recording',
              }"
            />
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold text-slate-900">{{ phaseLabel }}</h2>
                <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {{ storeInfo.hotlineDisplay }}
                </span>
              </div>
              <p class="mt-0.5 text-sm text-slate-500">{{ phaseHint }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!live"
              type="button"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              @click="acceptCall"
            >
              Tiếp nhận
            </button>
            <template v-else>
              <button
                v-if="session.status === 'ringing'"
                type="button"
                class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                @click="beginConsult"
              >
                Bắt đầu tư vấn
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                @click="resetSession"
              >
                Hủy
              </button>
            </template>
          </div>
        </header>

        <div class="space-y-5 p-5 sm:p-6">
          <div
            class="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            :class="{
              'border-slate-200 bg-slate-50': phase === 'idle',
              'border-sky-200 bg-sky-50': phase === 'ringing',
              'border-amber-200 bg-amber-50': phase === 'active',
              'border-red-200 bg-red-50': phase === 'recording',
            }"
          >
            <p class="text-sm font-medium text-slate-800">
              <template v-if="phase === 'idle'">Đang chờ cuộc gọi vào hotline</template>
              <template v-else-if="phase === 'ringing'">Cuộc gọi đang đổ chuông</template>
              <template v-else-if="phase === 'recording'">Đang ghi âm</template>
              <template v-else>Đang tư vấn — cập nhật thông tin khách</template>
            </p>
            <p v-if="session.durationSec && !recording" class="shrink-0 text-xs tabular-nums text-slate-500">
              {{ formatDuration(session.durationSec) }}
            </p>
          </div>

          <fieldset :disabled="!live" class="space-y-4 disabled:opacity-45">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-600">SĐT gọi tới</label>
                <input
                  v-model="session.callerPhone"
                  type="tel"
                  placeholder="Số hiện trên máy lẻ"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-600">SĐT khách</label>
                <input
                  v-model="session.customerPhone"
                  type="tel"
                  placeholder="Có thể trùng SĐT gọi"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-600">Tên khách</label>
                <input
                  v-model="session.customerName"
                  type="text"
                  placeholder="Hỏi và ghi lại"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-600">Chủ đề</label>
                <select
                  v-model="session.topic"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option v-for="t in CONSULT_TOPICS" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-600">Máy quan tâm</label>
              <input
                v-model="session.interestProduct"
                type="text"
                placeholder="VD: iPhone 15 Pro 256GB"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-600">Ghi chú tư vấn</label>
              <textarea
                v-model="session.notes"
                rows="3"
                placeholder="Nhu cầu, ngân sách, hẹn đến cửa hàng…"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-slate-800">Ghi âm cuộc gọi</p>
                  <p class="mt-0.5 text-xs text-slate-500">Micro trình duyệt hoặc tải file</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="!recording"
                    type="button"
                    class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    @click="startRecording"
                  >
                    Bắt đầu ghi
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    @click="stopRecording"
                  >
                    Dừng ghi
                  </button>
                  <label
                    class="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Tải file
                    <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm" class="hidden" @change="onPickRecording" />
                  </label>
                  <button
                    v-if="session.recordingName"
                    type="button"
                    class="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-red-600"
                    @click="clearRecording"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div v-if="session.recordingName" class="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <p class="text-sm font-medium text-slate-800">{{ session.recordingName }}</p>
                <audio
                  v-if="session.recordingDataUrl"
                  class="mt-2 w-full"
                  controls
                  :src="session.recordingDataUrl"
                />
                <p v-else class="mt-1 text-xs text-slate-500">File đã lưu — mở lại phiên để nghe nếu còn dữ liệu.</p>
              </div>
            </div>
          </fieldset>

          <div v-if="live" class="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              :disabled="saving"
              @click="finishDone"
            >
              Kết thúc · Xong
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              :disabled="saving"
              @click="finishMissed"
            >
              Nhỡ máy
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              :disabled="saving"
              @click="finishCallback"
            >
              Hẹn gọi lại
            </button>
          </div>
        </div>
      </section>

      <!-- History -->
      <aside class="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div class="border-b border-slate-100 px-5 py-4">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-semibold text-slate-900">Lịch sử cuộc gọi</h3>
              <p class="text-xs text-slate-500">{{ filteredHistory.length }} cuộc gọi</p>
            </div>
            <button
              type="button"
              class="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              @click="loadRows"
            >
              Làm mới
            </button>
          </div>
          <input
            v-model="historyQuery"
            type="text"
            placeholder="Tìm SĐT, tên…"
            class="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div class="p-3">
          <p v-if="!filteredHistory.length" class="px-2 py-6 text-center text-sm text-slate-400">
            Chưa có cuộc gọi
          </p>
          <ul v-else class="max-h-[min(70vh,560px)] space-y-1 overflow-y-auto">
            <li v-for="row in filteredHistory" :key="row.id">
              <button
                type="button"
                class="w-full rounded-xl px-3 py-2.5 text-left transition"
                :class="
                  activeId === row.id
                    ? 'bg-red-50 ring-1 ring-red-200'
                    : 'hover:bg-slate-50'
                "
                @click="loadFromHistory(row)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">
                      {{ row.customerName || row.customerPhone || row.callerPhone || 'Chưa có tên' }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      {{ row.customerPhone || row.callerPhone || '—' }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1"
                    :class="consultStatusClass[row.status]"
                  >
                    {{ statusLabel(row.status) }}
                  </span>
                </div>
                <p class="mt-1 truncate text-xs text-slate-500">
                  {{ row.topic }}{{ row.interestProduct ? ` · ${row.interestProduct}` : '' }}
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>{{ formatConsultTime(row.startedAt) }}</span>
                  <span v-if="row.recordingName || row.hasRecording" class="text-emerald-600">Ghi âm</span>
                  <span v-if="row.durationSec">{{ formatDuration(row.durationSec) }}</span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  stats: {
    type: Array,
    default: () => [
      { value: '50K+', label: 'Khách hàng tin dùng' },
      { value: '10K+', label: 'Đơn hàng / năm' },
      { value: '4.9/5', label: 'Đánh giá trung bình' },
      { value: '24h', label: 'Hỗ trợ bảo hành' },
    ],
  },
})

const containerRef = ref(null)
const cardStates = ref([])
let sectionObserver = null
let hasAutoTriggered = false

function parseStatValue(raw) {
  // Tách số và hậu tố: ví dụ "50K+" -> num: 50, suffix: "K+"
  // "4.9/5" -> num: 4.9, suffix: "/5"
  // "24h" -> num: 24, suffix: "h"
  const str = String(raw || '').trim()
  const match = str.match(/^([\d.]+)(.*)$/)
  if (match) {
    const isDecimal = match[1].includes('.')
    return {
      targetNum: parseFloat(match[1]),
      isDecimal,
      decimals: isDecimal ? (match[1].split('.')[1] || '').length : 0,
      suffix: match[2] || '',
    }
  }
  return {
    targetNum: 0,
    isDecimal: false,
    decimals: 0,
    suffix: str,
  }
}

function initCards() {
  cardStates.value = props.stats.map((stat, idx) => {
    const parsed = parseStatValue(stat.value)
    return {
      id: idx,
      label: stat.label,
      targetNum: parsed.targetNum,
      isDecimal: parsed.isDecimal,
      decimals: parsed.decimals,
      suffix: parsed.suffix,
      currentNumStr: parsed.isDecimal ? (0).toFixed(parsed.decimals) : '00',
      isSpinning: false,
      isLocked: false,
      punch: false,
      intervalId: null,
      timeoutId: null,
    }
  })
}

function spinCard(card, durationMs = 1200) {
  if (card.isSpinning) return

  card.isSpinning = true
  card.isLocked = false
  card.punch = false

  if (card.intervalId) clearInterval(card.intervalId)
  if (card.timeoutId) clearTimeout(card.timeoutId)

  const startTime = Date.now()

  // Vòng lặp quay số ngẫu nhiên cực nhanh (35ms một nhịp) như lồng cầu quay xổ số
  card.intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / durationMs, 1)

    if (progress < 1) {
      if (card.isDecimal) {
        // Sinh số thập phân ngẫu nhiên quay quanh giá trị
        const rand = (Math.random() * 5).toFixed(card.decimals)
        card.currentNumStr = rand
      } else {
        // Sinh số nguyên ngẫu nhiên
        const maxVal = Math.max(card.targetNum * 1.5, 99)
        const rand = Math.floor(Math.random() * maxVal)
        card.currentNumStr = rand < 10 ? `0${rand}` : String(rand)
      }
    }
  }, 35)

  // Khóa số chính xác khi hết thời gian quay
  card.timeoutId = setTimeout(() => {
    clearInterval(card.intervalId)
    card.intervalId = null

    card.currentNumStr = card.isDecimal
      ? card.targetNum.toFixed(card.decimals)
      : String(card.targetNum)

    card.isSpinning = false
    card.isLocked = true
    card.punch = true

    // Tắt hiệu ứng punch sau khi nảy
    setTimeout(() => {
      card.punch = false
    }, 600)
  }, durationMs)
}

function triggerAllLotterySpins() {
  // Quay so le từng cột như lồng cầu xổ số / slot machine reels
  cardStates.value.forEach((card, idx) => {
    const duration = 1100 + idx * 300 // 1100ms, 1400ms, 1700ms, 2000ms
    setTimeout(() => {
      spinCard(card, duration)
    }, idx * 100)
  })
}

function reSpinAll() {
  triggerAllLotterySpins()
}

onMounted(() => {
  initCards()

  if (containerRef.value) {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAutoTriggered) {
            hasAutoTriggered = true
            triggerAllLotterySpins()
          }
        })
      },
      {
        threshold: 0.15,
      }
    )
    sectionObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (sectionObserver) {
    sectionObserver.disconnect()
  }
  cardStates.value.forEach((card) => {
    if (card.intervalId) clearInterval(card.intervalId)
    if (card.timeoutId) clearTimeout(card.timeoutId)
  })
})
</script>

<template>
  <section
    ref="containerRef"
    class="border-b border-gray-200 bg-white relative overflow-hidden"
  >
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
          <p class="text-xs font-bold uppercase tracking-widest text-red-600">
            Hệ thống chỉ số &amp; uy tín thương hiệu
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-red-600 transition-all cursor-pointer active:scale-95 shadow-xs"
          title="Bấm để quay số ngẫu nhiên lại"
          @click="reSpinAll"
        >
          <svg class="w-3.5 h-3.5 text-red-600 transition-transform duration-500 hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Quay lại số</span>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div
          v-for="card in cardStates"
          :key="card.id"
          class="group relative rounded-2xl border p-5 text-center transition-all duration-300 cursor-pointer select-none"
          :class="[
            card.isSpinning
              ? 'border-red-400 bg-red-50/60 shadow-[0_0_20px_rgba(239,68,68,0.2)] scale-[1.02]'
              : card.punch
                ? 'border-red-500 bg-red-50 shadow-[0_0_25px_rgba(239,68,68,0.3)] scale-[1.05]'
                : 'border-gray-100 bg-gray-50/70 hover:border-red-200 hover:bg-white hover:shadow-xl hover:scale-[1.02]'
          ]"
          @click="spinCard(card, 1200)"
        >
          <!-- Spinning slot status badge -->
          <div
            v-if="card.isSpinning"
            class="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm animate-pulse"
          >
            Đang quay...
          </div>
          <div
            v-else-if="card.isLocked"
            class="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Chính xác ✓
          </div>

          <!-- Number with Slot Machine Punch & Crisp Red Typography -->
          <div class="flex items-center justify-center gap-0.5">
            <span
              class="font-black tracking-tight text-3xl sm:text-4xl transition-all inline-block font-mono"
              :class="[
                card.isSpinning
                  ? 'text-red-400 blur-[0.6px] translate-y-[-1px]'
                  : card.punch
                    ? 'scale-110 text-red-600 drop-shadow-sm'
                    : 'text-red-600'
              ]"
            >
              {{ card.currentNumStr }}
            </span>
            <span
              class="text-xl sm:text-2xl font-black text-red-600"
              :class="{ 'opacity-50 blur-[0.4px]': card.isSpinning }"
            >
              {{ card.suffix }}
            </span>
          </div>

          <!-- Label -->
          <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-600 group-hover:text-gray-900 transition-colors">
            {{ card.label }}
          </p>

          <!-- Subtle bottom accent line -->
          <div
            class="mt-3 mx-auto h-0.5 w-12 rounded-full transition-all duration-300"
            :class="card.isSpinning ? 'w-20 bg-red-500' : 'bg-gray-200 group-hover:w-20 group-hover:bg-red-500'"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Keyframes cho hiệu ứng Punch lúc dừng quay xổ số */
@keyframes slotPunch {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  40% {
    transform: scale(1.18);
    filter: brightness(1.6);
  }
  70% {
    transform: scale(0.96);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}
</style>

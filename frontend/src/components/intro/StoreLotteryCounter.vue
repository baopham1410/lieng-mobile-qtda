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
    class="border-y border-white/10 bg-[#0c0d12]/90 backdrop-blur-xl relative overflow-hidden"
  >
    <!-- Background subtle symmetrical ambient studio glow (Warm Amber on left, Cool Cyan on right) -->
    <div class="absolute -top-24 left-1/4 h-56 w-96 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
    <div class="absolute -bottom-24 right-1/4 h-56 w-96 rounded-full bg-gradient-to-l from-cyan-500/12 via-teal-500/8 to-transparent blur-3xl pointer-events-none" />

    <div class="mx-auto max-w-7xl px-4 py-8 relative z-10">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <p class="text-xs font-bold uppercase tracking-widest text-amber-300/90">
            Hệ thống chỉ số &amp; uy tín thương hiệu
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1 text-xs font-semibold text-amber-300 transition backdrop-blur-md cursor-pointer active:scale-95 shadow-md hover:border-amber-400/50"
          title="Bấm để quay số ngẫu nhiên lại"
          @click="reSpinAll"
        >
          <span class="text-sm">🎰</span>
          <span>Quay lại số</span>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div
          v-for="card in cardStates"
          :key="card.id"
          class="group relative rounded-2xl border p-5 text-center transition-all duration-300 backdrop-blur-2xl cursor-pointer select-none"
          :class="[
            card.isSpinning
              ? 'border-amber-400/70 bg-[#161822] shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-[1.02]'
              : card.punch
                ? 'border-amber-300 bg-[#1a1b26] shadow-[0_0_30px_rgba(251,191,36,0.5)] scale-[1.05]'
                : 'border-white/10 bg-[#121318]/90 hover:border-amber-500/40 hover:bg-[#161822] hover:shadow-xl hover:shadow-amber-500/10 hover:scale-[1.02]'
          ]"
          @click="spinCard(card, 1200)"
        >
          <!-- Spinning slot status badge -->
          <div
            v-if="card.isSpinning"
            class="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md shadow-orange-500/50 animate-pulse"
          >
            Đang quay...
          </div>
          <div
            v-else-if="card.isLocked"
            class="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500/20 border border-cyan-400/60 px-2.5 py-0.5 text-[9px] font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            Chính xác ✓
          </div>

          <!-- Number with Slot Machine Punch & Symmetrical Gradient -->
          <div class="flex items-center justify-center gap-0.5">
            <span
              class="font-black tracking-tight text-3xl sm:text-4xl transition-all inline-block font-mono"
              :class="[
                card.isSpinning
                  ? 'text-amber-300 blur-[0.6px] translate-y-[-1px]'
                  : card.punch
                    ? 'scale-110 text-white drop-shadow-md'
                    : card.id === 2
                      ? 'bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-300 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent'
              ]"
            >
              {{ card.currentNumStr }}
            </span>
            <span
              class="text-xl sm:text-2xl font-black"
              :class="[
                card.id === 2 ? 'text-cyan-300' : 'text-amber-300',
                { 'opacity-50 blur-[0.4px]': card.isSpinning }
              ]"
            >
              {{ card.suffix }}
            </span>
          </div>

          <!-- Label -->
          <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">
            {{ card.label }}
          </p>

          <!-- Subtle bottom glow accent line -->
          <div
            class="mt-3 mx-auto h-0.5 w-12 rounded-full transition-all duration-300"
            :class="card.isSpinning ? 'w-20 bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-white/15 group-hover:w-20 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-orange-500'"
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

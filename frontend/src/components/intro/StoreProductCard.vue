<script setup>
import { computed, ref } from 'vue'
import { formatPrice } from '@/data/storeIntro'
import { resolveProductImageUrl } from '@/utils/productImage'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['view', 'add-to-cart'])

const imageFailed = ref(false)

const imageUrl = computed(() => resolveProductImageUrl(props.product.image))

// Apple-style color swatch dots
const defaultSwatches = ['#2C2C2E', '#E3E4E6', '#F5E7D8', '#4B5358']
const swatches = computed(() => props.product.swatches || defaultSwatches)

// Monthly installment estimate (12 months 0%)
const monthlyEstimate = computed(() => {
  if (!props.product.price) return ''
  const monthCost = Math.round(props.product.price / 12)
  return formatPrice(monthCost)
})
</script>

<template>
  <article
    class="group relative flex flex-col justify-between overflow-hidden rounded-[26px] bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-black/[0.04]"
  >
    <!-- Top Meta: Badge & Brand -->
    <div>
      <div class="flex items-center justify-between min-h-[24px]">
        <span
          v-if="product.badge"
          class="text-[11px] font-semibold tracking-wide text-[#B64400] uppercase"
        >
          {{ product.badge }}
        </span>
        <span v-else class="text-[11px] font-medium tracking-wide text-[#86868B] uppercase">
          {{ product.brand }}
        </span>

        <span
          v-if="product.inStock !== false"
          class="text-[11px] font-medium text-[#1D1D1F]/60"
        >
          Chính hãng VN/A
        </span>
      </div>

      <!-- Device Name -->
      <h3
        class="mt-2 text-xl font-semibold tracking-tight text-[#1D1D1F] line-clamp-1 group-hover:text-[#0071E3] transition-colors cursor-pointer"
        @click="emit('view', product)"
      >
        {{ product.name }}
      </h3>

      <!-- Tagline / Highlight specs -->
      <p class="mt-1 text-xs text-[#86868B] line-clamp-1">
        {{ (product.specs || []).join(' · ') || 'Thiết kế đột phá · Hiệu năng đỉnh cao' }}
      </p>

      <!-- Color Swatch Dots -->
      <div class="mt-4 flex items-center gap-1.5">
        <span
          v-for="(dot, i) in swatches"
          :key="i"
          class="h-3 w-3 rounded-full border border-black/10 shadow-inner"
          :style="{ backgroundColor: dot }"
        />
      </div>
    </div>

    <!-- Product Image Showcase -->
    <div
      class="my-8 flex aspect-square w-full items-center justify-center p-2 cursor-pointer transition-transform duration-500 group-hover:scale-105"
      @click="emit('view', product)"
    >
      <img
        v-if="imageUrl && !imageFailed"
        :src="imageUrl"
        :alt="product.name"
        class="max-h-[210px] w-auto max-w-[95%] object-contain"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div
        v-else
        class="flex h-44 w-28 flex-col items-center justify-center rounded-[24px] border-4 border-[#2C2C2E] bg-[#1D1D1F] shadow-xl p-3"
      >
        <div class="h-2 w-8 rounded-full bg-white/20 mb-auto" />
        <span class="text-xs font-semibold text-white/40">Lieng</span>
        <div class="h-1 w-12 rounded-full bg-white/20 mt-auto" />
      </div>
    </div>

    <!-- Bottom Pricing & Action Section -->
    <div class="pt-4 border-t border-black/[0.05]">
      <!-- Price Display -->
      <div>
        <p class="text-xs text-[#86868B]">Giá từ</p>
        <div class="flex items-baseline gap-2 mt-0.5">
          <span class="text-lg font-semibold tracking-tight text-[#1D1D1F]">
            {{ formatPrice(product.price) }}
          </span>
          <span
            v-if="product.oldPrice && product.oldPrice > product.price"
            class="text-xs text-[#86868B] line-through"
          >
            {{ formatPrice(product.oldPrice) }}
          </span>
        </div>
        <p v-if="monthlyEstimate" class="mt-0.5 text-[11px] text-[#86868B]">
          Hoặc {{ monthlyEstimate }}/tháng trả góp 0%
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          class="text-xs font-medium text-[#0071E3] hover:underline inline-flex items-center gap-0.5"
          @click="emit('view', product)"
        >
          <span>Tìm hiểu thêm</span>
          <span class="text-sm">›</span>
        </button>

        <button
          type="button"
          class="rounded-full bg-[#0071E3] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#0077ED] active:scale-95 disabled:opacity-40 cursor-pointer"
          :disabled="product.inStock === false"
          @click="emit('add-to-cart', product)"
        >
          {{ product.inStock === false ? 'Đặt trước' : 'Chọn mua' }}
        </button>
      </div>
    </div>
  </article>
</template>
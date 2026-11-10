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

const discountPercent = computed(() => {
  if (!props.product.oldPrice || props.product.oldPrice <= props.product.price) return 0
  return Math.round(((props.product.oldPrice - props.product.price) / props.product.oldPrice) * 100)
})
</script>

<template>
  <article
    class="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-red-300 hover:shadow-xl hover:shadow-red-500/10"
  >
    <!-- Badges & Discounts -->
    <div class="absolute left-4 top-4 z-10 flex flex-col gap-1.5 pointer-events-none">
      <span
        v-if="product.badge"
        class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-red-500/25"
      >
        <span class="text-[9px]">🔥</span> {{ product.badge }}
      </span>
      <span
        v-if="discountPercent > 0"
        class="inline-block w-fit rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm"
      >
        -{{ discountPercent }}%
      </span>
    </div>

    <!-- Installment Tag -->
    <span
      class="absolute right-4 top-4 z-10 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700"
    >
      Trả góp 0%
    </span>

    <!-- Product Image -->
    <div
      class="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 p-4 flex items-center justify-center cursor-pointer"
      @click="emit('view', product)"
    >
      <img
        v-if="imageUrl && !imageFailed"
        :src="imageUrl"
        :alt="product.name"
        class="max-h-[200px] w-auto max-w-[90%] object-contain transition-transform duration-500 group-hover:scale-108 drop-shadow-sm"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div
        v-else
        class="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-100 p-4"
      >
        <div class="h-32 w-20 rounded-2xl border-4 border-slate-700 bg-slate-900 shadow-md flex items-center justify-center">
          <span class="text-xs text-white/50 font-bold">Lieng</span>
        </div>
        <div class="mt-2 h-1.5 w-8 rounded-full bg-slate-300" />
      </div>
    </div>

    <!-- Product Info -->
    <div class="flex flex-1 flex-col pt-3">
      <!-- Brand & Rating -->
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-extrabold uppercase tracking-wider text-red-600">{{ product.brand }}</span>
        <div class="flex items-center gap-1 text-slate-500 font-medium">
          <span class="text-amber-400 text-xs">★</span>
          <span>{{ product.rating ?? '4.9' }}</span>
          <span class="text-slate-300">·</span>
          <span>Đã bán {{ product.sold ?? 120 }}</span>
        </div>
      </div>

      <!-- Product Name -->
      <h3
        class="mt-1 line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-red-600 cursor-pointer min-h-[40px]"
        @click="emit('view', product)"
      >
        {{ product.name }}
      </h3>

      <!-- Spec Pills -->
      <div class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="spec in (product.specs || []).slice(0, 3)"
          :key="spec"
          class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
        >
          {{ spec }}
        </span>
      </div>

      <!-- Price Block -->
      <div class="mt-auto pt-3 border-t border-dashed border-slate-100">
        <div class="flex items-baseline gap-2">
          <span class="text-base font-black text-red-600 sm:text-lg">
            {{ formatPrice(product.price) }}
          </span>
          <span
            v-if="product.oldPrice"
            class="text-xs font-semibold text-slate-400 line-through"
          >
            {{ formatPrice(product.oldPrice) }}
          </span>
        </div>
        <p class="text-[10px] text-emerald-600 font-medium mt-0.5">
          ✓ Có sẵn hàng — Giao nhanh 2H
        </p>

        <!-- Action Buttons -->
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            @click="emit('view', product)"
          >
            Chi tiết
          </button>
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2 text-xs font-extrabold text-white shadow-md shadow-red-600/20 transition hover:from-red-700 hover:to-rose-700 hover:shadow-lg disabled:opacity-50"
            :disabled="product.inStock === false"
            @click="emit('add-to-cart', product)"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>{{ product.inStock === false ? 'Đặt trước' : 'Chọn mua' }}</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

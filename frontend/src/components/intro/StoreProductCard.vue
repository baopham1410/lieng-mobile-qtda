<script setup>
import { computed, ref } from 'vue'
import { formatPrice } from '@/data/storeIntro'
import { resolveProductImageUrl } from '@/utils/productImage'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['view', 'add-to-cart'])

const imageFailed = ref(false)

const imageUrl = computed(() => resolveProductImageUrl(props.product.image))
</script>

<template>
  <article
    v-tilt-3d="{ max: 10, scale: 1.02 }"
    class="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121318]/90 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
  >
    <div class="relative aspect-square overflow-hidden bg-[#0d0e12] p-4 flex items-center justify-center border-b border-white/5">
      <span
        v-if="product.badge"
        class="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-orange-600/30"
      >
        {{ product.badge }}
      </span>
      <img
        v-if="imageUrl && !imageFailed"
        :src="imageUrl"
        :alt="product.name"
        class="mx-auto h-full w-full max-h-[220px] max-w-[220px] object-contain transition duration-300 group-hover:scale-105 drop-shadow-md"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div
        v-else
        class="mx-auto flex h-full max-w-[180px] flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-gray-800 to-gray-900 p-4 shadow-inner border border-white/5"
      >
        <div class="h-36 w-20 rounded-2xl border-2 border-amber-500/30 bg-black/60 shadow-xl" />
        <div class="mt-2 h-1.5 w-10 rounded-full bg-gray-700" />
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p class="text-xs font-bold uppercase tracking-wider text-amber-400">{{ product.brand }}</p>
      <h3 class="mt-1 line-clamp-2 text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{{ product.name }}</h3>
      <ul class="mt-2 flex flex-wrap gap-1">
        <li
          v-for="spec in product.specs"
          :key="spec"
          class="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-gray-300 font-light"
        >
          {{ spec }}
        </li>
      </ul>
      <div class="mt-auto pt-4">
        <p class="text-lg font-extrabold text-amber-400">{{ formatPrice(product.price) }}</p>
        <p v-if="product.oldPrice" class="text-xs text-gray-500 line-through">{{ formatPrice(product.oldPrice) }}</p>
        <div class="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            class="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:border-amber-400/40 hover:text-white cursor-pointer"
            @click="emit('view', product)"
          >
            Chi tiết
          </button>
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-600/30 transition active:scale-95 disabled:opacity-40 cursor-pointer"
            :disabled="product.inStock === false"
            @click="emit('add-to-cart', product)"
          >
            <StoreDeviceIcon name="bag" size-class="h-4 w-4 text-white" />
            <span>{{ product.inStock === false ? 'Đặt trước' : 'Thêm giỏ' }}</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

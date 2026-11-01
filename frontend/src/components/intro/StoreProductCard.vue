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
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
  >
    <div class="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-white p-4">
      <span
        v-if="product.badge"
        class="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white"
      >
        {{ product.badge }}
      </span>
      <img
        v-if="imageUrl && !imageFailed"
        :src="imageUrl"
        :alt="product.name"
        class="mx-auto h-full w-full max-h-[220px] max-w-[220px] object-contain transition duration-300 group-hover:scale-105"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div
        v-else
        class="mx-auto flex h-full max-w-[180px] flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-gray-200/80 to-gray-300/40 p-4 shadow-inner"
      >
        <div class="h-36 w-20 rounded-2xl border-4 border-gray-800 bg-gray-900 shadow-xl" />
        <div class="mt-2 h-1.5 w-10 rounded-full bg-gray-700" />
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-red-600">{{ product.brand }}</p>
      <h3 class="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">{{ product.name }}</h3>
      <ul class="mt-2 flex flex-wrap gap-1">
        <li
          v-for="spec in product.specs"
          :key="spec"
          class="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
        >
          {{ spec }}
        </li>
      </ul>
      <div class="mt-auto pt-4">
        <p class="text-lg font-bold text-red-600">{{ formatPrice(product.price) }}</p>
        <p v-if="product.oldPrice" class="text-xs text-gray-400 line-through">{{ formatPrice(product.oldPrice) }}</p>
        <div class="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            class="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-red-300 hover:text-red-600"
            @click="emit('view', product)"
          >
            Chi tiết
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            :disabled="product.inStock === false"
            @click="emit('add-to-cart', product)"
          >
            {{ product.inStock === false ? 'Đặt trước' : 'Thêm giỏ' }}
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

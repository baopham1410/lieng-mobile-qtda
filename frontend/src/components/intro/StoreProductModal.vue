<script setup>
import { computed, ref, watch } from 'vue'
import { formatPrice } from '@/mocks/storeCatalog'
import { storeInfo } from '@/data/storeIntro'
import { resolveProductImageUrl } from '@/utils/productImage'

const props = defineProps({
  open: { type: Boolean, default: false },
  product: { type: Object, default: null },
})

const emit = defineEmits(['close', 'add-to-cart'])

const imageFailed = ref(false)
const selectedColor = ref('')

const imageUrl = computed(() => resolveProductImageUrl(props.product?.image))

watch(
  () => props.product,
  (p) => {
    imageFailed.value = false
    selectedColor.value = p?.colors?.[0] ?? ''
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && product"
      class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      @click.self="emit('close')"
    >
      <div class="custom-scrollbar-content max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div class="relative">
          <div class="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-white p-8 sm:aspect-[16/10]">
            <img
              v-if="imageUrl && !imageFailed"
              :src="imageUrl"
              :alt="product.name"
              class="mx-auto h-full max-h-72 w-full object-contain"
              @error="imageFailed = true"
            />
            <div v-else class="flex h-full items-center justify-center">
              <div class="h-48 w-24 rounded-3xl border-4 border-gray-800 bg-gray-900 shadow-xl" />
            </div>
            <span class="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              {{ product.badge }}
            </span>
            <button
              type="button"
              class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="p-6 sm:p-8">
          <p class="text-xs font-bold uppercase tracking-widest text-red-600">{{ product.brand }}</p>
          <h2 class="mt-1 text-2xl font-black text-gray-900">{{ product.name }}</h2>

          <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span class="flex items-center gap-0.5 text-amber-500">
              <span v-for="n in 5" :key="n">{{ n <= Math.round(product.rating) ? '★' : '☆' }}</span>
            </span>
            <span class="text-gray-500">{{ product.rating }} · Đã bán {{ product.sold }}</span>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="product.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'"
            >
              {{ product.inStock ? 'Còn hàng' : 'Đặt trước' }}
            </span>
          </div>

          <div class="mt-5 flex flex-wrap items-end gap-3">
            <p class="text-3xl font-black text-red-600">{{ formatPrice(product.price) }}</p>
            <p class="text-sm text-gray-400 line-through">{{ formatPrice(product.oldPrice) }}</p>
          </div>

          <p class="mt-4 text-sm leading-relaxed text-gray-600">{{ product.description }}</p>

          <ul class="mt-4 flex flex-wrap gap-2">
            <li
              v-for="spec in product.specs"
              :key="spec"
              class="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
            >
              {{ spec }}
            </li>
          </ul>

          <div v-if="product.colors?.length" class="mt-6">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Màu sắc</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="color in product.colors"
                :key="color"
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium ring-1 transition"
                :class="selectedColor === color ? 'bg-red-600 text-white ring-red-600' : 'bg-white text-gray-700 ring-gray-200 hover:ring-red-300'"
                @click="selectedColor = color"
              >
                {{ color }}
              </button>
            </div>
          </div>

          <div class="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
            Bảo hành {{ product.warrantyMonths }} tháng chính hãng · IMEI tra cứu minh bạch tại quầy.
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              class="flex-1 rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white transition hover:bg-red-600"
              @click="emit('add-to-cart', product)"
            >
              {{ product.inStock ? 'Thêm vào giỏ' : 'Đặt trước' }}
            </button>
            <a
              :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
              class="flex-1 rounded-xl border border-gray-300 py-3.5 text-center text-sm font-bold text-gray-700 transition hover:border-red-400 hover:text-red-600"
            >
              Gọi tư vấn
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

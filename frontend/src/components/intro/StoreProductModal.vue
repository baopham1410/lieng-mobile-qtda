<script setup>
import { computed, ref, watch } from 'vue'
import { formatPrice } from '@/mocks/storeCatalog'
import { storeInfo } from '@/data/storeIntro'
import { resolveProductImageUrl } from '@/utils/productImage'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

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
      class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-xs p-0 sm:items-center sm:p-4"
      @click.self="emit('close')"
    >
      <div class="custom-scrollbar-content max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-red-100">
        <div class="relative">
          <div class="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-white p-8 sm:aspect-[16/10] flex items-center justify-center">
            <img
              v-if="imageUrl && !imageFailed"
              :src="imageUrl"
              :alt="product.name"
              class="mx-auto h-full max-h-72 w-full object-contain"
              @error="imageFailed = true"
            />
            <div v-else class="flex h-full items-center justify-center">
              <div class="h-48 w-24 rounded-3xl border-4 border-slate-700 bg-slate-800 shadow-xl" />
            </div>
            <span class="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-md shadow-red-500/30">
              {{ product.badge }}
            </span>
            <button
              type="button"
              class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 hover:text-red-600 shadow transition cursor-pointer"
              aria-label="Đóng"
              @click="emit('close')"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-6 sm:p-8">
          <p class="text-xs font-bold uppercase tracking-widest text-red-600">{{ product.brand }}</p>
          <h2 class="mt-1 text-2xl font-black text-slate-900">{{ product.name }}</h2>

          <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span class="flex items-center gap-0.5 text-amber-500">
              <span v-for="n in 5" :key="n">{{ n <= Math.round(product.rating) ? '★' : '☆' }}</span>
            </span>
            <span class="text-slate-500 text-xs font-medium">{{ product.rating }} · Đã bán {{ product.sold }}</span>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-bold"
              :class="product.inStock ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'"
            >
              {{ product.inStock ? 'Còn hàng' : 'Đặt trước' }}
            </span>
          </div>

          <div class="mt-5 flex flex-wrap items-end gap-3">
            <p class="text-3xl font-black text-red-600">{{ formatPrice(product.price) }}</p>
            <p v-if="product.oldPrice && product.oldPrice > product.price" class="text-sm text-slate-400 line-through font-medium">
              {{ formatPrice(product.oldPrice) }}
            </p>
          </div>

          <ul class="mt-6 space-y-2 text-sm text-slate-600">
            <li
              v-for="spec in product.specs"
              :key="spec"
              class="flex items-center gap-2"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-red-600" />
              <span>{{ spec }}</span>
            </li>
          </ul>

          <div v-if="product.colors?.length" class="mt-6">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Màu sắc</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="color in product.colors"
                :key="color"
                type="button"
                class="rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer"
                :class="selectedColor === color ? 'bg-red-600 text-white shadow-md shadow-red-500/25 ring-2 ring-red-600' : 'bg-white text-slate-700 border border-slate-200 hover:border-red-300'"
                @click="selectedColor = color"
              >
                {{ color }}
              </button>
            </div>
          </div>

          <div class="mt-6 flex items-center gap-3 rounded-2xl bg-red-50/80 p-4 text-sm text-red-800 border border-red-100">
            <StoreDeviceIcon name="warranty" size-class="h-5 w-5 text-red-600 shrink-0" />
            <p class="text-xs sm:text-sm font-medium leading-relaxed">
              Bảo hành {{ product.warrantyMonths }} tháng chính hãng · IMEI tra cứu minh bạch tại quầy.
            </p>
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition cursor-pointer active:scale-98"
              @click="emit('add-to-cart', product)"
            >
              <StoreDeviceIcon name="bag" size-class="h-4 w-4 text-white" />
              <span>{{ product.inStock ? 'Thêm vào giỏ hàng' : 'Đặt trước máy' }}</span>
            </button>
            <a
              :href="`tel:${storeInfo.hotline.replace(/\s/g, '')}`"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-3.5 text-center text-sm font-bold text-red-700 transition hover:bg-red-100 hover:border-red-300 active:scale-98"
            >
              <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-red-600" />
              <span>Gọi tư vấn: {{ storeInfo.hotlineDisplay }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

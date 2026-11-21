<script setup>
import { computed } from 'vue'
import { formatPrice } from '@/mocks/storeCatalog'
import AppProductThumb from '@/components/common/AppProductThumb.vue'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'update-qty', 'remove', 'checkout'])

const total = computed(() => props.items.reduce((sum, item) => sum + item.price * item.qty, 0))
const itemCount = computed(() => props.items.reduce((sum, item) => sum + item.qty, 0))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="custom-scrollbar-content flex h-full w-full max-w-md flex-col border-l border-red-100 bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <!-- Header -->
        <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <StoreDeviceIcon name="bag" size-class="h-4 w-4 text-red-600" />
                <span>Giỏ hàng</span>
              </div>
              <h3 class="mt-1 text-xl font-black text-slate-900">{{ itemCount }} thiết bị</h3>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              aria-label="Đóng"
              @click="emit('close')"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="items.length === 0" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 mb-4 shadow-inner">
            <StoreDeviceIcon name="bag" size-class="h-10 w-10 text-red-600" />
          </div>
          <p class="text-base font-bold text-slate-900">Giỏ hàng của bạn đang trống</p>
          <p class="mt-1.5 text-xs text-slate-500 max-w-xs leading-relaxed">
            Chọn thêm iPhone, Samsung hoặc phụ kiện chính hãng để tiến hành đặt giữ máy tại quầy.
          </p>
          <button
            type="button"
            class="mt-6 rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-500/25 transition cursor-pointer"
            @click="emit('close')"
          >
            Tiếp tục mua sắm
          </button>
        </div>

        <!-- Items List -->
        <div v-else class="flex flex-1 flex-col overflow-hidden">
          <div class="custom-scrollbar-content flex-1 space-y-3 overflow-y-auto p-4">
            <article
              v-for="item in items"
              :key="item.id"
              class="flex gap-3.5 rounded-2xl border border-red-50 bg-slate-50/60 p-3.5 transition hover:border-red-100"
            >
              <AppProductThumb
                :src="item.image"
                :name="item.name"
                size="lg"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-slate-900">{{ item.name }}</p>
                <p class="text-xs text-slate-500 font-medium">{{ item.brand }}</p>
                <p class="mt-1 text-sm font-black text-red-600">{{ formatPrice(item.price) }}</p>
                <div class="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-600 transition cursor-pointer"
                    @click="emit('update-qty', item.id, item.qty - 1)"
                  >
                    −
                  </button>
                  <span class="min-w-[1.5rem] text-center text-xs font-bold text-slate-800">{{ item.qty }}</span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-600 transition cursor-pointer"
                    @click="emit('update-qty', item.id, item.qty + 1)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 transition cursor-pointer"
                    @click="emit('remove', item.id)"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- Checkout Box -->
          <div class="border-t border-red-100 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500 font-medium">Tạm tính:</span>
              <span class="text-xl font-black text-red-600">{{ formatPrice(total) }}</span>
            </div>
            <p class="mt-1 text-[11px] text-slate-400">
              * Giá đã bao gồm thuế GTGT — thanh toán và nhận máy trực tiếp tại quầy hoặc ship COD.
            </p>
            <button
              type="button"
              class="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-700 active:scale-95 cursor-pointer"
              @click="emit('checkout')"
            >
              <StoreDeviceIcon name="bag" size-class="h-4 w-4 text-white" />
              <span>Tiến hành đặt hàng / Tư vấn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

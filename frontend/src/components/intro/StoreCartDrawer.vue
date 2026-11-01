<script setup>
import { computed } from 'vue'
import { formatPrice } from '@/mocks/storeCatalog'
import AppProductThumb from '@/components/common/AppProductThumb.vue'

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
      class="fixed inset-0 z-[100] flex justify-end bg-black/40"
      @click.self="emit('close')"
    >
      <div class="custom-scrollbar-content flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl">
        <div class="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Giỏ hàng</p>
              <h3 class="mt-1 text-xl font-black text-gray-900">{{ itemCount }} sản phẩm</h3>
            </div>
            <button
              type="button"
              class="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              @click="emit('close')"
            >
              Đóng
            </button>
          </div>
        </div>

        <div v-if="items.length === 0" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p class="text-5xl">🛒</p>
          <p class="mt-4 font-semibold text-gray-700">Giỏ hàng trống</p>
          <p class="mt-2 text-sm text-gray-500">Thêm sản phẩm để đặt hàng hoặc tư vấn tại quầy.</p>
          <button
            type="button"
            class="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
            @click="emit('close')"
          >
            Tiếp tục mua sắm
          </button>
        </div>

        <div v-else class="flex flex-1 flex-col overflow-hidden">
          <div class="custom-scrollbar-content flex-1 space-y-3 overflow-y-auto p-4">
            <article
              v-for="item in items"
              :key="item.id"
              class="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3"
            >
              <AppProductThumb
                :src="item.image"
                :name="item.name"
                size="lg"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-gray-900">{{ item.name }}</p>
                <p class="text-xs text-gray-500">{{ item.brand }}</p>
                <p class="mt-1 text-sm font-bold text-red-600">{{ formatPrice(item.price) }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold ring-1 ring-gray-200"
                    @click="emit('update-qty', item.id, item.qty - 1)"
                  >
                    −
                  </button>
                  <span class="min-w-[1.5rem] text-center text-sm font-semibold">{{ item.qty }}</span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold ring-1 ring-gray-200"
                    @click="emit('update-qty', item.id, item.qty + 1)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    class="ml-auto text-xs font-medium text-gray-400 hover:text-red-600"
                    @click="emit('remove', item.id)"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div class="border-t border-gray-100 bg-white p-6">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Tạm tính</span>
              <span class="text-lg font-black text-gray-900">{{ formatPrice(total) }}</span>
            </div>
            <p class="mt-1 text-xs text-gray-400">Giá chưa gồm khuyến mãi tại quầy — thanh toán khi nhận hàng.</p>
            <button
              type="button"
              class="mt-4 w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white transition hover:bg-red-700"
              @click="emit('checkout')"
            >
              Đặt hàng / Tư vấn
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

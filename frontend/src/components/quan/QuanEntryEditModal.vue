<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppMoneyInput from '@/components/common/AppMoneyInput.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  entry: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  title: '',
  amount: '',
  qty: 1,
  paymentMethod: 'cash',
  cashAmount: '',
  note: '',
})

const formError = ref('')

const salePaymentOptions = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'mixed', label: 'Cả hai' },
]

const transferPreview = computed(() => {
  const total = Number(form.value.amount) || 0
  if (form.value.paymentMethod !== 'mixed') return 0
  return Math.max(0, total - (Number(form.value.cashAmount) || 0))
})

watch(
  () => [props.open, props.entry],
  () => {
    if (!props.open || !props.entry) return
    formError.value = ''
    form.value = {
      title: props.entry.title || '',
      amount: props.entry.amount ?? '',
      qty: props.entry.qty || 1,
      paymentMethod: props.entry.paymentMethod || 'cash',
      cashAmount:
        props.entry.paymentMethod === 'mixed'
          ? props.entry.cashAmount ?? ''
          : '',
      note: props.entry.note || '',
    }
  },
  { immediate: true },
)

function submit() {
  const title = form.value.title.trim()
  const amount = Number(form.value.amount)
  const qty = Number(form.value.qty) || 1

  if (!title) {
    formError.value = 'Nhập tên / nội dung.'
    return
  }
  if (!amount || amount <= 0) {
    formError.value = 'Nhập số tiền hợp lệ.'
    return
  }

  if (form.value.paymentMethod === 'mixed') {
    const cash = Number(form.value.cashAmount) || 0
    if (cash <= 0 || cash >= amount) {
      formError.value = 'Tiền mặt phải lớn hơn 0 và nhỏ hơn tổng.'
      return
    }
  }

  const payload = {
    title,
    amount,
    payment_method: form.value.paymentMethod,
    note: form.value.note || undefined,
  }

  if (props.entry?.type === 'income') {
    payload.qty = qty
  }

  if (form.value.paymentMethod === 'mixed') {
    payload.cash_amount = Number(form.value.cashAmount) || 0
    payload.transfer_amount = transferPreview.value
  }

  emit('save', payload)
}
</script>

<template>
  <AppModal :open="open" @close="emit('close')">
    <div class="w-full max-w-md rounded-[24px] border border-amber-200 bg-white shadow-2xl">
      <div class="border-b border-amber-100 px-6 py-4">
        <p class="text-xs font-bold uppercase tracking-widest text-amber-700">Chỉnh sửa</p>
        <h3 class="mt-1 text-lg font-bold text-[#111118]">
          {{ entry?.type === 'expense' ? 'Khoản chi' : 'Dòng bán' }}
        </h3>
        <p v-if="entry?.code" class="mt-1 font-mono text-xs text-slate-400">{{ entry.code }}</p>
      </div>
      <div class="space-y-4 p-6">
        <p v-if="formError" class="rounded-[12px] bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Nội dung</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số tiền</label>
          <AppMoneyInput
            v-model="form.amount"
            show-preview
            input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <div v-if="entry?.type === 'income'">
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số lượng</label>
          <input
            v-model.number="form.qty"
            type="number"
            min="1"
            max="999"
            class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Thanh toán</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="opt in salePaymentOptions"
              :key="opt.value"
              type="button"
              class="rounded-[12px] px-2 py-2.5 text-xs font-bold transition"
              :class="
                form.paymentMethod === opt.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-amber-50/80 text-slate-600 ring-1 ring-amber-100 hover:bg-amber-50'
              "
              @click="form.paymentMethod = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <template v-if="form.paymentMethod === 'mixed'">
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Tiền mặt</label>
            <AppMoneyInput
              v-model="form.cashAmount"
              :max="Number(form.amount) || 0"
              show-preview
              input-class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <p class="text-sm text-slate-500">
            Chuyển khoản:
            <strong class="text-sky-700">{{ new Intl.NumberFormat('vi-VN').format(transferPreview) }}đ</strong>
          </p>
        </template>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Ghi chú</label>
          <input
            v-model="form.note"
            type="text"
            class="w-full rounded-[14px] border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            @click="emit('close')"
          >
            Hủy
          </button>
          <button
            type="button"
            class="rounded-[14px] bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            @click="submit"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  </AppModal>
</template>

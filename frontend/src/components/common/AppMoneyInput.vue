<script setup>
import { computed, ref } from 'vue'
import { formatMoney } from '@/utils/formatCurrency'

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: '',
  },
  placeholder: {
    type: String,
    default: '0',
  },
  hideZero: {
    type: Boolean,
    default: true,
  },
  max: {
    type: Number,
    default: null,
  },
  inputClass: {
    type: String,
    default:
      'w-full rounded-[12px] border border-red-200 bg-red-50/60 px-3 py-2 text-sm outline-none focus:border-red-400',
  },
  /** Hiện dòng xem trước có dấu chấm khi đang gõ */
  showPreview: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const focused = ref(false)

const amount = computed(() => {
  if (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined) {
    return null
  }
  const n = Number(props.modelValue)
  return Number.isFinite(n) ? Math.trunc(n) : null
})

/** Đang focus: chỉ chữ số để gõ không lỗi. Blur: format có dấu chấm. */
const displayValue = computed(() => {
  if (amount.value == null) return ''
  if (amount.value === 0 && props.hideZero) return ''
  if (focused.value) return String(amount.value)
  return formatMoney(amount.value)
})

const previewText = computed(() => {
  if (!focused.value || amount.value == null) return ''
  if (amount.value === 0 && props.hideZero) return ''
  return formatMoney(amount.value)
})

function onFocus() {
  focused.value = true
}

function onBlur() {
  focused.value = false
}

function onInput(event) {
  const digits = String(event.target.value ?? '').replace(/\D/g, '')

  if (!digits) {
    emit('update:modelValue', '')
    return
  }

  let next = Number(digits)
  if (props.max != null) next = Math.min(next, props.max)
  emit('update:modelValue', Math.max(0, Math.trunc(next)))
}
</script>

<template>
  <div class="w-full">
    <input
      :value="displayValue"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :placeholder="placeholder"
      :class="inputClass"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    />
    <p
      v-if="showPreview && previewText"
      class="mt-1.5 text-xs font-semibold tabular-nums text-amber-800"
    >
      {{ previewText }} ₫
    </p>
  </div>
</template>

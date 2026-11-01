<script setup>
import { ref, watch } from 'vue'
import AppProductThumb from '@/components/common/AppProductThumb.vue'
import { removeProductImage, uploadProductImage } from '@/api/products'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps({
  productId: {
    type: [String, Number],
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  categorySlug: {
    type: String,
    default: '',
  },
  hasCustomImage: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated'])

const locale = useLocaleStore()
const fileInput = ref(null)
const uploading = ref(false)
const removing = ref(false)
const imageSrc = ref(props.image)
const isCustom = ref(props.hasCustomImage)
const error = ref('')

watch(
  () => [props.image, props.hasCustomImage],
  ([image, custom]) => {
    imageSrc.value = image ?? ''
    isCustom.value = !!custom
  },
)

function openPicker() {
  fileInput.value?.click()
}

async function onFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = locale.t('products.image.invalidType')
    return
  }

  uploading.value = true
  error.value = ''
  try {
    const { data } = await uploadProductImage(props.productId, file)
    imageSrc.value = data.data?.image ?? ''
    isCustom.value = !!data.data?.hasCustomImage
    emit('updated', data.data)
  } catch (err) {
    error.value = err.response?.data?.message ?? locale.t('products.image.uploadFailed')
  } finally {
    uploading.value = false
  }
}

async function handleRemove() {
  if (!isCustom.value) return
  removing.value = true
  error.value = ''
  try {
    const { data } = await removeProductImage(props.productId)
    imageSrc.value = data.data?.image ?? ''
    isCustom.value = !!data.data?.hasCustomImage
    emit('updated', data.data)
  } catch (err) {
    error.value = err.response?.data?.message ?? locale.t('products.image.removeFailed')
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="rounded-[18px] border border-red-100 bg-[#fffafa] p-4 ring-1 ring-red-50">
    <div class="flex flex-wrap items-start gap-4">
      <AppProductThumb
        :src="imageSrc"
        :name="name"
        :category-slug="categorySlug"
        size="lg"
      />

      <div class="min-w-0 flex-1 space-y-2">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
            {{ locale.t('products.image.title') }}
          </p>
          <p class="mt-1 text-sm text-slate-500">
            {{ locale.t('products.image.hint') }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-[12px] bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            :disabled="uploading || removing"
            @click="openPicker"
          >
            {{ uploading ? locale.t('products.image.uploading') : locale.t('products.image.upload') }}
          </button>
          <button
            v-if="isCustom"
            type="button"
            class="rounded-[12px] bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-red-100 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            :disabled="uploading || removing"
            @click="handleRemove"
          >
            {{ removing ? locale.t('common.updating') : locale.t('products.image.remove') }}
          </button>
        </div>

        <p v-if="isCustom" class="text-xs font-medium text-emerald-600">
          {{ locale.t('products.image.customBadge') }}
        </p>
        <p v-else-if="imageSrc" class="text-xs text-slate-400">
          {{ locale.t('products.image.catalogBadge') }}
        </p>

        <p v-if="error" class="text-xs font-medium text-red-600">{{ error }}</p>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>

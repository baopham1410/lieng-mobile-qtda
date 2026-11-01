import { ref } from 'vue'

export function useToast() {
  const message = ref('')
  const type = ref('info')

  function show(msg, toastType = 'info') {
    message.value = msg
    type.value = toastType
    setTimeout(() => {
      message.value = ''
    }, 3000)
  }

  return { message, type, show }
}

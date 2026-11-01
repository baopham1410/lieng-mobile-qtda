import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.total, 0),
  )

  const count = computed(() => items.value.length)

  function addItem(item) {
    items.value.push(item)
  }

  function removeItem(index) {
    items.value.splice(index, 1)
  }

  function clear() {
    items.value = []
  }

  return { items, total, count, addItem, removeItem, clear }
})

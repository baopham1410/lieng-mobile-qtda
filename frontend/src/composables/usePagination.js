import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function usePagination(fetchFn, defaultPerPage = 20) {
  const route = useRoute()
  const items = ref([])
  const meta = ref({})
  const loading = ref(false)
  const page = ref(Number(route.query.page) || 1)
  const perPage = ref(defaultPerPage)

  async function load(extraParams = {}) {
    loading.value = true
    try {
      const { data } = await fetchFn({
        page: page.value,
        per_page: perPage.value,
        ...extraParams,
      })
      items.value = data.data ?? data
      meta.value = data.meta ?? {}
    } finally {
      loading.value = false
    }
  }

  watch(page, () => load())

  return { items, meta, loading, page, perPage, load }
}

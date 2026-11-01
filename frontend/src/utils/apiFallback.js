export async function withApiFallback(apiCall, fallback) {
  try {
    return await apiCall()
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback
  }
}

/**
 * Hiển thị dữ liệu cache/mock ngay, sau đó cập nhật từ API nền.
 */
export function withApiFallbackEager(apiCall, fallback, onUpdate) {
  const fallbackFn = typeof fallback === 'function' ? fallback : () => fallback
  const initial = fallbackFn()

  apiCall()
    .then((result) => {
      if (onUpdate) onUpdate(result)
    })
    .catch(() => {})

  return initial
}

export function mapPaginated(response) {
  const body = response && typeof response === 'object' && !Array.isArray(response) ? response : { data: response }

  const payload = body.data
  let rows = []

  if (Array.isArray(payload)) {
    rows = payload
  } else if (payload && Array.isArray(payload.data)) {
    rows = payload.data
  }

  return {
    rows,
    stats: body.stats ?? null,
    filters: body.filters ?? null,
    meta: body.meta ?? payload?.meta ?? null,
  }
}

export function unwrapApiData(body) {
  return body?.data !== undefined ? body.data : body
}

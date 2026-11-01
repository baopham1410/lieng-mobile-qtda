/** Dịch Lào → Việt (MyMemory, không cần API key) */
export async function translateLaoToVietnamese(text) {
  const q = String(text || '').trim()
  if (!q) return ''

  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', q.slice(0, 450))
  url.searchParams.set('langpair', 'lo|vi')

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error('Không gọi được máy dịch. Kiểm tra mạng và thử lại.')
  }

  const data = await res.json()
  const translated = data?.responseData?.translatedText
  if (!translated || /INVALID|QUERY LENGTH/i.test(translated)) {
    throw new Error(data?.responseDetails || 'Không dịch được đoạn này.')
  }

  return String(translated).trim()
}

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { languageOptions, messages } from '@/i18n/messages'

const STORAGE_KEY = 'lieng_locale'

function readStoredLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'lo' ? 'lo' : 'vi'
}

function applyDocumentLocale(code) {
  document.documentElement.lang = code === 'lo' ? 'lo' : 'vi'
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref(readStoredLocale())
  applyDocumentLocale(locale.value)

  const currentLanguage = computed(
    () => languageOptions.find((item) => item.code === locale.value) ?? languageOptions[0],
  )

  function t(key, params = {}) {
    let text = messages[locale.value]?.[key] ?? messages.vi[key] ?? key
    Object.entries(params).forEach(([name, value]) => {
      text = text.replace(`{${name}}`, String(value))
    })
    return text
  }

  const productStatusMap = {
    'Đang bán': 'status.selling',
    'Sắp hết': 'status.lowStock',
    'Hết hàng': 'status.outOfStock',
    'Tạm ẩn': 'status.hidden',
  }

  const categoryMap = {
    'Điện thoại': 'category.phone',
    Tablet: 'category.tablet',
    Laptop: 'category.laptop',
    'Phụ kiện': 'category.accessory',
    Tivi: 'category.tv',
    'Tủ lạnh': 'category.fridge',
    Quạt: 'category.fan',
  }

  function translateProductStatus(status) {
    const key = productStatusMap[status]
    return key ? t(key) : status
  }

  function translateCategory(name) {
    const key = categoryMap[name]
    return key ? t(key) : name
  }

  function setLocale(code) {
    if (!messages[code]) return
    locale.value = code
    localStorage.setItem(STORAGE_KEY, code)
    applyDocumentLocale(code)
  }

  function pageMeta(routeName) {
    const titleKey = `page.${routeName}.title`
    if (!messages.vi[titleKey]) {
      return null
    }

    return {
      title: t(titleKey),
      subtitle: t(`page.${routeName}.subtitle`),
    }
  }

  return {
    locale,
    currentLanguage,
    languageOptions,
    t,
    setLocale,
    pageMeta,
    translateProductStatus,
    translateCategory,
  }
})

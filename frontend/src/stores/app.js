import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'lieng_sidebar_open'

function readStoredSidebarOpen() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === '0') return false
  if (saved === '1') return true
  return true
}

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(readStoredSidebarOpen())

  function persistSidebarOpen() {
    localStorage.setItem(STORAGE_KEY, sidebarOpen.value ? '1' : '0')
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
    persistSidebarOpen()
  }

  function setSidebarOpen(open) {
    sidebarOpen.value = open
    persistSidebarOpen()
  }

  return { sidebarOpen, toggleSidebar, setSidebarOpen }
})

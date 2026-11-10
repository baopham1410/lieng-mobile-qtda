import apiClient, { silentRequest } from './client'
import { mockBotReply } from '@/mocks/chatbotMock'

const chatConfig = {
  ...silentRequest,
  timeout: 120000,
  loadingMessage: 'Đang hỏi trợ lý…',
}

/**
 * @param {'public'|'internal'} variant
 * @param {string} message
 */
export async function askAssistant(variant, message) {
  const path = variant === 'internal' ? '/assistant/chat' : '/assistant/public-chat'
  try {
    const { data } = await apiClient.post(path, { message }, chatConfig)
    const answer = data?.data?.answer
    if (!answer) {
      throw new Error('Trợ lý không trả lời được.')
    }
    return {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: String(answer),
      at: new Date().toISOString(),
      sources: data?.data?.sources || [],
      fromRag: true,
    }
  } catch (err) {
    // Fallback mock nếu service/Laravel down — vẫn chat được khi demo UI
    const status = err.response?.status
    const apiMsg = err.response?.data?.message
    if (status === 401 && variant === 'internal') {
      throw err
    }
    const mock = await mockBotReply(variant, message)
    const hint =
      apiMsg ||
      (status === 503
        ? 'AI chưa bật (Ollama / :8090). Đang trả lời demo.'
        : 'Không gọi được AI — trả lời demo.')
    return {
      ...mock,
      content: `${mock.content}\n\n_(${hint})_`,
      fromRag: false,
    }
  }
}

export async function fetchAssistantHealth() {
  const { data } = await apiClient.get('/assistant/health', { ...silentRequest, timeout: 5000 })
  return data
}

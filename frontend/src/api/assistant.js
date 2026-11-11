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
    const payload = data?.data
    const answer = payload?.answer
    if (!answer) {
      throw new Error('Trợ lý không trả lời được.')
    }
    return {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: String(answer),
      at: new Date().toISOString(),
      intent: payload?.intent || null,
      blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
      sources: payload?.sources || [],
      fastPath: Boolean(payload?.fast_path),
      fromRag: !payload?.fast_path,
    }
  } catch (err) {
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
      blocks: mock.blocks || fallbackBlocks(variant, message),
      fromRag: false,
      fastPath: false,
    }
  }
}

function fallbackBlocks(variant, message) {
  const q = String(message || '').toLowerCase()
  if (variant === 'internal') {
    if (/hết hàng|tồn|nhập kho|imei/.test(q)) {
      return [
        {
          type: 'actions',
          items: [
            { label: 'Mở Sản phẩm', to: '/products' },
            { label: 'Tạo nhập kho', to: '/inventory/imports' },
          ],
        },
        { type: 'chips', items: ['SP nào hết hàng?', 'POS bán thế nào?'] },
      ]
    }
    return [
      {
        type: 'actions',
        items: [
          { label: 'POS', to: '/pos' },
          { label: 'Nhập kho', to: '/inventory/imports' },
          { label: 'Bảo hành', to: '/warranty' },
        ],
      },
      { type: 'chips', items: ['SP hết hàng?', 'Nhập kho IMEI?'] },
    ]
  }
  return [
    {
      type: 'actions',
      items: [
        { label: 'Gọi hotline', href: 'tel:0383435600' },
        { label: 'Zalo', href: 'https://zalo.me/0901234567' },
      ],
    },
    { type: 'chips', items: ['Giờ mở cửa?', 'Có thu cũ không?'] },
  ]
}

export async function fetchAssistantHealth() {
  const { data } = await apiClient.get('/assistant/health', { ...silentRequest, timeout: 5000 })
  return data
}

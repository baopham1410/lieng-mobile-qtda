import { domToPng } from 'modern-screenshot'

const CAPTURE_WIDTH = 820

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
}

/**
 * Clone tờ sao kê ra vùng cố định — tránh modal/scroll làm lệch ảnh.
 */
function prepareCaptureClone(sheet) {
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:' + CAPTURE_WIDTH + 'px',
    'z-index:-1',
    'opacity:0',
    'pointer-events:none',
    'background:#ffffff',
    'overflow:visible',
  ].join(';')

  const clone = sheet.cloneNode(true)
  clone.classList.add('quan-statement-capture')
  clone.style.width = `${CAPTURE_WIDTH}px`
  clone.style.maxWidth = `${CAPTURE_WIDTH}px`

  container.appendChild(clone)
  document.body.appendChild(container)

  return { container, clone }
}

/**
 * Chụp .quan-statement-sheet → PNG (giống màn hình xem trước).
 */
export async function downloadElementAsPng(element, filename = 'sao-ke') {
  const sheet = element?.querySelector?.('.quan-statement-sheet') ?? element
  if (!sheet) {
    throw new Error('Không tìm thấy nội dung sao kê để lưu ảnh.')
  }

  const { container, clone } = prepareCaptureClone(sheet)

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
    await waitForPaint()

    const dataUrl = await domToPng(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      width: clone.scrollWidth,
      height: clone.scrollHeight,
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${filename}.png`
    link.click()
  } finally {
    container.remove()
  }
}

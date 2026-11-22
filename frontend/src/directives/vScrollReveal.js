/**
 * Directive v-scroll-reveal:
 * Tự động tạo hiệu ứng xuất hiện dần (Scroll-driven reveal) khi người dùng cuộn đến vị trí phần tử.
 * Hỗ trợ các tham số:
 * - delay: độ trễ tính bằng ms (ví dụ 100, 200, 300) để tạo hiệu ứng so le (stagger).
 * - distance: khoảng cách trượt vào (mặc định 28px).
 * - duration: thời gian hiệu ứng (mặc định 700ms).
 * - direction: 'bottom' (mặc định), 'top', 'left', 'right', 'scale'.
 */
export const vScrollReveal = {
  mounted(el, binding) {
    const delay = binding.value?.delay || 0
    const distance = binding.value?.distance || '28px'
    const duration = binding.value?.duration || '700ms'
    const direction = binding.value?.direction || 'bottom'

    el.style.transitionProperty = 'opacity, transform, filter'
    el.style.transitionDuration = duration
    el.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)'
    el.style.transitionDelay = `${delay}ms`
    el.style.willChange = 'opacity, transform'
    el.style.opacity = '0'

    if (direction === 'bottom') {
      el.style.transform = `translateY(${distance})`
    } else if (direction === 'top') {
      el.style.transform = `translateY(-${distance})`
    } else if (direction === 'left') {
      el.style.transform = `translateX(-${distance})`
    } else if (direction === 'right') {
      el.style.transform = `translateX(${distance})`
    } else if (direction === 'scale') {
      el.style.transform = 'scale(0.92)'
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1'
            el.style.transform = 'translate(0, 0) scale(1)'
            obs.unobserve(el)
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    el._revealObserver = observer
    observer.observe(el)
  },
  unmounted(el) {
    if (el._revealObserver) {
      el._revealObserver.disconnect()
      delete el._revealObserver
    }
  },
}

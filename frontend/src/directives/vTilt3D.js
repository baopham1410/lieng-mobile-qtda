/**
 * ThreeUI-style 3D Card Parallax Tilt Directive for Vue 3
 * Gives any card or container an Apple / ThreeUI 3D interactive depth effect on mouse hover.
 */

export const vTilt3D = {
  mounted(el, binding) {
    const maxTilt = binding.value?.max ?? 12
    const perspective = binding.value?.perspective ?? 900
    const scale = binding.value?.scale ?? 1.02

    el.style.transformStyle = 'preserve-3d'
    el.style.transition = 'transform 0.15s ease-out, box-shadow 0.25s ease'

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt

      el.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
    }

    const handleMouseEnter = () => {
      el.style.transition = 'transform 0.1s ease-out'
    }

    const handleMouseLeave = () => {
      el.style.transition = 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)'
      el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    }

    el._tiltHandlers = { handleMouseMove, handleMouseEnter, handleMouseLeave }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)
  },

  unmounted(el) {
    if (el._tiltHandlers) {
      el.removeEventListener('mousemove', el._tiltHandlers.handleMouseMove)
      el.removeEventListener('mouseenter', el._tiltHandlers.handleMouseEnter)
      el.removeEventListener('mouseleave', el._tiltHandlers.handleMouseLeave)
      delete el._tiltHandlers
    }
  },
}

export default vTilt3D

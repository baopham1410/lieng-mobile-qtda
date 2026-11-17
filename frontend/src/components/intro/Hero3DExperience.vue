<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  accentColor: {
    type: String,
    default: '#e11d48',
  },
})

const canvasContainer = ref(null)
const isDragging = ref(false)
const isAutoGradeScanning = ref(true)
const selectedColorId = ref('titan-natural')

const colorOptions = [
  { id: 'titan-natural', name: 'Titan Tự Nhiên', hex: '#8c8782', metalHex: 0x9e978e },
  { id: 'titan-black', name: 'Titan Đen', hex: '#222326', metalHex: 0x222428 },
  { id: 'titan-gold', name: 'Titan Sa Mạc', hex: '#bba282', metalHex: 0xbfaa88 },
  { id: 'titan-ruby', name: 'Đỏ Ruby Liêng', hex: '#8b1524', metalHex: 0x8b1524 },
]

// Three.js State
let scene, camera, renderer, animationFrameId
let phoneGroup, phoneBodyMesh, phoneScreenMesh, phoneBezelMesh, cameraBumpGroup
let laserScanGroup, laserMesh
let particleSystem
let width = 0
let height = 0

// Mouse & Interaction State
let mouseX = 0
let mouseY = 0
let targetRotationX = 0.05
let targetRotationY = -0.35
let currentRotationX = 0.05
let currentRotationY = -0.35
let isPointerDown = false
let previousPointerX = 0
let previousPointerY = 0
let isVisible = true
let observer = null

// Material References for dynamic color changing
let metalMaterial = null
let rimLight = null

function createScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Background Gradient - Futuristic Cyber/Apple aesthetic
  const grad = ctx.createLinearGradient(0, 0, 512, 1024)
  grad.addColorStop(0, '#0a0a14')
  grad.addColorStop(0.35, '#2a0914')
  grad.addColorStop(0.7, '#6b1124')
  grad.addColorStop(1, '#08080f')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 1024)

  // Fluid glowing circular waves
  const radGrad1 = ctx.createRadialGradient(256, 450, 20, 256, 450, 280)
  radGrad1.addColorStop(0, 'rgba(244, 63, 94, 0.85)')
  radGrad1.addColorStop(0.5, 'rgba(190, 18, 60, 0.4)')
  radGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad1
  ctx.beginPath()
  ctx.arc(256, 450, 280, 0, Math.PI * 2)
  ctx.fill()

  const radGrad2 = ctx.createRadialGradient(200, 680, 10, 200, 680, 220)
  radGrad2.addColorStop(0, 'rgba(56, 189, 248, 0.65)')
  radGrad2.addColorStop(0.6, 'rgba(14, 165, 233, 0.2)')
  radGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad2
  ctx.beginPath()
  ctx.arc(200, 680, 220, 0, Math.PI * 2)
  ctx.fill()

  // Status Bar / Dynamic Island
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.roundRect(196, 28, 120, 36, 18)
  ctx.fill()

  // Camera lens dot inside dynamic island
  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.arc(295, 46, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1e3a8a'
  ctx.beginPath()
  ctx.arc(295, 46, 3, 0, Math.PI * 2)
  ctx.fill()

  // Clock
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 92px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('09:41', 256, 230)

  // Date
  ctx.font = '500 24px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fillText('Thứ Hai, 16 Tháng 11', 256, 280)

  // Lieng Mobile Brand Badge on Lockscreen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.beginPath()
  ctx.roundRect(96, 760, 320, 72, 36)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText('LIÊNG MOBILE • 3D SHOWCASE', 256, 804)

  // Swipe Bar
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(176, 990, 160, 6, 3)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function initThree() {
  if (!canvasContainer.value) return

  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || 560

  // 1. Scene
  scene = new THREE.Scene()

  // 2. Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
  camera.position.set(0, -0.25, 7.5)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  canvasContainer.value.appendChild(renderer.domElement)

  // 4. Lighting - Cinematic Studio Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
  keyLight.position.set(4, 5, 5)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.4)
  fillLight.position.set(-5, 2, 3)
  scene.add(fillLight)

  rimLight = new THREE.DirectionalLight(0xf43f5e, 3.2)
  rimLight.position.set(0, -4, -4)
  scene.add(rimLight)

  // Point light for shiny specular highlight
  const specularPoint = new THREE.PointLight(0xffffff, 2.0, 12)
  specularPoint.position.set(2, 2, 4)
  scene.add(specularPoint)

  // 5.5 Cyber Pedestal & Glowing Contact Light Ring (ThreeUI Studio Base)
  const pedestalGeo = new THREE.CylinderGeometry(1.8, 2.1, 0.1, 64)
  const pedestalMat = new THREE.MeshPhysicalMaterial({
    color: 0x1f0408,
    metalness: 0.92,
    roughness: 0.15,
    clearcoat: 0.7,
  })
  const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat)
  pedestalMesh.position.set(0, -2.7, 0)
  scene.add(pedestalMesh)

  const glowRingGeo = new THREE.RingGeometry(1.95, 2.15, 64)
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0xe11d48,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  })
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat)
  glowRing.rotation.x = Math.PI / 2
  glowRing.position.set(0, -2.64, 0)
  scene.add(glowRing)

  // 5. Construct 3D Smartphone Model
  phoneGroup = new THREE.Group()

  const phoneW = 2.2
  const phoneH = 4.5
  const phoneD = 0.22
  const radius = 0.28

  // Rounded Box Chassis using ExtrudeGeometry
  const shape = new THREE.Shape()
  const x = -phoneW / 2
  const y = -phoneH / 2
  shape.moveTo(x + radius, y)
  shape.lineTo(x + phoneW - radius, y)
  shape.quadraticCurveTo(x + phoneW, y, x + phoneW, y + radius)
  shape.lineTo(x + phoneW, y + phoneH - radius)
  shape.quadraticCurveTo(x + phoneW, y + phoneH, x + phoneW - radius, y + phoneH)
  shape.lineTo(x + radius, y + phoneH)
  shape.quadraticCurveTo(x, y + phoneH, x, y + phoneH - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)

  const extrudeSettings = {
    steps: 1,
    depth: phoneD,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 6,
  }

  const bodyGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  bodyGeometry.center()

  metalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9e978e,
    metalness: 0.88,
    roughness: 0.18,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
  })

  phoneBodyMesh = new THREE.Mesh(bodyGeometry, metalMaterial)
  phoneGroup.add(phoneBodyMesh)

  // Front Screen Bezel & OLED Glass
  const screenTexture = createScreenTexture()
  const screenMaterial = new THREE.MeshPhysicalMaterial({
    map: screenTexture,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transmission: 0.0,
  })

  const screenGeo = new THREE.PlaneGeometry(phoneW * 0.93, phoneH * 0.93)
  phoneScreenMesh = new THREE.Mesh(screenGeo, screenMaterial)
  phoneScreenMesh.position.z = phoneD / 2 + 0.042
  phoneGroup.add(phoneScreenMesh)

  // Back Camera Bump (Flagship 3-lens system)
  cameraBumpGroup = new THREE.Group()
  const bumpW = 0.95
  const bumpH = 0.95
  const bumpRadius = 0.18
  const bumpShape = new THREE.Shape()
  const bx = -bumpW / 2
  const by = -bumpH / 2
  bumpShape.moveTo(bx + bumpRadius, by)
  bumpShape.lineTo(bx + bumpW - bumpRadius, by)
  bumpShape.quadraticCurveTo(bx + bumpW, by, bx + bumpW, by + bumpRadius)
  bumpShape.lineTo(bx + bumpW, by + bumpH - bumpRadius)
  bumpShape.quadraticCurveTo(bx + bumpW, by + bumpH, bx + bumpW - bumpRadius, by + bumpH)
  bumpShape.lineTo(bx + bumpRadius, by + bumpH)
  bumpShape.quadraticCurveTo(bx, by + bumpH, bx, by + bumpH - bumpRadius)
  bumpShape.lineTo(bx, by + bumpRadius)
  bumpShape.quadraticCurveTo(bx, by, bx + bumpRadius, by)

  const bumpGeo = new THREE.ExtrudeGeometry(bumpShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
  })
  bumpGeo.center()

  const bumpMesh = new THREE.Mesh(bumpGeo, metalMaterial)
  cameraBumpGroup.add(bumpMesh)

  // 3 Lenses
  const lensPositions = [
    [-0.22, 0.22],
    [-0.22, -0.22],
    [0.22, 0.0],
  ]
  const lensRingMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.1,
  })
  const lensGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x051329,
    roughness: 0.0,
    metalness: 0.2,
    clearcoat: 1.0,
  })

  lensPositions.forEach(([lx, ly]) => {
    const lensRingGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.07, 32)
    lensRingGeo.rotateX(Math.PI / 2)
    const ringMesh = new THREE.Mesh(lensRingGeo, lensRingMat)
    ringMesh.position.set(lx, ly, 0.04)

    const lensInnerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.075, 32)
    lensInnerGeo.rotateX(Math.PI / 2)
    const innerMesh = new THREE.Mesh(lensInnerGeo, lensGlassMat)
    innerMesh.position.set(lx, ly, 0.042)

    cameraBumpGroup.add(ringMesh)
    cameraBumpGroup.add(innerMesh)
  })

  cameraBumpGroup.position.set(-phoneW / 2 + bumpW / 2 + 0.12, phoneH / 2 - bumpH / 2 - 0.12, -phoneD / 2 - 0.04)
  cameraBumpGroup.rotation.y = Math.PI
  phoneGroup.add(cameraBumpGroup)

  // 6. AI AutoGrade Hologram Laser Scanner
  laserScanGroup = new THREE.Group()
  const ringPoints = []
  const ringSegments = 64
  const rw = (phoneW + 0.15) / 2
  const rh = (phoneH + 0.15) / 2
  for (let i = 0; i <= ringSegments; i++) {
    const theta = (i / ringSegments) * Math.PI * 2
    ringPoints.push(new THREE.Vector3(Math.cos(theta) * rw, 0, Math.sin(theta) * 0.35))
  }
  const laserRingGeo = new THREE.BufferGeometry().setFromPoints(ringPoints)
  const laserRingMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 2,
    transparent: true,
    opacity: 0.9,
  })
  const laserRing = new THREE.Line(laserRingGeo, laserRingMat)
  laserScanGroup.add(laserRing)

  // Glowing laser sheet plane
  const laserPlaneGeo = new THREE.PlaneGeometry(phoneW + 0.25, 0.08)
  const laserPlaneMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  })
  laserMesh = new THREE.Mesh(laserPlaneGeo, laserPlaneMat)
  laserMesh.rotation.x = Math.PI / 2
  laserScanGroup.add(laserMesh)

  phoneGroup.add(laserScanGroup)

  // Add Complete Phone to Scene
  phoneGroup.position.set(0, 0, 0)
  phoneGroup.rotation.x = currentRotationX
  phoneGroup.rotation.y = currentRotationY
  scene.add(phoneGroup)

  // 7. Ambient Particle Field (ThreeUI style floating dust lights)
  const particleCount = 120
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const scales = new Float32Array(particleCount)

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 12
    positions[i + 1] = (Math.random() - 0.5) * 10
    positions[i + 2] = (Math.random() - 0.5) * 8
    scales[i / 3] = Math.random() * 0.04 + 0.015
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xf43f5e,
    size: 0.06,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  })
  particleSystem = new THREE.Points(particleGeo, particleMat)
  scene.add(particleSystem)

  // 8. Event Listeners for Interaction
  window.addEventListener('resize', onWindowResize)
  setupInteractionEvents()

  // 9. Intersection Observer to preserve GPU/Battery
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting
    })
  })
  observer.observe(canvasContainer.value)

  // 10. Start Animation Loop
  animate()
}

let scanTime = 0

function animate(time = 0) {
  animationFrameId = requestAnimationFrame(animate)

  if (!isVisible) return

  const sec = time * 0.001

  // Smooth rotation interpolation (Lerp damping)
  if (!isPointerDown) {
    // Gentle floating breathing animation
    const breathY = Math.sin(sec * 1.5) * 0.08
    phoneGroup.position.y = breathY
    targetRotationY += (mouseX * 0.45 - targetRotationY) * 0.04
    targetRotationX += (-mouseY * 0.35 + 0.15 - targetRotationX) * 0.04
  }

  currentRotationX += (targetRotationX - currentRotationX) * 0.08
  currentRotationY += (targetRotationY - currentRotationY) * 0.08

  phoneGroup.rotation.x = currentRotationX
  phoneGroup.rotation.y = currentRotationY

  // AutoGrade Laser Scan animation (Up and Down movement)
  if (isAutoGradeScanning.value && laserScanGroup) {
    scanTime += 0.028
    const scanY = Math.sin(scanTime) * 2.1
    laserScanGroup.position.y = scanY
    laserMesh.scale.x = 1.0 + Math.sin(scanTime * 3) * 0.06
  }

  // Floating particles gentle drift
  if (particleSystem) {
    particleSystem.rotation.y = sec * 0.04
    particleSystem.rotation.x = sec * 0.02
  }

  renderer.render(scene, camera)
}

function onWindowResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || 560
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function setupInteractionEvents() {
  const container = canvasContainer.value
  if (!container) return

  // Mouse Move Parallax
  const handleMouseMove = (e) => {
    const rect = container.getBoundingClientRect()
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1

    if (isPointerDown) {
      const deltaX = e.clientX - previousPointerX
      const deltaY = e.clientY - previousPointerY
      targetRotationY += deltaX * 0.012
      targetRotationX += deltaY * 0.012
      previousPointerX = e.clientX
      previousPointerY = e.clientY
    }
  }

  const handleMouseDown = (e) => {
    isPointerDown = true
    isDragging.value = true
    previousPointerX = e.clientX
    previousPointerY = e.clientY
  }

  const handleMouseUp = () => {
    isPointerDown = false
    isDragging.value = false
  }

  // Touch Support for Mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isPointerDown = true
      isDragging.value = true
      previousPointerX = e.touches[0].clientX
      previousPointerY = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e) => {
    if (isPointerDown && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - previousPointerX
      const deltaY = e.touches[0].clientY - previousPointerY
      targetRotationY += deltaX * 0.015
      targetRotationX += deltaY * 0.015
      previousPointerX = e.touches[0].clientX
      previousPointerY = e.touches[0].clientY
    }
  }

  const handleTouchEnd = () => {
    isPointerDown = false
    isDragging.value = false
  }

  container.addEventListener('mousemove', handleMouseMove)
  container.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)

  container.addEventListener('touchstart', handleTouchStart, { passive: true })
  container.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('touchend', handleTouchEnd)
}

function changeColor(option) {
  selectedColorId.value = option.id
  if (metalMaterial) {
    metalMaterial.color.setHex(option.metalHex)
  }
  if (rimLight) {
    if (option.id === 'titan-ruby') {
      rimLight.color.setHex(0xf43f5e)
    } else if (option.id === 'titan-gold') {
      rimLight.color.setHex(0xf59e0b)
    } else if (option.id === 'titan-black') {
      rimLight.color.setHex(0x60a5fa)
    } else {
      rimLight.color.setHex(0x38bdf8)
    }
  }
}

function resetAngle() {
  targetRotationX = 0.05
  targetRotationY = -0.35
  mouseX = 0
  mouseY = 0
}

function toggleAutoGradeScan() {
  isAutoGradeScanning.value = !isAutoGradeScanning.value
  if (laserScanGroup) {
    laserScanGroup.visible = isAutoGradeScanning.value
  }
}

onMounted(() => {
  initThree()
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (observer) observer.disconnect()
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
})
</script>

<template>
  <div class="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] flex items-center justify-center select-none overflow-hidden">
    <!-- WebGL Canvas Container -->
    <div
      ref="canvasContainer"
      class="w-full h-full cursor-grab active:cursor-grabbing relative z-10 transition-opacity duration-500"
      :class="{ 'opacity-95': isDragging }"
      title="Giữ và kéo chuột để xoay 360 độ"
    />

    <!-- Holographic 3D Floating Badges (ThreeUI Style) -->
    <div class="absolute top-4 right-4 sm:top-8 sm:right-8 z-20 pointer-events-auto">
      <div class="backdrop-blur-xl bg-black/40 border border-white/15 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 transition-transform hover:scale-105">
        <div class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">AutoGrade™ 3D Vision</p>
          <p class="text-xs text-white/90 font-medium">YOLOv8 Thẩm định 4 góc cạnh</p>
        </div>
      </div>
    </div>

    <div class="absolute bottom-16 left-4 sm:bottom-20 sm:left-8 z-20 pointer-events-auto hidden sm:block">
      <div class="backdrop-blur-xl bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span class="text-xs text-white/90 font-medium">Khung vỏ Titan Chuẩn Hàng • 100% Nguyên Bản</span>
      </div>
    </div>

    <!-- Interactive 3D Control Bar (Bottom Floating HUD) -->
    <div class="absolute bottom-3 inset-x-0 z-20 flex flex-wrap items-center justify-center gap-3 px-4 pointer-events-auto">
      <!-- Color Switcher -->
      <div class="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 shadow-lg">
        <button
          v-for="color in colorOptions"
          :key="color.id"
          type="button"
          class="relative w-6 h-6 rounded-full transition-transform cursor-pointer"
          :style="{ backgroundColor: color.hex }"
          :class="selectedColorId === color.id ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-80 hover:scale-110'"
          :title="color.name"
          @click="changeColor(color)"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 text-xs text-white shadow-lg">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 hover:text-cyan-300 transition cursor-pointer"
          @click="toggleAutoGradeScan"
        >
          <span class="h-2 w-2 rounded-full" :class="isAutoGradeScanning ? 'bg-cyan-400 animate-pulse' : 'bg-gray-400'" />
          <span>{{ isAutoGradeScanning ? 'Tắt Laser AI' : 'Bật Laser AI' }}</span>
        </button>
        <span class="text-white/30">|</span>
        <button
          type="button"
          class="hover:text-amber-300 transition cursor-pointer"
          title="Đưa thiết bị về góc nghiêng tiêu chuẩn"
          @click="resetAngle"
        >
          Góc mặc định
        </button>
      </div>
    </div>

    <!-- Interaction Hint on first load -->
    <div class="absolute top-4 left-4 z-20 text-[11px] text-white/60 pointer-events-none flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
      <svg class="w-3.5 h-3.5 text-cyan-400 animate-spin" style="animation-duration: 4s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>Kéo để xoay 360° • Rê chuột để nghiêng 3D</span>
    </div>
  </div>
</template>

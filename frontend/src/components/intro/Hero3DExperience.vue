<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref(null)
const isDragging = ref(false)
const selectedColorId = ref('titan-natural')
const activeViewMode = ref('overview') // 'overview' | 'camera' | 'frame' | 'exploded'
const explodePercent = ref(0) // 0 to 100
const isAutoGradeScanning = ref(true)

const colorOptions = [
  { id: 'titan-natural', name: 'Titan Tự Nhiên', hex: '#8c8782', metalHex: 0x9e978e },
  { id: 'titan-black', name: 'Titan Đen', hex: '#222326', metalHex: 0x242629 },
  { id: 'titan-gold', name: 'Titan Sa Mạc', hex: '#bba282', metalHex: 0xc4b195 },
  { id: 'titan-ruby', name: 'Đỏ Ruby Liêng', hex: '#8b1524', metalHex: 0x8b1524 },
]

// Three.js Core
let scene, camera, renderer, animationFrameId
let phoneGroup
let chassisMesh, screenGroup, cameraBumpGroup, motherboardGroup, batteryGroup
let explodedGuidesGroup
let laserScanGroup, laserMesh
let particleSystem
let pedestalGroup
let width = 0
let height = 0

// Materials
let metalMaterial = null
let rimLight = null
let chipGlowLight = null

// Camera & Rotation Animation State
let mouseX = 0
let mouseY = 0
let currentRotationX = 0.05
let currentRotationY = -0.35
let targetRotationX = 0.05
let targetRotationY = -0.35

let cameraPos = new THREE.Vector3(0, -0.2, 7.4)
let targetCameraPos = new THREE.Vector3(0, -0.2, 7.4)
let cameraLookAt = new THREE.Vector3(0, 0, 0)
let targetCameraLookAt = new THREE.Vector3(0, 0, 0)

let currentExplodeFactor = 0 // 0 to 1 smooth lerp
let targetExplodeFactor = 0

let isPointerDown = false
let previousPointerX = 0
let previousPointerY = 0
let isVisible = true
let observer = null

// Texture generators
function createScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Cyber Dark Luxury Background
  const grad = ctx.createLinearGradient(0, 0, 512, 1024)
  grad.addColorStop(0, '#0a0a14')
  grad.addColorStop(0.35, '#250810')
  grad.addColorStop(0.7, '#5e0d1f')
  grad.addColorStop(1, '#06060c')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 1024)

  // Fluid glowing circular waves
  const radGrad1 = ctx.createRadialGradient(256, 430, 20, 256, 430, 260)
  radGrad1.addColorStop(0, 'rgba(244, 63, 94, 0.9)')
  radGrad1.addColorStop(0.5, 'rgba(190, 18, 60, 0.4)')
  radGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad1
  ctx.beginPath()
  ctx.arc(256, 430, 260, 0, Math.PI * 2)
  ctx.fill()

  const radGrad2 = ctx.createRadialGradient(200, 680, 10, 200, 680, 220)
  radGrad2.addColorStop(0, 'rgba(56, 189, 248, 0.75)')
  radGrad2.addColorStop(0.6, 'rgba(14, 165, 233, 0.25)')
  radGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad2
  ctx.beginPath()
  ctx.arc(200, 680, 220, 0, Math.PI * 2)
  ctx.fill()

  // Dynamic Island
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.roundRect(196, 26, 120, 36, 18)
  ctx.fill()
  ctx.fillStyle = '#1e3a8a'
  ctx.beginPath()
  ctx.arc(295, 44, 4, 0, Math.PI * 2)
  ctx.fill()

  // Clock
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 94px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('09:41', 256, 225)

  // Date
  ctx.font = '500 24px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fillText('Thứ Ba, 17 Tháng 11', 256, 275)

  // Lieng Mobile Brand Badge on Lockscreen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
  ctx.beginPath()
  ctx.roundRect(86, 750, 340, 76, 38)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText('LIÊNG MOBILE • 3D SHOWCASE', 256, 796)

  // Status Bar / Home Indicator
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(176, 990, 160, 6, 3)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createMotherboardTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Dark PCB Circuit Board
  ctx.fillStyle = '#0d131a'
  ctx.fillRect(0, 0, 512, 512)

  // Golden / Cyan Circuit Tracks
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)'
  ctx.lineWidth = 2
  for (let i = 0; i < 40; i++) {
    const startX = (i * 27) % 512
    const startY = (i * 43) % 512
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(startX + 60, startY + 60)
    ctx.lineTo(startX + 140, startY + 60)
    ctx.stroke()
  }

  // AutoGrade AI Chip in Center
  ctx.fillStyle = '#111827'
  ctx.fillRect(176, 176, 160, 160)
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 3
  ctx.strokeRect(176, 176, 160, 160)

  // Chip Pins
  ctx.fillStyle = '#e2e8f0'
  for (let p = 186; p <= 326; p += 14) {
    ctx.fillRect(p, 166, 6, 10)
    ctx.fillRect(p, 336, 6, 10)
    ctx.fillRect(166, p, 10, 6)
    ctx.fillRect(336, p, 10, 6)
  }

  // Chip Engraving
  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('AUTOGRADE', 256, 245)
  ctx.fillStyle = '#f43f5e'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('AI NEURAL', 256, 275)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function initThree() {
  if (!canvasContainer.value) return

  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || 580

  // 1. Scene
  scene = new THREE.Scene()

  // 2. Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
  camera.position.copy(cameraPos)
  camera.lookAt(cameraLookAt)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  canvasContainer.value.appendChild(renderer.domElement)

  // 4. Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
  keyLight.position.set(4, 5, 5)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.5)
  fillLight.position.set(-5, 2, 3)
  scene.add(fillLight)

  rimLight = new THREE.DirectionalLight(0xf43f5e, 3.5)
  rimLight.position.set(0, -4, -4)
  scene.add(rimLight)

  chipGlowLight = new THREE.PointLight(0x06b6d4, 0, 8)
  chipGlowLight.position.set(0, 0, 0)
  scene.add(chipGlowLight)

  // 5. Studio Cyber Pedestal Base
  pedestalGroup = new THREE.Group()
  const pedestalGeo = new THREE.CylinderGeometry(1.9, 2.3, 0.12, 64)
  const pedestalMat = new THREE.MeshPhysicalMaterial({
    color: 0x140306,
    metalness: 0.94,
    roughness: 0.12,
    clearcoat: 0.8,
  })
  const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat)
  pedestalMesh.position.set(0, -2.75, 0)
  pedestalGroup.add(pedestalMesh)

  const glowRingGeo = new THREE.RingGeometry(2.05, 2.25, 64)
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0xe11d48,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  })
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat)
  glowRing.rotation.x = Math.PI / 2
  glowRing.position.set(0, -2.68, 0)
  pedestalGroup.add(glowRing)
  scene.add(pedestalGroup)

  // 6. Construct 3D Smartphone Hierarchy for Exploded View
  phoneGroup = new THREE.Group()

  const phoneW = 2.2
  const phoneH = 4.5
  const phoneD = 0.22
  const radius = 0.28

  // 6.1 Backplate Chassis (Aerospace-grade Titanium)
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
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
  })

  chassisMesh = new THREE.Mesh(bodyGeometry, metalMaterial)
  phoneGroup.add(chassisMesh)

  // 6.2 Front Screen Glass Layer (Separates forward in exploded mode)
  screenGroup = new THREE.Group()
  const screenTexture = createScreenTexture()
  const screenMat = new THREE.MeshPhysicalMaterial({
    map: screenTexture,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  })
  const screenGeo = new THREE.PlaneGeometry(phoneW * 0.93, phoneH * 0.93)
  const screenPlane = new THREE.Mesh(screenGeo, screenMat)
  screenGroup.add(screenPlane)

  // Screen Ceramic Shield Frame Border
  const frameBorderGeo = new THREE.BoxGeometry(phoneW * 0.96, phoneH * 0.96, 0.02)
  const frameBorderMat = new THREE.MeshPhysicalMaterial({
    color: 0x09090b,
    metalness: 0.8,
    roughness: 0.2,
  })
  const frameBorder = new THREE.Mesh(frameBorderGeo, frameBorderMat)
  frameBorder.position.z = -0.012
  screenGroup.add(frameBorder)

  screenGroup.position.z = phoneD / 2 + 0.042
  phoneGroup.add(screenGroup)

  // 6.3 Camera Bump Array (Separates backwards in exploded mode)
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

  // 3 Optical Lenses with metallic bevels
  const lensPositions = [
    [-0.22, 0.22],
    [-0.22, -0.22],
    [0.22, 0.0],
  ]
  const lensRingMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
  const lensGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x051329, roughness: 0.0, metalness: 0.2, clearcoat: 1.0 })

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

  // 6.4 Motherboard & AI Neural Core (Hidden inside, reveals during Exploded View)
  motherboardGroup = new THREE.Group()
  const pcbGeo = new THREE.PlaneGeometry(phoneW * 0.82, phoneH * 0.44)
  const pcbMat = new THREE.MeshPhysicalMaterial({
    map: createMotherboardTexture(),
    metalness: 0.5,
    roughness: 0.3,
    side: THREE.DoubleSide,
  })
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat)
  pcbMesh.position.y = 0.8
  motherboardGroup.add(pcbMesh)

  // 6.5 High-Capacity Battery Pack (Reveals in Exploded View)
  batteryGroup = new THREE.Group()
  const batteryGeo = new THREE.BoxGeometry(phoneW * 0.8, phoneH * 0.42, 0.06)
  const batteryMat = new THREE.MeshPhysicalMaterial({
    color: 0x18181b,
    metalness: 0.2,
    roughness: 0.6,
  })
  const batteryMesh = new THREE.Mesh(batteryGeo, batteryMat)
  batteryMesh.position.y = -1.1
  batteryGroup.add(batteryMesh)

  motherboardGroup.visible = false
  batteryGroup.visible = false
  phoneGroup.add(motherboardGroup)
  phoneGroup.add(batteryGroup)

  // 6.6 AutoGrade Hologram Laser Scanner
  laserScanGroup = new THREE.Group()
  const ringPoints = []
  const ringSegments = 64
  const rw = (phoneW + 0.15) / 2
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

  // 6.7 Exploded View Alignment Laser Guidelines (Marvel/Apple CAD Style)
  explodedGuidesGroup = new THREE.Group()
  const cornerOffsets = [
    [-phoneW / 2 + 0.1, phoneH / 2 - 0.1],
    [phoneW / 2 - 0.1, phoneH / 2 - 0.1],
    [-phoneW / 2 + 0.1, -phoneH / 2 + 0.1],
    [phoneW / 2 - 0.1, -phoneH / 2 + 0.1],
  ]

  cornerOffsets.forEach(([cx, cy]) => {
    const linePoints = [
      new THREE.Vector3(cx, cy, 2.4),
      new THREE.Vector3(cx, cy, -1.8),
    ]
    const guideGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
    const guideMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.15,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.5,
    })
    const guideLine = new THREE.Line(guideGeo, guideMat)
    guideLine.computeLineDistances()
    explodedGuidesGroup.add(guideLine)
  })
  explodedGuidesGroup.visible = false
  phoneGroup.add(explodedGuidesGroup)

  // Add phoneGroup to Scene
  phoneGroup.position.set(0, 0, 0)
  phoneGroup.rotation.x = currentRotationX
  phoneGroup.rotation.y = currentRotationY
  scene.add(phoneGroup)

  // 7. Ambient Particle Field (Depth of Field light specks)
  const particleCount = 140
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 14
    positions[i + 1] = (Math.random() - 0.5) * 11
    positions[i + 2] = (Math.random() - 0.5) * 9
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xf43f5e,
    size: 0.065,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  })
  particleSystem = new THREE.Points(particleGeo, particleMat)
  scene.add(particleSystem)

  // 8. Event Listeners & Intersection Observer
  window.addEventListener('resize', onWindowResize)
  setupInteractionEvents()

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting
    })
  })
  observer.observe(canvasContainer.value)

  animate()
}

let scanTime = 0

function animate(time = 0) {
  animationFrameId = requestAnimationFrame(animate)
  if (!isVisible) return

  const sec = time * 0.001

  // 1. Exploded Factor Smooth Lerp
  currentExplodeFactor += (targetExplodeFactor - currentExplodeFactor) * 0.08
  explodePercent.value = Math.round(currentExplodeFactor * 100)

  const isExploded = currentExplodeFactor > 0.03
  motherboardGroup.visible = isExploded
  batteryGroup.visible = isExploded
  explodedGuidesGroup.visible = currentExplodeFactor > 0.15

  // Animate exploded positions with balanced separation
  screenGroup.position.z = 0.15 + currentExplodeFactor * 1.35
  screenGroup.rotation.y = currentExplodeFactor * 0.05

  motherboardGroup.position.z = currentExplodeFactor * 0.5
  batteryGroup.position.z = -currentExplodeFactor * 0.35

  cameraBumpGroup.position.z = -0.15 - currentExplodeFactor * 1.15
  chassisMesh.position.z = -currentExplodeFactor * 0.75

  if (chipGlowLight) {
    chipGlowLight.intensity = currentExplodeFactor * 3.5
  }

  // 2. Camera glide interpolation (Smooth Cinematic Transition)
  cameraPos.lerp(targetCameraPos, 0.06)
  cameraLookAt.lerp(targetCameraLookAt, 0.06)
  camera.position.copy(cameraPos)
  camera.lookAt(cameraLookAt)

  // 3. Phone Rotation Interpolation
  if (!isPointerDown && activeViewMode.value === 'overview') {
    const breathY = Math.sin(sec * 1.4) * 0.08
    phoneGroup.position.y = breathY
    targetRotationY += (mouseX * 0.4 - targetRotationY) * 0.04
    targetRotationX += (-mouseY * 0.3 + 0.05 - targetRotationX) * 0.04
  }

  currentRotationX += (targetRotationX - currentRotationX) * 0.08
  currentRotationY += (targetRotationY - currentRotationY) * 0.08

  phoneGroup.rotation.x = currentRotationX
  phoneGroup.rotation.y = currentRotationY

  // 4. Laser Scan Animation
  if (isAutoGradeScanning.value && laserScanGroup) {
    scanTime += 0.03
    const scanY = Math.sin(scanTime) * 2.1
    laserScanGroup.position.y = scanY
    laserMesh.scale.x = 1.0 + Math.sin(scanTime * 3) * 0.06
  }

  // 5. Floating dust particles
  if (particleSystem) {
    particleSystem.rotation.y = sec * 0.035
    particleSystem.rotation.x = sec * 0.015
  }

  renderer.render(scene, camera)
}

function onWindowResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || 580
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function setupInteractionEvents() {
  const container = canvasContainer.value
  if (!container) return

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

// Mode Selection Controller
function setViewMode(mode) {
  activeViewMode.value = mode

  if (mode === 'overview') {
    targetExplodeFactor = 0
    targetCameraPos.set(0, -0.2, 7.5)
    targetCameraLookAt.set(0, 0, 0)
    targetRotationX = 0.05
    targetRotationY = -0.35
  } else if (mode === 'camera') {
    targetExplodeFactor = 0
    targetCameraPos.set(-0.8, 1.3, 4.2)
    targetCameraLookAt.set(-0.6, 1.2, 0)
    targetRotationX = 0.12
    targetRotationY = Math.PI * 0.88 // Show back camera bump
  } else if (mode === 'frame') {
    targetExplodeFactor = 0
    targetCameraPos.set(2.4, 0.1, 4.4)
    targetCameraLookAt.set(0, 0, 0)
    targetRotationX = 0.02
    targetRotationY = -Math.PI * 0.45 // Show side titanium chamfer
  } else if (mode === 'exploded') {
    targetExplodeFactor = 1.0
    targetCameraPos.set(0.8, 0.3, 8.4)
    targetCameraLookAt.set(0, 0, 0)
    targetRotationX = 0.16
    targetRotationY = -0.52 // Isometric perspective keeping all layers inside viewport
  }
}

function handleExplodeSlider(e) {
  const val = Number(e.target.value) / 100
  targetExplodeFactor = val
  if (val > 0.1) {
    activeViewMode.value = 'exploded'
    targetCameraPos.set(0.8, 0.3, 8.4)
    targetRotationX = 0.16
    targetRotationY = -0.52
  } else {
    activeViewMode.value = 'overview'
    targetCameraPos.set(0, -0.2, 7.5)
    targetRotationX = 0.05
    targetRotationY = -0.35
  }
}

function changeColor(option) {
  selectedColorId.value = option.id
  if (metalMaterial) metalMaterial.color.setHex(option.metalHex)
  if (rimLight) {
    if (option.id === 'titan-ruby') rimLight.color.setHex(0xf43f5e)
    else if (option.id === 'titan-gold') rimLight.color.setHex(0xf59e0b)
    else if (option.id === 'titan-black') rimLight.color.setHex(0x60a5fa)
    else rimLight.color.setHex(0x38bdf8)
  }
}

function toggleAutoGradeScan() {
  isAutoGradeScanning.value = !isAutoGradeScanning.value
  if (laserScanGroup) laserScanGroup.visible = isAutoGradeScanning.value
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
  <div class="relative w-full h-[520px] sm:h-[580px] lg:h-[660px] flex items-center justify-center select-none overflow-hidden">
    <!-- WebGL Canvas Container -->
    <div
      ref="canvasContainer"
      class="w-full h-full cursor-grab active:cursor-grabbing relative z-10 transition-opacity duration-500"
      :class="{ 'opacity-95': isDragging }"
      title="Giữ và kéo chuột để xoay 360 độ"
    />

    <!-- Holographic Floating Badges (Dynamic in Exploded Mode) -->
    <div class="absolute top-4 right-4 sm:top-8 sm:right-8 z-20 pointer-events-auto">
      <div class="backdrop-blur-xl bg-black/60 border border-white/20 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 transition-transform hover:scale-105">
        <div class="relative flex h-3.5 w-3.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-bold uppercase tracking-wider text-cyan-300">AutoGrade™ AI Vision</span>
            <span v-if="targetExplodeFactor > 0.2" class="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">EXPLODED</span>
          </div>
          <p class="text-xs text-white/95 font-medium">
            {{ targetExplodeFactor > 0.2 ? 'Bóc tách 5 tầng linh kiện thời gian thực' : 'YOLOv8 Thẩm định 4 góc cạnh' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Exploded Layer Labels (Appears dynamically in 3D Exploded Mode) -->
    <transition name="fade">
      <div v-if="targetExplodeFactor > 0.3" class="absolute left-4 top-20 sm:left-8 z-20 space-y-2 pointer-events-none">
        <div class="backdrop-blur-md bg-black/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span class="text-[11px] font-medium text-cyan-200">Tầng 1: Màn hình Super Retina XDR 120Hz</span>
        </div>
        <div class="backdrop-blur-md bg-black/60 border border-rose-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-rose-400"></span>
          <span class="text-[11px] font-medium text-rose-200">Tầng 2: Chip AI AutoGrade™ Neural Core</span>
        </div>
        <div class="backdrop-blur-md bg-black/60 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span class="text-[11px] font-medium text-amber-200">Tầng 3: Pin 4500mAh Chuẩn Dung Lượng</span>
        </div>
        <div class="backdrop-blur-md bg-black/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="text-[11px] font-medium text-emerald-200">Tầng 4: Cụm 3 Thấu Kính Sapphire 48MP</span>
        </div>
        <div class="backdrop-blur-md bg-black/60 border border-purple-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-purple-400"></span>
          <span class="text-[11px] font-medium text-purple-200">Tầng 5: Khung Hợp Kim Titan Hàng Không</span>
        </div>
      </div>
    </transition>

    <!-- Top Left Interaction Hint -->
    <div class="absolute top-4 left-4 z-20 text-[11px] text-white/70 pointer-events-none flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
      <svg class="w-3.5 h-3.5 text-cyan-400 animate-spin" style="animation-duration: 4s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>Kéo 360° • Chọn góc quay điện ảnh bên dưới</span>
    </div>

    <!-- Cinematic View Mode Selector (Apple / ThreeUI Style) -->
    <div class="absolute bottom-16 inset-x-0 z-20 flex justify-center px-2 pointer-events-auto">
      <div class="flex items-center gap-1 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-1 shadow-2xl">
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          :class="activeViewMode === 'overview' ? 'bg-white text-gray-950 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'"
          @click="setViewMode('overview')"
        >
          Toàn cảnh
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
          :class="activeViewMode === 'exploded' ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-lg scale-105' : 'text-white/80 hover:text-white hover:bg-white/10'"
          @click="setViewMode('exploded')"
        >
          <span>⚡ Bóc Tách 3D</span>
          <span class="text-[9px] px-1 bg-white/20 rounded">WOW</span>
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          :class="activeViewMode === 'camera' ? 'bg-white text-gray-950 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'"
          @click="setViewMode('camera')"
        >
          Soi Camera
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          :class="activeViewMode === 'frame' ? 'bg-white text-gray-950 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'"
          @click="setViewMode('frame')"
        >
          Viền Titan
        </button>
      </div>
    </div>

    <!-- Bottom Controls: Color Swatches & Realtime Explode Range Slider -->
    <div class="absolute bottom-2.5 inset-x-0 z-20 flex flex-wrap items-center justify-center gap-2.5 px-3 pointer-events-auto">
      <!-- 4 Titanium Colors -->
      <div class="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/15 rounded-full px-2.5 py-1 shadow-xl">
        <span class="text-[10px] text-white/60 font-medium hidden sm:inline">Màu:</span>
        <div class="flex items-center gap-1.5">
          <button
            v-for="color in colorOptions"
            :key="color.id"
            type="button"
            class="relative w-4 h-4 rounded-full transition-transform cursor-pointer"
            :style="{ backgroundColor: color.hex }"
            :class="selectedColorId === color.id ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-80 hover:scale-110'"
            :title="color.name"
            @click="changeColor(color)"
          />
        </div>
      </div>

      <!-- Exploded Slider (Real-time Disassembly Level) -->
      <div class="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 shadow-xl">
        <span class="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider hidden sm:inline">Tách:</span>
        <input
          type="range"
          min="0"
          max="100"
          :value="explodePercent"
          class="w-20 sm:w-28 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          @input="handleExplodeSlider"
        />
        <span class="text-[11px] font-mono text-cyan-200">{{ explodePercent }}%</span>
      </div>

      <!-- Laser Scanner Toggle -->
      <div class="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/15 rounded-full px-2.5 py-1 shadow-xl text-xs text-white">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 hover:text-cyan-300 transition cursor-pointer"
          @click="toggleAutoGradeScan"
        >
          <span class="h-2 w-2 rounded-full" :class="isAutoGradeScanning ? 'bg-cyan-400 animate-pulse' : 'bg-gray-400'" />
          <span class="text-[11px]">{{ isAutoGradeScanning ? 'Laser: Bật' : 'Laser: Tắt' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

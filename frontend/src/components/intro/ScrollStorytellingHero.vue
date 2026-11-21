<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const props = defineProps({
  storeInfo: {
    type: Object,
    default: () => ({ hotlineDisplay: '0383 435 600', hotline: '0383435600' }),
  },
})

const sectionRef = ref(null)
const canvasContainer = ref(null)
const scrollProgress = ref(0)
const currentChapter = ref(0) // 0, 1, 2, 3
const isTextVisible = ref(true)
const activeTextChapter = ref(0)
const headerOffset = ref(112)

function updateHeaderOffset() {
  const headerEl = document.getElementById('top') || document.querySelector('header')
  if (headerEl) {
    const h = Math.round(headerEl.getBoundingClientRect().height)
    if (h > 0) {
      headerOffset.value = h
    }
  }
}

const chapters = [
  {
    index: 0,
    number: '01',
    badge: 'THIẾT KẾ ĐỘT PHÁ • BẢN LĨNH FLAGSHIP',
    accentBadge: 'from-rose-600 to-orange-500',
    title: 'iPhone 18 Pro Max',
    subtitle:
      'Kiệt tác công nghệ nguyên khối với màn hình Super Retina XDR tràn viền không khiếm khuyết. Thiết kế đối xứng hoàn hảo định hình kỷ nguyên smartphone tương lai.',
    specs: ['Màn hình 6.9" 120Hz ProMotion', 'Độ sáng cực đại 3000 nits', 'Kính Ceramic Shield thế hệ mới'],
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(225, 29, 72, 0.28) 0%, rgba(9, 9, 11, 0) 70%)',
    themeColor: '#e11d48',
  },
  {
    index: 1,
    number: '02',
    badge: 'KHUNG TITAN HÀNG KHÔNG • SIÊU NHẸ SIÊU BỀN',
    accentBadge: 'from-amber-500 to-yellow-600',
    title: 'Mỏng hơn. Nhẹ hơn. Cứng cáp hơn.',
    subtitle:
      'Cấu trúc khung hợp kim Titan thế hệ mới được tôi luyện theo chuẩn hàng không vũ trụ. Trọng lượng phân bổ cân bằng tối ưu, mang lại cảm giác cầm nắm đầm tay nhưng nhẹ thanh thoát.',
    specs: ['Độ mỏng ấn tượng 7.8mm', 'Titanium Grade 5 siêu bền', 'Viền vát bóng tinh xảo IP68'],
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(217, 119, 6, 0.25) 0%, rgba(9, 9, 11, 0) 70%)',
    themeColor: '#d97706',
  },
  {
    index: 2,
    number: '03',
    badge: 'HỆ THỐNG QUANG HỌC AI • ĐỘT PHÁ NHIẾP ẢNH',
    accentBadge: 'from-cyan-500 to-blue-600',
    title: 'Cụm 3 Camera 48MP Pro. Thẩm định AI.',
    subtitle:
      'Bộ ba ống kính tiềm vọng thế hệ mới tích hợp cảm biến siêu lớn, kết hợp thuật toán thị giác máy tính AI AutoGrade™ thẩm định chất lượng quang học và ngoại quan chi tiết đến từng micromet.',
    specs: ['Cảm biến 48MP Fusion 1/1.14"', 'Zoom quang tiềm vọng 10x', 'Tích hợp AI AutoGrade™ Vision'],
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(14, 165, 233, 0.28) 0%, rgba(9, 9, 11, 0) 70%)',
    themeColor: '#0ea5e9',
  },
  {
    index: 3,
    number: '04',
    badge: 'BỘ SƯU TẬP 4 SẮC THÁI TITAN ĐỈNH CAO',
    accentBadge: 'from-purple-500 to-rose-500',
    title: 'Sẵn sàng cho người tiên phong.',
    subtitle:
      'Khám phá trọn bộ 4 phiên bản màu Titan độc bản: Titan Tự Nhiên, Titan Đen Không Gian, Titan Xanh Biển Sâu và Titan Trắng Bạc. Chương trình Thu cũ Đổi mới trợ giá lên đến 5.000.000đ.',
    specs: ['Titan Tự Nhiên', 'Titan Đen Không Gian', 'Titan Xanh Biển Sâu', 'Titan Trắng Bạc'],
    bgGradient: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.28) 0%, rgba(9, 9, 11, 0) 75%)',
    themeColor: '#a855f7',
  },
]

// Three.js State
let scene, camera, renderer, animationFrameId
let phonesContainer
const phoneInstances = [] // [phone0, phone1, phone2, phone3]
let rimLight, keyLight, fillLight, ambientLight
let particleSystem
let width = 0
let height = 0
let isGLBLoaded = false
let isVisible = true
let observer = null

// Colors for 4 cloned phones in Chapter 4
const colorPalette = [
  {
    name: 'Titan Tự Nhiên',
    hex: 0x9e9891,
    rough: 0.22,
    metal: 0.88,
    glow1: 'rgba(217, 119, 6, 0.85)',
    glow2: 'rgba(244, 63, 94, 0.75)',
  },
  {
    name: 'Titan Đen Không Gian',
    hex: 0x181a1e,
    rough: 0.24,
    metal: 0.92,
    glow1: 'rgba(225, 29, 72, 0.85)',
    glow2: 'rgba(168, 85, 247, 0.7)',
  },
  {
    name: 'Titan Xanh Biển Sâu',
    hex: 0x1f364d,
    rough: 0.2,
    metal: 0.88,
    glow1: 'rgba(14, 165, 233, 0.9)',
    glow2: 'rgba(56, 189, 248, 0.75)',
  },
  {
    name: 'Titan Trắng Bạc',
    hex: 0xe6e8ed,
    rough: 0.16,
    metal: 0.85,
    glow1: 'rgba(248, 250, 252, 0.85)',
    glow2: 'rgba(192, 132, 252, 0.7)',
  },
]

function createScreenTexture(colorConfig = colorPalette[0]) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Wallpaper base gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 1024)
  grad.addColorStop(0, '#09090f')
  grad.addColorStop(0.35, '#151520')
  grad.addColorStop(0.7, '#241019')
  grad.addColorStop(1, '#050508')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 1024)

  // Fluid glowing circular waves matching the finish
  const accent1 = colorConfig?.glow1 || 'rgba(244, 63, 94, 0.9)'
  const accent2 = colorConfig?.glow2 || 'rgba(56, 189, 248, 0.75)'

  const radGrad1 = ctx.createRadialGradient(256, 440, 20, 256, 440, 270)
  radGrad1.addColorStop(0, accent1)
  radGrad1.addColorStop(0.55, 'rgba(190, 18, 60, 0.25)')
  radGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad1
  ctx.beginPath()
  ctx.arc(256, 440, 270, 0, Math.PI * 2)
  ctx.fill()

  const radGrad2 = ctx.createRadialGradient(220, 680, 10, 220, 680, 230)
  radGrad2.addColorStop(0, accent2)
  radGrad2.addColorStop(0.6, 'rgba(14, 165, 233, 0.2)')
  radGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad2
  ctx.beginPath()
  ctx.arc(220, 680, 230, 0, Math.PI * 2)
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
  ctx.fillText('Thứ Bảy, 21 Tháng 11', 256, 275)

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
  ctx.fillText('LIÊNG MOBILE • 3D STORY', 256, 796)

  // Home Indicator
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(176, 990, 160, 6, 3)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false
  return texture
}

function createProceduralPhone(colorConfig) {
  const group = new THREE.Group()
  const phoneW = 2.2
  const phoneH = 4.5
  const phoneD = 0.22
  const radius = 0.28

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

  const metalMat = new THREE.MeshPhysicalMaterial({
    color: colorConfig.hex,
    metalness: colorConfig.metal,
    roughness: colorConfig.rough,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
  })

  const chassis = new THREE.Mesh(bodyGeometry, metalMat)
  group.add(chassis)

  // Screen
  const screenMat = new THREE.MeshPhysicalMaterial({
    map: createScreenTexture(),
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1.0,
  })
  const screenGeo = new THREE.PlaneGeometry(phoneW * 0.93, phoneH * 0.93)
  const screenMesh = new THREE.Mesh(screenGeo, screenMat)
  screenMesh.position.z = phoneD / 2 + 0.042
  group.add(screenMesh)

  // Camera Bump on back
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
  const bumpMesh = new THREE.Mesh(bumpGeo, metalMat)

  const cameraBumpGroup = new THREE.Group()
  cameraBumpGroup.add(bumpMesh)

  const lensPositions = [
    [-0.22, 0.22],
    [-0.22, -0.22],
    [0.22, 0.0],
  ]
  const lensRingMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
  const lensGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x051329, roughness: 0.0, metalness: 0.2, clearcoat: 1.0 })

  lensPositions.forEach(([lx, ly]) => {
    const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 32), lensRingMat)
    ringMesh.rotateX(Math.PI / 2)
    ringMesh.position.set(lx, ly, 0.04)

    const innerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.075, 32), lensGlassMat)
    innerMesh.rotateX(Math.PI / 2)
    innerMesh.position.set(lx, ly, 0.042)

    cameraBumpGroup.add(ringMesh)
    cameraBumpGroup.add(innerMesh)
  })

  cameraBumpGroup.position.set(-phoneW / 2 + bumpW / 2 + 0.12, phoneH / 2 - bumpH / 2 - 0.12, -phoneD / 2 - 0.04)
  cameraBumpGroup.rotation.y = Math.PI
  group.add(cameraBumpGroup)

  return group
}

function initThree() {
  if (!canvasContainer.value) return

  updateHeaderOffset()

  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || (window.innerHeight - headerOffset.value)

  // 1. Scene
  scene = new THREE.Scene()

  // 2. Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
  camera.position.set(0, 0, 7.6)

  // 3. Renderer with high performance & tone mapping
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3
  canvasContainer.value.appendChild(renderer.domElement)

  // 4. Lighting: High-Intensity Rim Light (Intensity: 3.5)
  ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  // Critical Rim Light from top/back creating dramatic silhouette outline on dark #09090b
  rimLight = new THREE.DirectionalLight(0xffffff, 3.5)
  rimLight.position.set(0, 6, -5)
  scene.add(rimLight)

  keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
  keyLight.position.set(4, 4, 5)
  scene.add(keyLight)

  fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.4)
  fillLight.position.set(-4, 2, 4)
  scene.add(fillLight)

  // Specular gleam point light
  const specularLight = new THREE.PointLight(0xffffff, 2.0, 10)
  specularLight.position.set(1.5, 2, 4)
  scene.add(specularLight)

  // 5. Container for phones
  phonesContainer = new THREE.Group()
  scene.add(phonesContainer)

  // 6. Load GLTF model or fallback
  loadModel()

  // 7. Ambient Particle Field (Cinematic floating dust)
  const particleCount = 100
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 16
    positions[i + 1] = (Math.random() - 0.5) * 12
    positions[i + 2] = (Math.random() - 0.5) * 8
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xf43f5e,
    size: 0.05,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
  })
  particleSystem = new THREE.Points(particleGeo, particleMat)
  scene.add(particleSystem)

  // 8. Event Listeners
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('scroll', handleScroll, { passive: true })

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting
    })
  })
  observer.observe(canvasContainer.value)

  // Initial scroll calculation
  handleScroll()

  animate()
}

function loadModel() {
  const loader = new GLTFLoader()
  loader.load(
    '/models/phone.glb',
    (gltf) => {
      // Model loaded successfully!
      const model = gltf.scene

      const screenTex = createScreenTexture(colorPalette[0])
      model.traverse((child) => {
        if (child.name.includes('Plane') || child.name === 'Object_22' || (child.material && child.material.name === 'Material.003')) {
          child.visible = false
        }
        if (child.isMesh && child.material) {
          const matName = (child.material.name || '').toLowerCase()
          if (matName.includes('oled') || matName.includes('screen')) {
            child.material = child.material.clone()
            child.material.map = screenTex
            child.material.emissiveMap = screenTex
            child.material.emissive = new THREE.Color(0xffffff)
            child.material.emissiveIntensity = 1.0
            child.material.roughness = 0.05
            child.material.metalness = 0.1
            child.material.needsUpdate = true
          }
        }
      })

      // Orient model so front OLED screen faces forward (+Z) and stands upright along Y
      model.rotation.set(0, Math.PI, 0)

      // Compute bounding box and normalize scale (~82% viewport height with safe margins)
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)

      // USER REQUEST: Make it prominent & large like in reference video with safe margins so top/bottom never cut off
      const scaleFactor = 4.4 / maxDim

      model.scale.setScalar(scaleFactor)
      model.position.sub(center.clone().multiplyScalar(scaleFactor))

      const baseWrapper = new THREE.Group()
      baseWrapper.add(model)

      // Create 4 instances for Chapter 4 color parade
      colorPalette.forEach((col, idx) => {
        let instance
        if (idx === 0) {
          instance = baseWrapper
        } else {
          instance = baseWrapper.clone(true)
          const customScreenTex = createScreenTexture(col)
          // Tint materials of cloned instances (chassis, aluminum, frosted glass, screen)
          instance.traverse((child) => {
            if (child.isMesh && child.material) {
              const matName = (child.material.name || '').toLowerCase()
              if (
                matName.includes('aluminum') ||
                matName.includes('frosted') ||
                matName.includes('metal') ||
                matName.includes('color') ||
                matName.includes('frame') ||
                matName.includes('back')
              ) {
                const tinted = child.material.clone()
                tinted.color = new THREE.Color(col.hex)
                tinted.metalness = col.metal
                tinted.roughness = col.rough
                child.material = tinted
              } else if (matName.includes('oled') || matName.includes('screen')) {
                const customMat = child.material.clone()
                customMat.map = customScreenTex
                customMat.emissiveMap = customScreenTex
                child.material = customMat
              }
            }
          })
        }

        instance.userData = { color: col }
        phonesContainer.add(instance)
        phoneInstances.push(instance)
      })

      isGLBLoaded = true
    },
    undefined,
    (error) => {
      console.warn('Could not load /models/phone.glb, using procedural 3D model fallback:', error)
      setupProceduralFallback()
    },
  )
}

function setupProceduralFallback() {
  colorPalette.forEach((col) => {
    const phoneMesh = createProceduralPhone(col)
    phoneMesh.userData = { color: col }
    phonesContainer.add(phoneMesh)
    phoneInstances.push(phoneMesh)
  })
  isGLBLoaded = true
}

function handleScroll() {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const offset = headerOffset.value
  const totalScrollable = rect.height - (window.innerHeight - offset)
  if (totalScrollable <= 0) return

  const progress = Math.min(Math.max((offset - rect.top) / totalScrollable, 0), 1)
  scrollProgress.value = progress

  // Determine chapter (0 to 3)
  const newChapter = Math.min(Math.floor(progress * 4), 3)
  if (newChapter !== currentChapter.value) {
    currentChapter.value = newChapter
    // Trigger smooth text transition
    isTextVisible.value = false
    setTimeout(() => {
      activeTextChapter.value = newChapter
      isTextVisible.value = true
    }, 150)
  }
}

function scrollToChapter(idx) {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const offset = headerOffset.value
  const totalScrollable = sectionRef.value.clientHeight - (window.innerHeight - offset)
  const targetScrollTop = window.scrollY + rect.top - offset + (idx / 3.2) * totalScrollable
  window.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  })
}

function animate(time = 0) {
  animationFrameId = requestAnimationFrame(animate)
  if (!isVisible || phoneInstances.length === 0) return

  const sec = time * 0.001
  const p = scrollProgress.value
  const isMobile = window.innerWidth < 1024

  // Main Phone (phoneInstances[0]) motion across chapters
  const mainPhone = phoneInstances[0]

  // Default desktop offset puts the phone on the right (x ~ 1.3), center on mobile
  const defaultBaseX = isMobile ? 0 : 1.35

  if (p < 0.25) {
    // Chapter 1: Front Face View (0% -> 25%)
    const localP = p / 0.25
    mainPhone.rotation.y = THREE.MathUtils.lerp(0, -0.22, localP)
    mainPhone.rotation.x = THREE.MathUtils.lerp(0, 0.04, localP)
    mainPhone.position.set(defaultBaseX, Math.sin(sec * 1.5) * 0.05, 0)
    mainPhone.scale.setScalar(1.0)
    mainPhone.visible = true

    // Hide extra cloned phones
    for (let i = 1; i < phoneInstances.length; i++) {
      phoneInstances[i].visible = false
    }
  } else if (p < 0.5) {
    // Chapter 2: 45° Side Titanium Chamfer View (25% -> 50%)
    const localP = (p - 0.25) / 0.25
    mainPhone.rotation.y = THREE.MathUtils.lerp(-0.22, -Math.PI * 0.32, localP) // ~ -58 deg, displays sleek titanium side profile
    mainPhone.rotation.x = THREE.MathUtils.lerp(0.04, 0.08, localP)
    mainPhone.position.set(defaultBaseX, Math.sin(sec * 1.5) * 0.05, 0)
    mainPhone.scale.setScalar(1.04)
    mainPhone.visible = true

    for (let i = 1; i < phoneInstances.length; i++) {
      phoneInstances[i].visible = false
    }
  } else if (p < 0.75) {
    // Chapter 3: Rear Camera Glass View (50% -> 75%)
    const localP = (p - 0.5) / 0.25
    mainPhone.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.32, -Math.PI, localP) // turns around to back view
    mainPhone.rotation.x = THREE.MathUtils.lerp(0.08, 0.04, localP)
    mainPhone.position.set(defaultBaseX, Math.sin(sec * 1.5) * 0.05, 0)
    mainPhone.scale.setScalar(1.06)
    mainPhone.visible = true

    for (let i = 1; i < phoneInstances.length; i++) {
      phoneInstances[i].visible = false
    }
  } else {
    // Chapter 4: Clone into 4 Phones in a Horizontal Row (75% -> 100%)
    const localP = (p - 0.75) / 0.25 // 0.0 to 1.0

    // Targets for the 4 phones in row (X positions)
    const targetX = isMobile ? [-1.6, -0.55, 0.55, 1.6] : [-3.3, -1.1, 1.1, 3.3]
    // Elegant perspective tilt showing the 4 color finishes on the frosted back & titanium chassis
    const targetRotY = [-Math.PI + 0.35, -Math.PI + 0.12, -Math.PI - 0.12, -Math.PI - 0.35]
    const startX = [-9.0, -5.0, 5.0, 9.0]
    const targetScale = isMobile ? 0.65 : 0.85

    phoneInstances.forEach((phone, idx) => {
      phone.visible = true
      const curX = THREE.MathUtils.lerp(startX[idx], targetX[idx], Math.min(localP * 1.25, 1.0))
      const curRotY = THREE.MathUtils.lerp(-Math.PI, targetRotY[idx], Math.min(localP * 1.3, 1.0))
      const curScale = THREE.MathUtils.lerp(1.0, targetScale, localP)

      phone.position.set(curX, Math.sin(sec * 1.5 + idx * 0.6) * 0.05, idx === 0 || idx === 3 ? -0.3 : 0)
      phone.rotation.y = curRotY
      phone.rotation.x = 0.04
      phone.scale.setScalar(curScale)
    })
  }

  // Floating particles
  if (particleSystem) {
    particleSystem.rotation.y = sec * 0.02
    particleSystem.rotation.x = sec * 0.01
  }

  renderer.render(scene, camera)
}

function onWindowResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  updateHeaderOffset()
  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || (window.innerHeight - headerOffset.value)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  updateHeaderOffset()
  initThree()
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (observer) observer.disconnect()
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('scroll', handleScroll)
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
})
</script>

<template>
  <!-- SECTION 400VH CONTAINING STICKY FRAMEWORK -->
  <section ref="sectionRef" class="relative w-full h-[400vh] bg-[#09090b] text-white select-none">
    <!-- STICKY VIEWPORT DYNAMICALLY POSITIONED BELOW STOREHEADER (NEVER OVERLAPPED OR COVERED) -->
    <div
      class="sticky w-full overflow-hidden flex items-center justify-center transition-all"
      :style="{
        top: `${headerOffset}px`,
        height: `calc(100vh - ${headerOffset}px)`
      }"
    >
      <!-- DYNAMIC 600MS SMOOTH RADIAL GRADIENT BACKDROP -->
      <div
        class="absolute inset-0 pointer-events-none transition-all duration-[600ms] ease-out"
        :style="{ background: chapters[currentChapter].bgGradient }"
      />

      <!-- SUBTLE CINEMATIC CYBER GRID OVERLAY -->
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none opacity-40"
      />

      <!-- THREE.JS WEBGL CANVAS (FULLSTICKY BACKGROUND) -->
      <div
        ref="canvasContainer"
        class="absolute inset-0 z-10 w-full h-full pointer-events-none"
      />

      <!-- STORYTELLING CONTENT OVERLAY (Z-20) -->
      <div class="relative z-20 mx-auto w-full max-w-[1440px] h-full flex flex-col justify-between px-6 py-6 md:px-12 lg:px-20 pointer-events-none">
        <!-- TOP BRAND STATUS HEADER -->
        <div class="flex items-center justify-between w-full pt-1 pointer-events-auto">
          <div class="flex items-center gap-2.5 backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-lg">
            <span class="flex h-2.5 w-2.5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span class="text-xs font-semibold uppercase tracking-wider text-white/90">Liêng Mobile • Flagship 3D Story</span>
          </div>

          <!-- PROGRESS BAR ON TOP -->
          <div class="hidden sm:flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-mono">
            <span class="text-white/60">SCROLL PROGRESS</span>
            <div class="w-24 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-75"
                :style="{ width: `${Math.round(scrollProgress * 100)}%` }"
              />
            </div>
            <span class="text-rose-400 font-bold w-9 text-right">{{ Math.round(scrollProgress * 100) }}%</span>
          </div>
        </div>

        <!-- MAIN MIDDLE CONTENT (LEFT TEXT CONTENT) -->
        <div class="flex-1 flex items-center w-full">
          <!-- CHAPTER 1 - 3: LEFT COLUMN CONTENT -->
          <div
            v-if="currentChapter < 3"
            class="max-w-xl lg:max-w-xl transition-all duration-300 pointer-events-auto"
            :class="isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'"
          >
            <!-- BADGE -->
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg"
              :class="`bg-gradient-to-r ${chapters[activeTextChapter].accentBadge}`"
            >
              <StoreDeviceIcon name="fire" size-class="h-3.5 w-3.5 text-white" />
              <span>{{ chapters[activeTextChapter].badge }}</span>
            </span>

            <!-- TITLE -->
            <h1 class="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {{ chapters[activeTextChapter].title }}
            </h1>

            <!-- SUBTITLE -->
            <p class="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed font-light">
              {{ chapters[activeTextChapter].subtitle }}
            </p>

            <!-- SPECS PILLS -->
            <div class="mt-6 flex flex-wrap gap-2.5">
              <span
                v-for="spec in chapters[activeTextChapter].specs"
                :key="spec"
                class="backdrop-blur-md bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/90 shadow-sm"
              >
                {{ spec }}
              </span>
            </div>

            <!-- SCROLL GUIDE HINT -->
            <div class="mt-8 flex items-center gap-2 text-xs text-white/50 animate-bounce">
              <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Cuộn chuột xuống để tiếp tục câu chuyện 3D</span>
            </div>
          </div>

          <!-- CHAPTER 4: CALL TO ACTION FULL-WIDTH BANNER -->
          <div
            v-else
            class="w-full text-center flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto"
            :class="isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'"
          >
            <span class="inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 shadow-xl">
              <span>{{ chapters[3].badge }}</span>
            </span>

            <h2 class="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              {{ chapters[3].title }}
            </h2>

            <p class="mt-3 max-w-2xl text-sm sm:text-base text-gray-300 font-light">
              {{ chapters[3].subtitle }}
            </p>

            <!-- 4 COLOR LABELS PREVIEW -->
            <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
              <div
                v-for="(col, i) in colorPalette"
                :key="col.name"
                class="flex items-center gap-2 backdrop-blur-xl bg-black/50 border border-white/15 px-3.5 py-1.5 rounded-full shadow-lg text-xs"
              >
                <span class="w-3.5 h-3.5 rounded-full ring-1 ring-white/50" :style="{ backgroundColor: '#' + col.hex.toString(16).padStart(6, '0') }" />
                <span class="text-white/90 font-medium">{{ col.name }}</span>
              </div>
            </div>

            <!-- BIG CTAs -->
            <div class="mt-7 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#san-pham"
                class="rounded-2xl bg-white px-8 py-3.5 font-bold text-gray-950 transition-all hover:bg-gray-100 hover:scale-105 shadow-2xl hover:shadow-rose-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>Xem bảng giá / Đặt mua</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a
                :href="`tel:${storeInfo.hotline}`"
                class="rounded-2xl border border-white/30 backdrop-blur-md bg-white/10 px-8 py-3.5 font-semibold text-white transition hover:bg-white/20 cursor-pointer flex items-center gap-2"
              >
                <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-rose-400" />
                <span>Tư vấn thu cũ: {{ storeInfo.hotlineDisplay }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- BOTTOM CONTROLS & CHAPTER DOTS -->
        <div class="w-full flex items-center justify-between pb-4 pointer-events-auto">
          <!-- CHAPTER STEP TEXT -->
          <div class="text-xs font-mono text-white/60">
            CHƯƠNG <span class="text-rose-400 font-bold">{{ chapters[currentChapter].number }}</span> / 04 — {{ chapters[currentChapter].badge.split('•')[0] }}
          </div>

          <!-- RIGHT SIDE VERTICAL INDICATOR DOTS (CENTERED IN VISIBLE AREA) -->
          <div
            class="fixed right-6 sm:right-10 -translate-y-1/2 z-30 flex flex-col items-center gap-3 backdrop-blur-xl bg-black/40 border border-white/15 p-2 rounded-full shadow-2xl transition-all"
            :style="{ top: `calc(50% + ${headerOffset / 2}px)` }"
          >
            <button
              v-for="chap in chapters"
              :key="chap.index"
              type="button"
              class="group relative flex items-center justify-center p-1 cursor-pointer transition-all"
              @click="scrollToChapter(chap.index)"
            >
              <!-- DOT -->
              <span
                class="rounded-full transition-all duration-300"
                :class="currentChapter === chap.index ? 'w-3 h-8 bg-gradient-to-b from-rose-500 to-amber-400 shadow-md ring-2 ring-white/40' : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/70'"
              />

              <!-- TOOLTIP ON HOVER -->
              <span
                class="absolute right-9 px-2.5 py-1 rounded-lg bg-gray-900 border border-white/15 text-[10px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl pointer-events-none"
              >
                {{ chap.number }}. {{ chap.title }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Smooth 3D canvas backdrop transitions */
</style>

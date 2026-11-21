<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import StoreDeviceIcon from '@/components/intro/StoreDeviceIcon.vue'

const props = defineProps({
  storeInfo: {
    type: Object,
    default: () => ({ hotlineDisplay: '0383 435 600', hotline: '0383435600', name: 'Liêng Mobile' }),
  },
})

const emit = defineEmits(['open-cart'])

const sectionRef = ref(null)
const canvasContainer = ref(null)
const scrollProgress = ref(0)
const currentStation = ref(0) // 0: iPhone 18, 1: S22 Ultra, 2: iPhone 16 Pro Max, 3: Fold Duo
const isTextVisible = ref(true)
const activeTextStation = ref(0)
const headerOffset = ref(0)
const isAutoRotate = ref(true)
const isDragging = ref(false)
const isHudVisible = ref(true)

// 5 Flagship Stations specifications
const stations = [
  {
    id: 'ip18',
    stationNumber: '01',
    brand: 'APPLE CONCEPT',
    badge: 'THIẾT KẾ ĐỘT PHÁ • BẢN LĨNH FLAGSHIP',
    accentBadge: 'from-rose-600 to-orange-500',
    title: 'iPhone 18 Pro Max',
    subtitle:
      'Kiệt tác công nghệ nguyên khối với màn hình Super Retina XDR tràn viền không khiếm khuyết. Thiết kế đối xứng hoàn hảo định hình kỷ nguyên smartphone tương lai.',
    price: '34.990.000₫',
    oldPrice: '38.990.000₫',
    specs: ['Màn hình 6.9" 120Hz ProMotion', 'Độ sáng cực đại 3000 nits', 'Khung Titan Grade 5 siêu bền', 'Cụm 3 Camera 48MP AI'],
    themeHex: 0xf43f5e,
    themeColor: '#f43f5e',
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(244, 63, 94, 0.28) 0%, rgba(9, 9, 11, 0) 70%)',
    file: '/models/phone.glb',
    baseRot: [0, Math.PI, 0],
    targetHeight: 3.5,
    pedestalPos: [0, 0, 0],
    cameraOffset: [0, 0.25, 7.2],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 's22u',
    stationNumber: '02',
    brand: 'SAMSUNG ULTRA',
    badge: 'QUÁI VẬT NHIẾP ẢNH • BÚT S-PEN TÍCH HỢP',
    accentBadge: 'from-cyan-500 to-blue-600',
    title: 'Galaxy S22 / S25 Ultra',
    subtitle:
      'Màn hình Dynamic AMOLED 2X cong tràn siêu thực, camera 108MP Space Zoom 100x sắc nét đến từng micromet và sức mạnh Galaxy AI tích hợp bút S-Pen quyền năng.',
    price: '26.990.000₫',
    oldPrice: '31.990.000₫',
    specs: ['Bút S-Pen độ trễ 2.8ms', 'Camera 108MP 100x Space Zoom', 'Màn hình 6.8" Quad HD+ 120Hz', 'Khung Armor Aluminum'],
    themeHex: 0x0ea5e9,
    themeColor: '#0ea5e9',
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(14, 165, 233, 0.28) 0%, rgba(9, 9, 11, 0) 70%)',
    file: '/models/samsung_galaxy_s22_ultra.glb',
    baseRot: [0, 0.35, 0],
    targetHeight: 3.5,
    pedestalPos: [10, 0, -2],
    cameraOffset: [10, 0.25, 5.2],
    cameraTarget: [10, 0, -2],
  },
  {
    id: 'ip16',
    stationNumber: '03',
    brand: 'APPLE TITANIUM',
    badge: 'TITAN SA MẠC • NÚT CAMERA CONTROL MỚI',
    accentBadge: 'from-amber-500 to-yellow-600',
    title: 'iPhone 16 Pro Max',
    subtitle:
      'Tuyệt phẩm Titan Sa Mạc độc bản với viền màn hình mỏng kỷ lục 1.15mm. Trang bị phím cảm ứng lực Camera Control điện dung thế hệ mới giúp ghi hình chuẩn điện ảnh.',
    price: '31.490.000₫',
    oldPrice: '34.990.000₫',
    specs: ['Viền mỏng kỷ lục 1.15mm', 'Phím Camera Control điện dung', 'Chip Apple A18 Pro 3nm', 'Thời lượng pin vượt trội 33h'],
    themeHex: 0xd97706,
    themeColor: '#d97706',
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(217, 119, 6, 0.26) 0%, rgba(9, 9, 11, 0) 70%)',
    file: '/models/iphone_16_pro_max.glb',
    baseRot: [0, Math.PI / 2 + 0.35, 0],
    targetHeight: 3.5,
    pedestalPos: [20, 0, 0],
    cameraOffset: [20, 0.25, 7.2],
    cameraTarget: [20, 0, 0],
  },
  {
    id: 'ip15',
    stationNumber: '04',
    brand: 'APPLE TITANIUM',
    badge: 'TITAN TỰ NHIÊN • PHÍM ACTION BUTTON',
    accentBadge: 'from-zinc-400 to-amber-600',
    title: 'iPhone 15 Pro Max',
    subtitle:
      'Tuyệt tác gia công Titan cấp hàng không vũ trụ siêu nhẹ và bền bỉ. Trang bị phím Action Button đa nhiệm linh hoạt và chip Apple A17 Pro tiến trình 3nm đột phá.',
    price: '28.490.000₫',
    oldPrice: '32.990.000₫',
    specs: ['Khung Titan Tự Nhiên siêu nhẹ', 'Phím Action Button đa nhiệm', 'Chip Apple A17 Pro 3nm', 'Camera tiềm vọng Zoom 5x quang học'],
    themeHex: 0xa1a1aa,
    themeColor: '#a1a1aa',
    bgGradient: 'radial-gradient(circle at 62% 50%, rgba(161, 161, 170, 0.28) 0%, rgba(9, 9, 11, 0) 70%)',
    file: '/models/iphone_15_pro_max.glb',
    baseRot: [0, -0.35, 0],
    targetHeight: 3.5,
    pedestalPos: [30, 0, -2],
    cameraOffset: [30, 0.25, 5.2],
    cameraTarget: [30, 0, -2],
  },
  {
    id: 'duo',
    stationNumber: '05',
    brand: 'FUTURISTIC FOLD',
    badge: 'KỶ NGUYÊN MÀN HÌNH GẬP • KHÔNG GIỚI HẠN',
    accentBadge: 'from-purple-500 to-pink-500',
    title: 'iPhone Fold Duo Concept',
    subtitle:
      'Thiết kế gập kép tương lai với bản lề titan giọt nước siêu phẳng. Mở rộng không gian hiển thị kép đỉnh cao, biến smartphone thành trạm làm việc di động đa nhiệm.',
    price: '42.990.000₫',
    oldPrice: '48.990.000₫',
    specs: ['Màn hình gập Flex OLED 8.1"', 'Bản lề giọt nước Zero-Gap', 'Đa nhiệm 3 cửa sổ song song', 'Kính siêu mỏng Ultra-Thin'],
    themeHex: 0xa855f7,
    themeColor: '#a855f7',
    bgGradient: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.28) 0%, rgba(9, 9, 11, 0) 75%)',
    file: '/models/iphone_duo_concept.glb',
    baseRot: [0, 0.2, 0],
    targetHeight: 3.0,
    pedestalPos: [40, 0, 0],
    cameraOffset: [40, 0.25, 5.2],
    cameraTarget: [40, 0, 0],
  },
]

// Three.js Scene Variables
let scene, camera, renderer, animationFrameId
let showroomGroup
const stationObjects = [] // Array of { group, modelGroup, spotlight, ringMesh, particleSystem, station }
let ambientLight
let width = 0
let height = 0
let isVisible = true
let observer = null

// Smooth camera motion targets
const currentCamPos = new THREE.Vector3(0, 0.25, 7.2)
const currentCamTarget = new THREE.Vector3(0, 0, 0)

// Drag rotate state
let previousMouseX = 0
let activeUserYaw = 0

function updateHeaderOffset() {
  const headerEl = document.getElementById('top')
  if (headerEl && sectionRef.value) {
    const headerRect = headerEl.getBoundingClientRect()
    const sectionRect = sectionRef.value.getBoundingClientRect()
    // Only apply offset if header is rendered ABOVE the 3D section
    if (headerRect.top < sectionRect.top && headerRect.height > 0) {
      headerOffset.value = Math.round(headerRect.height)
      return
    }
  }
  headerOffset.value = 0
}

function createHolographicPedestal(station) {
  const group = new THREE.Group()
  const basePosY = -2.15

  // 1. High-tech reflective dark base cylinder
  const baseGeo = new THREE.CylinderGeometry(1.8, 2.1, 0.2, 48)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    metalness: 0.9,
    roughness: 0.15,
  })
  const baseMesh = new THREE.Mesh(baseGeo, baseMat)
  baseMesh.position.y = basePosY
  group.add(baseMesh)

  // 2. Inner mirror glass platform
  const glassGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 48)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x05070a,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
  })
  const glassMesh = new THREE.Mesh(glassGeo, glassMat)
  glassMesh.position.y = basePosY + 0.11
  group.add(glassMesh)

  // 3. Glowing Neon Holographic Laser Ring
  const ringGeo = new THREE.TorusGeometry(1.65, 0.035, 16, 64)
  const ringMat = new THREE.MeshBasicMaterial({
    color: station.themeHex,
    transparent: true,
    opacity: 0.9,
  })
  const ringMesh = new THREE.Mesh(ringGeo, ringMat)
  ringMesh.rotation.x = Math.PI / 2
  ringMesh.position.y = basePosY + 0.13
  group.add(ringMesh)

  // 4. Subtle Outer Pulse Wave Ring
  const waveGeo = new THREE.RingGeometry(1.68, 1.82, 48)
  const waveMat = new THREE.MeshBasicMaterial({
    color: station.themeHex,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
  const waveMesh = new THREE.Mesh(waveGeo, waveMat)
  waveMesh.rotation.x = -Math.PI / 2
  waveMesh.position.y = basePosY + 0.12
  group.add(waveMesh)

  // 5. Floating Holographic Cyber Motes / Particles
  const particleCount = 45
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount * 3; i += 3) {
    const angle = Math.random() * Math.PI * 2
    const radius = 0.4 + Math.random() * 1.2
    positions[i] = Math.cos(angle) * radius
    positions[i + 1] = basePosY + 0.2 + Math.random() * 3.8
    positions[i + 2] = Math.sin(angle) * radius
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: station.themeHex,
    size: 0.045,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  })
  const particleSystem = new THREE.Points(particleGeo, particleMat)
  group.add(particleSystem)

  // 6. Pedestal Point Light
  const pLight = new THREE.PointLight(station.themeHex, 2.5, 6)
  pLight.position.set(0, basePosY + 0.5, 0)
  group.add(pLight)

  return { group, ringMesh, waveMesh, particleSystem }
}

function initThree() {
  if (!canvasContainer.value) return

  updateHeaderOffset()

  width = canvasContainer.value.clientWidth
  height = canvasContainer.value.clientHeight || (window.innerHeight - headerOffset.value)

  // 1. Scene
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x09090b, 0.028)

  // 2. Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
  camera.position.set(0, 0.25, 7.2)

  // 3. Renderer with high-performance Tone Mapping
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.35
  canvasContainer.value.appendChild(renderer.domElement)

  // 4. Studio HDRI Environment Map (Crucial for Titanium frames, sapphire lenses & gloss backs)
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()
  const roomEnv = new RoomEnvironment()
  scene.environment = pmremGenerator.fromScene(roomEnv).texture
  scene.environmentIntensity = 1.6

  // 5. Lighting: Global Studio Ambient + Key/Fill/Rim lights
  ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
  scene.add(ambientLight)

  // Pure white Studio Key Light (bright front-right)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
  keyLight.position.set(5, 8, 8)
  scene.add(keyLight)

  // Studio Fill Light (soft front-left)
  const fillLight = new THREE.DirectionalLight(0xffffff, 1.6)
  fillLight.position.set(-5, 6, 6)
  scene.add(fillLight)

  // Top overall Rim Light
  const topRim = new THREE.DirectionalLight(0xffffff, 2.2)
  topRim.position.set(0, 10, -5)
  scene.add(topRim)

  // 6. Ground Cyber Grid Floor Plane
  const groundGeo = new THREE.PlaneGeometry(160, 60, 40, 40)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x07080a,
    roughness: 0.35,
    metalness: 0.85,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -2.2
  scene.add(ground)

  // Grid line helper for futuristic neon room reflection
  const gridHelper = new THREE.GridHelper(160, 60, 0x1f2937, 0x111827)
  gridHelper.position.y = -2.18
  scene.add(gridHelper)

  // 7. Master Showroom Group
  showroomGroup = new THREE.Group()
  scene.add(showroomGroup)

  // 8. Build Stations & Load Models
  stations.forEach((st, idx) => {
    const stationGroup = new THREE.Group()
    stationGroup.position.set(...st.pedestalPos)

    // Holographic Pedestal
    const { group: pedestalObj, ringMesh, waveMesh, particleSystem } = createHolographicPedestal(st)
    stationGroup.add(pedestalObj)

    // Dedicated Front Soft Spotlight for each station (White light so true materials/colors shine)
    const frontSpot = new THREE.SpotLight(0xffffff, 3.5, 18, Math.PI * 0.38, 0.45)
    frontSpot.position.set(st.pedestalPos[0], 5.5, st.pedestalPos[2] + 4.5)
    const spotTarget = new THREE.Object3D()
    spotTarget.position.set(...st.pedestalPos)
    scene.add(spotTarget)
    frontSpot.target = spotTarget
    scene.add(frontSpot)

    // Dedicated Overhead Theme Spotlight
    const spot = new THREE.SpotLight(st.themeHex, 2.8, 14, Math.PI * 0.35, 0.6)
    spot.position.set(st.pedestalPos[0], 6.5, st.pedestalPos[2] + 1.2)
    spot.target = spotTarget
    scene.add(spot)

    // Container for the Phone Model
    const modelContainer = new THREE.Group()
    modelContainer.position.set(0, 0.2, 0) // Floating slightly above pedestal
    stationGroup.add(modelContainer)

    showroomGroup.add(stationGroup)

    const record = {
      idx,
      station: st,
      stationGroup,
      modelContainer,
      modelMesh: null,
      ringMesh,
      waveMesh,
      particleSystem,
      spot,
      userRotationY: 0,
    }
    stationObjects.push(record)

    // Load GLTF Model asynchronously
    loadStationModel(st, record)
  })

  // 9. Event Listeners
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('scroll', handleScroll, { passive: true })

  // Mouse drag interaction on canvas
  const dom = renderer.domElement
  dom.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  dom.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd)

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting
    })
  })
  observer.observe(canvasContainer.value)

  handleScroll()
  animate()
}

function loadStationModel(station, record) {
  const loader = new GLTFLoader()
  loader.load(
    station.file,
    (gltf) => {
      const model = gltf.scene

      // Traversal with targeted material calibrations for each flagship
      model.traverse((child) => {
        if (!child.isMesh || !child.material) return

        const mats = Array.isArray(child.material) ? child.material : [child.material]

        mats.forEach((mat) => {
          mat.envMapIntensity = 2.0

          // === STATION 2: Samsung Galaxy S22 Ultra ===
          if (station.id === 's22u') {
            // Fix 1: Back glass cover - deep obsidian black with high glossy reflections
            if (mat.name === 'Back_Cover_Glass') {
              mat.color.setHex(0x181c22) // Deep charcoal obsidian
              mat.roughness = 0.15
              mat.metalness = 0.2
              mat.envMapIntensity = 2.6
            }
            // Fix 2: Camera Bezels & Deco rings - make the 4 camera rings gleam like metallic titanium rings
            if (['Cam_Bezel', 'BackCamDeco', 'Cam_Body', 'Rearcase_hole'].includes(mat.name)) {
              mat.color.setHex(0x71717a) // Bright metallic titanium/chrome
              mat.metalness = 0.95
              mat.roughness = 0.12
              mat.envMapIntensity = 3.2
            }
            // Fix 3: Camera lens optics - deep sapphire glass with reflections
            if (['Cam_Glass', 'Cam_lens', 'Zoom_Cam'].includes(mat.name)) {
              mat.color.setHex(0x0f172a)
              mat.roughness = 0.04
              mat.metalness = 0.35
              mat.envMapIntensity = 3.0
            }
            // Fix 4: Metal frame
            if (['Bezel', 'Rearcase', 'Antenna_Plastic'].includes(mat.name)) {
              mat.color.setHex(0x475569) // Armor Aluminum edge
              mat.metalness = 0.88
              mat.roughness = 0.18
              mat.envMapIntensity = 2.4
            }
          }

          // === STATION 3: iPhone 16 Pro Max ===
          if (station.id === 'ip16') {
            // Fix 1: Desert Titanium Frame & Camera Rings
            if (['metalframe.002', 'metaL.001', 'gray.001'].includes(mat.name)) {
              mat.color.setHex(0xd4af37) // Premium Desert Titanium gold metallic
              mat.metalness = 0.85
              mat.roughness = 0.18
              mat.envMapIntensity = 2.6
            }
            // Fix 2: Camera Lenses - Sapphire glass optical reflections
            if (mat.name === 'lensinglass' || child.name.includes('lensinglass')) {
              mat.color.setHex(0x0a1628) // Deep midnight blue sapphire lens
              mat.roughness = 0.04
              mat.metalness = 0.4
              mat.envMapIntensity = 3.2
            }
            // Fix 3: Camera Glass Island Plate
            if (mat.name === 'glass.002') {
              mat.roughness = 0.06
              mat.metalness = 0.1
              mat.envMapIntensity = 2.2
            }
            // Fix 4: Desert Titanium Backplate
            if (mat.name === 'basecolor.001') {
              mat.roughness = 0.36
              mat.metalness = 0.2
              mat.envMapIntensity = 2.0
            }
            // Fix 5: Apple Logo
            if (mat.name === 'apple_logo.001') {
              mat.metalness = 0.95
              mat.roughness = 0.1
              mat.envMapIntensity = 3.0
            }
          }

          // === STATION 4: iPhone 15 Pro Max ===
          if (station.id === 'ip15') {
            if (mat.name === 'backpanel') {
              mat.color.setHex(0x8e877e) // Natural Titanium back
              mat.roughness = 0.35
              mat.metalness = 0.25
              mat.envMapIntensity = 2.2
            }
            if (['metalframe', 'Material.001'].includes(mat.name)) {
              mat.color.setHex(0xa8a29e) // Natural Titanium brushed frame
              mat.metalness = 0.88
              mat.roughness = 0.18
              mat.envMapIntensity = 2.6
            }
            if (mat.name === 'lens') {
              mat.roughness = 0.05
              mat.envMapIntensity = 2.8
            }
          }

          // === STATION 5: iPhone Fold Duo Concept ===
          if (station.id === 'duo') {
            // Fix 1: Outer Display Frame - give it sleek Space Grey Titanium edge
            if (['Display_Frame', 'Rubber'].includes(mat.name)) {
              mat.color.setHex(0x374151) // Space grey titanium chamfer
              mat.metalness = 0.75
              mat.roughness = 0.2
              mat.envMapIntensity = 2.2
            }
            // Fix 2: Camera lenses on the back
            if (['Camera_Lens', 'Camera_filter', 'Camera_sapphire_miror', 'Lens_frame'].includes(mat.name)) {
              mat.color.setHex(0x0a1128)
              mat.roughness = 0.04
              mat.metalness = 0.4
              mat.envMapIntensity = 3.0
            }
            // Fix 3: Titanium Hinge
            if (['Titanium', 'Metal_tint'].includes(mat.name)) {
              mat.color.setHex(0xd1d5db)
              mat.metalness = 0.95
              mat.roughness = 0.12
              mat.envMapIntensity = 2.8
            }
            // Fix 4: Frosted glass back
            if (mat.name === 'Frosted_glass') {
              mat.envMapIntensity = 2.0
              mat.roughness = 0.22
            }
          }

          // === STATION 1: iPhone 18 Pro Max ===
          if (station.id === 'ip18') {
            if (['Camera Lens', 'Camera sapphire miror', 'Camera mirror filter'].includes(mat.name)) {
              mat.roughness = 0.04
              mat.envMapIntensity = 3.0
            }
            if (['Metal tint', 'Anodized aluminum', 'Metal Screw'].includes(mat.name)) {
              mat.envMapIntensity = 2.8
              mat.metalness = 0.88
            }
          }
        })
      })

      // Set calibrated upright & facing orientation
      model.rotation.set(...station.baseRot)
      model.updateMatrixWorld(true)

      // Normalize size so all phones sit proudly at target height
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = (station.targetHeight || 3.8) / maxDim

      model.scale.setScalar(scale)
      model.position.sub(center.clone().multiplyScalar(scale))

      record.modelMesh = model
      record.modelContainer.add(model)
    },
    undefined,
    (err) => {
      console.warn(`Could not load ${station.file}, procedural fallback:`, err)
      // Fallback smartphone mesh
      const fallbackGeo = new THREE.BoxGeometry(1.8, 3.6, 0.22)
      const fallbackMat = new THREE.MeshStandardMaterial({
        color: station.themeHex,
        metalness: 0.85,
        roughness: 0.2,
      })
      const mesh = new THREE.Mesh(fallbackGeo, fallbackMat)
      record.modelMesh = mesh
      record.modelContainer.add(mesh)
    },
  )
}

function handleScroll() {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const offset = headerOffset.value
  const totalScrollable = rect.height - (window.innerHeight - offset)
  if (totalScrollable <= 0) return

  const progress = Math.min(Math.max((offset - rect.top) / totalScrollable, 0), 1)
  scrollProgress.value = progress

  // Determine active station (0 to 3)
  const newStation = Math.min(Math.floor(progress * stations.length), stations.length - 1)
  if (newStation !== currentStation.value) {
    currentStation.value = newStation
    isTextVisible.value = false
    setTimeout(() => {
      activeTextStation.value = newStation
      isTextVisible.value = true
    }, 150)
  }
}

function scrollToStation(idx) {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const offset = headerOffset.value
  const totalScrollable = sectionRef.value.clientHeight - (window.innerHeight - offset)
  const targetScrollTop = window.scrollY + rect.top - offset + (idx / (stations.length - 0.8)) * totalScrollable
  window.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  })
}

// Mouse Drag Rotation
function onMouseDown(e) {
  isDragging.value = true
  previousMouseX = e.clientX
}

function onMouseMove(e) {
  if (!isDragging.value) return
  const deltaX = e.clientX - previousMouseX
  previousMouseX = e.clientX
  activeUserYaw += deltaX * 0.008
}

function onMouseUp() {
  isDragging.value = false
}

function onTouchStart(e) {
  if (e.touches.length > 0) {
    isDragging.value = true
    previousMouseX = e.touches[0].clientX
  }
}

function onTouchMove(e) {
  if (!isDragging.value || e.touches.length === 0) return
  const deltaX = e.touches[0].clientX - previousMouseX
  previousMouseX = e.touches[0].clientX
  activeUserYaw += deltaX * 0.008
}

function onTouchEnd() {
  isDragging.value = false
}

function animate(time = 0) {
  animationFrameId = requestAnimationFrame(animate)
  if (!isVisible || !camera || !renderer) return

  const sec = time * 0.001
  const p = scrollProgress.value

  // 1. Calculate continuous Camera Rail Spline position across 4 stations
  // p: 0.0 to 1.0 mapped along stations
  const stCount = stations.length
  const segment = p * (stCount - 1)
  const baseIdx = Math.min(Math.floor(segment), stCount - 2)
  const localT = segment - baseIdx // 0.0 to 1.0 between baseIdx and baseIdx+1

  // Smooth easing for cinematic travel
  const easedT = THREE.MathUtils.smoothstep(localT, 0, 1)

  const stA = stations[baseIdx]
  const stB = stations[baseIdx + 1]

  const targetCamX = THREE.MathUtils.lerp(stA.cameraOffset[0], stB.cameraOffset[0], easedT)
  const targetCamY = THREE.MathUtils.lerp(stA.cameraOffset[1], stB.cameraOffset[1], easedT)
  const targetCamZ = THREE.MathUtils.lerp(stA.cameraOffset[2], stB.cameraOffset[2], easedT)

  const targetLookX = THREE.MathUtils.lerp(stA.cameraTarget[0], stB.cameraTarget[0], easedT)
  const targetLookY = THREE.MathUtils.lerp(stA.cameraTarget[1], stB.cameraTarget[1], easedT)
  const targetLookZ = THREE.MathUtils.lerp(stA.cameraTarget[2], stB.cameraTarget[2], easedT)

  // Smooth camera dampening
  currentCamPos.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.06)
  currentCamTarget.lerp(new THREE.Vector3(targetLookX, targetLookY, targetLookZ), 0.06)

  camera.position.copy(currentCamPos)
  camera.lookAt(currentCamTarget)

  // 2. Animate Stations, Pedestals & Floating Phones
  stationObjects.forEach((obj, i) => {
    const isCurrent = i === currentStation.value

    // Gently float phone up/down on pedestal
    const floatY = Math.sin(sec * 1.6 + i * 0.8) * 0.06
    obj.modelContainer.position.y = 0.2 + floatY

    // Phone rotation
    if (obj.modelMesh) {
      if (isCurrent && isDragging.value) {
        // Direct user drag rotation
        obj.modelContainer.rotation.y = activeUserYaw
      } else {
        // Ambient cinematic slow orbit sway
        const sway = Math.sin(sec * 0.7 + i * 1.2) * 0.3
        obj.modelContainer.rotation.y = THREE.MathUtils.lerp(
          obj.modelContainer.rotation.y,
          isAutoRotate.value ? sec * 0.4 + sway : sway,
          0.05,
        )
      }
    }

    // Pulse neon pedestal ring
    if (obj.ringMesh) {
      obj.ringMesh.rotation.z = sec * 0.3
    }
    if (obj.waveMesh) {
      const scaleWave = 1.0 + Math.sin(sec * 2.0 + i) * 0.08
      obj.waveMesh.scale.set(scaleWave, scaleWave, 1)
    }

    // Swirl holographic particles
    if (obj.particleSystem) {
      obj.particleSystem.rotation.y = sec * 0.15
    }

    // Focus spotlight intensity
    if (obj.spot) {
      obj.spot.intensity = isCurrent ? 4.2 : 1.2
    }
  })

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
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
})
</script>

<template>
  <!-- SECTION 500VH SHOWROOM TOUR -->
  <section ref="sectionRef" class="relative w-full h-[500vh] bg-[#09090b] text-white select-none">
    <!-- STICKY 100VH VIEWPORT POSITIONED BELOW STOREHEADER -->
    <div
      class="sticky w-full overflow-hidden flex items-center justify-center transition-all"
      :style="{
        top: `${headerOffset}px`,
        height: `calc(100vh - ${headerOffset}px)`,
      }"
    >
      <!-- DYNAMIC 600MS SMOOTH RADIAL GRADIENT BACKDROP -->
      <div
        class="absolute inset-0 pointer-events-none transition-all duration-[600ms] ease-out"
        :style="{ background: stations[currentStation].bgGradient }"
      />

      <!-- SUBTLE CINEMATIC CYBER GRID OVERLAY -->
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none opacity-40"
      />

      <!-- THREE.JS WEBGL CANVAS (INTERACTIVE 360 DRAG) -->
      <div
        ref="canvasContainer"
        class="absolute inset-0 z-10 w-full h-full cursor-grab active:cursor-grabbing"
        title="Kéo chuột để xoay 360°"
      />

      <!-- FLOATING RESTORE HUD BUTTON (Appears when in Zen Fullscreen view) -->
      <button
        v-if="!isHudVisible"
        type="button"
        class="absolute top-5 left-5 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 backdrop-blur-xl text-xs font-semibold text-white shadow-2xl transition cursor-pointer pointer-events-auto"
        @click="isHudVisible = true"
      >
        <span>👁️</span>
        <span>Hiện bảng điều khiển & thông số</span>
      </button>

      <!-- SHOWROOM HUD OVERLAY (Z-20) -->
      <div
        class="relative z-20 mx-auto w-full max-w-[1440px] h-full flex flex-col justify-between px-6 py-6 md:px-12 lg:px-20 pointer-events-none transition-all duration-300"
        :class="isHudVisible ? 'opacity-100' : 'opacity-0'"
      >
        <!-- TOP SHOWROOM HEADER & QUICK JUMP STATIONS -->
        <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 pointer-events-auto">
          <!-- BADGE BRAND -->
          <div class="flex items-center gap-2.5 backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-lg">
            <span class="flex h-2.5 w-2.5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span class="text-xs font-semibold uppercase tracking-wider text-white/90">
              Liêng Mobile • 3D Showroom
            </span>
          </div>

          <!-- QUICK SWITCHER TABS (STATIONS 1 - 5) -->
          <div class="flex items-center gap-1.5 p-1 rounded-full backdrop-blur-xl bg-black/40 border border-white/15 shadow-xl overflow-x-auto max-w-full">
            <button
              v-for="(st, idx) in stations"
              :key="st.id"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              :class="
                currentStation === idx
                  ? 'bg-white text-gray-950 font-bold shadow-md scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              "
              @click="scrollToStation(idx)"
            >
              <span>{{ st.stationNumber }}</span>
              <span class="hidden md:inline">{{ st.title.split(' ')[0] }} {{ st.title.split(' ')[1] }}</span>
            </button>
          </div>

          <!-- ZEN VIEW TOGGLE & PROGRESS TRACKER -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3.5 py-2 rounded-full text-xs font-medium backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-md"
              :title="isHudVisible ? 'Ẩn các nút điều khiển để ngắm điện thoại toàn màn hình không vướng' : 'Hiện lại thông tin & điều khiển'"
              @click="isHudVisible = !isHudVisible"
            >
              <span>👁️</span>
              <span class="hidden sm:inline">Toàn cảnh</span>
            </button>

            <!-- SCROLL PROGRESS TRACKER -->
            <div class="hidden lg:flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-mono">
              <span class="text-white/60">TOUR</span>
              <div class="w-16 h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-cyan-400 via-rose-500 to-purple-500 transition-all duration-75"
                  :style="{ width: `${Math.round(scrollProgress * 100)}%` }"
                />
              </div>
              <span class="text-cyan-400 font-bold w-9 text-right">{{ Math.round(scrollProgress * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- MAIN MIDDLE CONTENT (LEFT TECH SPECS HUD CARD) -->
        <div class="flex-1 flex items-center w-full">
          <div
            class="max-w-xl lg:max-w-xl transition-all duration-300 pointer-events-auto"
            :class="isTextVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'"
          >
            <!-- BRAND BADGE -->
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg"
                :class="`bg-gradient-to-r ${stations[activeTextStation].accentBadge}`"
              >
                <StoreDeviceIcon name="fire" size-class="h-3.5 w-3.5 text-white" />
                <span>{{ stations[activeTextStation].badge }}</span>
              </span>
            </div>

            <!-- TITLE -->
            <h1 class="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {{ stations[activeTextStation].title }}
            </h1>

            <!-- SUBTITLE -->
            <p class="mt-3 text-sm sm:text-base text-gray-300 leading-relaxed font-light">
              {{ stations[activeTextStation].subtitle }}
            </p>

            <!-- PRICE TAG -->
            <div class="mt-4 flex items-baseline gap-3">
              <span class="text-2xl sm:text-3xl font-extrabold text-white">
                {{ stations[activeTextStation].price }}
              </span>
              <span class="text-sm text-white/50 line-through">
                {{ stations[activeTextStation].oldPrice }}
              </span>
              <span class="rounded-lg bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-semibold text-rose-300">
                Tiết kiệm {{ (parseInt(stations[activeTextStation].oldPrice) - parseInt(stations[activeTextStation].price)).toFixed(0) }} tr
              </span>
            </div>

            <!-- SPECS PILLS -->
            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-for="spec in stations[activeTextStation].specs"
                :key="spec"
                class="backdrop-blur-md bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-xs font-medium text-white/90 shadow-sm"
              >
                {{ spec }}
              </span>
            </div>

            <!-- CTAs & INTERACTIVE CONTROLS -->
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#san-pham"
                class="rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-gray-100 hover:scale-105 shadow-xl hover:shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>Xem giá & Đặt hàng</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a
                :href="`tel:${storeInfo.hotline}`"
                class="rounded-xl border border-white/20 backdrop-blur-md bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 cursor-pointer flex items-center gap-2"
              >
                <StoreDeviceIcon name="phone-call" size-class="h-4 w-4 text-cyan-400" />
                <span>Thu cũ đổi mới</span>
              </a>

              <!-- 360 ROTATE TOGGLE BUTTON -->
              <button
                type="button"
                class="rounded-xl border border-white/15 backdrop-blur-md bg-black/40 px-3.5 py-3 text-xs font-medium text-white/80 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                :title="isAutoRotate ? 'Tạm dừng xoay' : 'Bật tự động xoay'"
                @click="isAutoRotate = !isAutoRotate"
              >
                <svg class="w-4 h-4" :class="isAutoRotate ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{{ isAutoRotate ? '360° On' : '360° Off' }}</span>
              </button>
            </div>

            <!-- DRAG GUIDE HINT -->
            <div class="mt-5 flex items-center gap-2 text-xs text-white/50">
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              <span>Giữ chuột & kéo ngang để xoay 360° chiếc máy này</span>
            </div>
          </div>
        </div>

        <!-- BOTTOM CONTROLS & PEDESTAL DOTS -->
        <div class="w-full flex items-center justify-between pb-2 pointer-events-auto">
          <!-- STATION STATUS TEXT -->
          <div class="text-xs font-mono text-white/60">
            BỆ TRƯNG BÀY <span class="text-cyan-400 font-bold">{{ stations[currentStation].stationNumber }}</span> / 04 —
            {{ stations[currentStation].brand }}
          </div>

          <!-- SCROLL GUIDE HINT -->
          <div class="hidden sm:flex items-center gap-2 text-xs text-white/50 animate-bounce">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>Cuộn chuột để di chuyển camera sang bệ máy tiếp theo</span>
          </div>

          <!-- RIGHT SIDE VERTICAL INDICATOR DOTS (CENTERED IN VISIBLE AREA) -->
          <div
            class="fixed right-6 sm:right-10 -translate-y-1/2 z-30 flex flex-col items-center gap-3 backdrop-blur-xl bg-black/40 border border-white/15 p-2 rounded-full shadow-2xl transition-all"
            :style="{ top: `calc(50% + ${headerOffset / 2}px)` }"
          >
            <button
              v-for="(st, idx) in stations"
              :key="st.id"
              type="button"
              class="group relative flex items-center justify-center p-1 cursor-pointer transition-all"
              @click="scrollToStation(idx)"
            >
              <!-- DOT -->
              <span
                class="rounded-full transition-all duration-300"
                :class="
                  currentStation === idx
                    ? 'w-3 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-md ring-2 ring-white/40'
                    : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/70'
                "
              />

              <!-- TOOLTIP ON HOVER -->
              <span
                class="absolute right-9 px-2.5 py-1 rounded-lg bg-gray-900 border border-white/15 text-[10px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl pointer-events-none"
              >
                {{ st.stationNumber }}. {{ st.title }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

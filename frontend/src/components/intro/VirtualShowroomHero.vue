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

// Interactive 3D Hotspot Mode State (Option 2)
const isHotspotMode = ref(false)
const selectedHotspot = ref(null)
const projectedHotspots = ref([])
const isHoveringPhone = ref(false)
const cardRefs = ref({})
function setCardRef(id, el) {
  if (el) cardRefs.value[id] = el
}
let targetUserYaw = null
let mouseDownPos = { x: 0, y: 0 }
let mouseDownTime = 0
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

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
    hotspots: [
      {
        id: 'camera',
        title: 'Cụm 3 Camera 48MP AI',
        badge: 'PHOTONIC ENGINE PRO',
        icon: '📸',
        description: 'Hệ thống 3 ống kính 48MP đồng nhất cảm biến thế hệ mới, hỗ trợ quay video điện ảnh 8K 60fps ProRes và khử rung gimbal quang học tích hợp.',
        localPos: [-0.35, 0.95, 0.15],
        targetRotY: Math.PI,
      },
      {
        id: 'screen',
        title: 'Màn hình Super Retina XDR 6.9"',
        badge: 'PROMOTION 120HZ',
        icon: '✨',
        description: 'Tấm nền OLED ProMotion 1-120Hz độ sáng đỉnh 3000 nits, viền mỏng vô cực không khiếm khuyết, kính Ceramic Shield chống trầy thế hệ mới.',
        localPos: [0.0, 0.2, -0.15],
        targetRotY: 0,
      },
      {
        id: 'frame',
        title: 'Khung Titan Hàng Không Grade 5',
        badge: 'AEROSPACE GRADE',
        icon: '🛡️',
        description: 'Hợp kim titan Grade 5 gia công chuẩn xác bằng phay CNC vi mô, vừa siêu nhẹ vừa tản nhiệt tối ưu cho chip xử lý.',
        localPos: [0.65, 0.0, 0.0],
        targetRotY: Math.PI * 0.4,
      },
      {
        id: 'action',
        title: 'Phím Tác Vụ Cảm Biến Lực',
        badge: 'HAPTIC FEEDBACK',
        icon: '🔘',
        description: 'Phím Action thế hệ mới cảm ứng điện dung nhận diện chạm vuốt mượt mà để đổi nhanh chế độ zoom, khẩu độ và chụp tức thì.',
        localPos: [-0.68, 0.5, 0.0],
        targetRotY: -Math.PI * 0.4,
      },
    ],
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
    hotspots: [
      {
        id: 'zoom',
        title: 'Ống Kính 100x Space Zoom',
        badge: 'CẢM BIẾN 108MP PRO',
        icon: '🔭',
        description: 'Camera siêu zoom 100x kết hợp thuật toán Galaxy AI xử lý đa khung hình, cho ảnh chụp thiên văn và vật thể từ xa sắc nét ngoạn mục.',
        localPos: [-0.32, 0.95, -0.15],
        targetRotY: 0,
      },
      {
        id: 'spen',
        title: 'Bút S-Pen Tích Hợp Thân Máy',
        badge: 'ĐỘ TRỄ 2.8MS',
        icon: '✍️',
        description: 'Cây bút S-Pen quyền năng ẩn trong thân máy, hỗ trợ viết vẽ như bút thật, chuyển đổi chữ viết tay và điều khiển cử chỉ không chạm.',
        localPos: [0.55, -1.3, 0.0],
        targetRotY: Math.PI * 0.5,
      },
      {
        id: 'display',
        title: 'Màn Hình Dynamic AMOLED 2X',
        badge: 'VISION BOOSTER 120HZ',
        icon: '📱',
        description: 'Màn hình 6.8 inch cong tràn 120Hz siêu nét với công nghệ Vision Booster tự động điều chỉnh tương phản sắc sảo theo ánh sáng môi trường.',
        localPos: [0.0, 0.1, 0.15],
        targetRotY: Math.PI,
      },
      {
        id: 'frame',
        title: 'Khung Armor Aluminum & IP68',
        badge: 'BẢO VỆ TOÀN DIỆN',
        icon: '🛡️',
        description: 'Khung hợp kim nhôm Armor Aluminum cứng cáp cùng chuẩn kháng nước bụi IP68 bảo vệ thiết bị an tâm trong mọi điều kiện vận hành.',
        localPos: [-0.65, 0.0, 0.0],
        targetRotY: -Math.PI * 0.4,
      },
    ],
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
    hotspots: [
      {
        id: 'control',
        title: 'Phím Camera Control Cảm Ứng Lực',
        badge: 'CÔNG NGHỆ MỚI 2024',
        icon: '🔘',
        description: 'Phím bấm xúc giác phủ đá sapphire nhạy áp lực và điện dung, cho phép trượt ngón tay để zoom mượt, đổi tiêu cự và bấm 2 nấc chụp chuẩn DSLR.',
        localPos: [0.65, -0.2, 0.0],
        targetRotY: Math.PI * 0.45,
      },
      {
        id: 'tetra',
        title: 'Camera Tiềm Vọng Tetraprism 5x',
        badge: 'QUANG HỌC 120MM',
        icon: '📸',
        description: 'Thiết kế lăng kính phản xạ 4 lần đột phá đem lại tiêu cự 120mm quang học 5x sắc nét, bắt trọn từng khoảnh khắc chân dung từ xa.',
        localPos: [-0.32, 0.95, 0.15],
        targetRotY: Math.PI,
      },
      {
        id: 'titan',
        title: 'Vỏ Titan Sa Mạc (Desert Titanium)',
        badge: 'VIỀN SIÊU MỎNG 1.15MM',
        icon: '✨',
        description: 'Màu Titan Sa Mạc sang trọng với lớp hoàn thiện satin cao cấp, viền màn hình siêu mỏng kỷ lục thế giới chỉ 1.15mm.',
        localPos: [0.0, -0.8, 0.15],
        targetRotY: Math.PI,
      },
      {
        id: 'a18',
        title: 'Chip Apple A18 Pro 3nm',
        badge: 'APPLE INTELLIGENCE',
        icon: '⚡',
        description: 'Bộ vi xử lý 3nm thế hệ thứ 2 với Neural Engine 16 lõi xử lý AI trực tiếp trên máy và Ray Tracing phần cứng tăng tốc đồ họa game AAA.',
        localPos: [0.0, 0.1, -0.15],
        targetRotY: 0,
      },
    ],
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
    hotspots: [
      {
        id: 'action',
        title: 'Phím Tác Vụ Action Button',
        badge: 'ĐA NHIỆM TÙY BIẾN',
        icon: '🔔',
        description: 'Thay thế cần gạt rung truyền thống bằng phím vật lý tùy biến đa năng: mở camera, bật đèn pin, ghi âm hay kích hoạt phím tắt chỉ với 1 nhấn.',
        localPos: [-0.65, 0.7, 0.0],
        targetRotY: -Math.PI * 0.45,
      },
      {
        id: 'usbc',
        title: 'Cổng USB-C Tốc Độ 10Gbps',
        badge: 'CHUẨN USB 3 CAO CẤP',
        icon: '🔌',
        description: 'Cổng USB-C tốc độ cao truyền tệp ProRes 4K trực tiếp sang ổ cứng ngoài và hỗ trợ sạc ngược cho phụ kiện AirPods, Apple Watch.',
        localPos: [0.0, -1.5, 0.0],
        targetRotY: 0,
      },
      {
        id: 'back',
        title: 'Mặt Lưng Kính Nhám Titan Tự Nhiên',
        badge: 'CHỐNG BÁM VÂN TAY',
        icon: '🛡️',
        description: 'Kính cường lực nhám cao cấp kết hợp khung titan cấp 5 đem lại cảm giác cầm nắm chắc tay, nhẹ hơn 19g so với thế hệ tiền nhiệm.',
        localPos: [0.0, 0.1, 0.15],
        targetRotY: Math.PI,
      },
      {
        id: 'screen',
        title: 'Màn Hình Dynamic Island 2000 Nits',
        badge: 'OLED SUPER RETINA XDR',
        icon: '📱',
        description: 'Màn hình Super Retina XDR với cụm Dynamic Island biến ảo linh hoạt hiển thị thông báo, bản đồ và nhạc theo thời gian thực.',
        localPos: [0.0, 0.4, -0.15],
        targetRotY: 0,
      },
    ],
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
    hotspots: [
      {
        id: 'hinge',
        title: 'Bản Lề Titan Giọt Nước Zero-Gap',
        badge: 'CƠ KHÍ SIÊU CHÍNH XÁC',
        icon: '🔗',
        description: 'Cơ cấu gập mở giọt nước đa khớp bằng titan hàng không giúp 2 nửa màn hình khép khít hoàn toàn và triệt tiêu tối đa nếp gấp màn hình.',
        localPos: [0.0, 0.0, 0.0],
        targetRotY: 0,
      },
      {
        id: 'flex',
        title: 'Màn Hình Flex OLED Kép 8.1"',
        badge: 'ULTRA-THIN GLASS (UTG)',
        icon: '📖',
        description: 'Mở rộng từ 6.2 inch thành tablet 8.1 inch tỷ lệ chuẩn, kính siêu mỏng UTG bền bỉ chịu hơn 400.000 lần gập mở liên tục.',
        localPos: [0.5, 0.2, -0.1],
        targetRotY: 0,
      },
      {
        id: 'cam',
        title: 'Camera Tiềm Vọng Siêu Mỏng',
        badge: 'CẢM BIẾN DƯỚI MÀN HÌNH',
        icon: '📸',
        description: 'Cụm ống kính quang học siêu mỏng được tinh chỉnh riêng cho thân máy gập, hỗ trợ chụp selfie bằng camera chính với màn hình phụ.',
        localPos: [-0.4, 0.8, 0.15],
        targetRotY: Math.PI,
      },
      {
        id: 'os',
        title: 'Hệ Thống Đa Nhiệm 3 Cửa Sổ',
        badge: 'DUO ENGINE TƯƠNG TÁC',
        icon: '⚡',
        description: 'Giao diện tối ưu hóa cho màn hình gập, cho phép kéo thả dữ liệu giữa 3 ứng dụng đồng thời và chế độ Flex Mode đặt nằm chụp rảnh tay.',
        localPos: [-0.4, -0.5, -0.1],
        targetRotY: 0,
      },
    ],
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

function createIPhone15ScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Wallpaper base - Apple Natural Titanium Silk Wallpaper
  const grad = ctx.createLinearGradient(0, 0, 512, 1024)
  grad.addColorStop(0, '#0a0a0e')
  grad.addColorStop(0.25, '#16161c')
  grad.addColorStop(0.5, '#232227')
  grad.addColorStop(0.75, '#1b1b20')
  grad.addColorStop(1, '#08080a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 1024)

  // Fluid glowing Natural Titanium silk ribbons / orbital arcs
  const radGrad1 = ctx.createRadialGradient(256, 460, 20, 256, 460, 270)
  radGrad1.addColorStop(0, 'rgba(195, 185, 170, 0.85)')
  radGrad1.addColorStop(0.45, 'rgba(145, 135, 120, 0.35)')
  radGrad1.addColorStop(0.8, 'rgba(75, 70, 65, 0.12)')
  radGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad1
  ctx.beginPath()
  ctx.arc(256, 460, 270, 0, Math.PI * 2)
  ctx.fill()

  const radGrad2 = ctx.createRadialGradient(230, 690, 15, 230, 690, 230)
  radGrad2.addColorStop(0, 'rgba(230, 220, 205, 0.55)')
  radGrad2.addColorStop(0.55, 'rgba(160, 150, 135, 0.22)')
  radGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radGrad2
  ctx.beginPath()
  ctx.arc(230, 690, 230, 0, Math.PI * 2)
  ctx.fill()

  // Dynamic Island
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.roundRect(196, 28, 120, 36, 18)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(295, 46, 4, 0, Math.PI * 2)
  ctx.fill()

  // Clock
  ctx.fillStyle = '#f5f5f4'
  ctx.font = 'bold 94px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('09:41', 256, 225)

  // Date
  ctx.font = '500 24px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(231, 229, 228, 0.9)'
  ctx.fillText('Thứ Bảy, 21 Tháng 11', 256, 275)

  // Liêng Mobile Brand Badge on Lockscreen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.beginPath()
  ctx.roundRect(76, 750, 360, 76, 38)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.fillText('LIÊNG MOBILE • TITAN TỰ NHIÊN', 256, 796)

  // Home Indicator
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(176, 990, 160, 6, 3)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
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
  renderer.toneMappingExposure = 1.05
  canvasContainer.value.appendChild(renderer.domElement)

  // 4. Studio HDRI Environment Map (Crucial for Titanium frames, sapphire lenses & gloss backs)
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()
  const roomEnv = new RoomEnvironment()
  scene.environment = pmremGenerator.fromScene(roomEnv).texture
  scene.environmentIntensity = 1.1

  // 5. Lighting: Global Studio Ambient + Key/Fill/Rim lights (Calibrated to preserve true phone colors)
  ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  // Pure white Studio Key Light (bright front-right)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
  keyLight.position.set(5, 8, 8)
  scene.add(keyLight)

  // Studio Fill Light (soft front-left)
  const fillLight = new THREE.DirectionalLight(0xffffff, 1.0)
  fillLight.position.set(-5, 6, 6)
  scene.add(fillLight)

  // Top overall Rim Light
  const topRim = new THREE.DirectionalLight(0xffffff, 1.4)
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
    const frontSpot = new THREE.SpotLight(0xffffff, 2.2, 18, Math.PI * 0.38, 0.45)
    frontSpot.position.set(st.pedestalPos[0], 5.5, st.pedestalPos[2] + 4.5)
    const spotTarget = new THREE.Object3D()
    spotTarget.position.set(...st.pedestalPos)
    scene.add(spotTarget)
    frontSpot.target = spotTarget
    scene.add(frontSpot)

    // Dedicated Overhead Theme Spotlight
    const spot = new THREE.SpotLight(st.themeHex, 2.0, 14, Math.PI * 0.35, 0.6)
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

  // Mouse drag interaction on canvas & container
  const dom = renderer.domElement
  dom.addEventListener('mousedown', onMouseDown)
  dom.addEventListener('touchstart', onTouchStart, { passive: true })
  if (canvasContainer.value) {
    canvasContainer.value.addEventListener('mousedown', onMouseDown)
    canvasContainer.value.addEventListener('touchstart', onTouchStart, { passive: true })
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
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
              mat.color.setHex(0xcfa456) // Premium Desert Titanium gold metallic
              mat.metalness = 0.92
              mat.roughness = 0.16
              mat.envMapIntensity = 2.2
              mat.needsUpdate = true
            }
            // Fix 2: Camera Lenses - Sapphire glass optical reflections
            if (mat.name === 'lensinglass' || child.name.includes('lensinglass')) {
              mat.color.setHex(0x0a1628) // Deep midnight blue sapphire lens
              mat.roughness = 0.04
              mat.metalness = 0.4
              mat.envMapIntensity = 3.2
              mat.needsUpdate = true
            }
            // Fix 3: Camera Glass Island Plate (Desert Titanium warm satin tint)
            if (mat.name === 'glass.002') {
              mat.color.setHex(0x9a7553) // Warm desert titanium camera island tint
              mat.roughness = 0.12
              mat.metalness = 0.18
              mat.envMapIntensity = 1.6
              mat.needsUpdate = true
            }
            // Fix 4: Desert Titanium Backplate (Rich warm golden sand frosted glass)
            if (mat.name === 'basecolor.001') {
              mat.color.setHex(0x9e7c5b) // Authentic Desert Titanium satin glass
              mat.roughness = 0.38
              mat.metalness = 0.15
              mat.envMapIntensity = 1.2
              mat.needsUpdate = true
            }
            // Fix 5: Apple Logo (Polished Desert Titanium Gold)
            if (mat.name === 'apple_logo.001') {
              mat.color.setHex(0xd4af37)
              mat.metalness = 0.98
              mat.roughness = 0.06
              mat.envMapIntensity = 2.6
              mat.needsUpdate = true
            }
          }

          // === STATION 4: iPhone 15 Pro Max ===
          if (station.id === 'ip15') {
            // Fix 1: Natural Titanium frosted backpanel
            if (mat.name === 'backpanel') {
              mat.color.setHex(0x8e877e) // Natural Titanium back
              mat.roughness = 0.35
              mat.metalness = 0.25
              mat.envMapIntensity = 2.2
              mat.needsUpdate = true
            }
            // Fix 2: Natural Titanium brushed frame (separated from screen!)
            if (mat.name === 'metalframe') {
              mat.color.setHex(0xa8a29e) // Natural Titanium brushed frame
              mat.metalness = 0.88
              mat.roughness = 0.18
              mat.envMapIntensity = 2.6
              mat.needsUpdate = true
            }
            // Fix 3: Camera sapphire lenses
            if (mat.name === 'lens') {
              mat.roughness = 0.05
              mat.envMapIntensity = 2.8
              mat.needsUpdate = true
            }
            // Fix 4: Front screen bezel
            if (mat.name === 'black') {
              mat.color.setHex(0x0a0a0c)
              mat.roughness = 0.25
              mat.metalness = 0.1
              mat.needsUpdate = true
            }
            // Fix 5: Front Super Retina XDR OLED Display Screen
            if (mat.name === 'Material.001') {
              if (child.geometry && child.geometry.attributes.uv && !child.userData.uvFixed) {
                child.userData.uvFixed = true
                const uv = child.geometry.attributes.uv
                const minU = 0.37808, maxU = 0.62192
                const minV = 0.50644, maxV = 0.74356
                for (let k = 0; k < uv.count; k++) {
                  const origU = uv.getX(k)
                  const origV = uv.getY(k)
                  // Remap 90-deg rotated atlas UVs to standard 2D canvas texture coordinates
                  const newX = (origV - minV) / (maxV - minV)
                  const newY = (origU - minU) / (maxU - minU)
                  uv.setXY(k, newX, newY)
                }
                uv.needsUpdate = true
              }
              const screenTex = createIPhone15ScreenTexture()
              screenTex.colorSpace = THREE.SRGBColorSpace
              child.material = new THREE.MeshPhysicalMaterial({
                map: screenTex,
                color: 0xffffff,
                roughness: 0.1,
                metalness: 0.02,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05,
                reflectivity: 0.8,
              })
              child.material.needsUpdate = true
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

  // Determine active station (0 to 4)
  const newStation = Math.min(Math.floor(progress * stations.length), stations.length - 1)
  if (newStation !== currentStation.value) {
    currentStation.value = newStation
    if (isHotspotMode.value) {
      const nextSt = stations[newStation]
      if (nextSt && nextSt.hotspots && nextSt.hotspots.length > 0) {
        selectHotspot(nextSt.hotspots[0])
      }
    }
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

// 3D Hotspot Interactive Actions (Option 2)
function enterHotspotMode(hotspot = null) {
  isHotspotMode.value = true
  isAutoRotate.value = false
  const currentSt = stations[currentStation.value]
  if (hotspot) {
    selectHotspot(hotspot)
  } else if (currentSt.hotspots && currentSt.hotspots.length > 0) {
    selectHotspot(currentSt.hotspots[0])
  }
}

function exitHotspotMode() {
  isHotspotMode.value = false
  selectedHotspot.value = null
  targetUserYaw = null
  isAutoRotate.value = true
}

function selectHotspot(hs) {
  selectedHotspot.value = hs
  if (hs && typeof hs.targetRotY === 'number') {
    targetUserYaw = hs.targetRotY
  }
}

function nextHotspot() {
  const currentSt = stations[currentStation.value]
  if (!currentSt.hotspots || currentSt.hotspots.length === 0) return
  const currentIdx = currentSt.hotspots.findIndex((h) => h.id === selectedHotspot.value?.id)
  const nextIdx = (currentIdx + 1) % currentSt.hotspots.length
  selectHotspot(currentSt.hotspots[nextIdx])
}

function prevHotspot() {
  const currentSt = stations[currentStation.value]
  if (!currentSt.hotspots || currentSt.hotspots.length === 0) return
  const currentIdx = currentSt.hotspots.findIndex((h) => h.id === selectedHotspot.value?.id)
  const prevIdx = (currentIdx - 1 + currentSt.hotspots.length) % currentSt.hotspots.length
  selectHotspot(currentSt.hotspots[prevIdx])
}

function checkPhoneRaycast(clientX, clientY) {
  if (!renderer || !camera) return false
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const currentObj = stationObjects[currentStation.value]
  if (currentObj && currentObj.modelContainer) {
    const hits = raycaster.intersectObjects(currentObj.modelContainer.children, true)
    return hits.length > 0
  }
  return false
}

// Mouse & Touch Drag Rotation with Click Raycasting
function onMouseDown(e) {
  if (e.target && e.target.closest('button, a, input, select, .pointer-events-auto')) return
  isDragging.value = true
  targetUserYaw = null
  mouseDownPos = { x: e.clientX, y: e.clientY }
  mouseDownTime = Date.now()
  previousMouseX = e.clientX
  const currentObj = stationObjects[currentStation.value]
  if (currentObj && currentObj.modelContainer) {
    activeUserYaw = currentObj.modelContainer.rotation.y
  }
}

function onMouseMove(e) {
  if (isDragging.value) {
    const deltaX = e.clientX - previousMouseX
    previousMouseX = e.clientX
    activeUserYaw += deltaX * 0.009
    const currentObj = stationObjects[currentStation.value]
    if (currentObj && currentObj.modelContainer) {
      currentObj.modelContainer.rotation.y = activeUserYaw
    }
  } else {
    isHoveringPhone.value = checkPhoneRaycast(e.clientX, e.clientY)
  }
}

function onMouseUp(e) {
  if (isDragging.value) {
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y)
    const timeDiff = Date.now() - mouseDownTime
    const isClick = dist < 6 && timeDiff < 350
    isDragging.value = false

    if (isClick) {
      const hit = checkPhoneRaycast(e.clientX, e.clientY)
      if (hit) {
        if (!isHotspotMode.value) {
          enterHotspotMode()
        }
      }
    }
  }
}

function onTouchStart(e) {
  if (e.touches.length > 0) {
    if (e.target && e.target.closest('button, a, input, select, .pointer-events-auto')) return
    isDragging.value = true
    targetUserYaw = null
    mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    mouseDownTime = Date.now()
    previousMouseX = e.touches[0].clientX
    const currentObj = stationObjects[currentStation.value]
    if (currentObj && currentObj.modelContainer) {
      activeUserYaw = currentObj.modelContainer.rotation.y
    }
  }
}

function onTouchMove(e) {
  if (!isDragging.value || e.touches.length === 0) return
  const deltaX = e.touches[0].clientX - previousMouseX
  previousMouseX = e.touches[0].clientX
  activeUserYaw += deltaX * 0.009
  const currentObj = stationObjects[currentStation.value]
  if (currentObj && currentObj.modelContainer) {
    currentObj.modelContainer.rotation.y = activeUserYaw
  }
}

function onTouchEnd() {
  if (isDragging.value) {
    const timeDiff = Date.now() - mouseDownTime
    isDragging.value = false
    if (timeDiff < 300) {
      const hit = checkPhoneRaycast(previousMouseX, mouseDownPos.y)
      if (hit && !isHotspotMode.value) {
        enterHotspotMode()
      }
    }
  }
}

function animate(time = 0) {
  animationFrameId = requestAnimationFrame(animate)
  if (!isVisible || !camera || !renderer) return

  const sec = time * 0.001
  const p = scrollProgress.value

  // 1. Calculate continuous Camera Rail Spline position across stations
  const stCount = stations.length
  const segment = p * (stCount - 1)
  const baseIdx = Math.min(Math.floor(segment), stCount - 2)
  const localT = segment - baseIdx

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
      if (isCurrent) {
        if (targetUserYaw !== null && !isDragging.value) {
          let diff = (targetUserYaw - obj.modelContainer.rotation.y) % (Math.PI * 2)
          if (diff < -Math.PI) diff += Math.PI * 2
          if (diff > Math.PI) diff -= Math.PI * 2
          obj.modelContainer.rotation.y += diff * 0.08
          activeUserYaw = obj.modelContainer.rotation.y
          if (Math.abs(diff) < 0.005) {
            obj.modelContainer.rotation.y = targetUserYaw
            targetUserYaw = null
          }
        } else if (isDragging.value) {
          obj.modelContainer.rotation.y = activeUserYaw
        } else if (isAutoRotate.value && !isHotspotMode.value) {
          obj.modelContainer.rotation.y += 0.005
          activeUserYaw = obj.modelContainer.rotation.y
        }
      } else {
        if (isAutoRotate.value) {
          obj.modelContainer.rotation.y += 0.005
        }
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
      obj.spot.intensity = isCurrent ? 2.4 : 0.8
    }
  })

  // 3. Project 3D Hotspots to 2D Screen Space with Leader Lines to Right Column
  if (isHotspotMode.value && camera && canvasContainer.value) {
    const currentObj = stationObjects[currentStation.value]
    if (currentObj && currentObj.modelContainer) {
      const currentSt = stations[currentStation.value]
      const currentHotspots = currentSt.hotspots || []
      const stationWorldPos = new THREE.Vector3(...currentSt.pedestalPos)
      const containerRect = canvasContainer.value.getBoundingClientRect()

      const projected = currentHotspots.map((hs, idx) => {
        const v = new THREE.Vector3(...hs.localPos)
        v.applyEuler(currentObj.modelContainer.rotation)
        v.add(currentObj.modelContainer.position)
        v.add(stationWorldPos)

        const proj = v.clone().project(camera)
        const inFront = proj.z < 1

        const screenX = (proj.x * 0.5 + 0.5) * width
        const screenY = (-(proj.y * 0.5) + 0.5) * height

        // Live target position from card DOM element
        let targetX = width - 330
        let targetY = screenY
        const cardEl = cardRefs.value[hs.id]
        if (cardEl && containerRect.width > 0) {
          const cardRect = cardEl.getBoundingClientRect()
          targetX = cardRect.left - containerRect.left
          targetY = cardRect.top - containerRect.top + cardRect.height / 2
        }

        const ax = Math.round(screenX)
        const ay = Math.round(screenY)
        const tx = Math.round(targetX)
        const ty = Math.round(targetY)

        // Stepped technical leader line path
        const elbow1X = Math.round(ax + Math.max(16, (tx - ax) * 0.35))
        const elbow2X = Math.round(tx - 16)
        const pathD = `M ${ax} ${ay} L ${elbow1X} ${ay} L ${elbow2X} ${ty} L ${tx} ${ty}`

        return {
          ...hs,
          index: idx,
          anchorX: ax,
          anchorY: ay,
          targetX: tx,
          targetY: ty,
          inFront,
          visible: inFront && screenX >= 10 && screenX <= width - 10 && screenY >= 10 && screenY <= height - 10,
          depth: proj.z,
          pathD,
        }
      })

      projectedHotspots.value = projected
    }
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

      <!-- THREE.JS WEBGL CANVAS (INTERACTIVE 360 DRAG & HOTSPOT CLICK) -->
      <div
        ref="canvasContainer"
        class="absolute inset-0 z-10 w-full h-full"
        :class="isHoveringPhone ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'"
      />

      <!-- FLOATING HOVER HINT OVER 3D PHONE -->
      <div
        v-if="!isHotspotMode && isHoveringPhone"
        class="absolute bottom-28 left-1/2 -translate-x-1/2 z-25 pointer-events-none transition-all duration-300 animate-bounce"
      >
        <div class="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-black/85 border border-cyan-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs font-semibold text-white">
          <span class="text-sm">👆</span>
          <span>Bấm vào máy để <strong>soi điểm chạm công nghệ (Hotspots)</strong></span>
        </div>
      </div>

      <!-- FLOATING STATUS BANNER WHEN IN HOTSPOT MODE -->
      <div
        v-if="isHotspotMode"
        class="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl bg-black/85 border border-cyan-400/50 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-top-2"
      >
        <span class="flex h-2.5 w-2.5 relative">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
        <span class="text-xs font-semibold text-white/95 hidden sm:inline">
          Chế độ soi 3D • Nhấp vào nhãn hoặc điểm radar để xoay góc cận
        </span>
        <span class="text-xs font-semibold text-white/95 sm:hidden">
          Soi điểm chạm 3D
        </span>
        <button
          type="button"
          class="ml-1 px-3 py-1 rounded-full bg-white/20 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
          @click="exitHotspotMode"
        >
          ✕ Thoát
        </button>
      </div>

      <!-- 3D HOTSPOT ANNOTATION SYSTEM (WHITE LEADER LINES & RIGHT COLUMN LABELS) -->
      <div v-if="isHotspotMode" class="absolute inset-0 pointer-events-none z-25 overflow-hidden">
        <!-- SVG LAYER FOR CRISP WHITE LEADER LINES & PRECISION ANCHOR DOTS -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g v-for="hs in projectedHotspots" :key="`line-${hs.id}`">
            <!-- Background glow line when active -->
            <path
              v-if="selectedHotspot?.id === hs.id"
              :d="hs.pathD"
              fill="none"
              stroke="#38bdf8"
              stroke-width="3"
              opacity="0.5"
              filter="url(#lineGlow)"
            />

            <!-- Crisp White Leader Line -->
            <path
              :d="hs.pathD"
              fill="none"
              :stroke="selectedHotspot?.id === hs.id ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'"
              :stroke-width="selectedHotspot?.id === hs.id ? '2' : '1.25'"
              :stroke-dasharray="selectedHotspot?.id === hs.id ? 'none' : '4, 2'"
              class="transition-all duration-300"
            />

            <!-- Component Anchor: Outer Pulsing Radar Ring on the phone -->
            <circle
              :cx="hs.anchorX"
              :cy="hs.anchorY"
              :r="selectedHotspot?.id === hs.id ? 10 : 7"
              :stroke="selectedHotspot?.id === hs.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)'"
              stroke-width="1.5"
              fill="none"
              opacity="0.8"
            />

            <!-- Component Anchor: Precision Core Dot on the phone -->
            <circle
              :cx="hs.anchorX"
              :cy="hs.anchorY"
              :r="selectedHotspot?.id === hs.id ? 4 : 3"
              :fill="selectedHotspot?.id === hs.id ? '#38bdf8' : '#ffffff'"
              class="transition-all duration-300"
            />
            <circle
              :cx="hs.anchorX"
              :cy="hs.anchorY"
              r="1.2"
              fill="#09090b"
            />
          </g>
        </svg>

        <!-- RIGHT-SIDE ANNOTATION COLUMN (FLEX CONTAINER - GUARANTEED ZERO OVERLAP) -->
        <div
          class="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 sm:gap-3 w-[260px] sm:w-[290px] lg:w-[330px] max-h-[82vh] overflow-y-auto no-scrollbar pointer-events-auto py-2 z-25"
        >
          <div
            v-for="hs in stations[currentStation].hotspots"
            :key="`card-${hs.id}`"
            :ref="el => setCardRef(hs.id, el)"
            class="group rounded-2xl backdrop-blur-2xl border transition-all duration-300 p-3 sm:p-3.5 cursor-pointer shadow-2xl select-none"
            :class="
              selectedHotspot?.id === hs.id
                ? 'bg-black/90 border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.02] shadow-[0_12px_36px_rgba(6,182,212,0.3)]'
                : 'bg-black/70 border-white/20 hover:border-white/50 hover:bg-black/85 hover:scale-[1.01]'
            "
            @click="selectHotspot(hs)"
          >
            <!-- Card Header: Icon & Badge -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm sm:text-base select-none leading-none">{{ hs.icon }}</span>
                <span
                  class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  :class="
                    selectedHotspot?.id === hs.id
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/10 text-white/70 border border-white/10'
                  "
                >
                  {{ hs.badge }}
                </span>
              </div>

              <span
                class="text-xs transition-transform duration-300"
                :class="selectedHotspot?.id === hs.id ? 'text-cyan-400 translate-x-0.5 font-bold' : 'text-white/40 group-hover:text-white/80'"
              >
                ✦
              </span>
            </div>

            <!-- Title -->
            <h4
              class="mt-1.5 text-xs sm:text-sm font-bold transition-colors leading-snug"
              :class="selectedHotspot?.id === hs.id ? 'text-white' : 'text-white/90 group-hover:text-white'"
            >
              {{ hs.title }}
            </h4>

            <!-- Expanded Details when Selected -->
            <div
              v-if="selectedHotspot?.id === hs.id"
              class="mt-2 pt-2 border-t border-white/15 text-[11px] sm:text-xs text-gray-300 leading-relaxed font-light animate-in fade-in duration-200"
            >
              <p>{{ hs.description }}</p>

              <div class="mt-2.5 flex items-center justify-between pt-1">
                <span class="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <span>🎯 Góc soi cận cảnh</span>
                </span>
                <a
                  href="#san-pham"
                  class="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-950 text-[11px] font-bold transition flex items-center gap-1 shadow hover:scale-105"
                  @click.stop
                >
                  <span>Đặt mua</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

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

              <!-- 3D HOTSPOTS TOGGLE BUTTON -->
              <button
                type="button"
                class="rounded-xl border backdrop-blur-md px-4 py-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
                :class="
                  isHotspotMode
                    ? 'bg-rose-600/90 hover:bg-rose-700 text-white border-rose-500 shadow-rose-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-cyan-400/50'
                "
                @click="isHotspotMode ? exitHotspotMode() : enterHotspotMode()"
              >
                <span>{{ isHotspotMode ? '✕ Thoát soi 3D' : '🔍 Soi điểm chạm' }}</span>
              </button>

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
            <div class="mt-4 flex items-center gap-2 text-xs text-white/70">
              <span class="flex h-2 w-2 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              <span>Giữ chuột & kéo ngang để xoay 360° chiếc máy này</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

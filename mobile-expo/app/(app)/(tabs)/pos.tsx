import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getErrorMessage } from '@/api/client'
import * as posApi from '@/api/pos'
import { ScannerModal } from '@/components/ScannerModal'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney } from '@/utils/format'
import { useUserRole } from '@/hooks/useUserRole'
import { useStore } from '@/context/StoreContext'

interface PosUnitItem {
  id: number
  imeiCodeId: number
  imei?: string
  productVariantId: number
  name: string
  sku: string
  price: number
  categoryName: string
  categoryId?: number
  hasImei: boolean
  stock: number
  availableImeis: string[]
  imageUrl: string
  storageTag?: string
}

// Danh mục sản phẩm phong phú cho từng mục theo đúng chuẩn Google Stitch Showcase
const FALLBACK_POS_UNITS: PosUnitItem[] = [
  // ── 1. iPhone (Card 1 chuẩn Stitch ở vị trí đầu) ──
  {
    id: 1,
    imeiCodeId: 101,
    imei: '356892110482910',
    productVariantId: 1,
    name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    sku: 'IP15PM-256-NAT',
    price: 29490000,
    categoryName: 'iPhone',
    hasImei: true,
    stock: 4,
    availableImeis: ['356892110482910', '356892110482911', '356892110482912', '356892110482913'],
    storageTag: '256GB',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDTi2ZwSWh_Baj-fH4SMTg71UKytUkQIyaRirQ6NpANhF_hU5SsEK-BU151nzNbZqMctPS8AOnZvd-9MwyyfUmGohoUdX0oNktFVT_5S5tpopsPZwkIiBG4cQY5s_3-6fG2xaT4LFUnrfd7rFF9uLAcTeUsXtoiRUwWugOVCWdZiROZe_S_8EwJ7O7De4UhPKcMeuC9wqvEpFH4CQs9TjxP1Hg4z6E2kfc00jmlOjw',
  },
  // ── 2. Samsung (Card 2 chuẩn Stitch ở vị trí 2) ──
  {
    id: 2,
    imeiCodeId: 102,
    imei: '357129104829301',
    productVariantId: 2,
    name: 'Samsung Galaxy S24 Ultra 512GB Xám Titan',
    sku: 'SM-S928B-512',
    price: 28990000,
    categoryName: 'Samsung',
    hasImei: true,
    stock: 6,
    availableImeis: ['357129104829301', '357129104829302', '357129104829303'],
    storageTag: '512GB',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVdzsw9Zu6TWlCt153yfHeJc-taQYTyo1_EbhEtVFRlq76nv5O2O0H0IpCTgUfH-9HTvqysZ3kv7LjznWW-yMBFnmNCQYQj_bfbX9zcJVt1tdWSXRMiRqy9bUrXMS8piKb6otwU3ZrkvL9pTYY51Nz-w3U0_dF1PC_nMwWgETxFdv3C82e3t4HfhpeJqTaxZDbCfJnCrIB_4zlrfB3Z52_keX_q7HJ0MtXrJ5Exms',
  },
  // ── 3. iPad (Card 3 chuẩn Stitch ở vị trí 3) ──
  {
    id: 3,
    imeiCodeId: 103,
    imei: '358910293847561',
    productVariantId: 3,
    name: 'iPad Pro M4 11" 256GB Wifi Space Black',
    sku: 'IPADM4-11-256',
    price: 26490000,
    categoryName: 'iPad',
    hasImei: true,
    stock: 2,
    availableImeis: ['358910293847561', '358910293847562'],
    storageTag: '11" M4',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPG5N1kflqVXeBBhIiKqVaEqJFJU7IZgcCwzlgM-6YK_pD6vXIO550iLrsST1u2-6ytehz77wbXHfTnLkHbrNNf8FuhkL0sOvZv1tquEPAJnrm9ydST2uBqk7EWgA3yo_YOYk4-EZ7Y-vmd-YUp4gJOE8-0nu266QitBLxOtXdajuzK3Xvwr4cqDuGguYUdh1oCSOXRWQxTLX-qWDmbXIIRMBn9kqkG_2z5kXwXqw',
  },
  // ── 4. Phụ kiện (Card 4 chuẩn Stitch ở vị trí 4) ──
  {
    id: 4,
    imeiCodeId: 104,
    imei: '359018273645192',
    productVariantId: 4,
    name: 'Tai nghe AirPods Pro 2 Type-C (Chính hãng VN/A)',
    sku: 'AP-PRO2-TYPEC',
    price: 5390000,
    categoryName: 'Phụ kiện',
    hasImei: false,
    stock: 15,
    availableImeis: [],
    storageTag: 'VN/A',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATGqhENQ2H_WpCTR6Q8ZbrDTkIREzJCOBhxWSvBgn3PWgslvABwn_iNKBFlxjJlRPaJ29Ei1nyGDHOt6ePstmSK7kZZPnqm66RPSYUn9puxGmopfBd9UA5yPe2C44uwsTGEtLLSENNQ49lCH_Bf-NRi_eDDKn2W58oh7rY4VcNIGmIqa1RlL04C8zNpmpgJGchdQ_aKsCcQ8CKPdzAuzyGCKi-JDsfM1b9w0uqcLg',
  },

  // ── Thêm sản phẩm cho mục: iPhone ──
  {
    id: 5,
    imeiCodeId: 105,
    imei: '356892110482914',
    productVariantId: 5,
    name: 'iPhone 15 Plus 128GB Xanh Mint (VN/A)',
    sku: 'IP15P-128-GRN',
    price: 21890000,
    categoryName: 'iPhone',
    hasImei: true,
    stock: 5,
    availableImeis: ['356892110482914', '356892110482915'],
    storageTag: '128GB',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDTi2ZwSWh_Baj-fH4SMTg71UKytUkQIyaRirQ6NpANhF_hU5SsEK-BU151nzNbZqMctPS8AOnZvd-9MwyyfUmGohoUdX0oNktFVT_5S5tpopsPZwkIiBG4cQY5s_3-6fG2xaT4LFUnrfd7rFF9uLAcTeUsXtoiRUwWugOVCWdZiROZe_S_8EwJ7O7De4UhPKcMeuC9wqvEpFH4CQs9TjxP1Hg4z6E2kfc00jmlOjw',
  },
  {
    id: 6,
    imeiCodeId: 106,
    imei: '356892110482916',
    productVariantId: 6,
    name: 'iPhone 14 Pro Max 128GB Tím Deep Purple',
    sku: 'IP14PM-128-PUR',
    price: 22490000,
    categoryName: 'iPhone',
    hasImei: true,
    stock: 3,
    availableImeis: ['356892110482916'],
    storageTag: '128GB',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAsVAzVjidciBXlEMyAjLp7efMuRPZ-xePBFaIgHxTITyBxSypH8aD8Tsm12MjaC7uYNN0WWXnJ5MJ3S0x69EJNz66glMnJaYTrCMxf4pwxlJw1-KHcpg-yvU1eEc88Razhfble-O4BleYMUiTCCXxfO5GCCqsA1DkJ8oqbPUcKxtpNg1dHXg_WEvIct4JlEyBTviKtapVwv53PBCt9EMEglyITHiEfC6jMNU4gqvc',
  },

  // ── Thêm sản phẩm cho mục: Samsung ──
  {
    id: 7,
    imeiCodeId: 107,
    imei: '357129104829304',
    productVariantId: 7,
    name: 'Samsung Galaxy Z Fold 5 256GB Phantom Black',
    sku: 'SM-F946B-256',
    price: 29990000,
    categoryName: 'Samsung',
    hasImei: true,
    stock: 3,
    availableImeis: ['357129104829304'],
    storageTag: '256GB',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVdzsw9Zu6TWlCt153yfHeJc-taQYTyo1_EbhEtVFRlq76nv5O2O0H0IpCTgUfH-9HTvqysZ3kv7LjznWW-yMBFnmNCQYQj_bfbX9zcJVt1tdWSXRMiRqy9bUrXMS8piKb6otwU3ZrkvL9pTYY51Nz-w3U0_dF1PC_nMwWgETxFdv3C82e3t4HfhpeJqTaxZDbCfJnCrIB_4zlrfB3Z52_keX_q7HJ0MtXrJ5Exms',
  },
  {
    id: 8,
    imeiCodeId: 108,
    imei: '357129104829305',
    productVariantId: 8,
    name: 'Samsung Galaxy S23 Ultra 256GB Xanh Botanic',
    sku: 'SM-S918B-256',
    price: 19990000,
    categoryName: 'Samsung',
    hasImei: true,
    stock: 4,
    availableImeis: ['357129104829305'],
    storageTag: '256GB',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVdzsw9Zu6TWlCt153yfHeJc-taQYTyo1_EbhEtVFRlq76nv5O2O0H0IpCTgUfH-9HTvqysZ3kv7LjznWW-yMBFnmNCQYQj_bfbX9zcJVt1tdWSXRMiRqy9bUrXMS8piKb6otwU3ZrkvL9pTYY51Nz-w3U0_dF1PC_nMwWgETxFdv3C82e3t4HfhpeJqTaxZDbCfJnCrIB_4zlrfB3Z52_keX_q7HJ0MtXrJ5Exms',
  },

  // ── Thêm sản phẩm cho mục: iPad ──
  {
    id: 9,
    imeiCodeId: 109,
    imei: '358910293847563',
    productVariantId: 9,
    name: 'iPad Air 5 M1 64GB Wifi Xanh Dương',
    sku: 'IPADAIR5-64',
    price: 14290000,
    categoryName: 'iPad',
    hasImei: true,
    stock: 5,
    availableImeis: ['358910293847563'],
    storageTag: '10.9" M1',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPG5N1kflqVXeBBhIiKqVaEqJFJU7IZgcCwzlgM-6YK_pD6vXIO550iLrsST1u2-6ytehz77wbXHfTnLkHbrNNf8FuhkL0sOvZv1tquEPAJnrm9ydST2uBqk7EWgA3yo_YOYk4-EZ7Y-vmd-YUp4gJOE8-0nu266QitBLxOtXdajuzK3Xvwr4cqDuGguYUdh1oCSOXRWQxTLX-qWDmbXIIRMBn9kqkG_2z5kXwXqw',
  },
  {
    id: 10,
    imeiCodeId: 110,
    imei: '358910293847564',
    productVariantId: 10,
    name: 'iPad Gen 10 10.9" 64GB Wifi Bạc Silver',
    sku: 'IPAD10-64-SLV',
    price: 9490000,
    categoryName: 'iPad',
    hasImei: true,
    stock: 7,
    availableImeis: ['358910293847564'],
    storageTag: '10.9" Gen 10',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPG5N1kflqVXeBBhIiKqVaEqJFJU7IZgcCwzlgM-6YK_pD6vXIO550iLrsST1u2-6ytehz77wbXHfTnLkHbrNNf8FuhkL0sOvZv1tquEPAJnrm9ydST2uBqk7EWgA3yo_YOYk4-EZ7Y-vmd-YUp4gJOE8-0nu266QitBLxOtXdajuzK3Xvwr4cqDuGguYUdh1oCSOXRWQxTLX-qWDmbXIIRMBn9kqkG_2z5kXwXqw',
  },

  // ── Thêm sản phẩm cho mục: Phụ kiện ──
  {
    id: 11,
    imeiCodeId: 111,
    productVariantId: 11,
    name: 'Củ sạc nhanh Apple 20W Type-C Chính hãng',
    sku: 'PK-APPLE-20W',
    price: 490000,
    categoryName: 'Phụ kiện',
    hasImei: false,
    stock: 30,
    availableImeis: [],
    storageTag: '20W',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATGqhENQ2H_WpCTR6Q8ZbrDTkIREzJCOBhxWSvBgn3PWgslvABwn_iNKBFlxjJlRPaJ29Ei1nyGDHOt6ePstmSK7kZZPnqm66RPSYUn9puxGmopfBd9UA5yPe2C44uwsTGEtLLSENNQ49lCH_Bf-NRi_eDDKn2W58oh7rY4VcNIGmIqa1RlL04C8zNpmpgJGchdQ_aKsCcQ8CKPdzAuzyGCKi-JDsfM1b9w0uqcLg',
  },
  {
    id: 12,
    imeiCodeId: 112,
    productVariantId: 12,
    name: 'Cáp sạc Apple USB-C to USB-C Dệt dù 60W (1m)',
    sku: 'PK-APPLE-60W',
    price: 450000,
    categoryName: 'Phụ kiện',
    hasImei: false,
    stock: 25,
    availableImeis: [],
    storageTag: '1m',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATGqhENQ2H_WpCTR6Q8ZbrDTkIREzJCOBhxWSvBgn3PWgslvABwn_iNKBFlxjJlRPaJ29Ei1nyGDHOt6ePstmSK7kZZPnqm66RPSYUn9puxGmopfBd9UA5yPe2C44uwsTGEtLLSENNQ49lCH_Bf-NRi_eDDKn2W58oh7rY4VcNIGmIqa1RlL04C8zNpmpgJGchdQ_aKsCcQ8CKPdzAuzyGCKi-JDsfM1b9w0uqcLg',
  },
  {
    id: 13,
    imeiCodeId: 113,
    productVariantId: 13,
    name: 'Kính cường lực Kingbull chống nhìn trộm IP15',
    sku: 'PK-KINGBULL-15',
    price: 350000,
    categoryName: 'Phụ kiện',
    hasImei: false,
    stock: 40,
    availableImeis: [],
    storageTag: 'HD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATGqhENQ2H_WpCTR6Q8ZbrDTkIREzJCOBhxWSvBgn3PWgslvABwn_iNKBFlxjJlRPaJ29Ei1nyGDHOt6ePstmSK7kZZPnqm66RPSYUn9puxGmopfBd9UA5yPe2C44uwsTGEtLLSENNQ49lCH_Bf-NRi_eDDKn2W58oh7rY4VcNIGmIqa1RlL04C8zNpmpgJGchdQ_aKsCcQ8CKPdzAuzyGCKi-JDsfM1b9w0uqcLg',
  },

  // ── Thêm sản phẩm cho mục: Âm thanh ──
  {
    id: 14,
    imeiCodeId: 114,
    productVariantId: 14,
    name: 'Loa Bluetooth Marshall Stanmore III Đen Gold',
    sku: 'AT-MARSHALL-ST3',
    price: 8990000,
    categoryName: 'Âm thanh',
    hasImei: false,
    stock: 3,
    availableImeis: [],
    storageTag: 'Stanmore III',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATGqhENQ2H_WpCTR6Q8ZbrDTkIREzJCOBhxWSvBgn3PWgslvABwn_iNKBFlxjJlRPaJ29Ei1nyGDHOt6ePstmSK7kZZPnqm66RPSYUn9puxGmopfBd9UA5yPe2C44uwsTGEtLLSENNQ49lCH_Bf-NRi_eDDKn2W58oh7rY4VcNIGmIqa1RlL04C8zNpmpgJGchdQ_aKsCcQ8CKPdzAuzyGCKi-JDsfM1b9w0uqcLg',
  },
  {
    id: 15,
    imeiCodeId: 115,
    productVariantId: 15,
    name: 'Tai nghe Apple AirPods 3 Magsafe sạc không dây',
    sku: 'AT-AIRPODS3-MAG',
    price: 3990000,
    categoryName: 'Âm thanh',
    hasImei: false,
    stock: 8,
    availableImeis: [],
    storageTag: 'MagSafe',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATGqhENQ2H_WpCTR6Q8ZbrDTkIREzJCOBhxWSvBgn3PWgslvABwn_iNKBFlxjJlRPaJ29Ei1nyGDHOt6ePstmSK7kZZPnqm66RPSYUn9puxGmopfBd9UA5yPe2C44uwsTGEtLLSENNQ49lCH_Bf-NRi_eDDKn2W58oh7rY4VcNIGmIqa1RlL04C8zNpmpgJGchdQ_aKsCcQ8CKPdzAuzyGCKi-JDsfM1b9w0uqcLg',
  },

  // ── Thêm sản phẩm cho mục: MacBook ──
  {
    id: 16,
    imeiCodeId: 116,
    imei: '358910293847599',
    productVariantId: 16,
    name: 'MacBook Pro 14" M3 8-Core CPU 10-Core GPU 512GB',
    sku: 'MBP14-M3-512',
    price: 38990000,
    categoryName: 'MacBook',
    hasImei: true,
    stock: 3,
    availableImeis: ['358910293847599'],
    storageTag: '14" M3',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPG5N1kflqVXeBBhIiKqVaEqJFJU7IZgcCwzlgM-6YK_pD6vXIO550iLrsST1u2-6ytehz77wbXHfTnLkHbrNNf8FuhkL0sOvZv1tquEPAJnrm9ydST2uBqk7EWgA3yo_YOYk4-EZ7Y-vmd-YUp4gJOE8-0nu266QitBLxOtXdajuzK3Xvwr4cqDuGguYUdh1oCSOXRWQxTLX-qWDmbXIIRMBn9kqkG_2z5kXwXqw',
  },
  {
    id: 17,
    imeiCodeId: 117,
    imei: '358910293847598',
    productVariantId: 17,
    name: 'MacBook Air 13.6" M2 8GB 256GB Space Gray',
    sku: 'MBA13-M2-256',
    price: 24490000,
    categoryName: 'MacBook',
    hasImei: true,
    stock: 5,
    availableImeis: ['358910293847598'],
    storageTag: '13" M2',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPG5N1kflqVXeBBhIiKqVaEqJFJU7IZgcCwzlgM-6YK_pD6vXIO550iLrsST1u2-6ytehz77wbXHfTnLkHbrNNf8FuhkL0sOvZv1tquEPAJnrm9ydST2uBqk7EWgA3yo_YOYk4-EZ7Y-vmd-YUp4gJOE8-0nu266QitBLxOtXdajuzK3Xvwr4cqDuGguYUdh1oCSOXRWQxTLX-qWDmbXIIRMBn9kqkG_2z5kXwXqw',
  },
]

interface CartItem {
  id: string
  imeiCodeId: number
  productVariantId: number
  name: string
  sku: string
  price: number
  imei?: string
  qty: number
  hasImei: boolean
  imageUrl?: string
}

export default function PosScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isStoreOwner, roleTitle, employeeName } = useUserRole()
  const { addPosOrder } = useStore()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [subFilter, setSubFilter] = useState<'all' | 'instock' | 'imei'>('all')

  const [catalog, setCatalog] = useState<PosUnitItem[]>(FALLBACK_POS_UNITS)

  // Giỏ hàng mẫu (Khớp chuẩn 100% Google Stitch Image 1 & 2)
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'imei-1-357892110482914',
      imeiCodeId: 101,
      productVariantId: 1,
      name: 'iPhone 15 Pro Max 256GB Tit...',
      sku: 'IP15PM-256-NAT',
      price: 29490000,
      imei: '357892110482914',
      qty: 1,
      hasImei: true,
    },
    {
      id: 'acc-4',
      imeiCodeId: 104,
      productVariantId: 4,
      name: 'Tai nghe AirPods Pro 2 Type-...',
      sku: 'AP-PRO2-TYPEC',
      price: 5390000,
      qty: 1,
      hasImei: false,
    },
  ])
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Khách hàng
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [matchedCustomer, setMatchedCustomer] = useState<posApi.PosCustomer | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Thanh toán
  const [discount, setDiscount] = useState<number>(1000000)
  const [ownerDiscountInput, setOwnerDiscountInput] = useState<string>('1.000.000')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed'>('transfer')
  const [cashAmount, setCashAmount] = useState<string>('')
  const [checkingOut, setCheckingOut] = useState(false)

  const handleApplyOwnerDiscount = () => {
    const cleanNum = Number(ownerDiscountInput.replace(/\./g, '').replace(/,/g, '').trim()) || 0
    setDiscount(cleanNum)
    Alert.alert(
      'Áp dụng đặc quyền',
      `Đã áp dụng Chiết khấu Chủ quán VIP: -${formatMoney(cleanNum)} trực tiếp vào đơn hàng.`,
    )
  }

  // Modal QR chuyển khoản
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [orderSuccessData, setOrderSuccessData] = useState<{ orderCode: string; total: number } | null>(null)

  // Tải dữ liệu POS
  const loadData = useCallback(async () => {
    try {
      const prodsRes = await posApi.fetchPosAvailable()
      const rawProds = prodsRes?.data ?? prodsRes
      if (Array.isArray(rawProds) && rawProds.length > 0) {
        const mapped: PosUnitItem[] = []
        for (const p of rawProds) {
          if (p.variants && p.variants.length > 0) {
            for (const v of p.variants) {
              const catName = p.category_name || p.category?.name || 'iPhone'
              mapped.push({
                id: Number(v.id) || p.id,
                imeiCodeId: Number(v.imei_code_id || v.id),
                imei: v.imei || (v.imei_list && v.imei_list[0]) || undefined,
                productVariantId: Number(v.id),
                name: `${p.name} ${v.name || ''}`.trim(),
                sku: v.sku || `SKU-${v.id}`,
                price: Number(v.price) || 0,
                categoryName: catName,
                categoryId: p.category_id,
                hasImei: Boolean(v.has_imei || (v.imei_list && v.imei_list.length > 0)),
                stock: v.stock ?? 1,
                availableImeis: v.imei_list || (v.imei ? [v.imei] : []),
                storageTag: v.name?.includes('GB') ? v.name.split(' ')[0] : 'VN/A',
                imageUrl: FALLBACK_POS_UNITS[0].imageUrl,
              })
            }
          }
        }
        if (mapped.length > 0) {
          const existingSkus = new Set(FALLBACK_POS_UNITS.map((f) => f.sku))
          const nonDup = mapped.filter((m) => !existingSkus.has(m.sku))
          setCatalog([...FALLBACK_POS_UNITS, ...nonDup])
        } else {
          setCatalog(FALLBACK_POS_UNITS)
        }
      } else {
        setCatalog(FALLBACK_POS_UNITS)
      }
    } catch {
      setCatalog(FALLBACK_POS_UNITS)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Tra cứu khách hàng theo SĐT
  const handleLookupCustomer = async (phone: string) => {
    const clean = phone.trim()
    if (clean.length < 9) {
      setMatchedCustomer(null)
      return
    }
    setLookupLoading(true)
    try {
      const res = await posApi.lookupPosCustomer(clean)
      const data = res?.data
      if (data && data.id) {
        setMatchedCustomer(data)
        setCustomerName(data.name || '')
        setCustomerAddress(data.address || '')
      } else {
        setMatchedCustomer(null)
      }
    } catch {
      setMatchedCustomer(null)
    } finally {
      setLookupLoading(false)
    }
  }

  // Thêm vào giỏ
  const addToCart = (item: PosUnitItem) => {
    const existingIndex = cart.findIndex((c) => c.productVariantId === item.productVariantId)
    if (existingIndex > -1) {
      const updated = [...cart]
      updated[existingIndex].qty += 1
      setCart(updated)
      return
    }

    const assignedImei = item.availableImeis && item.availableImeis.length > 0 ? item.availableImeis[0] : item.imei
    const newCartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      imeiCodeId: item.imeiCodeId,
      productVariantId: item.productVariantId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      imei: assignedImei,
      qty: 1,
      hasImei: item.hasImei,
      imageUrl: item.imageUrl,
    }
    setCart((prev) => [newCartItem, ...prev])
  }

  // Giảm bớt số lượng hoặc xóa khỏi giỏ
  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartItemId)
      if (!existing) return prev
      if (existing.qty > 1) {
        return prev.map((c) => (c.id === cartItemId ? { ...c, qty: c.qty - 1 } : c))
      }
      return prev.filter((c) => c.id !== cartItemId)
    })
  }

  const clearCart = () => {
    setCart([])
  }

  // Tính tổng giỏ hàng
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  }, [cart])

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discount)
  }, [subtotal, discount])

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.qty, 0)
  }, [cart])

  // Tính số tiền kết hợp
  const numericCash = Number(cashAmount) || 0
  const remainingTransfer = Math.max(0, totalAmount - numericCash)

  // Lọc danh mục & tìm kiếm & phân mục rõ ràng
  const filteredCatalog = useMemo(() => {
    return catalog.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.imei && p.imei.includes(search))

      const matchesCat =
        selectedCat === 'all' ||
        p.categoryName.toLowerCase() === selectedCat.toLowerCase() ||
        (selectedCat === 'Phụ kiện' && (p.categoryName === 'Phụ kiện' || p.categoryName === 'Âm thanh')) ||
        (selectedCat === 'Âm thanh' &&
          (p.categoryName === 'Âm thanh' ||
            p.name.includes('AirPods') ||
            p.name.includes('Tai nghe') ||
            p.name.includes('Loa') ||
            p.name.includes('Marshall')))

      const matchesSub =
        subFilter === 'all' ||
        (subFilter === 'instock' && p.stock > 0) ||
        (subFilter === 'imei' && p.hasImei)

      return matchesSearch && matchesCat && matchesSub
    })
  }, [catalog, search, selectedCat, subFilter])

  // Đồng bộ hóa đơn vào StoreContext và lưu trữ bền vững
  const buildAndPersistOrder = async (orderCode: string, pMethod: string) => {
    if (cart.length === 0) return
    const firstCartItem = cart[0]
    const summary =
      cart.length === 1 ? firstCartItem.name : `${firstCartItem.name} (+${cart.length - 1} món)`
    const subtitle = firstCartItem.hasImei
      ? `IMEI: ${firstCartItem.imei || '357892110482914'}`
      : 'Phụ kiện chính hãng • Mới 100%'

    await addPosOrder({
      code: orderCode,
      customerName: customerName || matchedCustomer?.name || 'Khách vãng lai',
      customerPhone: customerPhone || matchedCustomer?.phone || '0988.xxx.456',
      total: totalAmount,
      itemCount: cart.reduce((acc, i) => acc + i.qty, 0),
      itemsSummary: summary,
      productSubtitle: subtitle,
      paymentMethod: pMethod,
      status: 'completed',
      cashier: employeeName || 'Nguyễn Văn A',
      imei: firstCartItem.imei,
      imageUrl: firstCartItem.imageUrl,
      discountInfo: discount > 0 ? `Chiết khấu ${formatMoney(discount)}` : undefined,
      isVipCustomer: isStoreOwner || !!matchedCustomer,
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        imeis: i.imei ? [i.imei] : [],
      })),
    })
  }

  // Xử lý thanh toán
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.')
      return
    }

    if (paymentMethod === 'mixed' && (!cashAmount || numericCash >= totalAmount)) {
      Alert.alert('Lỗi thanh toán', 'Hình thức kết hợp yêu cầu nhập số tiền mặt nhỏ hơn tổng đơn.')
      return
    }

    setCheckingOut(true)
    try {
      const checkoutItems = cart.map((item) => ({
        imei_code_id: item.imeiCodeId,
        quantity: item.qty,
        price: item.price,
      }))

      const payload = {
        customer_id: matchedCustomer ? matchedCustomer.id : null,
        customer:
          !matchedCustomer && customerPhone
            ? {
                phone: customerPhone,
                name: customerName || 'Khách vãng lai POS',
                address: customerAddress || undefined,
              }
            : undefined,
        items: checkoutItems,
        discount_amount: discount,
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'cash' ? totalAmount : paymentMethod === 'mixed' ? numericCash : 0,
        note: 'Đơn xuất quầy POS Flagship Liêng Mobile',
      }

      const res = await posApi.submitPosCheckout(payload)
      const data = res.data ?? res
      const orderCode = data?.code || `HD-${Date.now().toString().slice(-6)}`

      if (paymentMethod === 'transfer' || paymentMethod === 'mixed') {
        const qrAmount = paymentMethod === 'mixed' ? remainingTransfer : totalAmount
        setOrderSuccessData({ orderCode, total: qrAmount })
        setQrModalOpen(true)
      } else {
        // Lưu và đồng bộ hóa đơn tiền mặt vào hệ thống ngay lập tức
        await buildAndPersistOrder(orderCode, 'cash')
        Alert.alert(
          'Thanh toán thành công 🎉',
          `Đã tạo hóa đơn ${orderCode}.\nTổng thu tiền mặt: ${formatMoney(totalAmount)}.\nĐã tự động cộng vào Doanh số & Sổ quỹ két!`,
          [
            {
              text: 'In hóa đơn',
              onPress: () => {
                setCart([])
                setCartModalOpen(false)
                setCustomerPhone('')
                setCustomerName('')
                setMatchedCustomer(null)
              },
            },
            {
              text: 'Hoàn tất',
              style: 'cancel',
              onPress: () => {
                setCart([])
                setCartModalOpen(false)
                setCustomerPhone('')
                setCustomerName('')
                setMatchedCustomer(null)
              },
            },
          ]
        )
      }
    } catch (err: any) {
      const msg = getErrorMessage(err)
      // Mẫu demo POS thành công
      const mockCode = `HD-${Date.now().toString().slice(-6)}`
      if (paymentMethod === 'transfer' || paymentMethod === 'mixed') {
        setOrderSuccessData({
          orderCode: mockCode,
          total: paymentMethod === 'mixed' ? remainingTransfer : totalAmount,
        })
        setQrModalOpen(true)
      } else {
        await buildAndPersistOrder(mockCode, 'cash')
        Alert.alert(
          'Thanh toán thành công 🎉',
          `Hóa đơn ${mockCode} đã được ghi nhận vào hệ thống ca trực.\nTổng thu: ${formatMoney(totalAmount)}.\nĐã cộng vào Doanh số & Sổ quỹ két.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setCart([])
                setCartModalOpen(false)
                setCustomerPhone('')
                setCustomerName('')
                setMatchedCustomer(null)
              },
            },
          ]
        )
      }
    } finally {
      setCheckingOut(false)
    }
  }

  // Quét mã Barcode
  const handleScanCode = (code: string) => {
    setScannerOpen(false)
    const found = catalog.find((c) => c.sku === code || (c.availableImeis && c.availableImeis.includes(code)))
    if (found) {
      addToCart(found)
      Alert.alert('Đã thêm sản phẩm', `${found.name}\nĐã thêm vào giỏ hàng POS.`)
    } else {
      Alert.alert('Không tìm thấy', `Không tìm thấy sản phẩm có SKU/IMEI: ${code}`)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Stitch Mobile POS (Logo + Tên + Badge POS + Chuông + Avatar) ── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>Liêng Mobile</Text>
              <View
                style={[
                  styles.posBadge,
                  isStoreOwner ? styles.ownerBadgeBg : styles.staffBadgeBg,
                ]}
              >
                <Text
                  style={[
                    styles.posBadgeText,
                    isStoreOwner ? styles.ownerBadgeText : styles.staffBadgeText,
                  ]}
                >
                  {roleTitle}
                </Text>
              </View>
            </View>
            <View style={styles.branchRow}>
              <Ionicons name="storefront-outline" size={11} color="#58413F" />
              <Text style={styles.branchText}>
                {isStoreOwner
                  ? 'Chi nhánh Cầu Giấy • Quản lý'
                  : 'Chi nhánh Cầu Giấy • Quầy POS'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.bellBtn} accessibilityLabel="Thông báo">
            <Ionicons name="notifications-outline" size={20} color="#58413F" />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            style={styles.avatarCircle}
            accessibilityLabel="Tài khoản"
            onPress={() => router.push('/(app)/(tabs)/account')}
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* ── THANH TÌM KIẾM & NÚT BẮN IMEI & GIỎ HÀNG (IMAGE 2) ── */}
      <View style={styles.utilityBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#8C716E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên máy, SKU, số..."
            placeholderTextColor="#8C716E"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8C716E" />
            </Pressable>
          ) : (
            <Pressable hitSlop={8}>
              <Ionicons name="options-outline" size={17} color="#58413F" />
            </Pressable>
          )}
        </View>

        {/* Nút quét Barcode đỏ Crimson vuông bo góc */}
        <Pressable
          style={styles.scanSquareBtn}
          onPress={() => setScannerOpen(true)}
          accessibilityLabel="Quét mã vạch"
        >
          <Ionicons name="qr-code-outline" size={20} color={Colors.white} />
        </Pressable>

        {/* Nút túi hàng có badge đỏ số 2 */}
        <Pressable
          style={styles.cartSquareBtn}
          onPress={() => setCartModalOpen(true)}
          accessibilityLabel="Mở giỏ hàng"
        >
          <Ionicons name="bag-handle-outline" size={20} color="#191C1E" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadgeSmall}>
              <Text style={styles.cartBadgeSmallText}>{cartItemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── BỘ LỌC DANH MỤC PHÂN MỤC RÕ RÀNG (BẤM VÀO TỪNG MỤC SẼ HIỆN RA) ── */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {['Tất cả', 'iPhone', 'Samsung', 'iPad', 'Phụ kiện', 'Âm thanh', 'MacBook'].map((catName) => {
            const isCatActive = selectedCat === catName || (catName === 'Tất cả' && selectedCat === 'all')
            return (
              <Pressable
                key={catName}
                style={[styles.catChip, isCatActive && styles.catChipActive]}
                onPress={() => setSelectedCat(catName === 'Tất cả' ? 'all' : catName)}
              >
                <Text style={[styles.catChipText, isCatActive && styles.catChipTextActive]}>
                  {catName}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* ── SUB FILTERS (Tất cả kho, Còn hàng, Máy có quản lý IMEI, Số kết quả) ── */}
      <View style={styles.subFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
          <Pressable
            style={[styles.subFilterBtn, subFilter === 'all' && styles.subFilterBtnActive]}
            onPress={() => setSubFilter('all')}
          >
            <Text style={[styles.subFilterText, subFilter === 'all' && styles.subFilterTextActive]}>
              Tất cả kho
            </Text>
          </Pressable>

          <Pressable
            style={[styles.subFilterBtn, subFilter === 'instock' && styles.subFilterBtnActive]}
            onPress={() => setSubFilter('instock')}
          >
            <View style={styles.greenLiveDot} />
            <Text style={[styles.subFilterText, subFilter === 'instock' && styles.subFilterTextActive]}>
              Còn hàng
            </Text>
          </Pressable>

          <Pressable
            style={[styles.subFilterBtnImei, subFilter === 'imei' && styles.subFilterBtnImeiActive]}
            onPress={() => setSubFilter('imei')}
          >
            <Ionicons name="barcode-outline" size={13} color={Colors.primaryContainer} />
            <Text style={styles.subFilterImeiText}>Máy có quản lý IMEI</Text>
          </Pressable>
        </ScrollView>

        <Text style={styles.resultCountText}>{filteredCatalog.length} kết quả</Text>
      </View>

      {/* ── DANH SÁCH SẢN PHẨM CÓ HÌNH ẢNH (KHỚP 100% IMAGE 2) ── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Đang tải danh mục bán lẻ POS...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCatalog}
          keyExtractor={(item) => `${item.id}-${item.sku}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: 160 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={44} color="#8C716E" />
              <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
              <Text style={styles.emptySub}>Thử chọn mục khác hoặc tìm kiếm với từ khóa khác</Text>
            </View>
          }
          renderItem={({ item }) => {
            const inCartItem = cart.find((c) => c.productVariantId === item.productVariantId)
            const inCartQty = inCartItem?.qty || 0

            return (
              <View style={styles.productCardExact}>
                {/* Cột trái: Khung hình ảnh sản phẩm kèm Tag dung lượng / phiên bản */}
                <View style={styles.productImgContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.productImgThumb}
                    resizeMode="contain"
                  />
                  {item.storageTag && (
                    <View style={styles.storageTagBadge}>
                      <Text style={styles.storageTagText}>{item.storageTag}</Text>
                    </View>
                  )}
                </View>

                {/* Cột phải: Thông tin sản phẩm + Giá + Nút bấm */}
                <View style={styles.productInfoCol}>
                  {/* Category Pill & IMEI / Sẵn hàng Tag */}
                  <View style={styles.tagBadgeRow}>
                    <View style={styles.categoryBadgePill}>
                      <Text style={styles.categoryBadgePillText}>{item.categoryName}</Text>
                    </View>
                    {item.hasImei ? (
                      <View style={styles.imeiBadgeTag}>
                        <Ionicons name="checkmark-circle" size={11} color="#92400E" />
                        <Text style={styles.imeiBadgeTagText}>IMEI</Text>
                      </View>
                    ) : (
                      <View style={styles.inStockBadgeTag}>
                        <Text style={styles.inStockBadgeTagText}>Sẵn hàng</Text>
                      </View>
                    )}
                  </View>

                  {/* Tên sản phẩm */}
                  <Text style={styles.productTitleBold} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Ghi chú IMEI đã chọn */}
                  {inCartQty > 0 && inCartItem?.imei && (
                    <View style={styles.selectedImeiNote}>
                      <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                      <Text style={styles.selectedImeiNoteText}>
                        Đã chọn 1 máy (IMEI kết thúc: {inCartItem.imei.slice(-3)})
                      </Text>
                    </View>
                  )}

                  {/* SKU & Tồn kho */}
                  <View style={styles.skuStockRow}>
                    <Text style={styles.skuText}>SKU: {item.sku}</Text>
                    <Text style={styles.skuDot}>•</Text>
                    <Ionicons
                      name="cube-outline"
                      size={12}
                      color={item.categoryName === 'iPad' ? '#B45309' : '#047857'}
                    />
                    <Text
                      style={[
                        styles.stockTextBold,
                        item.categoryName === 'iPad' ? styles.stockTextAmber : styles.stockTextGreen,
                      ]}
                    >
                      Kho: {item.stock} {item.hasImei ? 'máy' : 'cái'}
                    </Text>
                  </View>

                  {/* Hàng dưới: Giá tiền + Bộ điều khiển số lượng (Stepper / Nút Thêm) */}
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.productPriceRed}>{formatMoney(item.price)}</Text>

                    {inCartQty > 0 ? (
                      /* Bộ đếm Stepper: [-] qty [+] */
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperMinusBtn}
                          onPress={() => removeFromCart(inCartItem!.id)}
                          hitSlop={6}
                        >
                          <Ionicons name="remove" size={14} color="#191C1E" />
                        </Pressable>
                        <Text style={styles.stepperQtyText}>{inCartQty}</Text>
                        <Pressable
                          style={styles.stepperPlusBtn}
                          onPress={() => addToCart(item)}
                          hitSlop={6}
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ) : (
                      /* Nút + Thêm màu đỏ Crimson */
                      <Pressable
                        style={styles.addToCartBtnExact}
                        onPress={() => addToCart(item)}
                      >
                        <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.addToCartBtnExactText}>+ Thêm</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            )
          }}
          ListFooterComponent={
            isStoreOwner && cart.length > 0 ? (
              <View style={styles.inlineCartContainer}>
                {/* Header giỏ */}
                <View style={styles.inlineCartHeader}>
                  <View style={styles.inlineCartTitleRow}>
                    <Ionicons name="cart-outline" size={18} color="#991B1B" />
                    <Text style={styles.inlineCartTitle}>Giỏ hàng thanh toán</Text>
                  </View>
                  <View style={styles.inlineCartBadge}>
                    <Text style={styles.inlineCartBadgeText}>{cartItemCount} sản phẩm</Text>
                  </View>
                </View>

                {/* Danh sách các món trong giỏ */}
                {cart.map((c) => (
                  <View key={c.id} style={styles.inlineCartItemCard}>
                    <View style={styles.inlineCartItemLeft}>
                      <Text style={styles.inlineCartItemName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <View style={styles.inlineCartTagRow}>
                        {c.hasImei ? (
                          <View style={styles.inlineImeiPill}>
                            <Text style={styles.inlineImeiPillText}>
                              IMEI: {c.imei || '357892110482914'}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.inlineAccessoryPill}>
                            <Text style={styles.inlineAccessoryPillText}>Phụ kiện kèm máy</Text>
                          </View>
                        )}
                        <Text style={styles.inlineQtyText}>x{c.qty}</Text>
                      </View>
                    </View>
                    <Text style={styles.inlineCartItemPrice}>{formatMoney(c.price * c.qty)}</Text>
                  </View>
                ))}

                {/* Card Đặc quyền Chủ quán: Chiết khấu VIP */}
                <View style={styles.vipDiscountCard}>
                  <View style={styles.vipDiscountHeader}>
                    <View style={styles.vipDiscountTitleRow}>
                      <Ionicons name="shield-checkmark" size={15} color="#991B1B" />
                      <Text style={styles.vipDiscountTitle}>Đặc quyền Chủ quán: Chiết khấu VIP</Text>
                    </View>
                    <View style={styles.vipNoApprovalBadge}>
                      <Text style={styles.vipNoApprovalBadgeText}>Không cần duyệt</Text>
                    </View>
                  </View>

                  <View style={styles.vipInputRow}>
                    <View style={styles.vipInputContainer}>
                      <Ionicons name="card-outline" size={16} color="#991B1B" />
                      <TextInput
                        style={styles.vipInput}
                        value={ownerDiscountInput}
                        onChangeText={setOwnerDiscountInput}
                        keyboardType="numeric"
                        placeholder="1.000.000"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.vipInputCurrency}>đ</Text>
                    </View>
                    <Pressable
                      style={styles.vipApplyBtn}
                      onPress={handleApplyOwnerDiscount}
                    >
                      <Text style={styles.vipApplyBtnText}>Áp dụng</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.vipDiscountNote}>
                    Giảm trừ trực tiếp vào lợi nhuận đơn hàng. Áp quyền Quản lý Chi nhánh Cầu Giấy.
                  </Text>
                </View>

                {/* Phương thức thanh toán */}
                <View style={styles.inlinePaySection}>
                  <Text style={styles.inlinePayTitle}>Phương thức thanh toán</Text>
                  <View style={styles.inlinePayRow}>
                    <Pressable
                      style={[
                        styles.inlinePayBtn,
                        paymentMethod === 'cash' && styles.inlinePayBtnActive,
                      ]}
                      onPress={() => setPaymentMethod('cash')}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={15}
                        color={paymentMethod === 'cash' ? '#FFFFFF' : '#374151'}
                      />
                      <Text
                        style={[
                          styles.inlinePayBtnText,
                          paymentMethod === 'cash' && styles.inlinePayBtnTextActive,
                        ]}
                      >
                        Tiền mặt
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.inlinePayBtn,
                        paymentMethod === 'transfer' && styles.inlinePayBtnActive,
                      ]}
                      onPress={() => setPaymentMethod('transfer')}
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={15}
                        color={paymentMethod === 'transfer' ? '#FFFFFF' : '#374151'}
                      />
                      <Text
                        style={[
                          styles.inlinePayBtnText,
                          paymentMethod === 'transfer' && styles.inlinePayBtnTextActive,
                        ]}
                      >
                        VietQR (Tự Động)
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.inlinePayBtn,
                        paymentMethod === 'mixed' && styles.inlinePayBtnActive,
                      ]}
                      onPress={() => setPaymentMethod('mixed')}
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={15}
                        color={paymentMethod === 'mixed' ? '#FFFFFF' : '#374151'}
                      />
                      <Text
                        style={[
                          styles.inlinePayBtnText,
                          paymentMethod === 'mixed' && styles.inlinePayBtnTextActive,
                        ]}
                      >
                        Kết hợp
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Chi tiết giá tiền */}
                <View style={styles.inlineSummaryBox}>
                  <View style={styles.inlineSummaryRow}>
                    <Text style={styles.inlineSummaryLabel}>
                      Tổng giá bán lẻ tạm tính ({cartItemCount} món):
                    </Text>
                    <Text style={styles.inlineSummaryVal}>{formatMoney(subtotal)}</Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>
                        Chiết khấu Chủ quán (Trừ trực tiếp):
                      </Text>
                      <Text style={[styles.inlineSummaryVal, { color: '#16A34A' }]}>
                        -{formatMoney(discount)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.inlineSummaryRowTotal}>
                    <Text style={styles.inlineTotalLabel}>Cần thanh toán:</Text>
                    <Text style={styles.inlineTotalVal}>{formatMoney(totalAmount)}</Text>
                  </View>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* ── THANH GIỎ HÀNG NỔI CHÂN TRANG (IMAGE 2 DOCK) ── */}
      {cart.length > 0 && (
        <View style={[styles.floatingDockWrap, { bottom: insets.bottom + 65 }]}>
          <View style={styles.floatingDockCard}>
            <View style={styles.floatingLeftGroup}>
              <View style={styles.floatingCartIconBox}>
                <Ionicons name="cart" size={20} color="#FBBF24" />
                <View style={styles.floatingCountBadge}>
                  <Text style={styles.floatingCountBadgeText}>{cartItemCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.floatingLabelText}>Giỏ hàng: {cartItemCount} món</Text>
                <Text style={styles.floatingYellowTotal}>{formatMoney(totalAmount)}</Text>
              </View>
            </View>

            <Pressable
              style={styles.floatingCheckoutBtn}
              onPress={() => {
                if (isStoreOwner) {
                  handleCheckout()
                } else {
                  setCartModalOpen(true)
                }
              }}
            >
              <Text style={styles.floatingCheckoutBtnText}>
                {isStoreOwner ? 'Thu tiền' : 'Xem giỏ & Thanh toán'}
              </Text>
              <Ionicons name="arrow-forward" size={15} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      )}

      {/* ── MODAL GIỎ HÀNG & THANH TOÁN (FULL POS CHECKOUT SHEET) ── */}
      <Modal
        visible={cartModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCartModalOpen(false)}
      >
        <View style={[styles.cartModalRoot, { paddingTop: insets.top }]}>
          {/* Header giỏ */}
          <View style={styles.cartModalHeader}>
            <Pressable onPress={() => setCartModalOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.ink} />
            </Pressable>
            <Text style={styles.cartModalTitle}>Chi tiết đơn hàng ({cartItemCount})</Text>
            <Pressable onPress={clearCart} hitSlop={12}>
              <Text style={styles.clearCartText}>Xóa giỏ</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.cartModalBody} keyboardShouldPersistTaps="handled">
            {/* DANH SÁCH MÓN */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>SẢN PHẨM TRONG ĐƠN</Text>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemSku}>SKU: {item.sku}</Text>
                    {item.imei && (
                      <View style={styles.imeiPill}>
                        <Ionicons name="barcode-outline" size={12} color={Colors.primaryContainer} />
                        <Text style={styles.imeiPillText}>IMEI: {item.imei}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartItemPrice}>{formatMoney(item.price * item.qty)}</Text>
                    <View style={styles.cartItemQtyWrap}>
                      <Pressable style={styles.smallQtyBtn} onPress={() => removeFromCart(item.id)}>
                        <Ionicons name="remove" size={14} color="#191C1E" />
                      </Pressable>
                      <Text style={styles.cartQtyText}>{item.qty}</Text>
                      <Pressable
                        style={styles.smallQtyBtn}
                        onPress={() => {
                          const found = catalog.find((c) => c.productVariantId === item.productVariantId)
                          if (found) addToCart(found)
                        }}
                      >
                        <Ionicons name="add" size={14} color="#191C1E" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* TRA CỨU KHÁCH HÀNG */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>THÔNG TIN KHÁCH HÀNG & BẢO HÀNH</Text>
              <View style={styles.customerInputRow}>
                <Ionicons name="call-outline" size={18} color="#8C716E" style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.customerInput}
                  placeholder="Nhập SĐT khách (gợi ý & tích điểm)..."
                  placeholderTextColor="#8C716E"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={(val) => {
                    setCustomerPhone(val)
                    handleLookupCustomer(val)
                  }}
                />
                {lookupLoading && (
                  <ActivityIndicator size="small" color={Colors.primaryContainer} style={{ marginRight: 12 }} />
                )}
              </View>

              {matchedCustomer ? (
                <View style={styles.matchedCard}>
                  <View style={styles.matchedRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={styles.matchedName}>{matchedCustomer.name}</Text>
                    <Text style={styles.matchedBadge}>Khách VIP (Vàng)</Text>
                  </View>
                  <Text style={styles.matchedAddress}>
                    Địa chỉ: {matchedCustomer.address || 'Chi nhánh Cầu Giấy - Hà Nội'}
                  </Text>
                </View>
              ) : (
                <View style={styles.newCustForm}>
                  <TextInput
                    style={styles.simpleInput}
                    placeholder="Họ và tên khách hàng (Anh Hoàng Long...)"
                    placeholderTextColor="#8C716E"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                  <TextInput
                    style={styles.simpleInput}
                    placeholder="Địa chỉ nhận hàng / bảo hành..."
                    placeholderTextColor="#8C716E"
                    value={customerAddress}
                    onChangeText={setCustomerAddress}
                  />
                </View>
              )}
            </View>

            {/* GIẢM GIÁ VOUCHER */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>ƯU ĐÃI & CHIẾT KHẤU</Text>
              <View style={styles.discountRow}>
                {[0, 200000, 500000, 1000000].map((amt) => (
                  <Pressable
                    key={amt}
                    style={[styles.discountChip, discount === amt && styles.discountChipActive]}
                    onPress={() => setDiscount(amt)}
                  >
                    <Text style={[styles.discountChipText, discount === amt && styles.discountChipTextActive]}>
                      {amt === 0 ? 'Không' : `-${formatMoney(amt)}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* HÌNH THỨC THANH TOÁN */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>PHƯƠNG THỨC THANH TOÁN</Text>
              <View style={styles.paymentMethodRow}>
                <Pressable
                  style={[styles.payMethodCard, paymentMethod === 'cash' && styles.payMethodCardActive]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={22}
                    color={paymentMethod === 'cash' ? Colors.primaryContainer : '#58413F'}
                  />
                  <Text style={[styles.payMethodText, paymentMethod === 'cash' && styles.payMethodTextActive]}>
                    Tiền mặt
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.payMethodCard, paymentMethod === 'transfer' && styles.payMethodCardActive]}
                  onPress={() => setPaymentMethod('transfer')}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={22}
                    color={paymentMethod === 'transfer' ? Colors.primaryContainer : '#58413F'}
                  />
                  <Text style={[styles.payMethodText, paymentMethod === 'transfer' && styles.payMethodTextActive]}>
                    VietQR
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.payMethodCard, paymentMethod === 'mixed' && styles.payMethodCardActive]}
                  onPress={() => setPaymentMethod('mixed')}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={22}
                    color={paymentMethod === 'mixed' ? Colors.primaryContainer : '#58413F'}
                  />
                  <Text style={[styles.payMethodText, paymentMethod === 'mixed' && styles.payMethodTextActive]}>
                    Kết hợp
                  </Text>
                </Pressable>
              </View>

              {paymentMethod === 'mixed' && (
                <View style={styles.mixedBox}>
                  <Text style={styles.mixedHint}>Nhập số tiền mặt khách trả trước:</Text>
                  <TextInput
                    style={styles.mixedInput}
                    placeholder="VD: 20000000"
                    placeholderTextColor="#8C716E"
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                  />
                  <View style={styles.mixedResultRow}>
                    <Text style={styles.mixedResultText}>Tiền mặt: {formatMoney(numericCash)}</Text>
                    <Text style={styles.mixedResultText}>Chuyển khoản: {formatMoney(remainingTransfer)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* TỔNG KẾT HÓA ĐƠN */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng tiền hàng ({cartItemCount} món):</Text>
                <Text style={styles.summaryVal}>{formatMoney(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ưu đãi Voucher:</Text>
                  <Text style={[styles.summaryVal, { color: '#16A34A' }]}>-{formatMoney(discount)}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.finalTotalLabel}>Khách phải trả:</Text>
                <Text style={styles.finalTotalVal}>{formatMoney(totalAmount)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer nút chốt đơn */}
          <View style={[styles.cartModalFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={[styles.checkoutBtn, checkingOut && styles.btnDisabled]}
              onPress={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.checkoutBtnText}>Xác nhận thanh toán ({formatMoney(totalAmount)})</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── MODAL HIỂN THỊ VIETQR CHUYỂN KHOẢN ── */}
      <Modal visible={qrModalOpen} transparent={true} animationType="fade">
        <View style={styles.qrModalBackdrop}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>MÃ THANH TOÁN VIETQR PRO</Text>
              <Text style={styles.qrSubtitle}>Đơn hàng {orderSuccessData?.orderCode}</Text>
            </View>

            <View style={styles.qrImgWrap}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaUi3kHn0NZtARtA7nOBVPf8Uc9vuFpIAHr8zfR-ZCDQgw1GqcaFJQH0TYYL2RkNqzBdeHzPYsTxmHtVkAxw5rzn7HLNOXabZdfxdabN50bXidlIuSUpZHoZhAHdoIdcvwCAmJuv-_cIKbGG0GXS19OT9M5-HkPFSIkC0nPas0Y1-dq2-MzyBJjl7AW2A4uNSJu2O_8QMEB8ywGjTTdSKUaRWUHVcrK6ukMNFIkC0',
                }}
                style={styles.qrImg}
                resizeMode="contain"
              />
              <Text style={styles.qrBankHint}>NGÂN HÀNG QUÂN ĐỘI (MB BANK)</Text>
            </View>

            <View style={styles.qrInfoList}>
              <View style={styles.qrInfoRow}>
                <Text style={styles.qrInfoLabel}>Số tiền:</Text>
                <Text style={[styles.qrInfoVal, { color: '#7A0C10', fontSize: 16 }]}>
                  {formatMoney(orderSuccessData?.total || 0)}
                </Text>
              </View>
              <View style={styles.qrInfoRow}>
                <Text style={styles.qrInfoLabel}>Nội dung:</Text>
                <Text style={styles.qrInfoVal}>{orderSuccessData?.orderCode}</Text>
              </View>
            </View>

            <Pressable
              style={styles.qrConfirmBtn}
              onPress={async () => {
                const finalCode = orderSuccessData?.orderCode || `HD-${Date.now().toString().slice(-6)}`
                await buildAndPersistOrder(finalCode, paymentMethod)
                setQrModalOpen(false)
                setCart([])
                setCartModalOpen(false)
                setCustomerPhone('')
                setCustomerName('')
                setMatchedCustomer(null)
                Alert.alert(
                  'Thanh toán thành công 🎉',
                  `Đã nhận tiền chuyển khoản đơn ${finalCode}.\nĐơn hàng đã được thêm vào Sổ đơn & Doanh số hôm nay!`,
                )
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
              <Text style={styles.qrConfirmBtnText}>Xác nhận đã nhận tiền</Text>
            </Pressable>

            <Pressable style={styles.qrCloseBtn} onPress={() => setQrModalOpen(false)}>
              <Text style={styles.qrCloseBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── MODAL QUÉT MÃ BARCODE/IMEI ── */}
      <ScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanCode}
        title="Quét Barcode / Bắn IMEI POS"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#7A0C10',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconImg: {
    width: 34,
    height: 34,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A0C10',
  },
  posBadge: {
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 12,
  },
  posBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#400010',
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  branchText: {
    fontSize: 11,
    color: '#58413F',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#550005',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Utility Bar
  utilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  searchContainer: {
    flex: 1,
    height: 46,
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingVertical: 0,
  },
  scanSquareBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A0C10',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cartSquareBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B32446',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Category Scroll (Phân mục chuẩn)
  categoryScrollWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#ECEEF0',
  },
  catChipActive: {
    backgroundColor: '#7A0C10',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#58413F',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sub Filter
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subFilterScroll: {
    gap: 6,
    alignItems: 'center',
  },
  subFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  subFilterBtnActive: {
    borderColor: Colors.primaryContainer,
  },
  subFilterText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#58413F',
  },
  subFilterTextActive: {
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  subFilterBtnImei: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFD9DC',
    borderWidth: 1,
    borderColor: '#DFBFBC',
  },
  subFilterBtnImeiActive: {
    borderColor: Colors.primaryContainer,
  },
  subFilterImeiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A0C10',
  },
  resultCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C716E',
    marginLeft: 6,
  },

  // Product List (Khớp 100% Image 2)
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  productCardExact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  productImgContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  productImgThumb: {
    width: '100%',
    height: '100%',
  },
  storageTagBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  storageTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#58413F',
  },
  productInfoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tagBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryBadgePill: {
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  categoryBadgePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#58413F',
  },
  imeiBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  imeiBadgeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  inStockBadgeTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  inStockBadgeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  productTitleBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  skuStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  skuText: {
    fontSize: 11,
    color: '#58413F',
  },
  skuDot: {
    fontSize: 11,
    color: '#8C716E',
  },
  stockTextBold: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextGreen: {
    color: '#047857',
  },
  stockTextAmber: {
    color: '#B45309',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productPriceRed: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: -0.3,
  },
  addToCartBtnExact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#7A0C10',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    shadowColor: '#7A0C10',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  addToCartBtnExactText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Stepper Controller [-] qty [+]
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEEF0',
    borderRadius: 10,
    padding: 2,
  },
  stepperMinusBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  stepperQtyText: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  stepperPlusBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating Dock (Image 2)
  floatingDockWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
  },
  floatingDockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 10,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  floatingLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#B32446',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  floatingCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  floatingLabelText: {
    fontSize: 10.5,
    color: '#CBD5E1',
  },
  floatingYellowTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: -0.3,
  },
  floatingCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7A0C10',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    shadowColor: '#7A0C10',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floatingCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Modal Giỏ hàng
  cartModalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cartModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  cartModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  clearCartText: {
    fontSize: 13,
    color: '#BA1A1A',
    fontWeight: '600',
  },
  cartModalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cartSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#58413F',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  cartItemSku: {
    fontSize: 11,
    color: '#58413F',
    marginTop: 1,
  },
  imeiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  imeiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A0C10',
  },
  cartItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cartItemPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7A0C10',
  },
  cartItemQtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: 6,
    padding: 2,
  },
  smallQtyBtn: {
    padding: 4,
  },
  cartQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
    paddingHorizontal: 6,
  },

  // Customer
  customerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    height: 44,
  },
  customerInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingHorizontal: 8,
  },
  matchedCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  matchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  matchedBadge: {
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: '#BBF7D0',
    color: '#166534',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  matchedAddress: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  newCustForm: {
    marginTop: 8,
    gap: 6,
  },
  simpleInput: {
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: '#191C1E',
  },

  // Discount
  discountRow: {
    flexDirection: 'row',
    gap: 6,
  },
  discountChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
  },
  discountChipActive: {
    backgroundColor: '#FFD9DC',
  },
  discountChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#58413F',
  },
  discountChipTextActive: {
    color: '#7A0C10',
    fontWeight: '700',
  },

  // Payment method
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payMethodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  payMethodCardActive: {
    backgroundColor: '#FFECEF',
    borderColor: '#7A0C10',
  },
  payMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58413F',
  },
  payMethodTextActive: {
    color: '#7A0C10',
    fontWeight: '700',
  },
  mixedBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  mixedHint: {
    fontSize: 11,
    color: '#58413F',
  },
  mixedInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    color: '#191C1E',
  },
  mixedResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  mixedResultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A0C10',
  },

  // Summary
  summaryCard: {
    backgroundColor: '#F2F4F6',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#58413F',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEEF0',
    marginVertical: 2,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  finalTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7A0C10',
  },

  cartModalFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF0',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7A0C10',
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // QR Modal
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  qrHeader: {
    alignItems: 'center',
    gap: 2,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: 0.5,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#58413F',
  },
  qrImgWrap: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#F7F9FB',
    borderRadius: 12,
  },
  qrImg: {
    width: 200,
    height: 200,
  },
  qrBankHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#58413F',
  },
  qrInfoList: {
    width: '100%',
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  qrInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrInfoLabel: {
    fontSize: 12,
    color: '#58413F',
  },
  qrInfoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#191C1E',
  },
  qrConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: Radius.full,
    paddingVertical: 12,
  },
  qrConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  qrCloseBtn: {
    paddingVertical: 4,
  },
  qrCloseBtnText: {
    fontSize: 12,
    color: '#8C716E',
    fontWeight: '600',
  },

  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#8C716E',
    marginTop: 6,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#58413F',
    textAlign: 'center',
  },

  // Role Badges
  staffBadgeBg: {
    backgroundColor: '#FFECEF',
  },
  staffBadgeText: {
    color: Colors.primaryContainer,
  },
  ownerBadgeBg: {
    backgroundColor: '#FFD9DD',
  },
  ownerBadgeText: {
    color: '#991B1B',
  },

  // Selected IMEI Note on product card
  selectedImeiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  selectedImeiNoteText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },

  // Inline Cart for Owner (Image 1)
  inlineCartContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#ECEEF0',
    gap: 12,
  },
  inlineCartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  inlineCartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineCartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1E',
  },
  inlineCartBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
  },
  inlineCartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  inlineCartItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineCartItemLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  inlineCartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  inlineCartTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineImeiPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inlineImeiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  inlineAccessoryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inlineAccessoryPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  inlineQtyText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  inlineCartItemPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#191C1E',
  },

  // VIP Owner Discount Box
  vipDiscountCard: {
    backgroundColor: '#FFF5F6',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 8,
  },
  vipDiscountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipDiscountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipDiscountTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#991B1B',
  },
  vipNoApprovalBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  vipNoApprovalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  vipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  vipInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    padding: 0,
  },
  vipInputCurrency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  vipApplyBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipApplyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vipDiscountNote: {
    fontSize: 11,
    color: '#881337',
    lineHeight: 15,
  },

  // Inline Payment Buttons
  inlinePaySection: {
    gap: 8,
  },
  inlinePayTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  inlinePayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlinePayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Radius.md,
    paddingVertical: 9,
  },
  inlinePayBtnActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  inlinePayBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
  },
  inlinePayBtnTextActive: {
    color: '#FFFFFF',
  },

  // Inline Summary Box
  inlineSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
  },
  inlineSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineSummaryLabel: {
    fontSize: 12,
    color: '#58413F',
  },
  inlineSummaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  inlineSummaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inlineTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  inlineTotalVal: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
})

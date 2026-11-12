import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import * as ownerApi from '@/api/owner'

export interface StoreOrder {
  id: string | number
  code: string
  customerName: string
  customerPhone?: string
  total: number
  itemCount: number
  itemsSummary: string
  productSubtitle: string
  paymentMethod: 'cash' | 'transfer' | 'mixed' | string
  status: 'completed' | 'pending' | 'pending_discount' | 'cancelled' | string
  createdAt: string
  cashier: string
  imei?: string
  imageUrl: string
  actionBtnLabel: string
  secondaryBtnLabel?: string
  isVipCustomer?: boolean
  discountInfo?: string
  items?: Array<{
    name: string
    qty: number
    price: number
    imeis?: string[]
  }>
}

export interface PendingApproval {
  id: string
  type: 'discount' | 'trade_in'
  badge: string
  time: string
  amountText: string
  amountSub: string
  device: string
  staffText: string
  approved: boolean
  rejected: boolean
  order_code?: string
  ticket_code?: string
}

export interface StoreVault {
  openingCash: number
  cashSales: number
  operationalExpenses: number
  actualCashInVault: number
  targetRevenue: number
  targetProgress: number
  isSettled: boolean
  lastSettledAt?: string
}

export interface StoreStats {
  ownerRevenueToday: number
  ownerGrowth: string
  ownerCashInVault: number
  ownerOrdersCount: number
  ownerPendingCount: number
  completedCount: number
  pendingCount: number
  revenueToday: number
  growthPercent: string
  ordersToday: number
  imeiInStock: number
  servicesPending: number
}

interface StoreContextValue {
  orders: StoreOrder[]
  approvals: PendingApproval[]
  pendingApprovals: PendingApproval[]
  vault: StoreVault
  stats: StoreStats
  recentOrders: StoreOrder[]
  addPosOrder: (order: Partial<StoreOrder> & { total: number; paymentMethod: string }) => Promise<StoreOrder>
  approveOwnerRequest: (id: string) => Promise<void>
  rejectOwnerRequest: (id: string, reason?: string) => Promise<void>
  approveOrderDiscount: (orderCode: string) => Promise<void>
  cancelAndRefundOrder: (orderCode: string) => Promise<void>
  remindOrderPayment: (orderCode: string) => Promise<void>
  recordVaultExpense: (amount: number, title: string, recipient?: string, note?: string) => Promise<void>
  settleVault: (note?: string) => Promise<any>
  refreshStoreData: () => Promise<void>
  resetDemoData: () => Promise<void>
}

const STORAGE_KEYS = {
  ORDERS: '@lieng_orders_v2',
  APPROVALS: '@lieng_approvals_v2',
  VAULT: '@lieng_vault_v2',
  STATS: '@lieng_stats_v2',
}

const DEFAULT_ORDERS: StoreOrder[] = [
  {
    id: 'owner-1',
    code: 'HD-20261109-024',
    customerName: 'Anh Hoàng Long',
    customerPhone: '0988.xxx.456',
    total: 28016000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB',
    productSubtitle: 'Titan Tự Nhiên • Mới 100% VN/A',
    paymentMethod: 'transfer',
    status: 'pending_discount',
    createdAt: '14:45 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '357892110482914',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_blgggVKlyM7izoMRksl6W0Bq1BZdBEZlleubEqZmMqcR8mLNPtj4mLoHv6ZzQMSXNoN2CDDS7egqq7hIGk8FYFT4w3f0FS4NVgoYieeUkKPWrkISWhNrICFLibmO0ceH8Uy2XLSopSJ7hF5hYQT6XOQeZEv8vuPl4ByWrNAM69hkNRgFb1CdQqrgx5wLEh1OlfruLQuc9comY685qhFOr7OfwGJ6CnxGWuL7Joc',
    actionBtnLabel: 'Duyệt chiết khấu',
    secondaryBtnLabel: 'Xem hóa đơn',
    isVipCustomer: true,
    discountInfo: 'Chiết khấu 5% (-1.474.000 đ)',
  },
  {
    id: 'owner-2',
    code: 'HD-20261109-023',
    customerName: 'Anh Hoàng Nam • Ck ngân hàng Vietcombank',
    customerPhone: '0988.xxx.456',
    total: 29490000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB',
    productSubtitle: 'Titan Xanh • 1 Sản phẩm',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '14:30 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '357892110482914',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_blgggVKlyM7izoMRksl6W0Bq1BZdBEZlleubEqZmMqcR8mLNPtj4mLoHv6ZzQMSXNoN2CDDS7egqq7hIGk8FYFT4w3f0FS4NVgoYieeUkKPWrkISWhNrICFLibmO0ceH8Uy2XLSopSJ7hF5hYQT6XOQeZEv8vuPl4ByWrNAM69hkNRgFb1CdQqrgx5wLEh1OlfruLQuc9comY685qhFOr7OfwGJ6CnxGWuL7Joc',
    actionBtnLabel: 'Hủy & Hoàn tiền',
    secondaryBtnLabel: 'Xem hóa đơn',
  },
  {
    id: 'owner-3',
    code: 'HD-20261109-022',
    customerName: 'Chị Minh Thư • Quẹt thẻ POS',
    customerPhone: '0903.xxx.789',
    total: 26890000,
    itemCount: 1,
    itemsSummary: 'Galaxy S24 Ultra 512GB',
    productSubtitle: 'Titan Xám • Kèm S Pen zin',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '13:15 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '359012384756182',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUWsvDBB3ZCmUCuI1IF_WUH5m7TQt7zIs31NbUL3v06SDVbUUkbm3RTu-SklOgDTQPTOH99PlcXgPvW6vf8Q5Y8G-ErlphH0BmBErZ_M-wSBM_Hy_207DQgcpIZ4uDsuLT3iHBsFcekTpQAWl2J3QGJw96WVbhew3wMg8jjrPZxlAb_tiKYCfCOB6Hfied-f4SUTdeoTuxWeekRzW-Vx-shDNvIF2Mss8ZA15jIeU',
    actionBtnLabel: 'In lại hóa đơn',
    secondaryBtnLabel: 'Chia sẻ HĐ',
  },
  {
    id: 'owner-4',
    code: 'HD-20261109-021',
    customerName: 'Anh Tuấn Kiệt',
    customerPhone: '0912.xxx.333',
    total: 5390000,
    itemCount: 1,
    itemsSummary: 'AirPods Pro 2 (USB-C)',
    productSubtitle: 'Chính hãng Apple VN/A',
    paymentMethod: 'transfer',
    status: 'pending',
    createdAt: '11:45 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: 'Serial: H7K9X2LM',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd19P7Uqasjevj25hBF1pCCaE2YZRYORIawXOfNyRImeG5Ju9nmqe5RTCoPkxmJBFQiSYdGaM96F87R8gfgvwGh8SEirm4NJgrEZU-2OhIaSTxpVgQfggUpfczqA2Ir07FPZh_bLRECOwjLdVUCE0N7t_5gcQPC23WYTKHRR9FNCtKC7DQOyM1nAkSWJFIZy6HTG55JdT6XZ3A41nHcYCs96QUe-M9qSSw6T5b4jE',
    actionBtnLabel: 'Hủy đơn hàng',
    secondaryBtnLabel: 'Nhắc thanh toán',
  },
]

const DEFAULT_APPROVALS: PendingApproval[] = [
  {
    id: 'apr-001',
    type: 'discount',
    badge: 'CHIẾT KHẤU VIP 5%',
    time: '14:35',
    amountText: '-1.474.000đ',
    amountSub: 'Giảm trừ bill',
    device: 'iPhone 15 Pro Max 256GB T...',
    staffText: 'Thu ngân: Nguyễn Văn A • Khách VIP',
    approved: false,
    rejected: false,
    order_code: 'HD-20261109-024',
  },
  {
    id: 'apr-002',
    type: 'trade_in',
    badge: 'TRADE-IN THU CŨ',
    time: '14:20',
    amountText: '6.800.000đ',
    amountSub: 'Đề xuất bù',
    device: 'iPhone 12 Pro 128GB Graphite',
    staffText: 'KTV: KT #04 (Trần Tuấn) • Loại B, viền xước nhẹ',
    approved: false,
    rejected: false,
    ticket_code: 'TC-2026-044',
  },
]

const DEFAULT_VAULT: StoreVault = {
  openingCash: 10000000,
  cashSales: 42500000,
  operationalExpenses: 1850000,
  actualCashInVault: 50650000,
  targetRevenue: 55000000,
  targetProgress: 92,
  isSettled: false,
}

const DEFAULT_STATS: StoreStats = {
  ownerRevenueToday: 128450000,
  ownerGrowth: '+18.2%',
  ownerCashInVault: 34200000,
  ownerOrdersCount: 24,
  ownerPendingCount: 2,
  completedCount: 22,
  pendingCount: 2,
  revenueToday: 42500000,
  growthPercent: '+14.2%',
  ordersToday: 8,
  imeiInStock: 142,
  servicesPending: 3,
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<StoreOrder[]>(DEFAULT_ORDERS)
  const [approvals, setApprovals] = useState<PendingApproval[]>(DEFAULT_APPROVALS)
  const [vault, setVault] = useState<StoreVault>(DEFAULT_VAULT)
  const [stats, setStats] = useState<StoreStats>(DEFAULT_STATS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load persisted store data on startup
  useEffect(() => {
    async function loadStoredData() {
      try {
        const [savedOrders, savedApprovals, savedVault, savedStats] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.APPROVALS),
          AsyncStorage.getItem(STORAGE_KEYS.VAULT),
          AsyncStorage.getItem(STORAGE_KEYS.STATS),
        ])

        if (savedOrders) {
          setOrders(JSON.parse(savedOrders))
        }
        if (savedApprovals) {
          setApprovals(JSON.parse(savedApprovals))
        }
        if (savedVault) {
          setVault(JSON.parse(savedVault))
        }
        if (savedStats) {
          setStats(JSON.parse(savedStats))
        }
      } catch (err) {
        console.warn('Could not load store state from storage', err)
      } finally {
        setIsLoaded(true)
      }
    }

    loadStoredData()
  }, [])

  // Sync to AsyncStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return
    AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)).catch(() => {})
  }, [orders, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    AsyncStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(approvals)).catch(() => {})
  }, [approvals, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    AsyncStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(vault)).catch(() => {})
  }, [vault, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)).catch(() => {})
  }, [stats, isLoaded])

  // Active unapproved pending requests
  const pendingApprovals = approvals.filter((a) => !a.approved && !a.rejected)

  // 1. Add new order from POS
  const addPosOrder = useCallback(
    async (orderInput: Partial<StoreOrder> & { total: number; paymentMethod: string }) => {
      const code = orderInput.code || `HD-${Date.now().toString().slice(-6)}`
      const isCash = orderInput.paymentMethod === 'cash'
      const isMixed = orderInput.paymentMethod === 'mixed'
      const cashPortion = isCash ? orderInput.total : isMixed ? (orderInput.total * 0.5) : 0

      const newOrder: StoreOrder = {
        id: `pos-${Date.now()}`,
        code,
        customerName: orderInput.customerName || 'Khách lẻ',
        customerPhone: orderInput.customerPhone || '0901.xxx.888',
        total: orderInput.total,
        itemCount: orderInput.itemCount || 1,
        itemsSummary: orderInput.itemsSummary || 'Thiết bị Liêng Mobile',
        productSubtitle: orderInput.productSubtitle || 'Mới 100% VN/A • Vừa thanh toán tại quầy POS',
        paymentMethod: orderInput.paymentMethod,
        status: orderInput.status || 'completed',
        createdAt: 'Vừa xong',
        cashier: orderInput.cashier || 'Nguyễn Văn A',
        imei: orderInput.imei || '3590' + Math.floor(10000000000 + Math.random() * 90000000000),
        imageUrl:
          orderInput.imageUrl ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA_blgggVKlyM7izoMRksl6W0Bq1BZdBEZlleubEqZmMqcR8mLNPtj4mLoHv6ZzQMSXNoN2CDDS7egqq7hIGk8FYFT4w3f0FS4NVgoYieeUkKPWrkISWhNrICFLibmO0ceH8Uy2XLSopSJ7hF5hYQT6XOQeZEv8vuPl4ByWrNAM69hkNRgFb1CdQqrgx5wLEh1OlfruLQuc9comY685qhFOr7OfwGJ6CnxGWuL7Joc',
        actionBtnLabel: 'In lại hóa đơn',
        secondaryBtnLabel: 'Chia sẻ HĐ',
        isVipCustomer: orderInput.isVipCustomer,
        discountInfo: orderInput.discountInfo,
        items: orderInput.items,
      }

      // Update orders list
      setOrders((prev) => [newOrder, ...prev])

      // If pending discount requested, also push to approvals queue
      if (newOrder.status === 'pending_discount') {
        const newApproval: PendingApproval = {
          id: `apr-${Date.now()}`,
          type: 'discount',
          badge: 'CHIẾT KHẤU ĐƠN MỚI',
          time: 'Vừa xong',
          amountText: orderInput.discountInfo || '-1.000.000đ',
          amountSub: 'Giảm trừ bill',
          device: newOrder.itemsSummary,
          staffText: `Thu ngân: ${newOrder.cashier} • Khách ${newOrder.customerName}`,
          approved: false,
          rejected: false,
          order_code: newOrder.code,
        }
        setApprovals((prev) => [newApproval, ...prev])
      }

      // Update Stats & Vault
      setStats((prev) => {
        const isCompleted = newOrder.status === 'completed'
        return {
          ...prev,
          ownerRevenueToday: prev.ownerRevenueToday + (isCompleted ? newOrder.total : 0),
          ownerOrdersCount: prev.ownerOrdersCount + 1,
          ownerCashInVault: prev.ownerCashInVault + cashPortion,
          completedCount: prev.completedCount + (isCompleted ? 1 : 0),
          pendingCount: prev.pendingCount + (!isCompleted ? 1 : 0),
          ownerPendingCount: prev.ownerPendingCount + (newOrder.status === 'pending_discount' ? 1 : 0),
          revenueToday: prev.revenueToday + (isCompleted ? newOrder.total : 0),
          ordersToday: prev.ordersToday + 1,
        }
      })

      if (cashPortion > 0) {
        setVault((prev) => {
          const newCashSales = prev.cashSales + cashPortion
          const newActual = prev.openingCash + newCashSales - prev.operationalExpenses
          const progress = Math.round(Math.min(100, (newActual / prev.targetRevenue) * 100))
          return {
            ...prev,
            cashSales: newCashSales,
            actualCashInVault: newActual,
            targetProgress: progress,
          }
        })
      }

      return newOrder
    },
    [],
  )

  // 2. Approve request as Store Owner
  const approveOwnerRequest = useCallback(async (id: string) => {
    let targetOrderCode: string | undefined

    setApprovals((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          targetOrderCode = item.order_code
          return { ...item, approved: true }
        }
        return item
      }),
    )

    // If approval links to an order, finalize that order in orders list
    if (targetOrderCode) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.code === targetOrderCode) {
            return {
              ...o,
              status: 'completed',
              actionBtnLabel: 'In lại hóa đơn',
              secondaryBtnLabel: 'Chia sẻ HĐ',
            }
          }
          return o
        }),
      )
    }

    // Decrement pending count
    setStats((prev) => ({
      ...prev,
      ownerPendingCount: Math.max(0, prev.ownerPendingCount - 1),
      completedCount: prev.completedCount + 1,
      pendingCount: Math.max(0, prev.pendingCount - 1),
    }))

    // Background sync to backend
    try {
      await ownerApi.approveOwnerRequest(id, { order_code: targetOrderCode })
    } catch {
      // Offline fallback already updated in local state
    }
  }, [])

  // 3. Reject request
  const rejectOwnerRequest = useCallback(async (id: string, reason?: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rejected: true } : item)),
    )

    setStats((prev) => ({
      ...prev,
      ownerPendingCount: Math.max(0, prev.ownerPendingCount - 1),
      pendingCount: Math.max(0, prev.pendingCount - 1),
    }))

    try {
      await ownerApi.rejectOwnerRequest(id, reason)
    } catch {}
  }, [])

  // 4. Approve order discount directly
  const approveOrderDiscount = useCallback(
    async (orderCode: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.code === orderCode) {
            return {
              ...o,
              status: 'completed',
              actionBtnLabel: 'In lại hóa đơn',
              secondaryBtnLabel: 'Chia sẻ HĐ',
            }
          }
          return o
        }),
      )

      // Also mark linked approval as approved
      setApprovals((prev) =>
        prev.map((a) => (a.order_code === orderCode ? { ...a, approved: true } : a)),
      )

      setStats((prev) => ({
        ...prev,
        ownerPendingCount: Math.max(0, prev.ownerPendingCount - 1),
        completedCount: prev.completedCount + 1,
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }))

      try {
        await ownerApi.approveOrderDiscount(orderCode)
      } catch {}
    },
    [],
  )

  // 5. Cancel and refund order
  const cancelAndRefundOrder = useCallback(
    async (orderCode: string) => {
      let refundAmount = 0
      let wasCash = false

      setOrders((prev) =>
        prev.map((o) => {
          if (o.code === orderCode) {
            refundAmount = o.total
            wasCash = o.paymentMethod === 'cash'
            return {
              ...o,
              status: 'cancelled',
              actionBtnLabel: 'Đã hoàn tiền',
              secondaryBtnLabel: undefined,
            }
          }
          return o
        }),
      )

      if (refundAmount > 0) {
        setStats((prev) => ({
          ...prev,
          ownerRevenueToday: Math.max(0, prev.ownerRevenueToday - refundAmount),
          ownerCashInVault: wasCash ? Math.max(0, prev.ownerCashInVault - refundAmount) : prev.ownerCashInVault,
          completedCount: Math.max(0, prev.completedCount - 1),
        }))

        if (wasCash) {
          setVault((prev) => {
            const newSales = Math.max(0, prev.cashSales - refundAmount)
            const newActual = prev.openingCash + newSales - prev.operationalExpenses
            return {
              ...prev,
              cashSales: newSales,
              actualCashInVault: newActual,
              targetProgress: Math.round(Math.min(100, (newActual / prev.targetRevenue) * 100)),
            }
          })
        }
      }

      try {
        await ownerApi.cancelAndRefundOrder(orderCode)
      } catch {}
    },
    [],
  )

  // 6. Remind payment
  const remindOrderPayment = useCallback(async (orderCode: string) => {
    try {
      await ownerApi.remindOrderPayment(orderCode)
    } catch {}
  }, [])

  // 7. Record store petty cash expense
  const recordVaultExpense = useCallback(
    async (amount: number, title: string, recipient?: string, note?: string) => {
      setVault((prev) => {
        const newExpenses = prev.operationalExpenses + amount
        const newActual = prev.openingCash + prev.cashSales - newExpenses
        return {
          ...prev,
          operationalExpenses: newExpenses,
          actualCashInVault: newActual,
          targetProgress: Math.round(Math.min(100, (newActual / prev.targetRevenue) * 100)),
        }
      })

      setStats((prev) => ({
        ...prev,
        ownerCashInVault: Math.max(0, prev.ownerCashInVault - amount),
      }))

      try {
        await ownerApi.recordVaultExpense({ amount, title, recipient, note })
      } catch {}
    },
    [],
  )

  // 8. Shift settlement
  const settleVault = useCallback(async (note?: string) => {
    const res = await ownerApi.settleVault(note).catch(() => null)
    setVault((prev) => ({
      ...prev,
      isSettled: true,
      lastSettledAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }))
    return res
  }, [])

  // 9. Sync from backend
  const refreshStoreData = useCallback(async () => {
    try {
      const [dash, v] = await Promise.all([ownerApi.getOwnerDashboard(), ownerApi.getVaultStatus()])
      if (dash?.kpis) {
        setStats((prev) => ({
          ...prev,
          ownerRevenueToday: dash.kpis.revenue_today,
          ownerCashInVault: dash.kpis.cash_in_vault,
          ownerOrdersCount: dash.kpis.total_orders,
          ownerPendingCount: dash.kpis.pending_approvals_count,
        }))
      }
      if (v) {
        setVault((prev) => ({
          ...prev,
          cashSales: v.cash_sales,
          operationalExpenses: v.operational_expenses,
          actualCashInVault: v.actual_cash_in_vault,
          targetProgress: v.target_achieved_pct,
        }))
      }
    } catch {
      // Keep persistent local store
    }
  }, [])

  // Reset demo
  const resetDemoData = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ORDERS),
      AsyncStorage.removeItem(STORAGE_KEYS.APPROVALS),
      AsyncStorage.removeItem(STORAGE_KEYS.VAULT),
      AsyncStorage.removeItem(STORAGE_KEYS.STATS),
    ])
    setOrders(DEFAULT_ORDERS)
    setApprovals(DEFAULT_APPROVALS)
    setVault(DEFAULT_VAULT)
    setStats(DEFAULT_STATS)
  }, [])

  return (
    <StoreContext.Provider
      value={{
        orders,
        approvals,
        pendingApprovals,
        vault,
        stats,
        recentOrders: orders.slice(0, 10),
        addPosOrder,
        approveOwnerRequest,
        rejectOwnerRequest,
        approveOrderDiscount,
        cancelAndRefundOrder,
        remindOrderPayment,
        recordVaultExpense,
        settleVault,
        refreshStoreData,
        resetDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}


import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDefaultRouteForUser, getRoleName } from '@/utils/roleRedirect'
import { canRoleAccessRoute } from '@/utils/routeAccess'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'intro',
      component: () => import('@/views/intro/IntroView.vue'),
      meta: { public: true, layout: 'intro' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true, layout: 'auth' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/views/products/ProductListView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/products/categories',
      name: 'categories',
      component: () => import('@/views/products/CategoryListView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/products/create',
      redirect: { name: 'stock-import-create' },
    },
    {
      path: '/products/:id/edit',
      name: 'product-edit',
      component: () => import('@/views/products/ProductEditView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/inventory/imports',
      name: 'stock-imports',
      component: () => import('@/views/inventory/StockImportListView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/inventory/imports/create',
      name: 'stock-import-create',
      component: () => import('@/views/inventory/StockImportDetailView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/inventory/imports/:code',
      name: 'stock-import-detail',
      component: () => import('@/views/inventory/StockImportDetailView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/pos',
      name: 'pos',
      component: () => import('@/views/orders/PosView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/views/orders/OrderListView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('@/views/customers/CustomerListView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/finance',
      name: 'finance',
      component: () => import('@/views/finance/TransactionListView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/quan',
      name: 'quan',
      component: () => import('@/views/quan/QuanBoardView.vue'),
      meta: { requiresAuth: true, layout: 'admin', roles: ['admin', 'quan_manager', 'quan_staff'] },
    },
    {
      path: '/quan/statements',
      name: 'quan-statements',
      component: () => import('@/views/quan/QuanStatementsView.vue'),
      meta: { requiresAuth: true, layout: 'admin', roles: ['admin', 'quan_manager'] },
    },
    {
      path: '/quan/costs',
      name: 'quan-costs',
      component: () => import('@/views/quan/QuanCostsView.vue'),
      meta: { requiresAuth: true, layout: 'admin', roles: ['admin', 'quan_manager', 'quan_staff'] },
    },
    {
      path: '/tools/lao-listen',
      name: 'lao-listen',
      component: () => import('@/views/tools/LaoListenView.vue'),
      meta: {
        requiresAuth: true,
        layout: 'admin',
        roles: ['admin', 'sales_staff', 'warehouse_staff', 'quan_manager', 'quan_staff'],
      },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/reports/RevenueReportView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/warranty',
      name: 'warranty',
      component: () => import('@/views/warranty/WarrantyLookupView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/users/UserListView.vue'),
      meta: { requiresAuth: true, layout: 'admin', roles: ['admin'] },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/profile/ProfileView.vue'),
      meta: { requiresAuth: true, layout: 'admin' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'intro' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.isAuthenticated && !auth.user) {
    if (to.meta.requiresAuth) {
      try {
        await auth.fetchUser()
      } catch {
        await auth.logout()
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    } else {
      auth.fetchUser().catch(() => auth.logout())
    }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return getDefaultRouteForUser(auth.user)
  }

  if (to.meta.roles?.length && auth.user) {
    const role = getRoleName(auth.user)
    if (!to.meta.roles.includes(role)) {
      return getDefaultRouteForUser(auth.user)
    }
  }

  if (to.meta.requiresAuth && auth.user && to.name) {
    const role = getRoleName(auth.user)
    const permissions = auth.user?.permissions || []
    if (!canRoleAccessRoute(to.name, role, permissions)) {
      return getDefaultRouteForUser(auth.user)
    }
  }
})

export default router

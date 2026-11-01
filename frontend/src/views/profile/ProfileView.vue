<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppUserAvatar from '@/components/common/AppUserAvatar.vue'
import { fetchProfileSummary, updateProfile, changePassword, uploadAvatar, fetchProfileActivity, fetchLoginHistory } from '@/api/profile'
import { withApiFallback } from '@/utils/apiFallback'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { storeInfo } from '@/data/storeIntro'
import { getRoleName } from '@/utils/roleRedirect'
import {
  branches,
  formatCurrency,
  formatProfileTime,
  loginHistory as mockLoginHistory,
  permissionLabel,
  profileStatsByRole,
  recentActivity,
  rolePermissions,
  warehouseActivity,
} from '@/mocks/profileMock'

const auth = useAuthStore()
const locale = useLocaleStore()
const router = useRouter()

const roleName = computed(() => getRoleName(auth.user) ?? 'admin')
const memberSince = computed(() => {
  const raw = auth.user?.created_at
  if (!raw) return '2024'
  const year = new Date(raw).getFullYear()
  return Number.isNaN(year) ? '2024' : String(year)
})
const apiStats = ref(null)
const apiPermissions = ref(null)
const apiActivities = ref(null)
const apiLoginHistory = ref(null)
const savingProfile = ref(false)
const savingPassword = ref(false)
const profileError = ref('')
const passwordError = ref('')
const avatarInput = ref(null)

const stats = computed(() => apiStats.value ?? profileStatsByRole[roleName.value] ?? profileStatsByRole.admin)
const permissions = computed(() => {
  if (apiPermissions.value?.length) {
    return apiPermissions.value.map((p) => permissionLabel[p] ?? p)
  }
  if (auth.user?.permissions?.length) {
    return auth.user.permissions.map((p) => permissionLabel[p] ?? p)
  }
  return (rolePermissions[roleName.value] ?? []).map((p) => permissionLabel[p] ?? p)
})
const activities = computed(() => {
  if (apiActivities.value?.length) return apiActivities.value
  return roleName.value === 'warehouse_staff' ? warehouseActivity : recentActivity
})
const loginSessions = computed(() => apiLoginHistory.value ?? mockLoginHistory)

const profileForm = ref({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
  phone: auth.user?.phone ?? '',
  branchId: 1,
})

const showPasswordModal = ref(false)
const passwordForm = ref({ current: '', newPassword: '', confirm: '' })
const saveNotice = ref(false)

watch(
  () => auth.user,
  (u) => {
    if (!u) return
    profileForm.value.name = u.name ?? ''
    profileForm.value.email = u.email ?? ''
    profileForm.value.phone = u.phone ?? ''
  },
  { immediate: true },
)

const statCards = computed(() => {
  if (roleName.value === 'warehouse_staff') {
    return [
      {
        label: 'Phiếu nhập hôm nay',
        value: String(stats.value.importsToday),
        hint: `${stats.value.importsPending} chờ xác nhận`,
        icon: 'import',
        iconColor: 'text-sky-600 bg-sky-50',
        valueClass: 'text-sky-600',
        valueSize: 'md',
      },
      {
        label: 'IMEI đã quét',
        value: String(stats.value.imeiScanned),
        hint: 'Trong ca làm việc',
        icon: 'scan',
        iconColor: 'text-emerald-600 bg-emerald-50',
        valueClass: 'text-emerald-600',
        valueSize: 'md',
      },
      {
        label: 'Cảnh báo tồn',
        value: String(stats.value.lowStockAlerts),
        hint: 'Biến thể sắp hết',
        icon: 'lowStock',
        iconColor: 'text-amber-600 bg-amber-50',
        valueClass: 'text-amber-600',
        valueSize: 'md',
      },
      {
        label: 'Chi nhánh',
        value: branches.find((b) => b.id === profileForm.value.branchId)?.name?.split(' ').slice(-2).join(' ') ?? 'Q.5',
        hint: 'Đang phân công',
        icon: 'branch',
        iconColor: 'text-violet-600 bg-violet-50',
        valueClass: 'text-violet-600',
        valueSize: 'md',
      },
    ]
  }
  if (roleName.value === 'sales_staff') {
    return [
      {
        label: 'Đơn hôm nay',
        value: String(stats.value.ordersToday),
        hint: 'Đã thanh toán',
        icon: 'orders',
        iconColor: 'text-red-600 bg-red-50',
        valueClass: 'text-red-600',
        valueSize: 'md',
      },
      {
        label: 'Doanh thu ca',
        value: formatCurrency(stats.value.revenueToday),
        hint: 'Từ quầy POS',
        icon: 'revenue',
        iconColor: 'text-emerald-600 bg-emerald-50',
        valueClass: 'text-emerald-600',
        valueSize: 'md',
      },
      {
        label: 'Khách phục vụ',
        value: String(stats.value.customersServed),
        hint: 'Trong ngày',
        icon: 'customers',
        iconColor: 'text-sky-600 bg-sky-50',
        valueClass: 'text-sky-600',
        valueSize: 'md',
      },
      {
        label: 'TB / đơn',
        value: formatCurrency(stats.value.avgOrderValue),
        hint: 'Trung bình',
        icon: 'avg',
        iconColor: 'text-amber-600 bg-amber-50',
        valueClass: 'text-amber-600',
        valueSize: 'md',
      },
    ]
  }
  return [
    {
      label: 'Đơn hôm nay',
      value: String(stats.value.ordersToday),
      hint: 'Toàn cửa hàng',
      icon: 'orders',
      iconColor: 'text-red-600 bg-red-50',
      valueClass: 'text-red-600',
      valueSize: 'md',
    },
    {
      label: 'Doanh thu hôm nay',
      value: formatCurrency(stats.value.revenueToday),
      hint: 'Đã thu',
      icon: 'revenue',
      iconColor: 'text-emerald-600 bg-emerald-50',
      valueClass: 'text-emerald-600',
      valueSize: 'md',
    },
    {
      label: 'Phiếu nhập chờ',
      value: String(stats.value.importsPending),
      hint: 'Cần xác nhận',
      icon: 'waiting',
      iconColor: 'text-sky-600 bg-sky-50',
      valueClass: 'text-sky-600',
      valueSize: 'md',
    },
    {
      label: 'NV online',
      value: String(stats.value.staffOnline),
      hint: 'Đang hoạt động',
      icon: 'online',
      iconColor: 'text-violet-600 bg-violet-50',
      valueClass: 'text-violet-600',
      valueSize: 'md',
    },
  ]
})

async function saveProfile() {
  profileError.value = ''
  savingProfile.value = true
  try {
    const { data } = await updateProfile({
      name: profileForm.value.name,
      phone: profileForm.value.phone,
    })
    auth.patchUser(data.data ?? data)
    saveNotice.value = true
    setTimeout(() => { saveNotice.value = false }, 3000)
  } catch (err) {
    profileError.value = err.response?.data?.message || 'Không thể lưu hồ sơ.'
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  if (passwordForm.value.newPassword !== passwordForm.value.confirm) {
    passwordError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }
  savingPassword.value = true
  try {
    await changePassword({
      current_password: passwordForm.value.current,
      password: passwordForm.value.newPassword,
      password_confirmation: passwordForm.value.confirm,
    })
    showPasswordModal.value = false
    passwordForm.value = { current: '', newPassword: '', confirm: '' }
    saveNotice.value = true
    setTimeout(() => { saveNotice.value = false }, 3000)
  } catch (err) {
    passwordError.value = err.response?.data?.message || 'Không thể đổi mật khẩu.'
    if (err.response?.data?.errors?.current_password) {
      passwordError.value = err.response.data.errors.current_password[0]
    }
  } finally {
    savingPassword.value = false
  }
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function onAvatarSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const { data } = await uploadAvatar(file)
    auth.patchUser(data.data ?? data)
  } catch {
    profileError.value = 'Không thể tải avatar lên.'
  }
  event.target.value = ''
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}

onMounted(async () => {
  const data = await withApiFallback(fetchProfileSummary, () => null)
  if (data) {
    apiStats.value = data.stats
    apiPermissions.value = data.permissions
  }
  try {
    apiActivities.value = await fetchProfileActivity()
  } catch {
    apiActivities.value = null
  }
  try {
    apiLoginHistory.value = await fetchLoginHistory()
  } catch {
    apiLoginHistory.value = null
  }
})
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div
      v-if="saveNotice"
      class="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-xl"
    >
      Đã lưu thay đổi thành công.
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_24px_rgb(0,0,0,0.04)]">
      <div class="relative h-28 bg-gradient-to-br from-red-600 via-rose-500 to-red-400 sm:h-32">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.22),transparent_50%)]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(0,0,0,0.08),transparent_45%)]"></div>
        <div class="absolute -bottom-14 left-6 sm:-bottom-16 sm:left-8">
          <div class="relative rounded-[14px] bg-white p-1.5 shadow-[0_8px_24px_rgba(220,38,38,0.18)] ring-1 ring-red-100">
            <AppUserAvatar
              size="xl"
              :src="auth.user?.avatar_url"
              :alt="auth.user?.name ?? 'Nhân viên'"
              class="!ring-0"
            />
            <button
              type="button"
              class="absolute -bottom-1 -right-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-red-600 shadow ring-1 ring-red-100"
              @click="triggerAvatarUpload"
            >
              Đổi ảnh
            </button>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-5 px-6 pb-6 pt-16 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pt-[4.5rem]">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500">
            {{ locale.t('page.profile.title') }}
          </p>
          <h2 class="mt-1 text-2xl font-black tracking-tight text-[#111118] sm:text-[28px]">
            {{ auth.user?.name ?? 'Nhân viên' }}
          </h2>
          <p class="mt-1.5 text-sm font-medium text-slate-500">{{ auth.user?.email }}</p>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100">
              {{ auth.user?.role?.display_name ?? 'Nội bộ' }}
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1"
              :class="
                auth.user?.is_active !== false
                  ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                  : 'bg-slate-100 text-slate-500 ring-slate-200'
              "
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="auth.user?.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'"
              ></span>
              {{ auth.user?.is_active !== false ? locale.t('common.active') : locale.t('common.inactive') }}
            </span>
          </div>
        </div>

        <div class="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          <div class="rounded-[16px] bg-[#fffafa] px-3 py-2.5 text-center ring-1 ring-red-100 sm:px-4">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</p>
            <p class="mt-0.5 text-sm font-black text-[#111118]">#{{ auth.user?.id ?? '—' }}</p>
          </div>
          <div class="rounded-[16px] bg-[#fffafa] px-3 py-2.5 text-center ring-1 ring-red-100 sm:px-4">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cửa hàng</p>
            <p class="mt-0.5 max-w-[72px] truncate text-sm font-bold text-red-600 sm:max-w-[100px]">{{ storeInfo.name }}</p>
          </div>
          <div class="rounded-[16px] bg-[#fffafa] px-3 py-2.5 text-center ring-1 ring-red-100 sm:px-4">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Từ năm</p>
            <p class="mt-0.5 text-sm font-black text-[#111118]">{{ memberSince }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AppStatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :hint="card.hint"
        :icon="card.icon"
        :icon-color="card.iconColor"
        :value-class="card.valueClass"
        value-size="md"
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_1fr]">
      <div class="space-y-6">
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('profile.account') }}</h3>
          <p class="mt-1 text-sm text-slate-500">Cập nhật họ tên, liên hệ và chi nhánh làm việc</p>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Họ và tên</label>
              <input
                v-model="profileForm.name"
                type="text"
                class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Email đăng nhập</label>
              <input
                v-model="profileForm.email"
                type="email"
                class="w-full rounded-[16px] border border-red-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                readonly
              />
            </div>
            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</label>
              <input
                v-model="profileForm.phone"
                type="tel"
                class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium outline-none focus:border-red-400"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Chi nhánh</label>
              <select
                v-model="profileForm.branchId"
                class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium outline-none focus:border-red-400"
              >
                <option v-for="b in branches" :key="b.id" :value="b.id">
                  {{ b.name }}{{ b.isMain ? ' (Trụ sở)' : '' }}
                </option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <p v-if="profileError" class="w-full text-sm text-red-600">{{ profileError }}</p>
            <button
              type="button"
              class="rounded-[14px] bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              :disabled="savingProfile"
              @click="saveProfile"
            >
              {{ savingProfile ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
            <button
              type="button"
              class="rounded-[14px] bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100 hover:bg-red-100"
              @click="showPasswordModal = true"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>

        <div class="rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="border-b border-red-100 px-6 py-4">
            <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('profile.activity') }}</h3>
            <p class="text-sm text-slate-500">Nhật ký thao tác trong hệ thống</p>
          </div>
          <div class="divide-y divide-red-100">
            <div
              v-for="item in activities"
              :key="item.id"
              class="flex items-start justify-between gap-4 px-6 py-4"
            >
              <div>
                <p class="font-semibold text-slate-700">{{ item.action }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ item.module }}</p>
              </div>
              <p class="shrink-0 text-xs text-slate-500">{{ formatProfileTime(item.at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-[24px] border border-red-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('profile.permissions') }}</h3>
          <p class="mt-1 text-sm text-slate-500">{{ permissions.length }} quyền được cấp</p>

          <div class="mt-4 rounded-[16px] bg-red-50/50 p-4 ring-1 ring-red-100">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Vai trò hiện tại</p>
            <p class="mt-2 text-lg font-black text-red-600">{{ auth.user?.role?.display_name }}</p>
            <p class="mt-1 font-mono text-xs text-slate-500">{{ roleName }}</p>
          </div>

          <div class="mt-4 max-h-64 space-y-2 overflow-y-auto">
            <div
              v-for="perm in permissions"
              :key="perm"
              class="flex items-center gap-2 rounded-[12px] bg-red-50/40 px-3 py-2 text-sm text-slate-700 ring-1 ring-red-100"
            >
              <span class="text-emerald-500">✓</span>
              {{ permissionLabel(perm) }}
            </div>
          </div>
        </div>

        <div class="rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div class="border-b border-red-100 px-6 py-4">
            <h3 class="text-lg font-bold text-[#111118]">Phiên đăng nhập</h3>
            <p class="text-sm text-slate-500">Thiết bị truy cập gần đây</p>
          </div>
          <div class="divide-y divide-red-100">
            <div
              v-for="session in loginSessions"
              :key="session.id"
              class="px-6 py-4"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-semibold text-slate-700">{{ session.device }}</p>
                <span
                  v-if="session.current"
                  class="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-100"
                >
                  Hiện tại
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-400">{{ session.ip }} · {{ formatProfileTime(session.at) }}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="w-full rounded-[16px] border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
          @click="handleLogout"
        >
          Đăng xuất tài khoản
        </button>
      </div>
    </div>

    <AppModal :open="showPasswordModal" @close="showPasswordModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-black text-[#111118]">Đổi mật khẩu</h3>
          <p class="mt-1 text-sm text-slate-500">Mật khẩu tối thiểu 8 ký tự</p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Mật khẩu hiện tại</label>
            <input
              v-model="passwordForm.current"
              type="password"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Mật khẩu mới</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Xác nhận mật khẩu</label>
            <input
              v-model="passwordForm.confirm"
              type="password"
              class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm outline-none focus:border-red-400"
            />
          </div>
        </div>
        <div class="flex gap-3 border-t border-red-100 px-6 py-4">
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
            @click="showPasswordModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            :disabled="savingPassword"
            @click="savePassword"
          >
            {{ savingPassword ? 'Đang cập nhật...' : 'Cập nhật' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

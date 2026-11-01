<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { isMockToken } from '@/mocks/auth'
import * as usersApi from '@/api/users'
import { useLocaleStore } from '@/stores/locale'
import AppContentBreadcrumb from '@/components/common/AppContentBreadcrumb.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInlineLoader from '@/components/common/AppInlineLoader.vue'
import AppStatCard from '@/components/common/AppStatCard.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSlideOver from '@/components/common/AppSlideOver.vue'
import {
  createMockUser,
  deleteMockUser,
  formatStaffDate,
  getInitials,
  getMockUserStats,
  getMockUsers,
  roleBadgeClass,
  roleOptions as mockRoleOptions,
  updateMockUser,
} from '@/mocks/userMock'

const auth = useAuthStore()
const locale = useLocaleStore()
const roleOptionsList = ref([...mockRoleOptions])
const staffRoleOptions = computed(() => roleOptionsList.value.filter((r) => r.name !== 'admin'))

const users = ref([])
const loading = ref(true)
const useMock = ref(false)
const keyword = ref('')
const selectedRole = ref('all')
const selectedStatus = ref('all')
const selectedUser = ref(null)
const showCreateModal = ref(false)
const saving = ref(false)
const formError = ref('')
const toast = ref('')

const newUser = ref(emptyForm())
const editForm = ref(emptyForm())

const stats = computed(() => getMockUserStats(users.value))

const statCards = computed(() => [
  {
    label: locale.t('users.stats.total'),
    value: stats.value.total,
    hint: 'Có tài khoản hệ thống',
    icon: 'users',
    iconColor: 'text-red-600 bg-red-50',
    valueClass: 'text-[#111118]',
  },
  {
    label: locale.t('users.stats.active'),
    value: stats.value.active,
    hint: 'Có thể đăng nhập',
    icon: 'userActive',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
  },
  {
    label: 'Bán hàng',
    value: stats.value.sales,
    hint: 'POS & khách hàng',
    icon: 'cart',
    iconColor: 'text-emerald-600 bg-emerald-50',
    valueClass: 'text-emerald-600',
  },
  {
    label: 'Kho',
    value: stats.value.warehouse,
    hint: 'Nhập kho & IMEI',
    icon: 'stock',
    iconColor: 'text-blue-600 bg-blue-50',
    valueClass: 'text-blue-600',
  },
])

const filteredUsers = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const matchesKeyword =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''))

    const matchesRole = selectedRole.value === 'all' || user.role?.name === selectedRole.value
    const matchesStatus =
      selectedStatus.value === 'all' ||
      (selectedStatus.value === 'active' && user.is_active) ||
      (selectedStatus.value === 'inactive' && !user.is_active)

    return matchesKeyword && matchesRole && matchesStatus
  })
})

function emptyForm() {
  return {
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: staffRoleOptions.value[0]?.id ?? 2,
    is_active: true,
  }
}

function showToast(message) {
  toast.value = message
  setTimeout(() => {
    toast.value = ''
  }, 3000)
}

function normalizeUser(raw) {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone || '',
    is_active: Boolean(raw.is_active),
    role: raw.role,
    created_at: raw.created_at,
  }
}

async function loadUsers() {
  loading.value = true
  formError.value = ''

  if (isMockToken(auth.token)) {
    useMock.value = true
    users.value = getMockUsers()
    loading.value = false
    return
  }

  try {
    const { data } = await usersApi.getUsers({ per_page: 100 })
    users.value = (data.data ?? []).map(normalizeUser)
    useMock.value = false
  } catch {
    useMock.value = true
    users.value = getMockUsers()
  } finally {
    loading.value = false
  }
}

function openDetail(user) {
  selectedUser.value = user
  editForm.value = {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    password: '',
    role_id: user.role?.id ?? 2,
    is_active: user.is_active,
  }
  formError.value = ''
}

function closeDetail() {
  selectedUser.value = null
  formError.value = ''
}

function openCreateModal() {
  newUser.value = emptyForm()
  formError.value = ''
  showCreateModal.value = true
}

async function handleCreate() {
  saving.value = true
  formError.value = ''

  try {
    if (useMock.value) {
      const created = createMockUser(newUser.value)
      users.value = getMockUsers()
      showCreateModal.value = false
      showToast(`Đã tạo tài khoản ${created.name}`)
      return
    }

    const { data } = await usersApi.createUser(newUser.value)
    users.value.unshift(normalizeUser(data.data))
    showCreateModal.value = false
    showToast(data.message || 'Tạo tài khoản thành công')
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng thử lại.'
    if (err.response?.data?.errors) {
      formError.value = Object.values(err.response.data.errors).flat().join(' ')
    }
  } finally {
    saving.value = false
  }
}

async function handleUpdate() {
  if (!selectedUser.value) return
  saving.value = true
  formError.value = ''

  const payload = {
    name: editForm.value.name,
    email: editForm.value.email,
    phone: editForm.value.phone,
    role_id: editForm.value.role_id,
    is_active: editForm.value.is_active,
  }
  if (editForm.value.password) {
    payload.password = editForm.value.password
  }

  try {
    if (useMock.value) {
      updateMockUser(selectedUser.value.id, payload)
      users.value = getMockUsers()
      selectedUser.value = users.value.find((u) => u.id === selectedUser.value.id) ?? null
      showToast('Đã cập nhật tài khoản')
      return
    }

    const { data } = await usersApi.updateUser(selectedUser.value.id, payload)
    const updated = normalizeUser(data.data)
    const index = users.value.findIndex((u) => u.id === updated.id)
    if (index !== -1) users.value[index] = updated
    selectedUser.value = updated
    showToast(data.message || 'Cập nhật thành công')
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.'
    if (err.response?.data?.errors) {
      formError.value = Object.values(err.response.data.errors).flat().join(' ')
    }
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!selectedUser.value) return
  if (!window.confirm(`Xóa tài khoản "${selectedUser.value.name}"?`)) return

  saving.value = true
  formError.value = ''

  try {
    if (useMock.value) {
      deleteMockUser(selectedUser.value.id)
      users.value = getMockUsers()
      closeDetail()
      showToast('Đã xóa tài khoản')
      return
    }

    await usersApi.deleteUser(selectedUser.value.id)
    users.value = users.value.filter((u) => u.id !== selectedUser.value.id)
    closeDetail()
    showToast('Đã xóa tài khoản')
  } catch (err) {
    formError.value = err.response?.data?.message || 'Không thể xóa tài khoản.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadUsers()
  if (!isMockToken(auth.token)) {
    try {
      const { data } = await usersApi.getRoles()
      roleOptionsList.value = data.data ?? data
    } catch {
      roleOptionsList.value = [...mockRoleOptions]
    }
  }
})
</script>

<template>
  <div class="space-y-6 p-6 sm:p-8">
    <AppContentBreadcrumb />

    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-[120] rounded-[16px] bg-[#111118] px-5 py-3 text-sm font-semibold text-white shadow-xl"
    >
      {{ toast }}
    </div>

    <div class="rounded-[24px] border border-red-300/30 bg-gradient-to-r from-red-600 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-red-100">{{ locale.t('users.hero.kicker') }}</p>
          <h2 class="mt-1 text-2xl font-black sm:text-3xl">{{ locale.t('users.hero.title') }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-red-100/90">
            {{ locale.t('users.hero.desc') }}
          </p>
          <p v-if="useMock" class="mt-2 text-xs font-medium text-amber-200">
            Đang dùng dữ liệu demo (backend chưa kết nối hoặc đăng nhập mock).
          </p>
        </div>
        <button
          type="button"
          class="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
          @click="openCreateModal"
        >
          + {{ locale.t('users.add') }}
        </button>
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
      >
        {{ card.value }}
      </AppStatCard>
    </div>

    <div class="rounded-[24px] border border-red-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="grid flex-1 gap-4 md:grid-cols-3">
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.search') }}</label>
          <input
            v-model="keyword"
            type="text"
            :placeholder="locale.t('users.searchPlaceholder')"
            class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
          />
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Vai trò</label>
          <select
            v-model="selectedRole"
            class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
          >
            <option value="all">Tất cả vai trò</option>
            <option v-for="role in roleOptionsList" :key="role.name" :value="role.name">{{ role.display_name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('common.status') }}</label>
          <select
            v-model="selectedStatus"
            class="w-full rounded-[16px] border border-red-200 bg-red-50/60 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400"
          >
            <option value="all">{{ locale.t('common.all') }}</option>
            <option value="active">{{ locale.t('common.active') }}</option>
            <option value="inactive">{{ locale.t('common.inactive') }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div class="border-b border-red-100 px-6 py-4">
        <h3 class="text-lg font-bold text-[#111118]">{{ locale.t('users.listTitle') }}</h3>
        <p class="flex items-center gap-2 text-sm text-slate-500">
          <AppInlineLoader v-if="loading" size="xs" inline />
          <span v-else>{{ filteredUsers.length }} nhân viên · bấm để chỉnh sửa</span>
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[900px] w-full text-left text-sm">
          <thead class="bg-red-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th class="px-6 py-4">Nhân viên</th>
              <th class="px-6 py-4">Liên hệ</th>
              <th class="px-6 py-4">Vai trò</th>
              <th class="px-6 py-4">Trạng thái</th>
              <th class="px-6 py-4">Ngày tạo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-red-100">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="cursor-pointer transition hover:bg-red-50/40"
              @click="openDetail(user)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-red-500 to-rose-500 text-sm font-bold text-white"
                  >
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <p class="font-bold text-[#111118]">{{ user.name }}</p>
                    <p class="text-xs text-slate-400">ID #{{ user.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-slate-700">{{ user.email }}</p>
                <p class="text-xs text-slate-400">{{ user.phone || '—' }}</p>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="roleBadgeClass[user.role?.name] || 'bg-slate-100 text-slate-600 ring-slate-200'"
                >
                  {{ user.role?.display_name || '—' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1"
                  :class="user.is_active ? 'bg-emerald-100 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'"
                >
                  {{ user.is_active ? locale.t('common.active') : locale.t('common.inactive') }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500">{{ formatStaffDate(user.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="!loading && filteredUsers.length === 0"
        icon="users"
        :title="locale.t('users.emptyFilter')"
      />
    </div>

    <AppSlideOver :open="!!selectedUser" @close="closeDetail">
      <div class="sticky top-0 z-10 border-b border-red-100 bg-white px-6 py-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-red-500 to-rose-500 text-lg font-bold text-white"
            >
              {{ getInitials(selectedUser?.name) }}
            </div>
            <div>
              <h3 class="text-xl font-black text-[#111118]">Chỉnh sửa tài khoản</h3>
              <p class="text-sm text-slate-500">{{ selectedUser?.email }}</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-[12px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            @click="closeDetail"
          >
            Đóng
          </button>
        </div>
      </div>

      <div class="space-y-4 p-6">
        <p v-if="formError" class="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {{ formError }}
        </p>

        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Họ tên</label>
          <input
            v-model="editForm.name"
            type="text"
            class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Email đăng nhập</label>
          <input
            v-model="editForm.email"
            type="email"
            class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</label>
          <input
            v-model="editForm.phone"
            type="text"
            class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Vai trò</label>
          <select
            v-model="editForm.role_id"
            class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
          >
            <option v-for="role in roleOptionsList" :key="role.id" :value="role.id">{{ role.display_name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Mật khẩu mới (tùy chọn)</label>
          <input
            v-model="editForm.password"
            type="password"
            placeholder="Để trống nếu không đổi"
            class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
          />
        </div>
        <label class="flex cursor-pointer items-center gap-3 rounded-[14px] border border-red-100 bg-red-50/40 px-4 py-3">
          <input v-model="editForm.is_active" type="checkbox" class="h-4 w-4 rounded border-red-300 text-red-600" />
          <span class="text-sm font-medium text-slate-700">Cho phép đăng nhập</span>
        </label>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            :disabled="saving"
            @click="handleUpdate"
          >
            {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
          <button
            v-if="selectedUser?.id !== auth.user?.id"
            type="button"
            class="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
            :disabled="saving"
            @click="handleDelete"
          >
            Xóa
          </button>
        </div>
      </div>
    </AppSlideOver>

    <AppModal :open="showCreateModal" @close="showCreateModal = false">
      <div class="w-full max-w-md rounded-[24px] border border-red-200 bg-white shadow-2xl">
        <div class="border-b border-red-100 px-6 py-4">
          <h3 class="text-lg font-bold text-[#111118]">Tạo tài khoản nhân viên</h3>
          <p class="mt-1 text-sm text-slate-500">Nhân viên dùng email và mật khẩu để đăng nhập hệ thống</p>
        </div>
        <div class="space-y-4 p-6">
          <p v-if="formError" class="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {{ formError }}
          </p>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Họ tên</label>
            <input
              v-model="newUser.name"
              type="text"
              placeholder="Nguyễn Văn A"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Email đăng nhập</label>
            <input
              v-model="newUser.email"
              type="email"
              placeholder="nhanvien@liengmobile.com"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</label>
            <input
              v-model="newUser.phone"
              type="text"
              placeholder="0901 234 567"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Vai trò</label>
            <select
              v-model="newUser.role_id"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            >
              <option v-for="role in staffRoleOptions" :key="role.id" :value="role.id">{{ role.display_name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Mật khẩu</label>
            <input
              v-model="newUser.password"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              class="w-full rounded-[14px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm outline-none focus:border-red-400"
            />
          </div>
          <label class="flex cursor-pointer items-center gap-3 rounded-[14px] border border-red-100 bg-red-50/40 px-4 py-3">
            <input v-model="newUser.is_active" type="checkbox" class="h-4 w-4 rounded border-red-300 text-red-600" />
            <span class="text-sm font-medium text-slate-700">Kích hoạt ngay sau khi tạo</span>
          </label>
        </div>
        <div class="flex gap-3 border-t border-red-100 px-6 py-4">
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-red-100 hover:bg-red-50"
            @click="showCreateModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            class="flex-1 rounded-[14px] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            :disabled="saving"
            @click="handleCreate"
          >
            {{ saving ? 'Đang tạo...' : 'Tạo tài khoản' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

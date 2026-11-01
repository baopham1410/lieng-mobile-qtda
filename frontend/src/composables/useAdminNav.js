import { computed } from 'vue'
import { adminNavGroups } from '@/data/adminNav'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { getRoleName } from '@/utils/roleRedirect'

export function useAdminNav() {
  const auth = useAuthStore()
  const locale = useLocaleStore()

  const roleName = computed(() => getRoleName(auth.user) ?? 'admin')
  const permissions = computed(() => auth.user?.permissions ?? [])

  const navGroups = computed(() =>
    adminNavGroups
      .map((group) => ({
        ...group,
        label: locale.t(`navGroup.${group.groupKey}`),
        items: group.items
          .filter((item) => item.roles.includes(roleName.value))
          .map((item) => {
            const locked = Boolean(
              item.requiresPermission && !permissions.value.includes(item.requiresPermission),
            )
            return {
              ...item,
              label: locale.t(`nav.${item.name}`),
              locked,
            }
          }),
      }))
      .filter((group) => group.items.length > 0),
  )

  const flatNav = computed(() => navGroups.value.flatMap((g) => g.items))

  function canAccess(routeName) {
    const item = flatNav.value.find((i) => i.name === routeName)
    if (!item) return false
    return !item.locked
  }

  return { roleName, navGroups, flatNav, canAccess }
}

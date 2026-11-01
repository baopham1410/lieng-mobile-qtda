import { adminNavGroups } from '@/data/adminNav'

const routeRoles = {}
const routePermissions = {}

for (const group of adminNavGroups) {
  for (const item of group.items) {
    routeRoles[item.name] = item.roles
    if (item.requiresPermission) {
      routePermissions[item.name] = item.requiresPermission
    }
  }
}

routeRoles['product-edit'] = routeRoles.products
routeRoles.categories = ['admin', 'warehouse_staff']
routeRoles['stock-import-create'] = routeRoles['stock-imports']
routeRoles['stock-import-detail'] = routeRoles['stock-imports']
routeRoles.profile = ['admin', 'sales_staff', 'warehouse_staff', 'quan_manager', 'quan_staff']

export function canRoleAccessRoute(routeName, roleName, permissions = []) {
  if (!routeName || !roleName) return true
  const roles = routeRoles[routeName]
  if (!roles) return true
  if (!roles.includes(roleName)) return false

  const required = routePermissions[routeName]
  if (required && !permissions.includes(required)) return false

  return true
}

/**
 * Điều hướng sau login theo `roles.name` trong DB
 * @see docs/roles-permissions.md
 */
export function getRoleName(user) {
  if (!user) return null
  return user.role?.name ?? user.role_name ?? user.roles?.[0]?.name ?? null
}

export function getDefaultRouteForUser(user) {
  switch (getRoleName(user)) {
    case 'sales_staff':
      return '/pos'
    case 'warehouse_staff':
      return '/inventory/imports'
    case 'quan_manager':
    case 'quan_staff':
      return '/quan'
    case 'admin':
    default:
      return '/dashboard'
  }
}

export function resolvePostLoginRoute(user, queryRedirect) {
  if (queryRedirect && queryRedirect !== '/login') {
    return queryRedirect
  }
  return getDefaultRouteForUser(user)
}

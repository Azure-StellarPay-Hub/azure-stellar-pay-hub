import { UserRole } from '@stellar-pay/types';

/** Role hierarchy: ADMIN > SUPPORT > MERCHANT > USER. */
export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.USER,
  UserRole.MERCHANT,
  UserRole.SUPPORT,
  UserRole.ADMIN,
];

/** Permissions granted to each role. Kept in sync with the DB seed. */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  USER: ['payments:create', 'payments:read', 'users:read', 'users:write', 'assets:read'],
  MERCHANT: [
    'payments:create',
    'payments:read',
    'merchants:read',
    'merchants:write',
    'invoices:read',
    'invoices:write',
    'webhooks:write',
  ],
  SUPPORT: ['payments:read', 'users:read', 'transactions:read', 'merchants:read'],
  ADMIN: [
    'payments:create',
    'payments:read',
    'payments:admin',
    'users:read',
    'users:write',
    'users:admin',
    'merchants:read',
    'merchants:write',
    'merchants:admin',
    'invoices:read',
    'invoices:write',
    'transactions:read',
    'transactions:admin',
    'assets:read',
    'assets:admin',
    'analytics:read',
    'settings:admin',
    'audit:read',
    'webhooks:write',
  ],
};

export function can(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(required);
  if (userLevel === -1 || requiredLevel === -1) {
    return false;
  }
  return userLevel >= requiredLevel;
}

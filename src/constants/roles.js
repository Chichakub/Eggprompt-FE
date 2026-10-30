export const SUPER_ADMIN = 'Super Admin';
export const FARM_ADMIN = 'Farm Admin';
export const FARM_STAFF = 'Farm Staff';
export const FINANCE_STAFF = 'Finance Staff';

export const ALL_ROLES = [SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF];

export function defaultPathFor(role) {
  switch (role) {
    case SUPER_ADMIN:
      return '/superadmin';
    case FARM_ADMIN:
      return '/farmadmin';
    case FARM_STAFF:
      return '/farmstaff';
    case FINANCE_STAFF:
      return '/financestaff';
    default:
      return '/login';
  }
}
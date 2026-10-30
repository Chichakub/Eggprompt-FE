import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

export function useRoleAccess() {
  const auth = useAuthStore();

  const canViewSummary = computed(() => auth.isSuperAdmin || auth.isFarmAdmin);

  const canManageUser = computed(() => auth.isSuperAdmin || auth.isFarmAdmin);

  const hasRole = (...roles) => roles.includes(auth.userRole);

  return { canViewSummary, canManageUser, hasRole };
}
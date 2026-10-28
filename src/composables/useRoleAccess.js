// src/composables/useRoleAccess.js
// ตาม diagram: canViewSummary, canManageUser

import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

export function useRoleAccess() {
  const auth = useAuthStore();

  // เห็นการ์ดสรุป (เช่น EggSummaryHeader) ได้เฉพาะ Farm Admin / Super Admin
  const canViewSummary = computed(() => auth.isSuperAdmin || auth.isFarmAdmin);

  // จัดการผู้ใช้งานได้เฉพาะ Farm Admin / Super Admin
  const canManageUser = computed(() => auth.isSuperAdmin || auth.isFarmAdmin);

  const hasRole = (...roles) => roles.includes(auth.userRole);

  return { canViewSummary, canManageUser, hasRole };
}
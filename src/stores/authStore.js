import { defineStore } from 'pinia';
import { authApi } from '@/services/api';
import { SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from '@/constants/roles';

const TOKEN_KEY = 'token';
const MOCK_KEY = 'mockRole'; // TODO: ลบตอนต่อ backend จริง

const MOCK_USERS = {
  [SUPER_ADMIN]: { user_id: 1, username: 'superadmin_farm', user_role: SUPER_ADMIN, farm_id: null },
  [FARM_ADMIN]: { user_id: 2, username: 'farmadmin_01', user_role: FARM_ADMIN, farm_id: 1 },
  [FARM_STAFF]: { user_id: 3, username: 'farmstaff_01', user_role: FARM_STAFF, farm_id: 1 },
  [FINANCE_STAFF]: { user_id: 4, username: 'finance_01', user_role: FINANCE_STAFF, farm_id: 1 },
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // refresh หน้าแล้ว role ปลอมยังอยู่
    user: MOCK_USERS[sessionStorage.getItem(MOCK_KEY)] ?? null,
    token: localStorage.getItem(TOKEN_KEY) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.user_role ?? null,
    isSuperAdmin() { return this.userRole === SUPER_ADMIN; },
    isFarmAdmin() { return this.userRole === FARM_ADMIN; },
    isFarmStaff() { return this.userRole === FARM_STAFF; },
    isFinanceStaff() { return this.userRole === FINANCE_STAFF; },
  },

  actions: {
    setSession({ token, user = null }) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
    },

    // TODO: ลบตอนต่อ backend จริง
    setMockRole(role) {
      this.user = MOCK_USERS[role];
      sessionStorage.setItem(MOCK_KEY, role);
    },

    async fetchProfile() {
      const res = await authApi.me();
      this.user = res.data.data;
      return this.user;
    },

    clearSession() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(MOCK_KEY);
    },

    async logout() {
      try { await authApi.logout(); } catch { /* ignore */ } finally { this.clearSession(); }
    },
  },
});
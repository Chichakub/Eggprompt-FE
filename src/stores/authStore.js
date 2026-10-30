import { defineStore } from 'pinia';
import { authApi } from '@/services/api';
import { SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from '@/constants/roles';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const MOCK_KEY = 'mockRole';

const MOCK_USERS = {
  [SUPER_ADMIN]: { user_id: 1, username: 'superadmin_farm', user_role: SUPER_ADMIN, farm_id: null },
  [FARM_ADMIN]: { user_id: 2, username: 'farmadmin_01', user_role: FARM_ADMIN, farm_id: 1 },
  [FARM_STAFF]: { user_id: 3, username: 'farmstaff_01', user_role: FARM_STAFF, farm_id: 1 },
  [FINANCE_STAFF]: { user_id: 4, username: 'finance_01', user_role: FINANCE_STAFF, farm_id: 1 },
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || 'null') 
          ?? MOCK_USERS[sessionStorage.getItem(MOCK_KEY)] 
          ?? null,
    token: localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.user_role ?? null,
    isFarmSetupRequired: (state) =>
    state.user?.user_role === FARM_ADMIN &&
    state.user?.farm_id == null,
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

    // เก็บ session หลังล็อกอิน: remember=true → localStorage, false → sessionStorage
    setLoginSession({ token, user }, remember = true) {
      const storage = remember ? localStorage : sessionStorage;
      const other = remember ? sessionStorage : localStorage;

      this.token = token;
      this.user = user;

      other.removeItem(TOKEN_KEY);
      other.removeItem(USER_KEY);
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    },

    // กู้ session หลัง refresh หน้า
    restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
      if (!token || !raw) return;
      try {
        this.token = token;
        this.user = JSON.parse(raw);
      } catch {
        /* ข้อมูลเสีย ปล่อยผ่าน */
      }
    },

    // ล้าง session ทั้งสอง storage
    clearLoginSession() {
      this.token = null;
      this.user = null;
      [TOKEN_KEY, USER_KEY].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    },

    setMockRole(role) {
      this.user = MOCK_USERS[role];
      sessionStorage.setItem(MOCK_KEY, role);
    },

    async fetchProfile() {
      const res = await authApi.me();
      const rawUser = res.data.data;
      
      // Map จาก camelCase ของ backend เป็น snake_case
      this.user = {
        user_id: rawUser.userId ?? rawUser.user_id,
        username: rawUser.username,
        user_role: rawUser.role ?? rawUser.user_role,
        farm_id: rawUser.farmId ?? rawUser.farm_id,
      };

      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(this.user));

      return this.user;
    },

    clearSession() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(MOCK_KEY);
    },

    async logout() {
      try { await authApi.logout(); } catch { /* ignore */ } finally { this.clearLoginSession(); }
    },
  },
});

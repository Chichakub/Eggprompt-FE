import { defineStore } from 'pinia';
import { authApi } from '@/services/api';
import { ALL_ROLES, SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from '@/constants/roles';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // ดึงค่าจาก Storage อย่างเดียว ไม่มี Fallback ไปหา Mock แล้ว
    user: null,
    token: null,
    profileLoaded: false,
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
    setSession(session) {
      this.setLoginSession(session);
    },

    // เก็บ session หลังล็อกอิน: remember=true → localStorage, false → sessionStorage
    setLoginSession({ token, user }, remember = true) {
      const storage = remember ? localStorage : sessionStorage;
      const other = remember ? sessionStorage : localStorage;

      this.profileLoaded = false;
      this.token = token;
      this.user = user;

      other.removeItem(TOKEN_KEY);
      other.removeItem(USER_KEY);
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    },

    restoreSession() {
        const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
        const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
        if (!token || !raw) {
            this.clearLoginSession();   // ข้อมูลไม่ครบ → ล้างทิ้ง กันสถานะค้าง
            return;
        }
        try {
            this.profileLoaded = false;
            this.token = token;
            this.user = JSON.parse(raw);
        } catch {
            this.clearLoginSession();
        }
    },

    // ล้าง session ทั้งสอง storage
    clearLoginSession() {
      this.profileLoaded = false;
      this.token = null;
      this.user = null;
      sessionStorage.removeItem('inspectedFarm');
      [TOKEN_KEY, USER_KEY].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    },

    // ดึงข้อมูล Profile ล่าสุดจาก API
    async fetchProfile() {
      const res = await authApi.me();
      const rawUser = res.data;
      if (!rawUser || !ALL_ROLES.includes(rawUser.role ?? rawUser.user_role)) {
        this.clearLoginSession();
        throw new Error('Invalid user profile');
      }

      // Map จาก camelCase ของ backend เป็น snake_case
      this.user = {
        user_id: rawUser.userId ?? rawUser.user_id,
        username: rawUser.username,
        user_role: rawUser.role ?? rawUser.user_role,
        farm_id: rawUser.farmId ?? rawUser.farm_id,
      };

      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(this.user));

      this.profileLoaded = true;
      return this.user;
    },

    // ใช้ตอนเรียก Logout
    async logout() {
      try {
        await authApi.logout();
      } catch {
        /* ignore */
      } finally {
        this.clearLoginSession();
      }
    },
  },
});

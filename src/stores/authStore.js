import { defineStore } from 'pinia';
import { authApi } from '@/services/api';
import { ALL_ROLES, SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from '@/constants/roles';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    profileLoaded: false,
    inspectedFarm: null,
    inspectionVerified: false,
  }),

  getters: {
    isInspecting: (state) => state.user?.user_role === SUPER_ADMIN && !!state.inspectedFarm,
    effectiveFarmId: (state) => state.user?.user_role === SUPER_ADMIN ? state.inspectedFarm?.farmId : state.user?.farm_id,
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
    inspectFarm(farm) {
      if (!this.isSuperAdmin) return;
      this.inspectedFarm = farm;
      this.inspectionVerified = true;
      sessionStorage.setItem('inspectedFarm', JSON.stringify({ userId: this.user?.user_id, farm }));
    },
    leaveInspection() {
      this.inspectedFarm = null;
      this.inspectionVerified = false;
      sessionStorage.removeItem('inspectedFarm');
    },
    setSession(session) {
      this.setLoginSession(session);
    },

    setLoginSession({ token, user }, remember = true) {
      this.leaveInspection();
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
            this.clearLoginSession(); 
            return;
        }
        try {
            this.profileLoaded = false;
            this.token = token;
            this.user = JSON.parse(raw);
            const saved = JSON.parse(sessionStorage.getItem('inspectedFarm') || 'null');
            if (this.isSuperAdmin && saved?.userId === this.user?.user_id && saved?.farm?.farmId) {
              this.inspectedFarm = saved.farm;
              this.inspectionVerified = false;
            } else this.leaveInspection();
        } catch {
            this.clearLoginSession(); 
        }
    },

    clearLoginSession() {
      this.leaveInspection();
      this.profileLoaded = false;
      this.token = null;
      this.user = null;
      sessionStorage.removeItem('inspectedFarm');
      [TOKEN_KEY, USER_KEY].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    },

    async fetchProfile() {
      const res = await authApi.me();
      const rawUser = res.data;
      if (!rawUser || !ALL_ROLES.includes(rawUser.role ?? rawUser.user_role)) {
        this.clearLoginSession(); 
        throw new Error('Invalid user profile');
      }
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

    // อัปเดต username ใน store + storage หลังแก้โปรไฟล์
    setUsername(username) {
      if (!this.user) return;
      this.user = { ...this.user, username };
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(this.user));
    },

    async logout() {
      try {
        await authApi.logout();
      } catch {
      } finally {
        this.clearLoginSession(); 
      }
    },
  },
});
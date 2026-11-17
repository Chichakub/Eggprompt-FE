import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const publicAuthPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  if (publicAuthPaths.some((path) => config.url?.endsWith(path))) {
    return config;
  }
  const auth = useAuthStore();
  if (auth.isInspecting && (!config.method || config.method.toLowerCase() === 'get')
      && /(?:admin\/users|v1\/houses)(?:[/?]|$)/.test(config.url || '')) {
    config.params = { ...config.params, farmId: auth.effectiveFarmId };
  }
  const token =
    useAuthStore().token ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isPublicAuthCall =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (status === 401 && !isPublicAuthCall) {
      useAuthStore().clearLoginSession();
    }
    if (status === 401 && !isPublicAuthCall) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("inspectedFarm");
      const loginPath = `${import.meta.env.BASE_URL}login`;
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  setupStatus: () => api.get("api/v1/farm-setup"),
  myFarm: () => api.get("api/v1/farms/me"),
  login: (payload) => api.post("api/v1/auth/login", payload),
  register: (payload) =>
    api.post("api/v1/auth/register", payload, {
      timeout: 15000,
    }),
  me: () => api.get("api/v1/auth/me"),
  logout: () => api.post("api/v1/auth/logout"),

  forgotPassword: (payload) =>
    api.post("api/v1/auth/forgot-password", payload, {
      timeout: 30000,
    }),

  resetPassword: (payload) =>
    api.post("api/v1/auth/reset-password", payload, {
      timeout: 15000,
    }),

  // PUT /v1/users/me — แก้ไขข้อมูลส่วนตัว
  updateMe: (payload) =>
    api.put("api/v1/users/me", payload, {
      timeout: 15000,
    }),

  changePassword: (payload) =>
    api.post("api/v1/auth/change-password", payload, {
    timeout: 15000,
  }),
};
export const userManagementApi = {
  list: (params) => api.get('api/v1/admin/users', { params }),
  create: (payload) => api.post('api/v1/admin/users', payload),
  update: (id, payload) => api.put(`api/v1/admin/users/${id}`, payload),
  remove: (id) => api.delete(`api/v1/admin/users/${id}`),
};

export const adminFarmApi = {
  list: (params) => api.get('api/v1/admin/farms', { params }),
  summary: () => api.get('api/v1/admin/farms/summary'),
  detail: (id) => api.get(`api/v1/admin/farms/${encodeURIComponent(id)}`),
};

export const farmApi = {
  updateAsAdmin: (id, payload) => api.put(`api/v1/admin/farms/${encodeURIComponent(id)}`, payload),
  updateOwn: (payload) => api.put("api/v1/farms/me", payload),
  create: (payload) => api.post("api/v1/farms", payload),
};

export const houseApi = {
  list: (params) => api.get("api/v1/houses", { params }),
  create: (payload) => api.post("api/v1/houses", payload),
  update: (id, payload) => api.put(`api/v1/houses/${id}`, payload),
  remove: (id) => api.delete(`api/v1/houses/${id}`),
};

export const flockApi = {
  create: (payload) => api.post("api/v1/flocks", payload),
};

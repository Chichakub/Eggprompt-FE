import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
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
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (payload) => api.post("/api/v1/auth/login", payload),
  register: (payload) =>
    api.post("/api/v1/auth/register", payload, {
      timeout: 15000,
    }),
  me: () => api.get("/api/v1/auth/me"),
  logout: () => api.post("/api/v1/auth/logout"),

  forgotPassword: (payload) =>
    api.post("/api/v1/auth/forgot-password", payload, {
      timeout: 30000,
    }),

  resetPassword: (payload) =>
    api.post("/api/v1/auth/reset-password", payload, {
      timeout: 15000,
    }),

  // PUT /v1/users/me — แก้ไขข้อมูลส่วนตัว
  updateMe: (payload) =>
    api.put("/api/v1/users/me", payload, {
      timeout: 15000,
    }),

  changePassword: (payload) =>
    api.post("/api/v1/auth/change-password", payload, {
    timeout: 15000,
  }),
};
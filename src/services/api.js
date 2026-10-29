// src/services/api.js
// axios instance + API calls (ตาม diagram: services/api.js)
//
// ตั้งค่าใน .env:  VITE_API_URL=http://localhost:3000

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import router from '@/router';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token หมดอายุ / ถูกปิดบัญชี → เคลียร์แล้วเด้งไปหน้า login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginCall = error.config?.url?.includes('/auth/login');

    if (status === 401 && !isLoginCall) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('inspectedFarm');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------
export const authApi = {
  login: (payload) => api.post('/api/v1/auth/login', payload), // { username, password }
  me: () => api.get('/api/v1/auth/me'), // C2-54
  logout: () => api.post('/api/v1/auth/logout'), // C2-53
};

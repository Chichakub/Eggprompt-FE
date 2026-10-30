import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (config.url?.endsWith('/auth/login')) return config;
  const token = useAuthStore().token || localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isPublicAuthCall =
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    if (status === 401 && !isLoginCall) {
      useAuthStore().clearLoginSession();
    }
    if (status === 401 && !isPublicAuthCall) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('inspectedFarm');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (payload) => api.post('/api/v1/auth/login', payload), 
   register: (payload) =>
    api.post('/api/v1/auth/register', payload, {
      timeout: 15000,
    }),
  me: () => api.get('/api/v1/auth/me'), 
  logout: () => api.post('/api/v1/auth/logout'), 
};

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; password?: string }) =>
    api.patch('/auth/me', data),
};

// Ads API
export const adsApi = {
  search: (params: any) => api.post('/ads/search', params),
  getByPage: (pageId: string, countries?: string[]) =>
    api.get(`/ads/page/${pageId}`, {
      params: { countries: countries?.join(',') },
    }),
  getPageInfo: (pageId: string) => api.get(`/ads/page-info/${pageId}`),
  getHistory: () => api.get('/ads/history'),
};

// Monitors API
export const monitorsApi = {
  getAll: () => api.get('/monitors'),
  create: (pageId: string, pageName?: string) =>
    api.post('/monitors', { pageId, pageName }),
  getOne: (id: string) => api.get(`/monitors/${id}`),
  update: (id: string, data: { isActive?: boolean; pageName?: string }) =>
    api.patch(`/monitors/${id}`, data),
  delete: (id: string) => api.delete(`/monitors/${id}`),
};

// Collections API
export const collectionsApi = {
  getAll: () => api.get('/collections'),
  create: (name: string, description?: string) =>
    api.post('/collections', { name, description }),
  getOne: (id: string) => api.get(`/collections/${id}`),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/collections/${id}`, data),
  delete: (id: string) => api.delete(`/collections/${id}`),
};

// Saved Ads API
export const savedAdsApi = {
  getAll: (params?: { collectionId?: string; tag?: string }) =>
    api.get('/saved-ads', { params }),
  save: (data: any) => api.post('/saved-ads', data),
  update: (id: string, data: any) => api.patch(`/saved-ads/${id}`, data),
  delete: (id: string) => api.delete(`/saved-ads/${id}`),
  check: (adArchiveId: string) => api.get(`/saved-ads/check/${adArchiveId}`),
  getTags: () => api.get('/saved-ads/tags'),
};

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/api';
import { toast } from '@/hooks/use-toast';
import { isTokenExpired } from '@/lib/auth-token';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipGlobalErrorToast?: boolean;
  }
  interface InternalAxiosRequestConfig {
    skipGlobalErrorToast?: boolean;
  }
}

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocalHost ? 'http://localhost:3000' : '/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT and correlation ID
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('zera_token');
  if (token) {
    if (isTokenExpired(token)) {
      localStorage.removeItem('zera_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return config;
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  const correlationId = crypto.randomUUID();
  config.headers['x-correlation-id'] = correlationId;
  return config;
});

// Response interceptor: global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const data = error.response?.data;
    const status = error.response?.status;
    const skipGlobalErrorToast = Boolean(error.config?.skipGlobalErrorToast);

    if (status === 401) {
      localStorage.removeItem('zera_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!skipGlobalErrorToast) {
      const message = data?.message || error.message || 'Erro inesperado';
      const correlationId = data?.correlationId;
      toast({
        title: 'Erro',
        description: correlationId ? `${message} (ID: ${correlationId})` : message,
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Instancia personalizada de Axios compartida en toda la app (DRY: la URL base
 * + los interceptors en un solo lugar). Todas las llamadas de red pasan por `api`.
 */
export const api = axios.create({
  baseURL: API_URL,
});

/**
 * La inyección del store evita un import circular (store -> slices -> api -> store).
 * main.tsx llama a injectStore(store) una vez al arrancar; los interceptors leen
 * entonces el estado global EN VIVO en el momento del request.
 */
let injectedStore: Store<RootState> | null = null;
export function injectStore(store: Store<RootState>) {
  injectedStore = store;
}

// INTERCEPTOR DE REQUEST: adjunta automáticamente X-Tenant-ID (del estado global) + JWT.
api.interceptors.request.use((config) => {
  const state = injectedStore?.getState();

  const tenant = state?.tenant.current;
  if (tenant) {
    // Enviamos el slug; el backend resuelve tanto el slug como el id.
    config.headers['X-Tenant-ID'] = tenant.slug || String(tenant.id);
  }

  const token = state?.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

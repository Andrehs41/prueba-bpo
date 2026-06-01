import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Custom Axios instance shared across the app (DRY: base URL + interceptors in
 * one place). All network calls go through `api`.
 */
export const api = axios.create({
  baseURL: API_URL,
});

/**
 * Store injection avoids a circular import (store -> slices -> api -> store).
 * main.tsx calls injectStore(store) once at startup; the interceptors then read
 * the LIVE global state at request time.
 */
let injectedStore: Store<RootState> | null = null;
export function injectStore(store: Store<RootState>) {
  injectedStore = store;
}

// REQUEST INTERCEPTOR: auto-attach X-Tenant-ID (from global state) + JWT.
api.interceptors.request.use((config) => {
  const state = injectedStore?.getState();

  const tenant = state?.tenant.current;
  if (tenant) {
    // Send the slug; the backend resolves either slug or id.
    config.headers['X-Tenant-ID'] = tenant.slug || String(tenant.id);
  }

  const token = state?.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

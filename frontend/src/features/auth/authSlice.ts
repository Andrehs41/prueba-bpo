import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { api } from '../../api/axios';
import { setTenant, Tenant } from '../tenant/tenantSlice';

export interface AuthUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface LoginResponse {
  token: string;
  user: AuthUser;
  tenant: Tenant;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'idle',
  error: null,
};

/**
 * login: authenticates against a specific tenant.
 * The tenant slug must already be in the store so the Axios interceptor can
 * attach X-Tenant-ID; we set it optimistically before firing the request.
 */
export const login = createAsyncThunk<
  LoginResponse,
  { tenantSlug: string; email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ tenantSlug, email, password }, { dispatch, rejectWithValue }) => {
  // Seed the tenant so the request interceptor can inject X-Tenant-ID.
  dispatch(setTenant({ id: 0, slug: tenantSlug, name: tenantSlug }));
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    // Replace the optimistic tenant with the authoritative one from the server.
    dispatch(setTenant(data.tenant));
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: string }>;
    return rejectWithValue(axiosErr.response?.data?.error ?? 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.status = 'idle';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Login failed';
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;

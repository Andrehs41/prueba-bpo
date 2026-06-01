import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tenant {
  id: number;
  slug: string;
  name: string;
}

interface TenantState {
  current: Tenant | null;
}

const initialState: TenantState = {
  current: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant(state, action: PayloadAction<Tenant>) {
      state.current = action.payload;
    },
    clearTenant(state) {
      state.current = null;
    },
  },
});

export const { setTenant, clearTenant } = tenantSlice.actions;
export default tenantSlice.reducer;

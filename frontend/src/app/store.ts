import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import tenantReducer from '../features/tenant/tenantSlice';
import recordsReducer from '../features/records/recordsSlice';
import { resetStore } from './resetAction';

const appReducer = combineReducers({
  auth: authReducer,
  tenant: tenantReducer,
  records: recordsReducer,
});

export type RootState = ReturnType<typeof appReducer>;

/**
 * Root reducer wrapper: when `resetStore` is dispatched, we pass `undefined`
 * state to every slice, so each one rebuilds its own initialState. This is the
 * single source of truth for wiping tenant-scoped data (anti data-bleeding).
 */
const rootReducer = (state: RootState | undefined, action: Action): RootState => {
  if (action.type === resetStore.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;

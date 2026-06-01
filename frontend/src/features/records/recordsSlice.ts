import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { api } from '../../api/axios';

export interface RecordItem {
  id: number;
  tenant_id: number;
  tenant_seq: number;
  name: string;
  amount: string;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface RecordsState {
  items: RecordItem[];
  pagination: Pagination;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: RecordsState = {
  items: [],
  pagination: { total: 0, limit: 10, offset: 0 },
  status: 'idle',
  error: null,
};

export const fetchRecords = createAsyncThunk<
  { data: RecordItem[]; pagination: Pagination },
  { limit?: number; offset?: number } | undefined,
  { rejectValue: string }
>('records/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/records', {
      params: { limit: params?.limit ?? 100, offset: params?.offset ?? 0 },
    });
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: string }>;
    return rejectWithValue(axiosErr.response?.data?.error ?? 'Failed to load records');
  }
});

export const createRecord = createAsyncThunk<
  RecordItem,
  { name: string; amount: number },
  { rejectValue: string }
>('records/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<RecordItem>('/records', payload);
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: string }>;
    return rejectWithValue(axiosErr.response?.data?.error ?? 'Failed to create record');
  }
});

const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load records';
      })
      .addCase(createRecord.fulfilled, (state, action) => {
        // Prepend the new record (list is ordered newest-first).
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      });
  },
});

export default recordsSlice.reducer;

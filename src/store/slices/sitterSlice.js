import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

export const fetchSitters = createAsyncThunk(
  'sitters/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/sitters${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch sitters');
    }
  }
);

export const fetchSitterById = createAsyncThunk(
  'sitters/fetchById',
  async (sitterId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/sitters/${sitterId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch sitter');
    }
  }
);

const sitterSlice = createSlice({
  name: 'sitters',
  initialState: {
    sitters: [],
    currentSitter: null,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSitters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSitters.fulfilled, (state, action) => {
        state.loading = false;
        state.sitters = action.payload;
      })
      .addCase(fetchSitters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSitterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSitterById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSitter = action.payload;
      })
      .addCase(fetchSitterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = sitterSlice.actions;
export default sitterSlice.reducer;

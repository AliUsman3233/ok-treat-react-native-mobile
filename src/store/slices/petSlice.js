import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

export const fetchPets = createAsyncThunk(
  'pets/fetchPets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/pets');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error);
    }
  }
);

export const createPet = createAsyncThunk(
  'pets/createPet',
  async (petData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(petData).forEach(key => {
        if (petData[key] !== null && petData[key] !== undefined) {
          formData.append(key, petData[key]);
        }
      });

      const response = await api.post('/pets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error);
    }
  }
);

export const updatePet = createAsyncThunk(
  'pets/updatePet',
  async ({ id, petData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(petData).forEach(key => {
        if (petData[key] !== null && petData[key] !== undefined) {
          formData.append(key, petData[key]);
        }
      });

      const response = await api.put(`/pets/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error);
    }
  }
);

export const deletePet = createAsyncThunk(
  'pets/deletePet',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/pets/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error);
    }
  }
);

const petSlice = createSlice({
  name: 'pets',
  initialState: {
    pets: [],
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
      .addCase(fetchPets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = action.payload;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPet.fulfilled, (state, action) => {
        state.loading = false;
        state.pets.push(action.payload);
      })
      .addCase(createPet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updatePet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePet.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.pets.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.pets[index] = action.payload;
        }
      })
      .addCase(updatePet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deletePet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePet.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = state.pets.filter(p => p.id !== action.payload);
      })
      .addCase(deletePet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearError } = petSlice.actions;
export default petSlice.reducer;

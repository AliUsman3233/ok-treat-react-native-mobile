import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  saveLanguage, 
  getLanguage, 
  setOnboardingCompleted, 
  isOnboardingCompleted 
} from '../../utils/storage';

/**
 * App Settings Slice
 * Manages app-wide settings like language and onboarding status
 */

// Async thunks for storage operations
export const loadAppSettings = createAsyncThunk(
  'app/loadSettings',
  async () => {
    const [language, onboardingCompleted] = await Promise.all([
      getLanguage(),
      isOnboardingCompleted(),
    ]);
    
    return {
      language: language || 'en-us', // Default to English (US)
      onboardingCompleted: onboardingCompleted || false,
    };
  }
);

export const setLanguage = createAsyncThunk(
  'app/setLanguage',
  async (language) => {
    await saveLanguage(language);
    return language;
  }
);

export const completeOnboarding = createAsyncThunk(
  'app/completeOnboarding',
  async () => {
    await setOnboardingCompleted();
    return true;
  }
);

const initialState = {
  language: 'en-us',
  onboardingCompleted: false,
  loading: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Synchronous actions if needed
    resetAppSettings: (state) => {
      state.language = 'en-us';
      state.onboardingCompleted = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load app settings
      .addCase(loadAppSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAppSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.language = action.payload.language;
        state.onboardingCompleted = action.payload.onboardingCompleted;
      })
      .addCase(loadAppSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Set language
      .addCase(setLanguage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setLanguage.fulfilled, (state, action) => {
        state.loading = false;
        state.language = action.payload;
      })
      .addCase(setLanguage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Complete onboarding
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.loading = false;
        state.onboardingCompleted = true;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { resetAppSettings } = appSlice.actions;
export default appSlice.reducer;

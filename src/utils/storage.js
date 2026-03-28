import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility for AsyncStorage operations
 * Handles all local storage interactions with proper error handling
 */

// Storage Keys
export const STORAGE_KEYS = {
  LANGUAGE: '@oktreat_language',
  ONBOARDING_COMPLETED: '@oktreat_onboarding_completed',
  USER_TOKEN: '@oktreat_user_token',
  USER_DATA: '@oktreat_user_data',
};

/**
 * Save data to AsyncStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 */
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    return false;
  }
};

/**
 * Get data from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Parsed value or null
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 * @param {string} key - Storage key
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
    return false;
  }
};

/**
 * Clear all AsyncStorage data
 */
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
    return false;
  }
};

/**
 * Save language preference
 * @param {string} language - Language code (e.g., 'en-us', 'en-uk')
 */
export const saveLanguage = async (language) => {
  return await saveData(STORAGE_KEYS.LANGUAGE, language);
};

/**
 * Get saved language preference
 * @returns {Promise<string|null>} Language code or null
 */
export const getLanguage = async () => {
  return await getData(STORAGE_KEYS.LANGUAGE);
};

/**
 * Mark onboarding as completed
 */
export const setOnboardingCompleted = async () => {
  return await saveData(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
};

/**
 * Check if onboarding is completed
 * @returns {Promise<boolean>} True if completed, false otherwise
 */
export const isOnboardingCompleted = async () => {
  const completed = await getData(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return completed === true;
};

/**
 * Reset onboarding status (for testing)
 */
export const resetOnboarding = async () => {
  return await removeData(STORAGE_KEYS.ONBOARDING_COMPLETED);
};

/**
 * Get auth token from Redux store (preferred) or AsyncStorage (fallback)
 * This is the single source of truth for token retrieval across all services.
 * @returns {Promise<string|null>} Auth token or null
 */
export const getAuthToken = async () => {
  try {
    // Try Redux store first
    const { default: store } = await import('../store');
    const state = store.getState();
    if (state.auth?.token) return state.auth.token;
  } catch (e) {
    // Store not ready
  }
  // Fallback to AsyncStorage
  const asyncToken = await AsyncStorage.getItem('authToken');
  return asyncToken;
};

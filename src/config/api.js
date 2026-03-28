/**
 * API Configuration
 * Central place for API endpoints and configuration
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Android device via USB cable with ADB reverse
// Run: adb reverse tcp:3000 tcp:3000
// Then use localhost

// API Base URL - Uses deployed backend; falls back to localhost for dev with ADB reverse
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://clownfish-app-xg4ap.ondigitalocean.app';

// API Endpoints
export const API_ENDPOINTS = {
  // Health check
  STATUS: `${API_BASE_URL}/api/status`,

  // Auth endpoints
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
  RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  VALIDATE_REFERRAL: (code) => `${API_BASE_URL}/api/auth/validate-referral/${code}`,
  REFERRAL_STATS: `${API_BASE_URL}/api/auth/referral-stats`,

  // User endpoints
  GET_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  UPDATE_AVATAR: `${API_BASE_URL}/api/users/avatar`,
  DELETE_ACCOUNT: `${API_BASE_URL}/api/users/profile`,

  // Pet endpoints (add later)
  // PETS: `${API_BASE_URL}/api/pets`,
};

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create shared axios instance
const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.headers,
});

// Add auth token interceptor
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // AsyncStorage not available yet
  }
  return config;
});

// Attach token expired interceptor to this instance
import { attachTokenInterceptor } from './axiosInterceptor';
attachTokenInterceptor(api);

export { API_BASE_URL };
export default api;

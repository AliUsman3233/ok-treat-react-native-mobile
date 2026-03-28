import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

const API_URL = API_BASE_URL;

// Shared axios instance created once at module level
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
authApi.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create a scan record
export const createScan = async (scanData) => {
  try {
    const response = await authApi.post('/api/scans', scanData);
    return response.data;
  } catch (error) {
    console.error('Create scan error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to record scan' };
  }
};

// Get all scans for user's pets
export const getUserScans = async () => {
  try {
    const response = await authApi.get('/api/scans/user');
    return response.data;
  } catch (error) {
    console.error('Get user scans error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch scans' };
  }
};

// Get scans for a specific pet
export const getPetScans = async (petId) => {
  try {
    const response = await authApi.get(`/api/scans/pet/${petId}`);
    return response.data;
  } catch (error) {
    console.error('Get pet scans error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch pet scans' };
  }
};

// Get scan statistics for a pet
export const getPetScanStats = async (petId) => {
  try {
    const response = await authApi.get(`/api/scans/pet/${petId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Get scan stats error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch scan statistics' };
  }
};

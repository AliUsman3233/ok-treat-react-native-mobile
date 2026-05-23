import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

const API_URL = API_BASE_URL + '/api';

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

// Create a new pet
export const createPet = async (petData) => {
  try {
    const response = await authApi.post('/pets', petData);
    return response.data;
  } catch (error) {
    console.error('Create pet error:', error.response?.data || error.message);
    throw error.response?.data || { status: 'error', message: error.message || 'Failed to create pet' };
  }
};

// Get all pets for the authenticated user
export const getUserPets = async () => {
  try {
    const response = await authApi.get('/pets');
    return response.data;
  } catch (error) {
    console.error('Get pets error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch pets' };
  }
};

// Get a single pet by ID
export const getPetById = async (petId) => {
  try {
    const response = await authApi.get(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    console.error('Get pet error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch pet' };
  }
};

// Update a pet
export const updatePet = async (petId, petData) => {
  try {
    const response = await authApi.put(`/pets/${petId}`, petData);
    return response.data;
  } catch (error) {
    console.error('Update pet error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to update pet' };
  }
};

// Delete a pet
export const deletePet = async (petId) => {
  try {
    const response = await authApi.delete(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    console.error('Delete pet error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to delete pet' };
  }
};

// Report pet as missing — body: { lastSeenAt, lastSeenLat?, lastSeenLng?, lastSeenAddress?, contactPhone, notes? }
export const reportPetMissing = async (petId, payload) => {
  try {
    const response = await authApi.post(`/pets/${petId}/report-missing`, payload);
    return response.data;
  } catch (error) {
    console.error('Report missing error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to report pet missing' };
  }
};

// Mark pet as safe (resolves active missing-pet report)
export const markPetSafe = async (petId) => {
  try {
    const response = await authApi.put(`/pets/${petId}/mark-safe`);
    return response.data;
  } catch (error) {
    console.error('Mark safe error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to mark pet safe' };
  }
};

// Fetch active missing-pet report for a pet (owner only)
export const getMissingReport = async (petId) => {
  try {
    const response = await authApi.get(`/pets/${petId}/missing-report`);
    return response.data;
  } catch (error) {
    console.error('Get missing report error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch missing report' };
  }
};

// Get pet by QR code (public endpoint - no auth needed)
export const getPetByQRCode = async (qrCode) => {
  try {
    const response = await axios.get(`${API_URL}/pets/qr/${qrCode}`);
    return response.data;
  } catch (error) {
    console.error('Get pet by QR error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch pet by QR code' };
  }
};

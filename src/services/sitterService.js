import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

// Submit sitter application
export const submitSitterApplication = async () => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${API_BASE_URL}/api/sitter/submit`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Submit sitter application error:', error.response?.data || error.message);
    throw error;
  }
};

// Get sitter profile
export const getSitterProfile = async () => {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${API_BASE_URL}/api/sitter/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get sitter profile error:', error.response?.data || error.message);
    throw error;
  }
};

// Get sitter status
export const getSitterStatus = async () => {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${API_BASE_URL}/api/sitter/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get sitter status error:', error.response?.data || error.message);
    throw error;
  }
};

// Update sitter profile
export const updateSitterProfile = async (updates) => {
  try {
    const token = await getAuthToken();

    const response = await axios.put(
      `${API_BASE_URL}/api/sitter/profile`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Update sitter profile error:', error.response?.data || error.message);
    throw error;
  }
};

// Get nearby sitters within a radius
export const getNearbySitters = async (latitude, longitude, radius = 30) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/api/sitter/nearby`, {
      params: {
        latitude,
        longitude,
        radius
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get nearby sitters error:', error.response?.data || error.message);
    throw error;
  }
};

// Search sitters by service type and availability
export const searchSitters = async (serviceType, latitude, longitude, startDate, endDate, radius = 30) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/api/sitter/search`, {
      params: {
        serviceType,
        latitude,
        longitude,
        startDate,
        endDate,
        radius
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Search sitters error:', error.response?.data || error.message);
    throw error;
  }
};

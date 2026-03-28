import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/auth/profile`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error.message);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    throw error;
  }
};

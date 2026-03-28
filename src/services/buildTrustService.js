import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

// Get all build trust sections status
export const getBuildTrustStatus = async () => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await axios.get(`${API_BASE_URL}/api/build-trust`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get build trust status error:', error.response?.data || error.message);
    throw error;
  }
};

// Get specific build trust section
export const getBuildTrustSection = async (sectionType) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/api/build-trust/${sectionType}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get build trust section error:', error.response?.data || error.message);
    throw error;
  }
};

// Create or update build trust section
export const upsertBuildTrustSection = async (sectionType, settings, isCompleted = false) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/build-trust`,
      {
        sectionType,
        settings,
        isCompleted
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Upsert build trust section error:', error.response?.data || error.message);
    throw error;
  }
};

// Delete build trust section
export const deleteBuildTrustSection = async (sectionType) => {
  try {
    const token = await getAuthToken();
    const response = await axios.delete(`${API_BASE_URL}/api/build-trust/${sectionType}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Delete build trust section error:', error.response?.data || error.message);
    throw error;
  }
};

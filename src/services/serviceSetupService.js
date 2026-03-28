import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

const API_URL = API_BASE_URL;

// Get all service setups
export const getServiceSetups = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_URL}/api/service-setups`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get service setups' };
  }
};

// Get specific service setup
export const getServiceSetup = async (serviceType) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_URL}/api/service-setups/${serviceType}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get service setup' };
  }
};

// Create or update service setup
export const upsertServiceSetup = async (serviceType, settings, isCompleted = false) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/api/service-setups`,
      {
        serviceType,
        settings,
        isCompleted
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save service setup' };
  }
};

// Delete service setup
export const deleteServiceSetup = async (serviceType) => {
  try {
    const token = await getAuthToken();
    const response = await axios.delete(
      `${API_URL}/api/service-setups/${serviceType}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete service setup' };
  }
};

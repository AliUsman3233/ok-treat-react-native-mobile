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

// Mark the "You're approved!" congrats dialog as seen. Server-persisted so it
// never shows again on any device. Non-fatal on failure (worst case: shown
// once more next time).
export const markSitterApprovalSeen = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/sitter/approval-seen`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Mark approval seen error:', error.response?.data || error.message);
    return null;
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

// Search sitters by service type and availability. For hour-based
// services (Drop-In, Day Care, Pet Walking), pass startTime + endTime
// as "HH:mm" strings and the backend also filters by the sitter's
// dailyStartTime/dailyEndTime window.
export const searchSitters = async (
  serviceType,
  latitude,
  longitude,
  startDate,
  endDate,
  radius = 30,
  startTime,
  endTime,
) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/api/sitter/search`, {
      params: {
        serviceType,
        latitude,
        longitude,
        startDate,
        endDate,
        radius,
        // Only sent when the caller has a time window (hour-based flows).
        // Backend ignores these params when absent.
        startTime,
        endTime,
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

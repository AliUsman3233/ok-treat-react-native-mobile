import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

const API_URL = API_BASE_URL;

// Get Stripe publishable key
export const getPublishableKey = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/stripe/publishable-key`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get publishable key' };
  }
};

// Note: Card tokenization is now done via @stripe/stripe-react-native SDK on-device.
// The createPaymentMethod from useStripe() hook handles this securely.
// Only the paymentMethod.id is sent to the backend.

// Verify card with backend using payment method ID (tokenized by Stripe SDK)
export const verifyCard = async (paymentMethodId) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/api/stripe/verify-card`,
      { paymentMethodId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify card' };
  }
};

export const getVerificationStatus = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_URL}/api/stripe/verification-status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get verification status' };
  }
};

// Mock verification (for testing without Stripe)
export const mockVerification = async () => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${API_URL}/api/stripe/mock-verify`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Mock verification service error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to mock verify' };
  }
};

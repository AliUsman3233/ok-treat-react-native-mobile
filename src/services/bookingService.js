import api from '../config/api';

// ========== USER BOOKING ENDPOINTS ==========

// Get all bookings for the authenticated user (pet owner)
export const getUserBookings = async (status) => {
  try {
    const params = {};
    if (status) params.status = status;
    const response = await api.get('/bookings', { params });
    return response.data;
  } catch (error) {
    console.error('Get user bookings error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Create booking error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to create booking' };
  }
};

// Update booking status (accept/reject/cancel)
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update booking status error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to update booking status' };
  }
};

// ========== SITTER BOOKING ENDPOINTS ==========

// Get bookings for the sitter
export const getSitterBookings = async (status) => {
  try {
    const params = {};
    if (status) params.status = status;
    const response = await api.get('/bookings/sitter', { params });
    return response.data;
  } catch (error) {
    console.error('Get sitter bookings error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch sitter bookings' };
  }
};

// Get sitter earnings data
export const getSitterEarnings = async () => {
  try {
    const response = await api.get('/sitter/earnings');
    return response.data;
  } catch (error) {
    console.error('Get sitter earnings error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch earnings' };
  }
};

// Get sitter transactions list
export const getSitterTransactions = async () => {
  try {
    const response = await api.get('/sitter/transactions');
    return response.data;
  } catch (error) {
    console.error('Get sitter transactions error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch transactions' };
  }
};

// Get sitter pending requests
export const getSitterRequests = async () => {
  try {
    const response = await api.get('/sitter/requests');
    return response.data;
  } catch (error) {
    console.error('Get sitter requests error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch requests' };
  }
};

// Get sitter calendar bookings for a date range
export const getSitterCalendar = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/sitter/calendar', { params });
    return response.data;
  } catch (error) {
    console.error('Get sitter calendar error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch calendar data' };
  }
};

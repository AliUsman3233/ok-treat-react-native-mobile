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

// Create a new booking. Normalizes the error so the screen can show a proper,
// case-specific message: preserves HTTP status + backend message/reason, and
// flags no-response (network/timeout) distinctly from a server error.
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Create booking error:', error.response?.data || error.message);
    if (error.response) {
      const d = error.response.data || {};
      throw {
        status: error.response.status,
        message: d.message,
        reason: d.reason,
        expected: d.expected,
        error: d.error, // server-side detail (test mode)
      };
    }
    // No response → the request never reached the server (offline / timeout).
    throw { status: 0, isNetwork: true, message: 'Could not reach the server.' };
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

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Cancel booking error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to cancel booking' };
  }
};

// Sitter marks a booking as completed (service delivered). Stamps
// completionRequestedAt and asks the owner to confirm — does not pay yet.
export const markBookingCompleted = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Mark booking completed error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to mark booking as completed' };
  }
};

// Owner confirms a booking was completed → releases the sitter's earnings.
export const confirmBookingCompletion = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/confirm-completion`);
    return response.data;
  } catch (error) {
    console.error('Confirm booking completion error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to confirm booking completion' };
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

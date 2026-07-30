import api from '../config/api';

// Block a user — hides their messages and prevents further contact.
export const blockUser = async (userId) => {
  const res = await api.post('/users/block', { userId });
  return res.data;
};

export const unblockUser = async (userId) => {
  const res = await api.delete(`/users/block/${userId}`);
  return res.data;
};

export const getBlockedUsers = async () => {
  const res = await api.get('/users/blocked');
  return res.data;
};

// Report a user. reason is required; details/context optional.
export const reportUser = async ({ userId, reason, details, context }) => {
  const res = await api.post('/users/report', { userId, reason, details, context });
  return res.data;
};

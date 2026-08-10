import api from '../config/api';

// Whether to show the "were you invited?" prompt for this user.
export const getReferralPromptStatus = async () => {
  const res = await api.get('/users/referral-prompt-status');
  return res.data?.data?.show === true;
};

// Redeem a referral code after signup (Google/Apple/email or skipped-at-signup).
export const redeemReferral = async (code) => {
  const res = await api.post('/users/redeem-referral', { code });
  return res.data;
};

// User tapped "I wasn't invited" — never show the prompt again.
export const dismissReferralPrompt = async () => {
  const res = await api.post('/users/dismiss-referral-prompt');
  return res.data;
};

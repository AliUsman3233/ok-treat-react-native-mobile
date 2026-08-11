import api from '../config/api';

export const getCashoutConfig = async () => {
  const res = await api.get('/payouts/config');
  return res.data?.data;
};

export const getMyWithdrawals = async () => {
  const res = await api.get('/payouts/withdrawals');
  return res.data?.data?.withdrawals || [];
};

export const createWithdrawal = async ({ amountCoins, documents, method = 'BANK' }) => {
  const res = await api.post('/payouts/withdrawals', { amountCoins, documents, method });
  return res.data;
};

export const startConnectOnboarding = async () => {
  const res = await api.post('/payouts/connect/onboard');
  return res.data?.data?.url;
};

export const proceedWithdrawal = async (id) => {
  const res = await api.post(`/payouts/withdrawals/${id}/proceed`);
  return res.data;
};

// Fee breakdown mirroring the server (utils/payout.js). All values in cents.
export const computeBreakdown = (amountCoins, settings) => {
  const coinsPerDollar = settings?.coinsPerDollar || 1;
  const grossCents = Math.round((amountCoins / coinsPerDollar) * 100);
  const flatFeeCents = Math.max(0, Math.round(settings?.flatFeeCents || 0));
  const percentFeeCents = Math.round(grossCents * ((settings?.feePercent || 0) / 100));
  const totalFeeCents = flatFeeCents + percentFeeCents;
  const netCents = Math.max(0, grossCents - totalFeeCents);
  return { grossCents, flatFeeCents, percentFeeCents, totalFeeCents, netCents };
};

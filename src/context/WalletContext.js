// Single source of truth for the logged-in user's wallet state on mobile.
// Lives one level inside the auth boundary (since /coins/wallet-summary
// requires auth) — provider is mounted in RootNavigator after the user is
// logged in, OR safely no-ops by returning null fields when there's no
// token. Screens consume via useWallet().
//
// Refresh policy:
//   - Auto-loads when the provider mounts
//   - Screens may call refresh() on focus or after an action that changes
//     balance (purchase, booking, refund). The Stripe purchase + booking
//     flows already call refresh.
//   - Polling: there's no automatic poll. Webhook latency from Stripe
//     means the post-purchase poll loop in ShopCoinsScreen is the only
//     time we hammer the endpoint.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_WALLET = {
  role: null, // 'sitter' | 'owner' | null (not loaded)
  coinBalance: 0,
  purchasedCoinBalance: 0,
  earnedCoinBalance: 0,
  upcomingEarnings: 0,
  processingPayments: 0,
};

const WalletContext = createContext({
  ...DEFAULT_WALLET,
  loading: false,
  error: null,
  refresh: async () => {},
});

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      // Skip when not logged in — endpoint would 401 otherwise.
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setWallet(DEFAULT_WALLET);
        setError(null);
        return;
      }

      setLoading(true);
      const response = await api.get('/coins/wallet-summary');
      const data = response.data?.data || response.data || {};
      setWallet({
        role: data.role || null,
        coinBalance: Number(data.coinBalance || 0),
        purchasedCoinBalance: Number(data.purchasedCoinBalance || 0),
        earnedCoinBalance: Number(data.earnedCoinBalance || 0),
        upcomingEarnings: Number(data.upcomingEarnings || 0),
        processingPayments: Number(data.processingPayments || 0),
      });
      setError(null);
    } catch (err) {
      // 401 is expected pre-login; treat silently. Other errors surface.
      if (err?.response?.status !== 401) {
        console.warn('Wallet refresh error:', err?.message);
        setError(err?.message || 'Failed to load wallet');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ ...wallet, loading, error, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

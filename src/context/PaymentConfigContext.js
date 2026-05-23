// Fetches and caches the active Stripe mode + publishable key from the
// backend. The publishable key is what Stripe's React Native SDK needs to
// tokenize cards — it must be set on StripeProvider before any payment UI
// mounts.
//
// Why fetch instead of bake-in: the admin toggle on the Coins page lets
// the operator flip test/live at runtime. By fetching at startup we get
// the right key for whichever mode is active, without rebuilding the app.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const PaymentConfigContext = createContext({
  mode: null,
  publishableKey: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function PaymentConfigProvider({ children }) {
  const [mode, setMode] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // This endpoint is intentionally public — publishable keys are safe
      // to expose, and the StripeProvider needs to mount before login.
      const response = await fetch(`${API_BASE_URL}/api/coins/config`);
      const json = await response.json();
      const data = json?.data || json;
      setMode(data?.mode || null);
      setPublishableKey(data?.publishableKey || null);
      if (!data?.publishableKey) {
        // Backend returned 503-with-data when env vars are missing on the
        // server — keep mode but flag the missing key so screens can show
        // a friendly "payments unavailable" state instead of crashing.
        setError(json?.message || 'Stripe publishable key not configured on server');
      }
    } catch (e) {
      console.warn('Failed to load Stripe config:', e?.message);
      setError(e?.message || 'Failed to load payment config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PaymentConfigContext.Provider
      value={{ mode, publishableKey, loading, error, refresh: load }}
    >
      {children}
    </PaymentConfigContext.Provider>
  );
}

export function usePaymentConfig() {
  return useContext(PaymentConfigContext);
}

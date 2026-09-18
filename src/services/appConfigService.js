import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

// Remote app config (admin-editable via /api/app/config). Fetched on launch.
// Keep these defaults in sync with the backend's DEFAULT_APP_CONFIG so the app
// still has sensible values before the first fetch / when offline.
const CACHE_KEY = 'app_remote_config';

export const DEFAULT_REMOTE_CONFIG = {
  amazonTagsUrl: '',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.oktreat.app',
  appStoreUrl: 'https://apps.apple.com/us/app/oktreat-pet-sitting-boarding/id6479255523',
  supportEmail: '',
  supportPhone: '',
};

// Last cached config (or defaults) — instantly available for first paint/offline.
export async function getCachedAppConfig() {
  try {
    const s = await AsyncStorage.getItem(CACHE_KEY);
    if (s) return { ...DEFAULT_REMOTE_CONFIG, ...JSON.parse(s) };
  } catch (e) {
    // ignore — fall through to defaults
  }
  return DEFAULT_REMOTE_CONFIG;
}

// Fetch fresh config, cache it, return it. Fail-open: on any error/timeout,
// returns the last cached values (or defaults) so launch is never blocked.
export async function fetchAppConfig() {
  try {
    const res = await api.get('/app/config', { timeout: 6000 });
    const cfg = res.data?.data;
    if (cfg && typeof cfg === 'object') {
      const merged = { ...DEFAULT_REMOTE_CONFIG, ...cfg };
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      } catch (e) {
        // cache write failure is non-fatal
      }
      return merged;
    }
  } catch (e) {
    // network/timeout — fall back to cache
  }
  return getCachedAppConfig();
}

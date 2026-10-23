import * as Location from 'expo-location';
import axios from 'axios';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { getAuthToken, getData, saveData } from '../utils/storage';

// Key for the one-time explanation shown before we ask for location, so the
// user understands WHY we want it (and we record that they were informed via
// `consent: true` -> backend locationConsentAt).
const NOTICE_KEY = 'location_notice_seen';

async function showOneTimeNotice() {
  const seen = await getData(NOTICE_KEY).catch(() => null);
  if (seen) return;
  await new Promise((resolve) => {
    Alert.alert(
      'Help find lost pets near you',
      'OkTreat uses your location to alert you when a pet goes missing nearby, and to find sitters near you. Your approximate location is stored only for these alerts — it is never shown to other users.',
      [{ text: 'OK', onPress: () => resolve() }],
      { cancelable: false },
    );
  });
  await saveData(NOTICE_KEY, '1').catch(() => {});
}

/**
 * Capture the user's current location and sync it to the backend so they can
 * receive "missing pet near you" alerts.
 *
 * - Only runs for a logged-in user (needs the auth token).
 * - `promptIfNeeded: true` shows a one-time explanation + the OS permission
 *   prompt when permission isn't granted yet. Pass false on cold start to sync
 *   silently only if permission was already granted (no nagging).
 *
 * Best-effort and fire-and-forget: any failure just means this device doesn't
 * update its location right now. Returns the coords on success, else null.
 */
export const syncUserLocation = async ({ promptIfNeeded = false } = {}) => {
  try {
    const authToken = await getAuthToken();
    if (!authToken) return null;

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (!promptIfNeeded) return null;
      await showOneTimeNotice();
      ({ status } = await Location.requestForegroundPermissionsAsync());
      if (status !== 'granted') return null;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const latitude = pos?.coords?.latitude;
    const longitude = pos?.coords?.longitude;
    if (latitude == null || longitude == null) return null;

    await axios.put(
      `${API_BASE_URL}/api/auth/location`,
      { latitude, longitude, consent: true },
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    return { latitude, longitude };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('syncUserLocation failed:', e?.response?.status || e?.message);
    return null;
  }
};

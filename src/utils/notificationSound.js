// Lightweight wrapper for playing the OkTreat notification chime
// when the app is in the foreground and a real-time socket event
// delivers a new notification.
//
// Background pushes have their own sound (set on the Expo push payload
// + the Android default-channel sound) — see backend/src/services/pushService.js
// and frontend App.js channel registration.

import { Audio } from 'expo-av';

let cachedSound = null;
let isLoading = false;

// Lazy-load on first play. Loading takes ~50ms on a real device which
// is fine; subsequent plays reuse the same Sound instance.
async function ensureLoaded() {
  if (cachedSound) return cachedSound;
  if (isLoading) {
    // Another caller is already loading — wait for it
    while (isLoading) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 30));
    }
    return cachedSound;
  }
  isLoading = true;
  try {
    // Allow audio to play even when the device is in silent mode (iOS).
    // On Android the channel's sound setting governs the system push
    // sound; this only affects the in-app foreground chime we play here.
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/notification.mp3'),
      { shouldPlay: false, volume: 0.8 }
    );
    cachedSound = sound;
    return sound;
  } catch (e) {
    // eslint-disable-next-line no-console
    if (__DEV__) console.warn('[notificationSound] load failed:', e?.message);
    return null;
  } finally {
    isLoading = false;
  }
}

/**
 * Play the OkTreat notification chime. Safe to call repeatedly —
 * subsequent calls rewind and replay without reloading the file.
 */
export async function playNotificationSound() {
  try {
    const sound = await ensureLoaded();
    if (!sound) return;
    // Rewind so consecutive notifications all chime audibly instead of
    // a no-op on a sound that already finished playing.
    await sound.setPositionAsync(0).catch(() => {});
    await sound.playAsync();
  } catch (e) {
    // eslint-disable-next-line no-console
    if (__DEV__) console.warn('[notificationSound] play failed:', e?.message);
  }
}

/**
 * Optional cleanup helper — call from app shutdown if needed.
 */
export async function unloadNotificationSound() {
  if (cachedSound) {
    try { await cachedSound.unloadAsync(); } catch {}
    cachedSound = null;
  }
}

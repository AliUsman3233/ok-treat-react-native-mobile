import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import api from '../config/api';

// Web client ID from the ok-trear GCP project (#421263250507). Google Sign-In
// requires a matching Android OAuth client (package com.oktreat.app + the
// build's SHA-1) in this SAME project, or it throws DEVELOPER_ERROR. Backend
// audience accepts this ID (auth.controller.js).
const GOOGLE_WEB_CLIENT_ID = '421263250507-ilfka1ik8v6agv226ot6a8u6mf7sj4hs.apps.googleusercontent.com';

// iOS needs its own OAuth client ID (or a GoogleService-Info.plist), and the
// ok-trear project has neither yet. configure() dispatches a native promise
// without catching it, so calling it on iOS with no client ID rejects and
// redboxes the app at startup. Skip it there until this is filled in;
// signInWithGoogle() reports the gap when the user actually taps sign-in.
const GOOGLE_IOS_CLIENT_ID = null;

const isGoogleSignInConfigured =
  Platform.OS !== 'ios' || !!GOOGLE_IOS_CLIENT_ID;

// Configure Google Sign-In (call once at app startup)
if (isGoogleSignInConfigured) {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });
}

/**
 * Hook-like export for compatibility with existing screens.
 * Since native sign-in doesn't need useAuthRequest,
 * we return a simple interface that the screens can use.
 */
export const useGoogleAuth = () => {
  return {
    request: true, // Always ready (no web request needed)
    response: null, // Not used with native sign-in
    promptAsync: null, // Not used — screens call signInWithGoogle directly
  };
};

/**
 * Trigger native Google Sign-In and send the ID token to backend.
 * Returns the backend response with token + user data.
 */
export const signInWithGoogle = async () => {
  if (!isGoogleSignInConfigured) {
    throw { message: 'Google Sign-In is not set up for iOS yet' };
  }

  try {
    await GoogleSignin.hasPlayServices();
    // Sign out first so the account picker always shows
    try { await GoogleSignin.signOut(); } catch (_) {}
    const signInResult = await GoogleSignin.signIn();

    // Get the ID token
    const idToken = signInResult?.data?.idToken;

    if (!idToken) {
      throw { message: 'Failed to get ID token from Google' };
    }

    // Send to backend
    const response = await api.post('/auth/google-signin', { idToken });
    return response.data;
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw { message: 'Sign-in cancelled' };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw { message: 'Sign-in already in progress' };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw { message: 'Google Play Services not available' };
    }
    throw error.response?.data || error;
  }
};

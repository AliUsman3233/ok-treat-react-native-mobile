import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import api from '../config/api';

/**
 * Sign in with Apple is iOS-only. On Android (or an iOS device that doesn't
 * support it) this resolves false so screens can hide the button.
 */
export const isAppleSignInAvailable = async () => {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (e) {
    return false;
  }
};

/**
 * Trigger native Apple Sign-In and send the identity token to the backend.
 * Apple returns the user's name only on the FIRST sign-in, so we forward it
 * when present; the backend keys the account on the Apple user id (sub).
 * Returns the backend response with token + user data.
 */
export const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken, fullName, email } = credential;
    if (!identityToken) {
      throw { message: 'Failed to get Apple identity token' };
    }

    const name = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim()
      : undefined;

    const response = await api.post('/auth/apple-signin', {
      identityToken,
      fullName: name || undefined,
      email: email || undefined,
    });
    return response.data;
  } catch (error) {
    // User dismissed the native Apple sheet.
    if (error?.code === 'ERR_REQUEST_CANCELED' || error?.code === 'ERR_CANCELED') {
      throw { message: 'Sign-in cancelled' };
    }
    throw error.response?.data || error;
  }
};

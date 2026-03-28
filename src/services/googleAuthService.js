import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import api from '../config/api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_CLIENT_ID = '1046755845088-u5u1n17n3887b4pfogr08lct64e2ljqo.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID = '1046755845088-9o63airc9agiipiplfcs6p9o67sc4cuv.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};

export const signInWithGoogle = async (idToken) => {
  try {
    const response = await api.post('/auth/google-signin', { idToken });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Google sign-in failed' };
  }
};

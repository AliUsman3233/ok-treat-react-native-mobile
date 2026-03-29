import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../store';
import { logout } from '../store/slices/authSlice';
import { STORAGE_KEYS } from '../utils/storage';

let navigationRef = null;
let tokenExpiredHandler = null;
let isTokenExpiredShown = false;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

export const setTokenExpiredModalHandler = (handler) => {
  tokenExpiredHandler = handler;
};

// Call this when user taps "Login Again" in the modal
export const handleTokenExpiredAction = async () => {
  isTokenExpiredShown = false;

  // Clear storage
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (e) {}

  // Clear Redux
  store.dispatch(logout());

  // Reset navigation to Auth screen with no back stack
  if (navigationRef) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  }
};

// Attach response interceptor to any axios instance
export const attachTokenInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response) {
        const { status, data } = error.response;

        const isTokenError =
          status === 401 ||
          data?.message === 'Token expired' ||
          data?.message === 'Invalid token' ||
          data?.message === 'No token provided' ||
          data?.message === 'jwt expired';

        if (isTokenError && !isTokenExpiredShown) {
          isTokenExpiredShown = true;

          // Show the modal via App.js handler
          if (tokenExpiredHandler) {
            tokenExpiredHandler();
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

// Legacy export for backward compatibility
export const setupAxiosInterceptor = () => {
  // The interceptor is now attached per-instance via attachTokenInterceptor
};

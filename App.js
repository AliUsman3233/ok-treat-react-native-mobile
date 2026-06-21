import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as Notifications from 'expo-notifications';
import Icon from '@expo/vector-icons/Ionicons';
import { useFonts, Kodchasan_500Medium } from '@expo-google-fonts/kodchasan';
import { Lexend_300Light } from '@expo-google-fonts/lexend';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { setNavigationRef, setTokenExpiredModalHandler, handleTokenExpiredAction } from './src/config/axiosInterceptor';
import { registerForPushNotifications } from './src/services/notificationService';
import { initI18n } from './src/i18n';
import { getLanguage } from './src/utils/storage';
import { AlertProvider } from './src/context/AlertContext';
import { PaymentConfigProvider, usePaymentConfig } from './src/context/PaymentConfigContext';
import { WalletProvider } from './src/context/WalletContext';

// Set up notification handler at top level (outside component)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navigationRef = useRef();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);

  // Load custom Google Fonts used on the onboarding screen.
  // Other screens use system-fallback font names ('Poppins', 'Avenir LT Std')
  // and aren't affected by whether this hook resolves.
  const [fontsLoaded] = useFonts({
    Kodchasan_500Medium,
    Lexend_300Light,
  });

  // Load saved language → init i18next. Done once at startup so every
  // useTranslation() call resolves synchronously after this point.
  useEffect(() => {
    (async () => {
      const saved = await getLanguage().catch(() => null);
      await initI18n(saved).catch((e) => {
        // Init failure is non-fatal — i18n falls back to keys, the app
        // still renders with English defaults from the JSON.
        console.warn('i18n init failed:', e?.message);
      });
      setI18nReady(true);
    })();
  }, []);

  useEffect(() => {
    // Set token expired modal handler (only once)
    setTokenExpiredModalHandler(() => {
      setShowSessionExpired(true);
    });

    // Register for push notifications + sync token to backend.
    // No-ops if the user isn't logged in yet (auth-token call is gated).
    // Login screens call this again post-auth so a new login picks up the token.
    registerForPushNotifications();

    // Hide browser's default password reveal button on web
    let webStyle = null;
    if (Platform.OS === 'web') {
      webStyle = document.createElement('style');
      webStyle.textContent = `
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-contacts-auto-fill-button {
          visibility: hidden;
          pointer-events: none;
          position: absolute;
          right: 0;
        }
      `;
      document.head.appendChild(webStyle);
    }

    // Cleanup
    return () => {
      setTokenExpiredModalHandler(null);
      if (webStyle && Platform.OS === 'web') {
        document.head.removeChild(webStyle);
      }
    };
  }, []);

  const handleLoginAgain = async () => {
    setShowSessionExpired(false);
    await handleTokenExpiredAction();
  };

  // Render a tiny spinner until fonts AND i18n are ready. Without this the
  // first paint of OnboardingScreen would briefly show system-fallback text
  // or untranslated keys.
  if (!fontsLoaded || !i18nReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#32A6D8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaymentConfigProvider>
        <StripeWrapper>
          <WalletProvider>
            <Provider store={store}>
              <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                  // Set navigation reference for axios interceptor
                  setNavigationRef(navigationRef.current);
                }}
                onUnhandledAction={(action) => {
                  // Fires when a NAVIGATE / REPLACE / PUSH target isn't found
                  // in any active navigator. Default RN behavior prints a red
                  // dev warning + silent no-op in prod, leaving the user
                  // staring at the same screen with no feedback. Show a
                  // graceful native alert instead so the issue is visible.
                  const name = action?.payload?.name || 'screen';
                  const msg = `Couldn't open "${name}". This screen may have moved or doesn't exist yet.`;
                  if (__DEV__) {
                    // eslint-disable-next-line no-console
                    console.warn('[Nav] Unhandled action:', JSON.stringify(action));
                  }
                  Alert.alert('Unable to open', msg);
                }}
              >
                <AlertProvider>
                  <RootNavigator />
                </AlertProvider>
                <StatusBar style="auto" />
              </NavigationContainer>

            {/* Session Expired Modal */}
            <Modal
              visible={showSessionExpired}
              transparent
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => {}}
            >
              <View style={appStyles.overlay}>
                <View style={appStyles.dialog}>
                  <View style={appStyles.iconCircle}>
                    <Icon name="time-outline" size={36} color="#FFFFFF" />
                  </View>
                  <Text style={appStyles.title}>Session Expired</Text>
                  <Text style={appStyles.message}>
                    Your session has expired. Please login again to continue.
                  </Text>
                  <TouchableOpacity style={appStyles.button} onPress={handleLoginAgain} activeOpacity={0.8}>
                    <Text style={appStyles.buttonText}>Login Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </Provider>
          </WalletProvider>
        </StripeWrapper>
      </PaymentConfigProvider>
    </SafeAreaProvider>
  );
}

// StripeProvider with publishable key fetched at runtime from /api/coins/config.
// Re-mounts (key={publishableKey}) when the key changes so a server-side mode
// flip propagates without a full app restart.
function StripeWrapper({ children }) {
  const { publishableKey } = usePaymentConfig();
  // Pass an empty string while the key is loading — SDK no-ops payment APIs
  // until a real key is supplied, and screens already guard on missing config.
  return (
    <StripeProvider key={publishableKey || 'pending'} publishableKey={publishableKey || ''}>
      {children}
    </StripeProvider>
  );
}

const appStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F38FB4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#0D0D12',
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    // Android adds ~4px of padding above/below the glyph metrics by default,
    // which makes a single-line label look slightly off-center inside a
    // fixed-height pill. Disabling it lets the label sit on the geometric
    // center.
    includeFontPadding: false,
  },
});

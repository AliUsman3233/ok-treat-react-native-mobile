import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as Notifications from 'expo-notifications';
import Icon from '@expo/vector-icons/Ionicons';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { setNavigationRef, setTokenExpiredModalHandler, handleTokenExpiredAction } from './src/config/axiosInterceptor';
import { AlertProvider } from './src/context/AlertContext';
import { PaymentConfigProvider, usePaymentConfig } from './src/context/PaymentConfigContext';

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

  useEffect(() => {
    // Set token expired modal handler (only once)
    setTokenExpiredModalHandler(() => {
      setShowSessionExpired(true);
    });

    // Register for push notifications
    const registerForPushNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
        // TODO: Send token to backend to store for this user
      } catch (error) {
        console.log('Push notification setup error:', error);
      }
    };

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

  return (
    <SafeAreaProvider>
      <PaymentConfigProvider>
        <StripeWrapper>
          <Provider store={store}>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                // Set navigation reference for axios interceptor
                setNavigationRef(navigationRef.current);
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
    fontWeight: '700',
  },
});

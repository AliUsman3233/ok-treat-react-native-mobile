import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import { loadAppSettings } from '../store/slices/appSlice';
import { connectSocket, disconnectSocket } from '../config/socket';
import { addNotification } from '../store/slices/notificationSlice';
import { getSocket } from '../config/socket';

import SplashScreen from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { onboardingCompleted } = useSelector(state => state.app);
  const [isReady, setIsReady] = React.useState(false);
  const [showSplash, setShowSplash] = React.useState(true);
  const [serverReady, setServerReady] = React.useState(false);

  useEffect(() => {
    // Load both user data and app settings
    Promise.all([
      dispatch(loadUser()).unwrap().catch(() => {
        // loadUser rejection means no valid user session;
        // isAuthenticated stays false, directing to AuthNavigator
      }),
      dispatch(loadAppSettings()).unwrap().catch((err) => {
        console.warn('Failed to load app settings:', err);
      }),
    ]).finally(() => {
      setIsReady(true);
    });
  }, [dispatch]);

  // Connect / disconnect socket based on auth state
  useEffect(() => {
    if (isAuthenticated && isReady) {
      connectSocket().then((sock) => {
        if (sock) {
          // Global listener: push incoming notifications into Redux
          const handleNewNotification = (notification) => {
            dispatch(addNotification(notification));
          };
          sock.off('newNotification', handleNewNotification); // avoid duplicates
          sock.on('newNotification', handleNewNotification);
        }
      });
    } else {
      disconnectSocket();
    }

    return () => {
      // Cleanup global listener when component unmounts or auth changes
      const sock = getSocket();
      if (sock) {
        sock.off('newNotification');
      }
    };
  }, [isAuthenticated, isReady, dispatch]);

  // Hide splash after both app and server are ready
  useEffect(() => {
    if (isReady && serverReady) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, serverReady]);

  const handleServerReady = () => {
    setServerReady(true);
  };

  if (!isReady || showSplash) {
    return <SplashScreen onServerReady={handleServerReady} />;
  }

  return ( 
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

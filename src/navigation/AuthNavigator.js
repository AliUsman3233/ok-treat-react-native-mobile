import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CompleteRegistrationScreen from '../screens/auth/CompleteRegistrationScreen';
import OTPMethodScreen from '../screens/auth/OTPMethodScreen';
import OTPEntryScreen from '../screens/auth/OTPEntryScreen';
import RegistrationSuccessScreen from '../screens/auth/RegistrationSuccessScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PasswordChangeSuccessScreen from '../screens/auth/PasswordChangeSuccessScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { onboardingCompleted } = useSelector(state => state.app);

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={onboardingCompleted ? 'Login' : 'Onboarding'}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="CompleteRegistration" component={CompleteRegistrationScreen} />
      <Stack.Screen name="OTPMethod" component={OTPMethodScreen} />
      <Stack.Screen name="OTPEntry" component={OTPEntryScreen} />
      <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="PasswordChangeSuccess" component={PasswordChangeSuccessScreen} />
    </Stack.Navigator>
  );
}

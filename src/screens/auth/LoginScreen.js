import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { GoogleIcon, AppleIcon } from '../../assets';
import { API_ENDPOINTS } from '../../config/api';
import { signInWithGoogle } from '../../services/googleAuthService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.success) {
        await AsyncStorage.setItem('authToken', result.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.data.user));
        dispatch(setCredentials({ token: result.data.token, user: result.data.user }));
      }
    } catch (error) {
      if (error.message !== 'Sign-in cancelled') {
        Alert.alert('Error', error.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Call login API
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      // Handle unverified user — redirect to OTP verification
      if (response.status === 403 && data.needsVerification) {
        navigation.navigate('OTPEntry', {
          email: data.data.email,
          phoneNumber: data.data.phone,
          userId: data.data.userId,
          otpMethod: 'email',
          _devOtp: data.data._devOtp || null,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

      // Update Redux state - this will automatically navigate via RootNavigator
      dispatch(setCredentials({
        user: data.data.user,
        token: data.data.token,
      }));

      // No need to manually navigate - RootNavigator handles it when isAuthenticated changes

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section - Form Content */}
        <View style={styles.topSection}>
          {/* Title - Centered */}
          <Text style={styles.title}>Login here</Text>
          <Text style={styles.subtitle}>Welcome back, you've been missed</Text>

          {/* Email Input */}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password Input */}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            type="primary"
            size="medium"
            fullWidth
            disabled={loading}
          />

          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#32A6D8" 
              style={styles.loader}
            />
          )}

          {/* Sign Up Link - Just below login button */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Section - Social Login - Fixed at bottom */}
      <View style={styles.bottomSection}>
        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <TouchableOpacity
          style={[styles.googleButton, loading && { opacity: 0.6 }]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.7}
        >
          <GoogleIcon width={20} height={20} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleButton}
          onPress={() => Alert.alert('Coming Soon', 'Apple Sign-In is under development.')}
          activeOpacity={0.7}
        >
          <AppleIcon width={20} height={20} fill="#FFFFFF" />
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    paddingHorizontal: width * 0.064,
    marginTop: 16,
    paddingTop: height * 0.04,
    paddingBottom: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.064,
    paddingBottom: 40,
    paddingTop: 20,
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 31.50,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 21,
    marginBottom: height * 0.04,
    textAlign: 'center',
    paddingBottom: 20
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: height * 0.03,
  },
  forgotText: {
    color: '#F38FB4',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
    lineHeight: 21,
  },
  loginButton: {
    marginBottom: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 21,
    paddingTop: 10,

  },
  signupLink: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21,
    paddingTop: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ECEFF3',
  },
  dividerText: {
    color: '#8A8A8A',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  googleButtonText: {
    color: '#191919',
    fontSize: 15,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  loader: {
    marginTop: 10,
  },
});

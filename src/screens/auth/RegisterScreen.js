import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { BackArrowIcon, GoogleIcon, AppleIcon } from '../../assets';
import { signInWithGoogle } from '../../services/googleAuthService';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid =
    email.trim().length > 0 &&
    emailRegex.test(email.trim()) &&
    password.length >= 6 &&
    confirmPassword === password;

  const handleRegister = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Navigate to complete registration
    navigation.navigate('CompleteRegistration', {
      email: email,
      password: password
    });
  };

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon
              width={width * 0.053}
              height={width * 0.053}
              fill="#090E12"
            />
          </TouchableOpacity>
        </View>

        {/* Top Section - Form Content */}
        <View style={styles.topSection}>
          {/* Title - Centered */}
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Create your account and explore all</Text>

          {/* Email Input */}
          <Text style={styles.fieldLabel}>Email <Text style={{ color: '#FF3B30' }}>*</Text></Text>
          <Input
            type="email"
            placeholder="Your Email"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password Input */}
          <Text style={styles.fieldLabel}>Password <Text style={{ color: '#FF3B30' }}>*</Text></Text>
          <Input
            type="password"
            placeholder="Your Password"
            value={password}
            onChangeText={setPassword}
          />

          {/* Confirm Password Input */}
          <Text style={styles.fieldLabel}>Confirm Password <Text style={{ color: '#FF3B30' }}>*</Text></Text>
          <Input
            type="password"
            placeholder="Confirm Your Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Register Button */}
          <Button
            style={styles.proceed_button}
            title="Proceed"
            onPress={handleRegister}
            type="primary"
            size="medium"
            fullWidth
            disabled={!isFormValid || loading}
          />

          {/* Login Link - Just below register button */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
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
  proceed_button: {
    
    marginTop: 40,
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
    paddingBottom: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 21,
    paddingTop: 10,
  },
  loginLink: {
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
  fieldLabel: {
    color: '#191919',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    marginBottom: 6,
  },
});

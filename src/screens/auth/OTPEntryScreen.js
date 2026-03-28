import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import { BackArrowIcon, KeyIcon } from '../../assets';
import { API_ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

export default function OTPEntryScreen({ route, navigation }) {
  const { email, password, fullName, phoneNumber, yearsOfExperience, referralCode, userId, otpMethod = 'email' } = route.params || {};
  const dispatch = useDispatch();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Format phone number for display: (123) 456-7890
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
  };

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP');
      return;
    }

    setLoading(true);

    try {
      // Call verify OTP API
      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          code: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
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
      console.error('OTP verification error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      Alert.alert('Please Wait', `You can resend OTP in ${timer} seconds`);
      return;
    }

    setResending(true);

    try {
      const response = await fetch(API_ENDPOINTS.RESEND_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otpMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      Alert.alert('Success', 'OTP resent successfully');
      setTimer(59); // Reset timer
      setOtp(['', '', '', '']); // Clear OTP inputs

    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <ScreenWrapper style={styles.container}>
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

      {/* Content */}
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <View style={styles.iconInnerBorder} />
            <View style={styles.iconWrapper}>
              <KeyIcon 
                width={width * 0.088} 
                height={width * 0.088}
                fill="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Enter OTP</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {otpMethod === 'sms'
            ? `We have sent a OTP to your registered\nPhone Number ${formatPhoneForDisplay(phoneNumber)}`
            : `We have sent a OTP to your registered\nEmail ${email || ''}`}
        </Text>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View 
              key={index}
              style={[
                styles.otpInputWrapper,
                focusedIndex === index && styles.otpInputWrapperFocused,
                digit && styles.otpInputWrapperFilled,
              ]}
            >
              <TextInput
                ref={inputRefs[index]}
                style={[
                  styles.otpInput,
                  focusedIndex === index && styles.otpInputFocused,
                  digit && styles.otpInputFilled,
                ]}
                placeholder="0"
                placeholderTextColor="#B0B0B0"
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <Button
          title={loading ? "Verifying..." : "Submit"}
          onPress={handleSubmit}
          type="primary"
          size="medium"
          fullWidth
          disabled={!isOtpComplete || loading}
          style={[styles.submitButton, (!isOtpComplete || loading) && styles.submitButtonDisabled]}
        />

        {loading && (
          <ActivityIndicator 
            size="small" 
            color="#32A6D8" 
            style={styles.loader}
          />
        )}

        {/* Timer and Resend */}
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(timer)}</Text>
          {timer === 0 && (
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={resending}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>
                {resending ? 'Resending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: width * 0.064,
    paddingTop: height * 0.05,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 72,
    height: 72,
    backgroundColor: '#FFC2EB',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconInnerBorder: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(9, 14, 18, 0.04)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    width: 283,
    textAlign: 'center',
    color: '#5C4746',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 56,
  },
  otpInputWrapper: {
    width: 60,
    height: 75,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
  },
  otpInputWrapperFocused: {
    shadowColor: '#32A6D8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    transform: [{ translateY: -2 }],
  },
  otpInputWrapperFilled: {
    backgroundColor: 'rgba(255, 194, 235, 0.08)',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(239, 239, 239, 0.4)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '700',
    textAlign: 'center',
    color: '#191919',
    paddingTop: 4,
  },
  otpInputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#32A6D8',
    borderWidth: 2.5,
  },
  otpInputFilled: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderColor: '#FFC2EB',
    borderWidth: 2,
  },
  submitButton: {
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loader: {
    marginTop: 10,
  },
  timerContainer: {
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    textAlign: 'center',
    color: '#F38FB4',
    fontSize: 13.94,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 19.52,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
});

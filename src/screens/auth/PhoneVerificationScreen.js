import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';

export default function PhoneVerificationScreen({ route, navigation }) {
  const { phoneNumber, email, password, fullName, referralCode, yearsOfExperience, userId, otpMethod = 'email' } = route.params || {};
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleContinue = () => {
    // Navigate to OTP entry
    navigation.navigate('OTPEntry', {
      phoneNumber,
      email,
      password,
      fullName,
      referralCode,
      yearsOfExperience,
      userId
    });
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const payload = { otpMethod };
      if (userId) payload.userId = userId;
      if (email) payload.email = email;
      if (phoneNumber) payload.phone = phoneNumber;

      await api.post('/auth/resend-otp', payload);
      setResendTimer(30);
      Alert.alert('Success', 'Verification code has been resent.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container} noBottomTabs>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>

        <Text style={styles.title}>Verification by Phone</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to{'\n'}
          <Text style={styles.phoneNumber}>{phoneNumber}</Text>
        </Text>

        <Text style={styles.description}>
          Please check your phone and enter the code to verify your account.
        </Text>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>I've Received the Code</Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resending}>
            <Text style={[styles.resendLink, (resendTimer > 0 || resending) && styles.resendDisabled]}>
              {resending ? 'Resending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    padding: 20,
    marginLeft: -20,
    marginTop: 20
  },
  backButtonText: {
    fontSize: 24,
    color: '#FF6B6B'
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32
  },
  icon: {
    fontSize: 80
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#FF6B6B'
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24
  },
  resendText: {
    color: '#666',
    fontSize: 14
  },
  resendLink: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600'
  },
  resendDisabled: {
    color: '#CCC'
  }
});

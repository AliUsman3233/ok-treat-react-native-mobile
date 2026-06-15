import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAppAlert } from '../../context/AlertContext';
import api from '../../config/api';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import { BackArrowIcon } from '../../assets';

export default function VerificationScreen({ navigation }) {
  const alert = useAppAlert();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setError(null);
      const response = await api.get('/auth/profile');
      const profile = response.data?.data || response.data?.user || response.data || {};
      setIsVerified(profile.isEmailVerified || profile.emailVerified || profile.verified || false);
    } catch (err) {
      console.error('Error checking verification status:', err);
      setError('Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const payload = {};
      if (user?.email) payload.email = user.email;
      if (user?.id || user?._id) payload.userId = user?.id || user?._id;

      await api.post('/auth/resend-otp', payload);
      alert('Success', 'Verification email has been resent. Please check your inbox.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification email.';
      alert('Error', msg, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container} noBottomTabs>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackArrowIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Checking verification status...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); checkVerificationStatus(); }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : isVerified ? (
          <View style={styles.centerContent}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>&#10003;</Text>
            </View>
            <Text style={styles.title}>Email Verified</Text>
            <Text style={styles.subtitle}>
              Your email address has been successfully verified.
            </Text>
            <Button
              title="Continue"
              onPress={() => navigation.goBack()}
              type="primary"
              size="medium"
              fullWidth
              style={{ marginTop: 32 }}
            />
          </View>
        ) : (
          <View style={styles.centerContent}>
            <View style={styles.iconCirclePending}>
              <Text style={styles.iconEmoji}>&#9993;</Text>
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a verification email to{'\n'}
              <Text style={styles.emailHighlight}>{user?.email || 'your email'}</Text>
              {'\n\n'}Please check your inbox and verify your email address to continue.
            </Text>
            <Text style={styles.spamNote}>
              If you don't see it within a minute, please check your spam or junk folder.
            </Text>

            <Button
              title={resending ? 'Sending...' : 'Resend Verification Email'}
              onPress={handleResendVerification}
              type="primary"
              size="medium"
              fullWidth
              style={{ marginTop: 32 }}
              disabled={resending}
            />

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => { setLoading(true); checkVerificationStatus(); }}
            >
              <Text style={styles.refreshText}>I've verified, check again</Text>
            </TouchableOpacity>
          </View>
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCirclePending: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 36,
    color: '#FFFFFF',
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emailHighlight: {
    color: '#32A6D8',
    fontWeight: '600',
  },
  spamNote: {
    textAlign: 'center',
    color: '#A0AEC0',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontStyle: 'italic',
    lineHeight: 17,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  refreshButton: {
    marginTop: 20,
    padding: 12,
  },
  refreshText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
});

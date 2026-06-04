import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { registerForPushNotifications } from '../../services/notificationService';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, EnvelopeIcon, PhoneCallIcon } from '../../assets';
import { API_ENDPOINTS } from '../../config/api';

const CODE_LENGTH = 4;

export default function OTPEntryScreen({ route, navigation }) {
  const alert = useAppAlert();
  const { email, phoneNumber, userId, otpMethod = 'email', _devOtp } = route.params || {};
  const dispatch = useDispatch();

  const [otp, setOtp] = useState(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [timer, setTimer] = useState(180); // 3 minutes
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState(_devOtp || null);
  const inputRefs = Array.from({ length: CODE_LENGTH }, () => useRef(null));

  useEffect(() => {
    if (_devOtp) {
      const digits = _devOtp.split('');
      setOtp(digits);
    } else {
      setTimeout(() => inputRefs[0].current?.focus(), 300);
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer(p => p - 1), 1000);
      return () => clearInterval(id);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (value && !/^\d+$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < CODE_LENGTH - 1) inputRefs[index + 1].current?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const isComplete = otp.every(d => d !== '');

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== CODE_LENGTH) {
      alert('Error', `Please enter the complete ${CODE_LENGTH}-digit code`, 'error');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code, otpMethod }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed');

      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

      dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
      registerForPushNotifications().catch(() => {});
    } catch (error) {
      alert('Verification Failed', error.message || 'Invalid code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);

    try {
      const response = await fetch(API_ENDPOINTS.RESEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otpMethod }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend');

      const emptyOtp = Array(CODE_LENGTH).fill('');

      if (data._devOtp) {
        setDevCode(data._devOtp);
        setOtp(data._devOtp.split(''));
        setTimer(180);
      } else if (data.message?.includes('pending')) {
        alert('Note', 'OTP delivery may be delayed. Please wait a moment.', 'pending');
        setTimer(180);
        setOtp(emptyOtp);
        inputRefs[0].current?.focus();
      } else {
        alert('Sent', 'A new code has been sent.', 'success');
        setTimer(180);
        setOtp(emptyOtp);
        setDevCode(null);
        inputRefs[0].current?.focus();
      }
    } catch (error) {
      alert('Error', error.message || 'Failed to resend code', 'error');
    } finally {
      setResending(false);
    }
  };

  const destination = otpMethod === 'sms' ? phoneNumber : email;
  const MethodIcon = otpMethod === 'sms' ? PhoneCallIcon : EnvelopeIcon;

  return (
    <ScreenWrapper style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackArrowIcon width={20} height={20} fill="#090E12" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <MethodIcon width={24} height={24} fill="#32A6D8" />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a {CODE_LENGTH}-digit code to{'\n'}
          <Text style={styles.destination}>{destination || ''}</Text>
        </Text>

        {devCode && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>Code auto-filled (delivery unavailable)</Text>
          </View>
        )}

        {/* OTP Inputs */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={inputRefs[i]}
              style={[
                styles.otpBox,
                focusedIndex === i && styles.otpBoxFocused,
                digit && styles.otpBoxFilled,
              ]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(-1)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              placeholder="·"
              placeholderTextColor="#CCC"
            />
          ))}
        </View>

        {/* Timer + Resend */}
        <View style={styles.timerRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerBold}>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendText}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.verifyBtn, (!isComplete || loading) && styles.verifyBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isComplete || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.changeMethod}>
          <Text style={styles.changeMethodText}>Change verification method</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(50,166,216,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  destination: {
    color: '#32A6D8',
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  otpBox: {
    width: 56,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
  },
  otpBoxFocused: {
    borderColor: '#32A6D8',
    backgroundColor: '#FFF',
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: '#32A6D8',
    backgroundColor: 'rgba(50,166,216,0.04)',
  },
  timerRow: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: '#999',
  },
  timerBold: {
    color: '#32A6D8',
    fontWeight: '700',
  },
  resendText: {
    color: '#32A6D8',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: 'center',
  },
  verifyBtn: {
    backgroundColor: '#32A6D8',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  changeMethod: { marginTop: 16 },
  changeMethodText: { color: '#999', fontSize: 13 },
  devBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  devBannerText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

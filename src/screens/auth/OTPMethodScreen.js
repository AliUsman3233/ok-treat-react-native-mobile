import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAppAlert } from '../../context/AlertContext';
import { BackArrowIcon, EnvelopeIcon, PhoneCallIcon } from '../../assets';
import { API_ENDPOINTS } from '../../config/api';

const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  return `${localPart[0]}***@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***' + cleaned;
  return '***' + cleaned.slice(-4);
};

export default function OTPMethodScreen({ route, navigation }) {
  const alert = useAppAlert();
  const { email, password, fullName, phoneNumber, yearsOfExperience, referralCode, userId: existingUserId } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState(existingUserId || null);

  const handleSendCode = async () => {
    setLoading(true);
    try {
      let data;

      if (registeredUserId) {
        // User already registered — just resend OTP
        const response = await fetch(API_ENDPOINTS.RESEND_OTP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneNumber,
            otpMethod: selectedMethod,
          }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to resend code');
      } else {
        // First time — register the user
        const response = await fetch(API_ENDPOINTS.REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            phone: phoneNumber,
            fullName,
            yearsOfExperience,
            referredByCode: referralCode || undefined,
            otpMethod: selectedMethod,
          }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        setRegisteredUserId(data.data.userId);
      }

      if (data.message?.includes('pending')) {
        alert('Note', 'OTP delivery may be delayed. Please try resending if you don\'t receive it.', 'pending');
      }

      navigation.navigate('OTPEntry', {
        email,
        phoneNumber,
        userId: registeredUserId || data.data?.userId,
        otpMethod: selectedMethod,
        _devOtp: data.data?._devOtp || data._devOtp || null,
      });
    } catch (error) {
      alert('Error', error.message || 'Failed to send verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const Option = ({ method, icon, label, detail, recommended }) => {
    const active = selectedMethod === method;
    return (
      <TouchableOpacity
        style={[styles.option, active && styles.optionActive]}
        onPress={() => setSelectedMethod(method)}
        activeOpacity={0.7}
      >
        <View style={[styles.radio, active && styles.radioActive]}>
          {active && <View style={styles.radioDot} />}
        </View>
        <View style={[styles.iconBox, active && styles.iconBoxActive]}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            {recommended && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Recommended</Text>
              </View>
            )}
          </View>
          <Text style={styles.detail}>{detail}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackArrowIcon width={20} height={20} fill="#090E12" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>How would you like to receive your code?</Text>

        <View style={styles.options}>
          <Option
            method="email"
            icon={<EnvelopeIcon width={20} height={20} fill={selectedMethod === 'email' ? '#32A6D8' : '#999'} />}
            label="Email"
            detail={maskEmail(email)}
            recommended
          />
          <Option
            method="sms"
            icon={<PhoneCallIcon width={20} height={20} fill={selectedMethod === 'sms' ? '#32A6D8' : '#999'} />}
            label="Text Message"
            detail={maskPhone(phoneNumber)}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          onPress={handleSendCode}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>Send Code</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 28,
    lineHeight: 20,
  },
  options: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFF',
  },
  optionActive: {
    borderColor: '#32A6D8',
    backgroundColor: 'rgba(50,166,216,0.04)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioActive: { borderColor: '#32A6D8' },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#32A6D8',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBoxActive: { backgroundColor: 'rgba(50,166,216,0.1)' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  labelActive: { color: '#32A6D8' },
  badge: {
    backgroundColor: '#FFC2EB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: '#D63384', fontSize: 9, fontWeight: '700' },
  detail: { fontSize: 13, color: '#999', marginTop: 2 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  sendBtn: {
    backgroundColor: '#32A6D8',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

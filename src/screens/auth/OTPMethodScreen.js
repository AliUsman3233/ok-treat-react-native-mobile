import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import { BackArrowIcon, EnvelopeIcon, PhoneCallIcon } from '../../assets';
import { API_ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

// Mask email: a***@gmail.com
const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 1) return `${localPart}***@${domain}`;
  return `${localPart[0]}***@${domain}`;
};

// Mask phone: ***7890
const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***' + cleaned;
  return '***' + cleaned.slice(-4);
};

export default function OTPMethodScreen({ route, navigation }) {
  const { email, password, fullName, phoneNumber, yearsOfExperience, referralCode } = route.params || {};

  const [selectedMethod, setSelectedMethod] = useState('email');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setLoading(true);

    try {
      // Call registration API with otpMethod
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Navigate to OTP Entry screen
      navigation.navigate('OTPEntry', {
        email,
        password,
        fullName,
        phoneNumber,
        yearsOfExperience,
        referralCode,
        userId: data.data.userId,
        otpMethod: selectedMethod,
      });

    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Title */}
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to receive your verification code
        </Text>

        {/* Option Cards */}
        <View style={styles.optionsContainer}>
          {/* Email Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMethod === 'email' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedMethod('email')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[
                styles.radioOuter,
                selectedMethod === 'email' && styles.radioOuterSelected,
              ]}>
                {selectedMethod === 'email' && <View style={styles.radioInner} />}
              </View>
              <View style={[
                styles.iconCircle,
                selectedMethod === 'email' && styles.iconCircleSelected,
              ]}>
                <EnvelopeIcon
                  width={22}
                  height={22}
                  fill={selectedMethod === 'email' ? '#32A6D8' : '#8A8A8A'}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <View style={styles.optionTitleRow}>
                  <Text style={[
                    styles.optionTitle,
                    selectedMethod === 'email' && styles.optionTitleSelected,
                  ]}>Email</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                </View>
                <Text style={styles.optionDetail}>{maskEmail(email)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* SMS Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMethod === 'sms' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedMethod('sms')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[
                styles.radioOuter,
                selectedMethod === 'sms' && styles.radioOuterSelected,
              ]}>
                {selectedMethod === 'sms' && <View style={styles.radioInner} />}
              </View>
              <View style={[
                styles.iconCircle,
                selectedMethod === 'sms' && styles.iconCircleSelected,
              ]}>
                <PhoneCallIcon
                  width={22}
                  height={22}
                  fill={selectedMethod === 'sms' ? '#32A6D8' : '#8A8A8A'}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionTitle,
                  selectedMethod === 'sms' && styles.optionTitleSelected,
                ]}>Text Message</Text>
                <Text style={styles.optionDetail}>{maskPhone(phoneNumber)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Button
          title={loading ? 'Sending...' : 'Send Code'}
          onPress={handleSendCode}
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
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>Need help? </Text>
          <TouchableOpacity>
            <Text style={styles.supportLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
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
    paddingHorizontal: width * 0.064,
    paddingTop: height * 0.03,
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 31.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: '#32A6D8',
    backgroundColor: 'rgba(50, 166, 216, 0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioOuterSelected: {
    borderColor: '#32A6D8',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#32A6D8',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleSelected: {
    backgroundColor: 'rgba(50, 166, 216, 0.12)',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    color: '#191919',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  optionTitleSelected: {
    color: '#32A6D8',
  },
  recommendedBadge: {
    backgroundColor: '#FFC2EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    color: '#D63384',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
  },
  optionDetail: {
    color: '#8A8A8A',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    marginTop: 2,
  },
  bottomSection: {
    paddingHorizontal: width * 0.064,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  loader: {
    marginTop: 10,
  },
  supportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  supportText: {
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
  },
  supportLink: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
});

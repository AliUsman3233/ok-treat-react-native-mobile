import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import Input from '../../components/Input';
import PhoneInput from '../../components/PhoneInput';
import Dropdown from '../../components/Dropdown';
import {
  BackArrowIcon,
  UsersGroupIcon,
  MyProfileIcon,
  PhoneCallIcon,
  CalendarIcon,
  AngleDownIcon
} from '../../assets';
import { API_ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

// Experience options
const EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1-5 years',
  '6-10 years',
  '11-15 years',
  '16-20 years',
  'More than 20 years'
];

export default function CompleteRegistrationScreen({ route, navigation }) {
  const { email, password } = route.params || {};
  
  const [referralCode, setReferralCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    // Validate required fields
    if (!fullName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (phoneNumber.length < 6 || phoneNumber.length > 15) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Combine country code + phone number for full international format
    const fullPhone = `${countryCode}${phoneNumber}`;

    // Navigate to OTP Method selection screen (registration API will be called from there)
    navigation.navigate('OTPMethod', {
      email,
      password,
      fullName,
      phoneNumber: fullPhone,
      yearsOfExperience,
      referralCode,
    });
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

      {/* Scrollable Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title - Centered */}
        <Text style={styles.title}>Complete Registration</Text>
        <Text style={styles.subtitle}>Lets go through a few simple steps</Text>

        {/* Referral Code Input */}
        <Input
          type="text"
          placeholder="Referral Code"
          value={referralCode}
          onChangeText={setReferralCode}
          leftIcon={
            <UsersGroupIcon 
              width={width * 0.053} 
              height={width * 0.053} 
            />
          }
        />

        {/* Full Name Input */}
        <Text style={styles.fieldLabel}>Full Name <Text style={{ color: '#FF3B30' }}>*</Text></Text>
        <Input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          leftIcon={
            <MyProfileIcon
              width={width * 0.053}
              height={width * 0.053}
            />
          }
        />

        {/* Phone Number Input */}
        <Text style={styles.fieldLabel}>Phone Number <Text style={{ color: '#FF3B30' }}>*</Text></Text>
        <PhoneInput
          value={phoneNumber}
          onChangePhone={setPhoneNumber}
          countryCode={countryCode}
          onChangeCountryCode={setCountryCode}
          placeholder="Phone number"
          leftIcon={
            <PhoneCallIcon
              width={width * 0.053}
              height={width * 0.053}
            />
          }
        />

        {/* Years of Experience Dropdown */}
        <Dropdown
          placeholder="Select years of experience"
          value={yearsOfExperience}
          onSelect={setYearsOfExperience}
          options={EXPERIENCE_OPTIONS}
          maxHeight={200}
          leftIcon={
            <CalendarIcon 
              width={width * 0.053} 
              height={width * 0.053} 
            />
          }
          rightIcon={
            <AngleDownIcon 
              width={width * 0.053} 
              height={width * 0.053} 
            />
          }
        />
      </ScrollView>

      {/* Bottom Section - Fixed at bottom */}
      <View style={styles.bottomSection}>
        {/* Continue Button */}
        <Button
          title={loading ? "Registering..." : "Agree and continue"}
          onPress={handleContinue}
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

        {/* Support Link */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.064,
    paddingTop: height * 0.02,
    paddingBottom: 140, // Space for fixed bottom section
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.064,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 31.50,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: height * 0.03,
    textAlign: 'center',
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
  loader: {
    marginTop: 10,
  },
  fieldLabel: {
    color: '#191919',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    marginBottom: 6,
  },
});

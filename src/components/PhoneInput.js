import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { CountryPicker } from 'react-native-country-codes-picker';

const { width } = Dimensions.get('window');

// Common countries shown at the top of the picker
const POPULAR_COUNTRIES = ['us', 'gb', 'ca', 'au', 'in', 'pk', 'ae', 'sa'];

export default function PhoneInput({
  value,
  onChangePhone,
  countryCode,
  onChangeCountryCode,
  placeholder = 'Phone number',
  leftIcon,
  containerStyle,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🇺🇸');

  const handlePhoneChange = (text) => {
    // Only allow digits, spaces, and dashes for readability
    const cleaned = text.replace(/[^\d]/g, '');
    onChangePhone(cleaned);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && (
        <View style={styles.iconLeft}>
          {leftIcon}
        </View>
      )}

      {/* Country Code Button */}
      <TouchableOpacity
        style={styles.countryCodeBtn}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{countryFlag}</Text>
        <Text style={styles.dialCode}>{countryCode}</Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Phone Number Input */}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#B0B0B0"
        value={value}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        maxLength={15}
      />

      {/* Country Picker Modal */}
      <CountryPicker
        show={showPicker}
        pickerButtonOnPress={(item) => {
          onChangeCountryCode(item.dial_code);
          setCountryFlag(item.flag);
          setShowPicker(false);
        }}
        onBackdropPress={() => setShowPicker(false)}
        style={{
          modal: {
            height: '60%',
          },
          textInput: {
            height: 45,
            borderRadius: 12,
            paddingHorizontal: 12,
          },
          countryButtonStyles: {
            height: 50,
          },
        }}
        popularCountries={POPULAR_COUNTRIES}
        searchMessage="Search country"
        lang="en"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 55,
    backgroundColor: '#fefefeff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconLeft: {
    width: 20,
    height: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 4,
  },
  flag: {
    fontSize: 18,
  },
  dialCode: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#0D0D12',
  },
  arrow: {
    fontSize: 10,
    color: '#999',
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#ECEFF3',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#0D0D12',
    padding: 0,
  },
});

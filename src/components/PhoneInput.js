// Canonical phone-number input for the whole app. Country picker with
// dial code + flag, phone-pad keyboard, digit-only sanitization.
//
// Two ways to use it:
//
//   Controlled — parent owns state:
//     <PhoneInput
//        value={national}
//        onChangePhone={setNational}
//        countryCode={dial}
//        onChangeCountryCode={setDial}
//     />
//
//   Uncontrolled with an initial saved value — component parses legacy
//   formats internally on mount and reports the E.164 string on every
//   change through onChangeE164:
//     <PhoneInput
//        initialValue={pet?.user?.phone}
//        onChangeE164={setPhone}
//     />
//
// If no countryCode is supplied, defaults come from the device locale
// (via utils/phone.defaultCountryInfo) instead of hard-coded +1 US.

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CountryPicker } from 'react-native-country-codes-picker';
import { defaultCountryInfo, flagForDialCode, parsePhone, toE164 } from '../utils/phone';

const POPULAR_COUNTRIES = ['us', 'gb', 'ca', 'au', 'in', 'pk', 'ae', 'sa'];

export default function PhoneInput({
  // Controlled mode
  value,
  onChangePhone,
  countryCode,
  onChangeCountryCode,
  // Uncontrolled mode (initial legacy value → E.164 on every change)
  initialValue,
  onChangeE164,
  // Common
  placeholder = 'Phone number',
  leftIcon,
  containerStyle,
  editable = true,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const isControlled = value !== undefined && countryCode !== undefined;

  // Internal state for uncontrolled mode. Parsed once from initialValue
  // so legacy hyphenated/no-prefix strings still land in the right
  // country + national buckets.
  const parsedRef = useRef(null);
  if (parsedRef.current === null) {
    parsedRef.current = initialValue
      ? parsePhone(initialValue)
      : { dialCode: defaultCountryInfo().dial, national: '' };
  }
  const [nationalInternal, setNationalInternal] = useState(parsedRef.current.national);
  const [dialInternal, setDialInternal] = useState(parsedRef.current.dialCode);

  const activeNational = isControlled ? value : nationalInternal;
  const activeDial = isControlled ? countryCode : dialInternal;

  // Flag derived from dial code so it stays in sync when the caller
  // updates countryCode externally (e.g. re-parse of saved data).
  const [flag, setFlag] = useState(() => flagForDialCode(activeDial));
  useEffect(() => {
    setFlag(flagForDialCode(activeDial));
  }, [activeDial]);

  // Emit E.164 to uncontrolled callers whenever either half changes.
  useEffect(() => {
    if (!isControlled && onChangeE164) {
      onChangeE164(toE164(activeDial, activeNational));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDial, activeNational]);

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (isControlled) {
      onChangePhone?.(cleaned);
    } else {
      setNationalInternal(cleaned);
    }
  };

  const handlePickCountry = (item) => {
    const newDial = item.dial_code;
    if (isControlled) {
      onChangeCountryCode?.(newDial);
    } else {
      setDialInternal(newDial);
    }
    if (item.flag) setFlag(item.flag);
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

      <TouchableOpacity
        style={styles.countryCodeBtn}
        onPress={() => editable && setShowPicker(true)}
        activeOpacity={0.7}
        disabled={!editable}
      >
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.dialCode}>{activeDial}</Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#B0B0B0"
        value={activeNational}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        maxLength={15}
        editable={editable}
      />

      <CountryPicker
        show={showPicker}
        pickerButtonOnPress={handlePickCountry}
        onBackdropPress={() => setShowPicker(false)}
        style={{
          modal: { height: '60%' },
          textInput: { height: 45, borderRadius: 12, paddingHorizontal: 12 },
          countryButtonStyles: { height: 50 },
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
  flag: { fontSize: 18 },
  dialCode: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#0D0D12',
  },
  arrow: { fontSize: 10, color: '#999', marginLeft: 2 },
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

import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import Button from './Button';
import Dropdown from './Dropdown';

// Card type detection based on card number
const detectCardType = (number) => {
  const cleaned = number.replace(/\s/g, '');
  
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  
  return null;
};

// Format card number with spaces
const formatCardNumber = (number) => {
  const cleaned = number.replace(/\s/g, '');
  const cardType = detectCardType(cleaned);
  
  // Amex format: 4-6-5
  if (cardType === 'amex') {
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
  }
  
  // Other cards: 4-4-4-4
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
};

// Format expiry date MM/YYYY
const formatExpiryDate = (text) => {
  const cleaned = text.replace(/\D/g, '');
  
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + ' / ' + cleaned.slice(2, 6);
  }
  
  return cleaned;
};

export default function AddCardBottomSheet({ visible, onClose, amount, onSuccess, onError }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [country, setCountry] = useState('');
  const [zip, setZip] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [cardType, setCardType] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const countries = [
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' },
    { label: 'United Kingdom', value: 'GB' },
    { label: 'Australia', value: 'AU' },
    { label: 'Germany', value: 'DE' },
    { label: 'France', value: 'FR' },
    { label: 'Spain', value: 'ES' },
    { label: 'Italy', value: 'IT' },
    { label: 'Netherlands', value: 'NL' },
    { label: 'Belgium', value: 'BE' },
    { label: 'Switzerland', value: 'CH' },
    { label: 'Austria', value: 'AT' },
    { label: 'Sweden', value: 'SE' },
    { label: 'Norway', value: 'NO' },
    { label: 'Denmark', value: 'DK' },
    { label: 'Finland', value: 'FI' },
    { label: 'Ireland', value: 'IE' },
    { label: 'Portugal', value: 'PT' },
    { label: 'New Zealand', value: 'NZ' },
    { label: 'Japan', value: 'JP' },
    { label: 'Singapore', value: 'SG' },
    { label: 'Hong Kong', value: 'HK' },
    { label: 'India', value: 'IN' },
    { label: 'Brazil', value: 'BR' },
    { label: 'Mexico', value: 'MX' },
    { label: 'Poland', value: 'PL' },
    { label: 'Czech Republic', value: 'CZ' },
    { label: 'Romania', value: 'RO' },
    { label: 'Greece', value: 'GR' },
    { label: 'Pakistan', value: 'PK' },
    { label: 'United Arab Emirates', value: 'AE' },
    { label: 'Saudi Arabia', value: 'SA' },
    { label: 'South Africa', value: 'ZA' },
    { label: 'Other', value: 'OTHER' },
  ];

  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const detectedType = detectCardType(cleaned);
    const maxLength = detectedType === 'amex' ? 15 : 16;
    
    console.log('Card input:', cleaned, 'Detected type:', detectedType);
    
    if (cleaned.length <= maxLength) {
      const formatted = formatCardNumber(cleaned);
      setCardNumber(formatted);
      setCardType(detectedType);
    }
  };

  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length <= 6) {
      const formatted = formatExpiryDate(cleaned);
      setExpiryDate(formatted);
    }
  };

  const handleCvcChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const maxLength = cardType === 'amex' ? 4 : 3;
    
    if (cleaned.length <= maxLength) {
      setCvc(cleaned);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Card number: 13-19 digits after removing spaces
    const cleanedCard = cardNumber.replace(/\s/g, '');
    if (!cleanedCard || cleanedCard.length < 13 || cleanedCard.length > 19) {
      errors.cardNumber = 'Invalid card number';
    }

    // Expiry date: MM/YYYY, month 01-12, not expired
    const expiryClean = expiryDate.replace(/\s/g, '');
    const expiryMatch = expiryClean.match(/^(\d{2})\/(\d{4})$/);
    if (!expiryMatch) {
      errors.expiryDate = 'Invalid or expired date';
    } else {
      const month = parseInt(expiryMatch[1], 10);
      const year = parseInt(expiryMatch[2], 10);
      if (month < 1 || month > 12) {
        errors.expiryDate = 'Invalid or expired date';
      } else {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          errors.expiryDate = 'Invalid or expired date';
        }
      }
    }

    // CVC: 3-4 digits
    if (!cvc || cvc.length < 3 || cvc.length > 4) {
      errors.cvc = 'Invalid CVC';
    }

    // Country: not empty
    if (!country) {
      errors.country = 'Please select a country';
    }

    // ZIP: not empty, at least 3 chars
    if (!zip || zip.trim().length < 3) {
      errors.zip = 'Please enter a valid ZIP code';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = () => {
    const cleanedCard = cardNumber.replace(/\s/g, '');
    if (!cleanedCard || cleanedCard.length < 13 || cleanedCard.length > 19) return false;

    const expiryClean = expiryDate.replace(/\s/g, '');
    const expiryMatch = expiryClean.match(/^(\d{2})\/(\d{4})$/);
    if (!expiryMatch) return false;
    const month = parseInt(expiryMatch[1], 10);
    const year = parseInt(expiryMatch[2], 10);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;

    if (!cvc || cvc.length < 3 || cvc.length > 4) return false;
    if (!country) return false;
    if (!zip || zip.trim().length < 3) return false;

    return true;
  };

  const handlePay = () => {
    if (!validateForm()) return;

    // Return card data to parent component
    const cardData = {
      cardNumber,
      expiryDate,
      cvc,
      country,
      zip,
      saveCard
    };

    if (onSuccess) {
      onSuccess(cardData);
    } else {
      console.log('Payment processed');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.placeholder} />
            <Text style={styles.headerTitle}>Add New Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Card Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Information</Text>
              
              <View style={styles.inputGroup}>
                {/* Card Number */}
                <View style={[styles.inputContainer, fieldErrors.cardNumber && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Card number"
                    placeholderTextColor="#898D8F"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                  />
                  {/* Card Brand Icons */}
                  <View style={styles.cardBrands}>
                    {/* Visa */}
                    <View style={[
                      styles.cardBrandWrapper,
                      cardType === 'visa' && styles.cardBrandWrapperActive
                    ]}>
                      <View style={[
                        styles.cardBrand, 
                        { backgroundColor: '#E8F0FF' },
                        cardType !== 'visa' && styles.cardBrandInactive
                      ]}>
                        <View style={styles.visaStripe} />
                      </View>
                    </View>
                    
                    {/* Mastercard */}
                    <View style={[
                      styles.cardBrandWrapper,
                      cardType === 'mastercard' && styles.cardBrandWrapperActive
                    ]}>
                      <View style={[
                        styles.cardBrand, 
                        { backgroundColor: '#006FCF' },
                        cardType !== 'mastercard' && styles.cardBrandInactive
                      ]}>
                        <View style={styles.mastercardCircle1} />
                        <View style={styles.mastercardCircle2} />
                      </View>
                    </View>
                    
                    {/* Discover */}
                    <View style={[
                      styles.cardBrandWrapper,
                      cardType === 'discover' && styles.cardBrandWrapperActive
                    ]}>
                      <View style={[
                        styles.cardBrand, 
                        { backgroundColor: 'black' },
                        cardType !== 'discover' && styles.cardBrandInactive
                      ]} />
                    </View>
                    
                    {/* Amex */}
                    <View style={[
                      styles.cardBrandWrapper,
                      cardType === 'amex' && styles.cardBrandWrapperActive
                    ]}>
                      <View style={[
                        styles.cardBrand,
                        cardType !== 'amex' && styles.cardBrandInactive
                      ]}>
                        <View style={styles.amexRed} />
                        <View style={styles.amexBlue} />
                        <View style={styles.amexGreen} />
                      </View>
                    </View>
                  </View>
                </View>

                {fieldErrors.cardNumber && (
                  <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
                    {fieldErrors.cardNumber}
                  </Text>
                )}

                {/* Expiry and CVC */}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.inputContainer, fieldErrors.expiryDate && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="MM / YYYY"
                        placeholderTextColor="#898D8F"
                        value={expiryDate}
                        onChangeText={handleExpiryChange}
                        keyboardType="numeric"
                      />
                    </View>
                    {fieldErrors.expiryDate && (
                      <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
                        {fieldErrors.expiryDate}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={[styles.inputContainer, fieldErrors.cvc && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="CVC"
                        placeholderTextColor="#898D8F"
                        value={cvc}
                        onChangeText={handleCvcChange}
                        keyboardType="numeric"
                      />
                      <View style={styles.cvcIcon}>
                        <View style={styles.cvcCard}>
                          <View style={styles.cvcStripe} />
                          <View style={styles.cvcSignature} />
                        </View>
                        <View style={styles.cvcBadge}>
                          <Text style={styles.cvcText}>135</Text>
                        </View>
                      </View>
                    </View>
                    {fieldErrors.cvc && (
                      <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
                        {fieldErrors.cvc}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Billing Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Billing Address</Text>
              
              <View style={styles.inputGroup}>
                {/* Country Dropdown */}
                <View>
                  <View style={styles.dropdownWrapper}>
                    <Dropdown
                      options={countries.map(c => c.label)}
                      value={country}
                      onSelect={(label) => {
                        const found = countries.find(c => c.label === label);
                        setCountry(found ? found.value : label);
                      }}
                      placeholder="Country"
                    />
                  </View>
                  {fieldErrors.country && (
                    <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
                      {fieldErrors.country}
                    </Text>
                  )}
                </View>

                {/* ZIP */}
                <View>
                  <View style={[styles.inputContainer, fieldErrors.zip && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="ZIP"
                      placeholderTextColor="#898D8F"
                      value={zip}
                      onChangeText={setZip}
                      keyboardType="numeric"
                    />
                  </View>
                  {fieldErrors.zip && (
                    <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
                      {fieldErrors.zip}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Save Card Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setSaveCard(!saveCard)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
                {saveCard && <Icon name="checkmark" size={12} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Save this card for future OkTreat payments</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Pay Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={`Pay ${amount}`}
              onPress={handlePay}
              fullWidth
              size="medium"
              disabled={!isFormValid()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 34,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 20,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 16,
  },
  inputContainer: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    padding: 0,
  },
  cardBrands: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.47,
  },
  cardBrandWrapper: {
    padding: 2,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardBrandWrapperActive: {
    borderColor: '#32A6D8',
    backgroundColor: 'rgba(50, 166, 216, 0.15)',
  },
  cardBrand: {
    width: 24.25,
    height: 16.16,
    borderRadius: 2.42,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBrandInactive: {
    opacity: 0.3,
  },
  visaStripe: {
    width: 18.59,
    height: 5.97,
    backgroundColor: '#254AA5',
    position: 'absolute',
    left: 3.23,
    top: 4.54,
  },
  mastercardCircle1: {
    width: 16.16,
    height: 16.16,
    backgroundColor: 'white',
    borderRadius: 8.08,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  mastercardCircle2: {
    width: 16.16,
    height: 16.16,
    backgroundColor: '#006FCF',
    borderRadius: 8.08,
    position: 'absolute',
    left: 8.08,
    top: 0,
    opacity: 0.8,
  },
  amexRed: {
    width: 12.79,
    height: 16.15,
    backgroundColor: '#E21836',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  amexBlue: {
    width: 13.02,
    height: 16.15,
    backgroundColor: '#00447C',
    position: 'absolute',
    left: 5.91,
    top: 0,
  },
  amexGreen: {
    width: 12.79,
    height: 16.15,
    backgroundColor: '#007B84',
    position: 'absolute',
    left: 13.02,
    top: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  cvcIcon: {
    width: 28.5,
    height: 17.08,
    position: 'relative',
  },
  cvcCard: {
    width: 24.25,
    height: 16.16,
    backgroundColor: '#CCCCCC',
    borderRadius: 2.42,
    position: 'absolute',
    left: 0,
    top: 0.92,
  },
  cvcStripe: {
    width: 19,
    height: 3,
    backgroundColor: '#8E8E93',
    position: 'absolute',
    left: 0,
    top: 3.08,
  },
  cvcSignature: {
    width: 19,
    height: 3,
    backgroundColor: 'white',
    position: 'absolute',
    left: 4,
    top: 8.08,
  },
  cvcBadge: {
    width: 12,
    height: 12,
    backgroundColor: '#666666',
    borderRadius: 9999,
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cvcText: {
    color: 'white',
    fontSize: 5.68,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 8.12,
  },
  dropdownWrapper: {
    height: 56,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#32A6D8',
  },
  checkboxLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
});

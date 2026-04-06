import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useAppAlert } from '../../../../context/AlertContext';
import React, { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { Button } from '../../../../components';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import { BackArrowIcon, PhoneCallIcon, UserCircleIcon } from '../../../../assets';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../../services/buildTrustService';

export default function PhoneNumbersScreen({ navigation }) {
  const alert = useAppAlert();
  // Primary phone
  const [primaryPart1, setPrimaryPart1] = useState('');
  const [primaryPart2, setPrimaryPart2] = useState('');
  const [primaryPart3, setPrimaryPart3] = useState('');
  const [primaryPart4, setPrimaryPart4] = useState('');
  
  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPart1, setEmergencyPart1] = useState('');
  const [emergencyPart2, setEmergencyPart2] = useState('');
  const [emergencyPart3, setEmergencyPart3] = useState('');
  const [emergencyPart4, setEmergencyPart4] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for primary phone
  const primaryRef1 = useRef(null);
  const primaryRef2 = useRef(null);
  const primaryRef3 = useRef(null);
  const primaryRef4 = useRef(null);

  // Refs for emergency phone
  const emergencyRef1 = useRef(null);
  const emergencyRef2 = useRef(null);
  const emergencyRef3 = useRef(null);
  const emergencyRef4 = useRef(null);

  // Fetch existing data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchPhoneNumbers();
    }, [])
  );

  const fetchPhoneNumbers = async () => {
    try {
      const response = await getBuildTrustSection('PHONE_NUMBERS');
      
      if (response.success && response.data.exists && response.data.settings) {
        const settings = response.data.settings;
        
        // Parse primary phone
        if (settings.primaryPhone) {
          const parts = settings.primaryPhone.split('-');
          if (parts.length === 4) {
            setPrimaryPart1(parts[0] || '');
            setPrimaryPart2(parts[1] || '');
            setPrimaryPart3(parts[2] || '');
            setPrimaryPart4(parts[3] || '');
          }
        }
        
        // Parse emergency contact
        setEmergencyName(settings.emergencyName || '');
        if (settings.emergencyPhone) {
          const parts = settings.emergencyPhone.split('-');
          if (parts.length === 4) {
            setEmergencyPart1(parts[0] || '');
            setEmergencyPart2(parts[1] || '');
            setEmergencyPart3(parts[2] || '');
            setEmergencyPart4(parts[3] || '');
          }
        }
        setEmergencyNotes(settings.emergencyNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error);
    }
  };

  // Primary phone handlers
  const handlePrimaryPart1Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setPrimaryPart1(cleaned);
      if (cleaned.length === 4) primaryRef2.current?.focus();
    }
  };

  const handlePrimaryPart2Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      setPrimaryPart2(cleaned);
      if (cleaned.length === 3) primaryRef3.current?.focus();
    }
  };

  const handlePrimaryPart3Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setPrimaryPart3(cleaned);
      if (cleaned.length === 4) primaryRef4.current?.focus();
    }
  };

  const handlePrimaryPart4Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setPrimaryPart4(cleaned);
    }
  };

  const handlePrimaryPart2KeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && primaryPart2 === '') {
      primaryRef1.current?.focus();
    }
  };

  const handlePrimaryPart3KeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && primaryPart3 === '') {
      primaryRef2.current?.focus();
    }
  };

  const handlePrimaryPart4KeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && primaryPart4 === '') {
      primaryRef3.current?.focus();
    }
  };

  // Emergency phone handlers
  const handleEmergencyPart1Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setEmergencyPart1(cleaned);
      if (cleaned.length === 4) emergencyRef2.current?.focus();
    }
  };

  const handleEmergencyPart2Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      setEmergencyPart2(cleaned);
      if (cleaned.length === 3) emergencyRef3.current?.focus();
    }
  };

  const handleEmergencyPart3Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setEmergencyPart3(cleaned);
      if (cleaned.length === 4) emergencyRef4.current?.focus();
    }
  };

  const handleEmergencyPart4Change = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setEmergencyPart4(cleaned);
    }
  };

  const handleEmergencyPart2KeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && emergencyPart2 === '') {
      emergencyRef1.current?.focus();
    }
  };

  const handleEmergencyPart3KeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && emergencyPart3 === '') {
      emergencyRef2.current?.focus();
    }
  };

  const handleEmergencyPart4KeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && emergencyPart4 === '') {
      emergencyRef3.current?.focus();
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate primary phone
      if (!primaryPart1 || !primaryPart2 || !primaryPart3 || !primaryPart4) {
        alert('Required', 'Please enter your primary phone number', 'pending');
        return;
      }

      // Validate emergency contact
      if (!emergencyName) {
        alert('Required', 'Please enter emergency contact name', 'pending');
        return;
      }

      if (!emergencyPart1 || !emergencyPart2 || !emergencyPart3 || !emergencyPart4) {
        alert('Required', 'Please enter emergency contact phone number', 'pending');
        return;
      }
      
      // Prepare settings data
      const primaryPhone = `${primaryPart1}-${primaryPart2}-${primaryPart3}-${primaryPart4}`;
      const emergencyPhone = `${emergencyPart1}-${emergencyPart2}-${emergencyPart3}-${emergencyPart4}`;
      
      const settings = {
        primaryPhone,
        emergencyName,
        emergencyPhone,
        emergencyNotes
      };
      
      // Save to backend
      const response = await upsertBuildTrustSection('PHONE_NUMBERS', settings, true);
      
      if (response.success) {
        // Navigate to next screen (Details)
        navigation.navigate('Details');
      } else {
        alert('Error', 'Failed to save phone numbers. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving phone numbers:', error);
      alert('Error', 'Failed to save phone numbers. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackPress = () => {
    setShowUnsavedModal(true);
  };

  const handleCancelLeave = () => {
    setShowUnsavedModal(false);
  };

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    navigation.goBack();
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Phone Number Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Phone number</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.helperText}>
              OkTreat needs a verified phone number to protect your account and send important updates. We'll text you a verification code.
            </Text>

            <Text style={styles.fieldLabel}>Primary</Text>

            <View style={styles.phoneInputContainer}>
              <PhoneCallIcon width={15} height={15} fill="#FFC2EB" />
              <View style={styles.phoneDisplayContainer}>
                <Text style={styles.phoneBracket}>(</Text>
                <TextInput
                  style={styles.phoneInputSection}
                  placeholder="xxxx"
                  placeholderTextColor="#898D8F"
                  value={primaryPart1}
                  onChangeText={handlePrimaryPart1Change}
                  keyboardType="numeric"
                  maxLength={4}
                  ref={primaryRef1}
                />
                <Text style={styles.phoneBracket}>)</Text>
                <TextInput
                  style={styles.phoneInputSectionMid}
                  placeholder="xxx"
                  placeholderTextColor="#898D8F"
                  value={primaryPart2}
                  onChangeText={handlePrimaryPart2Change}
                  onKeyPress={handlePrimaryPart2KeyPress}
                  keyboardType="numeric"
                  maxLength={3}
                  ref={primaryRef2}
                />
                <Text style={styles.phoneSeparator}>-</Text>
                <TextInput
                  style={styles.phoneInputSection}
                  placeholder="xxxx"
                  placeholderTextColor="#898D8F"
                  value={primaryPart3}
                  onChangeText={handlePrimaryPart3Change}
                  onKeyPress={handlePrimaryPart3KeyPress}
                  keyboardType="numeric"
                  maxLength={4}
                  ref={primaryRef3}
                />
                <Text style={styles.phoneSeparator}>-</Text>
                <TextInput
                  style={styles.phoneInputSection}
                  placeholder="xxxx"
                  placeholderTextColor="#898D8F"
                  value={primaryPart4}
                  onChangeText={handlePrimaryPart4Change}
                  onKeyPress={handlePrimaryPart4KeyPress}
                  keyboardType="numeric"
                  maxLength={4}
                  ref={primaryRef4}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Add phone number</Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Contact Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.helperText}>
              Who may we contact, in addition to you, in the event of an emergency?
            </Text>

            <Text style={styles.fieldLabel}>Contact name (emergency)</Text>
            <View style={styles.inputContainer}>
              <UserCircleIcon width={16.67} height={16.67} fill="#FFC2EB" />
              <TextInput
                style={styles.input}
                placeholder="e.g., John Smith"
                placeholderTextColor="#898D8F"
                value={emergencyName}
                onChangeText={setEmergencyName}
              />
            </View>

            <Text style={styles.fieldLabel}>Contact number (emergency)</Text>
            <View style={styles.phoneInputContainer}>
              <PhoneCallIcon width={15} height={15} fill="#FFC2EB" />
              <View style={styles.phoneDisplayContainer}>
                <Text style={styles.phoneBracket}>(</Text>
                <TextInput
                  style={styles.phoneInputSection}
                  placeholder="xxxx"
                  placeholderTextColor="#898D8F"
                  value={emergencyPart1}
                  onChangeText={handleEmergencyPart1Change}
                  keyboardType="numeric"
                  maxLength={4}
                  ref={emergencyRef1}
                />
                <Text style={styles.phoneBracket}>)</Text>
                <TextInput
                  style={styles.phoneInputSectionMid}
                  placeholder="xxx"
                  placeholderTextColor="#898D8F"
                  value={emergencyPart2}
                  onChangeText={handleEmergencyPart2Change}
                  onKeyPress={handleEmergencyPart2KeyPress}
                  keyboardType="numeric"
                  maxLength={3}
                  ref={emergencyRef2}
                />
                <Text style={styles.phoneSeparator}>-</Text>
                <TextInput
                  style={styles.phoneInputSection}
                  placeholder="xxxx"
                  placeholderTextColor="#898D8F"
                  value={emergencyPart3}
                  onChangeText={handleEmergencyPart3Change}
                  onKeyPress={handleEmergencyPart3KeyPress}
                  keyboardType="numeric"
                  maxLength={4}
                  ref={emergencyRef3}
                />
                <Text style={styles.phoneSeparator}>-</Text>
                <TextInput
                  style={styles.phoneInputSection}
                  placeholder="xxxx"
                  placeholderTextColor="#898D8F"
                  value={emergencyPart4}
                  onChangeText={handleEmergencyPart4Change}
                  onKeyPress={handleEmergencyPart4KeyPress}
                  keyboardType="numeric"
                  maxLength={4}
                  ref={emergencyRef4}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>
              Please tell us which members of your household we can contact and speak with during an emergency.
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="e.g., Call in case of emergency"
                placeholderTextColor="#898D8F"
                value={emergencyNotes}
                onChangeText={setEmergencyNotes}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            By providing your phone number, you agree to receive service-related texts. Reply HELP for help or STOP to unsubscribe. Message and data rates may apply.
          </Text>
        </ScrollView>

        {/* Unsaved Changes Modal */}
        <UnsavedChangesModal
          visible={showUnsavedModal}
          onCancel={handleCancelLeave}
          onLeave={handleConfirmLeave}
        />

        {/* Save Button */}
        <View style={styles.bottomButtonContainer}>
          <Button
            title={isSaving ? "Saving..." : "Save & Continue"}
            onPress={handleSave}
            type="secondary"
            size="large"
            fullWidth
            disabled={isSaving}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 4,
    marginTop: 16,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  card: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  helperText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  fieldLabel: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
    marginTop: 4,
  },
  phoneInputContainer: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneDisplayContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneBracket: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  phoneInputSection: {
    width: 28,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
  },
  phoneInputSectionMid: {
    width: 38,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
  },
  phoneSeparator: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  linkButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 40,
    alignSelf: 'center',
  },
  linkText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18.6,
  },
  inputContainer: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    padding: 0,
  },
  textAreaContainer: {
    height: 134,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  textArea: {
    flex: 1,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    padding: 0,
  },
  disclaimer: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
    marginTop: 8,
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

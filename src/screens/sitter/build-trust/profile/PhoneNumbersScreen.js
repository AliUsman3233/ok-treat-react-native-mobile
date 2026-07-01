import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppAlert } from '../../../../context/AlertContext';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { Button } from '../../../../components';
import PhoneInput from '../../../../components/PhoneInput';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import { BackArrowIcon, UserCircleIcon } from '../../../../assets';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../../services/buildTrustService';
import { defaultCountryInfo, parsePhone, toE164, isValidPhone } from '../../../../utils/phone';

// Sitter Build-Trust "Phone Numbers" step. Owns Primary + Emergency
// contact phones plus the emergency contact's name + notes. Uses the
// shared PhoneInput component so international numbers (Pakistan, UK,
// etc.) work the same way as everywhere else in the app.
//
// Storage format: E.164 ("+923001234567"). Legacy rows saved as
// hyphenated 4-segment strings still parse on load thanks to
// utils/phone.parsePhone which handles both.

export default function PhoneNumbersScreen({ navigation }) {
  const alert = useAppAlert();
  const initial = defaultCountryInfo().dial;

  // Primary phone (single field split into dial code + national)
  const [primaryDial, setPrimaryDial] = useState(initial);
  const [primaryNational, setPrimaryNational] = useState('');

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyDial, setEmergencyDial] = useState(initial);
  const [emergencyNational, setEmergencyNational] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        if (settings.primaryPhone) {
          const { dialCode, national } = parsePhone(settings.primaryPhone);
          setPrimaryDial(dialCode);
          setPrimaryNational(national);
        }
        setEmergencyName(settings.emergencyName || '');
        if (settings.emergencyPhone) {
          const { dialCode, national } = parsePhone(settings.emergencyPhone);
          setEmergencyDial(dialCode);
          setEmergencyNational(national);
        }
        setEmergencyNotes(settings.emergencyNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!isValidPhone(primaryDial, primaryNational)) {
        alert('Required', 'Please enter a valid primary phone number', 'pending');
        return;
      }
      if (!emergencyName?.trim()) {
        alert('Required', 'Please enter emergency contact name', 'pending');
        return;
      }
      if (!isValidPhone(emergencyDial, emergencyNational)) {
        alert('Required', 'Please enter a valid emergency phone number', 'pending');
        return;
      }

      const settings = {
        primaryPhone: toE164(primaryDial, primaryNational),
        emergencyName: emergencyName.trim(),
        emergencyPhone: toE164(emergencyDial, emergencyNational),
        emergencyNotes,
      };

      const response = await upsertBuildTrustSection('PHONE_NUMBERS', settings, true);
      if (response.success) {
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

  const handleBackPress = () => setShowUnsavedModal(true);
  const handleCancelLeave = () => setShowUnsavedModal(false);
  const handleConfirmLeave = () => { setShowUnsavedModal(false); navigation.goBack(); };

  return (
    <ScreenWrapper noBottomTabs>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
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
            <PhoneInput
              value={primaryNational}
              onChangePhone={setPrimaryNational}
              countryCode={primaryDial}
              onChangeCountryCode={setPrimaryDial}
              placeholder="Phone number"
            />
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
            <PhoneInput
              value={emergencyNational}
              onChangePhone={setEmergencyNational}
              countryCode={emergencyDial}
              onChangeCountryCode={setEmergencyDial}
              placeholder="Phone number"
            />

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

          <Text style={styles.disclaimer}>
            By providing your phone number, you agree to receive service-related texts. Reply HELP for help or STOP to unsubscribe. Message and data rates may apply.
          </Text>
        </ScrollView>

        <UnsavedChangesModal
          visible={showUnsavedModal}
          onCancel={handleCancelLeave}
          onLeave={handleConfirmLeave}
        />

        <View style={styles.buttonContainer}>
          <Button title={isSaving ? 'Saving...' : 'Continue'} onPress={handleSave} disabled={isSaving} />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#0D0D12',
  },
  headerPlaceholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { marginTop: 20, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#0D0D12',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  helperText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  inputContainer: {
    height: 55,
    backgroundColor: '#fefefeff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    color: '#0D0D12',
    padding: 0,
  },
  textAreaContainer: {
    backgroundColor: '#fefefeff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    padding: 12,
    minHeight: 100,
  },
  textArea: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    color: '#0D0D12',
    minHeight: 80,
  },
  disclaimer: {
    marginTop: 20,
    color: '#A0AEC0',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import { BackArrowIcon } from '../../../assets';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../services/buildTrustService';

export default function FinalDetailsScreen({ navigation }) {
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchFinalDetails();
    }, [])
  );

  const fetchFinalDetails = async () => {
    try {
      const response = await getBuildTrustSection('FINAL_DETAILS');

      if (response.success && response.data.exists && response.data.settings) {
        const settings = response.data.settings;
        setAvailabilityNotes(settings.availabilityNotes || '');
        setEmergencyContact(settings.emergencyContact || '');
        setAdditionalInfo(settings.additionalInfo || '');
      }
    } catch (error) {
      console.error('Failed to fetch final details:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!availabilityNotes.trim()) {
        Alert.alert('Required', 'Please add your availability notes.');
        return;
      }

      if (!emergencyContact.trim()) {
        Alert.alert('Required', 'Please provide an emergency contact.');
        return;
      }

      // Validate emergency contact contains at least some digits (phone number)
      const digitsInContact = emergencyContact.replace(/\D/g, '');
      if (digitsInContact.length < 7) {
        Alert.alert('Invalid Contact', 'Emergency contact must include a valid phone number (at least 7 digits).');
        return;
      }

      // Save data to buildTrustService
      const settings = { availabilityNotes, emergencyContact, additionalInfo };
      const response = await upsertBuildTrustSection('FINAL_DETAILS', settings, true);

      if (response.success) {
        navigation.navigate('ProfileSetup', { completedSection: 'finalDetails' });
      } else {
        Alert.alert('Error', 'Failed to save final details. Please try again.');
      }
    } catch (error) {
      console.error('Error saving final details:', error);
      Alert.alert('Error', 'Failed to save final details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Final Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Availability Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability Notes <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              Let pet owners know about your general availability, schedule preferences, and any blackout dates.
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="e.g., Available weekdays after 5pm and all day on weekends..."
                placeholderTextColor="#898D8F"
                value={availabilityNotes}
                onChangeText={setAvailabilityNotes}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              Provide a backup contact who can be reached if you are unavailable during a pet care session.
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name and phone number"
                placeholderTextColor="#898D8F"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
              />
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <Text style={styles.helperText}>
              Anything else you would like pet owners or OkTreat to know about you or your services.
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional details..."
                placeholderTextColor="#898D8F"
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <Button
            title={isSaving ? "Saving..." : "Save"}
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
    gap: 16,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  helperText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
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
    minHeight: 120,
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
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useAppAlert } from '../../../../context/AlertContext';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { Button } from '../../../../components';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import { BackArrowIcon } from '../../../../assets';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../../services/buildTrustService';

// Product only supports Dog and Cat (matches the Add Pet flow).
const PET_TYPE_OPTIONS = ['Dogs', 'Cats'];
const PET_SIZE_OPTIONS = ['Small (1-15 lbs)', 'Medium (16-40 lbs)', 'Large (41-100 lbs)', 'Giant (101+ lbs)'];
const WALK_FREQUENCY_OPTIONS = ['1-2 times/day', '3-4 times/day', '5+ times/day'];
const FEEDING_OPTIONS = ['Dry food', 'Wet food', 'Raw diet', 'Special diet', 'Medication with food'];
const SPECIAL_CARE_OPTIONS = ['Senior pets', 'Puppies/kittens', 'Disabled pets', 'Anxious/fearful pets', 'Aggressive behavior management'];

export default function PetCareInfoScreen({ navigation }) {
  const alert = useAppAlert();
  const [petPreferences, setPetPreferences] = useState([]);
  const [petSizePreference, setPetSizePreference] = useState([]);
  const [walkFrequency, setWalkFrequency] = useState('');
  const [feedingExperience, setFeedingExperience] = useState([]);
  const [specialCareExperience, setSpecialCareExperience] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchPetCareInfo();
    }, [])
  );

  const fetchPetCareInfo = async () => {
    try {
      setIsLoading(true);
      const response = await getBuildTrustSection('PET_CARE_INFO');

      if (response.success && response.data.exists && response.data.settings) {
        const settings = response.data.settings;
        setPetPreferences(settings.petPreferences || []);
        setPetSizePreference(settings.petSizePreference || []);
        setWalkFrequency(settings.walkFrequency || '');
        setFeedingExperience(settings.feedingExperience || []);
        setSpecialCareExperience(settings.specialCareExperience || []);
        setAdditionalNotes(settings.additionalNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch pet care info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMultiSelect = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      if (petPreferences.length === 0) {
        alert('Required', 'Please select at least one pet type preference', 'pending');
        return;
      }

      if (petSizePreference.length === 0) {
        alert('Required', 'Please select at least one pet size preference', 'pending');
        return;
      }

      if (!walkFrequency) {
        alert('Required', 'Please select a walk frequency', 'pending');
        return;
      }

      // Prepare settings data
      const settings = {
        petPreferences,
        petSizePreference,
        walkFrequency,
        feedingExperience,
        specialCareExperience,
        additionalNotes,
      };

      // Save to backend
      const response = await upsertBuildTrustSection('PET_CARE_INFO', settings, true);

      if (response.success) {
        setIsSaving(false);
        // Navigate back to ProfileSetup with completion flag
        navigation.navigate('ProfileSetup', { completedSection: 'petCareInfo' });
      } else {
        setIsSaving(false);
        alert('Error', 'Failed to save pet care info. Please try again.', 'error');
      }
    } catch (error) {
      setIsSaving(false);
      console.error('Error saving pet care info:', error);
      alert('Error', 'Failed to save pet care info. Please try again.', 'error');
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

  const renderChips = (options, selectedList, onToggle) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isSelected = selectedList.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(option)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSingleSelectChips = (options, selectedValue, onSelect) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(isSelected ? '' : option)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

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
          <Text style={styles.headerTitle}>Pet Care Information</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pet Type Preferences */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pet Preferences <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              What types of pets are you comfortable caring for?
            </Text>
            {renderChips(PET_TYPE_OPTIONS, petPreferences, (val) =>
              toggleMultiSelect(petPreferences, setPetPreferences, val)
            )}
          </View>

          {/* Pet Size Preferences */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pet Size Preference <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              What sizes of pets can you handle?
            </Text>
            {renderChips(PET_SIZE_OPTIONS, petSizePreference, (val) =>
              toggleMultiSelect(petSizePreference, setPetSizePreference, val)
            )}
          </View>

          {/* Walk Frequency */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Walk Frequency <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              How often are you willing to walk pets per day?
            </Text>
            {renderSingleSelectChips(WALK_FREQUENCY_OPTIONS, walkFrequency, setWalkFrequency)}
          </View>

          {/* Feeding Experience */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Feeding Experience</Text>
            <Text style={styles.helperText}>
              What types of pet feeding are you experienced with?
            </Text>
            {renderChips(FEEDING_OPTIONS, feedingExperience, (val) =>
              toggleMultiSelect(feedingExperience, setFeedingExperience, val)
            )}
          </View>

          {/* Special Care Experience */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Special Care Experience</Text>
            <Text style={styles.helperText}>
              Do you have experience with any special care needs?
            </Text>
            {renderChips(SPECIAL_CARE_OPTIONS, specialCareExperience, (val) =>
              toggleMultiSelect(specialCareExperience, setSpecialCareExperience, val)
            )}
          </View>

          {/* Additional Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.helperText}>
              Anything else about your pet care experience (optional)
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Share anything else about your pet care experience..."
                placeholderTextColor="#898D8F"
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>
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
    marginBottom: 16,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#F9F9F9',
  },
  chipSelected: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderColor: '#FFC2EB',
  },
  chipText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  chipTextSelected: {
    color: '#32A6D8',
  },
  textAreaContainer: {
    minHeight: 100,
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

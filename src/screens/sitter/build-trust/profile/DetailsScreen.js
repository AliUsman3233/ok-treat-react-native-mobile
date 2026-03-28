import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { Button } from '../../../../components';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import { BackArrowIcon, PawFilledIcon } from '../../../../assets';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../../services/buildTrustService';
import api from '../../../../config/api';

const SKILL_OPTIONS = [
  'Skilled in oral medication delivery',
  'Experienced with senior dogs',
  'Able to provide daily exercise',
  'Comfortable with puppies',
  'Experienced with special needs pets',
  'Trained in pet first aid',
  'Experienced with multiple pets',
  'Can handle reactive dogs',
  'Comfortable with exotic pets',
  'Skilled in injection medication',
];

const HOME_TYPE_OPTIONS = ['House', 'Apartment', 'Condo', 'Farm', 'Townhouse'];

const YARD_TYPE_OPTIONS = ['Fenced yard', 'Unfenced yard', 'No yard'];

const SMOKING_POLICY_OPTIONS = ['Smoke-free home', 'Outdoor smoking only', 'Smoking allowed'];

const PETS_IN_HOME_OPTIONS = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Reptile', 'None'];

const PET_RESTRICTION_OPTIONS = [
  'Only spayed/neutered dogs',
  'No puppies under 1 year',
  'No aggressive breeds',
  'No unvaccinated pets',
  'No intact males',
  'No restrictions',
];

const YEARS_EXPERIENCE_OPTIONS = ['< 1', '1-2', '3-5', '5-10', '10+'];

export default function DetailsScreen({ navigation }) {
  const [aboutPet, setAboutPet] = useState('');
  const [skills, setSkills] = useState([]);
  const [homeType, setHomeType] = useState('');
  const [yardType, setYardType] = useState('');
  const [smokingPolicy, setSmokingPolicy] = useState('');
  const [childrenInHome, setChildrenInHome] = useState(null);
  const [petsInHome, setPetsInHome] = useState([]);
  const [petRestrictions, setPetRestrictions] = useState([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAIGenerateAbout = async () => {
    try {
      setAiGenerating(true);

      const data = {
        yearsExperience: yearsExperience || '',
        skills: skills || [],
        homeType: homeType || '',
        petPreferences: petsInHome || [],
      };

      const response = await api.post('/ai/sitter-about', data);

      if (response.data.success && response.data.data.description) {
        setAboutPet(response.data.data.description);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to generate description');
      }
    } catch (error) {
      console.error('AI generate error:', error);
      const message = error.response?.data?.message || 'Failed to generate description. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Fetch existing data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchDetails();
    }, [])
  );

  const fetchDetails = async () => {
    try {
      const response = await getBuildTrustSection('DETAILS');

      if (response.success && response.data.exists && response.data.settings) {
        const settings = response.data.settings;
        setAboutPet(settings.aboutPet || '');
        setSkills(Array.isArray(settings.skills) ? settings.skills : []);
        setHomeType(settings.homeType || '');
        setYardType(settings.yardType || '');
        setSmokingPolicy(settings.smokingPolicy || '');
        setChildrenInHome(
          settings.childrenInHome === true || settings.childrenInHome === false
            ? settings.childrenInHome
            : null
        );
        setPetsInHome(Array.isArray(settings.petsInHome) ? settings.petsInHome : []);
        setPetRestrictions(Array.isArray(settings.petRestrictions) ? settings.petRestrictions : []);
        setYearsExperience(settings.yearsExperience || '');
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!aboutPet.trim()) {
        Alert.alert('Required', 'Please describe your pet care experience');
        return;
      }

      if (skills.length === 0) {
        Alert.alert('Required', 'Please select at least one skill');
        return;
      }

      if (!homeType) {
        Alert.alert('Required', 'Please select your home type');
        return;
      }

      if (!yearsExperience) {
        Alert.alert('Required', 'Please select your years of experience');
        return;
      }

      const settings = {
        aboutPet: aboutPet.trim(),
        skills,
        homeType,
        yardType,
        smokingPolicy,
        childrenInHome,
        petsInHome,
        petRestrictions,
        yearsExperience,
      };

      const response = await upsertBuildTrustSection('DETAILS', settings, true);

      if (response.success) {
        navigation.navigate('Photos');
      } else {
        Alert.alert('Error', 'Failed to save details. Please try again.');
      }
    } catch (error) {
      console.error('Error saving details:', error);
      Alert.alert('Error', 'Failed to save details. Please try again.');
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

  // Toggle a value in an array state (for multi-select)
  const toggleArrayValue = (arr, setArr, value) => {
    if (arr.includes(value)) {
      setArr(arr.filter((item) => item !== value));
    } else {
      // If selecting "None" in petsInHome, clear all others
      if (setArr === setPetsInHome && value === 'None') {
        setArr(['None']);
        return;
      }
      // If selecting "No restrictions" in petRestrictions, clear all others
      if (setArr === setPetRestrictions && value === 'No restrictions') {
        setArr(['No restrictions']);
        return;
      }
      // If selecting something else when "None" or "No restrictions" is selected, remove those
      const filtered = arr.filter(
        (item) => item !== 'None' && item !== 'No restrictions'
      );
      setArr([...filtered, value]);
    }
  };

  // Render a single-select chip row
  const renderSingleSelect = (options, selected, onSelect) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render a multi-select chip row
  const renderMultiSelect = (options, selected, setSelected) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggleArrayValue(selected, setSelected, option)}
            activeOpacity={0.7}
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
          <Text style={styles.headerTitle}>Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tips Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Share your pet-care experience with us</Text>

            <Text style={styles.helperText}>
              Tell pet parents about your qualities and love for animals
            </Text>

            <Text style={styles.tipsTitle}>Tips:</Text>

            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <PawFilledIcon width={13.34} height={12} fill="#FFC2EB" />
                <Text style={styles.tipText}>
                  Avoid adding personal identifiers (e.g., last name or workplace) to your profile.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <PawFilledIcon width={13.34} height={12} fill="#FFC2EB" />
                <Text style={styles.tipText}>
                  Please select Save & Continue below to ensure your updates are saved.
                </Text>
              </View>
            </View>
          </View>

          {/* 1. About Section */}
          <View style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>About You & Pet Care <Text style={{ color: '#FF3B30' }}>*</Text></Text>
              <TouchableOpacity
                style={styles.aiGenerateButton}
                onPress={handleAIGenerateAbout}
                disabled={aiGenerating}
                activeOpacity={0.7}
              >
                {aiGenerating ? (
                  <ActivityIndicator size="small" color="#32A6D8" />
                ) : (
                  <Text style={styles.aiGenerateButtonText}>AI Generate</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Dog parents will be able to see this on your profile.
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your pet care experience and what makes you a great sitter..."
                placeholderTextColor="#898D8F"
                value={aboutPet}
                onChangeText={(text) => {
                  if (text.length <= 500) setAboutPet(text);
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{aboutPet.length}/500</Text>
            </View>
          </View>

          {/* 2. Skills Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Skills <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              Select the skills that best describe your abilities.
            </Text>
            {renderMultiSelect(SKILL_OPTIONS, skills, setSkills)}
          </View>

          {/* 3. Home Type */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Home Type <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              What type of home do you live in?
            </Text>
            {renderSingleSelect(HOME_TYPE_OPTIONS, homeType, setHomeType)}
          </View>

          {/* 4. Yard Type */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Yard</Text>
            <Text style={styles.helperText}>
              Do you have a yard for pets to play in?
            </Text>
            {renderSingleSelect(YARD_TYPE_OPTIONS, yardType, setYardType)}
          </View>

          {/* 5. Smoking Policy */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Smoking</Text>
            <Text style={styles.helperText}>
              What is your home's smoking policy?
            </Text>
            {renderSingleSelect(SMOKING_POLICY_OPTIONS, smokingPolicy, setSmokingPolicy)}
          </View>

          {/* 6. Children in Home */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Children in Home</Text>
            <Text style={styles.helperText}>
              Are there children living in your home?
            </Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  childrenInHome === true && styles.toggleButtonSelected,
                ]}
                onPress={() => setChildrenInHome(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    childrenInHome === true && styles.toggleButtonTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  childrenInHome === false && styles.toggleButtonSelected,
                ]}
                onPress={() => setChildrenInHome(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    childrenInHome === false && styles.toggleButtonTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 7. Pets in Home */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pets in Your Home</Text>
            <Text style={styles.helperText}>
              What pets do you currently have?
            </Text>
            {renderMultiSelect(PETS_IN_HOME_OPTIONS, petsInHome, setPetsInHome)}
          </View>

          {/* 8. Pet Restrictions */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pet Restrictions</Text>
            <Text style={styles.helperText}>
              Are there any restrictions for pets you will care for?
            </Text>
            {renderMultiSelect(PET_RESTRICTION_OPTIONS, petRestrictions, setPetRestrictions)}
          </View>

          {/* 9. Years of Experience */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Years of Experience <Text style={{ color: '#FF3B30' }}>*</Text></Text>
            <Text style={styles.helperText}>
              How many years of pet care experience do you have?
            </Text>
            {renderSingleSelect(YEARS_EXPERIENCE_OPTIONS, yearsExperience, setYearsExperience)}
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
            title={isSaving ? 'Saving...' : 'Save & Continue'}
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
    padding: 16,
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
  cardTitle: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
    flex: 1,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#32A6D8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  aiGenerateButtonText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  helperText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  tipsTitle: {
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    marginTop: 4,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipText: {
    flex: 1,
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  textAreaContainer: {
    minHeight: 121,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  textArea: {
    flex: 1,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    padding: 0,
    minHeight: 80,
  },
  charCount: {
    color: '#818898',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  chipSelected: {
    backgroundColor: '#FFC2EB',
    borderColor: '#32A6D8',
  },
  chipText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  chipTextSelected: {
    color: '#32A6D8',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: '#FFC2EB',
    borderColor: '#32A6D8',
  },
  toggleButtonText: {
    color: '#666D80',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  toggleButtonTextSelected: {
    color: '#32A6D8',
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

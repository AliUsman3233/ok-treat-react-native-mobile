import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import Icon from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import { Dropdown } from '../../components';
import DateRangePicker from '../../components/DateRangePicker';
import { CalendarIcon, AngleDownIcon } from '../../assets';
import { useKeyboardHeight } from '../../utils/useKeyboardHeight';
import api from '../../config/api';

export default function PetWizardStep2Screen({ formData, setFormData }) {
  const alert = useAppAlert();
  const keyboardHeight = useKeyboardHeight();
  // Seed picker state from formData on first render so EditPet (and re-renders
  // of AddPet after going back/forward through steps) pre-select the saved date.
  // moment() is lenient enough to parse ISO, "5 Jun 2024", and other variants.
  const seedDate = () => {
    if (!formData.adoptionDate) return null;
    const m = moment(formData.adoptionDate);
    return m.isValid() ? m : null;
  };
  const [startDate, setStartDate] = useState(seedDate);
  const [endDate, setEndDate] = useState(seedDate);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAIGenerate = async () => {
    try {
      setAiGenerating(true);

      const petData = {
        name: formData.name || '',
        breed: formData.breed || '',
        type: formData.petType || '',
        age: formData.ageYears ? `${formData.ageYears} years${formData.ageMonths ? ` ${formData.ageMonths} months` : ''}` : '',
        weight: formData.weight || '',
        sex: formData.sex || '',
      };

      const response = await api.post('/ai/pet-description', petData);

      if (response.data.success && response.data.data.description) {
        setFormData({ ...formData, description: response.data.data.description });
      } else {
        alert('Error', response.data.message || 'Failed to generate description', 'error');
      }
    } catch (error) {
      console.error('AI generate error:', error);
      const message = error.response?.data?.message || 'Failed to generate description. Please try again.';
      alert('Error', message, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Adoption Date is a single calendar day — the picker is in mode='single'
  // and calls back with the same date for both start and end.
  const handleDateChange = (start) => {
    setStartDate(start);
    setEndDate(start);
    if (start) {
      setFormData({ ...formData, adoptionDate: moment(start).format('D MMM YYYY') });
    }
  };

  return (
    <>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + keyboardHeight }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Microchipped */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Microchipped?</Text>
            <Dropdown
              placeholder="Microchipped"
              value={formData.microchipped}
              onSelect={(value) => setFormData({ ...formData, microchipped: value })}
              options={['Yes', 'No', 'Unknown']}
              rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
              containerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
            />
          </View>

          {/* Spayed/Neutered */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Spayed/Neutered</Text>
            <Dropdown
              placeholder="Not spayed/neutered"
              value={formData.spayedNeutered}
              onSelect={(value) => setFormData({ ...formData, spayedNeutered: value })}
              options={['Spayed/Neutered', 'Not spayed/neutered', 'Unknown']}
              rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
              containerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
            />
          </View>

          {/* House Trained */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>House trained?</Text>
            <Dropdown
              placeholder="Unsure if house trained"
              value={formData.houseTrained}
              onSelect={(value) => setFormData({ ...formData, houseTrained: value })}
              options={['Yes', 'No', 'Unsure if house trained']}
              rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
              containerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
            />
          </View>

          {/* Friendly with Children */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Friendly with children?</Text>
            <Dropdown
              placeholder="Not friendly with children"
              value={formData.friendlyWithChildren}
              onSelect={(value) => setFormData({ ...formData, friendlyWithChildren: value })}
              options={['Yes', 'No', 'Unknown']}
              rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
              containerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
            />
          </View>

          {/* Friendly with Dogs/Cats */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Friendly with dogs/cats?</Text>
            <Dropdown
              placeholder="Friendly with cats"
              value={formData.friendlyWithPets}
              onSelect={(value) => setFormData({ ...formData, friendlyWithPets: value })}
              options={['Friendly with dogs', 'Friendly with cats', 'Friendly with both', 'Not friendly with other pets', 'Unknown']}
              rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
              containerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
            />
          </View>

          {/* Adoption Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Adoption Date</Text>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
              direction="past"
              mode="single"
            >
              <View style={styles.datePickerButton}>
                <View style={styles.datePickerContent}>
                  <CalendarIcon width={20} height={20} fill="#FFC2EB" />
                  <Text style={styles.datePickerText}>
                    {formData.adoptionDate || 'Select date'}
                  </Text>
                </View>
                <AngleDownIcon width={20} height={20} fill="#32A6D8" />
              </View>
            </DateRangePicker>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.descriptionLabelRow}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TouchableOpacity
                style={styles.aiGenerateButton}
                onPress={handleAIGenerate}
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
            <TextInput
              style={styles.textArea}
              placeholder="Add a description of your pet"
              placeholderTextColor="rgba(137, 141, 143, 0.60)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1,
  },
  fieldContainer: {
    gap: 6,
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#090E12',
    fontFamily: 'Avenir LT Std',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  dropdownContainer: {
    marginBottom: 0,
    height: 56,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  dropdownText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  datePickerButton: {
    height: 56,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  datePickerText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  descriptionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  textArea: {
    height: 119,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    color: '#090E12',
    lineHeight: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
    outlineStyle: 'none',
  },
});

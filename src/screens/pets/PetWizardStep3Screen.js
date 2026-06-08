import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { Dropdown } from '../../components';
import { useKeyboardHeight } from '../../utils/useKeyboardHeight';

const { width } = Dimensions.get('window');

export default function PetWizardStep3Screen({ formData, setFormData }) {
  const keyboardHeight = useKeyboardHeight();
  const toggleMedication = (medication) => {
    const currentMedications = formData.medications || [];
    if (currentMedications.includes(medication)) {
      setFormData({
        ...formData,
        medications: currentMedications.filter(m => m !== medication)
      });
    } else {
      setFormData({
        ...formData,
        medications: [...currentMedications, medication]
      });
    }
  };

  const isMedicationSelected = (medication) => {
    return (formData.medications || []).includes(medication);
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + keyboardHeight }]}
      showsVerticalScrollIndicator={true}
      bounces={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Form Card */}
      <View style={styles.formCard}>
        {/* Potty Break */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Potty break</Text>
          <Dropdown
            placeholder="Needs a potty break every 2 hours"
            value={formData.pottyBreak}
            onSelect={(value) => setFormData({ ...formData, pottyBreak: value })}
            options={[
              'Needs a potty break every 1 hour',
              'Needs a potty break every 2 hours',
              'Needs a potty break every 3-4 hours',
              'Needs a potty break every 5-6 hours',
              'Can hold it for 8+ hours'
            ]}
            rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
            containerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
          />
        </View>

        {/* Energy Level */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Energy Level</Text>
          <View style={styles.energyLevelContainer}>
            <View style={styles.energyRow}>
              <TouchableOpacity
                style={[
                  styles.energyButton,
                  styles.energyButtonHalf,
                  formData.energyLevel === 'High energy level' && styles.energyButtonActive
                ]}
                onPress={() => setFormData({ ...formData, energyLevel: 'High energy level' })}
              >
                <Text style={[
                  styles.energyButtonText,
                  formData.energyLevel === 'High energy level' && styles.energyButtonTextActive
                ]}>
                  High energy level
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.energyButton,
                  styles.energyButtonHalf,
                  formData.energyLevel === 'Low energy level' && styles.energyButtonActive
                ]}
                onPress={() => setFormData({ ...formData, energyLevel: 'Low energy level' })}
              >
                <Text style={[
                  styles.energyButtonText,
                  formData.energyLevel === 'Low energy level' && styles.energyButtonTextActive
                ]}>
                  Low energy level
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.energyButton,
                styles.energyButtonFull,
                formData.energyLevel === 'Moderate energy level' && styles.energyButtonActive
              ]}
              onPress={() => setFormData({ ...formData, energyLevel: 'Moderate energy level' })}
            >
              <Text style={[
                styles.energyButtonText,
                formData.energyLevel === 'Moderate energy level' && styles.energyButtonTextActive
              ]}>
                Moderate energy level
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feeding Schedule */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Feeding schedule</Text>
          <Dropdown
            placeholder="Needs to be fed twice a day"
            value={formData.feedingSchedule}
            onSelect={(value) => setFormData({ ...formData, feedingSchedule: value })}
            options={[
              'Needs to be fed once a day',
              'Needs to be fed twice a day',
              'Needs to be fed three times a day',
              'Free feeding (food always available)'
            ]}
            rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
            containerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
          />
        </View>

        {/* Can Be Left Alone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Can be left alone</Text>
          <Dropdown
            placeholder="Can be left alone for 4 - 8 hours"
            value={formData.canBeLeftAlone}
            onSelect={(value) => setFormData({ ...formData, canBeLeftAlone: value })}
            options={[
              'Cannot be left alone',
              'Can be left alone for 1-2 hours',
              'Can be left alone for 2-4 hours',
              'Can be left alone for 4 - 8 hours',
              'Can be left alone for 8+ hours'
            ]}
            rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
            containerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
          />
        </View>

        {/* Medication */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Medication (select all that apply)</Text>
          <View style={styles.medicationContainer}>
            <TouchableOpacity
              style={[
                styles.medicationButton,
                isMedicationSelected('Pill') && styles.medicationButtonActive
              ]}
              onPress={() => toggleMedication('Pill')}
            >
              <Text style={[
                styles.medicationButtonText,
                isMedicationSelected('Pill') && styles.medicationButtonTextActive
              ]}>
                Pill
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.medicationButton,
                isMedicationSelected('Topical') && styles.medicationButtonActive
              ]}
              onPress={() => toggleMedication('Topical')}
            >
              <Text style={[
                styles.medicationButtonText,
                isMedicationSelected('Topical') && styles.medicationButtonTextActive
              ]}>
                Topical
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.medicationButton,
                isMedicationSelected('Injection') && styles.medicationButtonActive
              ]}
              onPress={() => toggleMedication('Injection')}
            >
              <Text style={[
                styles.medicationButtonText,
                isMedicationSelected('Injection') && styles.medicationButtonTextActive
              ]}>
                Injection
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Instructions */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Anything else a sitter should know?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add instructions for walking, feeding, or other care"
            placeholderTextColor="rgba(137, 141, 143, 0.60)"
            value={formData.additionalInstructions}
            onChangeText={(text) => setFormData({ ...formData, additionalInstructions: text })}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>
    </ScrollView>
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
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1,
  },
  fieldContainer: {
    gap: 6,
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
  energyLevelContainer: {
    gap: 8,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  energyButton: {
    height: 39,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  energyButtonHalf: {
    flex: 1,
  },
  energyButtonFull: {
    alignSelf: 'flex-start',
  },
  energyButtonActive: {
    backgroundColor: '#32A6D8',
    borderColor: '#32A6D8',
  },
  energyButtonText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  energyButtonTextActive: {
    color: '#FFFFFF',
  },
  medicationContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  medicationButton: {
    height: 39,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  medicationButtonActive: {
    backgroundColor: '#32A6D8',
    borderColor: '#32A6D8',
  },
  medicationButtonText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  medicationButtonTextActive: {
    color: '#FFFFFF',
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

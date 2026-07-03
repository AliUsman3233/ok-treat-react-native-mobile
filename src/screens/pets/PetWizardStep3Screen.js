import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { Dropdown } from '../../components';
import { useKeyboardHeight } from '../../utils/useKeyboardHeight';

const { width } = Dimensions.get('window');

const FOOD_ALLERGY_PRESETS = ['Chicken', 'Beef', 'Fish', 'Grain', 'Dairy', 'Nuts'];
const MEDICATION_ALLERGY_PRESETS = ['Penicillin', 'NSAIDs', 'Steroids', 'Sulfa'];

// Sentinel string stored inside the allergies array when the owner
// explicitly says there are no known allergies. Keeps the DB shape
// consistent (always Json array) instead of null-vs-empty ambiguity.
const NONE_KNOWN = 'None known';

export default function PetWizardStep3Screen({ formData, setFormData }) {
  const keyboardHeight = useKeyboardHeight();
  const [medDraft, setMedDraft] = useState('');
  const [foodDraft, setFoodDraft] = useState('');
  const [medAllergyDraft, setMedAllergyDraft] = useState('');

  const medications = Array.isArray(formData.medications) ? formData.medications : [];
  const foodAllergies = Array.isArray(formData.foodAllergies) ? formData.foodAllergies : [];
  const medAllergies = Array.isArray(formData.medicationAllergies) ? formData.medicationAllergies : [];

  const addMedication = () => {
    const v = medDraft.trim();
    if (!v) return;
    if (medications.includes(v)) { setMedDraft(''); return; }
    setFormData({ ...formData, medications: [...medications, v] });
    setMedDraft('');
  };
  const removeMedication = (v) => {
    setFormData({ ...formData, medications: medications.filter((m) => m !== v) });
  };

  // Chip pickers for allergies: tapping a preset toggles it, tapping
  // "None known" clears the list to just [NONE_KNOWN] (and toggling
  // any other preset clears the sentinel).
  const toggleAllergy = (key, list, value) => {
    let next;
    if (value === NONE_KNOWN) {
      next = list.includes(NONE_KNOWN) ? [] : [NONE_KNOWN];
    } else {
      const withoutNone = list.filter((v) => v !== NONE_KNOWN);
      next = withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    }
    setFormData({ ...formData, [key]: next });
  };

  const addCustomAllergy = (key, list, draft, setDraft) => {
    const v = draft.trim();
    if (!v) return;
    const withoutNone = list.filter((x) => x !== NONE_KNOWN);
    if (withoutNone.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft('');
      return;
    }
    setFormData({ ...formData, [key]: [...withoutNone, v] });
    setDraft('');
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

        {/* Medications */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Medications</Text>
          <Text style={styles.fieldHint}>e.g. "Apoquel 5mg once daily" — one per line</Text>
          <View style={styles.rowInput}>
            <TextInput
              style={styles.inlineInput}
              placeholder="Add a medication"
              placeholderTextColor="rgba(137, 141, 143, 0.60)"
              value={medDraft}
              onChangeText={setMedDraft}
              onSubmitEditing={addMedication}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={addMedication} style={styles.addBtn}>
              <Icon name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {medications.length > 0 && (
            <View style={styles.chipList}>
              {medications.map((m) => (
                <View key={m} style={[styles.chip, styles.chipActive]}>
                  <Text style={styles.chipTextActive}>{m}</Text>
                  <TouchableOpacity onPress={() => removeMedication(m)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Icon name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Food Allergies */}
        <AllergyPicker
          label="Food allergies"
          hint="Anything a sitter must NOT feed"
          presets={FOOD_ALLERGY_PRESETS}
          value={foodAllergies}
          onToggle={(v) => toggleAllergy('foodAllergies', foodAllergies, v)}
          draft={foodDraft}
          setDraft={setFoodDraft}
          onAddCustom={() => addCustomAllergy('foodAllergies', foodAllergies, foodDraft, setFoodDraft)}
        />

        {/* Medication Allergies */}
        <AllergyPicker
          label="Medication allergies"
          hint="Drugs your pet reacts to"
          presets={MEDICATION_ALLERGY_PRESETS}
          value={medAllergies}
          onToggle={(v) => toggleAllergy('medicationAllergies', medAllergies, v)}
          draft={medAllergyDraft}
          setDraft={setMedAllergyDraft}
          onAddCustom={() => addCustomAllergy('medicationAllergies', medAllergies, medAllergyDraft, setMedAllergyDraft)}
        />

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

function AllergyPicker({ label, hint, presets, value, onToggle, draft, setDraft, onAddCustom }) {
  const noneOn = value.includes(NONE_KNOWN);
  const customEntries = value.filter((v) => v !== NONE_KNOWN && !presets.includes(v));
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <View style={styles.chipList}>
        <TouchableOpacity
          style={[styles.chip, noneOn && styles.chipActive]}
          onPress={() => onToggle(NONE_KNOWN)}
        >
          <Text style={[styles.chipText, noneOn && styles.chipTextActive]}>None known</Text>
        </TouchableOpacity>
        {presets.map((p) => {
          const active = value.includes(p);
          return (
            <TouchableOpacity
              key={p}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(p)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          );
        })}
        {customEntries.map((c) => (
          <View key={c} style={[styles.chip, styles.chipActive]}>
            <Text style={styles.chipTextActive}>{c}</Text>
            <TouchableOpacity onPress={() => onToggle(c)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Icon name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.rowInput}>
        <TextInput
          style={styles.inlineInput}
          placeholder="Add another…"
          placeholderTextColor="rgba(137, 141, 143, 0.60)"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={onAddCustom}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={onAddCustom} style={styles.addBtn}>
          <Icon name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
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
  fieldHint: {
    color: '#818898',
    fontFamily: 'Avenir LT Std',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
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
  chipList: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#32A6D8',
    borderColor: '#32A6D8',
  },
  chipText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Avenir LT Std',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    color: '#090E12',
    backgroundColor: '#FFFFFF',
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
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

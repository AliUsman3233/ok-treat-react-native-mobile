// Chip-style multi-select for "What type of pets can you sit?". Used on
// every service-setup screen (Boarding, House Sitting, Drop-in Visits,
// Day Care, Pet Walking). Lets sitters pick multiple sizes/species
// instead of being forced into a single option.
//
// Backend stores the result as a JSON array under settings.petTypes.
// For legacy rows that stored a single string, parse into [string] on
// load so the chip selector shows the saved value selected.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DEFAULT_OPTIONS = [
  'Small dog (0-15 lbs)',
  'Medium dog (16-40 lbs)',
  'Large dog (41-100 lbs)',
  'Giant dog (101+ lbs)',
  'Cat',
  'Bird',
  'Rabbit',
  'Reptile',
  'Small animal',
  'Other',
];

export default function PetTypeMultiSelect({ value, onChange, options = DEFAULT_OPTIONS }) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <View>
      <Text style={styles.hint}>Tap all that apply. You can select more than one.</Text>
      <View style={styles.chipsWrap}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => toggle(opt)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export { DEFAULT_OPTIONS as PET_TYPE_OPTIONS };

const styles = StyleSheet.create({
  hint: {
    color: '#A0AEC0',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 15,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: 'rgba(50, 166, 216, 0.12)',
    borderColor: '#32A6D8',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#32A6D8',
    fontWeight: '700',
  },
});

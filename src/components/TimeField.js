// Simple button that opens the native OS time picker on tap. Stores
// time as an "HH:mm" 24-hour string for cheap comparisons and easy
// JSON serialization.
//
// Displays as "9:00 AM" / "5:30 PM" for user readability.
//
// Usage:
//   <TimeField
//     value={dailyStartTime}
//     onChange={setDailyStartTime}
//     label="Start time"
//     placeholder="e.g. 9:00 AM"
//   />

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// "HH:mm" → "9:00 AM"
export function formatTime12h(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const suffix = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Date → "HH:mm"
function dateToHHMM(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// "HH:mm" → Date on today at that time (used to seed the OS picker)
function hhmmToDate(hhmm) {
  const d = new Date();
  if (hhmm && typeof hhmm === 'string') {
    const [hStr, mStr] = hhmm.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  // Sensible default: 9 AM
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function TimeField({
  value,
  onChange,
  label,
  placeholder = 'Select time',
  containerStyle,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event, picked) => {
    // On Android the picker fires 'set' + 'dismissed'. Only 'set' has a
    // valid date. On iOS the picker is inline/spinner and every drag
    // fires 'set' — we still update on each so the label reflects it.
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    setShowPicker(Platform.OS === 'ios');
    if (picked) onChange(dateToHHMM(picked));
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, !value && styles.buttonTextPlaceholder]}>
          {value ? formatTime12h(value) : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={hhmmToDate(value)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    marginBottom: 6,
  },
  button: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: 14,
    color: '#0D0D12',
    fontFamily: 'Avenir LT Std',
  },
  buttonTextPlaceholder: { color: '#B0B0B0' },
  chevron: { color: '#32A6D8', fontSize: 14 },
});

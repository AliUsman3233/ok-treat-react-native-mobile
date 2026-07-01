// Single-day + start-time + end-time picker. Used by hour-based
// services (Drop-In Visit, Day Care, Pet Walking) on the search
// screen so the owner picks e.g. "Wed 2 Jul, 2:00 PM – 4:30 PM".
//
// Wraps the existing DateRangePicker for date selection (single-tap =
// same day, per our earlier flexibility fix) and two TimeFields for
// the hours. Emits { date, startTime, endTime } on Apply.
//
// Usage:
//   <DateTimeWindowPicker
//     date={date}
//     startTime={startTime}
//     endTime={endTime}
//     onChange={({ date, startTime, endTime }) => ...}
//   >
//     <YourTriggerView />
//   </DateTimeWindowPicker>

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import moment from 'moment';
import DateRangePicker from './DateRangePicker';
import TimeField, { formatTime12h } from './TimeField';

export default function DateTimeWindowPicker({
  date,          // moment/Date/null
  startTime,     // "HH:mm"
  endTime,       // "HH:mm"
  onChange,      // ({ date, startTime, endTime }) => void
  children,      // trigger element rendered inline
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(date || null);
  const [tempStart, setTempStart] = useState(startTime || '09:00');
  const [tempEnd, setTempEnd] = useState(endTime || '10:00');

  const open = () => {
    setTempDate(date || null);
    setTempStart(startTime || '09:00');
    setTempEnd(endTime || '10:00');
    setIsOpen(true);
  };

  const apply = () => {
    onChange?.({ date: tempDate, startTime: tempStart, endTime: tempEnd });
    setIsOpen(false);
  };

  const canApply = !!tempDate && !!tempStart && !!tempEnd && tempStart < tempEnd;

  // Inner date-range picker with a hidden trigger — we drive its open
  // via a wrapping TouchableOpacity below.
  return (
    <>
      <TouchableOpacity onPress={open} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Pick date & time</Text>

            {/* Date row */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date</Text>
              <DateRangePicker
                startDate={tempDate}
                endDate={tempDate}
                mode="single"
                onDateChange={(s) => setTempDate(s)}
              >
                <View style={styles.dateBtn}>
                  <Text style={styles.dateBtnText}>
                    {tempDate ? moment(tempDate).format('ddd D MMM YYYY') : 'Tap to pick a date'}
                  </Text>
                  <Text style={styles.chevron}>▾</Text>
                </View>
              </DateRangePicker>
            </View>

            {/* Time window row */}
            <View style={styles.timesRow}>
              <View style={styles.timeCol}>
                <TimeField value={tempStart} onChange={setTempStart} label="Start time" />
              </View>
              <View style={styles.timeCol}>
                <TimeField value={tempEnd} onChange={setTempEnd} label="End time" />
              </View>
            </View>
            {tempStart >= tempEnd && (
              <Text style={styles.err}>End time must be after start time.</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.skipBtn}>
                <Text style={styles.skipText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={apply}
                style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
                disabled={!canApply}
              >
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#0D0D12',
    textAlign: 'center',
  },
  row: { gap: 6 },
  rowLabel: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  dateBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBtnText: { fontSize: 14, color: '#0D0D12', fontFamily: 'Avenir LT Std' },
  chevron: { color: '#32A6D8', fontSize: 14 },
  timesRow: { flexDirection: 'row', gap: 12 },
  timeCol: { flex: 1 },
  err: {
    color: '#D93025',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  skipText: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  applyBtn: {
    backgroundColor: '#32A6D8',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  applyBtnDisabled: { backgroundColor: '#A0AEC0' },
  applyText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '700' },
});

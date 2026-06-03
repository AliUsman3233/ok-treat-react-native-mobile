import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import moment from 'moment';
import { AngleDownIcon } from '../assets';

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  children,
  // 'future' (default) blocks past dates — used by booking/search flows.
  // 'past' blocks future dates — used by Adoption Date (the event already happened).
  direction = 'future',
  // 'range' (default) requires both start AND end. 'single' picks one date —
  // the start and end are set to the same day so existing callers/highlighters work.
  mode = 'range',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [currentMonth, setCurrentMonth] = useState(moment());

  const handleOpen = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsVisible(true);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsVisible(false);
  };

  const handleDatePress = (date) => {
    // Single-pick mode: each tap sets both endpoints to the same day so Apply
    // enables immediately and the existing highlight logic still works.
    if (mode === 'single') {
      setTempStartDate(date);
      setTempEndDate(date);
      return;
    }

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      // Set end date
      if (date.isBefore(tempStartDate)) {
        setTempStartDate(date);
        setTempEndDate(null);
      } else {
        setTempEndDate(date);
      }
    }
  };

  const renderCalendar = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');

    const calendar = [];
    const day = startDate.clone().subtract(1, 'day');

    while (day.isBefore(endDate, 'day')) {
      calendar.push(
        Array(7).fill(0).map(() => day.add(1, 'day').clone())
      );
    }

    return calendar;
  };

  const isDateInRange = (date) => {
    if (!tempStartDate) return false;
    if (!tempEndDate) {
      // Only start date selected - highlight just the start date
      return date.isSame(tempStartDate, 'day');
    }
    // Both dates selected - highlight the entire range
    return date.isSameOrAfter(tempStartDate, 'day') && date.isSameOrBefore(tempEndDate, 'day');
  };

  const isStartDate = (date) => {
    return tempStartDate && date.isSame(tempStartDate, 'day');
  };

  const isEndDate = (date) => {
    return tempEndDate && date.isSame(tempEndDate, 'day');
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  return (
    <>
      <TouchableOpacity onPress={handleOpen} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Title */}
            <Text style={styles.title}>Select Date</Text>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                <View style={styles.navIcon}>
                  <AngleDownIcon width={24} height={24} fill="#32A6D8" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
              </TouchableOpacity>
              <Text style={styles.monthText}>{currentMonth.format('MMMM YYYY')}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <View style={styles.navIcon}>
                  <AngleDownIcon width={24} height={24} fill="#32A6D8" style={{ transform: [{ rotate: '-90deg' }] }} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              {/* Day headers */}
              <View style={styles.dayHeadersRow}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                  <View key={day} style={styles.dayHeaderCell}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              {renderCalendar().map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.weekRow}>
                  {week.map((day, dayIndex) => {
                    const isCurrentMonth = day.month() === currentMonth.month();
                    const isInRange = isDateInRange(day);
                    // Block dates in the wrong direction (future when picking
                    // a past event, or past when picking a future booking).
                    const isDisabled =
                      direction === 'past'
                        ? day.isAfter(moment(), 'day')
                        : day.isBefore(moment(), 'day');

                    return (
                      <TouchableOpacity
                        key={day.format('YYYY-MM-DD')}
                        style={styles.dayCell}
                        onPress={() => !isDisabled && handleDatePress(day)}
                        disabled={isDisabled}
                      >
                        <View style={[
                          styles.dayCircle,
                          isInRange && styles.dayCircleInRange,
                        ]}>
                          <Text
                            style={[
                              styles.dayText,
                              !isCurrentMonth && styles.dayTextOtherMonth,
                              isDisabled && styles.dayTextDisabled,
                              isInRange && styles.dayTextSelected,
                            ]}
                          >
                            {day.date()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleApply} 
                style={[styles.applyButton, (!tempStartDate || !tempEndDate) && styles.applyButtonDisabled]}
                disabled={!tempStartDate || !tempEndDate}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    gap: 12,
  },
  title: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 27.9,
    textAlign: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  monthText: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
  },
  calendarContainer: {
    gap: 6,
  },
  dayHeadersRow: {
    flexDirection: 'row',
  },
  dayHeaderCell: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderText: {
    color: '#A4ACB9',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    flex: 1,
    height: 36,
    
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleInRange: {
    backgroundColor: '#32A6D8',
  },
  dayText: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 21.7,
  },
  dayTextOtherMonth: {
    color: '#A4ACB9',
  },
  dayTextDisabled: {
    color: '#D1D5DB',
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(13, 13, 18, 0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  skipButtonText: {
    color: '#F38FB4',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
    textAlign: 'center',
  },
  applyButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#32A6D8',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(13, 13, 18, 0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  applyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
    textAlign: 'center',
  },
});

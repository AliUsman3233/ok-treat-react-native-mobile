import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, DogImage, ChatIcon, PhoneCallBlueIcon } from '../../../assets';
import Icon from '@expo/vector-icons/Ionicons';
import { getSitterCalendar } from '../../../services/bookingService';

const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Enum → human label for the booking cards.
const SERVICE_LABELS = {
  BOARDING: 'Boarding',
  HOUSE_SITTING: 'House Sitting',
  DROP_IN_VISITS: 'Drop-In Visit',
  DAY_CARE: 'Day Care',
  PET_WALKING: 'Pet Walking',
};

// Status → badge colors (status is already lowercased on the booking object).
const STATUS_COLORS = {
  pending: { bg: '#FFEED3', text: '#E5A33D' },
  confirmed: { bg: '#DCF5E5', text: '#2E9E5B' },
  accepted: { bg: '#DCF5E5', text: '#2E9E5B' },
  completed: { bg: '#E3F0FB', text: '#3A8DCC' },
  declined: { bg: '#FBE3E3', text: '#D06060' },
};

const humanizeService = (t) => SERVICE_LABELS[t] || t || '';
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Helper function to get calendar days for a month
const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  let firstDayOfWeek = firstDay.getDay();
  // Convert to Monday = 0, Sunday = 6
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const weeks = [];
  let currentWeek = new Array(firstDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
};

// Helper function to format month name
const getMonthName = (year, month) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[month]} ${year}`;
};

export default function SitterCalendarScreen({ navigation }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [displayYear, setDisplayYear] = useState(currentYear);
  const [displayMonth, setDisplayMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create date range for the displayed month (with some padding)
      const startDate = new Date(displayYear, displayMonth, 1).toISOString();
      const endDate = new Date(displayYear, displayMonth + 1, 0).toISOString();

      const response = await getSitterCalendar(startDate, endDate);
      // API shape: { success, data: { bookings: [...], count } }. Reach into
      // data.bookings; keep the looser fallbacks in case the shape changes.
      const bookingsArray =
        response?.data?.bookings ||
        response?.bookings ||
        (Array.isArray(response?.data) ? response.data : null) ||
        (Array.isArray(response) ? response : []);

      setAllBookings(bookingsArray.map(booking => {
        // The client is returned as `owner` (fullName / avatarUrl / phone).
        const owner = booking.owner || booking.user || booking.client || {};
        const avatar = owner.avatarUrl || owner.profileImage;
        return {
          id: booking.id || booking._id,
          clientUserId: owner.id || null,
          clientName: owner.fullName || owner.name || 'Client',
          clientImage: avatar ? { uri: avatar } : DogImage,
          petName: booking.pet?.name || '',
          serviceType: booking.serviceType || booking.service || '',
          date: new Date(booking.startDate || booking.date),
          address: owner.address || '',
          phone: owner.phone || '',
          status: booking.status?.toLowerCase() || 'upcoming',
        };
      }));
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError(err?.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [displayYear, displayMonth]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Get dates that have bookings
  const bookingDates = useMemo(() => {
    const dates = new Set();
    allBookings.forEach(booking => {
      const d = booking.date;
      if (d instanceof Date && !isNaN(d)) {
        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        dates.add(dateStr);
      }
    });
    return dates;
  }, [allBookings]);

  // Get bookings for selected date
  const selectedBookings = useMemo(() => {
    if (!selectedDate) return [];
    return allBookings.filter(booking => {
      const d = booking.date;
      return d instanceof Date && !isNaN(d) &&
             d.getFullYear() === displayYear &&
             d.getMonth() === displayMonth &&
             d.getDate() === selectedDate;
    });
  }, [selectedDate, displayYear, displayMonth, allBookings]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    return getCalendarDays(displayYear, displayMonth);
  }, [displayYear, displayMonth]);

  // Check if a date has bookings
  const hasBooking = (day) => {
    if (!day) return false;
    const dateStr = `${displayYear}-${displayMonth}-${day}`;
    return bookingDates.has(dateStr);
  };

  // Is this cell today's date (only meaningful while viewing the current month)
  const isTodayDate = (day) =>
    !!day &&
    displayYear === currentYear &&
    displayMonth === currentMonth &&
    day === today.getDate();

  // Check if we can navigate to next month (limit to 1 year in future)
  const canGoNext = () => {
    const nextYear = displayMonth === 11 ? displayYear + 1 : displayYear;
    const nextMonth = displayMonth === 11 ? 0 : displayMonth + 1;

    // Calculate months difference from current date
    const currentTotalMonths = currentYear * 12 + currentMonth;
    const nextTotalMonths = nextYear * 12 + nextMonth;

    // Allow navigation up to 12 months in the future
    return nextTotalMonths <= currentTotalMonths + 12;
  };

  // Navigate to previous month (no limit)
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
    setSelectedDate(null);
  };

  // Navigate to next month (limited to 1 year ahead)
  const goToNextMonth = () => {
    if (!canGoNext()) return;

    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
    setSelectedDate(null);
  };

  // Jump to current month
  const goToCurrentMonth = () => {
    setDisplayYear(currentYear);
    setDisplayMonth(currentMonth);
    setSelectedDate(null);
  };

  // Check if we're viewing current month
  const isCurrentMonth = displayYear === currentYear && displayMonth === currentMonth;

  // Handle date selection
  const handleDatePress = (day) => {
    if (day && hasBooking(day)) {
      setSelectedDate(day);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <Text style={styles.monthText}>{getMonthName(displayYear, displayMonth)}</Text>
            <View style={styles.monthNavigation}>
              {!isCurrentMonth && (
                <TouchableOpacity style={styles.todayButton} onPress={goToCurrentMonth} activeOpacity={0.85}>
                  <Icon name="today-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
                <Icon name="chevron-back" size={18} color="#212121" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, !canGoNext() && styles.navButtonDisabled]}
                onPress={goToNextMonth}
                disabled={!canGoNext()}
              >
                <Icon name="chevron-forward" size={18} color={canGoNext() ? "#5CADF4" : "#BDBDBD"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading indicator for calendar */}
          {loading && (
            <View style={styles.calendarLoadingOverlay}>
              <ActivityIndicator size="small" color="#32A6D8" />
            </View>
          )}

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Days of Week */}
            <View style={styles.daysRow}>
              {daysOfWeek.map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            {calendarDays.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.daysRow}>
                {week.map((day, dayIndex) => {
                  const isBookingDate = hasBooking(day);
                  const isSelected = day === selectedDate;
                  const isToday = isTodayDate(day);

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dateCell,
                        (isSelected || isBookingDate || isToday) && styles.dateCellWithBackground,
                        isBookingDate && !isSelected && styles.bookingDateCell,
                        isToday && !isSelected && styles.todayCell,
                        isSelected && styles.selectedDateCell,
                      ]}
                      onPress={() => handleDatePress(day)}
                      disabled={!day || !isBookingDate}
                    >
                      {day && (
                        <Text
                          style={[
                            styles.dateText,
                            isToday && !isSelected && styles.todayText,
                            isSelected && styles.selectedDateText,
                          ]}
                        >
                          {day}
                        </Text>
                      )}
                      {isBookingDate && !isSelected && <View style={styles.bookingDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendBooking]} />
              <Text style={styles.legendText}>Has bookings</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendToday]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>

        {/* My Bookings Section */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCalendarData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : selectedDate ? (
          selectedBookings.length > 0 && (
            <View style={styles.bookingsSection}>
              <View style={styles.bookingsHeader}>
                <Text style={styles.bookingsTitle}>My Bookings</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SitterBookings')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Booking Cards */}
              <View style={styles.bookingsList}>
                {selectedBookings.map((booking) => {
                  const sc = STATUS_COLORS[booking.status] || { bg: '#EEF0F3', text: '#818898' };
                  return (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingTop}>
                      <Image source={typeof booking.clientImage === 'string' ? { uri: booking.clientImage } : booking.clientImage} style={styles.bookingAvatar} />
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingClientName}>{booking.clientName}</Text>
                        <Text style={styles.bookingService}>
                          <Text style={styles.bookingServiceType}>{humanizeService(booking.serviceType)}</Text>
                          <Text style={styles.bookingDate}> - {formatDate(booking.date)}</Text>
                        </Text>
                      </View>
                      <View style={[styles.bookingStatusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.bookingStatusText, { color: sc.text }]}>{capitalize(booking.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingBottom}>
                      <View style={styles.bookingContact}>
                        {!!booking.address && (
                          <View style={styles.bookingContactItem}>
                            <Icon name="location-outline" size={14} color="#32A6D8" />
                            <Text style={styles.bookingContactText} numberOfLines={2}>{booking.address}</Text>
                          </View>
                        )}
                        {!!booking.petName && (
                          <View style={styles.bookingContactItem}>
                            <Icon name="paw-outline" size={14} color="#32A6D8" />
                            <Text style={styles.bookingContactText}>{booking.petName}</Text>
                          </View>
                        )}
                        {!!booking.phone && (
                          <View style={styles.bookingContactItem}>
                            <View style={styles.phoneIconsWrapper}>
                              <PhoneCallBlueIcon width={10} height={10} />
                              <View style={styles.phoneCircle} />
                            </View>
                            <Text style={styles.bookingContactText}>{booking.phone}</Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[styles.bookingChatButton, !booking.clientUserId && styles.bookingChatButtonDisabled]}
                        onPress={() => booking.clientUserId && navigation.navigate('ChatConversation', {
                          otherUserId: booking.clientUserId,
                          chatName: booking.clientName,
                        })}
                        disabled={!booking.clientUserId}
                      >
                        <ChatIcon width={21.05} height={21.05} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  );
                })}
              </View>
            </View>
          )
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Select a date to view bookings</Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
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
  calendarCard: {
    marginHorizontal: 18,
    marginTop: 12,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 17.84,
    padding: 10.71,
    paddingTop: 14.27,
    paddingBottom: 10.71,
    position: 'relative',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 7.14,
    marginBottom: 7.14,
  },
  monthText: {
    color: '#212121',
    fontSize: 16.06,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 19.27,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.6,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    backgroundColor: '#32A6D8',
    borderRadius: 20,
    marginRight: 2,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 16,
  },
  calendarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 17.84,
    zIndex: 10,
  },
  calendarGrid: {
    gap: 0,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(90, 172, 244, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendBooking: {
    backgroundColor: 'rgba(90, 172, 244, 0.2)',
  },
  legendToday: {
    borderWidth: 1.5,
    borderColor: '#32A6D8',
    backgroundColor: '#FFFFFF',
  },
  legendText: {
    color: '#5B6B7B',
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 35.68,
    padding: 8.92,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: {
    color: '#000000',
    fontSize: 10.71,
    fontFamily: 'Urbanist',
    fontWeight: '700',
    letterSpacing: 0.18,
    textAlign: 'center',
  },
  dateCell: {
    width: 35.68,
    height: 35.68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCellWithBackground: {
    borderRadius: 999,
  },
  selectedDateCell: {
    backgroundColor: '#FFC2EB',
  },
  bookingDateCell: {
    backgroundColor: 'rgba(90, 172, 244, 0.2)',
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: '#32A6D8',
  },
  todayText: {
    color: '#32A6D8',
    fontWeight: '700',
  },
  bookingDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#32A6D8',
  },
  dateText: {
    color: '#424242',
    fontSize: 12.49,
    fontFamily: 'Urbanist',
    fontWeight: '500',
    lineHeight: 17.49,
    letterSpacing: 0.18,
    textAlign: 'center',
  },
  selectedDateText: {
    color: '#32A6D8',
    fontWeight: '700',
  },
  bookingDateText: {
    color: '#5CADF4',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#32A6D8',
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  bookingsSection: {
    marginTop: 20,
    paddingHorizontal: 21,
    paddingBottom: 20,
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bookingsTitle: {
    color: '#212121',
    fontSize: 15.78,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.94,
  },
  seeAllText: {
    color: '#5CADF4',
    fontSize: 12.28,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 17.19,
    letterSpacing: 0.18,
  },
  bookingsList: {
    gap: 13,
  },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 12,
    position: 'relative',
  },
  bookingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingAvatar: {
    width: 34,
    height: 33,
    borderRadius: 9999,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bookingClientName: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  bookingService: {
    marginTop: 2,
  },
  bookingServiceType: {
    color: '#000000',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  bookingDate: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  bookingStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFEED3',
    borderRadius: 30,
  },
  bookingStatusText: {
    color: '#E5A33D',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
    textAlign: 'center',
  },
  bookingBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bookingContact: {
    flex: 1,
    gap: 4,
  },
  bookingContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingContactText: {
    color: '#8D8E90',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 14,
    flex: 1,
  },
  phoneIconsWrapper: {
    width: 16,
    height: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCircle: {
    width: 14.3,
    height: 14.3,
    borderRadius: 9999,
    borderWidth: 1.2,
    borderColor: '#32A6D8',
    position: 'absolute',
  },
  bookingChatButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingChatButtonDisabled: {
    opacity: 0.4,
  },
  emptyStateContainer: {
    marginTop: 40,
    paddingHorizontal: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 21,
    textAlign: 'center',
  },
});

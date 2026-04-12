import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, DogImage, ChatIcon, LocationArrowCircleUnfilledIcon, PhoneCallBlueIcon } from '../../../assets';
import Icon from '@expo/vector-icons/Ionicons';
import { getSitterCalendar } from '../../../services/bookingService';

const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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
  const insets = useSafeAreaInsets();
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
      const data = response?.bookings || response?.data || response || [];
      const bookingsArray = Array.isArray(data) ? data : [];

      setAllBookings(bookingsArray.map(booking => ({
        id: booking.id || booking._id,
        clientName: booking.client?.name || booking.clientName || booking.user?.name || 'Client',
        clientImage: booking.client?.profileImage || booking.clientImage
          ? { uri: booking.client?.profileImage || booking.clientImage }
          : DogImage,
        serviceType: booking.serviceType || booking.service || '',
        date: new Date(booking.startDate || booking.date),
        address: booking.address || booking.client?.address || booking.location || '',
        phone: booking.client?.phone || booking.phone || '',
        status: booking.status?.toLowerCase() || 'upcoming',
      })));
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
    return `${monthNames[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`;
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
              <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
                <Icon name="chevron-back" size={17.84} color="#212121" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, !canGoNext() && styles.navButtonDisabled]}
                onPress={goToNextMonth}
                disabled={!canGoNext()}
              >
                <Icon name="chevron-forward" size={17.84} color={canGoNext() ? "#5CADF4" : "#BDBDBD"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Today Button */}
          {!isCurrentMonth && (
            <TouchableOpacity style={[styles.todayButton, { top: 14.27 + insets.top }]} onPress={goToCurrentMonth}>
              <Icon name="today-outline" size={14} color="#FFFFFF" />
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          )}

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

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dateCell,
                        (isSelected || isBookingDate) && styles.dateCellWithBackground,
                        isSelected && styles.selectedDateCell,
                        isBookingDate && !isSelected && styles.bookingDateCell,
                      ]}
                      onPress={() => handleDatePress(day)}
                      disabled={!day || !isBookingDate}
                    >
                      {day && (
                        <Text
                          style={[
                            styles.dateText,
                            isSelected && styles.selectedDateText,
                          ]}
                        >
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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
                {selectedBookings.map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingTop}>
                      <Image source={typeof booking.clientImage === 'string' ? { uri: booking.clientImage } : booking.clientImage} style={styles.bookingAvatar} />
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingClientName}>{booking.clientName}</Text>
                        <Text style={styles.bookingService}>
                          <Text style={styles.bookingServiceType}>{booking.serviceType}</Text>
                          <Text style={styles.bookingDate}> - {formatDate(booking.date)}</Text>
                        </Text>
                      </View>
                      <View style={styles.bookingStatusBadge}>
                        <Text style={styles.bookingStatusText}>{booking.status}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingContact}>
                      <View style={styles.bookingContactItem}>
                        <LocationArrowCircleUnfilledIcon width={16} height={16} />
                        <Text style={styles.bookingContactText}>{booking.address}</Text>
                      </View>
                      <View style={styles.bookingContactItem}>
                        <View style={styles.phoneIconsWrapper}>
                          <PhoneCallBlueIcon width={10} height={10} />
                          <View style={styles.phoneCircle} />
                        </View>
                        <Text style={styles.bookingContactText}>{booking.phone}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.bookingChatButton}>
                      <ChatIcon width={21.05} height={21.05} />
                    </TouchableOpacity>
                  </View>
                ))}
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
    gap: 3.57,
  },
  navButton: {
    width: 17.84,
    height: 17.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  todayButton: {
    position: 'absolute',
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#32A6D8',
    borderRadius: 20,
    shadowColor: '#32A6D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 16,
  },
  calendarLoadingOverlay: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  calendarGrid: {
    gap: 0,
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
    padding: 8.92,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCellWithBackground: {
    borderRadius: 892.11,
  },
  selectedDateCell: {
    backgroundColor: '#FFC2EB',
  },
  bookingDateCell: {
    backgroundColor: 'rgba(90, 172, 244, 0.2)',
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
  bookingContact: {
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
    position: 'absolute',
    right: 12,
    top: 47,
    padding: 14.03,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 87.69,
    justifyContent: 'center',
    alignItems: 'center',
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

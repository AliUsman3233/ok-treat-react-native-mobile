import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CalendarIcon, LocationPinIcon, AngleDownIcon } from '../../assets';
import DateRangePicker from '../../components/DateRangePicker';
import DateTimeWindowPicker from '../../components/DateTimeWindowPicker';
import { formatTime12h } from '../../components/TimeField';
import moment from 'moment';

// Boarding + House Sitting are day-based (overnight). Drop-In / Day Care /
// Pet Walking need a single-day + time-window because they run for a few
// hours within one day. Anything not listed here falls back to day-based
// for safety.
const HOUR_BASED_SERVICES = new Set(['DropIn', 'Drop-In Visit', 'DayCare', 'Day Care', 'PetWalking', 'Pet Walking']);
const isHourBased = (t) => HOUR_BASED_SERVICES.has(t);

export default function ServiceSearchScreen({ navigation, route }) {
  const alert = useAppAlert();
  const { serviceType = 'Boarding', serviceTitle = 'Boarding', serviceSubtitle = 'When do you need a sitter?' } = route.params || {};
  const insets = useSafeAreaInsets();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  // Hour-based services: single day + time window (HH:mm)
  const [singleDate, setSingleDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('Current Location');
  const [locationData, setLocationData] = useState(null); // Store full location object with coordinates
  const hourBased = isHourBased(serviceType);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSearchNow = () => {
    if (hourBased) {
      if (!singleDate || !startTime || !endTime) {
        alert('Missing Time', 'Please pick a date and a time window.', 'pending');
        return;
      }
      // Combine the picked date with the HH:mm strings into full ISO
      // timestamps. Backend sitter search matches these against the
      // sitter's dailyStartTime / dailyEndTime.
      const combine = (date, hhmm) => {
        const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
        return moment(date).hour(h).minute(m).second(0).millisecond(0).toISOString();
      };
      const startISO = combine(singleDate, startTime);
      const endISO = combine(singleDate, endTime);
      navigation.navigate('SearchResults', {
        serviceType,
        searchParams: {
          startDate: startISO,
          endDate: endISO,
          // Separate HH:mm fields for the sitter-window filter — timestamps
          // alone would work but this makes the intent explicit for the
          // backend and easier to log/debug.
          startTime,
          endTime,
          location: selectedLocation,
          latitude: locationData?.latitude,
          longitude: locationData?.longitude,
        },
      });
      return;
    }

    if (!startDate) {
      alert('Missing Dates', 'Please select dates for your search', 'pending');
      return;
    }

    // Convert dates to UTC midnight to avoid timezone issues
    const startDateUTC = startDate ? moment(startDate).utc().startOf('day').toISOString() : null;
    const endDateUTC = endDate ? moment(endDate).utc().startOf('day').toISOString() : null;

    const searchPayload = {
      serviceType: serviceType,
      searchParams: {
        startDate: startDateUTC,
        endDate: endDateUTC,
        location: selectedLocation,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
      },
    };

    // Search payload includes user location — don't log it in production.
    navigation.navigate('SearchResults', searchPayload);
  };

  // Label shown on the date/time button for hour-based services.
  const formatDateTimeWindow = () => {
    if (!singleDate || !startTime || !endTime) return 'Pick date & time';
    const date = moment(singleDate).format('D MMM YYYY');
    return `${date} · ${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
  };

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date';

    const start = moment(startDate);
    const end = moment(endDate);

    // Single-day selection: user tapped once → start === end
    if (start.isSame(end, 'day')) {
      return start.format('D MMM YYYY');
    }

    // Multi-day range — collapse year/month where safe for readability
    if (start.year() === end.year()) {
      if (start.month() === end.month()) {
        return `${start.format('D')}-${end.format('D MMM YYYY')}`;
      }
      return `${start.format('D MMM')}-${end.format('D MMM YYYY')}`;
    }
    return `${start.format('D MMM YYYY')}-${end.format('D MMM YYYY')}`;
  };

  const handleLocationPress = () => {
    navigation.navigate('LocationPicker', {
      onLocationSelect: (location) => {
        // Store full location object with coordinates
        setLocationData(location);
        // Extract the address string for display
        setSelectedLocation(location.address || location.addressLine1 || 'Selected Location');
      },
    });
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{serviceTitle}</Text>
            <Text style={styles.headerSubtitle}>{serviceSubtitle}</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Date / date-time picker — day-based services use a range
              calendar, hour-based services use single-day + time window. */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{hourBased ? 'When?' : 'Select Date Range'}</Text>
            {hourBased ? (
              <DateTimeWindowPicker
                date={singleDate}
                startTime={startTime}
                endTime={endTime}
                onChange={({ date, startTime: s, endTime: e }) => {
                  setSingleDate(date);
                  setStartTime(s);
                  setEndTime(e);
                }}
              >
                <View style={styles.dateButton}>
                  <View style={styles.dateContent}>
                    <CalendarIcon width={20} height={20} fill="#FFC2EB" />
                    <Text style={styles.dateText}>{formatDateTimeWindow()}</Text>
                  </View>
                  <AngleDownIcon width={20} height={20} fill="#32A6D8" />
                </View>
              </DateTimeWindowPicker>
            ) : (
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
              >
                <View style={styles.dateButton}>
                  <View style={styles.dateContent}>
                    <CalendarIcon width={20} height={20} fill="#FFC2EB" />
                    <Text style={styles.dateText}>{formatDateRange()}</Text>
                  </View>
                  <AngleDownIcon width={20} height={20} fill="#32A6D8" />
                </View>
              </DateRangePicker>
            )}
          </View>

          {/* Select Location */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Select Your Location</Text>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={handleLocationPress}
            >
              <View style={styles.locationContent}>
                <LocationPinIcon width={20} height={20} fill="#FFC2EB" />
                <Text style={styles.dropdownText}>{selectedLocation}</Text>
              </View>
              <AngleDownIcon width={20} height={20} fill="#32A6D8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Button */}
        <View style={[styles.buttonContainer, { bottom: 24 + insets.bottom }]}>
          <Button
            title="Search Now"
            onPress={handleSearchNow}
            size='medium'
            fullWidth
            disabled={!startDate}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerTextContainer: {
    flex: 1,
    gap: 5,
  },
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    marginBottom: 6,
  },
  dateButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EBEBEB',
    marginBottom: 0,
  },
  dropdownText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  dateText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  locationButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
});

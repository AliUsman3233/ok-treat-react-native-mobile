import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CalendarIcon, LocationPinIcon, AngleDownIcon } from '../../assets';
import DateRangePicker from '../../components/DateRangePicker';
import moment from 'moment';

export default function ServiceSearchScreen({ navigation, route }) {
  const { serviceType = 'Boarding', serviceTitle = 'Boarding', serviceSubtitle = 'When do you need a sitter?' } = route.params || {};
  const insets = useSafeAreaInsets();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('Current Location');
  const [locationData, setLocationData] = useState(null); // Store full location object with coordinates

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSearchNow = () => {
    if (!startDate) {
      Alert.alert('Missing Dates', 'Please select dates for your search');
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

    console.log('=================================');
    console.log(`🔍 ${serviceType.toUpperCase()} SEARCH PAYLOAD`);
    console.log('=================================');
    console.log('Service Type:', searchPayload.serviceType);
    console.log('Start Date (Local):', startDate ? moment(startDate).format('ddd, MMM D, YYYY') : 'Not selected');
    console.log('Start Date (UTC):', startDateUTC);
    console.log('End Date (Local):', endDate ? moment(endDate).format('ddd, MMM D, YYYY') : 'Not selected');
    console.log('End Date (UTC):', endDateUTC);
    console.log('Location:', selectedLocation);
    console.log('Latitude:', locationData?.latitude || 'Not available');
    console.log('Longitude:', locationData?.longitude || 'Not available');
    console.log('Date Range:', formatDateRange());
    console.log('=================================');
    console.log('Full Payload:', JSON.stringify(searchPayload, null, 2));
    console.log('=================================');

    navigation.navigate('SearchResults', searchPayload);
  };

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date range';
    
    const start = moment(startDate);
    const end = moment(endDate);
    
    // If same year, show year only once at the end
    if (start.year() === end.year()) {
      if (start.month() === end.month()) {
        return `${start.format('D')}-${end.format('D MMM YYYY')}`;
      }
      return `${start.format('D MMM')}-${end.format('D MMM YYYY')}`;
    }
    // Different years, show year for both dates
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
          {/* Select Date Range */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Select Date Range</Text>
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

import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { CalendarNewIcon, LocationPinIcon, BuildingsIcon, HomeIconSvg, SliderIcon, Calendar2Icon, CalendarIcon, QuestionCircleIcom, BuildingsFilledIcon } from '../assets';
import Button from './Button';
import FilterOption from './FilterOption';
import DateRangePicker from './DateRangePicker';
import moment from 'moment';

export default function SearchFilterModal({ visible, onClose, onApply, onLocationPress }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('Vancouver, BC, Canada');
  const [selectedType, setSelectedType] = useState('Any Type');

  // Filter states
  const [availabilityDay, setAvailabilityDay] = useState(false);
  const [fencedYard, setFencedYard] = useState(false);
  const [furnitureAllowed, setFurnitureAllowed] = useState(false);
  const [bedAllowed, setBedAllowed] = useState(false);
  const [smokeFree, setSmokeFree] = useState(false);
  const [otherPets, setOtherPets] = useState(false);
  const [noDog, setNoDog] = useState(false);
  const [noCat, setNoCat] = useState(false);
  const [oneClient, setOneClient] = useState(false);
  const [unspayedFemale, setUnspayedFemale] = useState(false);
  const [nonNeuteredMale, setNonNeuteredMale] = useState(false);
  const [bathing, setBathing] = useState(false);
  const [firstAid, setFirstAid] = useState(false);
  const [childrenPresent, setChildrenPresent] = useState(false);
  const [noChildren, setNoChildren] = useState(false);

  const propertyTypes = [
    { label: 'Apartments', icon: BuildingsFilledIcon },
    { label: 'Houses', icon: HomeIconSvg },
    { label: 'Any Type', icon: QuestionCircleIcom },
  ];

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return '23-24 Jul';

    const start = moment(startDate);
    const end = moment(endDate);

    if (start.month() === end.month()) {
      return `${start.format('D')}-${end.format('D MMM')}`;
    }
    return `${start.format('D MMM')}-${end.format('D MMM')}`;
  };

  const handleLocationSelect = () => {
    if (onLocationPress) {
      onLocationPress(selectedLocation, (location) => {
        if (location) {
          setSelectedLocation(location);
        }
      });
    }
  };

  const handleApply = () => {
    const filters = {
      startDate,
      endDate,
      location: selectedLocation,
      propertyType: selectedType,
      availabilityDay,
      fencedYard,
      furnitureAllowed,
      bedAllowed,
      smokeFree,
      otherPets,
      noDog,
      noCat,
      oneClient,
      unspayedFemale,
      nonNeuteredMale,
      bathing,
      firstAid,
      childrenPresent,
      noChildren,
    };
    onApply(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.placeholder} />
            <Text style={styles.headerTitle}>Search Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Select Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Date</Text>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
              >
                <View style={styles.inputField}>
                  <View style={styles.inputLeft}>
                    <CalendarIcon width={20} height={20} fill="#FFC2EB" />
                    <Text style={styles.inputText}>{formatDateRange()}</Text>
                  </View>
                  {/* <Icon name="chevron-down" size={20} color="#32A6D8" /> */}
                </View>
              </DateRangePicker>
            </View>

            {/* Select Location */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Your Location</Text>
              <TouchableOpacity
                style={styles.inputField}
                onPress={handleLocationSelect}
              >
                <View style={styles.inputLeft}>
                  <LocationPinIcon width={20} height={20} fill="#FFC2EB" />
                  <Text style={styles.inputText}>{selectedLocation}</Text>
                </View>
                {/* <Icon name="chevron-down" size={20} color="#32A6D8" /> */}
              </TouchableOpacity>
            </View>

            {/* Property Type */}
            <View style={styles.propertyTypes}>
              {propertyTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <TouchableOpacity
                    key={type.label}
                    style={[
                      styles.propertyTypeCard,
                      selectedType === type.label && styles.propertyTypeCardActive
                    ]}
                    onPress={() => setSelectedType(type.label)}
                  >
                    <IconComponent width={24} height={24} fill="#32A6D8" />
                    <Text style={styles.propertyTypeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Options */}
            <View style={styles.filterOptions}>
              <FilterOption
                title="Availability during the day"
                subtitle="Sitter is home full-time"
                value={availabilityDay}
                onValueChange={setAvailabilityDay}
              />
              <FilterOption
                title="Household Conditions"
                subtitle="Has fence yard"
                value={fencedYard}
                onValueChange={setFencedYard}
              />
              <FilterOption
                title="Dogs permitted on furniture"
                value={furnitureAllowed}
                onValueChange={setFurnitureAllowed}
              />
              <FilterOption
                title="Dogs permitted on beds"
                value={bedAllowed}
                onValueChange={setBedAllowed}
              />
              <FilterOption
                title="Smoke-free household"
                value={smokeFree}
                onValueChange={setSmokeFree}
              />
              <FilterOption
                title="Other pets present in the home"
                value={otherPets}
                onValueChange={setOtherPets}
              />
              <FilterOption
                title="Does not have a dog"
                value={noDog}
                onValueChange={setNoDog}
              />
              <FilterOption
                title="Does not have a cat"
                value={noCat}
                onValueChange={setNoCat}
              />
              <FilterOption
                title="Takes only one client at a time"
                value={oneClient}
                onValueChange={setOneClient}
              />
              <FilterOption
                title="Welcomes unspayed female dogs"
                value={unspayedFemale}
                onValueChange={setUnspayedFemale}
              />
              <FilterOption
                title="Welcomes non-neutered male dogs"
                value={nonNeuteredMale}
                onValueChange={setNonNeuteredMale}
              />
              <FilterOption
                title="Bathing and grooming services"
                value={bathing}
                onValueChange={setBathing}
              />
              <FilterOption
                title="Trained in dog first aid and CPR"
                value={firstAid}
                onValueChange={setFirstAid}
              />
              <FilterOption
                title="Children present in the household"
                value={childrenPresent}
                onValueChange={setChildrenPresent}
              />
              <FilterOption
                title="No children in the home"
                value={noChildren}
                onValueChange={setNoChildren}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              size="small"
              style={styles.cancelButton}
            />
            <Button
              title="Apply"
              onPress={handleApply}
              size="small"
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  closeButton: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  inputField: {
    height: 50,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inputText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  propertyTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  propertyTypeCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: 'rgba(234.57, 234.57, 234.57, 0.17)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    gap: 10,
  },
  propertyTypeCardActive: {
    backgroundColor: 'rgba(50, 166, 216, 0.1)',
    borderColor: '#32A6D8',
  },
  propertyTypeLabel: {
    textAlign: 'center',
    color: 'black',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  filterOptions: {
    gap: 16,
    marginBottom:10
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});

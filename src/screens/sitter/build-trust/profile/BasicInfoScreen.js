import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppAlert } from '../../../../context/AlertContext';
import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { Button, Input } from '../../../../components';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import ImagePickerButton from '../../../../components/ImagePickerButton';
import { BackArrowIcon, InfoCircleIconBlue, LocationPinIcon, CheckCircleIcon, CameraIconbroken, CalendarIcon, AngleDownIcon } from '../../../../assets';
import { uploadToCloudinary } from '../../../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../../../config/cloudinary';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../../services/buildTrustService';

export default function BasicInfoScreen({ navigation, route }) {
  const alert = useAppAlert();
  const [profilePhoto, setProfilePhoto] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dayInputRef = useRef(null);
  const monthInputRef = useRef(null);
  const yearInputRef = useRef(null);
  const hasProcessedLocationParamsRef = useRef(false);

  // Handle location selection from LocationPicker - FIRST PRIORITY
  // NOTE: never log raw address/lat/lng — PII in device logs.
  useEffect(() => {
    if (route.params?.selectedLocation) {
      const location = route.params.selectedLocation;

      setSelectedLocation(location.address || '');
      setAddressLine1(location.addressLine1 || '');
      setCity(location.city || '');
      setState(location.state || '');
      setZipCode(location.zipCode || '');
      setLatitude(location.latitude || null);
      setLongitude(location.longitude || null);
      setHasSelectedLocation(true);
      hasProcessedLocationParamsRef.current = true;

      // Clear the route params to prevent re-triggering
      navigation.setParams({ selectedLocation: undefined });
    }
  }, [route.params]);

  // Fetch existing data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only fetch if we haven't just processed location params
      if (!hasProcessedLocationParamsRef.current) {
        fetchBasicInfo();
      } else {
        hasProcessedLocationParamsRef.current = false;
      }
    }, [])
  );

  const fetchBasicInfo = async () => {
    try {
      const response = await getBuildTrustSection('BASIC_INFO');

      if (response.success && response.data.exists && response.data.settings) {
        const settings = response.data.settings;

        setProfilePhoto(settings.profilePhoto || '');
        setAddressLine1(settings.addressLine1 || '');
        setAddressLine2(settings.addressLine2 || '');
        setCity(settings.city || '');
        setState(settings.state || '');
        setZipCode(settings.zipCode || '');
        setLatitude(settings.latitude || null);
        setLongitude(settings.longitude || null);
        setSelectedLocation(settings.addressLine1 || '');
        setBirthday(settings.birthday || '');

        // If address exists, show the fields
        if (settings.addressLine1 || settings.city) {
          setHasSelectedLocation(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch basic info:', error?.message);
    }
  };

  // Handle image upload - immediate upload to Cloudinary and save to state
  const handleImageSelected = async (imageUri) => {
    try {
      setUploading(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.PROFILES);
      const photoUrl = result.url;

      // Update local state
      setProfilePhoto(photoUrl);
      
      alert('Success', 'Profile photo uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload Failed', error.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLocationPress = () => {
    navigation.navigate('LocationPicker', {
      returnScreen: 'BasicInfo',
    });
  };

  const handleBackPress = () => {
    setShowUnsavedModal(true);
  };

  const handleCancelLeave = () => {
    setShowUnsavedModal(false);
  };

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    navigation.goBack();
  };

  const handleSaveBirthday = () => {
    if (day && month && year) {
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      // Validate month range
      if (monthNum < 1 || monthNum > 12) {
        alert('Invalid Date', 'Please enter a valid month (01-12).', 'pending');
        return;
      }

      // Validate day range using Date object
      const testDate = new Date(yearNum, monthNum - 1, dayNum);
      if (
        testDate.getFullYear() !== yearNum ||
        testDate.getMonth() !== monthNum - 1 ||
        testDate.getDate() !== dayNum
      ) {
        alert('Invalid Date', 'The date you entered does not exist. Please check the day, month, and year.', 'pending');
        return;
      }

      // Validate year is reasonable
      if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
        alert('Invalid Year', 'Please enter a valid year.', 'pending');
        return;
      }

      // Validate at least 18 years old
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      if (testDate > eighteenYearsAgo) {
        alert('Age Requirement', 'You must be at least 18 years old to register as a sitter.', 'pending');
        return;
      }

      const formattedDate = `${day.padStart(2, '0')} - ${month.padStart(2, '0')} - ${year}`;
      setBirthday(formattedDate);
    }
    setShowBirthdayModal(false);
    // Reset fields
    setDay('');
    setMonth('');
    setYear('');
  };

  const handleCancelBirthday = () => {
    setShowBirthdayModal(false);
    // Reset fields
    setDay('');
    setMonth('');
    setYear('');
  };

  const handleDayChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2 && (cleaned === '' || parseInt(cleaned) <= 31)) {
      setDay(cleaned);
      // Auto-focus next field when day is complete
      if (cleaned.length === 2 && monthInputRef.current) {
        monthInputRef.current.focus();
      }
    }
  };

  const handleMonthChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2 && (cleaned === '' || parseInt(cleaned) <= 12)) {
      setMonth(cleaned);
      // Auto-focus next field when month is complete
      if (cleaned.length === 2 && yearInputRef.current) {
        yearInputRef.current.focus();
      }
    }
  };

  const handleYearChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setYear(cleaned);
    }
  };

  const handleMonthKeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && month === '') {
      dayInputRef.current?.focus();
    }
  };

  const handleYearKeyPress = (e) => {
    if (e.nativeEvent.key === 'Backspace' && year === '') {
      monthInputRef.current?.focus();
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!profilePhoto) {
        alert('Required', 'Please upload a profile photo', 'pending');
        return;
      }

      if (!addressLine1 || !city || !state || !zipCode) {
        alert('Required', 'Please fill in all address fields', 'pending');
        return;
      }

      if (!birthday) {
        alert('Required', 'Please add your birthday for age verification', 'pending');
        return;
      }
      
      // Prepare settings data (including latitude and longitude)
      const settings = {
        profilePhoto,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        birthday,
        latitude,
        longitude
      };
      
      // Save to backend
      const response = await upsertBuildTrustSection('BASIC_INFO', settings, true);
      
      if (response.success) {
        // Navigate to next screen (Phone Numbers)
        navigation.navigate('PhoneNumbers');
      } else {
        alert('Error', 'Failed to save basic info. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving basic info:', error);
      alert('Error', 'Failed to save basic info. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Basic Info</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Basic Info</Text>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerIcon}>
              <InfoCircleIconBlue width={16.67} height={16.67} fill="#32A6D8" />
            </View>
            <Text style={styles.infoBannerText}>
              We've recommended default settings that work well for new sitters and walkers. You can update them now or change them anytime later
            </Text>
          </View>

          {/* Profile Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Photo <Text style={{ color: '#FF3B30' }}>*</Text></Text>

            <Text style={styles.helperText}>
              Your main photo for pet owners should be well-lit and clearly show your face, with no sunglasses.
            </Text>

            <ImagePickerButton onImageSelected={handleImageSelected}>
              <View style={styles.uploadContainer}>
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#32A6D8" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                ) : profilePhoto ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image
                      key={profilePhoto}
                      source={{ uri: profilePhoto }}
                      style={styles.photoPreview}
                      onError={(error) => console.error('Image load error:', error.nativeEvent?.error)}
                    />
                    <View style={styles.changePhotoOverlay}>
                      <View style={styles.uploadIconContainer}>
                        <CameraIconbroken width={20} height={20} />
                      </View>
                      <Text style={styles.uploadText}>Change Photo</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadButton}>
                    <View style={styles.uploadIconContainer}>
                      <CameraIconbroken width={20} height={20} />
                    </View>
                    <Text style={styles.uploadText}>Upload Photo</Text>
                  </View>
                )}
              </View>
            </ImagePickerButton>
          </View>

          {/* Your Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Address</Text>

            {!hasSelectedLocation ? (
              <TouchableOpacity
                style={styles.linkButtonCenter}
                onPress={handleLocationPress}
              >
                <Text style={styles.linkText}>Add Address</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Address Line 1 <Text style={{ color: '#FF3B30' }}>*</Text></Text>
                  <Input
                    type="text"
                    placeholder="e.g., 123 Main Street"
                    value={addressLine1}
                    onChangeText={setAddressLine1}
                    leftIcon={<LocationPinIcon width={14.17} height={15.83} fill="#FFC2EB" />}
                    containerStyle={styles.inputContainer}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Address Line 2</Text>
                  <Input
                    type="text"
                    placeholder="e.g., Apt 4B (optional)"
                    value={addressLine2}
                    onChangeText={setAddressLine2}
                    leftIcon={<LocationPinIcon width={14.17} height={15.83} fill="#FFC2EB" />}
                    containerStyle={styles.inputContainer}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>City <Text style={{ color: '#FF3B30' }}>*</Text></Text>
                  <Input
                    type="text"
                    placeholder="e.g., Vancouver"
                    value={city}
                    onChangeText={setCity}
                    leftIcon={<LocationPinIcon width={14.17} height={15.83} fill="#FFC2EB" />}
                    containerStyle={styles.inputContainer}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>State or Province <Text style={{ color: '#FF3B30' }}>*</Text></Text>
                  <Input
                    type="text"
                    placeholder="e.g., BC"
                    value={state}
                    onChangeText={setState}
                    leftIcon={<LocationPinIcon width={14.17} height={15.83} fill="#FFC2EB" />}
                    containerStyle={styles.inputContainer}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ZIP / Postal <Text style={{ color: '#FF3B30' }}>*</Text></Text>
                  <Input
                    type="text"
                    placeholder="e.g., V6B 1A1"
                    value={zipCode}
                    onChangeText={setZipCode}
                    keyboardType="numeric"
                    containerStyle={styles.inputContainer}
                  />
                </View>

                <TouchableOpacity
                  style={styles.linkButtonCenter}
                  onPress={handleLocationPress}
                >
                  <Text style={styles.linkText}>Change Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Email Address Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Address</Text>

            <View style={styles.emailDisplayContainer}>
              <LocationPinIcon width={14.17} height={15.83} fill="#FFC2EB" />
              <Text style={styles.emailDisplayText}>Your Email Address</Text>
              <CheckCircleIcon width={16.63} height={16.64} fill="#32A6D8" />
            </View>
          </View> */}

          {/* Age Verification Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age Verification <Text style={{ color: '#FF3B30' }}>*</Text></Text>

            <Text style={styles.helperText}>
              Used only for background checks, this information will never be displayed on your profile.
            </Text>

            {birthday ? (
              <TouchableOpacity
                style={styles.linkButtonCenter}
                onPress={() => setShowBirthdayModal(true)}
              >
                <Text style={styles.linkText}>{birthday}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.linkButtonCenter}
                onPress={() => setShowBirthdayModal(true)}
              >
                <Text style={styles.linkText}>Add Birthday</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Birthday Modal */}
        <Modal
          visible={showBirthdayModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelBirthday}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Your Birthday</Text>
                <Text style={styles.modalSubtitle}>For age verification we'll use</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalFieldLabel}>Date of Birth</Text>
                <View style={styles.modalInputContainer}>
                  <View style={styles.modalInputContent}>
                    <CalendarIcon width={15} height={15.63} fill="#FFC2EB" />
                    <View style={styles.dateDisplayContainer}>
                      <TextInput
                        style={styles.dateInputSection}
                        placeholder="DD"
                        placeholderTextColor="#898D8F"
                        value={day}
                        onChangeText={handleDayChange}
                        keyboardType="numeric"
                        maxLength={2}
                        ref={dayInputRef}
                      />
                      <Text style={styles.dateSeparatorText}>-</Text>
                      <TextInput
                        style={styles.dateInputSection}
                        placeholder="MM"
                        placeholderTextColor="#898D8F"
                        value={month}
                        onChangeText={handleMonthChange}
                        onKeyPress={handleMonthKeyPress}
                        keyboardType="numeric"
                        maxLength={2}
                        ref={monthInputRef}
                      />
                      <Text style={styles.dateSeparatorText}>-</Text>
                      <TextInput
                        style={styles.dateInputSectionYear}
                        placeholder="YYYY"
                        placeholderTextColor="#898D8F"
                        value={year}
                        onChangeText={handleYearChange}
                        onKeyPress={handleYearKeyPress}
                        keyboardType="numeric"
                        maxLength={4}
                        ref={yearInputRef}
                      />
                    </View>
                  </View>
                  <AngleDownIcon width={8.33} height={5} fill="#3B1153" />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelBirthday}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveBirthday}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Unsaved Changes Modal */}
        <UnsavedChangesModal
          visible={showUnsavedModal}
          onCancel={handleCancelLeave}
          onLeave={handleConfirmLeave}
        />

        {/* Save Button */}
        <View style={styles.bottomButtonContainer}>
          <Button
            title={isSaving ? "Saving..." : "Save & Continue"}
            onPress={handleSave}
            type="secondary"
            size="large"
            fullWidth
            disabled={isSaving || uploading}
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
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 8,
  },
  pageTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    backgroundColor: '#DAEFF8',
    borderRadius: 10,
    marginBottom: 24,
  },
  infoBannerIcon: {
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  section: {
    padding: 20,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  helperText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  uploadContainer: {
    minHeight: 101,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  uploadingText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  photoPreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadButton: {
    width: 94,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  uploadIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#090E12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 0,
    height: 56,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  emailDisplayContainer: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9F9F9',
  },
  emailDisplayText: {
    flex: 1,
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  linkButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 40,
    alignSelf: 'flex-start',
  },
  linkButtonCenter: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 40,
    alignSelf: 'center',
  },
  linkText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18.6,
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 24,
  },
  modalHeader: {
    gap: 8,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  modalBody: {
    gap: 6,
  },
  modalFieldLabel: {
    color: '#090E12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalInputContainer: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalInputPlaceholder: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalTextInput: {
    flex: 1,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    padding: 0,
  },
  dateDisplayContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInputSection: {
    width: 32,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
  },
  dateInputSectionYear: {
    width: 52,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
  },
  dateSeparatorText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: '#F38FB4',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#32A6D8',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
    textAlign: 'center',
  },
});

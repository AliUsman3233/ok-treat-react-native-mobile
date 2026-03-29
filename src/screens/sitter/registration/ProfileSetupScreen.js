import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import ProfileVerifiedModal from '../../../components/ProfileVerifiedModal';
import { BackArrowIcon, AngleDownIcon, BuildingsIcon, SunIcon, ProgressTickIcon, CalendarIconBlue, PawHoloIcon, BriefcaseIcon } from '../../../assets';
import { getServiceSetups } from '../../../services/serviceSetupService';
import { getBuildTrustStatus } from '../../../services/buildTrustService';
import { submitSitterApplication } from '../../../services/sitterService';

export default function ProfileSetupScreen({ navigation, route }) {
  const [expandedSections, setExpandedSections] = useState({
    createProfile: false,
  });
  
  const [completedServices, setCompletedServices] = useState({
    boarding: false,
    houseSitting: false,
    dropInVisit: false,
    dayCare: false,
    petWalking: false,
  });

  const [buildTrustStatus, setBuildTrustStatus] = useState({
    profile: false,
    requestTestimonials: false,
    safetyQuiz: false,
    finalDetails: false,
  });

  const [profileSubsections, setProfileSubsections] = useState({
    basicInfo: false,
    phoneNumbers: false,
    details: false,
    photos: false,
    petCareInfo: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Check if all sections are completed
  const allServicesCompleted = Object.values(completedServices).every(status => status === true);
  const allProfileSubsectionsCompleted = Object.values(profileSubsections).every(status => status === true);
  const allSectionsCompleted = allServicesCompleted && allProfileSubsectionsCompleted;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch service setup statuses when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchServiceStatuses();
      fetchBuildTrustStatuses();
    }, [])
  );

  // Check if returning from a service setup screen
  useEffect(() => {
    if (route.params?.completedService) {
      setCompletedServices(prev => ({
        ...prev,
        [route.params.completedService]: true,
      }));
    }
    if (route.params?.completedSection) {
      // Handle build trust section completion
      fetchBuildTrustStatuses();
    }
  }, [route.params?.completedService, route.params?.completedSection]);

  const fetchServiceStatuses = async () => {
    try {
      setIsLoading(true);
      const response = await getServiceSetups();
      if (response.success) {
        const { status } = response.data;
        setCompletedServices({
          boarding: status.BOARDING || false,
          houseSitting: status.HOUSE_SITTING || false,
          dropInVisit: status.DROP_IN_VISITS || false,
          dayCare: status.DAY_CARE || false,
          petWalking: status.PET_WALKING || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch service statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuildTrustStatuses = async () => {
    try {
      const response = await getBuildTrustStatus();
      
      if (response && response.success && response.data) {
        const { status, majorSections } = response.data;
        
        // Set major sections status
        setBuildTrustStatus({
          profile: majorSections?.profile || false,
          requestTestimonials: majorSections?.requestTestimonials || false,
          safetyQuiz: majorSections?.safetyQuiz || false,
          finalDetails: majorSections?.finalDetails || false,
        });

        // Set profile subsections status
        setProfileSubsections({
          basicInfo: status?.BASIC_INFO || false,
          phoneNumbers: status?.PHONE_NUMBERS || false,
          details: status?.DETAILS || false,
          photos: status?.PHOTOS || false,
          petCareInfo: status?.PET_CARE_INFO || false,
        });
      } else {
        // Set default values if response is not successful
        setBuildTrustStatus({
          profile: false,
          requestTestimonials: false,
          safetyQuiz: false,
          finalDetails: false,
        });
        setProfileSubsections({
          basicInfo: false,
          phoneNumbers: false,
          details: false,
          photos: false,
          petCareInfo: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch build trust statuses:', error);
      
      // Set default values on error
      setBuildTrustStatus({
        profile: false,
        requestTestimonials: false,
        safetyQuiz: false,
        finalDetails: false,
      });
      setProfileSubsections({
        basicInfo: false,
        phoneNumbers: false,
        details: false,
        photos: false,
        petCareInfo: false,
      });
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleServicePress = (serviceName) => {
    console.log(`${serviceName} pressed`);
    if (serviceName === 'Boarding') {
      navigation.navigate('BoardingSettings');
    } else if (serviceName === 'House Sitting') {
      navigation.navigate('HouseSittingSettings');
    } else if (serviceName === 'Drop-In Visit') {
      navigation.navigate('DropInVisitSettings');
    } else if (serviceName === 'Day Care') {
      navigation.navigate('DayCareSettings');
    } else if (serviceName === 'Pet Walking') {
      navigation.navigate('PetWalkingSettings');
    }
  };

  const handleSubItemPress = (itemName) => {
    console.log(`${itemName} pressed`);
    if (itemName === 'Basic Info') {
      navigation.navigate('BasicInfo');
    } else if (itemName === 'Phone Numbers') {
      navigation.navigate('PhoneNumbers');
    } else if (itemName === 'Details') {
      navigation.navigate('Details');
    } else if (itemName === 'Photos') {
      navigation.navigate('Photos');
    } else if (itemName === 'Pet Care Info') {
      navigation.navigate('PetCareInfo');
    } else if (itemName === 'Your Pets') {
      navigation.navigate('YourPets');
    }
  };

  const handleBuildTrustPress = (itemName) => {
    console.log(`${itemName} pressed`);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await submitSitterApplication();
      
      if (response.success) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalNext = () => {
    setShowSuccessModal(false);
    navigation.navigate('SitterTabs');
  };

  const handleApprovedModalNext = () => {
    setShowApprovedModal(false);
    navigation.navigate('SitterTabs');
  };

  const handleRejectedModalNext = () => {
    setShowRejectedModal(false);
    // Stay on ProfileSetup screen so they can resubmit
  };

  const handlePendingModalNext = () => {
    setShowPendingModal(false);
    navigation.goBack();
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon 
              width={20} 
              height={20} 
              fill="#090E12" 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Service Setup Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Setup</Text>
            
            <View style={styles.itemsList}>
              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => handleServicePress('Boarding')}
              >
                <View style={styles.serviceIconContainer}>
                  <BuildingsIcon width={24.37} height={24.37} fill="#32A6D8" />
                </View>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>Boarding</Text>
                    <Text style={styles.serviceSubtitle}>Choose your service preferences</Text>
                  </View>
                  {completedServices.boarding ? (
                    <ProgressTickIcon width={20} height={20} fill="#32A6D8" />
                  ) : (
                    <Text style={styles.timeText}>3 mins</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => handleServicePress('House Sitting')}
              >
                <View style={styles.serviceIconContainer}>
                  <BuildingsIcon width={24.37} height={24.38} fill="#32A6D8" />
                </View>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>House Sitting</Text>
                    <Text style={styles.serviceSubtitle}>Choose your service preferences</Text>
                  </View>
                  {completedServices.houseSitting ? (
                    <ProgressTickIcon width={20} height={20} fill="#32A6D8" />
                  ) : (
                    <Text style={styles.timeText}>3 mins</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => handleServicePress('Drop-In Visit')}
              >
                <View style={styles.serviceIconContainer}>
                  <CalendarIconBlue width={24.37} height={24.37} color="#32A6D8" />
                </View>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>Drop-In Visit</Text>
                    <Text style={styles.serviceSubtitle}>Choose your service preferences</Text>
                  </View>
                  {completedServices.dropInVisit ? (
                    <ProgressTickIcon width={20} height={20} fill="#32A6D8" />
                  ) : (
                    <Text style={styles.timeText}>3 mins</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => handleServicePress('Day Care')}
              >
                <View style={styles.serviceIconContainer}>
                  <SunIcon width={24.37} height={24.37} fill="#32A6D8" />
                </View>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>Day Care</Text>
                    <Text style={styles.serviceSubtitle}>Choose your service preferences</Text>
                  </View>
                  {completedServices.dayCare ? (
                    <ProgressTickIcon width={20} height={20} fill="#32A6D8" />
                  ) : (
                    <Text style={styles.timeText}>3 mins</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => handleServicePress('Pet Walking')}
              >
                <View style={styles.serviceIconContainer}>
                  <PawHoloIcon width={22.50} height={20} />
                </View>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>Pet Walking</Text>
                    <Text style={styles.serviceSubtitle}>Choose your service preferences</Text>
                  </View>
                  {completedServices.petWalking ? (
                    <ProgressTickIcon width={20} height={20} fill="#32A6D8" />
                  ) : (
                    <Text style={styles.timeText}>3 mins</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Build Trust Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Build Trust</Text>
            
            <View style={styles.itemsList}>
              {/* Create Your Profile - Expandable */}
              <View style={styles.expandableContainer}>
                <TouchableOpacity 
                  style={styles.serviceItem}
                  onPress={() => toggleSection('createProfile')}
                >
                  <View style={styles.serviceIconContainer}>
                    <BriefcaseIcon width={24.37} height={24.37} fill="#32A6D8" />
                  </View>
                  <View style={styles.serviceContent}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceTitle}>Create Your Profile</Text>
                      <Text style={styles.serviceSubtitle}>Start with a great impression</Text>
                    </View>
                    {buildTrustStatus.profile ? (
                      <ProgressTickIcon width={20} height={20} fill="#32A6D8" />
                    ) : (
                      <Text style={styles.timeText}>12 mins</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {expandedSections.createProfile && (
                  <View style={styles.subItemsList}>
                    <TouchableOpacity 
                      style={styles.subItem}
                      onPress={() => handleSubItemPress('Basic Info')}
                    >
                      <Text style={styles.subItemText}>Basic Info</Text>
                      {profileSubsections.basicInfo ? (
                        <ProgressTickIcon width={16} height={16} fill="#32A6D8" />
                      ) : (
                        <View style={styles.arrowIcon}>
                          <AngleDownIcon width={5} height={8.33} fill="#32A6D8" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.subItem}
                      onPress={() => handleSubItemPress('Phone Numbers')}
                    >
                      <Text style={styles.subItemText}>Phone Numbers</Text>
                      {profileSubsections.phoneNumbers ? (
                        <ProgressTickIcon width={16} height={16} fill="#32A6D8" />
                      ) : (
                        <View style={styles.arrowIcon}>
                          <AngleDownIcon width={5} height={8.33} fill="#32A6D8" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.subItem}
                      onPress={() => handleSubItemPress('Details')}
                    >
                      <Text style={styles.subItemText}>Details</Text>
                      {profileSubsections.details ? (
                        <ProgressTickIcon width={16} height={16} fill="#32A6D8" />
                      ) : (
                        <View style={styles.arrowIcon}>
                          <AngleDownIcon width={5} height={8.33} fill="#32A6D8" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.subItem}
                      onPress={() => handleSubItemPress('Photos')}
                    >
                      <Text style={styles.subItemText}>Photos</Text>
                      {profileSubsections.photos ? (
                        <ProgressTickIcon width={16} height={16} fill="#32A6D8" />
                      ) : (
                        <View style={styles.arrowIcon}>
                          <AngleDownIcon width={5} height={8.33} fill="#32A6D8" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.subItem}
                      onPress={() => handleSubItemPress('Pet Care Info')}
                    >
                      <Text style={styles.subItemText}>Pet Care Info</Text>
                      {profileSubsections.petCareInfo ? (
                        <ProgressTickIcon width={16} height={16} fill="#32A6D8" />
                      ) : (
                        <View style={styles.arrowIcon}>
                          <AngleDownIcon width={5} height={8.33} fill="#32A6D8" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomButtonContainer}>
          <Button
            title={isSubmitting ? "Submitting..." : "Submit"}
            onPress={handleSubmit}
            type="secondary"
            size="medium"
            fullWidth
            disabled={!allSectionsCompleted || isSubmitting}
          />
        </View>

        {/* Success Modal */}
        <ProfileVerifiedModal
          visible={showSuccessModal}
          onNext={handleModalNext}
          title="Application Submitted!"
          description="Your sitter application has been successfully submitted. We'll review it and get back to you soon!"
          buttonText="Continue"
          iconType="success"
        />

        {/* Approved Modal */}
        <ProfileVerifiedModal
          visible={showApprovedModal}
          onNext={handleApprovedModalNext}
          title="Application Approved!"
          description="Congratulations! Your sitter application has been approved. You can now start accepting bookings!"
          buttonText="Go to Dashboard"
          iconType="success"
        />

        {/* Rejected Modal */}
        <ProfileVerifiedModal
          visible={showRejectedModal}
          onNext={handleRejectedModalNext}
          title="Application Rejected"
          description={rejectionReason}
          buttonText="Close"
          iconType="error"
        />

        {/* Pending Modal */}
        <ProfileVerifiedModal
          visible={showPendingModal}
          onNext={handlePendingModalNext}
          title="Application Pending"
          description="Your sitter application is currently under review. We'll notify you once it's been processed."
          buttonText="Go Back"
          iconType="pending"
        />
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
    paddingBottom: 10,
  },
  section: {
    marginTop: 16,
    gap: 8,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemsList: {
    gap: 12,
  },
  serviceItem: {
    height: 54,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  serviceIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 27,
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceTitle: {
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  serviceSubtitle: {
    color: '#676869',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  timeText: {
    width: 50,
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.6,
    textAlign: 'right',
  },
  expandableContainer: {
    gap: 8,
  },
  subItemsList: {
    gap: 8,
  },
  subItem: {
    height: 45,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subItemText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  arrowIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

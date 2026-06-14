import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Share, Alert } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  BackArrowIcon,
  PenIcon,
  ChatsTextIcon,
  InfoCircleIcon,
  WomanIcon,
  PawFilledIcon,
  ClockIcon,
  DogIcon,
  CatIcon,
  KidIcon,
  HomeIconNew,
  PotyIcon,
  CpuIcon
} from '../../assets';
import { getPetById, updatePet, markPetSafe } from '../../services/petService';

// Public QR-tag page lives on the admin dashboard
const PUBLIC_TAG_BASE = 'https://ok-treat-admin-dashboard-bufbf.ondigitalocean.app/tag';
import api from '../../config/api';

const dogImage = require('../../assets/images/dog_image.png');
const coverImage = require('../../assets/images/Pet_default_image.png');


const { width, height } = Dimensions.get('window');

export default function MyPetProfileScreen({ route, navigation }) {
  const alert = useAppAlert();
  const { petId } = route.params || {};
  const [activeTab, setActiveTab] = useState(null); // null means show all sections
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAboutHint, setShowAboutHint] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  // Measured height of the missing-pet banner so the ScrollView's first
  // child renders below it instead of underneath. Banner is absolutely
  // positioned and stays pinned below the header as the user scrolls.
  const [bannerHeight, setBannerHeight] = useState(0);

  useEffect(() => {
    fetchPetData();
  }, [petId]);

  const fetchPetData = async () => {
    if (!petId) {
      setLoading(false);
      return;
    }

    try {
      const response = await getPetById(petId);
      setPet(response.data.pet);
    } catch (error) {
      console.error('Error fetching pet:', error);
      alert('Error', error.message || 'Failed to load pet profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    navigation.navigate('EditPet', { petId });
  };

  const handleReportMissing = () => {
    navigation.navigate('ReportMissing', { pet });
  };

  const handleMarkSafe = () => {
    if (!pet?.id) {
      Alert.alert('Pet not loaded', 'Try going back and reopening this pet.');
      return;
    }
    const petName = pet?.name || 'this pet';
    // RN's native Alert.alert handles the confirmation. The app's useAppAlert()
    // only supports a single button — passing buttons here would crash the
    // shared modal, so we deliberately use the native dialog instead.
    Alert.alert(
      'Mark as safe?',
      `Confirm that ${petName} has been found. The emergency banner on the QR tag page will be replaced with a "Recently safe!" notice for 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as safe',
          style: 'default',
          onPress: async () => {
            // Snapshot the previous state so we can roll back optimistically.
            const previous = pet;
            try {
              // Optimistic UI flip — the banner + button swap to the safe
              // state immediately, even before the network call returns.
              setPet((p) => (p ? { ...p, isMissing: false } : p));

              await markPetSafe(previous.id);

              // Refresh in the background to pick up server-side fields
              // (resolvedAt, etc.). Don't await — even if it fails, the
              // optimistic flip already shows the right state.
              fetchPetData().catch(() => {});

              // Wrap the success alert in try/catch as paranoia — if the
              // modal layer somehow throws (e.g., during rapid taps), it
              // must not undo the successful mark-safe action.
              try {
                alert(`${petName} is safe!`, 'No longer marked missing.', 'success');
              } catch (modalErr) {
                console.warn('Success modal failed to render:', modalErr?.message);
              }
            } catch (e) {
              // API failed — roll back optimistic update.
              setPet(previous);
              const reason = e?.message || e?.response?.data?.message
                || 'Could not update status. Check your connection and try again.';
              try {
                alert('Could not mark as safe', reason, 'error');
              } catch (modalErr) {
                Alert.alert('Could not mark as safe', reason);
              }
            }
          },
        },
      ]
    );
  };

  const handleSharePetTag = async () => {
    if (!pet?.qrCode) {
      alert('No QR tag linked', 'This pet doesn\'t have a QR tag attached yet, so there\'s no public page to share.', 'info');
      return;
    }
    const url = `${PUBLIC_TAG_BASE}/${pet.qrCode}`;
    const message = pet.isMissing
      ? `🚨 MISSING — ${pet.name} (${pet.breed || pet.type}). Please call if you've seen them. Details: ${url}`
      : `${pet.name}'s OkTreat tag: ${url}`;
    try {
      await Share.share({ message, url });
    } catch (e) {
      // Share dismissal is fine
    }
  };

  const handleAIGenerateDescription = async () => {
    if (!pet) return;

    try {
      setAiGenerating(true);

      const petData = {
        name: pet.name || '',
        breed: pet.breed || '',
        type: pet.petType || '',
        age: pet.ageYears ? `${pet.ageYears} years${pet.ageMonths ? ` ${pet.ageMonths} months` : ''}` : '',
        weight: pet.weight || '',
        sex: pet.sex || '',
        temperament: pet.energyLevel || '',
        additionalInfo: pet.additionalInstructions || '',
      };

      const response = await api.post('/ai/pet-description', petData);

      if (response.data.success && response.data.data.description) {
        const description = response.data.data.description;

        // Save description to backend
        await updatePet(petId, { description });

        // Update local pet state
        setPet({ ...pet, description });

        alert('Success', 'AI description has been generated and saved!', 'success');
      } else {
        alert('Error', response.data.message || 'Failed to generate description', 'error');
      }
    } catch (error) {
      console.error('AI generate error:', error);
      const message = error.response?.data?.message || 'Failed to generate description. Please try again.';
      alert('Error', message, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Format age display
  const getAgeDisplay = () => {
    if (!pet) return '';
    const years = pet.ageYears || 0;
    const months = pet.ageMonths || 0;

    if (years === 0 && months === 0) return 'Age not specified';
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''} old`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''} old`;
    return `${years} year${years !== 1 ? 's' : ''} & ${months} month${months !== 1 ? 's' : ''} old`;
  };

  // Format weight display
  const getWeightDisplay = () => {
    if (!pet || !pet.weight) return 'Weight not specified';
    return `${pet.weight} lbs`;
  };

  // Format adoption date
  const formatAdoptionDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If it's already in a readable format like "26-28 Feb", return as is
      if (dateString.includes('-') && dateString.split(' ').length <= 3 && !dateString.includes(':')) {
        return dateString;
      }
      
      // Parse the date string as UTC to avoid timezone conversion
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as is if can't parse
      }
      
      // Get UTC components to check if time is midnight
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const isTimeZero = hours === 0 && minutes === 0 && seconds === 0;
      
      if (isTimeZero) {
        // Only show date in UTC
        const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
        return date.toLocaleDateString('en-US', options);
      } else {
        // Show date and time in UTC
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' };
        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
        return `${formattedDate} at ${formattedTime}`;
      }
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Pet Profile</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Loading pet profile...</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!pet) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Pet Profile</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>Pet not found</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Pet Profile</Text>
          <TouchableOpacity style={styles.placeholder} onPress={handleSharePetTag}>
            <Icon name="share-social-outline" size={22} color="#0D0D12" />
          </TouchableOpacity>
        </View>

        {/* Missing Pet Banner — absolutely positioned right under the header
            so it stays visible no matter how far the user scrolls. The
            ScrollView's content padding-top is set from bannerHeight below
            so the first chunk of content doesn't render underneath. */}
        {pet?.isMissing && (
          <View
            style={styles.missingBanner}
            onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}
          >
            <Icon name="warning" size={20} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.missingBannerTitle}>
                {pet.name} is marked MISSING
              </Text>
              <Text style={styles.missingBannerSub}>
                Anyone scanning the QR tag sees an emergency alert. You'll be notified on each scan.
              </Text>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              // Push the first content below the sticky banner. +8 gives a
              // little breathing room between the banner and the cover image.
              pet?.isMissing && bannerHeight > 0 && { paddingTop: bannerHeight + 8 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cover Image & Pet Image */}
            <View style={styles.imageSection}>
              <Image
                source={pet.photos && pet.photos.length > 0 ? { uri: pet.photos[0] } : coverImage}
                style={styles.coverImage}
              />
              <View style={styles.petImageWrapper}>
                <Image
                  source={pet.photoUrl ? { uri: pet.photoUrl } : dogImage}
                  style={styles.petImage}
                />
              </View>
            </View>

            {/* Pet Info */}
            <View style={styles.petInfoSection}>
              <Text style={styles.petName}>{pet.name}</Text>

              <View style={styles.breedContainer}>
                <View style={styles.breedIcon} />
                <Text style={styles.breedText}>{pet.breed || pet.petType || 'Unknown breed'}</Text>
              </View>

              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>
                  <Text style={styles.detailLabel}>Weight:</Text>
                  <Text style={styles.detailValue}> {getWeightDisplay()}  .  </Text>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}> {getAgeDisplay()}</Text>
                </Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <PenIcon width={20} height={20} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScrollView}
              contentContainerStyle={styles.tabsContainer}
            >
              <TouchableOpacity
                style={[styles.tab, activeTab === 'About' && styles.tabActive]}
                onPress={() => setActiveTab('About')}
              >
                <Text style={[styles.tabText, activeTab === 'About' && styles.tabTextActive]}>About</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'Feedback' && styles.tabActive]}
                onPress={() => setActiveTab('Feedback')}
              >
                <Text style={[styles.tabText, activeTab === 'Feedback' && styles.tabTextActive]}>Feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'Summary' && styles.tabActive]}
                onPress={() => setActiveTab('Summary')}
              >
                <Text style={[styles.tabText, activeTab === 'Summary' && styles.tabTextActive]}>Summary</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'Health' && styles.tabActive]}
                onPress={() => setActiveTab('Health')}
              >
                <Text style={[styles.tabText, activeTab === 'Health' && styles.tabTextActive]}>Health</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Tab Content */}
            <View style={styles.cardsContainer}>
              {/* About Pet Card */}
              {(activeTab === null || activeTab === 'About') && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>About Pet</Text>
                  <TouchableOpacity
                    style={styles.hintToggle}
                    onPress={() => setShowAboutHint(!showAboutHint)}
                  >
                    <Icon name="information-circle-outline" size={16} color="#32A6D8" />
                    <Text style={styles.hintToggleText}>What should this include?</Text>
                    <Icon name={showAboutHint ? "chevron-up" : "chevron-down"} size={14} color="#32A6D8" />
                  </TouchableOpacity>
                  {showAboutHint && (
                    <Text style={styles.hintText}>
                      Provide future sitters with important information about your pet's personality, behaviors, and specific care requirements.
                    </Text>
                  )}
                  <Text style={styles.cardContent}>{pet.description || 'No description provided yet.'}</Text>
                </View>
              )}

              {/* Sitter Feedback Card */}
              {(activeTab === null || activeTab === 'Feedback') && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Sitter Feedback  (0)</Text>
                  <Text style={styles.cardDescription}>
                    See feedback from previous sitters who looked after your pet, and reply if you wish.
                  </Text>
                  <View style={styles.feedbackRow}>
                    <ChatsTextIcon width={20} height={20} />
                    <Text style={styles.feedbackText}>No sitter feedback yet</Text>
                  </View>
                </View>
              )}

              {/* Summary Card */}
              {(activeTab === null || activeTab === 'Summary') && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Summary</Text>

                  {/* Socialization */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Socialization</Text>
                    <View style={styles.infoRow}>
                      <DogIcon />
                      <Text style={styles.infoText}>{pet.friendlyWithPets || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <KidIcon />
                      <Text style={styles.infoText}>{pet.friendlyWithChildren === "Yes" ? "Friendly With Childrens" : "Not Friendly With Children" || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <WomanIcon width={20} height={20} />
                      <Text style={styles.infoText}>{pet.spayedNeutered || 'Not specified'}</Text>
                    </View>
                  </View>

                  {/* Care */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Care</Text>
                    <View style={styles.infoRow}>
                      <HomeIconNew />
                      <Text style={styles.infoText}>{pet.houseTrained === "Yes" ? "House Trained" : "Not House Trained" || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <PotyIcon width={20} height={20} />
                      <Text style={styles.infoText}>{pet.pottyBreak || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <ClockIcon width={20} height={20} />
                      <Text style={styles.infoText}>{pet.canBeLeftAlone || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <CpuIcon width={20} height={20} />
                      <Text style={styles.infoText}>{pet.feedingSchedule || 'Not specified'}</Text>
                    </View>
                  </View>

                  {/* Energy Level */}
                  {pet.energyLevel && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Energy Level</Text>
                      <Text style={styles.infoText}>{pet.energyLevel}</Text>
                    </View>
                  )}

                  {/* Other Info */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Other Info</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>{pet.microchipped === "Yes" ? "Microchipped" : "Not microchipped" || 'Not microchipped'}</Text>
                    </View>
                    {pet.adoptionDate && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoText}>Adoption Date: {formatAdoptionDate(pet.adoptionDate)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Care Instructions */}
                  {pet.additionalInstructions && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Care Instructions</Text>
                      <Text style={styles.infoText}>{pet.additionalInstructions}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Health Card */}
              {(activeTab === null || activeTab === 'Health') && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Health</Text>
                  <Text style={styles.cardDescription}>
                    Provide the sitter with the information they need to keep your pet safe and healthy.
                  </Text>

                  {/* Veterinary Info */}
                  {pet.veterinaryInfo && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Veterinary Info</Text>
                      <Text style={styles.infoText}>{pet.veterinaryInfo}</Text>
                    </View>
                  )}

                  {/* Insurance */}
                  {pet.insuranceProvider && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Insurance Provider</Text>
                      <Text style={styles.infoText}>{pet.insuranceProvider}</Text>
                    </View>
                  )}

                  {/* Medications */}
                  {pet.medications && pet.medications.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Medications</Text>
                      <Text style={styles.infoText}>{pet.medications.join(', ')}</Text>
                    </View>
                  )}

                  {/* QR Code */}
                  {pet.qrCode && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>QR Code</Text>
                      <Text style={styles.infoText}>{pet.qrCode}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Report Missing / Mark Safe Button */}
            {pet?.isMissing ? (
              <TouchableOpacity style={styles.safeButton} onPress={handleMarkSafe}>
                <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.reportButtonText}>Mark {pet.name} as Safe</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.reportButton} onPress={handleReportMissing}>
                <InfoCircleIcon width={20} height={20} color="white" />
                <Text style={styles.reportButtonText}>Report Pet as Missing</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  placeholder: {
    width: 48,
    height: 48,
    opacity: 0,
  },
  contentContainer: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: 4,
    paddingBottom: 24,
  },
  imageSection: {
    height: 233,
    width: width * 0.9,
    position: 'relative',
  },
  coverImage: {
    width: width * 0.9,
    height: 182,
    borderRadius: 20,
  },
  petImageWrapper: {
    position: 'absolute',
    left: width * 0.3,
    top: 130,
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: 78,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#32A6D8',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petInfoSection: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  petName: {
    color: '#0D0D12',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 37.2,
    textAlign: 'center',
    marginBottom: 2,
  },
  breedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  breedIcon: {
    width: 14,
    height: 14,
    backgroundColor: '#32A6D8',
    borderRadius: 7,
  },
  breedText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 6,
  },
  detailsText: {
    textAlign: 'center',
  },
  detailLabel: {
    color: 'black',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 17.05,
  },
  detailValue: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  editButton: {
    height: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(50, 166, 216, 0.18)',
    borderRadius: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  editButtonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 24.8,
    textAlign: 'center',
  },
  tabsScrollView: {
    marginBottom: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(203.75, 203.75, 203.75, 0.15)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderColor: '#FFC2EB',
  },
  tabText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  tabTextActive: {
    color: '#32A6D8',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    color: '#0D0D12',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 21.7,
  },
  cardDescription: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  cardContent: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 20.15,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#32A6D8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 4,
    minWidth: 120,
    justifyContent: 'center',
  },
  aiGenerateButtonText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  feedbackText: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 20.15,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  iconImage: {
    width: 20,
    height: 20,
    tintColor: '#32A6D8',
    resizeMode: 'contain',
  },
  infoText: {
    flex: 1,
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  reportButton: {
    height: 50,
    paddingHorizontal: width * 0.05,
    paddingVertical: 8,
    backgroundColor: '#E45050',
    borderRadius: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 24.8,
    textAlign: 'center',
  },
  safeButton: {
    height: 50,
    paddingHorizontal: width * 0.05,
    paddingVertical: 8,
    backgroundColor: '#1F9E5C',
    borderRadius: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  missingBanner: {
    // Sticky banner pinned below the header. zIndex: 5 keeps it above the
    // scrollable content. It does not occupy normal-flow space; the
    // ScrollView accounts for it via paddingTop = bannerHeight.
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#D93025',
    borderRadius: 10,
  },
  missingBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginBottom: 2,
  },
  missingBannerSub: {
    color: '#FFE7E1',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  errorText: {
    color: '#E45050',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  hintToggleText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    flex: 1,
  },
  hintText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18,
    backgroundColor: '#F6FBFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
});

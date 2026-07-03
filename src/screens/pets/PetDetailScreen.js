import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Dimensions, Share, Alert } from 'react-native';
import * as Location from 'expo-location';
import { BackArrowIcon, LocationArrowCircleIcon, WhatsappIcon, PhoneCallIcon, DogIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';

const dogImage = require('../../assets/images/dog_image.png');
const { width, height } = Dimensions.get('window');

export default function PetDetailScreen({ route, navigation }) {
  const { petData, qrCode } = route.params || {};

  const pet = petData;

  if (!pet) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pet Profile</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#E45050', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500' }}>Pet data not available</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
              <Text style={{ color: '#32A6D8', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

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

  const handleBack = () => {
    navigation.goBack();
  };

  // Get the finder's current GPS and build a "I found your pet" message.
  // Used by both Share Location (OS share sheet) and WhatsApp.
  // Returns { message, hadLocation } so callers can warn the user when
  // GPS is missing and the message reads less useful as a result.
  const buildFinderMessage = async () => {
    let mapsUrl = '';
    let hadLocation = false;
    let permissionDenied = false;
    let timedOut = false;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let perm = status;
      if (perm !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        perm = req.status;
      }
      if (perm === 'granted') {
        try {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ]);
          const { latitude, longitude } = loc.coords;
          mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          hadLocation = true;
        } catch (e) {
          timedOut = true;
        }
      } else {
        permissionDenied = true;
      }
    } catch (e) {
      // Unexpected — fall through with no location
    }
    const petName = pet?.name || 'your pet';
    const lines = [
      `Hi! I found ${petName} (matched via OkTreat QR tag).`,
      mapsUrl ? `My current location: ${mapsUrl}` : 'I have your pet — please get in touch.',
    ];
    return { message: lines.join('\n\n'), hadLocation, permissionDenied, timedOut };
  };

  const handleShareLocation = async () => {
    try {
      const result = await buildFinderMessage();
      if (!result.hadLocation) {
        // Warn the finder before sharing — they need to know the owner
        // won't see GPS coordinates so they don't assume the job is done.
        const reason = result.permissionDenied
          ? 'Location permission was denied, so your GPS coordinates won\'t be included.'
          : 'We couldn\'t get your GPS location in time, so coordinates won\'t be included.';
        Alert.alert(
          'Sharing without location',
          `${reason} You can still share a message, or use Call / WhatsApp to reach the owner directly.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share Anyway',
              onPress: () => Share.share({ message: result.message }).catch(() => {}),
            },
          ],
        );
        return;
      }
      await Share.share({ message: result.message });
    } catch (e) {
      // User dismissed the sheet — fine
    }
  };

  const handleWhatsapp = async () => {
    // Prefer the missing-pet contact phone (owner chose this for the
    // current lost-pet flow) over the static profile phone.
    const rawPhone = pet?.missingReport?.contactPhone
      || pet?.user?.phone
      || pet?.owner?.phone
      || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    if (!phone) {
      Alert.alert(
        'WhatsApp unavailable',
        'The owner hasn\'t shared a phone number, so we can\'t reach them on WhatsApp. Try the Emergency Call button or send them an email instead.',
      );
      return;
    }
    const result = await buildFinderMessage();
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(result.message)}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (!supported) {
      // Fallback to wa.me (browser — works even without WhatsApp installed)
      const fallback = `https://wa.me/${phone}?text=${encodeURIComponent(result.message)}`;
      Linking.openURL(fallback).catch(() => {
        Alert.alert(
          'WhatsApp couldn\'t open',
          'We couldn\'t launch WhatsApp on this device. Try the Emergency Call button instead — the owner\'s phone is on file.',
        );
      });
      return;
    }
    Linking.openURL(url).catch((error) => {
      console.error('Failed to open WhatsApp:', error?.message);
      Alert.alert(
        'WhatsApp couldn\'t open',
        'We couldn\'t launch WhatsApp on this device. Try the Emergency Call button instead — the owner\'s phone is on file.',
      );
    });
  };

  const handleEmergencyCall = async () => {
    const phone = pet?.missingReport?.contactPhone || pet?.user?.phone || pet?.owner?.phone;
    if (!phone) {
      Alert.alert(
        'Call unavailable',
        'The owner hasn\'t shared a phone number for this pet. Try emailing them at the address shown above, or use Share Location to send them a message via another app.',
      );
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      console.error('Failed to open phone dialer:', error);
      Alert.alert(
        'Couldn\'t open dialer',
        'Your device blocked the phone dialer. The owner\'s number is: ' + phone,
      );
    }
  };

  // Normalize any JSON field that could be array-or-string legacy data.
  const asList = (m) => {
    if (!m) return [];
    if (Array.isArray(m)) return m.filter(Boolean);
    if (typeof m === 'string' && m.trim()) return [m.trim()];
    return [];
  };
  const medicationsList = asList(pet?.medications);
  const foodAllergiesList = asList(pet?.foodAllergies);
  const medAllergiesList = asList(pet?.medicationAllergies);

  // Combined vet contact line — hides parts that are empty. Fallback to
  // legacy veterinaryInfo blob if none of the split fields are set.
  const vetLine = (() => {
    const parts = [pet?.vetName, pet?.vetPhone, pet?.vetAddress].filter(Boolean);
    if (parts.length) return parts.join(' · ');
    return pet?.veterinaryInfo || '';
  })();

  // Build a list of health rows that have data — empty fields are skipped
  // so finders aren't staring at "Microchipped: —" rows.
  const healthRows = [
    foodAllergiesList.length > 0 && {
      label: 'Food allergies',
      value: foodAllergiesList.join(', '),
      highlight: true,
    },
    medAllergiesList.length > 0 && {
      label: 'Medication allergies',
      value: medAllergiesList.join(', '),
      highlight: true,
    },
    medicationsList.length > 0 && {
      label: 'Medications',
      value: medicationsList.join(', '),
      highlight: true,
    },
    pet?.additionalInstructions && {
      label: 'Special needs',
      value: pet.additionalInstructions,
      highlight: true,
    },
    pet?.feedingSchedule && { label: 'Feeding', value: pet.feedingSchedule },
    pet?.microchipped && { label: 'Microchipped', value: pet.microchipped },
    pet?.spayedNeutered && { label: 'Spayed / Neutered', value: pet.spayedNeutered },
    vetLine && { label: 'Veterinary contact', value: vetLine },
  ].filter(Boolean);

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pet Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Pet Image */}
            <View style={styles.petImageContainer}>
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
                <DogIcon/>
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

            {/* Owner Details Card */}
            <View style={styles.ownerCard}>
              <Text style={styles.ownerLabel}>Owner Details</Text>
              <Text style={styles.ownerName}>
                {pet.user?.fullName || pet.owner?.name || 'Owner name not shared'}
              </Text>
              <Text style={styles.ownerEmail}>
                {pet.user?.email || pet.owner?.email || 'Email not shared by owner'}
              </Text>
              <Text style={styles.ownerAddress}>
                {pet.user?.address || pet.owner?.address || 'Address not shared by owner'}
              </Text>
            </View>

            {/* Health Information Card */}
            <View style={styles.healthCard}>
              <Text style={styles.healthTitle}>Health Information</Text>
              <Text style={styles.healthSubtitle}>
                Important info if you found this pet
              </Text>
              {healthRows.length > 0 ? (
                healthRows.map((row) => (
                  <View key={row.label} style={styles.healthRow}>
                    <Text style={[styles.healthLabel, row.highlight && styles.healthLabelHi]}>
                      {row.label}
                    </Text>
                    <Text style={[styles.healthValue, row.highlight && styles.healthValueHi]}>
                      {row.value}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.healthEmpty}>
                  The owner hasn't shared any health details for this pet yet.
                  If the pet seems unwell, please contact the owner directly using
                  the buttons below.
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleShareLocation}
              >
                <LocationArrowCircleIcon width={20} height={20} />
                <Text style={styles.actionButtonText}>Share Your Location</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleWhatsapp}
              >
                <WhatsappIcon width={20} height={20} />
                <Text style={styles.actionButtonText}>Whatsapp</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEmergencyCall}
              >
                <PhoneCallIcon width={20} height={20} />
                <Text style={styles.actionButtonText}>Emergency Call</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
  },
  petImageContainer: {
    alignItems: 'center',
    marginBottom: 3,
  },
  petImageWrapper: {
    width: 127,
    height: 127,
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
    marginBottom: 5,
  },
  petName: {
    color: '#0D0D12',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 37.2,
    textAlign: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
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
    fontWeight: '600',
    lineHeight: 17.05,
  },
  detailValue: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  ownerCard: {
    backgroundColor: 'white',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FAFAFA',
    paddingVertical: 22,
    alignItems: 'center',
    alignContent: 'center',
    marginBottom: 29,
  },
  ownerLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  ownerName: {
    color: '#040404',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 33.6,
    textAlign: 'center',
    marginBottom: 4,
  },
  ownerEmail: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  ownerAddress: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
    textAlign: 'center',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  healthTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginBottom: 2,
  },
  healthSubtitle: {
    color: '#818898',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    marginBottom: 12,
  },
  healthRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  healthLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  healthLabelHi: {
    color: '#B0211A',
  },
  healthValue: {
    color: '#1F2937',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    lineHeight: 18,
  },
  healthValueHi: {
    color: '#1F2937',
    fontWeight: '600',
  },
  healthEmpty: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontStyle: 'italic',
    lineHeight: 18,
    paddingVertical: 6,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    height: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(50, 166, 216, 0.18)',
    borderRadius: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#32A6D8',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 24.8,
    textAlign: 'center',
  },
});

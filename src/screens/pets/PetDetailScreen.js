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
  const buildFinderMessage = async () => {
    let mapsUrl = '';
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let perm = status;
      if (perm !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        perm = req.status;
      }
      if (perm === 'granted') {
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
        ]);
        const { latitude, longitude } = loc.coords;
        mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      }
    } catch (e) {
      // Permission denied or timeout — continue without location
    }
    const petName = pet?.name || 'your pet';
    const lines = [
      `Hi! I found ${petName} (matched via OkTreat QR tag).`,
      mapsUrl ? `My current location: ${mapsUrl}` : 'I have your pet — please get in touch.',
    ];
    return lines.join('\n\n');
  };

  const handleShareLocation = async () => {
    try {
      const message = await buildFinderMessage();
      await Share.share({ message });
    } catch (e) {
      // User dismissed the sheet — fine
    }
  };

  const handleWhatsapp = async () => {
    const rawPhone = pet?.user?.phone || pet?.owner?.phone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    if (!phone) {
      Alert.alert('No phone on file', 'This pet\'s owner hasn\'t shared a phone number.');
      return;
    }
    const message = await buildFinderMessage();
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (!supported) {
      // Fallback to wa.me (browser-based — works without WhatsApp installed)
      const fallback = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(fallback).catch(() => {
        Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Try calling instead.');
      });
      return;
    }
    Linking.openURL(url).catch((error) => {
      console.error('Failed to open WhatsApp:', error?.message);
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Try calling instead.');
    });
  };

  const handleEmergencyCall = async () => {
    const phone = pet.user?.phone || pet.owner?.phone;
    if (phone) {
      try {
        await Linking.openURL(`tel:${phone}`);
      } catch (error) {
        console.error('Failed to open phone dialer:', error);
      }
    }
  };

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
              <Text style={styles.ownerName}>{pet.user?.fullName || pet.owner?.name || 'Owner name not available'}</Text>
              <Text style={styles.ownerEmail}>{pet.user?.email || pet.owner?.email || 'Email not available'}</Text>
              <Text style={styles.ownerAddress}>{pet.user?.address || pet.owner?.address || 'Address not available'}</Text>
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

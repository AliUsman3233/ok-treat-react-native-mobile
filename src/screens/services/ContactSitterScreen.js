import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Switch, Modal, Dimensions, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import { useState, useEffect } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CalendarIcon, CheckCircleIcon } from '../../assets';
import { Button } from '../../components';
import { createBooking } from '../../services/bookingService';
import { getUserPets } from '../../services/petService';
import { useWallet } from '../../context/WalletContext';
import { getServiceUnit } from '../../utils/serviceUnits';
import moment from 'moment';

const { width } = Dimensions.get('window');

const SERVICE_SUBTITLES = {
  'Boarding': "At the sitter's home",
  'House Sitting': 'At your residence',
  'Drop-In Visit': 'In-home visits',
  'Day Care': 'Daytime care',
  'Pet Walking': 'Exercise & fresh air',
};

const SERVICE_ICONS = {
  'Boarding': 'home',
  'House Sitting': 'home-outline',
  'Drop-In Visit': 'time',
  'Day Care': 'sunny',
  'Pet Walking': 'walk',
};

// Convert display name to API enum
const SERVICE_TYPE_MAP = {
  'Boarding': 'BOARDING',
  'House Sitting': 'HOUSE_SITTING',
  'Drop-In Visit': 'DROP_IN_VISITS',
  'Day Care': 'DAY_CARE',
  'Pet Walking': 'PET_WALKING',
};

// The API enums the sitter's `services` map is keyed by.
const SERVICE_ENUMS = Object.values(SERVICE_TYPE_MAP);

// Normalize whatever we were handed (an enum like "BOARDING", or a display
// name like "Boarding") to the API enum. Callers upstream aren't consistent
// about which shape they pass, so accept both — a display name that slips
// through must never silently miss the enum-keyed services map.
const toServiceEnum = (v) => (SERVICE_ENUMS.includes(v) ? v : SERVICE_TYPE_MAP[v]);

export default function ContactSitterScreen({ navigation, route }) {
  const alert = useAppAlert();
  const wallet = useWallet();
  const { sitter, service, serviceType, startDate, endDate } = route?.params || {};
  const [message, setMessage] = useState('');
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [loadingPets, setLoadingPets] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refresh balance whenever this screen opens — covers the case where the
  // user pulled coins via ShopCoins on a sibling stack and came back.
  useEffect(() => {
    wallet.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's pets on mount
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await getUserPets();
        const userPets = response?.data?.pets || [];
        setPets(userPets);
        if (userPets.length > 0) {
          setSelectedPetId(userPets[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch pets:', err);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, []);

  // Get base rate from sitter's service data
  // Resolved once, used everywhere (rate lookup, unit label, payload) so the
  // three can't drift. Accepts an enum or a display name from upstream.
  const effectiveServiceType =
    toServiceEnum(serviceType) || toServiceEnum(service) || 'BOARDING';

  const getBaseRate = () => {
    const svcData = sitter?.services?.[effectiveServiceType];
    return parseFloat(svcData?.baseRate) || 0;
  };

  const { unit: RATE_UNIT, pricedBy } = getServiceUnit(effectiveServiceType);
  const isHourly = pricedBy === 'hours';

  // Duration for pricing math. For hour-based services the search
  // flow packs a single day + time window into two same-day ISO
  // timestamps, so we derive whole hours from the delta (rounded up
  // so a 30-minute request bills as 1 hour — matches the sitter's
  // hourly quote). For day-based, we count whole days as before.
  const getUnitCount = () => {
    if (!startDate || !endDate) return null;
    if (isHourly) {
      const ms = moment(endDate).diff(moment(startDate));
      if (ms <= 0) return 1;
      return Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
    }
    const days = moment(endDate).diff(moment(startDate), 'days');
    return days > 0 ? days : 1;
  };

  // Format date range for display. Hour-based bookings are a single
  // day + time window, so show that shape instead of a two-date range.
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Dates not selected';
    if (isHourly) {
      const start = moment(startDate);
      const end = moment(endDate);
      return `${start.format('MMM D, YYYY')} · ${start.format('h:mm A')} - ${end.format('h:mm A')}`;
    }
    return `${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D, YYYY')}`;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Backend rounds totalPrice to an int before deducting (Float→Int safety)
  // so we mirror that here for the precheck — otherwise the displayed
  // "100 coins" cost would let a 99.5-coin balance pass the precheck and
  // then fail server-side.
  const unitCount = getUnitCount();
  const totalCost = Math.max(0, Math.round(getBaseRate() * (unitCount || 1)));
  const balance = wallet.coinBalance;
  const insufficient = totalCost > 0 && balance < totalCost;

  const handleSendRequest = async () => {
    if (!message.trim()) {
      alert('Message Required', 'Please enter a message before sending your request.', 'pending');
      return;
    }

    if (!selectedPetId) {
      alert('Pet Required', 'Please select a pet for this booking.', 'pending');
      return;
    }

    if (!startDate || !endDate) {
      alert('Dates Required', 'Booking dates are missing. Please go back and select dates.', 'pending');
      return;
    }

    // The sitter must have a usable rate for this service, otherwise the
    // server-computed total won't match and the request would fail with a
    // confusing "total mismatch". Catch it here with a clear message.
    if (getBaseRate() <= 0) {
      alert(
        'Price unavailable',
        `This sitter hasn't set a price for ${service || serviceType} yet, so it can't be booked right now. Try another sitter.`,
        'pending',
      );
      return;
    }

    if (insufficient) {
      alert(
        'Not Enough Coins',
        `You need ${totalCost} coins for this booking but only have ${balance}. Tap Buy Coins to top up.`,
        'pending',
      );
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        sitterId: sitter?.id || sitter?._id,
        petId: selectedPetId,
        serviceType: effectiveServiceType,
        startDate: startDate,
        endDate: endDate,
        totalPrice: totalCost,
        notes: message.trim(),
      };

      await createBooking(bookingData);
      // Server-side hold dropped the balance — pull the new total so
      // every other screen sees the update without a remount.
      wallet.refresh();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to create booking:', err);
      const msg = err?.message;
      if (err?.isNetwork || err?.status === 0) {
        alert('No connection', 'We couldn’t reach the server. Check your internet and try again.', 'error');
      } else if (msg && /coin balance/i.test(msg)) {
        // Server-side balance rejection — the message already has need/have numbers.
        alert('Not enough coins', `${msg} Tap Buy Coins to top up.`, 'pending');
      } else if (err?.status === 404) {
        alert('No longer available', msg || 'This sitter or pet is no longer available. Please search again.', 'pending');
      } else if (err?.status === 400 && msg) {
        // Validation (e.g. price mismatch, bad dates) — surface the specific reason.
        alert('Couldn’t place booking', msg, 'pending');
      } else if (!err?.status || err.status >= 500) {
        // Server error (500). In test mode we surface the server-side detail
        // (err.error) to speed up debugging; keep it friendly if absent.
        alert(
          'Something went wrong',
          err?.error
            ? `Booking couldn’t be completed.\n\nServer: ${err.error}`
            : 'We couldn’t complete your booking right now. Please try again in a moment.',
          'error',
        );
      } else {
        alert('Couldn’t place booking', msg || 'Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('OpenRequests');
  };

  const baseRate = getBaseRate();
  // Pluralized unit label — "day" / "days" or "hour" / "hours" —
  // driven by serviceUnits so we can't drift from the sitter setup
  // screen's "/ per X" copy.
  const unitLabelSingular = RATE_UNIT;
  const unitLabelPlural = `${RATE_UNIT}s`;
  const unitLabel = (unitCount || 1) === 1 ? unitLabelSingular : unitLabelPlural;
  const unitLabelTitle = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);

  return (
    <ScreenWrapper noBottomTabs>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact {sitter?.name || 'Sitter'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Service Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Icon name={SERVICE_ICONS[service] || 'home'} size={30} color="#32A6D8" />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{service || 'Boarding'}</Text>
                  <Text style={styles.cardSubtitle}>{SERVICE_SUBTITLES[service] || "At the sitter's home"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Schedule Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.scheduleContainer}>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <CalendarIcon width={30} height={30} fill="#32A6D8" />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Service Date</Text>
                    <Text style={styles.cardSubtitle}>{formatDateRange()}</Text>
                  </View>
                  {unitCount && (
                    <Text style={styles.daysText}>{unitCount} {unitLabelTitle}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Price Summary + balance + Buy Coins CTA */}
          {baseRate > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Estimate</Text>
              <View style={styles.card}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{baseRate} coins x {unitCount || 1} {unitLabel}</Text>
                  <Text style={styles.priceValue}>{totalCost} coins</Text>
                </View>
                <View style={[styles.priceRow, { marginTop: 8 }]}>
                  <Text style={[styles.priceLabel, { fontSize: 12, color: '#818898' }]}>Your balance</Text>
                  <Text style={[
                    styles.priceLabel,
                    { fontWeight: '600', color: insufficient ? '#E53E3E' : '#3FA477' }
                  ]}>
                    {balance.toLocaleString()} coins
                  </Text>
                </View>
                {insufficient && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: '#E53E3E', marginBottom: 8, fontFamily: 'Avenir LT Std' }}>
                      You need {(totalCost - balance).toLocaleString()} more coins.
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ShopCoins')}
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: '#32A6D8',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'Avenir LT Std' }}>
                        Buy Coins
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Pets Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Pet</Text>
            {loadingPets ? (
              <View style={styles.loadingPetsContainer}>
                <ActivityIndicator size="small" color="#32A6D8" />
                <Text style={styles.loadingPetsText}>Loading your pets...</Text>
              </View>
            ) : pets.length > 0 ? (
              <View style={styles.petsListContainer}>
                {pets.map((pet) => {
                  const isSelected = selectedPetId === pet.id;
                  const years = pet.ageYears || 0;
                  const months = pet.ageMonths || 0;
                  const ageDisplay = years === 0 && months === 0
                    ? 'Age not specified'
                    : years === 0 ? `${months} month${months !== 1 ? 's' : ''}`
                    : months === 0 ? `${years} year${years !== 1 ? 's' : ''}`
                    : `${years} year${years !== 1 ? 's' : ''} & ${months} month${months !== 1 ? 's' : ''}`;
                  const weightDisplay = pet.weight ? `${pet.weight} lbs` : 'Weight not specified';

                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={[styles.petCard, isSelected && styles.petCardSelected]}
                      onPress={() => setSelectedPetId(pet.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.petCardHeader}>
                        <View style={styles.petCardLeft}>
                          <View style={styles.petImageContainer}>
                            <Image
                              source={pet.photoUrl ? { uri: pet.photoUrl } : require('../../assets/images/Pet_default_image.png')}
                              style={styles.petImage}
                            />
                          </View>
                          <Text style={styles.petName} numberOfLines={1}>{pet.name || 'Unknown'}</Text>
                        </View>
                        <Text style={styles.petBreed}>{pet.breed || pet.type || ''}</Text>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                      <View style={styles.petDetails}>
                        <Text style={styles.petDetailsText}>
                          <Text style={styles.detailLabel}>Weight:</Text>
                          <Text style={styles.detailValue}> {weightDisplay}  .  </Text>
                          <Text style={styles.detailLabel}>Age:</Text>
                          <Text style={styles.detailValue}> {ageDisplay}</Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noPetsCard}
                onPress={() => navigation.navigate('AddPet')}
              >
                <Icon name="add-circle-outline" size={24} color="#32A6D8" />
                <Text style={styles.noPetsText}>Add a pet to continue</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Message Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message<Text style={{ color: '#FF3B30' }}> *</Text></Text>
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Write here..."
                placeholderTextColor="#898D8F"
                multiline
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
            <Text style={styles.charCounter}>{message.length}/500</Text>
          </View>
        </ScrollView>

        {/* Send Request Button */}
        <View style={styles.buttonContainer}>
          {submitting ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color="#32A6D8" />
              <Text style={styles.loadingButtonText}>Sending...</Text>
            </View>
          ) : (
            <Button
              title={insufficient ? 'Not Enough Coins' : 'Send Request'}
              onPress={handleSendRequest}
              fullWidth
              size="medium"
              disabled={
                !message?.trim() || !selectedPetId || !startDate || submitting || insufficient
              }
            />
          )}
        </View>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <CheckCircleIcon width={66} height={66} color="#32A6D8" />
              </View>
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Request Sent Successfully</Text>
                <Text style={styles.modalMessage}>
                  Your request has been sent to the sitter. You will be notified once they respond.
                </Text>
              </View>
              <TouchableOpacity style={styles.seeRequestsButton} onPress={handleModalClose}>
                <Text style={styles.seeRequestsButtonText}>See Request List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 8,
  },
  card: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  cardSubtitle: {
    color: '#676869',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  daysText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.6,
    textAlign: 'right',
  },
  scheduleContainer: {
    gap: 8,
  },
  // Pet styles
  loadingPetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingPetsText: {
    color: '#818898',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  petsListContainer: {
    gap: 8,
  },
  petCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  petCardSelected: {
    borderColor: '#32A6D8',
    borderWidth: 1.5,
  },
  petCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  petImageContainer: {
    width: 37,
    height: 37,
    borderRadius: 38,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  petImage: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  petName: {
    flex: 1,
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 21.7,
  },
  petBreed: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
    marginRight: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#32A6D8',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#32A6D8',
  },
  petDetails: {
    flexDirection: 'column',
    gap: 2,
  },
  petDetailsText: {
    textAlign: 'left',
    marginLeft: 50,
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
  noPetsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderStyle: 'dashed',
  },
  noPetsText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  priceValue: {
    color: '#32A6D8',
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 22,
  },
  // Message styles
  messageInputContainer: {
    height: 130,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: 'white',
  },
  messageInput: {
    flex: 1,
    color: 'black',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  charCounter: {
    color: '#898D8F',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  loadingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 52,
  },
  loadingButtonText: {
    color: '#858585',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.064,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 342,
    alignItems: 'center',
    gap: 30,
  },
  successIconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTextContainer: {
    width: '100%',
    gap: 10,
  },
  modalTitle: {
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#043334',
    textAlign: 'center',
    lineHeight: 25.2,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18.2,
  },
  seeRequestsButton: {
    width: width * 0.7,
    height: 40,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeRequestsButtonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
    textAlign: 'center',
  },
});

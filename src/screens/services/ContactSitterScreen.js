import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Switch, Modal, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CalendarIcon, CheckCircleIcon } from '../../assets';
import { Button } from '../../components';
import { createBooking } from '../../services/bookingService';

const { width } = Dimensions.get('window');

export default function ContactSitterScreen({ navigation, route }) {
  const { sitter, service, dates, pets } = route?.params || {};
  const [message, setMessage] = useState('');
  const [isPetSelected, setIsPetSelected] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSendRequest = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message before sending your request.');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        sitterId: sitter?.id || sitter?._id,
        serviceType: service || 'Boarding',
        dates: dates,
        message: message.trim(),
        pets: isPetSelected && pets ? pets : [],
      };

      await createBooking(bookingData);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to create booking:', err);
      Alert.alert(
        'Request Failed',
        err?.message || 'Failed to send your request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('OpenRequests');
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact {sitter?.name || 'Ashlyn T.'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Service Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Icon name="home" size={30} color="#32A6D8" />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{service || 'Boarding'}</Text>
                  <Text style={styles.cardSubtitle}>At the sitter's house</Text>
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
                    <Text style={styles.cardSubtitle}>{dates || 'Dec 23-25'}</Text>
                  </View>
                  <Text style={styles.daysText}>7 Days</Text>
                </View>
              </View>

              <View style={styles.timeCard}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Drop-Off Range</Text>
                  <Text style={styles.addTimeText}>Add times</Text>
                  <Icon name="chevron-forward" size={20} color="#32A6D8" />
                </View>
              </View>

              <View style={styles.timeCard}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Pick-Up Range</Text>
                  <Text style={styles.addTimeText}>Add times</Text>
                  <Icon name="chevron-forward" size={20} color="#32A6D8" />
                </View>
              </View>
            </View>
          </View>

          {/* Pets Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pets</Text>
            <View style={styles.petCard}>
              <View style={styles.petHeader}>
                <View style={styles.petInfo}>
                  <Image
                    source={require('../../assets/images/Pet_default_image.png')}
                    style={styles.petImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.petName}>Toto</Text>
                </View>
                <Switch
                  value={isPetSelected}
                  onValueChange={setIsPetSelected}
                  trackColor={{ false: '#E5E5E5', true: '#FFC2EB' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E5E5"
                />
              </View>
              <View style={styles.petDetails}>
                <Text style={styles.petDetailsText}>
                  <Text style={styles.petLabel}>Weight: </Text>
                  <Text style={styles.petValue}>25 pounds  .  </Text>
                  <Text style={styles.petLabel}>Age: </Text>
                  <Text style={styles.petValue}>9 years & 7 months old</Text>
                </Text>
              </View>
            </View>
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
              title="Send Request"
              onPress={handleSendRequest}
              fullWidth
              size="medium"
              disabled={!message?.trim() || submitting}
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
  timeCard: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    flex: 1,
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  addTimeText: {
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    marginRight: 8,
  },
  petCard: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 12,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  petImage: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  petName: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  petDetails: {
    gap: 6,
  },
  petDetailsText: {
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  petLabel: {
    color: 'black',
    fontSize: 11,
    lineHeight: 17.05,
  },
  petValue: {
    color: '#818898',
    fontSize: 12,
    lineHeight: 18.6,
  },
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

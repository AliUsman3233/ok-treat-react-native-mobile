import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import Icon from '@expo/vector-icons/Ionicons';
import { BackArrowIcon, ShieldCheckIcon } from '../../../assets';
import api from '../../../config/api';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 24;
const CONTENT_WIDTH = width - (HORIZONTAL_PADDING * 2);

export default function VerifyIdentityScreen({ navigation }) {
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const [step, setStep] = useState('intro');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  // Try to prevent screen capture (works if expo-screen-capture is available)
  let usePreventScreenCapture;
  try {
    usePreventScreenCapture = require('expo-screen-capture').usePreventScreenCapture;
  } catch (e) {
    usePreventScreenCapture = () => {};
  }
  usePreventScreenCapture(step === 'card' ? 'verify-card' : undefined);

  const handleCardSubmit = async () => {
    if (!cardComplete) return;
    setIsVerifying(true);
    try {
      const { data } = await api.post('/stripe/setup-intent');
      if (!data.success) throw new Error(data.message || 'Failed to initialize');

      const { setupIntentClientSecret } = data.data;

      const { setupIntent, error } = await confirmSetupIntent(setupIntentClientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) throw new Error(error.message);

      const verifyResponse = await api.post('/stripe/verify-card', {
        paymentMethodId: setupIntent.paymentMethodId,
      });

      if (verifyResponse.data.success) {
        // Update Redux state so HomeScreen knows user is verified
        const updatedUser = { ...user, stripeVerified: true };
        dispatch(setCredentials({ user: updatedUser, token }));
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        setStep('intro');
        setShowSuccessModal(true);
      } else {
        setErrorMessage(verifyResponse.data.message || 'Verification failed');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage(error.message || 'Failed to verify card. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (step === 'card') setStep('intro');
    else navigation.goBack();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.replace('ProfileSetup');
  };

  // "Skip for now" used to just call navigation.goBack(), which dumped the
  // user back on the BecomeASitterIntro screen with no path forward — they
  // couldn't reach the sitter info sections. Now it confirms the skip and
  // advances to ProfileSetup (same destination as a successful verify).
  const handleSkipVerification = () => {
    Alert.alert(
      'Skip identity verification?',
      'Without verification you can still fill out your sitter profile, but you won\'t be approved or receive payouts until verification is complete. You can come back any time.',
      [
        { text: 'Continue verifying', style: 'cancel' },
        {
          text: 'Skip for now',
          style: 'destructive',
          onPress: () => navigation.replace('ProfileSetup'),
        },
      ]
    );
  };

  // ============ INTRO STEP ============
  if (step === 'intro') {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <BackArrowIcon width={20} height={20} fill="#090E12" />
            </TouchableOpacity>
          </View>

          <View style={styles.introContent}>
            <View style={styles.introTop}>
              <View style={styles.iconCircle}>
                <ShieldCheckIcon width={32} height={32} fill="#FFFFFF" />
              </View>

              <Text style={styles.introTitle}>Verify your Identity</Text>
              <Text style={styles.introDesc}>
                Verifying who you are builds trust and ensures safety for everyone. Verified providers get more bookings.
              </Text>

              <View style={styles.badges}>
                {[
                  { icon: 'lock-closed', text: 'Bank-level encryption' },
                  { icon: 'eye-off', text: 'No charges will be made' },
                  { icon: 'shield-checkmark', text: 'Powered by Stripe' },
                ].map((item, i) => (
                  <View key={i} style={styles.badgeRow}>
                    <View style={styles.badgeIcon}>
                      <Icon name={item.icon} size={16} color="#32A6D8" />
                    </View>
                    <Text style={styles.badgeText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.introBottom}>
              <Button title="Verify with Card" onPress={() => setStep('card')} type="primary" size="medium" fullWidth />
              <TouchableOpacity onPress={handleSkipVerification} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Success Modal */}
          <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleSuccessClose}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <View style={styles.successCircle}>
                  <Icon name="checkmark" size={36} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>Verification Successful!</Text>
                <Text style={styles.modalMsg}>Your identity has been verified. You can now access all sitter features.</Text>
                <Button title="Continue" onPress={handleSuccessClose} type="primary" size="large" fullWidth />
              </View>
            </View>
          </Modal>
        </View>
      </ScreenWrapper>
    );
  }

  // ============ CARD ENTRY STEP ============
  return (
    <ScreenWrapper noBottomTabs>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isVerifying}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <View style={styles.lockBadge}>
            <Icon name="lock-closed" size={12} color="#32A6D8" />
            <Text style={styles.lockText}>Secure</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.cardPage}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.cardTitle}>Enter Card Details</Text>
          <Text style={styles.cardSubtitle}>
            For identity verification only. No charges will be made to your card.
          </Text>

          {/* Card Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Card Information</Text>
            <View style={styles.fieldBox}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: '1234 5678 9012 3456' }}
                cardStyle={{
                  backgroundColor: '#FFFFFF',
                  textColor: '#0D0D12',
                  borderWidth: 0,
                  fontSize: 15,
                  placeholderColor: '#B0B0B0',
                  cursorColor: '#32A6D8',
                  textErrorColor: '#FF3B30',
                }}
                style={{ width: CONTENT_WIDTH - 2, height: 48 }}
                onCardChange={(details) => setCardComplete(details.complete)}
              />
            </View>
            <Text style={styles.fieldHint}>Card number, expiry date, and CVC</Text>
          </View>

          {/* Security badges */}
          <View style={styles.securityBox}>
            {[
              { icon: 'shield-checkmark', text: '256-bit SSL encrypted' },
              { icon: 'eye-off', text: 'Screen recording blocked' },
              { icon: 'server-outline', text: 'Card data never touches our servers' },
            ].map((item, i) => (
              <View key={i} style={styles.secRow}>
                <Icon name={item.icon} size={15} color="#4CAF50" />
                <Text style={styles.secText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom */}
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.submitBtn, (!cardComplete || isVerifying) && { opacity: 0.4 }]}
            onPress={handleCardSubmit}
            disabled={!cardComplete || isVerifying}
            activeOpacity={0.8}
          >
            {isVerifying ? (
              <View style={styles.submitRow}>
                <ActivityIndicator size="small" color="#32A6D8" />
                <Text style={styles.submitText}>Verifying...</Text>
              </View>
            ) : (
              <View style={styles.submitRow}>
                <Icon name="lock-closed" size={16} color="#32A6D8" />
                <Text style={styles.submitText}>Verify Card</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.powered}>
            Powered by <Text style={{ fontWeight: '700', color: '#635BFF' }}>Stripe</Text>
          </Text>
        </View>

        {/* Error Modal */}
        <Modal visible={showErrorModal} transparent animationType="fade" onRequestClose={() => setShowErrorModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.errorCircle}>
                <Icon name="close" size={30} color="#FFF" />
              </View>
              <Text style={styles.modalTitle}>Verification Failed</Text>
              <Text style={styles.modalMsg}>{errorMessage}</Text>
              <Button title="Try Again" onPress={() => setShowErrorModal(false)} type="primary" size="large" fullWidth />
              <TouchableOpacity onPress={() => { setShowErrorModal(false); setStep('intro'); }} style={styles.skipBtn}>
                <Text style={styles.skipText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 16, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Intro
  introContent: { flex: 1, paddingHorizontal: HORIZONTAL_PADDING, justifyContent: 'space-between', paddingBottom: 36 },
  introTop: { alignItems: 'center', gap: 16, paddingTop: 8 },
  iconCircle: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#FFC2EB', justifyContent: 'center', alignItems: 'center' },
  introTitle: { color: '#0D0D12', fontSize: 22, fontFamily: 'Poppins', fontWeight: '600', textAlign: 'center' },
  introDesc: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '400', lineHeight: 22, textAlign: 'center', maxWidth: 300 },
  badges: { gap: 10, width: '100%', marginTop: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F6FBFF', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8F4FD' },
  badgeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F4FD', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#0D0D12', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  introBottom: { gap: 12, alignItems: 'center' },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: '#F38FB4', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '750' },

  // Card entry header
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 16, paddingBottom: 12 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F4FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  lockText: { color: '#32A6D8', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '700' },

  // Card page
  cardPage: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 16, paddingBottom: 32, gap: 20 },
  cardTitle: { color: '#0D0D12', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600' },
  cardSubtitle: { color: '#818898', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '400', lineHeight: 20, marginTop: -12 },

  // Field
  fieldContainer: { gap: 8 },
  fieldLabel: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' },
  fieldBox: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', overflow: 'hidden', alignItems: 'center' },
  fieldHint: { color: '#B0B0B0', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '400' },

  // Security
  securityBox: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 16, gap: 12 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secText: { color: '#666D80', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '400', flex: 1 },

  // Bottom
  bottom: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 32, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 10, alignItems: 'center' },
  submitBtn: { width: '100%', height: 54, backgroundColor: '#FFC2EB', borderRadius: 52, justifyContent: 'center', alignItems: 'center' },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#32A6D8', fontSize: 16, fontFamily: 'Avenir LT Std', fontWeight: '700' },
  powered: { color: '#B0B0B0', fontSize: 12, fontFamily: 'Avenir LT Std' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBox: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 },
  successCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  errorCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { color: '#0D0D12', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600', textAlign: 'center' },
  modalMsg: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '400', lineHeight: 22, textAlign: 'center' },
});

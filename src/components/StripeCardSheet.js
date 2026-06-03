// PCI-safe replacement for AddCardBottomSheet, used by the Shop Coins flow.
// Card data is collected by Stripe's native CardField — the raw PAN never
// touches our JS or backend. Confirmation calls Stripe directly with the
// PaymentIntent clientSecret from /coins/purchase, then the server-side
// webhook credits the coins.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { usePaymentConfig } from '../context/PaymentConfigContext';

export default function StripeCardSheet({
  visible,
  onClose,
  // Display string like "$24.99" — purely informational. The real charge
  // amount lives inside the PaymentIntent the backend already created.
  amountLabel,
  // Function returning the clientSecret. Lazily called when the user taps Pay
  // so we don't create a PaymentIntent that may never get confirmed.
  fetchClientSecret,
  onSuccess,
}) {
  const { mode, publishableKey, error: configError } = usePaymentConfig();
  const { confirmPayment } = useConfirmPayment();

  const [cardComplete, setCardComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Track keyboard height ourselves — KeyboardAvoidingView is unreliable inside
  // a Modal on Android (the Modal renders in a separate native window which
  // doesn't inherit the activity's windowSoftInputMode). Listener works the
  // same on both platforms.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      setKeyboardHeight(e?.endCoordinates?.height || 0);
      // Scroll to the card field area on Android where soft keyboard appears later.
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    };
    const onHide = () => setKeyboardHeight(0);
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible]);

  const handlePay = async () => {
    setErrorMessage('');

    if (!publishableKey) {
      setErrorMessage('Payments are not available right now. Please try again later.');
      return;
    }
    if (!cardComplete) {
      setErrorMessage('Please fill in all card details.');
      return;
    }

    setSubmitting(true);
    try {
      const purchase = await fetchClientSecret();
      if (!purchase?.clientSecret) {
        setErrorMessage(purchase?.message || 'Could not start the payment. Please try again.');
        return;
      }

      const { paymentIntent, error } = await confirmPayment(purchase.clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try a different card.');
        return;
      }
      if (paymentIntent?.status === 'Succeeded' || paymentIntent?.status === 'RequiresCapture') {
        onSuccess?.(paymentIntent);
        return;
      }
      // Other statuses (RequiresAction handled by SDK; RequiresPaymentMethod, Canceled, etc.)
      setErrorMessage(`Payment status: ${paymentIntent?.status || 'unknown'}. Please retry.`);
    } catch (e) {
      console.error('StripeCardSheet pay error:', e);
      setErrorMessage(e?.message || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Padding the overlay's bottom by keyboardHeight pushes the sheet up
          so the CardField + Pay button stay above the keyboard. */}
      <View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pay with Card</Text>
            <TouchableOpacity onPress={onClose} disabled={submitting} hitSlop={10}>
              <Icon name="close" size={24} color="#0D0D12" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {mode === 'test' && (
              <View style={styles.testBanner}>
                <Text style={styles.testBannerText}>
                  TEST MODE — use 4242 4242 4242 4242 with any future expiry and any CVC.
                </Text>
              </View>
            )}

            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amount}>{amountLabel}</Text>

            <Text style={styles.fieldLabel}>Card Details</Text>
            <View style={styles.cardFieldWrap}>
              <CardField
                postalCodeEnabled
                placeholders={{ number: '4242 4242 4242 4242' }}
                cardStyle={cardFieldStyle}
                style={styles.cardField}
                onCardChange={(details) => setCardComplete(!!details?.complete)}
              />
            </View>

            {!!configError && (
              <Text style={styles.errorText}>
                {configError}
              </Text>
            )}
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity
              style={[
                styles.payButton,
                (submitting || !cardComplete || !publishableKey) && styles.payButtonDisabled,
              ]}
              disabled={submitting || !cardComplete || !publishableKey}
              onPress={handlePay}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Pay {amountLabel}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footer}>
              Card data is sent directly to Stripe and never stored on our servers.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const cardFieldStyle = {
  backgroundColor: '#FFFFFF',
  textColor: '#090E12',
  placeholderColor: '#A0A0A0',
  borderRadius: 12,
  fontSize: 14,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#0D0D12',
  },
  testBanner: {
    backgroundColor: '#FEF5E7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  testBannerText: {
    fontSize: 12,
    color: '#8C5A0E',
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
  },
  amountLabel: {
    fontSize: 12,
    color: '#818898',
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    color: '#0D0D12',
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#0D0D12',
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardFieldWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 0,
  },
  cardField: {
    width: '100%',
    height: 56,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
    marginTop: 12,
  },
  payButton: {
    marginTop: 20,
    height: 52,
    backgroundColor: '#32A6D8',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
  },
  footer: {
    marginTop: 12,
    fontSize: 11,
    color: '#818898',
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    textAlign: 'center',
  },
});

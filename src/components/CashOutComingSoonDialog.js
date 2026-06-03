// Shown when a user taps any Cash Out CTA. The cash-out feature itself is
// scoped for Phase 2 (Stripe Connect onboarding, 30-day hold check, fee
// calculation, payouts). Until then this dialog is the polite no-op.
//
// Reused by PaymentMethodsScreen and SitterEarningsScreen so all entry
// points show the same copy. Don't fork — change here.

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

export default function CashOutComingSoonDialog({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <Icon name="cash-outline" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Cash-out coming soon</Text>
          <Text style={styles.message}>
            Soon you'll be able to withdraw your earned coins as real cash. This feature is in development — for now, your earnings stay in your wallet and can be spent on services.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3FA477',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#0D0D12',
    fontSize: 19,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#32A6D8',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
  },
});

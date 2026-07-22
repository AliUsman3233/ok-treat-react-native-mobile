import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';

export default function PrivacyPolicyScreen({ navigation }) {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.paragraph}>
              OkTreat ("we", "us") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have. By using the OkTreat app you agree to the practices described here.
            </Text>
            <Text style={styles.paragraph}>
              Information we collect: the details you provide when you create an account and profile (name, email, phone, address, profile photo), your pets' information, booking and payment activity, messages you exchange with sitters or owners, and — only when you grant permission — your device location, which is used to match you with nearby sitters and to help reunite lost pets scanned via a QR tag.
            </Text>
            <Text style={styles.paragraph}>
              How we use your information: to operate the service (matching, bookings, messaging and payments), to keep the platform safe, to send you notifications you have enabled, and to improve the app. We do not sell your personal information.
            </Text>
            <Text style={styles.paragraph}>
              Sharing: we share the minimum information needed to complete a booking (for example, a sitter sees the owner's name, pet details and, where relevant, address). Payment processing is handled by our payment provider. We may disclose information where required by law.
            </Text>
            <Text style={styles.paragraph}>
              Your choices: you can view and update your profile at any time, control notification preferences in Settings, and request deletion of your account. Location sharing can be turned off in your device settings, though some features may then be unavailable.
            </Text>
            <Text style={styles.paragraph}>
              Contact us: if you have any questions about this policy or your data, please reach us through the Help & Support section of the app.
            </Text>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  content: {
    gap: 16,
  },
  paragraph: {
    color: '#676869',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
});

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import { BackArrowIcon, CameraIconSvg, ShieldLockIcon, LockIcon } from '../../../assets';

export default function StripeVerificationScreen({ navigation }) {
  const [verificationPending, setVerificationPending] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAgreeAndContinue = () => {
    // Stripe verification integration pending - show pending state
    setVerificationPending(true);
  };

  const handleDecline = () => {
    Alert.alert(
      'Skip identity verification?',
      'Without verification you won\'t be able to receive payouts or be approved as a sitter. You can come back and complete this any time.',
      [
        { text: 'Continue verifying', style: 'cancel' },
        {
          text: 'Skip for now',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
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
        </View>

        {/* Stripe Logo Circle */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>Stripe</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            We Works with Stripe to Verify Your Identity
          </Text>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.iconWrapper}>
                <CameraIconSvg width={20} height={20} fill="#32A6D8" />
              </View>
              <Text style={styles.featureText}>
                You can perform an accurate image identification.
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.iconWrapper}>
                <ShieldLockIcon width={20} height={20} fill="#32A6D8" />
              </View>
              <Text style={styles.featureText}>
                This information you provide to Stripe will help us verify your identity.
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.iconWrapper}>
                <LockIcon width={20} height={20} fill="#32A6D8" />
              </View>
              <Text style={styles.featureText}>
                OkTreat will only authentication data will be accessed.
              </Text>
            </View>
          </View>

          {/* Verification Pending State */}
          {verificationPending ? (
            <View style={styles.pendingContainer}>
              <Text style={styles.pendingTitle}>Verification Pending</Text>
              <Text style={styles.pendingText}>
                Stripe identity verification integration is coming soon. Your account has been noted for verification once the integration is complete.
              </Text>
              <Button
                title="Continue to Profile Setup"
                onPress={() => navigation.navigate('ProfileSetup')}
                type="primary"
                size="large"
                fullWidth
              />
            </View>
          ) : (
            <>
              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Agree and Continue"
                  onPress={handleAgreeAndContinue}
                  type="primary"
                  size="large"
                  fullWidth
                />

                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={handleDecline}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer Text */}
        <View style={[styles.footer, { bottom: 20 + insets.bottom }]}>
          <Text style={styles.footerText}>
            * By selection Agree and continue you agree to Stripe{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 40,
  },
  logoCircle: {
    width: 168,
    height: 168,
    backgroundColor: '#FFC2EB',
    borderRadius: 84,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    gap: 58,
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 31,
  },
  featuresList: {
    gap: 21,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
  },
  buttonContainer: {
    gap: 18.65,
    alignItems: 'center',
  },
  declineButton: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    color: '#F38FB4',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '750',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 21,
    right: 21,
  },
  footerText: {
    color: '#090E12',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  footerLink: {
    color: '#32A6D8',
  },
  pendingContainer: {
    gap: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pendingTitle: {
    color: '#191919',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
  },
  pendingText: {
    color: '#676869',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
});

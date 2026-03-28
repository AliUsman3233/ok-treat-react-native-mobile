import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { BackArrowIcon, KeyIcon } from '../../assets';
import api from '../../config/api';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const scrollViewRef = useRef(null);
  const requirementsRef = useRef(null);

  // Step management: 'email' -> 'reset'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [apiError, setApiError] = useState('');

  // Validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperAndLower: false,
    hasNumberOrSymbol: false,
    passwordsMatch: false,
  });

  // Check password validations
  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasUpperAndLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumberOrSymbol: /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0 && confirmPassword.length > 0,
    });
  }, [password, confirmPassword]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Check if all required conditions are met
  const isValid = validations.minLength && password === confirmPassword && password.length > 0;
  const isEmailValid = email.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  const handleSendCode = async () => {
    if (!isEmailValid) return;

    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setStep('reset');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isCodeValid = /^\d{4}$/.test(code.trim());

  const handleSavePassword = async () => {
    if (!isValid || !code.trim()) {
      if (!code.trim()) setApiError('Please enter the verification code.');
      return;
    }

    if (!isCodeValid) {
      setApiError('Verification code must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });
      navigation.navigate('PasswordChangeSuccess');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Enter email
  if (step === 'email') {
    return (
      <ScreenWrapper style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon
              width={width * 0.053}
              height={width * 0.053}
              fill="#090E12"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <View style={styles.iconInnerBorder} />
              <View style={styles.iconWrapper}>
                <KeyIcon
                  width={width * 0.088}
                  height={width * 0.088}
                  fill="#FFFFFF"
                />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a code to reset your password.
          </Text>

          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => { setEmail(text); setApiError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

          <Button
            title={loading ? 'Sending...' : 'Send Reset Code'}
            onPress={handleSendCode}
            type="primary"
            size="medium"
            fullWidth
            style={{ marginTop: 24 }}
            disabled={!isEmailValid || loading}
          />
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>Need help? </Text>
            <TouchableOpacity>
              <Text style={styles.supportLink}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Step 2: Enter code + new password
  return (
    <ScreenWrapper style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('email')}
        >
          <BackArrowIcon
            width={width * 0.053}
            height={width * 0.053}
            fill="#090E12"
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Form Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0 && { paddingBottom: keyboardHeight + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <View style={styles.iconInnerBorder} />
            <View style={styles.iconWrapper}>
              <KeyIcon
                width={width * 0.088}
                height={width * 0.088}
                fill="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Set New Password</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Enter the code sent to {email} and create your new password.
        </Text>

        {/* Verification Code Input */}
        <Input
          placeholder="Verification code"
          value={code}
          onChangeText={(text) => { setCode(text.replace(/\D/g, '')); setApiError(''); }}
          keyboardType="number-pad"
          maxLength={4}
        />

        {/* Password Input */}
        <Input
          type="password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
        />

        {/* Confirm Password Input */}
        <Input
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

        <Button
          title={loading ? 'Saving...' : 'Save new password'}
          onPress={handleSavePassword}
          type="primary"
          size="medium"
          fullWidth
          style={{ marginTop: 24, marginBottom: 20 }}
          disabled={!isValid || !isCodeValid || loading}
        />

        {/* Password Requirements - Always below button, visible when typing */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password must contain:</Text>
          <View style={styles.bulletContainer}>
            {/* Requirement 1: At least 8 characters */}
            <View style={styles.requirementRow}>
              <View style={[styles.bullet, validations.minLength && styles.bulletActive]}>
                {validations.minLength ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={styles.crossmark}>✕</Text>
                )}
              </View>
              <Text style={[styles.requirementItem, validations.minLength && styles.requirementActive]}>
                At least 8 characters
              </Text>
            </View>

            {/* Requirement 2: Uppercase and lowercase */}
            <View style={styles.requirementRow}>
              <View style={[styles.bullet, validations.hasUpperAndLower && styles.bulletActive]}>
                {validations.hasUpperAndLower ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={styles.crossmark}>✕</Text>
                )}
              </View>
              <Text style={[styles.requirementItem, validations.hasUpperAndLower && styles.requirementActive]}>
                Both uppercase and lowercase letters (optional)
              </Text>
            </View>

            {/* Requirement 3: Number or symbol */}
            <View style={styles.requirementRow}>
              <View style={[styles.bullet, validations.hasNumberOrSymbol && styles.bulletActive]}>
                {validations.hasNumberOrSymbol ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={styles.crossmark}>✕</Text>
                )}
              </View>
              <Text style={[styles.requirementItem, validations.hasNumberOrSymbol && styles.requirementActive]}>
                At least one number or symbol (optional)
              </Text>
            </View>

            {/* Requirement 4: Passwords match */}
            <View style={styles.requirementRow}>
              <View style={[styles.bullet, validations.passwordsMatch && styles.bulletActive]}>
                {validations.passwordsMatch ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={styles.crossmark}>✕</Text>
                )}
              </View>
              <Text style={[styles.requirementItem, validations.passwordsMatch && styles.requirementActive]}>
                Passwords match
              </Text>
            </View>
          </View>
        </View>

        {/* Password Match Indicator - Removed since it's now in requirements */}
      </ScrollView>

      {/* Bottom Section - Fixed at bottom */}
      <View style={styles.bottomSection}>
        {/* Save Button */}


        {/* Support Link */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>Need help? </Text>
          <TouchableOpacity>
            <Text style={styles.supportLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: width * 0.064,
    paddingBottom: 100, // Base padding
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.064,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 72,
    height: 72,
    backgroundColor: '#FFC2EB',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconInnerBorder: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(9, 14, 18, 0.04)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#191919',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    width: 283,
    textAlign: 'center',
    color: '#5D6165',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 24,
  },
  requirementsContainer: {
    width: '100%',
    marginTop: 12,
    marginBottom: 100, // Extra space to ensure it's scrollable
    padding: 12,
    backgroundColor: 'rgba(50, 166, 216, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(50, 166, 216, 0.1)',
  },
  requirementsTitle: {
    color: '#32A6D8',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 12,
    height: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletActive: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  crossmark: {
    color: '#666666',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  bulletSpacer: {
    width: 8,
    height: 8,
  },
  requirementsTextContainer: {
    flex: 1,
  },
  requirementItem: {
    opacity: 0.5,
    color: '#5D6165',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  requirementActive: {
    opacity: 1,
    color: '#4CAF50',
  },
  supportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  supportText: {
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
  },
  supportLink: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  apiError: {
    color: '#FF4444',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    width: '100%',
  },
});

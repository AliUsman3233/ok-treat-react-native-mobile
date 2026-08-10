import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { redeemReferral, dismissReferralPrompt } from '../services/referralService';

/**
 * "Were you invited?" prompt. Shown once per session to eligible users
 * (recent, not-yet-referred). Applying a code or tapping "I wasn't invited"
 * both stop it from showing again (server-side flag).
 */
export default function ReferralPromptModal({ visible, onClose, onRedeemed }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleApply = async () => {
    const c = code.trim();
    if (!c) { setError('Enter a referral code'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await redeemReferral(c);
      setSuccess(res?.message || 'Success! Bonus coins added.');
      onRedeemed && onRedeemed();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not redeem that code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    try { await dismissReferralPrompt(); } catch (e) { /* ignore */ }
    onClose && onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {success ? (
            <>
              <View style={styles.iconWrap}>
                <Icon name="checkmark-circle" size={44} color="#3FA477" />
              </View>
              <Text style={styles.title}>You're all set!</Text>
              <Text style={styles.subtitle}>{success}</Text>
              <TouchableOpacity style={styles.applyBtn} onPress={() => onClose && onClose()}>
                <Text style={styles.applyText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconWrap}>
                <Icon name="gift" size={40} color="#32A6D8" />
              </View>
              <Text style={styles.title}>Were you invited?</Text>
              <Text style={styles.subtitle}>
                Enter a friend's referral code and get 50 bonus coins.
              </Text>
              <TextInput
                style={[styles.input, !!error && styles.inputError]}
                placeholder="Referral code"
                placeholderTextColor="#8D8E90"
                autoCapitalize="characters"
                autoCorrect={false}
                value={code}
                onChangeText={(t) => { setCode(t); setError(''); }}
                editable={!submitting}
              />
              {!!error && <Text style={styles.errorText}>{error}</Text>}
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.applyText}>Apply</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDismiss} disabled={submitting} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>I wasn't invited</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  iconWrap: { marginBottom: 12 },
  title: { color: '#0D0D12', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600', textAlign: 'center' },
  subtitle: { color: '#818898', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400', textAlign: 'center', marginTop: 8, lineHeight: 19 },
  input: {
    width: '100%', height: 52, borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 12,
    paddingHorizontal: 16, marginTop: 18, color: '#212121', fontFamily: 'Poppins', fontSize: 16,
    letterSpacing: 2, textAlign: 'center',
  },
  inputError: { borderColor: '#E53D3D' },
  errorText: { color: '#E53D3D', fontSize: 12, fontFamily: 'Poppins', marginTop: 8, alignSelf: 'flex-start' },
  applyBtn: {
    width: '100%', height: 52, borderRadius: 26, backgroundColor: '#32A6D8',
    justifyContent: 'center', alignItems: 'center', marginTop: 18,
  },
  applyText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  dismissBtn: { marginTop: 14, paddingVertical: 6 },
  dismissText: { color: '#818898', fontSize: 13, fontFamily: 'Poppins', fontWeight: '500' },
});

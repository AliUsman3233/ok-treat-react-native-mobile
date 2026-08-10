import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import api from '../../config/api';

const REFERRER_REWARD = 100;
const REFERRED_REWARD = 50;

export default function InviteFriendsScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const code = stats?.referralCode || user?.referralCode || '';

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/referral-stats');
      setStats(res.data?.data || null);
    } catch (e) {
      console.error('Failed to load referral stats:', e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message:
          `Join me on OkTreat — the app for trusted pet sitters! 🐾\n\n` +
          `Use my referral code ${code} when you sign up and you'll get ${REFERRED_REWARD} bonus coins (I get ${REFERRER_REWARD} too).`,
      });
    } catch (e) {
      // user dismissed share sheet — ignore
    }
  };

  const invited = stats?.totalReferrals ?? 0;
  const earned = stats?.totalRewards ?? 0;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Friends</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Icon name="gift" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Give 50, get 100</Text>
            <Text style={styles.heroSubtitle}>
              Share your code. When a friend signs up with it, they get {REFERRED_REWARD} bonus coins and you get {REFERRER_REWARD}.
            </Text>
          </View>

          {/* Code card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your referral code</Text>
            {loading && !code ? (
              <ActivityIndicator size="small" color="#32A6D8" style={{ marginVertical: 12 }} />
            ) : (
              <Text style={styles.code} selectable>{code || '—'}</Text>
            )}
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={!code}>
              <Icon name="share-social" size={18} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share your code</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{invited}</Text>
              <Text style={styles.statLabel}>Friends invited</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{earned}</Text>
              <Text style={styles.statLabel}>Coins earned</Text>
            </View>
          </View>

          {/* How it works */}
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { icon: 'share-social-outline', text: 'Share your code with friends.' },
            { icon: 'person-add-outline', text: 'They enter it when they sign up for OkTreat.' },
            { icon: 'server-outline', text: `You both get bonus coins added to your balance instantly.` },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Icon name={step.icon} size={18} color="#32A6D8" />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500', lineHeight: 24.8 },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#32A6D8',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  heroTitle: { color: '#0D0D12', fontSize: 22, fontFamily: 'Poppins', fontWeight: '600' },
  heroSubtitle: {
    color: '#818898', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    textAlign: 'center', marginTop: 8, lineHeight: 19, paddingHorizontal: 8,
  },
  codeCard: {
    borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 16, padding: 20,
    alignItems: 'center', backgroundColor: '#FAFCFF',
  },
  codeLabel: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', fontWeight: '500' },
  code: {
    color: '#32A6D8', fontSize: 30, fontFamily: 'Poppins', fontWeight: '700',
    letterSpacing: 4, marginVertical: 12,
  },
  shareButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#32A6D8',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 4,
  },
  shareButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statBox: {
    flex: 1, borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  statValue: { color: '#0D0D12', fontSize: 24, fontFamily: 'Poppins', fontWeight: '700' },
  statLabel: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', marginTop: 4 },
  sectionTitle: {
    color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600',
    marginTop: 28, marginBottom: 12,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(90,172,244,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepText: { flex: 1, color: '#424242', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400', lineHeight: 19 },
});

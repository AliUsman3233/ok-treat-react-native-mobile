import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import * as Clipboard from 'expo-clipboard';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import api from '../../config/api';

const REFERRER_REWARD = 100;
const REFERRED_REWARD = 50;

export default function InviteFriendsScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  const code = stats?.referralCode || user?.referralCode || '';

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/auth/referral-stats');
      setStats(res.data?.data || null);
    } catch (e) {
      // leave stats null — code still comes from redux user
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message:
          `Join me on OkTreat — the app for trusted pet sitters! 🐾\n\n` +
          `Use my code ${code} when you sign up and you'll get ${REFERRED_REWARD} bonus coins.`,
      });
    } catch (e) { /* dismissed */ }
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
            <Icon name="gift" size={28} color="#32A6D8" />
            <Text style={styles.heroTitle}>Give {REFERRED_REWARD}, get {REFERRER_REWARD}</Text>
            <Text style={styles.heroSubtitle}>
              Share your code — your friend gets {REFERRED_REWARD} coins and you get {REFERRER_REWARD} when they join.
            </Text>
          </View>

          {/* Code + actions */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR CODE</Text>
            <View style={styles.codeRow}>
              <Text style={styles.code} numberOfLines={1} selectable>{code || '—'}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} disabled={!code} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name={copied ? 'checkmark' : 'copy-outline'} size={20} color="#32A6D8" />
              </TouchableOpacity>
            </View>
            {copied && <Text style={styles.copiedText}>Copied!</Text>}
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={!code}>
            <Icon name="share-social" size={18} color="#FFFFFF" />
            <Text style={styles.shareText}>Share invite</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{invited}</Text>
              <Text style={styles.statLabel}>Invited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{earned}</Text>
              <Text style={styles.statLabel}>Coins earned</Text>
            </View>
          </View>
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
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroTitle: { color: '#0D0D12', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600', marginTop: 8 },
  heroSubtitle: {
    color: '#818898', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 12,
  },
  codeCard: {
    borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
    backgroundColor: '#FAFCFF',
  },
  codeLabel: { color: '#818898', fontSize: 11, fontFamily: 'Poppins', fontWeight: '600', letterSpacing: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  code: { flex: 1, color: '#32A6D8', fontSize: 24, fontFamily: 'Poppins', fontWeight: '700', letterSpacing: 3 },
  copyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(90,172,244,0.12)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  copiedText: { color: '#3FA477', fontSize: 12, fontFamily: 'Poppins', fontWeight: '500', marginTop: 6 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#32A6D8', height: 52, borderRadius: 26, marginTop: 14,
  },
  shareText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 14, marginTop: 20, paddingVertical: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#EBEBEB' },
  statValue: { color: '#0D0D12', fontSize: 22, fontFamily: 'Poppins', fontWeight: '700' },
  statLabel: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', marginTop: 2 },
});

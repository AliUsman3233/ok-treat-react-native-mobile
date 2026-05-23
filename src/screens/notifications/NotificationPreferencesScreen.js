import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { useAppAlert } from '../../context/AlertContext';
import api from '../../config/api';

const CATEGORIES = [
  {
    key: 'bookings',
    title: 'Bookings',
    description: 'New requests, confirmations, declines, cancellations, completions',
    icon: 'calendar-outline',
    color: '#32A6D8',
  },
  {
    key: 'messages',
    title: 'Messages',
    description: 'New chat messages from sitters and pet owners',
    icon: 'chatbubble-outline',
    color: '#7C3AED',
  },
  {
    key: 'reviews',
    title: 'Reviews',
    description: 'Reviews left on your sitter profile',
    icon: 'star-outline',
    color: '#FBBC04',
  },
  {
    key: 'payments',
    title: 'Payments & Coins',
    description: 'Coin purchases, refunds, earnings, and wallet activity',
    icon: 'wallet-outline',
    color: '#1F9E5C',
  },
  {
    key: 'petAlerts',
    title: 'Pet Alerts',
    description: 'QR tag activity. Missing-pet scan alerts are always on (cannot be disabled).',
    icon: 'paw-outline',
    color: '#D93025',
    note: 'Missing-pet scan alerts cannot be turned off — they\'re critical for finding lost pets.',
  },
  {
    key: 'account',
    title: 'Account',
    description: 'Sitter approval, profile changes, system updates. Password change alerts are always on.',
    icon: 'person-outline',
    color: '#0EA5E9',
    note: 'Password change alerts cannot be turned off — they\'re needed for account security.',
  },
  {
    key: 'promotional',
    title: 'Promotional & Tips',
    description: 'Referral rewards, special offers, tips and announcements',
    icon: 'megaphone-outline',
    color: '#F59E0B',
  },
];

export default function NotificationPreferencesScreen({ navigation }) {
  const alert = useAppAlert();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/notifications/preferences');
        setPrefs(res.data?.data?.preferences || null);
      } catch (e) {
        alert(
          'Could not load preferences',
          e?.response?.data?.message || 'Try again in a moment.',
          'error'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (key) => {
    if (!prefs) return;
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await api.put('/notifications/preferences', { [key]: next });
      setPrefs(res.data?.data?.preferences || prefs);
    } catch (e) {
      // Roll back optimistic update
      setPrefs((p) => ({ ...p, [key]: !next }));
      alert('Failed to update', e?.response?.data?.message || 'Try again.', 'error');
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#32A6D8" />
          </View>
        ) : !prefs ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Could not load preferences.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              Choose what you want to be notified about. Changes take effect immediately.
            </Text>

            {CATEGORIES.map((cat) => (
              <View key={cat.key} style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: cat.color + '22' }]}>
                  <Icon name={cat.icon} size={20} color={cat.color} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{cat.title}</Text>
                  <Text style={styles.rowDesc}>{cat.description}</Text>
                  {cat.note && <Text style={styles.rowNote}>{cat.note}</Text>}
                </View>
                <View style={styles.switchWrap}>
                  {saving[cat.key] ? (
                    <ActivityIndicator size="small" color="#32A6D8" />
                  ) : (
                    <Switch
                      value={Boolean(prefs[cat.key])}
                      onValueChange={() => toggle(cat.key)}
                      trackColor={{ false: '#D1D5DB', true: cat.color }}
                      thumbColor="#FFFFFF"
                    />
                  )}
                </View>
              </View>
            ))}

            <View style={styles.footer}>
              <Icon name="shield-checkmark-outline" size={16} color="#818898" />
              <Text style={styles.footerText}>
                Safety-critical notifications (missing-pet scan alerts, password changes) are always
                delivered.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    flex: 1,
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginLeft: 8,
  },
  placeholder: { width: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#D93025', fontSize: 14, fontFamily: 'Avenir LT Std' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  intro: {
    color: '#818898',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    lineHeight: 19,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 2,
  },
  rowDesc: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    lineHeight: 17,
  },
  rowNote: {
    color: '#D93025',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontStyle: 'italic',
    marginTop: 4,
  },
  switchWrap: { paddingTop: 6, minWidth: 50, alignItems: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F6F8FA',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  footerText: {
    flex: 1,
    color: '#818898',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    lineHeight: 15,
  },
});

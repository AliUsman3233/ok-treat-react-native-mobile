import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, DogImage } from '../../assets';
import { getBlockedUsers, unblockUser } from '../../services/moderationService';

export default function BlockedUsersScreen({ navigation }) {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBlockedUsers();
      setBlocked(res?.data?.blocked || []);
    } catch (e) {
      console.error('Failed to load blocked users:', e?.message);
      setBlocked([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleUnblock = async (userId) => {
    setBusyId(userId);
    try {
      await unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      console.error('Failed to unblock:', e?.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Users</Text>
          <View style={styles.backButton} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#32A6D8" /></View>
        ) : blocked.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {blocked.map((u) => (
              <View key={u.id} style={styles.row}>
                <Image source={u.avatarUrl ? { uri: u.avatarUrl } : DogImage} style={styles.avatar} />
                <Text style={styles.name} numberOfLines={1}>{u.fullName || 'User'}</Text>
                <TouchableOpacity
                  style={styles.unblockBtn}
                  onPress={() => handleUnblock(u.id)}
                  disabled={busyId === u.id}
                >
                  {busyId === u.id
                    ? <ActivityIndicator size="small" color="#32A6D8" />
                    : <Text style={styles.unblockText}>Unblock</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyText: { color: '#9E9E9E', fontSize: 14, fontFamily: 'Poppins' },
  list: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 12, padding: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0' },
  name: { flex: 1, color: '#040404', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' },
  unblockBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(90,172,244,0.15)', minWidth: 84, alignItems: 'center',
  },
  unblockText: { color: '#32A6D8', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600' },
});

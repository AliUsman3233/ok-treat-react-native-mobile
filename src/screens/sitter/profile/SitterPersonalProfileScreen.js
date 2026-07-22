import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, DogImage, ProfileImagePersonIcon } from '../../../assets';
import { getSitterProfile } from '../../../services/sitterService';
import { getUserPets } from '../../../services/petService';
import api from '../../../config/api';

const SERVICE_META = {
  PET_WALKING:    { label: 'Pet Walking',   icon: 'walk-outline' },
  BOARDING:       { label: 'Boarding',      icon: 'bed-outline' },
  HOUSE_SITTING:  { label: 'House Sitting', icon: 'home-outline' },
  DROP_IN_VISITS: { label: 'Drop-in Visit', icon: 'hand-right-outline' },
  DAY_CARE:       { label: 'Day Care',      icon: 'sunny-outline' },
};

// Compact "Sep 25" style for review dates
const formatReviewDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatPetAge = (years, months) => {
  const parts = [];
  if (Number.isFinite(years) && years > 0) parts.push(`${years}y`);
  if (Number.isFinite(months) && months > 0) parts.push(`${months}m`);
  return parts.join(' ') || '—';
};

export default function SitterPersonalProfileScreen({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('info');
  const [sitter, setSitter] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const sitterRes = await getSitterProfile();
      const sitterPayload = sitterRes?.data?.sitter || sitterRes?.sitter || null;
      setSitter(sitterPayload);

      // Reviews (best-effort — empty list if endpoint fails)
      if (sitterPayload?.id) {
        api
          .get(`/reviews/sitter/${sitterPayload.id}?take=20`)
          .then((r) => {
            const list = r.data?.data?.reviews || r.data?.reviews || [];
            setReviews(Array.isArray(list) ? list : []);
          })
          .catch((e) => {
            console.warn('Failed to load sitter reviews:', e?.message);
            setReviews([]);
          });
      }

      // Pets the sitter owns themselves (for the Info → Pets card)
      getUserPets()
        .then((r) => {
          const list = r?.data?.pets || r?.pets || [];
          setPets(Array.isArray(list) ? list : []);
        })
        .catch(() => setPets([]));
    } catch (e) {
      console.error('Failed to load sitter profile:', e?.message);
      setError(e?.message || 'Could not load your profile.');
      setSitter(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ─── Derived display values ───────────────────────────────────────────────
  const displayName =
    sitter?.name ||
    [sitter?.firstName, sitter?.lastName].filter(Boolean).join(' ') ||
    user?.fullName ||
    'Your profile';
  const businessTitle = sitter?.title || sitter?.businessName || '';
  const cityState = [sitter?.city, sitter?.state].filter(Boolean).join(', ');
  const rating = sitter?.averageRating ?? sitter?.rating ?? null;
  const reviewCount = sitter?.totalReviews ?? reviews.length ?? 0;
  const repeatClients = sitter?.repeatClients ?? null;
  const isApproved = sitter?.approvalStatus === 'APPROVED';
  const profileImage = sitter?.profilePhoto || sitter?.profileImage || sitter?.avatarUrl || user?.avatarUrl || null;
  const coverImage = sitter?.coverImage || (Array.isArray(sitter?.photos) && sitter.photos[0]) || null;
  const aboutText = sitter?.aboutPet || sitter?.about || '';

  // ─── Loading / error states ───────────────────────────────────────────────
  if (loading && !sitter) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#32A6D8" />
          <Text style={styles.dimText}>Loading your profile…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!sitter) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} fill="#090E12" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Profile</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={[styles.centered, { flex: 1 }]}>
            <Icon name="alert-circle-outline" size={48} color="#818898" />
            <Text style={styles.dimText}>{error || 'Sitter profile not found.'}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchAll(); }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper noBottomTabs>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#32A6D8" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Cover + avatar */}
        <View style={styles.profileSection}>
          <Image
            source={coverImage ? { uri: coverImage } : DogImage}
            style={styles.coverImage}
          />
          <View style={styles.profileImageWrapper}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={{ width: 103, height: 103, borderRadius: 51.5 }} />
              ) : (
                <Image source={ProfileImagePersonIcon} style={{ width: 103, height: 103, borderRadius: 51.5 }} resizeMode="cover" />
              )}
            </View>
          </View>
        </View>

        {/* Profile info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>

          {isApproved && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={17} color="#00B100" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FBBC04" />
              <Text style={styles.statText}>
                {rating != null ? `${Number(rating).toFixed(1)} (${reviewCount} review${reviewCount === 1 ? '' : 's'})` : 'No reviews yet'}
              </Text>
            </View>
            {repeatClients != null && (
              <View style={styles.statItem}>
                <Icon name="people" size={16} color="#32A6D8" />
                <Text style={styles.statText}>{repeatClients} repeat client{repeatClients === 1 ? '' : 's'}</Text>
              </View>
            )}
          </View>

          {(businessTitle || cityState) && (
            <View style={styles.statsRow}>
              {!!businessTitle && (
                <View style={styles.statItem}>
                  <Icon name="briefcase" size={14} color="#32A6D8" />
                  <Text style={styles.statTextGray} numberOfLines={1}>{businessTitle}</Text>
                </View>
              )}
              {!!cityState && (
                <View style={styles.statItem}>
                  <Icon name="location" size={14} color="#32A6D8" />
                  <Text style={styles.statTextGray} numberOfLines={1}>{cityState}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['info', 'services', 'review'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.activeTab]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
                {t === 'info' ? 'Info' : t === 'services' ? 'Services' : 'Reviews'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <View style={styles.contentContainer}>
            {/* About */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              {aboutText ? (
                <Text style={styles.cardDescription}>{aboutText}</Text>
              ) : (
                <Text style={styles.cardSubtitle}>You haven't added an about section yet.</Text>
              )}
            </View>

            {/* Skills */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skills</Text>
              {Array.isArray(sitter.skills) && sitter.skills.length > 0 ? (
                <View style={styles.listContainer}>
                  {sitter.skills.map((skill, i) => (
                    <View key={`${skill}-${i}`} style={styles.listItem}>
                      <Icon name="checkmark-circle" size={20} color="#32A6D8" />
                      <Text style={styles.listText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.cardSubtitle}>No skills added yet.</Text>
              )}
            </View>

            {/* Home */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Home</Text>
              <View style={styles.listContainer}>
                {sitter.homeType && (
                  <View style={styles.listItem}>
                    <Icon name="home" size={20} color="#32A6D8" />
                    <Text style={styles.listText}>Resides in {sitter.homeType.toLowerCase().includes('apartment') ? 'an apartment' : `a ${sitter.homeType.toLowerCase()}`}</Text>
                  </View>
                )}
                {sitter.yardType && (
                  <View style={styles.listItem}>
                    <Icon name={String(sitter.yardType).toLowerCase() === 'none' ? 'close-circle' : 'checkmark-circle'} size={20} color="#32A6D8" />
                    <Text style={styles.listText}>
                      {String(sitter.yardType).toLowerCase() === 'none' ? 'No yard available' : `${sitter.yardType} yard`}
                    </Text>
                  </View>
                )}
                {sitter.smokingPolicy && (
                  <View style={styles.listItem}>
                    <Icon
                      name={/non[- ]?smoker|no smoking/i.test(sitter.smokingPolicy) ? 'close-circle' : 'checkmark-circle'}
                      size={20}
                      color="#32A6D8"
                    />
                    <Text style={styles.listText}>{sitter.smokingPolicy}</Text>
                  </View>
                )}
                {Array.isArray(sitter.petsInHome) && sitter.petsInHome.length > 0 && (
                  <View style={styles.listItem}>
                    <Icon name="paw" size={20} color="#32A6D8" />
                    <Text style={styles.listText}>
                      Pets at home: {sitter.petsInHome.join(', ')}
                    </Text>
                  </View>
                )}
                <View style={styles.listItem}>
                  <Icon name={sitter.childrenInHome ? 'checkmark-circle' : 'close-circle'} size={20} color="#32A6D8" />
                  <Text style={styles.listText}>
                    {sitter.childrenInHome ? 'Children live in the home' : 'No children in the home'}
                  </Text>
                </View>
                {Array.isArray(sitter.petRestrictions) && sitter.petRestrictions.length > 0 && (
                  <View style={styles.listItem}>
                    <Icon name="alert-circle" size={20} color="#32A6D8" />
                    <Text style={styles.listText}>{sitter.petRestrictions.flat().join(' · ')}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Location */}
            {(cityState || sitter.address) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Location</Text>
                <View style={styles.listContainer}>
                  <View style={styles.listItem}>
                    <Icon name="location" size={20} color="#FFC2EB" />
                    <Text style={styles.listText}>
                      {[sitter.address, cityState].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Pets the sitter owns */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Pets</Text>
              {pets.length === 0 ? (
                <Text style={styles.cardSubtitle}>You haven't added any of your own pets yet.</Text>
              ) : (
                pets.map((p) => (
                  <View key={p.id} style={styles.petItem}>
                    <Image
                      source={p.photoUrl ? { uri: p.photoUrl } : DogImage}
                      style={styles.petAvatar}
                    />
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{p.name}</Text>
                      <Text style={styles.petDetails}>
                        {[p.breed || p.type, p.weight ? `${p.weight} kg` : null, formatPetAge(p.ageYears, p.ageMonths)]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <View style={styles.contentContainer}>
            {(() => {
              const services = sitter.services || {};
              const offered = Object.entries(services).filter(
                ([, cfg]) => cfg?.isOffered !== false && cfg?.isCompleted !== false
              );
              if (offered.length === 0) {
                return (
                  <View style={styles.card}>
                    <Text style={styles.cardSubtitle}>No services configured yet.</Text>
                  </View>
                );
              }
              return offered.map(([type, cfg]) => {
                const meta = SERVICE_META[type] || { label: type, icon: 'pricetag-outline' };
                return (
                  <View key={type} style={styles.card}>
                    <View style={styles.serviceHeader}>
                      <Icon name={meta.icon} size={18} color="#32A6D8" />
                      <Text style={styles.cardTitle}>{meta.label}</Text>
                    </View>
                    <View style={styles.serviceRow}>
                      <Text style={styles.serviceLabel}>Base rate</Text>
                      <Text style={styles.serviceValue}>
                        {cfg.baseRate ? `${Number(cfg.baseRate).toLocaleString()} coins` : '—'}
                      </Text>
                    </View>
                    {Array.isArray(cfg.selectedDays) && cfg.selectedDays.length > 0 && (
                      <View style={styles.serviceRow}>
                        <Text style={styles.serviceLabel}>Days</Text>
                        <Text style={styles.serviceValue}>{cfg.selectedDays.join(', ')}</Text>
                      </View>
                    )}
                    {cfg.timeSlots?.start && cfg.timeSlots?.end && (
                      <View style={styles.serviceRow}>
                        <Text style={styles.serviceLabel}>Hours</Text>
                        <Text style={styles.serviceValue}>{cfg.timeSlots.start} – {cfg.timeSlots.end}</Text>
                      </View>
                    )}
                  </View>
                );
              });
            })()}
          </View>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'review' && (
          <View style={styles.contentContainer}>
            {reviews.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardSubtitle}>No reviews yet. Reviews appear here after you complete bookings.</Text>
              </View>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.card}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={r.user?.avatarUrl ? { uri: r.user.avatarUrl } : ProfileImagePersonIcon}
                      style={styles.reviewAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{r.user?.fullName || 'Anonymous'}</Text>
                      <Text style={styles.reviewDate}>{formatReviewDate(r.createdAt)}</Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Icon name="star" size={14} color="#FBBC04" />
                      <Text style={styles.reviewRatingText}>{r.rating}</Text>
                    </View>
                  </View>
                  {!!r.comment && <Text style={styles.cardDescription}>{r.comment}</Text>}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  dimText: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std', marginTop: 8 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#32A6D8',
    borderRadius: 999,
  },
  retryText: { color: '#FFFFFF', fontFamily: 'Avenir LT Std', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500', lineHeight: 24.8 },
  placeholder: { width: 40 },

  profileSection: { height: 233, marginHorizontal: 24, marginTop: 8, position: 'relative' },
  coverImage: { width: '100%', height: 182, borderRadius: 20 },
  profileImageWrapper: { position: 'absolute', bottom: 0, left: '50%', marginLeft: -51.5 },
  profileImageContainer: {
    width: 103,
    height: 103,
    borderRadius: 78,
    borderWidth: 6,
    borderColor: 'white',
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInfo: { alignItems: 'center', gap: 14, marginTop: 16, paddingHorizontal: 24 },
  profileName: {
    color: '#0D0D12', fontSize: 22, fontFamily: 'Poppins', fontWeight: '500', textAlign: 'center',
  },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: { color: 'black', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '600' },

  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  statText: { color: 'black', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  statTextGray: { color: '#818898', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '600' },

  tabContainer: { flexDirection: 'row', marginHorizontal: 24, marginTop: 16, marginBottom: 13, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(203, 203, 203, 0.15)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: { backgroundColor: 'rgba(255, 194, 235, 0.15)', borderColor: '#FFC2EB' },
  tabText: { color: '#666D80', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  activeTabText: { color: '#32A6D8' },

  contentContainer: { paddingHorizontal: 24, paddingBottom: 30, gap: 13 },
  card: {
    padding: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    borderRadius: 14,
    gap: 10,
  },
  cardTitle: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600' },
  cardSubtitle: { color: '#818898', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '500', lineHeight: 18 },
  cardDescription: { color: '#4B5563', fontSize: 13, fontFamily: 'Avenir LT Std', lineHeight: 19 },

  listContainer: { gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1, color: '#4B5563', fontSize: 13, fontFamily: 'Avenir LT Std', lineHeight: 19 },

  petItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  petAvatar: { width: 40, height: 40, borderRadius: 20 },
  petInfo: { flex: 1, gap: 2 },
  petName: { color: '#0D0D12', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600' },
  petDetails: { color: '#818898', fontSize: 12, fontFamily: 'Avenir LT Std' },

  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceLabel: { color: '#818898', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '500' },
  serviceValue: { color: '#0D0D12', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '600' },

  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19 },
  reviewName: { color: '#0D0D12', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600' },
  reviewDate: { color: '#818898', fontSize: 11, fontFamily: 'Avenir LT Std' },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reviewRatingText: { color: '#0D0D12', fontSize: 12, fontFamily: 'Avenir LT Std', fontWeight: '700' },
});

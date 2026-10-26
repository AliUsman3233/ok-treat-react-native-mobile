import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { useAppAlert } from '../../context/AlertContext';
import { getPublicMissingReport, reportPetSighting } from '../../services/petService';

const DEFAULT_PET_IMAGE = require('../../assets/images/Pet_default_image.png');

// Postgres NUMERIC/DECIMAL columns serialize to JSON as strings, so a
// coordinate can arrive as "37.7749". Number.isFinite rejects those, and the
// map, marker, Directions button and distance row all disappear with no error
// — on the one screen whose job is to say where the pet was last seen. Coerce
// first and treat anything unparseable as absent.
const toNum = (value) => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
};

// Defined at module scope on purpose: a component declared inside the screen
// body is a brand-new type on every render, so React remounts it each time.
const Header = ({ title, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <BackArrowIcon width={20} height={20} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.placeholder} />
  </View>
);

export default function NearbyMissingPetScreen({ navigation, route }) {
  const alert = useAppAlert();
  const { petId, distanceKm } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notMissing, setNotMissing] = useState(false);
  const [data, setData] = useState(null); // { pet, report, owner }
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!petId) {
      setError('Missing pet reference.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setNotMissing(false);
      const res = await getPublicMissingReport(petId);
      setData(res?.data || null);
    } catch (e) {
      // Owner marked the pet safe / report resolved between the alert and now.
      if (e?.reason === 'NOT_MISSING') {
        setNotMissing(true);
      } else {
        setError(e?.message || 'Could not load this missing-pet report.');
      }
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  const pet = data?.pet;
  const report = data?.report;
  const owner = data?.owner;
  const lat = toNum(report?.lastSeenLat);
  const lng = toNum(report?.lastSeenLng);
  const hasCoords = lat !== null && lng !== null;

  const handleCall = () => {
    const phone = report?.contactPhone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert('Unable to call', 'Could not open the dialer on this device.', 'error');
    });
  };

  const handleMessage = () => {
    if (!owner?.id) return;
    navigation.navigate('ChatConversation', {
      otherUserId: owner.id,
      chatName: owner.name || 'Owner',
    });
  };

  const handleDirections = () => {
    if (!hasCoords) return;
    const latLng = `${lat},${lng}`;
    const label = pet?.name ? `${pet.name} — last seen` : 'Last seen';
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(label)}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${encodeURIComponent(label)})`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps?q=${latLng}`).catch(() => {});
    });
  };

  const submitSighting = async () => {
    try {
      setSending(true);
      // Best-effort: attach the finder's current location so the owner knows
      // where the pet was spotted. If permission is denied, still send.
      let coords = {};
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        }
      } catch (_) { /* location is optional */ }

      await reportPetSighting(petId, coords);
      alert(
        'Owner notified',
        `Thank you! ${owner?.name || 'The owner'} has been notified that ${pet?.name || 'their pet'} may have been spotted.`,
        'success'
      );
    } catch (e) {
      alert('Could not send', e?.message || 'Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleFound = () => {
    Alert.alert(
      `Report seeing ${pet?.name || 'this pet'}?`,
      "We'll notify the owner and share your current location so they can coordinate the return.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Notify owner', onPress: submitSighting },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <Header title="Missing Pet" onBack={() => navigation.goBack()} />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (notMissing) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <Header title="Missing Pet" onBack={() => navigation.goBack()} />
          <View style={styles.centerContainer}>
            <Icon name="checkmark-circle" size={48} color="#1E9E5A" />
            <Text style={styles.stateTitle}>Good news!</Text>
            <Text style={styles.stateText}>
              This pet is no longer reported missing — the owner has marked it safe.
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !pet || !report) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <Header title="Missing Pet" onBack={() => navigation.goBack()} />
          <View style={styles.centerContainer}>
            <Text style={styles.stateText}>{error || 'Report not available.'}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const breed = pet.breed || pet.type || '';
  // distanceKm arrives as a string from an FCM data payload (all FCM data
  // values are strings) and from the notification row's JSON.
  const distance = toNum(distanceKm);
  const distanceLabel = distance !== null ? `~${distance.toFixed(1)} km from you` : null;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <Header title="Missing Pet" onBack={() => navigation.goBack()} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Alert banner */}
          <View style={styles.urgencyCard}>
            <Icon name="alert-circle" size={20} color="#D93025" />
            <Text style={styles.urgencyText}>
              {pet.name} is missing. If you see this pet, help get them home safely.
            </Text>
          </View>

          {/* Pet summary */}
          <View style={styles.petRow}>
            <Image
              source={pet.photoUrl ? { uri: pet.photoUrl } : DEFAULT_PET_IMAGE}
              style={styles.petImage}
              resizeMode="cover"
            />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              {!!breed && <Text style={styles.petBreed}>{breed}</Text>}
              {!!owner?.name && <Text style={styles.ownerText}>Owner: {owner.name}</Text>}
            </View>
          </View>

          {/* Last-seen details */}
          <Text style={styles.sectionLabel}>Last seen</Text>
          <View style={styles.infoCard}>
            {!!report.lastSeenAddress && (
              <View style={styles.infoRow}>
                <Icon name="location-outline" size={18} color="#32A6D8" />
                <Text style={styles.infoText}>{report.lastSeenAddress}</Text>
              </View>
            )}
            {!!report.lastSeenAt && (
              <View style={styles.infoRow}>
                <Icon name="time-outline" size={18} color="#32A6D8" />
                <Text style={styles.infoText}>{formatDateTime(report.lastSeenAt)}</Text>
              </View>
            )}
            {!!distanceLabel && (
              <View style={styles.infoRow}>
                <Icon name="navigate-outline" size={18} color="#32A6D8" />
                <Text style={styles.infoText}>{distanceLabel}</Text>
              </View>
            )}
          </View>

          {/* Map */}
          {hasCoords && (
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                pointerEvents="none"
                initialRegion={{
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker coordinate={{ latitude: lat, longitude: lng }} title={`${pet.name} — last seen`} />
              </MapView>
              <TouchableOpacity style={styles.directionsBtn} onPress={handleDirections}>
                <Icon name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notes */}
          {!!report.notes && (
            <>
              <Text style={styles.sectionLabel}>Notes from the owner</Text>
              <View style={styles.infoCard}>
                <Text style={styles.notesText}>{report.notes}</Text>
              </View>
            </>
          )}

          {/* Primary action — I found this pet */}
          <TouchableOpacity
            style={[styles.foundButton, sending && styles.disabled]}
            onPress={handleFound}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="paw" size={18} color="#FFFFFF" />
                <Text style={styles.foundText}>I found this pet</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Contact owner */}
          <View style={styles.contactRow}>
            {!!report.contactPhone && (
              <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
                <Icon name="call" size={18} color="#32A6D8" />
                <Text style={styles.contactText}>Call owner</Text>
              </TouchableOpacity>
            )}
            {!!owner?.id && (
              <TouchableOpacity style={styles.contactBtn} onPress={handleMessage}>
                <Icon name="chatbubble-ellipses" size={18} color="#32A6D8" />
                <Text style={styles.contactText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#0D0D12', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500' },
  placeholder: { width: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 10 },
  stateTitle: { color: '#0D0D12', fontSize: 18, fontFamily: 'Poppins', fontWeight: '600', marginTop: 6 },
  stateText: { color: '#4B5563', fontSize: 13, fontFamily: 'Avenir LT Std', textAlign: 'center', lineHeight: 19 },
  retryText: { color: '#32A6D8', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600', marginTop: 10 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  urgencyCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#FFF1EC',
    borderColor: '#FFD4C2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  urgencyText: { flex: 1, color: '#4B5563', fontSize: 12, fontFamily: 'Avenir LT Std', lineHeight: 17 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  petImage: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#F0F0F0' },
  petInfo: { flex: 1, gap: 3 },
  petName: { color: '#32A6D8', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600' },
  petBreed: { color: '#818898', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  ownerText: { color: '#0D0D12', fontSize: 13, fontFamily: 'Avenir LT Std' },
  sectionLabel: { color: '#0D0D12', fontSize: 13, fontFamily: 'Poppins', fontWeight: '500', marginTop: 18, marginBottom: 8 },
  infoCard: { backgroundColor: '#F6F8FA', borderRadius: 12, padding: 12, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, color: '#0D0D12', fontSize: 13, fontFamily: 'Avenir LT Std' },
  notesText: { color: '#0D0D12', fontSize: 13, fontFamily: 'Avenir LT Std', lineHeight: 19 },
  mapWrap: {
    marginTop: 16,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: { ...StyleSheet.absoluteFillObject },
  directionsBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#32A6D8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  directionsText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins', fontWeight: '600' },
  foundButton: {
    marginTop: 24,
    backgroundColor: '#1E9E5A',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  foundText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600' },
  disabled: { opacity: 0.6 },
  contactRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    paddingVertical: 13,
  },
  contactText: { color: '#32A6D8', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600' },
});

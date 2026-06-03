import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, ProfileImagePersonIcon, DogImage } from '../../assets';
import { useAppAlert } from '../../context/AlertContext';
import { cancelBooking } from '../../services/bookingService';
import api from '../../config/api';

const SERVICE_META = {
  PET_WALKING:    { label: 'Pet Walking',   icon: 'walk-outline' },
  BOARDING:       { label: 'Boarding',      icon: 'bed-outline' },
  HOUSE_SITTING:  { label: 'House Sitting', icon: 'home-outline' },
  DROP_IN_VISITS: { label: 'Drop-in Visit', icon: 'hand-right-outline' },
  DAY_CARE:       { label: 'Day Care',      icon: 'sunny-outline' },
};

const STATUS_META = {
  PENDING:   { label: 'Pending',   bg: '#FFF3D6', fg: '#B07B0B' },
  CONFIRMED: { label: 'Confirmed', bg: '#D9F3E4', fg: '#137A45' },
  ONGOING:   { label: 'Ongoing',   bg: '#D7ECFA', fg: '#1E6FA4' },
  COMPLETED: { label: 'Completed', bg: '#E5E7EB', fg: '#4B5563' },
  DECLINED:  { label: 'Declined',  bg: '#FBE0DE', fg: '#A8221A' },
  CANCELLED: { label: 'Cancelled', bg: '#E5E7EB', fg: '#6B7280' },
};

const formatDate = (iso, withTime = false) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(
    'en-US',
    withTime
      ? { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
  );
};

const formatRange = (start, end) => {
  if (!start) return '—';
  if (!end) return formatDate(start);
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) {
    return `${formatDate(start)} · ${s.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${e.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `${formatDate(start)} → ${formatDate(end)}`;
};

export default function BookingDetailScreen({ navigation, route }) {
  const alert = useAppAlert();
  // Caller can pass either the full booking object OR just the id. Loader
  // refreshes from the API on focus so any in-flight status changes show up.
  const seed = route?.params?.booking || null;
  const bookingId = route?.params?.bookingId || seed?.id || null;

  const [booking, setBooking] = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [actionInFlight, setActionInFlight] = useState(false);

  const fetchOne = useCallback(async () => {
    if (!bookingId) return;
    try {
      // No single-booking endpoint exists yet — pull the list and find it.
      const res = await api.get('/bookings');
      const list = res.data?.data?.bookings || res.data?.bookings || [];
      const found = (Array.isArray(list) ? list : []).find((b) => b.id === bookingId);
      if (found) setBooking(found);
    } catch (e) {
      console.warn('Failed to refresh booking:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      fetchOne();
    }, [fetchOne])
  );

  const handleCancel = () => {
    // Use RN's native Alert.alert for confirmation — the app's useAppAlert()
    // only supports a single button, and passing a buttons array there crashes
    // the ProfileVerifiedModal renderer.
    Alert.alert(
      'Cancel this booking?',
      'The sitter will be notified and any held coins will be returned to your wallet.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionInFlight(true);
              await cancelBooking(booking.id);
              alert('Cancelled', 'Your booking has been cancelled.', 'success');
              navigation.goBack();
            } catch (e) {
              alert('Could not cancel', e?.message || 'Try again in a moment.', 'error');
            } finally {
              setActionInFlight(false);
            }
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    const otherUserId = booking?.sitter?.user?.id || booking?.sitter?.userId;
    if (!otherUserId) {
      alert('Unavailable', 'Sitter contact not available for this booking yet.', 'error');
      return;
    }
    navigation.navigate('ChatConversation', {
      otherUserId,
      chatName: booking?.sitter?.user?.fullName || 'Sitter',
    });
  };

  const handleCall = () => {
    const phone = booking?.sitter?.user?.phone || booking?.sitter?.phone;
    if (!phone) {
      alert('No phone on file', 'This sitter hasn\'t shared a phone number.', 'info');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert('Could not place call', 'Tap and hold the number to copy it.', 'error');
    });
  };

  const handleLeaveReview = () => {
    navigation.navigate('SubmitReview', {
      bookingId: booking.id,
      sitterId: booking.sitterId,
      sitterName: booking.sitter?.user?.fullName,
    });
  };

  // ─── Loading / not-found ────────────────────────────────────────────────
  if (loading && !booking) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#32A6D8" />
        </View>
      </ScreenWrapper>
    );
  }

  if (!booking) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <Header onBack={() => navigation.goBack()} title="Booking" />
          <View style={[styles.centered, { flex: 1 }]}>
            <Icon name="alert-circle-outline" size={48} color="#818898" />
            <Text style={styles.dimText}>Booking not found.</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const status = String(booking.status || 'PENDING').toUpperCase();
  const statusMeta = STATUS_META[status] || STATUS_META.PENDING;
  const serviceMeta = SERVICE_META[booking.serviceType] || { label: booking.serviceType, icon: 'pricetag-outline' };
  const sitterName = booking.sitter?.user?.fullName || 'Sitter';
  const sitterAvatar = booking.sitter?.user?.avatarUrl;
  const petName = booking.pet?.name;
  const petType = booking.pet?.type || booking.pet?.petType;
  const petPhoto = booking.pet?.photoUrl;
  const amount = Math.round(booking.totalAmount || 0);
  const refundable = (booking.holdPurchased || 0) + (booking.holdEarned || 0);

  // Allowed actions vary by status (owner view; sitter side handled elsewhere)
  const canCancel = ['PENDING', 'CONFIRMED'].includes(status);
  const canContact = ['PENDING', 'CONFIRMED', 'ONGOING'].includes(status);
  const canReview = status === 'COMPLETED';

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <Header onBack={() => navigation.goBack()} title="Booking Details" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Status + service strip */}
          <View style={styles.headerCard}>
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconWrap}>
                <Icon name={serviceMeta.icon} size={20} color="#32A6D8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceLabel}>{serviceMeta.label}</Text>
                <Text style={styles.bookingIdText}>#{booking.id.slice(0, 8)}***{booking.id.slice(-4)}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
                <Text style={[styles.statusPillText, { color: statusMeta.fg }]}>{statusMeta.label}</Text>
              </View>
            </View>
          </View>

          {/* Sitter card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sitter</Text>
            <View style={styles.sitterRow}>
              {sitterAvatar ? (
                <Image source={{ uri: sitterAvatar }} style={styles.avatarLg} />
              ) : (
                <Image source={ProfileImagePersonIcon} style={styles.avatarLg} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sitterName}>{sitterName}</Text>
                {booking.sitter?.user?.email && (
                  <Text style={styles.dimSm} numberOfLines={1}>{booking.sitter.user.email}</Text>
                )}
              </View>
            </View>
            {canContact && (
              <View style={styles.contactRow}>
                <TouchableOpacity style={[styles.iconBtn, styles.iconBtnPrimary]} onPress={handleMessage}>
                  <Icon name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                  <Text style={styles.iconBtnText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, styles.iconBtnSecondary]} onPress={handleCall}>
                  <Icon name="call" size={18} color="#32A6D8" />
                  <Text style={[styles.iconBtnText, { color: '#32A6D8' }]}>Call</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Pet card */}
          {petName && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pet</Text>
              <View style={styles.petRow}>
                <Image
                  source={petPhoto ? { uri: petPhoto } : DogImage}
                  style={styles.petAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.petName}>{petName}</Text>
                  {(petType || booking.pet?.breed) && (
                    <Text style={styles.dimSm}>
                      {[petType, booking.pet?.breed].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Schedule */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule</Text>
            <DetailRow icon="calendar-outline" label="Dates" value={formatRange(booking.startDate, booking.endDate)} />
            {booking.createdAt && (
              <DetailRow icon="time-outline" label="Booked" value={formatDate(booking.createdAt, true)} />
            )}
          </View>

          {/* Payment */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total</Text>
              <View style={styles.amountValueRow}>
                <Icon name="logo-bitcoin" size={16} color="#32A6D8" />
                <Text style={styles.amountValue}>{amount.toLocaleString()} coins</Text>
              </View>
            </View>
            {refundable > 0 && ['PENDING', 'CONFIRMED'].includes(status) && (
              <Text style={styles.dimSm}>
                {refundable.toLocaleString()} coins are held — they'll return to your wallet if the booking is cancelled or declined.
              </Text>
            )}
          </View>

          {/* Notes */}
          {!!booking.notes && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsCol}>
            {canReview && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={handleLeaveReview}
              >
                <Icon name="star" size={18} color="#FFFFFF" />
                <Text style={styles.actionPrimaryText}>Leave a review</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionDanger, actionInFlight && styles.actionDisabled]}
                onPress={handleCancel}
                disabled={actionInFlight}
              >
                {actionInFlight ? (
                  <ActivityIndicator color="#D93025" />
                ) : (
                  <>
                    <Icon name="close-circle" size={18} color="#D93025" />
                    <Text style={styles.actionDangerText}>Cancel booking</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

// ─── Small subcomponents ──────────────────────────────────────────────────
const Header = ({ onBack, title }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <BackArrowIcon width={20} height={20} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.placeholder} />
  </View>
);

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={16} color="#818898" />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  dimText: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std' },
  dimSm: { color: '#818898', fontSize: 12, fontFamily: 'Avenir LT Std' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500' },
  placeholder: { width: 40 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },

  headerCard: {
    backgroundColor: '#F6F8FA',
    borderRadius: 14,
    padding: 14,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF6FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600' },
  bookingIdText: { color: '#818898', fontSize: 11, fontFamily: 'Avenir LT Std', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontFamily: 'Avenir LT Std', fontWeight: '700', letterSpacing: 0.3 },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: { color: '#0D0D12', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600' },

  sitterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarLg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6' },
  sitterName: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' },

  contactRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
  iconBtnPrimary: { backgroundColor: '#32A6D8' },
  iconBtnSecondary: { borderWidth: 1, borderColor: '#32A6D8', backgroundColor: '#FFFFFF' },
  iconBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '700' },

  petRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  petAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6' },
  petName: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
    minWidth: 60,
  },
  detailValue: {
    flex: 1,
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'right',
  },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { color: '#818898', fontSize: 12, fontFamily: 'Avenir LT Std' },
  amountValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountValue: { color: '#0D0D12', fontSize: 18, fontFamily: 'Poppins', fontWeight: '700' },

  notesText: {
    color: '#4B5563',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    lineHeight: 19,
  },

  actionsCol: { gap: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  actionPrimary: { backgroundColor: '#FFC2EB' },
  actionPrimaryText: { color: '#0D0D12', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '700' },
  actionDanger: { borderWidth: 1, borderColor: '#D93025', backgroundColor: '#FFFFFF' },
  actionDangerText: { color: '#D93025', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '700' },
  actionDisabled: { opacity: 0.6 },
});

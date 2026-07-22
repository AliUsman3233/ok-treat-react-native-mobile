import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, StarIcon, CoinIcon, DogImage, ChatIcon } from '../../../assets';
import Icon from '@expo/vector-icons/Ionicons';
import { getSitterBookings } from '../../../services/bookingService';

// Enum → human label for the service type.
const SERVICE_LABELS = {
  BOARDING: 'Boarding',
  HOUSE_SITTING: 'House Sitting',
  DROP_IN_VISITS: 'Drop-In Visit',
  DAY_CARE: 'Day Care',
  PET_WALKING: 'Pet Walking',
};
const humanizeService = (t) => SERVICE_LABELS[t] || t || '';

// Helper to derive status style
const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'UPCOMING':
      return { color: '#DCF5E5', textColor: '#2E9E5B', label: 'Confirmed', category: 'Upcoming' };
    case 'IN_PROGRESS':
    case 'ONGOING':
      return { color: '#E3F0FB', textColor: '#3A8DCC', label: 'Ongoing', category: 'Upcoming' };
    case 'COMPLETED':
      return { color: '#ECF5EA', textColor: '#219A27', label: 'Completed', category: 'Completed' };
    case 'CANCELLED':
      return { color: '#FFEBEE', textColor: '#D32F2F', label: 'Cancelled', category: 'Completed' };
    case 'DECLINED':
      return { color: '#FBE3E3', textColor: '#D06060', label: 'Declined', category: 'Completed' };
    case 'PENDING':
      return { color: '#FFF3D0', textColor: '#E5A33D', label: 'Pending', category: 'Upcoming' };
    default:
      return { color: '#F5F5F5', textColor: '#757575', label: status || 'Unknown', category: 'Upcoming' };
  }
};

export default function SitterBookingsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSitterBookings();
      // API shape: { success, data: { bookings: [...], total } }. Reach into
      // data.bookings; keep looser fallbacks in case the shape changes.
      const bookingsArray =
        response?.data?.bookings ||
        response?.bookings ||
        (Array.isArray(response?.data) ? response.data : null) ||
        (Array.isArray(response) ? response : []);

      setBookings(bookingsArray.map(booking => {
        const statusStyle = getStatusStyle(booking.status);
        const startDate = booking.startDate ? new Date(booking.startDate) : null;
        const endDate = booking.endDate ? new Date(booking.endDate) : null;

        const formatShortDate = (d) => {
          if (!d) return '';
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        };

        const formatDateTime = (start, end) => {
          if (!start) return '';
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const dateStr = `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
          const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const endTime = end ? end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
          return endTime ? `${dateStr} | ${startTime} - ${endTime}` : `${dateStr} | ${startTime}`;
        };

        // The client (booking owner) is returned under `user`.
        const client = booking.owner || booking.user || booking.client || {};
        const avatar = client.avatarUrl || client.profileImage;

        return {
          id: booking.id || booking._id,
          clientUserId: client.id || null,
          clientName: client.fullName || client.name || 'Client',
          clientImage: avatar ? { uri: avatar } : DogImage,
          petName: booking.pet?.name || '',
          serviceType: humanizeService(booking.serviceType || booking.service),
          date: formatShortDate(startDate),
          dateTime: formatDateTime(startDate, endDate),
          address: client.address || '',
          phone: client.phone || '',
          status: statusStyle.label,
          statusColor: statusStyle.color,
          statusTextColor: statusStyle.textColor,
          category: statusStyle.category,
          rating: booking.rating || null,
          coins: booking.totalAmount || booking.totalPrice || booking.coins || null,
        };
      }));
    } catch (err) {
      console.error('Failed to fetch sitter bookings:', err);
      setError(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const tabs = ['All', 'Upcoming', 'Completed'];

  const handleBack = () => {
    navigation.goBack();
  };

  // Filter bookings based on selected tab
  const getFilteredBookings = () => {
    if (selectedTab === 'All') {
      return bookings;
    }
    return bookings.filter(booking => booking.category === selectedTab);
  };

  const filteredBookings = getFilteredBookings();

  const renderBookingCard = (booking) => {
    const isUpcoming = booking.category === 'Upcoming';
    const isCompleted = booking.status === 'Completed';
    const hasMeta = booking.dateTime || booking.address || booking.petName || booking.phone ||
      (isCompleted && (booking.coins || booking.rating));

    return (
      <View key={booking.id} style={styles.card}>
        {/* Header row */}
        <View style={styles.cardTop}>
          <Image source={booking.clientImage} style={styles.avatar} />
          <View style={styles.cardHeadInfo}>
            <Text style={styles.clientName} numberOfLines={1}>{booking.clientName}</Text>
            <Text style={styles.serviceLine} numberOfLines={1}>
              {booking.serviceType}{booking.date ? ` · ${booking.date}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: booking.statusColor }]}>
            <Text style={[styles.statusText, { color: booking.statusTextColor }]}>
              {booking.status}
            </Text>
          </View>
        </View>

        {hasMeta && <View style={styles.cardDivider} />}

        {/* Meta + actions */}
        {hasMeta && (
          <View style={styles.cardBottom}>
            <View style={styles.metaColumn}>
              {!!booking.dateTime && (
                <View style={styles.metaRow}>
                  <Icon name="time-outline" size={15} color="#32A6D8" />
                  <Text style={styles.metaText} numberOfLines={1}>{booking.dateTime}</Text>
                </View>
              )}
              {!!booking.address && (
                <View style={styles.metaRow}>
                  <Icon name="location-outline" size={15} color="#32A6D8" />
                  <Text style={styles.metaText} numberOfLines={2}>{booking.address}</Text>
                </View>
              )}
              {!!booking.petName && (
                <View style={styles.metaRow}>
                  <Icon name="paw-outline" size={15} color="#32A6D8" />
                  <Text style={styles.metaText} numberOfLines={1}>{booking.petName}</Text>
                </View>
              )}
              {!!booking.phone && (
                <View style={styles.metaRow}>
                  <Icon name="call-outline" size={14} color="#32A6D8" />
                  <Text style={styles.metaText} numberOfLines={1}>{booking.phone}</Text>
                </View>
              )}
              {isCompleted && !!booking.coins && (
                <View style={styles.metaRow}>
                  <CoinIcon width={16} height={16} fill="#FBCE04" />
                  <Text style={styles.coinsText}>{booking.coins} Coins</Text>
                </View>
              )}
              {isCompleted && !!booking.rating && (
                <View style={styles.metaRow}>
                  <StarIcon width={14} height={14} fill="#FBBC04" />
                  <Text style={styles.metaText}>{booking.rating}</Text>
                </View>
              )}
            </View>

            {isUpcoming && (
              <TouchableOpacity
                style={[styles.chatButton, !booking.clientUserId && styles.chatButtonDisabled]}
                onPress={() => booking.clientUserId && navigation.navigate('ChatConversation', {
                  otherUserId: booking.clientUserId,
                  chatName: booking.clientName,
                })}
                disabled={!booking.clientUserId}
              >
                <ChatIcon width={20} height={20} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookings</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBackground}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && styles.activeTab,
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bookings List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredBookings.map(renderBookingCard)}
          </ScrollView>
        )}
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
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerPlaceholder: {
    width: 40,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  tabBackground: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#858585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#858585',
    lineHeight: 18.2,
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '500',
    color: '#45594B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#32A6D8',
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  emptyText: {
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 15,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 14,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
  },
  cardHeadInfo: {
    flex: 1,
  },
  clientName: {
    color: '#040404',
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21,
  },
  serviceLine: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 17,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 15.5,
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaColumn: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    color: '#5B6B7B',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 17,
  },
  coinsText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 17,
  },
  chatButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonDisabled: {
    opacity: 0.4,
  },
});

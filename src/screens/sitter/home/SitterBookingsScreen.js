import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import MapView, { Marker } from 'react-native-maps';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, StarIcon, CoinIcon, DogImage, LocationArrowCircleUnfilledIcon, PhoneCallBlueIcon, ChatIcon } from '../../../assets';
import Icon from '@expo/vector-icons/Ionicons';
import { getSitterBookings } from '../../../services/bookingService';

// Helper to derive status style
const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'UPCOMING':
      return { color: '#FFEED3', textColor: '#E5A33D', label: 'upcoming', category: 'Upcoming' };
    case 'IN_PROGRESS':
    case 'ONGOING':
      return { color: '#FFEED3', textColor: '#E5A33D', label: 'ongoing', category: 'Upcoming' };
    case 'COMPLETED':
      return { color: '#ECF5EA', textColor: '#219A27', label: 'Completed', category: 'Completed' };
    case 'CANCELLED':
      return { color: '#FFEBEE', textColor: '#D32F2F', label: 'Cancelled', category: 'Completed' };
    case 'PENDING':
      return { color: '#FFF3D0', textColor: '#E5A33D', label: 'Pending', category: 'Upcoming' };
    default:
      return { color: '#F5F5F5', textColor: '#757575', label: status || 'Unknown', category: 'Upcoming' };
  }
};

export default function SitterBookingsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('All');
  const [expandedBookings, setExpandedBookings] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSitterBookings();
      const data = response?.bookings || response?.data || response || [];
      const bookingsArray = Array.isArray(data) ? data : [];

      setBookings(bookingsArray.map(booking => {
        const statusStyle = getStatusStyle(booking.status);
        const startDate = booking.startDate ? new Date(booking.startDate) : null;
        const endDate = booking.endDate ? new Date(booking.endDate) : null;

        const formatShortDate = (d) => {
          if (!d) return '';
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[d.getMonth()]}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
        };

        const formatDateTime = (start, end) => {
          if (!start) return '';
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const dateStr = `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
          const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const endTime = end ? end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
          return endTime ? `${dateStr} | ${startTime}- ${endTime}` : `${dateStr} | ${startTime}`;
        };

        return {
          id: booking.id || booking._id,
          clientName: booking.client?.name || booking.clientName || booking.user?.name || 'Client',
          clientImage: booking.client?.profileImage || booking.clientImage ? { uri: booking.client?.profileImage || booking.clientImage } : DogImage,
          serviceType: booking.serviceType || booking.service || '',
          date: formatShortDate(startDate),
          dateTime: formatDateTime(startDate, endDate),
          address: booking.address || booking.client?.address || booking.location || '',
          phone: booking.client?.phone || booking.phone || '',
          latitude: booking.latitude || booking.location?.latitude || null,
          longitude: booking.longitude || booking.location?.longitude || null,
          status: statusStyle.label,
          statusColor: statusStyle.color,
          statusTextColor: statusStyle.textColor,
          category: statusStyle.category,
          rating: booking.rating || null,
          coins: booking.totalAmount || booking.coins || null,
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

  const toggleExpand = (bookingId) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
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
    const isExpanded = expandedBookings[booking.id];
    const isUpcoming = booking.status === 'upcoming';
    const showCollapsible = isUpcoming && selectedTab === 'Upcoming';

    // Render collapsible upcoming booking card (only in Upcoming tab)
    if (showCollapsible) {
      return (
        <View key={booking.id} style={styles.upcomingCard}>
          {/* Top Section */}
          <View style={styles.upcomingTopSection}>
            <Image source={booking.clientImage} style={styles.upcomingAvatar} />
            <View style={styles.upcomingInfo}>
              <Text style={styles.upcomingServiceType}>{booking.serviceType}</Text>
              <Text style={styles.upcomingClientName}>{booking.clientName}</Text>
            </View>
            <TouchableOpacity style={styles.upcomingChatButton}>
              <ChatIcon width={21.28} height={21.28} />
            </TouchableOpacity>
            <View style={[styles.upcomingStatusBadge, { backgroundColor: booking.statusColor }]}>
              <Text style={[styles.upcomingStatusText, { color: booking.statusTextColor }]}>
                {booking.status}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.upcomingDivider} />

          {/* Collapsed Info */}
          {!isExpanded && (
            <>
              <View style={styles.upcomingCollapsedInfo}>
                <View style={styles.upcomingInfoRow}>
                  <Text style={styles.upcomingLabel}>Date & Time</Text>
                  <Text style={styles.upcomingValue}>{booking.dateTime}</Text>
                </View>
                <View style={styles.upcomingInfoRow}>
                  <Text style={styles.upcomingLabel}>Location</Text>
                  <Text style={styles.upcomingValueLocation}>{booking.address}</Text>
                </View>
              </View>

              {/* Expand Button */}
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleExpand(booking.id)}
              >
                <Icon name="chevron-down" size={17.74} color="#212121" />
              </TouchableOpacity>
            </>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <>
              <View style={styles.upcomingExpandedInfo}>
                <View style={styles.upcomingInfoRow}>
                  <Text style={styles.upcomingLabel}>Date & Time</Text>
                  <Text style={styles.upcomingValue}>{booking.dateTime}</Text>
                </View>
                <View style={styles.upcomingInfoRow}>
                  <Text style={styles.upcomingLabel}>Location</Text>
                  <Text style={styles.upcomingValueLocation}>{booking.address}</Text>
                </View>
              </View>

              {/* Map Container */}
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: booking.latitude,
                    longitude: booking.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: booking.latitude,
                      longitude: booking.longitude,
                    }}
                    title={booking.serviceType}
                    description={booking.address}
                  />
                </MapView>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.receiptButton}>
                  <Text style={styles.receiptButtonText}>View E-Receipt</Text>
                </TouchableOpacity>
              </View>

              {/* Collapse Button */}
              <TouchableOpacity
                style={styles.collapseButton}
                onPress={() => toggleExpand(booking.id)}
              >
                <Icon name="chevron-up" size={17.74} color="#212121" />
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    }

    // Render compact card (for All tab and Completed bookings)
    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.cardContainer}>
          <View style={styles.topRow}>
            <Image source={booking.clientImage} style={styles.avatar} />
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{booking.clientName}</Text>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceType}>{booking.serviceType}</Text>
                <Text style={styles.separator}> - </Text>
                <Text style={styles.date}>{booking.date}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: booking.statusColor }]}>
            <Text style={[styles.statusText, { color: booking.statusTextColor }]}>
              {booking.status}
            </Text>
          </View>

          {booking.status === 'Completed' && booking.rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} width={15} height={15} fill="#FBBC04" />
                ))}
              </View>
              <Text style={styles.ratingValue}>{booking.rating}</Text>
            </View>
          )}

          <View style={styles.contactSection}>
            <View style={styles.contactItem}>
              <LocationArrowCircleUnfilledIcon width={20} height={20} />
              <Text style={styles.contactText}>{booking.address}</Text>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.phoneIconsWrapper}>
                <PhoneCallBlueIcon width={15} height={15} />
                <View style={styles.phoneCircle} />
              </View>
              <Text style={styles.contactText}>{booking.phone}</Text>
            </View>
          </View>

          {isUpcoming && (
            <TouchableOpacity style={styles.chatButton}>
              <ChatIcon width={21.05} height={21.05} />
            </TouchableOpacity>
          )}

          {booking.status === 'Completed' && booking.coins && (
            <View style={styles.coinsContainer}>
              <CoinIcon width={19} height={19} fill="#FBCE04" />
              <Text style={styles.coinsText}>{booking.coins} Coins</Text>
            </View>
          )}
        </View>
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
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    paddingHorizontal: 12,
    paddingVertical: 9.5,
    marginBottom: 15,
  },
  cardContainer: {
    width: '100%',
    height: 95,
    position: 'relative',
  },
  topRow: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 34,
    height: 33,
    borderRadius: 9999,
  },
  clientInfo: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  clientName: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0.5,
  },
  serviceType: {
    color: '#000000',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  separator: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  date: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  statusBadge: {
    position: 'absolute',
    right: 0,
    top: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
    textAlign: 'center',
  },
  ratingContainer: {
    position: 'absolute',
    right: 0,
    top: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  ratingValue: {
    color: '#000000',
    fontSize: 9.03,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 14,
    marginLeft: 3,
  },
  contactSection: {
    position: 'absolute',
    left: 4,
    top: 54,
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    color: '#8D8E90',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 14,
    width: 151,
  },
  phoneIconsWrapper: {
    width: 16,
    height: 16,
    marginLeft: 2,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCircle: {
    width: 18,
    height: 18,
    borderRadius: 9999,
    borderWidth: 1.2,
    borderColor: '#32A6D8',
    position: 'absolute',
  },
  coinsContainer: {
    position: 'absolute',
    right: 0,
    top: 69,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.84,
  },
  coinsText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  chatButton: {
    position: 'absolute',
    right: 10,
    top: 47,
    width: 49.11,
    height: 49.11,
    padding: 14.03,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 87.69,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Upcoming Card Styles
  upcomingCard: {
    padding: 17.74,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 20,
    marginBottom: 15,
    gap: 14.19,
  },
  upcomingTopSection: {
    height: 88.68, 
    position: 'relative',
  },
  upcomingAvatar: {
    width: 88,
    height: 94,
    position: 'absolute',
    left: 0.26,
    top: -5.74,
    borderRadius: 17.74,
  },
  upcomingInfo: {
    position: 'absolute',
    left: 102.87,
    top: 6.88,
    width: 134.8,
  },
  upcomingServiceType: {
    color: '#212121',
    fontSize: 16,
    fontFamily: 'Urbanist',
    fontWeight: '700',
    lineHeight: 19.2,
  },
  upcomingClientName: {
    color: '#616161',
    fontSize: 10.64,
    fontFamily: 'Urbanist',
    fontWeight: '500',
    letterSpacing: 0.18,
    marginTop: 10,
  },
  upcomingChatButton: {
    position: 'absolute',
    left: 251.86,
    top: 19.51,
    padding: 14.19,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 88.68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingStatusBadge: {
    position: 'absolute',
    left: 103.26,
    top: 59.26,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
  },
  upcomingStatusText: {
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
    textAlign: 'center',
  },
  upcomingDivider: {
    height: 0.89,
    backgroundColor: '#EEEEEE',
  },
  upcomingCollapsedInfo: {
    gap: 7.09,
  },
  upcomingExpandedInfo: {
    gap: 7.09,
  },
  upcomingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10.64,
  },
  upcomingLabel: {
    color: '#616161',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 16.8,
    letterSpacing: 0.18,
  },
  upcomingValue: {
    flex: 1,
    textAlign: 'right',
    color: '#424242',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
    letterSpacing: 0.18,
  },
  upcomingValueLocation: {
    width: 240,
    textAlign: 'right',
    color: '#424242',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
    letterSpacing: 0.18,
  },
  expandButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  collapseButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  mapContainer: {
    width: '100%',
    height: 192.44,
    borderRadius: 21.28,
    marginTop: 14.19,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  petAvatarContainer: {
    alignSelf: 'center',
    marginTop: 14.19,
  },
  petAvatar: {
    width: 28.38,
    height: 28.38,
    borderRadius: 886.84,
    borderWidth: 2.66,
    borderColor: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10.64,
    marginTop: 14.19,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    paddingHorizontal: 14.19,
    paddingVertical: 5.32,
    borderRadius: 88.68,
    borderWidth: 1.77,
    borderColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFC2EB',
    fontSize: 12.42,
    fontFamily: 'Urbanist',
    fontWeight: '600',
    lineHeight: 17.38,
    letterSpacing: 0.18,
    textAlign: 'center',
  },
  receiptButton: {
    flex: 1,
    height: 56,
    paddingHorizontal: 14.19,
    paddingVertical: 5.32,
    backgroundColor: '#FFC2EB',
    borderRadius: 88.68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptButtonText: {
    color: '#32A6D8',
    fontSize: 12.42,
    fontFamily: 'Urbanist',
    fontWeight: '600',
    lineHeight: 17.38,
    letterSpacing: 0.18,
    textAlign: 'center',
  },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, StarIcon, ShieldCheckIcon, CoinIcon } from '../../assets';
import { getUserBookings } from '../../services/bookingService';

// Helper to derive status colors
const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'UPCOMING':
      return { bg: '#E3F2FD', text: '#1976D2', label: 'Upcoming' };
    case 'IN_PROGRESS':
    case 'ONGOING':
      return { bg: '#FFF3D0', text: '#E5A33D', label: 'Ongoing' };
    case 'COMPLETED':
      return { bg: '#ECF5EA', text: '#219A27', label: 'Completed' };
    case 'CANCELLED':
      return { bg: '#FFEBEE', text: '#D32F2F', label: 'Cancelled' };
    case 'PENDING':
      return { bg: '#FFF3D0', text: '#E5A33D', label: 'Pending' };
    default:
      return { bg: '#F5F5F5', text: '#757575', label: status || 'Unknown' };
  }
};

// Helper to determine tab category from status
const getCategory = (status) => {
  const upper = status?.toUpperCase();
  if (['COMPLETED', 'CANCELLED'].includes(upper)) return 'Past';
  return 'Upcoming';
};

// Helper to format date range
const formatDateRange = (startDate, endDate) => {
  if (!startDate) return '';
  const options = { month: 'short', day: 'numeric' };
  const start = new Date(startDate).toLocaleDateString('en-US', options);
  if (!endDate) return start;
  const endOpts = { month: 'short', day: 'numeric', year: 'numeric' };
  const end = new Date(endDate).toLocaleDateString('en-US', endOpts);
  return `${start} to ${end}`;
};

export default function BookingsScreen({ navigation, route }) {
  // `initialTab` lets deep links from notifications/requests land on the right list
  // (e.g. BOOKING_COMPLETED notification → Past tab). `bookingId` is read by the
  // card-render to highlight the just-tapped booking briefly.
  const initialTab = route?.params?.initialTab;
  const highlightedBookingId = route?.params?.bookingId || null;

  const [selectedTab, setSelectedTab] = useState(
    ['All', 'Upcoming', 'Past'].includes(initialTab) ? initialTab : 'All'
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = ['All', 'Upcoming', 'Past'];

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const response = await getUserBookings();
      // Backend returns { success, data: { bookings: [...], total } }.
      // getUserBookings returns response.data (the whole body), so the array
      // we want is response.data.bookings. The old fallback chain matched
      // response.data (an object, not array) first and left the list empty.
      const list =
        response?.data?.bookings ||
        response?.bookings ||
        (Array.isArray(response) ? response : []);
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when the screen comes into focus so new bookings created
  // elsewhere (Contact Sitter, OpenRequests) appear without a manual reload.
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleReorder = (booking) => {
    navigation.navigate('ContactSitter', {
      sitter: booking.sitter || { id: booking.sitterId, name: booking.sitterName },
      service: booking.serviceType,
      dates: formatDateRange(booking.startDate, booking.endDate),
      pets: [],
    });
  };

  // Filter bookings based on selected tab
  const getFilteredBookings = () => {
    if (selectedTab === 'All') {
      return bookings;
    }
    return bookings.filter(booking => getCategory(booking.status) === selectedTab);
  };

  const filteredBookings = getFilteredBookings();

  const renderBookingCard = (booking) => {
    const statusStyle = getStatusStyle(booking.status);
    const sitterName = booking.sitter?.name || booking.sitterName || 'Sitter';
    const sitterImage = booking.sitter?.profileImage || booking.sitterImage || null;
    const serviceType = booking.serviceType || booking.service || '';
    const dateRange = formatDateRange(booking.startDate, booking.endDate);
    const rating = booking.sitter?.rating || booking.rating || 0;
    const reviews = booking.sitter?.reviewCount || booking.reviews || 0;
    const totalPayment = booking.totalAmount || booking.totalPayment || 0;

    const isHighlighted =
      highlightedBookingId && (booking.id === highlightedBookingId || booking._id === highlightedBookingId);

    return (
      <TouchableOpacity
        key={booking.id || booking._id}
        style={[styles.bookingCard, isHighlighted && styles.bookingCardHighlighted]}
        onPress={() => navigation.navigate('BookingDetail', { booking })}
        activeOpacity={0.7}
      >
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Left: Avatar and Info */}
          <View style={styles.leftSection}>
            <View style={styles.avatarContainer}>
              {sitterImage ? (
                <Image source={{ uri: sitterImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <View style={styles.verifiedBadge}>
                <ShieldCheckIcon width={10.5} height={11.67} fill="#32A6D8" />
              </View>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.sitterName}>{sitterName}</Text>
              <Text style={styles.serviceInfo}>
                <Text style={styles.serviceType}>{serviceType}</Text>
                <Text style={styles.separator}> - </Text>
                <Text style={styles.dateRange}>{dateRange}</Text>
              </Text>
            </View>
          </View>

          {/* Right: Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Middle Section: Rating and Reorder */}
        <View style={styles.middleSection}>
          <View style={styles.ratingContainer}>
            <StarIcon width={16} height={16} fill="#FBBC04" />
            <Text style={styles.ratingText}>{rating} ({reviews} reviews)</Text>
          </View>
          {statusStyle.label === 'Completed' && (
            <View style={styles.completedActions}>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => navigation.navigate('SubmitReview', {
                  booking,
                  sitter: booking.sitter,
                })}
              >
                <Text style={styles.reviewButtonText}>Leave Review</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => handleReorder(booking)}
              >
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Section: Total Payment */}
        <View style={styles.bottomSection}>
          <Text style={styles.paymentLabel}>Total Payment</Text>
          <View style={styles.paymentAmount}>
            <CoinIcon width={19} height={19} />
            <Text style={styles.coinsText}>{totalPayment} Coins</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsBackground}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && styles.tabActive
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Loading bookings...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
                <Text style={styles.retryText}>Retry</Text>
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#32A6D8"
                />
              }
            >
              {filteredBookings.map(renderBookingCard)}
            </ScrollView>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 9,
  },
  tabsBackground: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#858585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 3,
  },
  tabText: {
    textAlign: 'center',
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 18.2,
  },
  tabTextActive: {
    color: '#45594B',
  },
  contentContainer: {
    position: 'absolute',
    top: 136,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 7,
    paddingTop: 8,
    paddingBottom: 20,
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
  retryText: {
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
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 12,
    marginBottom: 7,
  },
  bookingCardHighlighted: {
    borderColor: '#32A6D8',
    borderWidth: 2,
    backgroundColor: '#F0F9FE',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 38,
    backgroundColor: '#E5E5E5',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -7,
    bottom: 0,
    width: 14,
    height: 14,
    backgroundColor: 'white',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    marginLeft: 15,
    flex: 1,
  },
  sitterName: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20.15,
  },
  serviceInfo: {
    marginTop: 2,
  },
  serviceType: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  separator: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  dateRange: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 15.5,
  },
  statusBadge: {
    // paddingHorizontal: 10,
    width: 70,
    paddingVertical: 4,
    borderRadius: 30,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  completedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
    backgroundColor: '#32A6D8',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  reorderButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#818898',
  },
  reorderText: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    color: '#858585',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 19.2,
  },
  paymentAmount: {
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
});

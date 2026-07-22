import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { DogImage, ChatIcon } from '../../../assets';
import Icon from '@expo/vector-icons/Ionicons';
import { getSitterEarnings, getSitterBookings, getSitterRequests } from '../../../services/bookingService';

// Enum → human label for the service type.
const SERVICE_LABELS = {
  BOARDING: 'Boarding',
  HOUSE_SITTING: 'House Sitting',
  DROP_IN_VISITS: 'Drop-In Visit',
  DAY_CARE: 'Day Care',
  PET_WALKING: 'Pet Walking',
};
const humanizeService = (t) => SERVICE_LABELS[t] || t || '';

export default function SitterHomeScreen({ navigation }) {
  const { user } = useSelector(state => state.auth);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const [chartData, setChartData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoadingEarnings(true);
      const response = await getSitterEarnings();
      const data = response?.data || response || {};

      // Backend returns dailyEarnings: [{ date, amount }] for the last 30
      // days. Plot the most recent 7 for the mini chart, labelled by weekday.
      const daily = Array.isArray(data.dailyEarnings) ? data.dailyEarnings : [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7 = daily.slice(-7);
      if (last7.length > 0) {
        setChartData(last7.map(d => ({
          month: dayNames[new Date(d.date).getDay()],
          value: d.amount || 0,
        })));
      } else {
        setChartData([0, 0, 0, 0, 0, 0, 0].map((v) => ({ month: '', value: v })));
      }

      // Values are coins (booking totalAmount). Show this month's earnings.
      setTotalSales(data?.thisMonthEarnings ?? 0);
      setCompletedOrders(data?.totalCompletedBookings ?? 0);
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
      // Set fallback data on error
      setChartData([
        { month: 'Jun', value: 0 },
        { month: 'Jul', value: 0 },
        { month: 'Aug', value: 0 },
        { month: 'Sep', value: 0 },
        { month: 'Oct', value: 0 },
        { month: 'Nov', value: 0 },
        { month: 'Dec', value: 0 },
      ]);
    } finally {
      setLoadingEarnings(false);
    }
  }, []);

  const fetchUpcomingBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const response = await getSitterBookings('CONFIRMED');
      const data = response?.data?.bookings || response?.bookings || response?.data || [];
      const bookingsArray = Array.isArray(data) ? data : [];

      setUpcomingBookings(bookingsArray.slice(0, 5).map(booking => {
        const client = booking.owner || booking.user || {};
        return {
          id: booking.id || booking._id,
          clientUserId: client.id || null,
          clientName: client.fullName || client.name || 'Client',
          clientImage: client.avatarUrl ? { uri: client.avatarUrl } : DogImage,
          serviceType: humanizeService(booking.serviceType),
          date: booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '',
          petName: booking.pet?.name || '',
          address: client.address || '',
          phone: client.phone || '',
          status: 'Upcoming',
        };
      }));
    } catch (err) {
      console.error('Failed to fetch upcoming bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await getSitterRequests();
      const requests = response?.data?.requests || [];
      setPendingCount(Array.isArray(requests) ? requests.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
    fetchUpcomingBookings();
    fetchPendingCount();
  }, [fetchEarnings, fetchUpcomingBookings, fetchPendingCount]);

  // Calculate chart dimensions
  const chartWidth = 235.6;
  const chartHeight = 80.67;
  const chartValues = chartData.map(d => d.value);
  const maxValue = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const minValue = chartValues.length > 0 ? Math.min(...chartValues) : 0;
  const valueRange = maxValue - minValue || 1;

  // Generate path for line chart
  const generatePath = () => {
    if (chartData.length < 2) {
      return { path: '', points: [{ x: 0, y: chartHeight / 2 }] };
    }
    const points = chartData.map((data, index) => {
      const x = (index / (chartData.length - 1)) * chartWidth;
      const y = chartHeight - ((data.value - minValue) / valueRange) * chartHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const cpx = (prevPoint.x + currentPoint.x) / 2;
      path += ` Q ${cpx} ${prevPoint.y}, ${currentPoint.x} ${currentPoint.y}`;
    }
    return { path, points };
  };

  // Generate polygon for gradient fill
  const generateFillPath = () => {
    if (chartData.length < 2) return `0,${chartHeight} 0,${chartHeight / 2} ${chartWidth},${chartHeight / 2} ${chartWidth},${chartHeight}`;
    const points = chartData.map((data, index) => {
      const x = (index / (chartData.length - 1)) * chartWidth;
      const y = chartHeight - ((data.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    });
    return `0,${chartHeight} ${points.join(' ')} ${chartWidth},${chartHeight}`;
  };

  const { path, points } = generatePath();
  const fillPoints = generateFillPath();
  const lastPoint = points[points.length - 1];

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={user?.avatarUrl ? { uri: user.avatarUrl } : DogImage} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{user?.fullName || 'Sitter'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="notifications-outline" size={24.55} color="#212121" />
          </TouchableOpacity>
        </View>

        {/* Overview Card */}
        <View style={styles.overviewCard}>
          {/* Overview Header */}
          <View style={styles.overviewHeader}>
            <View style={styles.overviewIconContainer}>
              <Icon name="bar-chart-outline" size={21.05} color="#FFFFFF" />
            </View>
            <Text style={styles.overviewTitle}>Overview</Text>
          </View>

          {/* Chart Area */}
          {loadingEarnings ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="small" color="#32A6D8" />
            </View>
          ) : (
            <View style={styles.chartContainer}>
              {/* Grid Lines */}
              <View style={styles.gridLines}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              {/* SVG Chart */}
              <View style={styles.svgContainer}>
                <Svg width={chartWidth} height={chartHeight}>
                  <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="rgba(34, 128, 255, 0.5)" stopOpacity="1" />
                      <Stop offset="1" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>

                  {/* Gradient Fill */}
                  <Polygon
                    points={fillPoints}
                    fill="url(#gradient)"
                  />

                  {/* Line */}
                  {path ? (
                    <Path
                      d={path}
                      stroke="#32A6D8"
                      strokeWidth="2.63"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}

                  {/* End Point Dot */}
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r="5.16"
                    fill="#FFC2EB"
                    stroke="#FFFFFF"
                    strokeWidth="3.51"
                  />
                </Svg>
              </View>

              {/* Month Labels */}
              <View style={styles.monthLabels}>
                {chartData.map((data, index) => (
                  <Text key={index} style={styles.monthLabel}>{data.month}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.statsDivider} />

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This month's earnings</Text>
              <View style={styles.statValueRow}>
                <Icon name="server-outline" size={13} color="#FBCE04" />
                <Text style={styles.statValue}>{Number(totalSales || 0).toLocaleString()} coins</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completed Orders</Text>
              <Text style={styles.statValue}>{completedOrders}</Text>
            </View>
          </View>
        </View>

        {/* Pending Requests Banner */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('SitterRequests')}
            activeOpacity={0.7}
          >
            <View style={styles.pendingBannerLeft}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
              <Text style={styles.pendingBannerText}>
                Pending request{pendingCount !== 1 ? 's' : ''} waiting for your response
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Upcoming Bookings Section */}
        <View style={styles.bookingsSection}>
          <View style={styles.bookingsHeader}>
            <Text style={styles.bookingsTitle}>Upcoming Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SitterBookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Booking Cards */}
          {loadingBookings ? (
            <View style={styles.bookingsLoadingContainer}>
              <ActivityIndicator size="small" color="#32A6D8" />
              <Text style={styles.bookingsLoadingText}>Loading bookings...</Text>
            </View>
          ) : upcomingBookings.length === 0 ? (
            <View style={styles.bookingsEmptyContainer}>
              <Text style={styles.bookingsEmptyText}>No upcoming bookings</Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {upcomingBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <Image source={typeof booking.clientImage === 'string' ? { uri: booking.clientImage } : booking.clientImage} style={styles.bookingAvatar} />
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingClientName}>{booking.clientName}</Text>
                      <Text style={styles.bookingService}>
                        <Text style={styles.bookingServiceType}>{booking.serviceType}</Text>
                        <Text style={styles.bookingDate}> - {booking.date}</Text>
                      </Text>
                    </View>
                    <View style={styles.bookingStatusBadge}>
                      <Text style={styles.bookingStatusText}>{booking.status}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingBottom}>
                    <View style={styles.bookingContact}>
                      {!!booking.address && (
                        <View style={styles.bookingContactItem}>
                          <Icon name="location-outline" size={14} color="#32A6D8" />
                          <Text style={styles.bookingContactText} numberOfLines={2}>{booking.address}</Text>
                        </View>
                      )}
                      {!!booking.petName && (
                        <View style={styles.bookingContactItem}>
                          <Icon name="paw-outline" size={14} color="#32A6D8" />
                          <Text style={styles.bookingContactText}>{booking.petName}</Text>
                        </View>
                      )}
                      {!!booking.phone && (
                        <View style={styles.bookingContactItem}>
                          <Icon name="call-outline" size={13} color="#32A6D8" />
                          <Text style={styles.bookingContactText}>{booking.phone}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.bookingChatButton, !booking.clientUserId && styles.bookingChatButtonDisabled]}
                      onPress={() => booking.clientUserId && navigation.navigate('ChatConversation', {
                        otherUserId: booking.clientUserId,
                        chatName: booking.clientName,
                        avatar: booking.clientImage,
                      })}
                      disabled={!booking.clientUserId}
                    >
                      <ChatIcon width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 21.04,
    paddingTop: 21.05,
    paddingBottom: 21.05,
    gap: 14.03,
  },
  avatar: {
    width: 42.09,
    height: 42.09,
    borderRadius: 9999,
  },
  headerText: {
    flex: 1,
    gap: 1.75,
  },
  greeting: {
    color: '#757575',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 14.4,
  },
  userName: {
    color: '#212121',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 19.2,
  },
  notificationButton: {
    width: 24.55,
    height: 24.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCard: {
    marginHorizontal: 21.92,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(4, 6, 15, 0.05)',
    shadowOffset: { width: 0, height: 3.51 },
    shadowOpacity: 1,
    shadowRadius: 52.61,
    elevation: 5,
    borderRadius: 28.06,
    padding: 17.74,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14.03,
    marginBottom: 20,
  },
  overviewIconContainer: {
    width: 36.83,
    height: 36.83,
    backgroundColor: '#FFC2EB',
    borderRadius: 21.05,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewTitle: {
    color: '#32A6D8',
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 26.31,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 14.03,
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14.03,
    paddingVertical: 7.02,
    borderRadius: 7.02,
    borderWidth: 1.75,
    borderColor: '#E9ECF2',
    gap: 7.02,
  },
  filterButtonText: {
    color: '#808D9E',
    fontSize: 12.28,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 17.54,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14.03,
    paddingVertical: 7.02,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 7.02,
    gap: 7.02,
  },
  downloadButtonText: {
    color: '#5CADF4',
    fontSize: 12.28,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 17.54,
  },
  chartLoadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    height: 150,
    position: 'relative',
    marginBottom: 20,
  },
  gridLines: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 0,
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridLine: {
    width: 0.88,
    height: '100%',
    backgroundColor: '#E6E9ED',
  },
  svgContainer: {
    position: 'absolute',
    left: 28,
    top: 20,
    width: 235.6,
    height: 80.67,
  },
  monthLabels: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthLabel: {
    color: '#808D9E',
    fontSize: 10.52,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 15.78,
    textAlign: 'center',
    width: 33,
  },
  statsDivider: {
    height: 0.88,
    backgroundColor: '#E9ECF2',
    marginVertical: 14.03,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    gap: 7.02,
  },
  statLabel: {
    color: '#808D9E',
    fontSize: 10.52,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 14.03,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7.02,
  },
  statValue: {
    color: '#1D1E25',
    fontSize: 12.28,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 17.54,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  percentageText: {
    color: '#60D39C',
    fontSize: 12.28,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 17.54,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F38FB4',
    marginHorizontal: 21.92,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pendingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#F38FB4',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  pendingBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    flex: 1,
  },
  bookingsSection: {
    marginTop: 20,
    paddingHorizontal: 21.92,
    paddingBottom: 20,
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bookingsTitle: {
    color: '#212121',
    fontSize: 15.78,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.94,
  },
  seeAllText: {
    color: '#5CADF4',
    fontSize: 12.28,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 17.19,
    letterSpacing: 0.18,
  },
  bookingsLoadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  bookingsLoadingText: {
    color: '#858585',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  bookingsEmptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  bookingsEmptyText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  bookingsList: {
    gap: 13,
  },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 12,
    position: 'relative',
  },
  bookingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingAvatar: {
    width: 34,
    height: 33,
    borderRadius: 9999,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bookingClientName: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  bookingService: {
    marginTop: 2,
  },
  bookingServiceType: {
    color: '#000000',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  bookingDate: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.5,
  },
  bookingStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFEED3',
    borderRadius: 30,
  },
  bookingStatusText: {
    color: '#E5A33D',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
    textAlign: 'center',
  },
  bookingBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bookingContact: {
    flex: 1,
    gap: 4,
  },
  bookingContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingContactText: {
    color: '#8D8E90',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 14,
    flex: 1,
  },
  phoneIconsWrapper: {
    width: 16,
    height: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCircle: {
    width: 14.3,
    height: 14.3,
    borderRadius: 9999,
    borderWidth: 1.2,
    borderColor: '#32A6D8',
    position: 'absolute',
  },
  bookingChatButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(90, 172, 244, 0.15)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingChatButtonDisabled: {
    opacity: 0.4,
  },
});

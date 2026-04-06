import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Animated, PanResponder, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BackArrowIcon, Setting2IconAlt, DeleteIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getUserBookings, cancelBooking } from '../../services/bookingService';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -60;
const DELETE_WIDTH = 40;

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
};

const SwipeableRequestCard = ({ request, onPress, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -DELETE_WIDTH));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsSwiping(false);
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handlePress = () => {
    const currentValue = translateX._value;
    if (currentValue < -10) {
      // Close swipe if open
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      onPress();
    }
  };

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDelete(request.id);
    });
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Button Background */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <DeleteIcon />
        </TouchableOpacity>
      </View>

      {/* Request Card */}
      <Animated.View
        style={[
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.requestCard}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={isSwiping}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>👤</Text>
            </View>
          </View>
          <View style={styles.requestInfo}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestName}>{request.name}</Text>
              <Text style={styles.requestTime}>{request.time}</Text>
            </View>
            <View style={styles.messageRow}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {request.message}
              </Text>
              {request.status === 'pending' && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function OpenRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchRequests = async () => {
    try {
      setError(null);
      const response = await getUserBookings();
      const bookings = response?.data?.bookings || [];
      const formatted = bookings.map(booking => ({
        id: booking.id,
        name: booking.sitter?.user?.fullName || 'Sitter',
        message: booking.notes || booking.serviceType?.replace(/_/g, ' ') || '',
        time: getRelativeTime(booking.createdAt),
        status: booking.status?.toLowerCase() || 'pending',
        avatar: booking.sitter?.user?.avatarUrl || null,
        serviceType: booking.serviceType,
        totalAmount: booking.totalAmount,
      }));
      setRequests(formatted);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests();
    }, [])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRequestPress = (requestId) => {
    navigation.navigate('Bookings');
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await cancelBooking(requestId);
      setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (err) {
      console.error('Error cancelling request:', err);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Requests</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Setting2IconAlt width={16.36} height={16.36} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); fetchRequests(); }}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No Open Requests</Text>
              <Text style={styles.emptySubtitle}>New requests will appear here</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {requests.map((request) => (
                <SwipeableRequestCard
                  key={request.id}
                  request={request}
                  onPress={() => handleRequestPress(request.id)}
                  onDelete={handleDeleteRequest}
                />
              ))}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  settingsButton: {
    width: 30,
    height: 30,
    borderRadius: 68.18,
    borderWidth: 1.02,
    borderColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  swipeContainer: {
    width: width,
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: width * 0.06,
    top: 0,
    bottom: 0,
    width: 30,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    height: 69,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCard: {
    width: width * 0.9,
    height: 71,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 5,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    borderRadius: 12,
    marginHorizontal: width * 0.05,
  },
  avatarContainer: {
    width: 55,
    height: 55,
    borderRadius: 60,
    overflow: 'hidden',
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  avatarPlaceholderText: {
    fontSize: 28,
    color: '#999999',
  },
  requestInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestName: {
    color: '#1E2661',
    fontSize: 17,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  requestTime: {
    color: '#B5B8CB',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    color: '#B5B8CB',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 13,
    paddingVertical: 4,
    backgroundColor: '#FFF3D0',
    borderRadius: 30,
    marginLeft: 8,
  },
  statusText: {
    color: '#E5A33D',
    fontSize: 10,
    fontFamily: 'Urbanist',
    fontWeight: '400',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  emptyTitle: {
    color: '#1C1C28',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
});

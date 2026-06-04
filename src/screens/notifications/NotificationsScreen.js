import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { BackArrowIcon, MoneySendIcon, Calendar2Icon, Setting2Icon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just Now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
};

const NotificationItem = ({ notification, onPress }) => {
  const IconComp = notification.iconType === 'payment' ? MoneySendIcon : Calendar2Icon;

  return (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <IconComp width={24} height={24} color="#676869" />
        </View>
        <Text style={styles.notificationText}>{notification.message}</Text>
      </View>
      <View style={styles.notificationRight}>
        <Text style={styles.timeText}>{notification.time}</Text>
        {notification.isNew && <View style={styles.newDot} />}
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await api.get('/notifications');
      // Backend returns { success, data: { notifications: [...], total } }.
      // Same shape gotcha as bookings/chats — the array is one level deeper.
      const list =
        response.data?.data?.notifications ||
        response.data?.notifications ||
        (Array.isArray(response.data) ? response.data : []);
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const formatted = list.map(n => {
        const createdAt = new Date(n.createdAt || n.created_at);
        const rawType = n.type || 'SYSTEM';
        // Icon selection — payment-ish events show a money icon, everything else a calendar.
        // Previously this was inlined buggy (`n.type || X ? 'payment' : 'reminder'` always
        // overwrote the raw type with 'payment' or 'reminder', breaking routing below).
        const iconType =
          /^COINS_|^PAYMENT|^REFUND/i.test(rawType) ||
          (n.message || '').toLowerCase().includes('payment')
            ? 'payment'
            : 'reminder';
        return {
          id: n.id || n._id,
          type: rawType,         // raw backend type — drives routing
          iconType,              // 'payment' | 'reminder' — drives icon
          title: n.title || '',
          message: n.message || n.title || '',
          time: getRelativeTime(n.createdAt || n.created_at),
          isNew: !n.read && !n.isRead,
          section: createdAt > oneDayAgo ? 'newest' : 'oldest',
          read: n.read || n.isRead || false,
          data: n.data || null,
        };
      });
      setNotifications(formatted);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNotificationPress = async (notification) => {
    if (notification.isNew) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(n =>
          n.id === notification.id ? { ...n, isNew: false, read: true } : n
        ));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Route based on the raw backend `type` value (set in fetchNotifications above).
    // Deep-link params come from the `data` JSON the backend wrote on each event.
    const notifType = notification.type;
    const data = notification.data || {};

    switch (notifType) {
      // ── Bookings — pre-select the right tab so the user lands at the relevant list ──
      case 'BOOKING_REQUEST':
        // Sitter side: jump to the requests inbox
        navigation.navigate('SitterRequests');
        return;
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_DECLINED':
        if (data.bookingId) {
          navigation.navigate('BookingDetail', { bookingId: data.bookingId });
        } else {
          navigation.navigate('Bookings', { initialTab: 'Upcoming' });
        }
        return;
      case 'BOOKING_COMPLETED':
      case 'BOOKING_CANCELLED':
        if (data.bookingId) {
          navigation.navigate('BookingDetail', { bookingId: data.bookingId });
        } else {
          navigation.navigate('Bookings', { initialTab: 'Past' });
        }
        return;

      // ── Messaging ──
      case 'MESSAGE':
      case 'message':
      case 'NEW_MESSAGE':
        if (data.senderId) {
          navigation.navigate('ChatConversation', {
            otherUserId: data.senderId,
            chatName: data.senderName || 'Chat',
          });
        } else {
          navigation.navigate('ChatList');
        }
        return;

      // ── Reviews — sitter receives a review on their profile ──
      case 'REVIEW':
        if (data.bookingId) {
          navigation.navigate('BookingDetail', { bookingId: data.bookingId });
        } else {
          navigation.navigate('Bookings', { initialTab: 'Past' });
        }
        return;

      // ── Payments / Coins ──
      case 'COINS_PURCHASED':
      case 'COINS_REFUNDED':
      case 'COINS_EARNED':
        navigation.navigate('PaymentMethods');
        return;
      case 'COINS_PURCHASE_FAILED':
      case 'LOW_COIN_BALANCE':
        navigation.navigate('ShopCoins');
        return;

      // ── Pet alerts ──
      case 'PET_SCANNED_WHILE_MISSING':
      case 'PET_QR_LINKED':
      case 'PET_QR_DISCONNECTED':
        if (data.petId) {
          navigation.navigate('MyPetProfile', { petId: data.petId });
        } else {
          // No petId — fall back to the pets tab
          navigation.navigate('MainTabs', { screen: 'Pets', params: { screen: 'PetList' } });
        }
        return;

      // ── Account / system ──
      case 'SITTER_APPROVED':
      case 'SITTER_REJECTED':
      case 'PHONE_VERIFIED':
      case 'PASSWORD_RESET_SUCCESSFUL':
      case 'SYSTEM':
        // Informational — stay on the notifications screen
        return;

      // ── Promotional ──
      case 'REFERRAL_REWARD_EARNED':
        navigation.navigate('PaymentMethods');
        return;

      default:
        // Unknown type — safest fallback is the bookings list (most common case)
        navigation.navigate('Bookings');
        return;
    }
  };

  const newestNotifications = notifications.filter(n => n.section === 'newest');
  const oldestNotifications = notifications.filter(n => n.section === 'oldest');

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header - Absolute positioned at top */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('NotificationPreferences')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Setting2Icon width={16.36} height={16.36} color="#1C1C28" />
          </TouchableOpacity>
        </View>

        {/* Content Area - Scrollable */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); fetchNotifications(); }}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Newest Section */}
              {newestNotifications.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Newest</Text>
                  <View style={styles.section}>
                    <View style={styles.divider} />
                    {newestNotifications.map((notification, index) => (
                      <View key={notification.id}>
                        <NotificationItem notification={notification} onPress={handleNotificationPress} />
                        {index < newestNotifications.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Oldest Section */}
              {oldestNotifications.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Oldest</Text>
                  <View style={styles.section}>
                    {oldestNotifications.map((notification, index) => (
                      <View key={notification.id}>
                        <NotificationItem notification={notification} onPress={handleNotificationPress} />
                        {index < oldestNotifications.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
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
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },

  sectionTitle: {
    color: '#1C1C28',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 23.4,
    paddingHorizontal: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginVertical: 10
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F3F3',
    marginVertical: 5,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    backgroundColor: '#FFC2EB',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    color: '#1C1C28',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  notificationRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 12,
  },
  timeText: {
    width: 69,
    textAlign: 'right',
    color: '#858585',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 19.2,
  },
  newDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FC8838',
    borderRadius: 9999,
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


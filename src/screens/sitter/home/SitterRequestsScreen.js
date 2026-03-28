import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, Setting2IconAlt, DogImage } from '../../../assets';
import { getSitterRequests, updateBookingStatus } from '../../../services/bookingService';

export default function SitterRequestsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'chats'
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSitterRequests();
      const data = response?.requests || response?.data || response || [];
      const requestsArray = Array.isArray(data) ? data : [];

      // Separate into requests and chats based on type or status
      const requestItems = [];
      const chatItems = [];

      requestsArray.forEach((item) => {
        const mapped = {
          id: item.id || item._id,
          bookingId: item.bookingId || item.id || item._id,
          name: item.client?.name || item.user?.name || item.name || 'User',
          message: item.message || item.lastMessage || 'New request',
          time: item.createdAt
            ? getTimeDisplay(new Date(item.createdAt))
            : item.time || '',
          avatar: item.client?.profileImage || item.user?.profileImage
            ? { uri: item.client?.profileImage || item.user?.profileImage }
            : DogImage,
          type: item.type || 'request',
          status: item.status,
          unread: item.unreadCount || item.unread || 0,
        };

        if (item.type === 'chat' || item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS') {
          chatItems.push(mapped);
        } else {
          requestItems.push(mapped);
        }
      });

      setRequests(requestItems);
      setChats(chatItems);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Helper to display relative time
  const getTimeDisplay = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return 'Yesterday';
  };

  const handleAccept = async (item) => {
    const bookingId = item.bookingId;
    if (!bookingId) return;

    setProcessingIds(prev => new Set([...prev, bookingId]));
    try {
      await updateBookingStatus(bookingId, 'CONFIRMED');
      Alert.alert('Accepted', `Request from ${item.name} has been accepted.`);
      // Move from requests to chats
      setRequests(prev => prev.filter(r => r.bookingId !== bookingId));
      setChats(prev => [...prev, { ...item, type: 'chat', status: 'CONFIRMED' }]);
    } catch (err) {
      console.error('Failed to accept request:', err);
      Alert.alert('Error', err?.message || 'Failed to accept request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  const handleReject = async (item) => {
    const bookingId = item.bookingId;
    if (!bookingId) return;

    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the request from ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set([...prev, bookingId]));
            try {
              await updateBookingStatus(bookingId, 'CANCELLED');
              setRequests(prev => prev.filter(r => r.bookingId !== bookingId));
              Alert.alert('Declined', `Request from ${item.name} has been declined.`);
            } catch (err) {
              console.error('Failed to decline request:', err);
              Alert.alert('Error', err?.message || 'Failed to decline request');
            } finally {
              setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(bookingId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const renderRequestCard = (item) => {
    const isProcessing = processingIds.has(item.bookingId);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate('ChatConversation', { chatId: item.id, chatName: item.name })}
      >
        <Image source={typeof item.avatar === 'string' ? { uri: item.avatar } : item.avatar} style={styles.avatar} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardTime}>{item.time}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text style={styles.cardMessage} numberOfLines={1}>{item.message}</Text>
            {isProcessing ? (
              <ActivityIndicator size="small" color="#32A6D8" />
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.acceptBadge}
                  onPress={() => handleAccept(item)}
                >
                  <Text style={styles.acceptBadgeText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.requestBadge}
                  onPress={() => handleReject(item)}
                >
                  <Text style={styles.requestBadgeText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChatCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => navigation.navigate('ChatConversation', { chatId: item.id, chatName: item.name })}
    >
      <Image source={typeof item.avatar === 'string' ? { uri: item.avatar } : item.avatar} style={styles.avatar} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.cardMessage}>{item.message}</Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inbox</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Setting2IconAlt width={16.36} height={16.36} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
              onPress={() => setActiveTab('chats')}
            >
              <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
                Chats
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRequests}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {activeTab === 'requests' ? (
              <View style={styles.listContainer}>
                {requests.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No pending requests</Text>
                  </View>
                ) : (
                  requests.map(renderRequestCard)
                )}
              </View>
            ) : (
              <View style={styles.listContainer}>
                {chats.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No active chats</Text>
                  </View>
                ) : (
                  chats.map(renderChatCard)
                )}
              </View>
            )}
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
  tabContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    padding: 4,
    height: 52,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: 'rgba(133, 133, 133, 0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 3,
  },
  tabText: {
    textAlign: 'center',
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 18.2,
  },
  activeTabText: {
    color: '#32A6D8',
    fontWeight: '500',
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 60,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    color: '#1E2661',
    fontSize: 17,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  cardTime: {
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
  cardMessage: {
    color: '#B5B8CB',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
    flex: 1,
    marginRight: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 30,
  },
  acceptBadgeText: {
    textAlign: 'center',
    color: '#219A27',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  requestBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFD3D3',
    borderRadius: 30,
  },
  requestBadgeText: {
    textAlign: 'center',
    color: '#E53D3D',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '400',
  },
});

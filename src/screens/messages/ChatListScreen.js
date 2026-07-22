import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, PanResponder, Dimensions, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import { BackArrowIcon, Setting2IconAlt, DeleteIcon, ImageHereIcon, ClockIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';
import { getSocket } from '../../config/socket';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -60;
const DELETE_WIDTH = 40;

const SwipeableChatCard = ({ chat, onPress, onDelete }) => {
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

  const swipeOpenRef = useRef(false);

  // Track the animated value properly via listener
  React.useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      swipeOpenRef.current = value < -10;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

  const handlePress = () => {
    if (swipeOpenRef.current) {
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
      onDelete(chat.id);
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

      {/* Chat Card */}
      <Animated.View
        style={[
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.chatCard}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={isSwiping}
        >
          <View style={styles.avatarContainer}>
            {chat.avatar ? (
              // key={url} forces a remount when the URL changes — RN <Image>
              // caches by URI and would otherwise keep showing the old photo.
              <Image
                key={chat.avatar}
                source={{ uri: chat.avatar }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../assets/images/Pet_default_image.png')}
                style={styles.profileImage}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={styles.chatTime}>{chat.time}</Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {chat.lastMessage}
            </Text>
          </View>
          {chat.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function ChatListScreen({ navigation }) {
  const alert = useAppAlert();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const fetchConversations = async () => {
    try {
      setError(null);
      const response = await api.get('/messages/conversations');
      // Backend returns { success, data: { conversations: [...] } }. axios
      // sets response.data to the body, so the array lives at
      // response.data.data.conversations. The old fallback chain matched
      // response.data.data (an object) first and left the inbox empty.
      const conversations =
        response.data?.data?.conversations ||
        response.data?.conversations ||
        (Array.isArray(response.data) ? response.data : []);
      const formatted = Array.isArray(conversations) ? conversations.map(conv => {
        // The backend groups by the other party and does NOT send a
        // conversation id — the other user's id is the stable key. Without
        // this, every card got key={undefined}, colliding so only one
        // conversation rendered.
        const otherId = conv.otherUserId || conv.otherUser?.id || conv.otherUser?._id;
        return {
        id: conv.id || conv._id || otherId,
        otherUserId: otherId,
        name: conv.otherUser?.fullName || conv.otherUser?.name || conv.name || 'Unknown',
        lastMessage: conv.lastMessage?.content || conv.lastMessage || '',
        time: conv.lastMessage?.createdAt
          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : conv.time || '',
        unread: conv.unreadCount || 0,
        avatar: conv.otherUser?.avatarUrl || conv.otherUser?.avatar || conv.otherUser?.profileImage || null,
        };
      }) : [];
      setChats(formatted);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [])
  );

  // Listen for real-time messages to refresh the conversation list
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations();
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSent', handleNewMessage);
    };
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChatPress = (chat) => {
    navigation.navigate('ChatConversation', {
      chatId: chat.id,
      chatName: chat.name,
      otherUserId: chat.otherUserId || chat.id,
      avatar: chat.avatar,
    });
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/messages/conversations/${chatId}`);
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inbox</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => alert('Chat Settings', 'Coming after release', 'pending')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Setting2IconAlt width={16.36} height={16.36} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); fetchConversations(); }}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No Conversations</Text>
              <Text style={styles.emptySubtitle}>Your messages will appear here</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#32A6D8"
                />
              }
            >
              {chats.map((chat) => (
                <SwipeableChatCard
                  key={chat.id}
                  chat={chat}
                  onPress={() => handleChatPress(chat)}
                  onDelete={handleDeleteChat}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#FFC2EB',
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 55,
    height: 55,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    paddingVertical: 10
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  swipeContainer: {
    width: width,
    // height: 71,
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

  chatCard: {
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
    marginHorizontal: width * 0.05
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
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    color: '#1E2661',
    fontSize: 17,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  chatTime: {
    color: '#B5B8CB',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '500',
  },
  lastMessage: {
    color: '#B5B8CB',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  unreadBadge: {
    position: 'absolute',
    right: 10,
    top: '70%',
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
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

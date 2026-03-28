import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowIcon, Setting2IconAlt, DeleteIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -60;
const DELETE_WIDTH = 40;

// Mock request data
const MOCK_REQUESTS = [
  {
    id: 1,
    name: 'Ashlyn T.',
    message: 'Aliquyam erat, sed diam',
    time: 'Just now',
    status: 'pending',
    avatar: null
  },
  {
    id: 2,
    name: 'Dolzin',
    message: 'Aliquyam erat, sed diam',
    time: 'Just now',
    status: 'pending',
    avatar: null
  },
];

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
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRequestPress = (requestId) => {
    console.log('Request pressed:', requestId);
    // Navigate to request detail or chat
  };

  const handleDeleteRequest = (requestId) => {
    setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { top: insets.top }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Open Request</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Setting2IconAlt width={16.36} height={16.36} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { top: HEADER_HEIGHT + insets.top }]}>
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
        </View>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 68;

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
  header: {
    position: 'absolute',
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
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
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
});

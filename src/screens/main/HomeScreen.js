import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchSitters } from '../../store/slices/sitterSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import ProfileVerifiedModal from '../../components/ProfileVerifiedModal';
import Icon from '@expo/vector-icons/Ionicons';
import { 
  HomeIconSvg, 
  ScanAltIcon, 
  OrderApproveIcon, 
  NotificationSolidIcon, 
  InboxLightIcon,
  ExploreOutlineIcon,
  SplashIcon
} from '../../assets';
import { getSitterStatus, markSitterApprovalSeen } from '../../services/sitterService';
import ReferralPromptModal from '../../components/ReferralPromptModal';
import { getReferralPromptStatus } from '../../services/referralService';
import { useWallet } from '../../context/WalletContext';
import api from '../../config/api';

// Show the referral prompt at most once per app session.
let referralPromptCheckedThisSession = false;

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isApprovedSitter, setIsApprovedSitter] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);
  const wallet = useWallet();

  useEffect(() => {
    dispatch(fetchSitters());
  }, [dispatch]);

  // "Were you invited?" prompt — check once per session for eligible users.
  useEffect(() => {
    if (referralPromptCheckedThisSession) return;
    referralPromptCheckedThisSession = true;
    getReferralPromptStatus()
      .then((show) => { if (show) setShowReferralPrompt(true); })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkSitter = async () => {
        try {
          const response = await getSitterStatus();
          if (response.data?.hasSitterProfile && response.data.sitter?.approvalStatus === 'APPROVED') {
            setIsApprovedSitter(true);
          } else {
            setIsApprovedSitter(false);
          }
        } catch {
          setIsApprovedSitter(false);
        }
      };
      const fetchUnread = async () => {
        try {
          const res = await api.get('/notifications/unread-count');
          setUnreadCount(res.data?.data?.unreadCount || 0);
        } catch {
          // Network blip — leave the badge as-is
        }
      };
      checkSitter();
      fetchUnread();
    }, [])
  );

  const handleBecomeASitter = async () => {
    try {
      setCheckingStatus(true);

      // Always check sitter status from API first
      const response = await getSitterStatus();

      if (response.data && response.data.hasSitterProfile) {
        const { sitter } = response.data;

        if (sitter.approvalStatus === 'APPROVED') {
          const alreadySeen = sitter.approvalSeen;
          if (alreadySeen) {
            navigation.navigate('SitterTabs');
          } else {
            setShowApprovedModal(true);
          }
        } else if (sitter.approvalStatus === 'REJECTED') {
          setRejectionReason(sitter.rejectionReason || 'Your application was rejected. Please contact support for more details.');
          setShowRejectedModal(true);
        } else if (sitter.approvalStatus === 'PENDING') {
          setShowPendingModal(true);
        }
      } else if (user?.stripeVerified) {
        // Verified but no sitter profile — go to profile setup
        navigation.navigate('ProfileSetup');
      } else {
        // Not verified — go to intro/verification
        navigation.navigate('BecomeASitterIntro');
      }
    } catch (error) {
      console.error('Failed to check sitter status:', error);

      if (error.response?.status === 401 || error.response?.data?.message === 'Token expired') {
        return;
      }

      // Fallback: check stripeVerified to decide where to go
      if (user?.stripeVerified) {
        navigation.navigate('ProfileSetup');
      } else {
        navigation.navigate('BecomeASitterIntro');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleApprovedModalNext = async () => {
    setShowApprovedModal(false);
    await markSitterApprovalSeen();
    navigation.navigate('SitterTabs');
  };

  const handleRejectedModalNext = () => {
    setShowRejectedModal(false);
    navigation.navigate('ProfileSetup');
  };

  const handlePendingModalNext = () => {
    setShowPendingModal(false);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              // key={url} forces remount when the avatar changes — RN <Image>
              // caches by URI and would otherwise keep showing the old photo.
              <Image
                key={user.avatarUrl}
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Image source={SplashIcon} style={{ width: 30, height: 30 }} resizeMode="contain" />
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText} numberOfLines={1}>{t('home.welcome')}</Text>
            <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
              {user?.email || t('home.noEmail')}
            </Text>
          </View>
          {/* Notification bell — top-right header button. Standard
              pattern testers expect for accessing alerts/notifications. */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="notifications-outline" size={26} color="#32A6D8" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Explore Section */}
        {/* <View style={styles.exploreHeader}>
          <ExploreOutlineIcon width={21.81} height={21.81} />
          <Text style={styles.exploreText}>Explore</Text>
        </View> */}

        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('AddPet')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <Icon name="paw-outline" size={36} color="#32A6D8" />
                </View>
                <Text style={styles.actionLabel}>Add a Pet</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('PetQRScan', { fromScreen: 'Home' })}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <ScanAltIcon width={36} height={36} />
                </View>
                <Text style={styles.actionLabel}>Scan a QR</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Bookings')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <OrderApproveIcon width={36} height={36} />
                </View>
                <Text style={styles.actionLabel}>Bookings</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('OpenRequests')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <Icon name="send-outline" size={36} color="#32A6D8" />
                </View>
                <Text style={styles.actionLabel}>My Requests</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <NotificationSolidIcon width={36} height={36} />
                </View>
                <Text style={styles.actionLabel}>Notifications</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ChatList')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <InboxLightIcon width={36} height={36} />
                </View>
                <Text style={styles.actionLabel}>Inbox</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 4 - Become a Sitter */}
          {!isApprovedSitter && (
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.actionCard, styles.halfCard]}
                onPress={handleBecomeASitter}
                disabled={checkingStatus}
              >
                <View style={styles.cardContent}>
                  {checkingStatus ? (
                    <ActivityIndicator size="small" color="#32A6D8" />
                  ) : (
                    <>
                      <View style={styles.iconWrapper}>
                        <Icon name="paw-outline" size={36} color="#32A6D8" />
                      </View>
                      <Text style={styles.actionLabel}>Become a Pet Sitter</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Approved Modal */}
        <ProfileVerifiedModal
          visible={showApprovedModal}
          onNext={handleApprovedModalNext}
          title="Application Approved!"
          description="Congratulations! Your sitter application has been approved. You can now start accepting bookings!"
          buttonText="Go to Dashboard"
          iconType="success"
        />

        {/* Rejected Modal */}
        <ProfileVerifiedModal
          visible={showRejectedModal}
          onNext={handleRejectedModalNext}
          title="Application Rejected"
          description={rejectionReason}
          buttonText="Update Profile"
          iconType="error"
        />

        {/* Pending Modal */}
        <ProfileVerifiedModal
          visible={showPendingModal}
          onNext={handlePendingModalNext}
          title="Application Pending"
          description="Your sitter application is currently under review. We'll notify you once it's been processed."
          buttonText="OK"
          iconType="pending"
        />

        <ReferralPromptModal
          visible={showReferralPrompt}
          onClose={() => setShowReferralPrompt(false)}
          onRedeemed={() => { wallet?.refresh?.(); }}
        />
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 10,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 37.5,
    backgroundColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 37.5,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F38FB4',
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D93025',
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '700',
    lineHeight: 12,
  },
  welcomeText: {
    color: '#F38FB4',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  emailText: {
    color: '#5D6165',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.65,
  },
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 15,
    gap: 3.64,
  },
  exploreText: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  gridContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCard: {
    flex: 1,
    height: 116,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F4F4F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1,
  },
  halfCard: {
    flex: 0,
    width: (width - 48 - 12) / 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    padding: 9,
    borderRadius: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: '#0D0D12',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.6,
    textAlign: 'center',
  },
});

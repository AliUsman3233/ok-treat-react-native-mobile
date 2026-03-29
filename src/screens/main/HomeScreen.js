import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSitters } from '../../store/slices/sitterSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import ProfileVerifiedModal from '../../components/ProfileVerifiedModal';
import Icon from 'react-native-vector-icons/Ionicons';
import { 
  HomeIconSvg, 
  ScanAltIcon, 
  OrderApproveIcon, 
  NotificationSolidIcon, 
  InboxLightIcon,
  ExploreOutlineIcon,
  SplashIcon
} from '../../assets';
import { getSitterStatus } from '../../services/sitterService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    dispatch(fetchSitters());
  }, [dispatch]);

  const handleBecomeASitter = async () => {
    // Check if user is already verified
    if (user?.stripeVerified) {
      // Check sitter status first
      try {
        setCheckingStatus(true);
        const response = await getSitterStatus();
        console.log('Sitter status response:', response);
        
        if (response.data && response.data.hasSitterProfile) {
          const { sitter } = response.data;
          
          if (sitter.approvalStatus === 'APPROVED') {
            // Show approved modal and navigate to SitterTabs
            setShowApprovedModal(true);
          } else if (sitter.approvalStatus === 'REJECTED') {
            // Show rejected modal with reason
            setRejectionReason(sitter.rejectionReason || 'Your application was rejected. Please contact support for more details.');
            setShowRejectedModal(true);
          } else if (sitter.approvalStatus === 'PENDING') {
            // Show pending modal
            setShowPendingModal(true);
          }
        } else {
          // No sitter profile, navigate to ProfileSetup
          navigation.navigate('ProfileSetup');
        }
      } catch (error) {
        console.error('Failed to check sitter status:', error);
        
        // Check if it's a token error - if so, don't navigate (interceptor will handle it)
        if (error.response?.status === 401 || error.response?.data?.message === 'Token expired') {
          // Token expired, interceptor will show alert and navigate to login
          return;
        }
        
        // For other errors, navigate to ProfileSetup
        navigation.navigate('ProfileSetup');
      } finally {
        setCheckingStatus(false);
      }
    } else {
      // Navigate to intro screen
      navigation.navigate('BecomeASitterIntro');
    }
  };

  const handleApprovedModalNext = () => {
    setShowApprovedModal(false);
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
            <SplashIcon width={30} height={30} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.emailText}>{user?.email || 'No email'}</Text>
          </View>
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
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <NotificationSolidIcon width={36} height={36} />
                </View>
                <Text style={styles.actionLabel}>Notifications</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.halfCard]}
              onPress={() => navigation.navigate('ChatList')}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <InboxLightIcon width={36} height={36} />
                </View>
                <Text style={styles.actionLabel}>Inbox</Text>
              </View>
            </TouchableOpacity>

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
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F38FB4',
  },
  headerTextContainer: {
    width: 232,
    gap: 2,
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
    flex: 1,
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

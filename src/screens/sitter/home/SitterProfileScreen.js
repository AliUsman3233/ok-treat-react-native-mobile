import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/slices/authSlice';
import { getSitterProfile } from '../../../services/sitterService';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import {
  BackArrowIcon,
  UserProfileIcon,
  NotebookProfileIcon,
  SupportProfileIcon,
  RateUsIcon,
  LogoutProfileIcon,
  EditIcon,
  ProfileImagePersonIcon,
  VerifiedIcon,
  StarIcon,
  BadgeCheckIcon,
  MapPinIcon,
} from '../../../assets';

export default function SitterProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [sitter, setSitter] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getSitterProfile();
        setSitter(response?.data || response || null);
      } catch (err) {
        console.error('Failed to fetch sitter profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems = [
    {
      title: 'Personal information',
      component: UserProfileIcon,
      screen: 'SitterPersonalProfile',
      color: '#32A6D8'
    },
    {
      title: 'Services Setup',
      component: NotebookProfileIcon,
      screen: 'ProfileSetup',
      color: '#32A6D8'
    },
    {
      title: 'My Bookings',
      component: NotebookProfileIcon,
      screen: 'SitterBookings',
      color: '#32A6D8'
    },
    {
      title: 'Earnings',
      component: NotebookProfileIcon,
      screen: 'SitterEarnings',
      color: '#32A6D8'
    },
    {
      title: 'Support',
      component: SupportProfileIcon,
      screen: 'HelpSupport',
      color: '#32A6D8'
    },
    {
      title: 'Rate Us',
      component: RateUsIcon,
      screen: null,
      color: '#32A6D8',
      action: 'rate'
    },
    {
      title: 'Log out',
      component: LogoutProfileIcon,
      screen: null,
      color: '#F56754',
      action: 'logout'
    },
  ];

  const handleMenuPress = (item) => {
    if (item.action === 'logout') {
      handleLogout();
    } else if (item.action === 'rate') {
      console.log('Rate us');
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageWrapper}>
              <View style={styles.profileImageContainer}>
                <ProfileImagePersonIcon width={103} height={103} />
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfileDetails')}
              >
                <EditIcon width={14.4} height={14.4} fill="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName || 'Sitter'}</Text>
              
              {/* Verified Badge */}
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={17} color="#00B100" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>

              {/* Stats Row 1 */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="star" size={16} color="#FBBC04" />
                  <Text style={styles.statText}>{sitter?.averageRating || '0.0'} ({sitter?.totalReviews || 0} reviews)</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="people" size={16} color="#32A6D8" />
                  <Text style={styles.statText}>{sitter?.repeatClients || 0} repeat clients</Text>
                </View>
              </View>

              {/* Stats Row 2 */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="briefcase" size={14} color="#32A6D8" />
                  <Text style={styles.statTextGray}>Yaletown pet sitter & walker</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="location" size={14} color="#32A6D8" />
                  <Text style={styles.statTextGray}>{user?.address || ''}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const IconComponent = item.component;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconCircle}>
                      <IconComponent width={20} height={20} fill={item.color} />
                    </View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#040404" />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 103,
    height: 103,
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 103,
    height: 103,
    borderRadius: 78,
    borderWidth: 6,
    borderColor: 'white',
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    backgroundColor: '#040404',
    borderRadius: 9999,
    borderWidth: 0.8,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  profileName: {
    color: '#0D0D12',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 37.2,
    textAlign: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  statTextGray: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  menuContainer: {
    gap: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
    color: 'black',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 16.8,
  },
});

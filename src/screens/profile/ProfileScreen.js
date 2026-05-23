import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setCredentials } from '../../store/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';
import { useAppAlert } from '../../context/AlertContext';
import {
  BackArrowIcon,
  UserProfileIcon,
  NotebookProfileIcon,
  NotificationProfileIcon,
  ReferFriendIcon,
  SupportProfileIcon,
  RateUsIcon,
  LogoutProfileIcon,
  CameraIcon,
  ProfileImagePersonIcon,
  EditIcon
} from '../../assets';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const alert = useAppAlert();
  const { user, token } = useSelector(state => state.auth);

  // Refresh profile data when screen gets focus
  useFocusEffect(
    useCallback(() => {
      const refreshProfile = async () => {
        try {
          const response = await api.get('/auth/profile');
          if (response.data?.success) {
            dispatch(setCredentials({ user: response.data.data.user, token }));
          }
        } catch (e) {
          // Silently fail - will use cached data
        }
      };
      refreshProfile();
    }, [token])
  );

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
      screen: 'EditProfileDetails',
      color: '#32A6D8'
    },
    {
      title: 'My Bookings',
      component: NotebookProfileIcon,
      screen: 'Bookings',
      color: '#32A6D8'
    },
    {
      title: 'Notification',
      component: NotificationProfileIcon,
      screen: 'Notifications',
      color: '#32A6D8'
    },
    {
      title: 'Refer a Friend',
      component: ReferFriendIcon,
      screen: null,
      color: '#32A6D8',
      action: 'coming_soon',
      comingSoonLabel: 'Refer a Friend',
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
      action: 'coming_soon',
      comingSoonLabel: 'Rate Us',
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
    } else if (item.action === 'coming_soon') {
      alert(item.comingSoonLabel || item.title, 'Coming after release', 'pending');
    } else if (item.screen) {
      navigation.navigate(item.screen);
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
          <Text style={styles.headerTitle}>Your Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageWrapper}>
              <View style={styles.profileImageContainer}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.profileImage} />
                ) : (
                  <Image source={ProfileImagePersonIcon} style={{ width: 88, height: 88, borderRadius: 44 }} resizeMode="cover" />
                )}
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfileDetails')}
              >
                <EditIcon width={14} height={14} fill="#ffffffff" color="#ffffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName || user?.name || 'Your name'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const IconComponent = item.component;
              const isComingSoon = item.action === 'coming_soon';
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, isComingSoon && styles.menuItemDisabled]}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconCircle}>
                      <IconComponent width={20} height={20} fill={item.color} />
                    </View>
                    <View style={styles.menuItemTextWrap}>
                      <Text style={[styles.menuTitle, isComingSoon && styles.menuTitleDisabled]}>
                        {item.title}
                      </Text>
                      {isComingSoon && <Text style={styles.comingSoonBadge}>Coming soon</Text>}
                    </View>
                  </View>
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={isComingSoon ? '#C7CAD1' : '#040404'}
                  />
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
    borderRadius: 40,
    overflow: 'hidden',
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
    paddingHorizontal: 15,
    paddingTop: 40,
  },
  profileSection: {
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
  },
  profileImageContainer: {
    width: 88,
    height: 88,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 9999,
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
    gap: 4,
  },
  profileName: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  profileEmail: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
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
    // No flex — the title is inside a column wrap, so flex:1 would stretch the
    // Text box vertically and pin the visible glyphs to the top of the row.
    color: 'black',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 16.8,
  },
  menuItemTextWrap: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  menuItemDisabled: {
    opacity: 0.55,
  },
  menuTitleDisabled: {
    color: '#818898',
  },
  comingSoonBadge: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

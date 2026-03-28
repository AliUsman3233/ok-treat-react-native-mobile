import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';
import {
  UserCircleIcon,
  PawIcon,
  ScannerIcon,
  CreditCardIcon,
  SettingsIcon,
  StoreIcon,
  HeadphonesIcon
} from '../../assets';

export default function MoreScreen({ navigation }) {
  const { user } = useSelector(state => state.auth);
  const [isSitterMode, setIsSitterMode] = useState(false);
  const [sitterStatus, setSitterStatus] = useState(null); // null | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [hasSitterProfile, setHasSitterProfile] = useState(false);

  // Check sitter status on every screen focus
  useFocusEffect(
    useCallback(() => {
      const checkSitterStatus = async () => {
        try {
          const response = await api.get('/sitter/status');
          if (response.data?.success) {
            const { sitter, hasSitterProfile: hasProfile } = response.data.data;
            setHasSitterProfile(hasProfile);
            setSitterStatus(sitter?.approvalStatus || null);
            // Only keep sitter mode on if approved and was previously on
            if (!sitter || sitter.approvalStatus !== 'APPROVED') {
              setIsSitterMode(false);
            }
          }
        } catch (e) {
          // Not a sitter yet
          setHasSitterProfile(false);
          setSitterStatus(null);
          setIsSitterMode(false);
        }
      };
      checkSitterStatus();
    }, [])
  );

  const handleSitterModeToggle = (value) => {
    if (value) {
      if (sitterStatus === 'APPROVED') {
        // Approved sitter — switch to sitter home
        setIsSitterMode(true);
        navigation.navigate('SitterHome');
      } else if (sitterStatus === 'PENDING') {
        Alert.alert('Application Pending', 'Your sitter application is under review. You\'ll be notified once approved.');
      } else if (sitterStatus === 'REJECTED') {
        Alert.alert('Application Rejected', 'Your sitter application was not approved. Please contact support for details.');
      } else {
        // No sitter profile — start the flow
        navigation.navigate('BecomeASitterIntro');
      }
    } else {
      // Turning off sitter mode
      setIsSitterMode(false);
    }
  };

  const menuItems = [
    { 
      title: 'Profile', 
      screen: 'ProfileView',
      component: UserCircleIcon 
    },
    { 
      title: 'Your Pet', 
      screen: 'PetList',
      component: PawIcon 
    },
    { 
      title: 'Your Latest Scans', 
      screen: 'Scans',
      component: ScannerIcon 
    },
    { 
      title: 'Shop Coins', 
      screen: 'ShopCoins',
      component: CreditCardIcon 
    },
    { 
      title: 'Transaction History', 
      screen: 'TransactionHistory',
      component: CreditCardIcon 
    },
    { 
      title: 'Settings', 
      screen: 'Settings',
      component: SettingsIcon 
    },
    { 
      title: 'AlohaPay', 
      screen: 'PaymentMethods',
      component: StoreIcon 
    },
    {
      title: 'Help & Support',
      screen: 'HelpSupport',
      component: HeadphonesIcon
    },
    ...(__DEV__ ? [
      {
        title: 'Test Cloudinary Upload',
        screen: 'CloudinaryTest',
        component: CreditCardIcon
      },
      {
        title: 'Test Server Connection',
        screen: 'ConnectionTest',
        component: SettingsIcon
      },
      {
        title: 'Test Network',
        screen: 'NetworkTest',
        component: SettingsIcon
      },
    ] : []),
  ];

  const handleMenuPress = (screen) => {
    if (screen) {
      navigation.navigate(screen);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../../assets/images/Pet_default_image.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>More</Text>
            <Text style={styles.headerSubtitle}>You can manage your preferences</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Sitter Mode Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleLabel}>Switch to Sitter Mode</Text>
              {sitterStatus === 'PENDING' && (
                <Text style={styles.toggleStatus}>Application pending review</Text>
              )}
              {sitterStatus === 'REJECTED' && (
                <Text style={[styles.toggleStatus, { color: '#FF3B30' }]}>Application not approved</Text>
              )}
              {!hasSitterProfile && !sitterStatus && (
                <Text style={styles.toggleStatus}>Become a sitter to earn</Text>
              )}
            </View>
            <Switch
              value={isSitterMode}
              onValueChange={handleSitterModeToggle}
              trackColor={{ false: '#E5E5E5', true: '#FFC2EB' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E5E5E5"
            />
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const IconComponent = item.component;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <IconComponent width={24} height={24} fill="#32A6D8" />
                    </View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                  </View>
                  {/* <Icon name="chevron-forward" size={24} color="#FFC2EB" /> */}
                </TouchableOpacity>
              );
            })}
          </View>
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
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 5,
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
    width: 45,
    height: 45,
    borderRadius: 37.5,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: '#F38FB4',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerSubtitle: {
    color: '#5D6165',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.65,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 5,
    gap: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  toggleLeft: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  toggleStatus: {
    color: '#F59E0B',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    color: '#0D0D12',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.6,
  },
});

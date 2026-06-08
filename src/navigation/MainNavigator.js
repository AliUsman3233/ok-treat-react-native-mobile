import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import {
  SearchTextIcon,
  GridWeb7Icon,
  HomeSitterActiveIcon,
  HomeSitterInactiveIcon,
  BookingsSitterActiveIcon,
  BookingsSitterInactiveIcon,
  CalendarSitterActiveIcon,
  CalendarSitterInactiveIcon,
  InboxSitterActiveIcon,
  InboxSitterInactiveIcon,
  ProfileSitterActiveIcon,
  ProfileSitterInactiveIcon
} from '../assets';

import HomeScreen from '../screens/main/HomeScreen';
import BookingsScreen from '../screens/main/BookingsScreen';
import BookingDetailScreen from '../screens/main/BookingDetailScreen';
import RebookScreen from '../screens/main/RebookScreen';
import MoreScreen from '../screens/main/MoreScreen';

import PetListScreen from '../screens/pets/PetListScreen';
import AddPetScreen from '../screens/pets/AddPetScreen';
import EditPetScreen from '../screens/pets/EditPetScreen';
import PetDetailScreen from '../screens/pets/PetDetailScreen';
import MyPetProfileScreen from '../screens/pets/MyPetProfileScreen';
import ReportMissingScreen from '../screens/pets/ReportMissingScreen';
import PetWizardStep1Screen from '../screens/pets/PetWizardStep1Screen';
import PetWizardStep2Screen from '../screens/pets/PetWizardStep2Screen';
import PetWizardStep3Screen from '../screens/pets/PetWizardStep3Screen';
import PetWizardStep4Screen from '../screens/pets/PetWizardStep4Screen';
import PetQRScanScreen from '../screens/pets/PetQRScanScreen';
import PetQRManualEntryScreen from '../screens/pets/PetQRManualEntryScreen';

import SitterMapViewScreen from '../screens/map/SitterMapViewScreen';


import ServicesScreen from '../screens/services/ServicesScreen';
import ServiceSearchScreen from '../screens/services/ServiceSearchScreen';
import LocationPickerScreen from '../screens/services/LocationPickerScreen';
import SearchResultsScreen from '../screens/services/SearchResultsScreen';
import SitterProfileScreen from '../screens/services/SitterProfileScreen';
import ContactSitterScreen from '../screens/services/ContactSitterScreen';
import OpenRequestsScreen from '../screens/services/OpenRequestsScreen';
import SubmitReviewScreen from '../screens/services/SubmitReviewScreen';

import ShopCoinsScreen from '../screens/financial/ShopCoinsScreen';
import PaymentMethodsScreen from '../screens/financial/PaymentMethodsScreen';
import TransactionHistoryScreen from '../screens/financial/TransactionHistoryScreen';

import ChatListScreen from '../screens/messages/ChatListScreen';
import ChatConversationScreen from '../screens/messages/ChatConversationScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationPreferencesScreen from '../screens/notifications/NotificationPreferencesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import LanguageScreen from '../screens/auth/LanguageScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import EditProfileDetailsScreen from '../screens/profile/EditProfileDetailsScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';

import ScansScreen from '../screens/scans/ScansScreen';
import ScanMapDetailScreen from '../screens/scans/ScanMapDetailScreen';

import BecomeASitterIntroScreen from '../screens/sitter/intro/BecomeASitterIntroScreen';
import VerifyIdentityScreen from '../screens/sitter/registration/VerifyIdentityScreen';

// Sitter Home Screens
import SitterHomeScreen from '../screens/sitter/home/SitterHomeScreen';
import SitterBookingsScreen from '../screens/sitter/home/SitterBookingsScreen';
import SitterRequestsScreen from '../screens/sitter/home/SitterRequestsScreen';
import SitterCalendarScreen from '../screens/sitter/home/SitterCalendarScreen';
import SitterEarningsScreen from '../screens/sitter/home/SitterEarningsScreen';
import SitterMyProfileScreen from '../screens/sitter/home/SitterProfileScreen';
import SitterPersonalProfileScreen from '../screens/sitter/profile/SitterPersonalProfileScreen';
import EReceiptScreen from '../screens/sitter/earnings/EReceiptScreen';
import ProfileSetupScreen from '../screens/sitter/registration/ProfileSetupScreen';
import BoardingSettingsScreen from '../screens/sitter/service-setup/BoardingSettingsScreen';
import HouseSittingSettingsScreen from '../screens/sitter/service-setup/HouseSittingSettingsScreen';
import DropInVisitSettingsScreen from '../screens/sitter/service-setup/DropInVisitSettingsScreen';
import DayCareSettingsScreen from '../screens/sitter/service-setup/DayCareSettingsScreen';
import PetWalkingSettingsScreen from '../screens/sitter/service-setup/PetWalkingSettingsScreen';
import BasicInfoScreen from '../screens/sitter/build-trust/profile/BasicInfoScreen';
import PhoneNumbersScreen from '../screens/sitter/build-trust/profile/PhoneNumbersScreen';
import DetailsScreen from '../screens/sitter/build-trust/profile/DetailsScreen';
import PhotosScreen from '../screens/sitter/build-trust/profile/PhotosScreen';
import PetCareInfoScreen from '../screens/sitter/build-trust/profile/PetCareInfoScreen';
import YourPetsScreen from '../screens/sitter/build-trust/profile/YourPetsScreen';

// Test Screens
import CloudinaryTestScreen from '../screens/test/CloudinaryTestScreen';
import ConnectionTestScreen from '../screens/test/ConnectionTestScreen';
import NetworkTestScreen from '../screens/test/NetworkTestScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Services" component={ServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SitterProfile" component={SitterProfileScreen} options={{ title: 'Sitter Profile' }} />
    </Stack.Navigator>
  );
}

function PetsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PetList" component={PetListScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReBookScreen" component={RebookScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SitterMapView" component={SitterMapViewScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ServicesStack() { // cleaned
  return (
    <Stack.Navigator>
      <Stack.Screen name="ServicesMain" component={ServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SitterProfile" component={SitterProfileScreen} options={{ title: 'Sitter Profile' }} />
    </Stack.Navigator>
  );
}

function MoreStack() { // cleaned
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreMain" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopCoins" component={ShopCoinsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70 + insets.bottom,
          backgroundColor: '#FFFFFF',
          shadowColor: '#99AAC5',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.38,
          paddingBottom: insets.bottom + 15,
          paddingTop: 15,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Avenir LT Std',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#32A6D8',
        tabBarInactiveTintColor: '#FFC2EB',
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Icon
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ReBookMain"
        component={BookingsStack}
        options={{
          tabBarLabel: 'Rebook',
          tabBarIcon: ({ focused, color }) => (
            <Icon
              name={focused ? 'repeat' : 'repeat'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesStack}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ focused, color }) => (
            <SearchTextIcon
              width={24}
              height={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Pets"
        component={PetsStack}
        options={{
          tabBarLabel: 'Your Pets',
          tabBarIcon: ({ focused, color }) => (
            <Icon
              name={focused ? 'paw' : 'paw-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused, color }) => (
            <GridWeb7Icon
              width={24}
              height={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Sitter Tab Navigator
function SitterTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 15,
          paddingTop: 15,
          paddingHorizontal: 10,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Avenir LT Std',
          fontWeight: '350',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#32A6D8',
        tabBarInactiveTintColor: '#FFC2EB',
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="SitterHome"
        component={SitterHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <HomeSitterActiveIcon width={24} height={24} />
            ) : (
              <HomeSitterInactiveIcon width={24} height={24} />
            ),
        }}
      />
      <Tab.Screen
        name="SitterBookings"
        component={SitterBookingsScreen}
        options={{
          tabBarLabel: 'Booking',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <BookingsSitterActiveIcon width={24} height={24} />
            ) : (
              <BookingsSitterInactiveIcon width={24} height={24} />
            ),
        }}
      />
      <Tab.Screen
        name="SitterCalendar"
        component={SitterCalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarLabelStyle: {
            fontSize: 8.77,
            fontFamily: 'Avenir LT Std',
            fontWeight: '350',
            letterSpacing: 0.18,
            marginTop: 4,
          },
          tabBarIcon: ({ focused }) =>
            focused ? (
              <CalendarSitterActiveIcon width={21.05} height={21.05} />
            ) : (
              <CalendarSitterInactiveIcon width={21.05} height={21.05} />
            ),
        }}
      />
      <Tab.Screen
        name="SitterRequests"
        component={SitterRequestsScreen}
        options={{
          tabBarLabel: 'Inbox',
          tabBarLabelStyle: {
            fontSize: 8.77,
            fontFamily: 'Avenir LT Std',
            fontWeight: '350',
            letterSpacing: 0.18,
            marginTop: 4,
          },
          tabBarIcon: ({ focused }) =>
            focused ? (
              <InboxSitterActiveIcon width={21.05} height={21.05} />
            ) : (
              <InboxSitterInactiveIcon width={21.05} height={21.05} />
            ),
        }}
      />
      <Tab.Screen
        name="SitterMore"
        component={SitterMyProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarLabelStyle: {
            fontSize: 8.77,
            fontFamily: 'Avenir LT Std',
            fontWeight: '350',
            letterSpacing: 0.18,
            marginTop: 4,
          },
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ProfileSitterActiveIcon width={21.05} height={21.05} />
            ) : (
              <ProfileSitterInactiveIcon width={21.05} height={21.05} />
            ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen name="SitterTabs" component={SitterTabNavigator} />
      {/* Modal-like screens without bottom tabs */}
      <RootStack.Screen name="Bookings" component={BookingsScreen} />
      <RootStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <RootStack.Screen name="AddPet" component={AddPetScreen} />
      <RootStack.Screen name="EditPet" component={EditPetScreen} />
      <RootStack.Screen name="PetDetail" component={PetDetailScreen} />
      <RootStack.Screen name="MyPetProfile" component={MyPetProfileScreen} />
      <RootStack.Screen name="ReportMissing" component={ReportMissingScreen} />
      <RootStack.Screen name="PetWizardStep1" component={PetWizardStep1Screen} />
      <RootStack.Screen name="PetWizardStep2" component={PetWizardStep2Screen} />
      <RootStack.Screen name="PetWizardStep3" component={PetWizardStep3Screen} />
      <RootStack.Screen name="PetWizardStep4" component={PetWizardStep4Screen} />
      <RootStack.Screen name="PetQRScan" component={PetQRScanScreen} />
      <RootStack.Screen name="PetQRManualEntry" component={PetQRManualEntryScreen} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
      <RootStack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <RootStack.Screen name="ChatList" component={ChatListScreen} />
      <RootStack.Screen name="ChatConversation" component={ChatConversationScreen} />
      {/* Service detail screens without bottom tabs */}
      <RootStack.Screen name="ServiceSearch" component={ServiceSearchScreen} />
      <RootStack.Screen name="LocationPicker" component={LocationPickerScreen} />
      <RootStack.Screen name="SearchResults" component={SearchResultsScreen} />
      <RootStack.Screen name="SitterProfile" component={SitterProfileScreen} />
      <RootStack.Screen name="ContactSitter" component={ContactSitterScreen} />
      <RootStack.Screen name="OpenRequests" component={OpenRequestsScreen} />
      <RootStack.Screen name="SubmitReview" component={SubmitReviewScreen} />
      <RootStack.Screen name="ProfileView" component={ProfileScreen} />
      <RootStack.Screen name="EditProfileDetails" component={EditProfileDetailsScreen} />
      <RootStack.Screen name="HelpSupport" component={SupportScreen} />
      <RootStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <RootStack.Screen name="ShopCoins" component={ShopCoinsScreen} />
      {/* PaymentMethods (AlohaPay) is also registered inside MoreStack —
          mirror at the root so deep-link callers like notification taps,
          which originate outside the More tab, can reach it directly. */}
      <RootStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      {/* SitterMapView is also registered inside BookingsStack — mirror
          at the root so SearchResults (a root-level screen) can reach it
          without a nested-navigate dance. */}
      <RootStack.Screen name="SitterMapView" component={SitterMapViewScreen} />
      <RootStack.Screen name="Scans" component={ScansScreen} />
      <RootStack.Screen name="ScanMapDetail" component={ScanMapDetailScreen} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
      <RootStack.Screen name="Language" component={LanguageScreen} />
      <RootStack.Screen name="BecomeASitterIntro" component={BecomeASitterIntroScreen} />
      <RootStack.Screen name="VerifyIdentity" component={VerifyIdentityScreen} />

      {/* Sitter Additional Screens (not in tabs) */}
      <RootStack.Screen name="SitterEarnings" component={SitterEarningsScreen} />
      <RootStack.Screen name="SitterMyProfile" component={SitterMyProfileScreen} />
      <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <RootStack.Screen name="BoardingSettings" component={BoardingSettingsScreen} />
      <RootStack.Screen name="HouseSittingSettings" component={HouseSittingSettingsScreen} />
      <RootStack.Screen name="DropInVisitSettings" component={DropInVisitSettingsScreen} />
      <RootStack.Screen name="DayCareSettings" component={DayCareSettingsScreen} />
      <RootStack.Screen name="PetWalkingSettings" component={PetWalkingSettingsScreen} />
      <RootStack.Screen name="BasicInfo" component={BasicInfoScreen} />
      <RootStack.Screen name="PhoneNumbers" component={PhoneNumbersScreen} />
      <RootStack.Screen name="Details" component={DetailsScreen} />
      <RootStack.Screen name="Photos" component={PhotosScreen} />
      <RootStack.Screen name="PetCareInfo" component={PetCareInfoScreen} />
      <RootStack.Screen name="YourPets" component={YourPetsScreen} />
      <RootStack.Screen name="SitterPersonalProfile" component={SitterPersonalProfileScreen} />
      <RootStack.Screen name="EReceipt" component={EReceiptScreen} />
      
      {/* Test Screens */}
      <RootStack.Screen name="CloudinaryTest" component={CloudinaryTestScreen} />
      <RootStack.Screen name="ConnectionTest" component={ConnectionTestScreen} />
      <RootStack.Screen name="NetworkTest" component={NetworkTestScreen} />
    </RootStack.Navigator>
  );
}

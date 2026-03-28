import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, DogImage, ProfileImagePersonIcon } from '../../../assets';

export default function SitterPersonalProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('info');

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper noBottomTabs>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Cover and Profile Image Section */}
        <View style={styles.profileSection}>
          <Image source={DogImage} style={styles.coverImage} />
          <View style={styles.profileImageWrapper}>
            <View style={styles.profileImageContainer}>
              <ProfileImagePersonIcon width={103} height={103} />
            </View>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Ashlyn T.</Text>
          
          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark-circle" size={17} color="#00B100" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>

          {/* Stats Row 1 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FBBC04" />
              <Text style={styles.statText}>5.0 (23 reviews)</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="people" size={16} color="#32A6D8" />
              <Text style={styles.statText}>8 repeat clients</Text>
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
              <Text style={styles.statTextGray}>Vancouver, BC</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
              Services
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'review' && styles.activeTab]}
            onPress={() => setActiveTab('review')}
          >
            <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>
              Review
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'info' && (
          <View style={styles.contentContainer}>
            {/* About Pet Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About Pet</Text>
              <Text style={styles.cardSubtitle}>
                Provide future sitters with important information about your pet's personality, behaviors, and specific care requirements.
              </Text>
              <Text style={styles.cardDescription}>
                Very active outdoors but relaxed at home. He'll sleep next to you when I'm working from home.
              </Text>
            </View>

            {/* Skills Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skills</Text>
              <View style={styles.listContainer}>
                <View style={styles.listItem}>
                  <Icon name="checkmark-circle" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>Skilled in oral medication delivery</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="checkmark-circle" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>Experienced with senior dogs</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="checkmark-circle" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>Able to provide daily exercise</Text>
                </View>
              </View>
            </View>

            {/* Home Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Home</Text>
              <View style={styles.listContainer}>
                <View style={styles.listItem}>
                  <Icon name="home" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>Resides in an apartment</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="close-circle" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>No yard available</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="close-circle" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>Smoke-free home</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="paw" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>One dog in the household</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="close-circle" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>No children in the home</Text>
                </View>
                <View style={styles.listItem}>
                  <Icon name="paw" size={20} color="#32A6D8" />
                  <Text style={styles.listText}>Only spayed/neutered dogs</Text>
                </View>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Location</Text>
              <View style={styles.listContainer}>
                <View style={styles.listItem}>
                  <Icon name="location" size={20} color="#FFC2EB" />
                  <Text style={styles.listText}>Vancouver, BC</Text>
                </View>
                <Image source={DogImage} style={styles.mapImage} />
              </View>
            </View>

            {/* Pets Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pets</Text>
              <View style={styles.petItem}>
                <Image source={DogImage} style={styles.petAvatar} />
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>Bean</Text>
                  <Text style={styles.petDetails}>
                    Beagle{'\n'}30 lbs, 3years & 7 months
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'services' && (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Services content coming soon</Text>
          </View>
        )}

        {activeTab === 'review' && (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Reviews content coming soon</Text>
          </View>
        )}
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
  profileSection: {
    height: 233,
    marginHorizontal: 24,
    marginTop: 8,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 182,
    borderRadius: 20,
  },
  profileImageWrapper: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -51.5,
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
  profileInfo: {
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingHorizontal: 24,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 13,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(203.75, 203.75, 203.75, 0.15)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderColor: '#FFC2EB',
  },
  tabText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  activeTabText: {
    color: '#32A6D8',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 13,
  },
  card: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  cardSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  cardDescription: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  listText: {
    flex: 1,
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
  },
  mapImage: {
    width: '100%',
    height: 215.43,
    borderRadius: 10,
    marginTop: 8,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  petAvatar: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  petInfo: {
    gap: 5,
  },
  petName: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20.15,
  },
  petDetails: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  placeholderText: {
    color: '#898D8F',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 40,
  },
});

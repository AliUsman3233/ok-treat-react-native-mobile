import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, MapPinIcon, SliderIcon, StarIcon, ShieldCheckIcon, CalendarNewIcon, ImageHereIcon, CoinIcon, CoinBackgroundIcon, LocationPinIcon } from '../../assets';
import SearchFilterModal from '../../components/SearchFilterModal';
import { searchSitters } from '../../services/sitterService';

export default function SearchResultsScreen({ navigation, route }) {
  const { serviceType = 'Boarding', searchParams = {} } = route?.params || {};
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sitters, setSitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log received search payload
  useEffect(() => {
    console.log('\n========================================');
    console.log('🔍 SEARCH RESULTS SCREEN - RECEIVED DATA');
    console.log('========================================');
    console.log('Service Type:', serviceType);
    console.log('----------------------------------------');
    
    if (searchParams.startDate) {
      const startDate = new Date(searchParams.startDate);
      console.log('Start Date:', startDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }));
    }
    
    if (searchParams.endDate) {
      const endDate = new Date(searchParams.endDate);
      console.log('End Date:', endDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }));
    }
    
    if (searchParams.startDate && searchParams.endDate) {
      const start = new Date(searchParams.startDate);
      const end = new Date(searchParams.endDate);
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      console.log('Duration:', nights, 'night(s)');
    }
    
    if (searchParams.location) {
      console.log('Location:', searchParams.location);
    }
    
    if (searchParams.latitude && searchParams.longitude) {
      console.log('Latitude:', searchParams.latitude);
      console.log('Longitude:', searchParams.longitude);
      console.log('Coordinates:', `${searchParams.latitude}, ${searchParams.longitude}`);
    } else {
      console.log('Coordinates: Not available');
    }
    
    console.log('----------------------------------------');
    console.log('Full Search Params:', JSON.stringify(searchParams, null, 2));
    console.log('========================================\n');
  }, [serviceType, searchParams]);

  // Fetch sitters based on search criteria
  useEffect(() => {
    const fetchSitters = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate required parameters
        if (!searchParams.latitude || !searchParams.longitude) {
          setError('Location coordinates are required');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching sitters with params:', {
          serviceType,
          latitude: searchParams.latitude,
          longitude: searchParams.longitude,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate
        });

        const response = await searchSitters(
          serviceType.toUpperCase().replace(/ /g, '_'), // Convert "Boarding" to "BOARDING"
          searchParams.latitude,
          searchParams.longitude,
          searchParams.startDate,
          searchParams.endDate,
          30 // 30km radius
        );

        console.log('✅ Sitters fetched:', response.data.count);
        console.log('📋 Sitters data:', JSON.stringify(response.data.sitters, null, 2));

        // Calculate days since last update for each sitter
        const sittersWithUpdate = response.data.sitters.map(sitter => {
          const lastUpdate = new Date(sitter.lastUpdate);
          const now = new Date();
          const daysSince = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
          
          return {
            ...sitter,
            lastUpdateDays: daysSince
          };
        });

        setSitters(sittersWithUpdate);
      } catch (err) {
        console.error('❌ Error fetching sitters:', err);
        setError(err.response?.data?.message || 'Failed to fetch sitters');
      } finally {
        setLoading(false);
      }
    };

    fetchSitters();
  }, [serviceType, searchParams]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMapView = () => {
    console.log('Open map view');
  };

  const handleFilters = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters) => {
    console.log('Applied filters:', filters);
    // Apply filters to the sitter list
  };

  const handleLocationPress = (callback) => {
    setShowFilterModal(false);
    navigation.navigate('LocationPicker', {
      onLocationSelect: (location) => {
        // Extract the address string from the location object
        const addressString = location.address || location.addressLine1 || 'Selected Location';
        callback(addressString);
        setShowFilterModal(true);
      },
    });
  };

  const handleSitterPress = (sitter) => {
    console.log('Navigating to SitterProfile with:', sitter);
    navigation.navigate('SitterProfile', { sitter, serviceType });
  };

  const renderSitterCard = ({ item }) => {
    // Determine border color based on approval status
    const borderColor = item.approvalStatus === 'REJECTED' ? '#FF0000' : '#EBEBEB';
    
    return (
      <TouchableOpacity
        style={[styles.sitterCard, { borderColor }]}
        onPress={() => handleSitterPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Top Row: Avatar, Name, Business, Distance, Coins */}
          <View style={styles.topRow}>
            <View style={styles.leftSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <ImageHereIcon width={50} height={50} fill="#CCCCCC" />
                </View>
                <View style={styles.verifiedBadge}>
                  <ShieldCheckIcon width={14} height={14} fill="#32A6D8" />
                </View>
              </View>
              <View style={styles.nameSection}>
                <Text style={styles.sitterName}>{item.name}</Text>
                <Text style={styles.businessName}>{item.business}</Text>
                <Text style={styles.distance}>{item.distance} km away</Text>
              </View>
            </View>
            <View style={styles.priceSection}>
              <View style={styles.coinRow}>
                <View style={styles.coinIconContainer}>
                  <CoinBackgroundIcon width={18} height={18} style={styles.coinBackground} />
                  <CoinIcon width={18} height={18} style={styles.coinForeground} />
                </View>
                <Text style={styles.coinAmount}>{item.coins} Coins</Text>
              </View>
              <Text style={styles.priceLabel}>total per night</Text>
            </View>
          </View>

          {/* Bottom Row: Rating, Reviews, Repeat Clients */}
          <View style={styles.bottomRow}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <StarIcon width={16} height={16} fill="#FBBC04" />
                <Text style={styles.statText}>{item.rating} ({item.reviews} reviews)</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="repeat" size={16} color="#32A6D8" />
                <Text style={styles.statText}>{item.repeatClients} repeat clients</Text>
              </View>
            </View>
            <View style={styles.updateBadge}>
              <CalendarNewIcon width={16} height={16} />
              <Text style={styles.updateText}>Last update {item.lastUpdateDays} days ago</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{serviceType}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleFilters}>
              <SliderIcon width={24} height={24} fill="pink"/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMapView}>
              <LocationPinIcon width={24} height={24} fill="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Matching Label */}
        <View style={styles.matchingContainer}>
          <Text style={styles.matchingText}>AI Enabled Matching</Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Searching for sitters...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={48} color="#FF0000" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && sitters.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={48} color="#818898" />
            <Text style={styles.emptyText}>No sitters found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        )}

        {/* Sitters List */}
        {!loading && !error && sitters.length > 0 && (
          <FlatList
            data={sitters}
            renderItem={renderSitterCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Search Filter Modal */}
      <SearchFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onLocationPress={handleLocationPress}
      />
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
    flex: 1,
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F6F8FA',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  matchingText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sitterCard: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -3,
    bottom: 15,
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
    gap: 2,
  },
  sitterName: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20.15,
  },
  businessName: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  distance: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  priceSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coinIconContainer: {
    width: 18,
    height: 18,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinBackground: {
    position: 'absolute',
  },
  coinForeground: {
    position: 'absolute',
  },
  coinAmount: {
    color: '#32A6D8',
    fontSize: 14.53,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22.52,
  },
  priceLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'right',
  },
  bottomRow: {
    gap: 6,
  },
  statsRow: {
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
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFC2EB',
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  updateText: {
    color: 'black',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    color: '#FF0000',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    color: '#0D0D12',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
  },
});

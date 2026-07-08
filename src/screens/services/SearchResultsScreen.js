import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ProfileVerifiedModal from '../../components/ProfileVerifiedModal';
import { BackArrowIcon, MapPinIcon, SliderIcon, StarIcon, ShieldCheckIcon, CalendarNewIcon, ImageHereIcon, CoinIcon, CoinBackgroundIcon, LocationPinIcon } from '../../assets';
import SearchFilterModal from '../../components/SearchFilterModal';
import { searchSitters } from '../../services/sitterService';
import { getUserPets } from '../../services/petService';
import { rankSitters } from '../../services/sitterMatching';
import { getServiceUnit } from '../../utils/serviceUnits';

export default function SearchResultsScreen({ navigation, route }) {
  const { serviceType = 'Boarding', searchParams = {} } = route?.params || {};
  // Price-label unit follows the service (per hour vs per day) — never
  // hardcode "night". serviceType arrives as a display string ("House
  // Sitting"); normalise to the enum the way the search call does.
  const priceUnit = getServiceUnit(serviceType.toUpperCase().replace(/ /g, '_')).unit;
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sitters, setSitters] = useState([]);
  const [filteredSitters, setFilteredSitters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalConfig, setStatusModalConfig] = useState({});
  const [pets, setPets] = useState([]);
  const [activePetIndex, setActivePetIndex] = useState(0);

  // Fetch user's pets once (used as ML context)
  useEffect(() => {
    (async () => {
      try {
        const res = await getUserPets();
        const list = res?.data?.pets || res?.pets || [];
        setPets(list);
      } catch (e) {
        // Non-fatal — ranking will fall back to neutral pet context
        console.log('Could not fetch pets for matching context:', e?.message);
      }
    })();
  }, []);

  const activePet = pets[activePetIndex] || null;

  // (Search params include user location — not logged in production.)

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

        const response = await searchSitters(
          serviceType.toUpperCase().replace(/ /g, '_'), // Convert "Boarding" to "BOARDING"
          searchParams.latitude,
          searchParams.longitude,
          searchParams.startDate,
          searchParams.endDate,
          30, // 30km radius
          searchParams.startTime, // "HH:mm" for hour-based services; undefined otherwise
          searchParams.endTime,
        );

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
        // Reset filtered list so ranked order shows by default after a new search
        setFilteredSitters(null);
      } catch (err) {
        console.error('❌ Error fetching sitters:', err);
        setError(err.response?.data?.message || 'Failed to fetch sitters');
      } finally {
        setLoading(false);
      }
    };

    fetchSitters();
  }, [serviceType, searchParams]);

  // Rank sitters with the edge ML matcher whenever sitters/pet changes
  const rankedSitters = useMemo(() => {
    const enumServiceType = serviceType.toUpperCase().replace(/ /g, '_');
    const baseList = filteredSitters ?? sitters;
    if (!baseList || baseList.length === 0) return [];
    return rankSitters(baseList, {
      pet: activePet,
      user: { firstTimeUser: false },
      serviceType: enumServiceType,
      maxDistance: 30,
    });
  }, [sitters, filteredSitters, activePet, serviceType]);

  const cyclePet = () => {
    if (pets.length <= 1) return;
    setActivePetIndex((i) => (i + 1) % pets.length);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMapView = () => {
    navigation.navigate('SitterMapView', { sitters, serviceType, searchParams });
  };

  const handleFilters = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters) => {
    let result = [...sitters];

    // Filter by property type
    if (filters.propertyType && filters.propertyType !== 'Any Type') {
      result = result.filter(sitter =>
        sitter.propertyType?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    // Filter by date range availability
    if (filters.startDate && filters.endDate) {
      result = result.filter(sitter => {
        if (!sitter.availableFrom && !sitter.availableTo) return true;
        const filterStart = new Date(filters.startDate);
        const filterEnd = new Date(filters.endDate);
        const sitterStart = sitter.availableFrom ? new Date(sitter.availableFrom) : new Date(0);
        const sitterEnd = sitter.availableTo ? new Date(sitter.availableTo) : new Date('2099-12-31');
        return sitterStart <= filterStart && sitterEnd >= filterEnd;
      });
    }

    // Filter by boolean sitter attributes
    if (filters.fencedYard) result = result.filter(s => s.fencedYard);
    if (filters.furnitureAllowed) result = result.filter(s => s.furnitureAllowed);
    if (filters.bedAllowed) result = result.filter(s => s.bedAllowed);
    if (filters.smokeFree) result = result.filter(s => s.smokeFree);
    if (filters.availabilityDay) result = result.filter(s => s.availabilityDay || s.fullTimeAvailability);
    if (filters.oneClient) result = result.filter(s => s.oneClient || s.oneClientAtATime);
    if (filters.bathing) result = result.filter(s => s.bathing || s.bathingGrooming);
    if (filters.firstAid) result = result.filter(s => s.firstAid || s.firstAidCertified);
    if (filters.noDog) result = result.filter(s => s.noDog || !s.hasDog);
    if (filters.noCat) result = result.filter(s => s.noCat || !s.hasCat);
    if (filters.otherPets) result = result.filter(s => s.otherPets || s.hasOtherPets);
    if (filters.unspayedFemale) result = result.filter(s => s.unspayedFemale || s.acceptsUnspayedFemale);
    if (filters.nonNeuteredMale) result = result.filter(s => s.nonNeuteredMale || s.acceptsNonNeuteredMale);
    if (filters.childrenPresent) result = result.filter(s => s.childrenPresent || s.hasChildren);
    if (filters.noChildren) result = result.filter(s => s.noChildren || !s.hasChildren);

    setFilteredSitters(result);
  };

  // Filter modal passes a callback that wants to receive the picked address
  // string. We stash it in a ref (not nav params — a function in params
  // would trip React Navigation's non-serializable warning) and consume it
  // when LocationPicker returns via the selectedLocation param below.
  const pendingLocationCallback = useRef(null);

  const handleLocationPress = (callback) => {
    pendingLocationCallback.current = callback;
    setShowFilterModal(false);
    navigation.navigate('LocationPicker', { returnScreen: 'SearchResults' });
  };

  useEffect(() => {
    const loc = route.params?.selectedLocation;
    if (!loc || !pendingLocationCallback.current) return;
    const addressString = loc.address || loc.addressLine1 || 'Selected Location';
    pendingLocationCallback.current(addressString);
    pendingLocationCallback.current = null;
    setShowFilterModal(true);
    navigation.setParams({ selectedLocation: undefined });
  }, [route.params?.selectedLocation]);

  const handleSitterPress = (sitter) => {
    if (sitter.approvalStatus === 'APPROVED') {
      navigation.navigate('SitterProfile', { sitter, serviceType, searchParams });
    } else if (sitter.approvalStatus === 'PENDING') {
      setStatusModalConfig({
        title: 'Sitter Pending',
        description: 'This sitter\'s profile is still under review and is not available for booking yet.',
        iconType: 'pending',
        buttonText: 'OK',
      });
      setShowStatusModal(true);
    } else if (sitter.approvalStatus === 'REJECTED') {
      setStatusModalConfig({
        title: 'Sitter Unavailable',
        description: 'This sitter is currently not available for booking.',
        iconType: 'error',
        buttonText: 'OK',
      });
      setShowStatusModal(true);
    }
  };

  const renderSitterCard = ({ item }) => {
    const borderColor = item.approvalStatus === 'REJECTED' ? '#FF0000'
                       : item.approvalStatus === 'PENDING' ? '#FF9800'
                       : '#EBEBEB';
    // Only approved sitters are bookable. Non-approved ones stay visible
    // but are visually dimmed + tagged so it's clear before tapping; the
    // tap itself is gated in handleSitterPress (shows an info modal).
    const isBookable = item.approvalStatus === 'APPROVED';
    const statusLabel = item.approvalStatus === 'PENDING' ? 'Under review'
                      : item.approvalStatus === 'REJECTED' ? 'Unavailable'
                      : null;

    const matchScore = item.matchScore;
    const matchTier =
      matchScore >= 90 ? { label: 'Top match', color: '#1F9E5C' }
      : matchScore >= 80 ? { label: 'Great match', color: '#32A6D8' }
      : matchScore >= 70 ? { label: 'Good match', color: '#FBBC04' }
      : null;

    return (
      <TouchableOpacity
        style={[styles.sitterCard, { borderColor }, !isBookable && styles.sitterCardDisabled]}
        onPress={() => handleSitterPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Match Score Strip */}
          {matchScore !== undefined && matchTier && (
            <View style={styles.matchHeader}>
              <View style={[styles.matchBadge, { backgroundColor: matchTier.color }]}>
                <Icon name="sparkles" size={12} color="#FFFFFF" />
                <Text style={styles.matchBadgeText}>{matchScore}% {matchTier.label}</Text>
              </View>
              {item.matchReasons?.length > 0 && (
                <Text style={styles.matchReasonsInline} numberOfLines={1}>
                  {item.matchReasons.join(' · ')}
                </Text>
              )}
            </View>
          )}

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
                {statusLabel && (
                  <Text style={styles.statusPill}>{statusLabel}</Text>
                )}
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
              <Text style={styles.priceLabel}>total per {priceUnit}</Text>
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
        <TouchableOpacity
          style={styles.matchingContainer}
          onPress={cyclePet}
          activeOpacity={pets.length > 1 ? 0.6 : 1}
        >
          <Icon name="sparkles" size={12} color="#32A6D8" style={{ marginRight: 4 }} />
          {activePet ? (
            <Text style={styles.matchingText}>
              <Text style={{ color: '#32A6D8' }}>AI Matched</Text>
              {' for '}
              <Text style={{ color: '#0D0D12', fontWeight: '600' }}>{activePet.name}</Text>
              {activePet.type ? ` · ${activePet.type}` : ''}
              {pets.length > 1 ? '  ⇄ tap to switch' : ''}
            </Text>
          ) : (
            <Text style={styles.matchingText}>AI Enabled Matching</Text>
          )}
        </TouchableOpacity>

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
        {!loading && !error && rankedSitters.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={48} color="#818898" />
            <Text style={styles.emptyText}>No sitters found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        )}

        {/* Sitters List */}
        {!loading && !error && rankedSitters.length > 0 && (
          <FlatList
            data={rankedSitters}
            renderItem={renderSitterCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Sitter Status Modal */}
      <ProfileVerifiedModal
        visible={showStatusModal}
        onNext={() => setShowStatusModal(false)}
        title={statusModalConfig.title}
        description={statusModalConfig.description}
        buttonText={statusModalConfig.buttonText}
        iconType={statusModalConfig.iconType}
      />

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  matchingText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    flexShrink: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
    lineHeight: 14,
  },
  matchReasonsInline: {
    flex: 1,
    color: '#818898',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
    lineHeight: 16,
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
  sitterCardDisabled: {
    opacity: 0.55,
  },
  statusPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    color: '#B54708',
    backgroundColor: '#FFF4E5',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
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

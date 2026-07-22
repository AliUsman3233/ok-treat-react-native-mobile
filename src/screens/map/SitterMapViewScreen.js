import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { getNearbySitters } from '../../services/sitterService';

const DEFAULT_FILTERS = {
  service: 'all',          // 'all' | 'PET_WALKING' | 'BOARDING' | ...
  minRating: 0,            // 0 | 4
  distance: '10',          // mile radius for fetch
  availableToday: false,
};

export default function SitterMapViewScreen({ navigation, route }) {
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [sitters, setSitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const fetchSitters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const latitude = route?.params?.latitude;
      const longitude = route?.params?.longitude;
      if (latitude == null || longitude == null) {
        setSitters([]);
        setError('Location unavailable. Please search from the Services tab.');
        return;
      }
      const radius = parseFloat(filters.distance) || 10;
      const response = await getNearbySitters(latitude, longitude, radius);
      // Body is { success, data: { sitters } } — reach into data.sitters.
      const data =
        response?.data?.sitters ||
        response?.sitters ||
        (Array.isArray(response?.data) ? response.data : null) ||
        (Array.isArray(response) ? response : []);
      const sittersArray = Array.isArray(data) ? data : [];
      setSitters(sittersArray.map(s => ({
        id: s.id || s._id,
        name: s.fullName || s.name || 'Sitter',
        rating: s.averageRating || s.rating || 0,
        reviews: s.totalReviews || s.reviews || 0,
        distance: s.distance ? `${s.distance} mi` : '',
        lat: s.latitude || s.location?.coordinates?.[1] || 0,
        lng: s.longitude || s.location?.coordinates?.[0] || 0,
        services: s.services || [],
        price: s.price || s.rate || 0,
      })));
    } catch (err) {
      console.error('Failed to fetch nearby sitters:', err);
      setError('Failed to load nearby sitters. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.distance, route?.params?.latitude, route?.params?.longitude]);

  useEffect(() => {
    fetchSitters();
  }, [fetchSitters]);

  // Client-side filters applied on top of the fetched list
  const visibleSitters = useMemo(() => {
    return sitters.filter((s) => {
      if (filters.minRating > 0 && (s.rating || 0) < filters.minRating) return false;
      if (filters.service !== 'all') {
        const services = Array.isArray(s.services) ? s.services : [];
        const match = services.some((v) =>
          String(v).toUpperCase().includes(filters.service)
        );
        if (!match) return false;
      }
      // availableToday: best-effort — if sitter exposes selectedDays, check today
      if (filters.availableToday && Array.isArray(s.selectedDays) && s.selectedDays.length > 0) {
        const todayCode = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date().getDay()];
        if (!s.selectedDays.includes(todayCode)) return false;
      }
      return true;
    });
  }, [sitters, filters]);

  // Filter-chip toggles
  const toggleServiceFilter = () => {
    const cycle = ['all', 'PET_WALKING', 'BOARDING', 'HOUSE_SITTING', 'DROP_IN', 'DAY_CARE'];
    const i = cycle.indexOf(filters.service);
    setFilters((f) => ({ ...f, service: cycle[(i + 1) % cycle.length] }));
  };
  const toggleRatingFilter = () => setFilters((f) => ({ ...f, minRating: f.minRating === 4 ? 0 : 4 }));
  const toggleDistanceFilter = () => setFilters((f) => ({ ...f, distance: f.distance === '5' ? '10' : '5' }));
  const toggleAvailabilityFilter = () => setFilters((f) => ({ ...f, availableToday: !f.availableToday }));

  // Map controls — adjust radius (zoom proxy) + recenter
  const zoomIn = () => setFilters((f) => ({ ...f, distance: String(Math.max(1, parseFloat(f.distance) / 2)) }));
  const zoomOut = () => setFilters((f) => ({ ...f, distance: String(Math.min(50, parseFloat(f.distance) * 2)) }));
  const recenter = () => fetchSitters();

  // Gear icon — clear-all confirmation
  const openSettings = () => {
    const dirty =
      filters.service !== 'all' || filters.minRating !== 0 ||
      filters.distance !== '10' || filters.availableToday;
    if (!dirty) {
      Alert.alert('No active filters', 'All sitters within range are shown.');
      return;
    }
    Alert.alert(
      'Clear all filters?',
      'Reset to show all sitters within a 10 mile radius.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setFilters(DEFAULT_FILTERS) },
      ]
    );
  };

  const Wrapper = Platform.OS === 'web' ? 'div' : View;
  const ScrollWrapper = Platform.OS === 'web' ? 'div' : ScrollView;
  const wrapperStyle = Platform.OS === 'web' 
    ? { display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', backgroundColor: '#F8F9FA' }
    : styles.container;

  return (
    <Wrapper style={wrapperStyle}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sitters Near You</Text>
        <TouchableOpacity onPress={openSettings}>
          <Text style={styles.filterButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>Showing {visibleSitters.length} of {sitters.length} sitters within {filters.distance} miles</Text>

          {/* Map Markers Simulation */}
          <View style={styles.markersContainer}>
            {visibleSitters.map((sitter, index) => (
              <TouchableOpacity
                key={sitter.id}
                style={[
                  styles.marker,
                  { top: `${20 + index * 15}%`, left: `${30 + index * 10}%` },
                  selectedSitter?.id === sitter.id && styles.markerSelected
                ]}
                onPress={() => setSelectedSitter(sitter)}
              >
                <Text style={styles.markerText}>📍</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Text style={styles.controlIcon}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Text style={styles.controlIcon}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={recenter}>
            <Text style={styles.controlIcon}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filters.service !== 'all' && styles.filterChipActive]}
            onPress={toggleServiceFilter}
          >
            <Text style={[styles.filterChipText, filters.service !== 'all' && styles.filterChipTextActive]}>
              {filters.service === 'all' ? 'All Services' : filters.service.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filters.minRating === 4 && styles.filterChipActive]}
            onPress={toggleRatingFilter}
          >
            <Text style={[styles.filterChipText, filters.minRating === 4 && styles.filterChipTextActive]}>
              4+ Stars
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filters.distance === '5' && styles.filterChipActive]}
            onPress={toggleDistanceFilter}
          >
            <Text style={[styles.filterChipText, filters.distance === '5' && styles.filterChipTextActive]}>
              Within {filters.distance} mi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filters.availableToday && styles.filterChipActive]}
            onPress={toggleAvailabilityFilter}
          >
            <Text style={[styles.filterChipText, filters.availableToday && styles.filterChipTextActive]}>
              Available Today
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sitters List */}
      <ScrollWrapper style={Platform.OS === 'web' ? { flex: 1, overflowY: 'auto' } : styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Finding sitters near you...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSitters}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visibleSitters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {sitters.length === 0
                ? 'No sitters found nearby'
                : 'No sitters match your filters. Tap the gear icon to clear them.'}
            </Text>
          </View>
        ) : (
        <View style={styles.sittersList}>
          {visibleSitters.map(sitter => (
            <TouchableOpacity
              key={sitter.id}
              style={[
                styles.sitterCard,
                selectedSitter?.id === sitter.id && styles.sitterCardSelected
              ]}
              onPress={() => {
                setSelectedSitter(sitter);
                navigation.navigate('SitterProfile', { sitterId: sitter.id });
              }}
            >
              <View style={styles.sitterAvatar}>
                <Text style={styles.sitterAvatarText}>👤</Text>
              </View>
              <View style={styles.sitterInfo}>
                <Text style={styles.sitterName}>{sitter.name}</Text>
                <View style={styles.sitterRating}>
                  <Text style={styles.ratingStars}>⭐ {sitter.rating}</Text>
                  <Text style={styles.ratingReviews}>({sitter.reviews})</Text>
                </View>
                <View style={styles.sitterServices}>
                  {sitter.services.map((service, idx) => (
                    <View key={idx} style={styles.serviceBadge}>
                      <Text style={styles.serviceBadgeText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.sitterMeta}>
                <Text style={styles.sitterDistance}>📍 {sitter.distance}</Text>
                <Text style={styles.sitterPrice}>{sitter.price} coins/day</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        )}
      </ScrollWrapper>

      {/* Bottom Action */}
      {selectedSitter && (
        <View style={styles.bottomAction}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{selectedSitter.name}</Text>
            <Text style={styles.selectedDistance}>{selectedSitter.distance} away</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => navigation.navigate('SitterProfile', { sitterId: selectedSitter.id })}
          >
            <Text style={styles.viewButtonText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    fontSize: 24,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#666',
  },
  markersContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.3 }],
  },
  markerText: {
    fontSize: 32,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlIcon: {
    fontSize: 20,
  },
  filtersBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sittersList: {
    padding: 20,
    gap: 12,
  },
  sitterCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sitterCardSelected: {
    borderColor: '#FF6B6B',
  },
  sitterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sitterAvatarText: {
    fontSize: 32,
  },
  sitterInfo: {
    flex: 1,
  },
  sitterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sitterRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    fontSize: 14,
    color: '#FF9800',
    marginRight: 4,
  },
  ratingReviews: {
    fontSize: 13,
    color: '#999',
  },
  sitterServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sitterMeta: {
    alignItems: 'flex-end',
  },
  sitterDistance: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  sitterPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  bottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedDistance: {
    fontSize: 13,
    color: '#666',
  },
  viewButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

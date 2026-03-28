import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

export default function SitterMapViewScreen({ navigation }) {
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [filters, setFilters] = useState({
    service: 'all',
    rating: 'all',
    distance: '10',
  });

  const sitters = [
    { id: 1, name: 'Sarah M.', rating: 4.9, reviews: 127, distance: '0.8 mi', lat: 40.7580, lng: -73.9855, services: ['Walking', 'Boarding'], price: 25 },
    { id: 2, name: 'Mike T.', rating: 4.8, reviews: 89, distance: '1.2 mi', lat: 40.7614, lng: -73.9776, services: ['Day Care', 'Drop-In'], price: 30 },
    { id: 3, name: 'Emma L.', rating: 5.0, reviews: 156, distance: '1.5 mi', lat: 40.7489, lng: -73.9680, services: ['Boarding', 'House Sitting'], price: 35 },
    { id: 4, name: 'John D.', rating: 4.7, reviews: 73, distance: '2.1 mi', lat: 40.7678, lng: -73.9812, services: ['Walking', 'Day Care'], price: 28 },
  ];

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
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.filterButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>Showing {sitters.length} sitters within {filters.distance} miles</Text>
          
          {/* Map Markers Simulation */}
          <View style={styles.markersContainer}>
            {sitters.map((sitter, index) => (
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
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>All Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>4+ Stars</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Within 5 mi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Available Today</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sitters List */}
      <ScrollWrapper style={Platform.OS === 'web' ? { flex: 1, overflowY: 'auto' } : styles.scrollView}>
        <View style={styles.sittersList}>
          {sitters.map(sitter => (
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
});

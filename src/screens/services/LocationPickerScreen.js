import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, FlatList, Dimensions, Animated, Easing } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowIcon, LocationPinIcon, SliderIcon, SearchTextIcon, NextArrowIcon, CoinIcon, CoinBackgroundIcon, StarIcon } from '../../assets';
import { Button } from '../../components';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getNearbySitters } from '../../services/sitterService';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const { width } = Dimensions.get('window');
const RADIUS_KM = 30; // 30km radius

export default function LocationPickerScreen({ navigation, route }) {
  const appAlert = useAppAlert();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState({
    latitude: 49.2827,
    longitude: -123.1207,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbySitters, setNearbySitters] = useState([]);
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [selectedSitterIndex, setSelectedSitterIndex] = useState(-1);
  const [markerKey, setMarkerKey] = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef(null);
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch nearby sitters from API
  const fetchNearbySitters = async (latitude, longitude) => {
    try {
      setLoading(true);
      const response = await getNearbySitters(latitude, longitude, RADIUS_KM);
      
      if (response.success) {
        const sittersWithFormattedData = response.data.sitters.map(sitter => ({
          ...sitter,
          distance: `${sitter.distance} km away`,
          lastUpdate: new Date(sitter.lastUpdate).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));
        
        setNearbySitters(sittersWithFormattedData);
        setSelectedSitter(null);
        setSelectedSitterIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching nearby sitters:', error);
      setNearbySitters([]);
      setSelectedSitter(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Force marker re-render when selection changes
    setMarkerKey(prev => prev + 1);
  }, [selectedSitter]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        appAlert('Permission Denied', 'Location permission is required to use this feature', 'error');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);
      setMarkerPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      await reverseGeocode(location.coords.latitude, location.coords.longitude);
      await fetchNearbySitters(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      appAlert('Error', 'Failed to get current location', 'error');
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const address = result[0];
        // Build complete address string
        const addressParts = [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ].filter(Boolean);

        const formattedAddress = addressParts.join(', ');
        setSelectedAddress(formattedAddress || 'Selected Location');
        setSearchQuery(formattedAddress || 'Selected Location');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setSelectedAddress('Selected Location');
      setSearchQuery('Selected Location');
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    await reverseGeocode(latitude, longitude);
    await fetchNearbySitters(latitude, longitude);
  };

  const handleSitterMarkerPress = (sitter) => {
    const index = nearbySitters.findIndex(s => s.id === sitter.id);
    setSelectedSitterIndex(index);
    setSelectedSitter(sitter);
  };

  const handleNextSitter = () => {
    if (selectedSitterIndex < nearbySitters.length - 1) {
      const nextIndex = selectedSitterIndex + 1;
      setSelectedSitterIndex(nextIndex);
      setSelectedSitter(nearbySitters[nextIndex]);
    }
  };

  const handlePrevSitter = () => {
    if (selectedSitterIndex > 0) {
      const prevIndex = selectedSitterIndex - 1;
      setSelectedSitterIndex(prevIndex);
      setSelectedSitter(nearbySitters[prevIndex]);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleConfirm = async () => {
    if (markerPosition) {
      try {
        console.log('📍 Marker position:', markerPosition);
        
        // Get detailed address components
        const result = await Location.reverseGeocodeAsync({
          latitude: markerPosition.latitude,
          longitude: markerPosition.longitude
        });
        
        console.log('🔍 Reverse geocode result:', JSON.stringify(result, null, 2));
        
        if (result.length > 0) {
          const address = result[0];
          console.log('📋 Address object:', JSON.stringify(address, null, 2));
          console.log('📋 Address fields:');
          console.log('  - streetNumber:', address.streetNumber);
          console.log('  - street:', address.street);
          console.log('  - city:', address.city);
          console.log('  - region:', address.region);
          console.log('  - postalCode:', address.postalCode);
          console.log('  - country:', address.country);
          
          const locationData = {
            address: selectedAddress || 'Selected Location',
            addressLine1: `${address.streetNumber || ''} ${address.street || ''}`.trim() || selectedAddress,
            city: address.city || '',
            state: address.region || '',
            zipCode: address.postalCode || '',
            country: address.country || '',
            latitude: markerPosition.latitude,
            longitude: markerPosition.longitude
          };
          
          console.log('✅ Location data to return:', JSON.stringify(locationData, null, 2));
          console.log('✅ Location data fields:');
          console.log('  - address:', locationData.address);
          console.log('  - addressLine1:', locationData.addressLine1);
          console.log('  - city:', locationData.city);
          console.log('  - state:', locationData.state);
          console.log('  - zipCode:', locationData.zipCode);
          console.log('  - country:', locationData.country);
          
          // Check if we have a callback or need to navigate back with params
          if (route.params?.onLocationSelect) {
            console.log('📤 Using onLocationSelect callback');
            route.params.onLocationSelect(locationData);
            navigation.goBack();
            return;
          } else if (route.params?.returnScreen) {
            console.log('📤 Navigating to:', route.params.returnScreen, 'with params:', { selectedLocation: locationData });
            // Navigate back to the return screen with location data
            navigation.navigate(route.params.returnScreen, { selectedLocation: locationData });
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error getting address details:', error);
      }
    }
    navigation.goBack();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      appAlert('Empty Search', 'Please enter a location to search', 'pending');
      return;
    }

    Keyboard.dismiss();
    setShowPredictions(false);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        setMarkerPosition({ latitude, longitude });
        await reverseGeocode(latitude, longitude);
        await fetchNearbySitters(latitude, longitude);
      } else {
        appAlert('Not Found', 'Location not found. Please try a different search.', 'pending');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      appAlert('Error', 'Failed to search location', 'error');
    }
  };

  const fetchPlacePredictions = async (input) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.predictions) {
        setPredictions(data.predictions);
        setShowPredictions(true);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handlePredictionSelect = async (placeId, description) => {
    setSearchQuery(description);
    setShowPredictions(false);
    setPredictions([]);
    Keyboard.dismiss();

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        setMarkerPosition({ latitude: lat, longitude: lng });
        await reverseGeocode(lat, lng);
        await fetchNearbySitters(lat, lng);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      appAlert('Error', 'Failed to get location details', 'error');
    }
  };

  // Searching animation
  const startSearchAnimation = () => {
    const createBounce = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -8, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    createBounce(dot1Anim, 0).start();
    createBounce(dot2Anim, 150).start();
    createBounce(dot3Anim, 300).start();
    pulse.start();
  };

  const stopSearchAnimation = () => {
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();
    pulseAnim.stopAnimation();
    dot1Anim.setValue(0);
    dot2Anim.setValue(0);
    dot3Anim.setValue(0);
    pulseAnim.setValue(1);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If text is too short, clear and stop
    if (!text || text.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      setIsSearching(false);
      stopSearchAnimation();
      return;
    }

    // Show searching state with animation
    setIsSearching(true);
    setShowPredictions(true);
    setPredictions([]);
    startSearchAnimation();

    // Debounce: wait 3 seconds after user stops typing
    debounceTimer.current = setTimeout(async () => {
      await fetchPlacePredictions(text);
      setIsSearching(false);
      stopSearchAnimation();
    }, 3000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      stopSearchAnimation();
    };
  }, []);

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{route.params?.serviceTitle || 'Select Location'}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <LocationPinIcon width={24} height={24} fill="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <SliderIcon width={24} height={24} fill="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchTextIcon width={20} height={20} fill="#898D8F" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              placeholderTextColor="#B0B0B0"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          {/* Searching Animation / Predictions Dropdown */}
          {showPredictions && (
            <View style={styles.predictionsContainer}>
              {isSearching ? (
                <Animated.View style={[styles.searchingContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.searchingDots}>
                    <Animated.View style={[styles.searchDot, styles.searchDot1, { transform: [{ translateY: dot1Anim }] }]} />
                    <Animated.View style={[styles.searchDot, styles.searchDot2, { transform: [{ translateY: dot2Anim }] }]} />
                    <Animated.View style={[styles.searchDot, styles.searchDot3, { transform: [{ translateY: dot3Anim }] }]} />
                  </View>
                  <Text style={styles.searchingTitle}>Finding places...</Text>
                  <Text style={styles.searchingSubtitle}>Collecting and organizing results</Text>
                </Animated.View>
              ) : predictions.length > 0 ? (
                <FlatList
                  data={predictions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.predictionItem}
                      onPress={() => handlePredictionSelect(item.place_id, item.description)}
                    >
                      <LocationPinIcon width={16} height={16} fill="#32A6D8" />
                      <Text style={styles.predictionText}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.predictionsList}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No places found</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={true}
        >
          {markerPosition && (
            <>
              {/* 30km radius circle */}
              <Circle
                center={markerPosition}
                radius={RADIUS_KM * 1000}
                fillColor="rgba(50, 166, 216, 0.1)"
                strokeColor="rgba(50, 166, 216, 0.5)"
                strokeWidth={2}
              />

              {/* Selected location marker */}
              <Marker coordinate={markerPosition}>
                <LocationPinIcon width={30} height={30} fill="#FF0000" />
              </Marker>
            </>
          )}

          {nearbySitters.map((sitter) => {
            const isSelected = selectedSitter?.id === sitter.id;

            let markerColor;
            if (sitter.approvalStatus === 'REJECTED') {
              markerColor = isSelected ? "#FF0000" : "#FF6B6B";
            } else if (sitter.approvalStatus === 'PENDING') {
              markerColor = isSelected ? "#FFA500" : "#FFB84D";
            } else if (sitter.approvalStatus === 'APPROVED') {
              markerColor = isSelected ? "#32A6D8" : "#FFC2EB";
            } else {
              markerColor = isSelected ? "#808080" : "#B0B0B0";
            }

            return (
              <Marker
                key={`${sitter.id}-${markerKey}`}
                coordinate={{ latitude: sitter.latitude, longitude: sitter.longitude }}
                onPress={() => handleSitterMarkerPress(sitter)}
                pinColor={markerColor}
              />
            );
          })}
        </MapView>

        {/* No Sitters Message */}
        {!loading && nearbySitters.length === 0 && markerPosition && (
          <View style={styles.noSittersContainer}>
            <Text style={styles.noSittersText}>No sitters in this area</Text>
            <Text style={styles.noSittersSubtext}>Try searching in a different location</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding nearby sitters...</Text>
          </View>
        )}

        {/* Sitter Card - Shows when pin is tapped */}
        {selectedSitter && (
          <View style={[styles.sitterCardContainer, { bottom: 100 + insets.bottom }]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePrevSitter}
              disabled={selectedSitterIndex === 0}
            >
              <BackArrowIcon width={20} height={20} fill={selectedSitterIndex === 0 ? "#CCC" : "#32A6D8"} />
            </TouchableOpacity>

            <View style={styles.sitterCard}>
              <View style={styles.sitterInfo}>
                <View style={styles.sitterNameRow}>
                  <Text style={styles.sitterName}>{selectedSitter.name}</Text>
                  {selectedSitter.approvalStatus && (
                    <View style={[
                      styles.statusBadge,
                      selectedSitter.approvalStatus === 'APPROVED' && styles.statusApproved,
                      selectedSitter.approvalStatus === 'REJECTED' && styles.statusRejected,
                      selectedSitter.approvalStatus === 'PENDING' && styles.statusPending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: selectedSitter.approvalStatus === 'APPROVED' ? '#4CAF50' : 
                                 selectedSitter.approvalStatus === 'REJECTED' ? '#F44336' : '#FF9800' }
                      ]}>
                        {selectedSitter.approvalStatus}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sitterDistance}>{selectedSitter.distance}</Text>
                <View style={styles.ratingRow}>
                  <StarIcon width={16} height={16} />
                  <Text style={styles.ratingText}>{selectedSitter.rating} ({selectedSitter.reviews} reviews)</Text>
                </View>
                <Text style={styles.updateText}>Last update: {selectedSitter.lastUpdate}</Text>
              </View>
              <View style={styles.priceSection}>
                <View style={styles.coinContainer}>
                  <CoinBackgroundIcon width={19} height={19} style={styles.coinBackground} />
                  <CoinIcon width={13} height={13} style={styles.coinIconStyle} />
                </View>
                <Text style={styles.priceText}>{selectedSitter.price}</Text>
                <Text style={styles.priceLabel}>per night</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextSitter}
              disabled={selectedSitterIndex === nearbySitters.length - 1}
            >
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <BackArrowIcon width={20} height={20} fill={selectedSitterIndex === nearbySitters.length - 1 ? "#CCC" : "#32A6D8"} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Confirm Button */}
        {/* <View style={[styles.buttonContainer, { bottom: insets.bottom }]}> */}
        <Button
          title="Confirm Location"
          onPress={handleConfirm}
          fullWidth
          size='medium'
          style={styles.buttonContainer}
          disabled={!markerPosition}
        />
        {/* </View> */}
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
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
    zIndex: 10,
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
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerActions: {
    width: 106,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F6F8FA',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 9,
  },
  searchBar: {
    height: 48,
    backgroundColor: '#F6F8FA',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#0D0D12',
    outlineStyle: 'none',
  },
  predictionsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },
  predictionsList: {
    borderRadius: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F8FA',
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#0D0D12',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  searchingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  searchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  searchDot1: {
    backgroundColor: '#32A6D8',
  },
  searchDot2: {
    backgroundColor: '#FFC2EB',
  },
  searchDot3: {
    backgroundColor: '#F38FB4',
  },
  searchingTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  searchingSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    backgroundColor: '#F6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapFallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapFallbackTitle: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#191919',
    marginBottom: 8,
  },
  mapFallbackText: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 22,
  },
  sitterCardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
    zIndex: 1000,
  },
  navButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  sitterCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sitterInfo: {
    flex: 1,
    paddingRight: 12,
  },
  sitterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sitterName: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusRejected: {
    backgroundColor: '#FFEBEE',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#4CAF50',
  },
  sitterDistance: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  ratingText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  updateText: {
    color: '#818898',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 4,
  },
  priceSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinContainer: {
    width: 19,
    height: 19,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  coinBackground: {
    position: 'absolute',
  },
  coinIconStyle: {
    position: 'absolute',
  },
  priceText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  priceLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    width: width* 0.9,
    marginHorizontal: width * 0.05,
   
  },
  noSittersContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noSittersText: {
    color: '#0D0D12',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noSittersSubtext: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
  },
});

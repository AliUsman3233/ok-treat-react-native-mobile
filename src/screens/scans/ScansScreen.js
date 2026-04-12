import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { getUserScans } from '../../services/scanService';

const dogImage = require('../../assets/images/dog_image.png');

export default function ScansScreen({ navigation }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      setError(null);
      const response = await getUserScans();
      if (response.data && response.data.scans) {
        setScans(response.data.scans);
      } else if (response.scans) {
        setScans(response.scans);
      } else if (Array.isArray(response.data)) {
        setScans(response.data);
      } else if (Array.isArray(response)) {
        setScans(response);
      } else {
        setScans([]);
      }
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError('Failed to load scans');
      setScans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScans();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleScanPress = (scan) => {
    navigation.navigate('ScanMapDetail', { scan });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
  };

  const renderScanCard = useCallback(({ item: scan }) => {
    const hasLocation = scan.latitude && scan.longitude;

    return (
      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => handleScanPress(scan)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Map or Pet Image */}
          <View style={styles.imageContainer}>
            {hasLocation ? (
              <MapView
                style={styles.scanMap}
                initialRegion={{
                  latitude: parseFloat(scan.latitude),
                  longitude: parseFloat(scan.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                liteMode={true}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(scan.latitude),
                    longitude: parseFloat(scan.longitude),
                  }}
                />
              </MapView>
            ) : (
              <Image
                source={scan.pet?.photoUrl ? { uri: scan.pet.photoUrl } : dogImage}
                style={styles.petImage}
              />
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.scanTitle}>
              {scan.pet?.name ? `${scan.pet.name} Scanned` : 'Tag Scanned'}
            </Text>
            <Text style={styles.scanDateTime}>
              {formatDate(scan.scannedAt)}  |  {formatTime(scan.scannedAt)}
            </Text>
            {scan.city && (
              <Text style={styles.scanLocation}>{scan.city}{scan.country ? `, ${scan.country}` : ''}</Text>
            )}
          </View>

          {/* Arrow */}
          <Icon name="chevron-forward" size={20} color="#040404" />
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scans</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Scans List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Loading scans...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchScans(); }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : scans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Scans Yet</Text>
            <Text style={styles.emptyText}>Scans of your pet's QR codes will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={scans}
            renderItem={renderScanCard}
            keyExtractor={(item, index) => item.id || `scan-${index}`}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            windowSize={3}
            maxToRenderPerBatch={5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#32A6D8']}
                tintColor="#32A6D8"
              />
            }
          />
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 12,
  },
  scanCard: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    padding: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    width: 63,
    height: 53,
    borderRadius: 8,
    overflow: 'hidden',
  },
  scanMap: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    gap: 6,
  },
  scanTitle: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  scanDateTime: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  scanLocation: {
    color: '#32A6D8',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 16,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#0D0D12',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    textAlign: 'center',
  },
  retryText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginTop: 8,
  },
});

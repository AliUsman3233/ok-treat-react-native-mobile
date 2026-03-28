import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BackArrowIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getPetByQRCode } from '../../services/petService';
import { createScan } from '../../services/scanService';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Dynamically import jsQR for web
let jsQR = null;
if (isWeb) {
  import('jsqr').then(module => {
    jsQR = module.default;
  });
}

// Web QR Scanner Component using HTML5
const WebQRScanner = ({ onScan, scanning }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          // Start scanning after video is ready
          setTimeout(() => {
            scanQRCode();
          }, 500);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    const scanQRCode = () => {
      if (!scanning || !jsQR) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (canvas.width > 0 && canvas.height > 0) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to detect QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code && code.data) {
            console.log('QR Code detected:', code.data);
            onScan({ type: 'QR_CODE', data: code.data });
            return;
          }
        }
      }

      // Continue scanning
      if (scanning) {
        scanIntervalRef.current = requestAnimationFrame(scanQRCode);
      }
    };

    if (isWeb) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        cancelAnimationFrame(scanIntervalRef.current);
      }
    };
  }, [scanning, onScan]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.webVideoContainer}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </View>
  );
};

export default function PetQRScanScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const { fromScreen } = route.params || {};

  useEffect(() => {
    // On web, we'll handle permissions through getUserMedia
    if (isWeb) {
      return;
    }

    // Request permission if not already granted
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (scanning) {
      // Animate scanning line up and down
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [scanning, scanLineAnim]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setScanning(false);
    console.log(`QR code scanned! Type: ${type}, Data: ${data}`);
    
    // Extract QR code from URL format: https://gondal.com/qr?qr-code=3356525125
    let qrCode = data;
    try {
      const url = new URL(data);
      const qrCodeParam = url.searchParams.get('qr-code');
      if (qrCodeParam) {
        qrCode = qrCodeParam;
      }
    } catch (error) {
      // If it's not a valid URL, use the data as is
      console.log('Not a URL format, using raw data:', data);
    }
    
    // Get current location
    let locationData = {};
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0]?.street || address[0]?.name || '',
          city: address[0]?.city || '',
          country: address[0]?.country || '',
        };
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
    
    // Check if we're coming from HomeScreen (to view pet details) or from AddPet (to link QR)
    if (fromScreen === 'Home') {
      // Fetch pet data and navigate to PetDetailScreen
      setLoading(true);
      try {
        const response = await getPetByQRCode(qrCode);
        
        // Record the scan
        try {
          await createScan({
            qrCode,
            ...locationData,
          });
        } catch (scanError) {
          console.error('Error recording scan:', scanError);
          // Don't block the flow if scan recording fails
        }
        
        setLoading(false);
        
        if (response.data && response.data.pet) {
          // Navigate to PetDetailScreen with pet data
          navigation.navigate('PetDetail', { 
            petData: response.data.pet,
            qrCode: qrCode 
          });
        } else {
          // No pet found
          setErrorMessage('No pet is linked with this QR code. Please check and try again.');
          setShowErrorModal(true);
        }
      } catch (error) {
        setLoading(false);
        console.error('Error fetching pet by QR:', error);
        setErrorMessage(error.message || 'Failed to fetch pet details. Please try again.');
        setShowErrorModal(true);
      }
    } else {
      // Original behavior: navigate back with QR code for AddPet flow
      const returnScreen = navigation.getState()?.routes?.find(r => r.name === 'PetQRScan')?.params?.returnScreen;
      
      setTimeout(() => {
        if (returnScreen) {
          navigation.navigate(returnScreen, { qrCode });
        } else {
          navigation.goBack();
        }
      }, 500);
    }
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setScanned(false);
    setScanning(true);
  };

  const handleCannotScan = () => {
    navigation.navigate('PetQRManualEntry');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <TouchableOpacity style={styles.manualButton} onPress={handleCannotScan}>
            <Text style={styles.manualButtonText}>Enter code manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140], // Move from top to bottom of scanner area
  });

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>

      {/* Scanner Container */}
      <View style={styles.scannerWrapper}>
        <View style={styles.scannerContainer}>
          {/* Camera Feed - Web or Native */}
          {isWeb ? (
            <WebQRScanner onScan={handleBarCodeScanned} scanning={scanning} />
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
          )}
          
          {/* Scanner Frame Overlay */}
          <View style={styles.scannerFrame}>
            {/* Scanning Line */}
            {scanning && (
              <Animated.View 
                style={[
                  styles.scanningLine,
                  {
                    transform: [{ translateY: scanLineTranslateY }]
                  }
                ]} 
              />
            )}
          </View>
        </View>

        {/* Scanning Status */}
        <LinearGradient
          colors={['rgba(50, 166, 216, 0.18)', 'rgba(238, 238, 238, 0.18)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statusContainer}
        >
          <Text style={styles.statusText}>
            {scanning ? 'Scanning...' : 'Scanned!'}
          </Text>
        </LinearGradient>
      </View>

      {/* Cannot Scan Link */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleCannotScan}>
          <Text style={styles.cannotScanText}>
            <Text style={styles.cannotScanRed}>Can't Scan? </Text>
            <Text style={styles.cannotScanBlue}>Click here</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#32A6D8" />
          <Text style={styles.loadingText}>Fetching pet details...</Text>
        </View>
      )}

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={handleErrorModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            <View style={styles.modalTextContainer}>
              <Text style={styles.modalTitle}>No Pet Found</Text>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity style={styles.okButton} onPress={handleErrorModalClose}>
              <Text style={styles.okButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: width * 0.064,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
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
  scannerWrapper: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 10,
    gap: 43,
  },
  scannerContainer: {
    width: width * 0.9,
    height: height * 0.55,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(166, 166, 166, 0.34)',
  },
  webVideoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  scannerFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  scanningLine: {
    width: width * 0.87,
    height: 3,
    backgroundColor: '#FFC2EB',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    borderRadius: 40,
  },
  statusContainer: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  cannotScanText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    lineHeight: 21.7,
  },
  cannotScanRed: {
    color: '#E96D6D',
    fontWeight: '350',
  },
  cannotScanBlue: {
    color: '#32A6D8',
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#090E12',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#E96D6D',
    textAlign: 'center',
  },
  manualButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#32A6D8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.064,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 342,
    alignItems: 'center',
    gap: 30,
  },
  errorIconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 66,
  },
  modalTextContainer: {
    width: '100%',
    gap: 10,
  },
  modalTitle: {
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#043334',
    textAlign: 'center',
    lineHeight: 25.2,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18.2,
  },
  okButton: {
    width: width * 0.7,
    height: 40,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  okButtonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
    textAlign: 'center',
  },
});

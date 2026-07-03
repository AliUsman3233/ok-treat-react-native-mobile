import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, Modal, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { BackArrowIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getPetByQRCode } from '../../services/petService';
import { createScan } from '../../services/scanService';
import { extractQRCode } from '../../utils/qrCode';
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

// ─── Web QR Scanner ─────────────────────────────────────────
const WebQRScanner = ({ onScan, scanning }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const rafRef = useRef(null);
  const lastScanRef = useRef(0);

  // Start/stop the scan loop based on `scanning` prop
  const scanLoop = useCallback(() => {
    if (!scanning || !jsQR) return;

    const now = Date.now();
    if (now - lastScanRef.current < 300) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    lastScanRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const w = Math.min(video.videoWidth, 480);
      const h = Math.min(video.videoHeight, 360);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      const code = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        onScan({ type: 'QR_CODE', data: code.data });
        return; // Stop loop after successful scan
      }
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [scanning, onScan]);

  // Initialize camera once on mount
  useEffect(() => {
    if (!isWeb) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Start/restart scan loop whenever `scanning` changes to true
  useEffect(() => {
    if (scanning && streamRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scanLoop);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [scanning, scanLoop]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.webVideoContainer}>
      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted autoPlay />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────
export default function PetQRScanScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('No Pet Found');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const processingRef = useRef(false);
  const locationPermRef = useRef(null); // Cache location permission status
  const { fromScreen, currentQrCode } = route.params || {};

  // The "public scan" flow — user tapped Scan-a-QR from Home to look up
  // someone else's pet. We gate this on location permission so the owner's
  // scan-alert email includes where their pet was found. The link flow
  // (from Add/Edit Pet) skips the gate because it doesn't fire the email.
  const isPublicScan = fromScreen === 'Home';
  // 'checking' | 'granted' | 'denied' — only meaningful when isPublicScan.
  const [locationStatus, setLocationStatus] = useState(isPublicScan ? 'checking' : 'granted');
  const [requestingLocation, setRequestingLocation] = useState(false);

  // Reset on focus
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setScanning(true);
      setLoading(false);
      processingRef.current = false;
      return () => setScanning(false);
    }, [])
  );

  useEffect(() => {
    if (!isWeb && !permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  // Pre-request location permission on mount so the prompt doesn't appear
  // mid-scan. For the public scan flow we gate the camera behind this —
  // no location, no scanner UI.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        locationPermRef.current = status;
        if (isPublicScan) setLocationStatus(status === 'granted' ? 'granted' : 'denied');
      } catch (_) {
        locationPermRef.current = 'denied';
        if (isPublicScan) setLocationStatus('denied');
      }
    })();
  }, [isPublicScan]);

  const retryLocationPermission = async () => {
    setRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      locationPermRef.current = status;
      setLocationStatus(status === 'granted' ? 'granted' : 'denied');
    } catch (_) {
      setLocationStatus('denied');
    } finally {
      setRequestingLocation(false);
    }
  };

  const openLocationSettings = () => {
    // OS-level settings — on Android+iOS this opens the app's permission
    // page where the user can flip the location toggle on.
    Linking.openSettings().catch(() => {});
  };

  // Scan line animation
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanLineAnim.stopAnimation();
    }
  }, [scanning, scanLineAnim]);

  // Fire-and-forget location + scan record (never blocks navigation)
  // Only called AFTER we confirm the QR code is valid
  const recordScanInBackground = (qrCode) => {
    (async () => {
      const recordScan = (extra) =>
        createScan({ qrCode, ...extra }).catch((err) =>
          console.warn('Scan record failed:', err?.message)
        );
      try {
        if (locationPermRef.current !== 'granted') {
          recordScan({});
          return;
        }
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
        ]);
        let addressData = {};
        try {
          const addr = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          addressData = { address: addr[0]?.street || '', city: addr[0]?.city || '', country: addr[0]?.country || '' };
        } catch (e) {
          console.warn('Reverse geocode failed:', e?.message);
        }
        recordScan({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, ...addressData });
      } catch (e) {
        console.warn('Scan location lookup failed:', e?.message);
        recordScan({});
      }
    })();
  };

  const showError = (title, message) => {
    setLoading(false);
    setScanning(false);
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleBarCodeScanned = useCallback(({ data }) => {
    if (processingRef.current) return;
    processingRef.current = true;

    // Stop the camera from firing more events while the async validation runs;
    // without this, additional emits can slip through during the navigate-back
    // window and trigger a second API call → second navigate → crash.
    setScanned(true);
    setScanning(false);
    setLoading(true);

    const qrCode = extractQRCode(data);

    if (fromScreen === 'Home') {
      getPetByQRCode(qrCode)
        .then((response) => {
          if (response.data?.pet) {
            // Record scan only for valid, linked QR codes
            recordScanInBackground(qrCode);
            navigation.navigate('PetDetail', { petData: response.data.pet, qrCode });
          } else {
            showError('No Pet Found', 'No pet is linked with this QR code. Please check and try again.');
          }
        })
        .catch((err) => {
          // Show specific error messages based on backend reason
          const reason = err?.reason;
          if (reason === 'DEACTIVATED') {
            showError('Tag Deactivated', 'This QR tag has been deactivated and is no longer valid.');
          } else if (reason === 'NOT_LINKED') {
            showError('Tag Not Linked', 'This QR tag is not linked to any pet yet.');
          } else if (reason === 'INVALID_FORMAT') {
            showError('Invalid QR Code', 'This doesn\'t appear to be a valid OkTreat QR code.');
          } else {
            showError('Error', err?.message || 'Failed to fetch pet details. Please try again.');
          }
        });
    } else {
      // AddPet/EditPet link flow — pre-validate so the user finds out about
      // bad codes here, not 4 steps later at Save.
      // Note: don't reset processingRef here — useFocusEffect resets it when
      // the scanner regains focus. Leaving it true during the unmount window
      // prevents a second nav call from a stale event.
      const returnWithCode = () => {
        setLoading(false);
        const returnScreen = navigation.getState()?.routes?.find(r => r.name === 'PetQRScan')?.params?.returnScreen;
        if (returnScreen) {
          navigation.navigate({ name: returnScreen, params: { qrCode }, merge: true });
        } else {
          navigation.goBack();
        }
      };

      // Re-scanning the code already linked to this pet (EditPet) is a no-op accept
      if (currentQrCode && qrCode === currentQrCode) {
        returnWithCode();
        return;
      }

      getPetByQRCode(qrCode)
        .then((response) => {
          // 200 = code is CONNECTED to some pet. We've already ruled out "this pet" above.
          if (response.data?.pet) {
            showError('Already Linked', 'This QR tag is already linked to another pet. Please use a different code.');
          } else {
            returnWithCode();
          }
        })
        .catch((err) => {
          const reason = err?.reason;
          // NOT_LINKED = registered but free; NOT_FOUND = unregistered/legacy code — both OK to link
          if (reason === 'NOT_LINKED' || reason === 'NOT_FOUND') {
            returnWithCode();
          } else if (reason === 'DEACTIVATED') {
            showError('Tag Deactivated', 'This QR tag has been deactivated and cannot be linked.');
          } else if (reason === 'INVALID_FORMAT') {
            showError('Invalid QR Code', 'This doesn\'t appear to be a valid OkTreat QR code.');
          } else {
            showError('Error', err?.message || 'Failed to validate this QR code. Please try again.');
          }
        });
    }
  }, [fromScreen, currentQrCode, navigation]);

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
    setErrorTitle('No Pet Found');
    setLoading(false);
    setScanned(false);
    setScanning(true);
    processingRef.current = false;
  };

  // Forward link-flow context (returnScreen, currentQrCode) so the manual
  // entry screen knows whether it's looking up someone else's pet (lookup
  // mode) or linking a tag during Add/Edit Pet (link mode). Without this
  // the manual entry treats NOT_LINKED as an error even when the user is
  // trying to claim a fresh tag.
  const handleCannotScan = () => {
    const returnScreen = navigation.getState()?.routes?.find(r => r.name === 'PetQRScan')?.params?.returnScreen;
    navigation.replace('PetQRManualEntry', { returnScreen, currentQrCode });
  };
  const handleBack = () => navigation.goBack();

  // Permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}><BackArrowIcon width={20} height={20} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#32A6D8" />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}><BackArrowIcon width={20} height={20} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <Text style={styles.permissionSubtext}>Please enable camera permission in your device settings</Text>
          <TouchableOpacity style={styles.retryPermBtn} onPress={requestPermission}>
            <Text style={styles.retryPermBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualButton} onPress={handleCannotScan}>
            <Text style={styles.manualButtonText}>Enter code manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Location gate — public scan flow only. Blocks the camera until the
  // user grants location so the owner's scan-alert email includes where
  // their pet was found.
  if (isPublicScan && locationStatus !== 'granted') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}><BackArrowIcon width={20} height={20} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          {locationStatus === 'checking' ? (
            <>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.permissionText}>Checking location…</Text>
            </>
          ) : (
            <>
              <Text style={styles.permissionText}>Location required</Text>
              <Text style={styles.permissionSubtext}>
                Please enable location so the pet's owner knows where their tag was scanned. This helps reunite lost pets faster.
              </Text>
              <TouchableOpacity style={styles.retryPermBtn} onPress={retryLocationPermission} disabled={requestingLocation}>
                <Text style={styles.retryPermBtnText}>
                  {requestingLocation ? 'Requesting…' : 'Enable Location'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.manualButton} onPress={openLocationSettings}>
                <Text style={styles.manualButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  });

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}><BackArrowIcon width={20} height={20} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.scannerWrapper}>
          <View style={styles.scannerContainer}>
            {isWeb ? (
              <WebQRScanner onScan={handleBarCodeScanned} scanning={scanning} />
            ) : (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
            )}

            <View style={styles.scannerFrame}>
              {scanning && (
                <Animated.View style={[styles.scanningLine, { transform: [{ translateY: scanLineTranslateY }] }]} />
              )}
            </View>
          </View>

          <LinearGradient
            colors={['rgba(50, 166, 216, 0.18)', 'rgba(238, 238, 238, 0.18)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusContainer}
          >
            <Text style={styles.statusText}>
              {loading ? 'QR Detected! Fetching details...' : scanning ? 'Point camera at QR code' : 'Scan complete'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCannotScan}>
            <Text style={styles.cannotScanText}>
              <Text style={styles.cannotScanRed}>Can't Scan? </Text>
              <Text style={styles.cannotScanBlue}>Click here</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Fetching pet details...</Text>
          </View>
        )}

        <Modal visible={showErrorModal} transparent animationType="fade" onRequestClose={handleErrorModalClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorIcon}>&#x26A0;&#xFE0F;</Text>
              </View>
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>{errorTitle}</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: width * 0.064, paddingTop: 10, paddingBottom: 10, backgroundColor: '#FFFFFF',
  },
  backButton: { width: 40, height: 40, borderRadius: 999, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500', lineHeight: 24.8 },
  placeholder: { width: 40 },
  scannerWrapper: { flex: 1, paddingHorizontal: width * 0.05, paddingTop: 10, gap: 43 },
  scannerContainer: {
    width: width * 0.9, height: height * 0.55, borderRadius: 10, overflow: 'hidden',
    backgroundColor: 'rgba(166, 166, 166, 0.34)',
  },
  webVideoContainer: { width: '100%', height: '100%', backgroundColor: '#000000' },
  scannerFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1, pointerEvents: 'none' },
  scanningLine: {
    width: width * 0.87, height: 3, backgroundColor: '#FFC2EB',
    shadowColor: '#FF0000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15,
    elevation: 8, borderRadius: 40,
  },
  statusContainer: { height: 40, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 52, justifyContent: 'center', alignItems: 'center' },
  statusText: { textAlign: 'center', color: '#32A6D8', fontSize: 16, fontFamily: 'Avenir LT Std', fontWeight: '600', lineHeight: 24.8 },
  footer: { paddingBottom: 40, alignItems: 'center' },
  cannotScanText: { textAlign: 'center', fontSize: 14, fontFamily: 'Avenir LT Std', lineHeight: 21.7 },
  cannotScanRed: { color: '#E96D6D', fontWeight: '350' },
  cannotScanBlue: { color: '#32A6D8', fontWeight: '700' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  permissionText: { fontSize: 16, fontFamily: 'Avenir LT Std', fontWeight: '600', color: '#090E12', textAlign: 'center' },
  permissionSubtext: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 8 },
  retryPermBtn: { width: '100%', height: 50, backgroundColor: '#32A6D8', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  retryPermBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '400', color: '#E96D6D', textAlign: 'center' },
  manualButton: { width: '100%', height: 50, backgroundColor: '#F5F5F5', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  manualButtonText: { color: '#32A6D8', fontSize: 16, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingText: { marginTop: 12, color: '#FFFFFF', fontSize: 16, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: width * 0.064 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, width: '100%', maxWidth: 342, alignItems: 'center', gap: 30 },
  errorIconContainer: { width: 74, height: 74, justifyContent: 'center', alignItems: 'center' },
  errorIcon: { fontSize: 66 },
  modalTextContainer: { width: '100%', gap: 10 },
  modalTitle: { fontSize: 21, fontFamily: 'Poppins', fontWeight: '600', color: '#043334', textAlign: 'center', lineHeight: 25.2 },
  modalMessage: { fontSize: 14, fontFamily: 'Urbanist', fontWeight: '400', color: '#888888', textAlign: 'center', lineHeight: 18.2 },
  okButton: { width: width * 0.7, height: 40, backgroundColor: '#FFC2EB', borderRadius: 52, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  okButtonText: { color: '#32A6D8', fontSize: 16, fontFamily: 'Avenir LT Std', fontWeight: '600', lineHeight: 24.8, textAlign: 'center' },
});

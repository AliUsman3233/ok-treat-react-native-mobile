import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import SplashIcon from '../../assets/icons/splash.svg';
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';

const { width, height } = Dimensions.get('window');

/**
 * SplashScreen - App launch screen
 * 
 * Shows the OkTreat logo and tagline for 2 seconds
 * Then automatically navigates to Language or Main app
 * 
 * SVG Icon Setup:
 * 1. Place your splash logo SVG in: src/assets/icons/splash-logo.svg
 * 2. Install: npm install react-native-svg react-native-svg-transformer
 * 3. Uncomment the import above
 * 4. Replace the emoji with <SplashIcon /> component below
 */

export default function SplashScreen({ onServerReady }) {
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      
      console.log('🔍 Checking server at:', API_ENDPOINTS.STATUS);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(API_ENDPOINTS.STATUS, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Server response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server status:', data);
        setServerStatus('online');
        
        // Server is online, proceed after a short delay
        setTimeout(() => {
          if (onServerReady) {
            onServerReady();
          }
        }, 500);
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Server check failed:', error.message);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        url: API_ENDPOINTS.STATUS,
      });
      setServerStatus('offline');
      setShowErrorModal(true);
    }
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    setRetryCount(retryCount + 1);
    
    // Retry after a short delay
    setTimeout(() => {
      checkServerStatus();
    }, 1000);
  };

  const handleSkip = () => {
    setShowErrorModal(false);
    setServerStatus('online'); // Proceed anyway
    if (onServerReady) {
      onServerReady();
    }
  };

  return (
    <ScreenWrapper
      scrollable={false}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Icon - Centered */}
        <View style={styles.logoArea}>
          <SplashIcon 
            width={width * 0.53} 
            height={height * 0.37} 
            preserveAspectRatio="xMidYMid meet"
          />
          
          {/* Loading indicator */}
          {serverStatus === 'checking' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Connecting to server...</Text>
            </View>
          )}
        </View>
        
        {/* Version - Bottom */}
        <View style={styles.versionContainer}>
          <Text style={styles.version}>Version 0.0.1</Text>
        </View>
      </View>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            
            <Text style={styles.modalTitle}>Server is Offline</Text>
            <Text style={styles.modalMessage}>
              Unable to connect to the server. Please check your internet connection or try again later.
            </Text>
            
            {retryCount > 0 && (
              <Text style={styles.retryText}>Retry attempt: {retryCount}</Text>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.retryButton]} 
                onPress={handleRetry}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.skipButton]} 
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>Continue Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFC2EB', // Primary brand color
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 300,
    height: 200,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    // Add shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#676869',
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 21.70,
    marginTop: 20,
  },
  versionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 40,
  },
  version: {
    color: '#676869',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 21.70,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#676869',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#043334',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryText: {
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    color: '#32A6D8',
    marginBottom: 16,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#32A6D8',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
  },
  skipButtonText: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
});

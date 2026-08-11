import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Application from 'expo-application';
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';

const splashVideo = require('../../assets/media/splash_video.mp4');

// Real installed app version + build, read from the native package at runtime
// (Android versionName / versionCode from build.gradle). Falls back to a
// constant only if the native value is unavailable, so it never shows blank.
const APP_VERSION = Application.nativeApplicationVersion || '1.0.4';
const APP_BUILD = Application.nativeBuildVersion || '';
const VERSION_LABEL = APP_BUILD
  ? `Version ${APP_VERSION} (${APP_BUILD})`
  : `Version ${APP_VERSION}`;

// Safety: never wait on the video forever — if `playToEnd` doesn't fire
// (load error, codec issue), advance after this many ms regardless.
const VIDEO_FALLBACK_MS = 8000;

export default function SplashScreen({ onServerReady }) {
  const [serverStatus, setServerStatus] = useState('checking');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [videoFinished, setVideoFinished] = useState(false);
  const advancedRef = useRef(false);

  const videoPlayer = useVideoPlayer(splashVideo, (player) => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    const sub = videoPlayer.addListener('playToEnd', () => {
      setVideoFinished(true);
    });
    const fallback = setTimeout(() => setVideoFinished(true), VIDEO_FALLBACK_MS);
    return () => {
      sub.remove();
      clearTimeout(fallback);
    };
  }, [videoPlayer]);

  useEffect(() => {
    checkServerStatus();
  }, []);

  useEffect(() => {
    if (advancedRef.current) return;
    if (serverStatus === 'online' && videoFinished) {
      advancedRef.current = true;
      onServerReady && onServerReady();
    }
  }, [serverStatus, videoFinished, onServerReady]);

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
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Server check failed:', error.message);
      setServerStatus('offline');
      setShowErrorModal(true);
    }
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    setRetryCount(retryCount + 1);
    setTimeout(() => {
      checkServerStatus();
    }, 1000);
  };

  const handleSkip = () => {
    setShowErrorModal(false);
    if (advancedRef.current) return;
    advancedRef.current = true;
    setServerStatus('online');
    onServerReady && onServerReady();
  };

  return (
    <View style={styles.container}>
      <VideoView
        player={videoPlayer}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />

      <View style={styles.versionContainer}>
        <Text style={styles.version}>{VERSION_LABEL}</Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC2EB',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  version: {
    color: '#676869',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 21.70,
    textAlign: 'center',
  },
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

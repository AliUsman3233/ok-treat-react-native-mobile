import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import React, { useState } from 'react';
import { BackArrowIcon } from '../../assets';
import { Input, Button } from '../../components';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getPetByQRCode } from '../../services/petService';
import { createScan } from '../../services/scanService';
import { extractQRCode } from '../../utils/qrCode';

const { width, height } = Dimensions.get('window');

export default function PetQRManualEntryScreen({ navigation }) {
  const alert = useAppAlert();
  const [tagId, setTagId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    // Accept pasted URLs by running input through the same extractor the scanner uses
    const code = extractQRCode(tagId);
    if (!code || code.length < 4 || !/^[A-Z0-9-]+$/i.test(code)) {
      alert('Invalid Tag ID', 'Please enter a valid tag ID (e.g., OKTREAT-A1B2C3).', 'pending');
      return;
    }

    setLoading(true);
    try {
      const response = await getPetByQRCode(code);
      if (response.data?.pet) {
        // Record the scan in background
        createScan({ qrCode: code }).catch(() => {});
        navigation.replace('PetDetail', { petData: response.data.pet, qrCode: code });
      } else {
        alert('No Pet Found', 'No pet is linked with this tag ID. Please check and try again.', 'pending');
      }
    } catch (err) {
      const reason = err?.reason;
      if (reason === 'DEACTIVATED') {
        alert('Tag Deactivated', 'This QR tag has been deactivated and is no longer valid.', 'pending');
      } else if (reason === 'NOT_LINKED') {
        alert('Tag Not Linked', 'This QR tag is not linked to any pet yet.', 'pending');
      } else if (reason === 'INVALID_FORMAT') {
        alert('Invalid QR Code', "This doesn't appear to be a valid OkTreat QR code.", 'pending');
      } else {
        alert('Error', err?.message || 'Failed to look up this tag. Please try again.', 'pending');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Tag ID</Text>
          <View style={styles.placeholder} />
        </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Tag Image */}
        <Image
          source={require('../../assets/images/qr_placeholder_image.png')}
          style={styles.tagImage}
          resizeMode="contain"
        />

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <Input
            type="text"
            placeholder="OKTREAT-A1B2C3"
            value={tagId}
            onChangeText={setTagId}
            containerStyle={styles.input}
          />
        </View>

        {/* Submit Button */}
        <Button
          title={loading ? 'Looking up...' : 'Submit'}
          onPress={handleSubmit}
          fullWidth
          size="medium"
          disabled={!tagId.trim() || loading}
        />
      </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.064,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
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
    opacity: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    alignItems: 'center',
  },
  tagImage: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    marginBottom: 0,
    borderColor: '#FFC2EB',
    borderWidth: 2,
  },
});

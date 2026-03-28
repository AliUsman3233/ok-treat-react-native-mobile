import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { Button } from '../../../../components';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import ImagePickerButton from '../../../../components/ImagePickerButton';
import { BackArrowIcon, CameraIconbroken } from '../../../../assets';
import { uploadToCloudinary } from '../../../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../../../config/cloudinary';
import { getBuildTrustSection, upsertBuildTrustSection } from '../../../../services/buildTrustService';

export default function PhotosScreen({ navigation }) {
  const [petPhotos, setPetPhotos] = useState([]);
  const [coverPhoto, setCoverPhoto] = useState('');
  const [uploadingPet, setUploadingPet] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchPhotos();
    }, [])
  );

  const fetchPhotos = async () => {
    try {
      const response = await getBuildTrustSection('PHOTOS');
      
      if (response.success && response.data.exists && response.data.settings) {
        const settings = response.data.settings;
        setPetPhotos(settings.petPhotos || []);
        setCoverPhoto(settings.coverPhoto || '');
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const handlePetPhotoSelected = async (imageUri) => {
    try {
      setUploadingPet(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.PROFILES);
      const photoUrl = result.url;
      
      // Add to pet photos array
      setPetPhotos([...petPhotos, photoUrl]);
      
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingPet(false);
    }
  };

  const handleCoverPhotoSelected = async (imageUri) => {
    try {
      setUploadingCover(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.PROFILES);
      const photoUrl = result.url;
      
      // Set cover photo
      setCoverPhoto(photoUrl);
      
      Alert.alert('Success', 'Cover photo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemovePetPhoto = (index) => {
    const newPhotos = petPhotos.filter((_, i) => i !== index);
    setPetPhotos(newPhotos);
  };

  const handleRemoveCoverPhoto = () => {
    setCoverPhoto('');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate at least one pet photo
      if (petPhotos.length === 0) {
        Alert.alert('Required', 'Please add at least one photo with pets');
        return;
      }
      
      // Prepare settings data
      const settings = {
        petPhotos,
        coverPhoto
      };
      
      // Save to backend
      const response = await upsertBuildTrustSection('PHOTOS', settings, true);
      
      if (response.success) {
        // Navigate to next screen (PetCareInfo)
        navigation.navigate('PetCareInfo');
      } else {
        Alert.alert('Error', 'Failed to save photos. Please try again.');
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert('Error', 'Failed to save photos. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackPress = () => {
    setShowUnsavedModal(true);
  };

  const handleCancelLeave = () => {
    setShowUnsavedModal(false);
  };

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    navigation.goBack();
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Photos</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photos with Pets Section */}
          <View style={styles.card}>
            <Text style={styles.helperText}>
              Share photos of you with pets (your own or others) to highlight the care you give. Try to include shots of walking or playing with them. Aim for 5–10 of your favorite photos.
            </Text>

            {/* Display uploaded pet photos */}
            {petPhotos.length > 0 && (
              <View style={styles.photosGrid}>
                {petPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemovePetPhoto(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <ImagePickerButton onImageSelected={handlePetPhotoSelected}>
              <View style={styles.uploadButton}>
                {uploadingPet ? (
                  <>
                    <ActivityIndicator size="small" color="#32A6D8" />
                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <CameraIconbroken width={20} height={20} />
                    <Text style={styles.uploadButtonText}>Add Photo</Text>
                  </>
                )}
              </View>
            </ImagePickerButton>
          </View>

          {/* Cover Photo Section */}
          <View style={styles.card}>
            <Text style={styles.helperText}>
              Add a cover Photo
            </Text>

            {/* Display cover photo */}
            {coverPhoto && (
              <View style={styles.coverPhotoContainer}>
                <Image source={{ uri: coverPhoto }} style={styles.coverPhotoImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveCoverPhoto}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            <ImagePickerButton onImageSelected={handleCoverPhotoSelected}>
              <View style={styles.uploadButton}>
                {uploadingCover ? (
                  <>
                    <ActivityIndicator size="small" color="#32A6D8" />
                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <CameraIconbroken width={20} height={20} />
                    <Text style={styles.uploadButtonText}>{coverPhoto ? 'Change Photo' : 'Add Photo'}</Text>
                  </>
                )}
              </View>
            </ImagePickerButton>
          </View>
        </ScrollView>

        {/* Unsaved Changes Modal */}
        <UnsavedChangesModal
          visible={showUnsavedModal}
          onCancel={handleCancelLeave}
          onLeave={handleConfirmLeave}
        />

        {/* Save Button */}
        <View style={styles.bottomButtonContainer}>
          <Button
            title={isSaving ? "Saving..." : "Save & Continue"}
            onPress={handleSave}
            type="secondary"
            size="large"
            fullWidth
            disabled={isSaving || uploadingPet || uploadingCover}
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
  },
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 12,
  },
  helperText: {
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 16,
  },
  uploadButton: {
    height: 129,
    padding: 20,
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFC2EB',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  uploadButtonText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

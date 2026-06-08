import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import React from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import { PawFilledIcon, CameraFillIcon, ScanAltIcon } from '../../assets';
import { Dropdown } from '../../components';
import ImagePickerButton from '../../components/ImagePickerButton';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { useKeyboardHeight } from '../../utils/useKeyboardHeight';

const { width } = Dimensions.get('window');

export default function PetWizardStep4Screen({ formData, setFormData, navigation, route }) {
  const alert = useAppAlert();
  const [uploading, setUploading] = React.useState(false);
  const keyboardHeight = useKeyboardHeight();

  // Determine which screen to return to based on whether we're in add or edit mode
  const isEditMode = route?.params?.petId || formData?.id;
  const returnScreen = isEditMode ? 'EditPet' : 'AddPet';

  const handleScanQR = () => {
    navigation.navigate('PetQRScan', { returnScreen, currentQrCode: formData?.qrCode || null });
  };

  const handleImageSelected = async (imageUri) => {
    try {
      setUploading(true);
      const result = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.PETS);
      
      // Add to photos array
      const currentPhotos = formData?.photos || [];
      setFormData({ 
        ...formData, 
        photos: [...currentPhotos, result.url] 
      });
      alert('Success', 'Photo uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload Failed', error.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = formData?.photos?.filter((_, i) => i !== index) || [];
            setFormData({ ...formData, photos: updatedPhotos });
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + keyboardHeight }]}
      showsVerticalScrollIndicator={true}
      bounces={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Text */}
      <Text style={styles.headerText}>
        Add details about your pet's health and care providers
      </Text>

      {/* Health & Care Card */}
      <View style={styles.formCard}>
        {/* Veterinary Info */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Veterinary Info</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add your vet's name, address and phone number"
            placeholderTextColor="rgba(137, 141, 143, 0.60)"
            value={formData?.veterinaryInfo || ''}
            onChangeText={(text) => setFormData({ ...formData, veterinaryInfo: text })}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Pet Insurance Provider */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Pet insurance provider</Text>
          <Dropdown
            placeholder="Select a provider"
            value={formData?.insuranceProvider || ''}
            onSelect={(value) => setFormData({ ...formData, insuranceProvider: value })}
            options={[
              'Nationwide',
              'Trupanion',
              'Embrace',
              'ASPCA',
              'Petplan',
              'Healthy Paws',
              'Figo',
              'Lemonade',
              'Spot',
              'Pumpkin',
              'ManyPets',
              'Other',
              'No insurance'
            ]}
            rightIcon={<Icon name="chevron-down" size={16} color="#3B1153" />}
            containerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
          />
        </View>

        {/* Link QR */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Link the QR</Text>
          <Text style={styles.fieldSubtext}>
            This helps you track your pet info all in one place
          </Text>
          
          <View style={styles.qrInputContainer}>
            <TextInput
              style={styles.qrInput}
              placeholder="Scan QR code to link"
              placeholderTextColor="rgba(137, 141, 143, 0.60)"
              value={formData?.qrCode || ''}
              editable={false}
            />
            <TouchableOpacity
              style={styles.scanIconButton}
              onPress={handleScanQR}
            >
              <ScanAltIcon width={24} height={24} color="#32A6D8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Photo Gallery Section */}
      <View style={styles.photoGallerySection}>
        <View style={styles.photoGalleryHeader}>
          <View style={styles.photoGalleryTitleRow}>
            <PawFilledIcon width={27} height={27} color="#32A6D8" />
            <Text style={styles.photoGalleryTitle}>Photo Gallery</Text>
          </View>
          <Text style={styles.photoGallerySubtext}>
            Show off your pet through photos
          </Text>
        </View>

        {/* Photo Upload Card */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Add photos</Text>
          
          {/* Uploaded Photos Grid */}
          {formData?.photos && formData.photos.length > 0 && (
            <View style={styles.photosGrid}>
              {formData.photos.map((photoUrl, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photoUrl }} style={styles.photoImage} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Icon name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Upload Button */}
          <ImagePickerButton onImageSelected={handleImageSelected}>
            <View style={styles.photoUploadButton}>
              {uploading ? (
                <View style={styles.photoUploadContent}>
                  <ActivityIndicator size="small" color="#32A6D8" />
                  <Text style={styles.photoUploadText}>Uploading...</Text>
                </View>
              ) : (
                <View style={styles.photoUploadContent}>
                  <View style={styles.cameraIconWrapper}>
                    <CameraFillIcon width={20} height={20} color="#666D80" />
                  </View>
                  <Text style={styles.photoUploadText}>Upload Pet Photo</Text>
                </View>
              )}
            </View>
          </ImagePickerButton>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  headerText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    color: '#090E12',
    fontFamily: 'Avenir LT Std',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  fieldSubtext: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  textArea: {
    height: 119,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    color: '#090E12',
    lineHeight: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    outlineStyle: 'none',
  },
  dropdownContainer: {
    marginBottom: 0,
    height: 56,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dropdownText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  qrInputContainer: {
    height: 56,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  qrInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#090E12',
    lineHeight: 20,
    outlineStyle: 'none',
  },
  scanIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGallerySection: {
    gap: 16,
  },
  photoGalleryHeader: {
    gap: 4,
  },
  photoGalleryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoGalleryTitle: {
    color: '#0D0D12',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  photoGallerySubtext: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1,
  },
  photoUploadButton: {
    height: 101,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  photoUploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  cameraIconWrapper: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoUploadText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  photoItem: {
    width: (width - 72) / 3,
    height: (width - 72) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
});

import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import React from 'react';
import { CameraIcon, PawFilledIcon, DogFaceIcon, CatFaceIcon } from '../../assets';
import { Input, Dropdown } from '../../components';
import ImagePickerButton from '../../components/ImagePickerButton';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function PetWizardStep1Screen({ formData, setFormData }) {
  const alert = useAppAlert();
  const [uploading, setUploading] = React.useState(false);

  const handleImageSelected = async (imageUri) => {
    try {
      setUploading(true);
      const result = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.PETS);
      setFormData({ ...formData, photo: result.url });
      alert('Success', 'Pet photo uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload Failed', error.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      bounces={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Photo Upload */}
      <ImagePickerButton onImageSelected={handleImageSelected}>
        <View style={styles.photoUploadContainer}>
          <ImageBackground
            source={formData.photo ? { uri: formData.photo } : require('../../assets/images/Pet_default_image.png')}
            style={styles.photoBackground}
            imageStyle={styles.photoBackgroundImage}
          >
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#32A6D8" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : (
              <View style={styles.photoUploadContent}>
                <View style={styles.cameraIconWrapper}>
                  <CameraIcon width={24.44} height={24.44} />
                </View>
                <Text style={styles.uploadPhotoText}>
                  {formData.photo ? 'Change Photo' : 'Upload Pet Photo'}
                </Text>
              </View>
            )}
          </ImageBackground>
        </View>
      </ImagePickerButton>

      {/* Form Section */}
      <View style={styles.formSection}>
        {/* Header */}
        <View style={styles.formHeader}>
          <View style={styles.formHeaderTitle}>
            <PawFilledIcon width={27} height={27} color="#32A6D8" />
            <Text style={styles.formTitle}>Pet details</Text>
          </View>
          <Text style={styles.formSubtitle}>
            Provide your sitter with a description of your pet
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Pet Type Dropdown */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              What type of pet <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.petTypeDropdownWrapper}>
              <Dropdown
                placeholder="Select pet type"
                value={formData.petType}
                onSelect={(value) => setFormData({ ...formData, petType: value })}
                options={['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Reptile', 'Hamster', 'Guinea Pig', 'Other']}
                leftIcon={
                  // formData.petType === 'Dog' ? (
                  //   <DogFaceIcon width={32} height={32} color="#FFFFFF" />
                  // ) : formData.petType === 'Cat' ? (
                  //   <CatFaceIcon width={32} height={32} color="#FFFFFF" />
                  // ) : (
                  <Icon name="paw" height={16} size={16} color="#FFFFFF" />
                  // )
                }
                rightIcon={<Icon name="chevron-down" size={10} color="#FFFFFF" />}
                containerStyle={styles.petTypeDropdown}
                textStyle={styles.petTypeText}
              />
            </View>
          </View>

          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Name <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <Input
              type="text"
              placeholder="e.g., Buddy"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              containerStyle={styles.inputContainer}
            />
          </View>

          {/* Weight and Breed Row */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Weight (lbs)</Text>
              <Input
                type="number"
                placeholder="e.g., 25"
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                containerStyle={styles.inputContainer}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Breed (s)</Text>
              <Input
                type="text"
                placeholder="e.g., Golden Retriever"
                value={formData.breed}
                onChangeText={(text) => setFormData({ ...formData, breed: text })}
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>

          {/* Age Row */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Age (Yr.)</Text>
              <Input
                type="number"
                placeholder="e.g., 3"
                keyboardType="numeric"
                value={formData.ageYears}
                onChangeText={(text) => setFormData({ ...formData, ageYears: text })}
                containerStyle={styles.inputContainer}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Age (Mo.)</Text>
              <Input
                type="number"
                placeholder="e.g., 6"
                keyboardType="numeric"
                value={formData.ageMonths}
                onChangeText={(text) => setFormData({ ...formData, ageMonths: text })}
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>

          {/* Sex Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Sex</Text>
            <View style={styles.rowFields}>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  formData.sex === 'Male' && styles.sexButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, sex: 'Male' })}
              >
                <Text
                  style={[
                    styles.sexButtonText,
                    formData.sex === 'Male' && styles.sexButtonTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  formData.sex === 'Female' && styles.sexButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, sex: 'Female' })}
              >
                <Text
                  style={[
                    styles.sexButtonText,
                    formData.sex === 'Female' && styles.sexButtonTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  },
  photoUploadContainer: {
    height: 182,
    width: width * 0.9,
    marginHorizontal: width * 0.05,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  photoBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBackgroundImage: {
    borderRadius: 20,
  },
  photoUploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  cameraIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 48.89,
    borderWidth: 1.22,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPhotoText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: 'Avenir LT Std',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18.6,
  },
  uploadingOverlay: {
    alignItems: 'center',
    gap: 12,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: width * 0.05,
    gap: 5,
  },
  formHeader: {
    gap: 4,
    marginBottom: 7,
  },
  formHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  formTitle: {
    color: '#0D0D12',
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24.8,
  },
  formSubtitle: {
    color: '#818898',
    textAlign: 'left',
    fontFamily: 'Avenir LT Std',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18.6,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: width * 0.05,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1,
  },
  fieldContainer: {
    gap: 4,
  },
  fieldLabel: {
    color: '#090E12',
    fontFamily: 'Avenir LT Std',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 20,
  },
  petTypeDropdownWrapper: {
    height: 50,
  },
  petTypeDropdown: {
    backgroundColor: '#32A6D8',
    borderColor: '#32A6D8',
    borderRadius: 16,
    height: 45,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 1,
 
    flex:1
  },
  petTypeText: {
    color: '#FFFFFF',
    fontFamily: 'Avenir LT Std',
    fontSize: 16.7,
    fontWeight: '600',
    lineHeight: 27.83,
  },
  inputContainer: {
    marginBottom: 0,
    height: 50,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 17,
  },
  halfField: {
    flex: 1,
    gap: 4,
  },
  sexButton: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  sexButtonActive: {
    backgroundColor: '#32A6D8',
    borderColor: '#EBEBEB',
  },
  sexButtonText: {
    color: '#898D8F',
    fontFamily: 'Avenir LT Std',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  sexButtonTextActive: {
    color: '#FFFFFF',
  },
  requiredAsterisk: {
    color: '#E96D6D',
    fontSize: 13,
  },
});

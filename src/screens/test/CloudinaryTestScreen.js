import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ImagePickerButton from '../../components/ImagePickerButton';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { BackArrowIcon } from '../../assets';

const { width } = Dimensions.get('window');

export default function CloudinaryTestScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleImageSelected = (uri) => {
    setSelectedImage(uri);
    setUploadResult(null);
    console.log('Image selected:', uri);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadToCloudinary(
        selectedImage,
        CLOUDINARY_FOLDERS.PETS,
        {
          tags: ['test', 'pet'],
          context: 'test_upload',
        }
      );

      if (result.success) {
        setUploadResult(result);
        Alert.alert(
          '✅ Upload Success!',
          `Image uploaded successfully!\n\nURL: ${result.url.substring(0, 50)}...`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Upload Failed', result.error);
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setUploadResult(null);
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cloudinary Test</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Test Image Upload</Text>
            <Text style={styles.instructions}>
              1. Select an image from camera or gallery{'\n'}
              2. Click "Upload to Cloudinary"{'\n'}
              3. Check the result below
            </Text>
          </View>

          {/* Image Picker */}
          <View style={styles.section}>
            <ImagePickerButton
              onImageSelected={handleImageSelected}
              style={styles.pickerButton}
            >
              <View style={styles.pickerContent}>
                <Text style={styles.pickerIcon}>📷</Text>
                <Text style={styles.pickerText}>
                  {selectedImage ? 'Change Image' : 'Select Image'}
                </Text>
              </View>
            </ImagePickerButton>
          </View>

          {/* Selected Image Preview */}
          {selectedImage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Image:</Text>
              <Image source={{ uri: selectedImage }} style={styles.preview} />
              <Text style={styles.imageUri} numberOfLines={2}>
                {selectedImage}
              </Text>
            </View>
          )}

          {/* Upload Button */}
          {selectedImage && !uploadResult && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadButtonText}>
                    ☁️ Upload to Cloudinary
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Upload Success!</Text>
              
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Cloudinary URL:</Text>
                <Text style={styles.resultValue} numberOfLines={3}>
                  {uploadResult.url}
                </Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Public ID:</Text>
                <Text style={styles.resultValue}>{uploadResult.publicId}</Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Format:</Text>
                <Text style={styles.resultValue}>{uploadResult.format}</Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Size:</Text>
                <Text style={styles.resultValue}>
                  {(uploadResult.bytes / 1024).toFixed(2)} KB
                </Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Dimensions:</Text>
                <Text style={styles.resultValue}>
                  {uploadResult.width} x {uploadResult.height}
                </Text>
              </View>

              {/* Uploaded Image from Cloudinary */}
              <Text style={styles.sectionTitle}>Image from Cloudinary:</Text>
              <Image
                source={{ uri: uploadResult.url }}
                style={styles.preview}
              />

              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>🔄 Test Another Image</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#191919',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#191919',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#5D6165',
    lineHeight: 22,
  },
  pickerButton: {
    width: '100%',
    height: 120,
    backgroundColor: '#F6F8FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#32A6D8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    alignItems: 'center',
  },
  pickerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#32A6D8',
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#F6F8FA',
    marginBottom: 12,
  },
  imageUri: {
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#8A8A8A',
  },
  uploadButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#32A6D8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#F6F8FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#8A8A8A',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#191919',
  },
  clearButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#F6F8FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    color: '#32A6D8',
  },
});

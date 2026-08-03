import { useState } from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Reusable Image Picker Button Component
 * Handles both camera and gallery image selection with Expo
 * 
 * @param {Object} props
 * @param {Function} props.onImageSelected - Callback with selected image URI
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.style - Button style
 * @param {boolean} props.allowsEditing - Allow image editing (default: true)
 * @param {number} props.quality - Image quality 0-1 (default: 0.8)
 * @param {number[]} props.aspect - Aspect ratio as [width, height] (default: [4, 3])
 */
export default function ImagePickerButton({
  onImageSelected,
  children,
  style,
  allowsEditing = true,
  quality = 0.8,
  aspect = [4, 3],
}) {
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera = false) => {
    try {
      setLoading(true);

      // The camera still needs a runtime permission. The gallery does NOT:
      // launchImageLibraryAsync uses the Android system Photo Picker, which
      // grants one-time access without the READ_MEDIA_IMAGES permission — so
      // we never request it (and it's stripped from the manifest).
      if (useCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            'Permission Required',
            'Please allow access to your camera to take a photo.'
          );
          return;
        }
      }

      // Launch picker
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing,
            quality,
            aspect,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing,
            quality,
            aspect,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Upload Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImage(true),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity 
      onPress={showOptions} 
      style={style}
      disabled={loading}
    >
      {children}
    </TouchableOpacity>
  );
}

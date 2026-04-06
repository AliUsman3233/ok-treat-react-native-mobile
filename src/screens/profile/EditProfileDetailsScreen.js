import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, ProfileImagePersonIcon, EditIcon, MyProfileIcon, EnvelopeIcon, PhoneCallIcon } from '../../assets';
import { Button, Input } from '../../components';
import Dropdown from '../../components/Dropdown';
import ImagePickerButton from '../../components/ImagePickerButton';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { API_ENDPOINTS } from '../../config/api';
import { setCredentials } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

export default function EditProfileDetailsScreen({ navigation }) {
  const alert = useAppAlert();
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch latest profile data on mount
  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching profile from:', API_ENDPOINTS.GET_PROFILE);
      
      const response = await fetch(API_ENDPOINTS.GET_PROFILE, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      console.log('📊 Profile response:', JSON.stringify(data, null, 2));

      if (response.ok) {
        const userData = data.data.user;
        
        console.log('👤 User data:', {
          fullName: userData.fullName,
          email: userData.email,
          gender: userData.gender,
          address: userData.address,
          avatarUrl: userData.avatarUrl,
          phone: userData.phone,
        });
        
        // Update local state with fresh data
        setName(userData.fullName || '');
        setEmail(userData.email || '');
        setGender(userData.gender || 'Male');
        setAddress(userData.address || '');
        setProfilePhoto(userData.avatarUrl || null);
        
        console.log('✅ State updated - Address:', userData.address);
        
        // Format phone number
        if (userData.phone) {
          const cleaned = userData.phone.replace(/\D/g, '');
          formatPhoneDisplay(cleaned);
        }
        
        // Update Redux state with fresh data
        dispatch(setCredentials({
          user: userData,
          token,
        }));
        
        // Update AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('❌ Failed to fetch profile:', data.message);
      }
    } catch (error) {
      console.error('❌ Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (cleaned) => {
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = '(' + cleaned.substring(0, 3);
      if (cleaned.length >= 3) {
        formatted += ') ' + cleaned.substring(3, 6);
      }
      if (cleaned.length >= 6) {
        formatted += '-' + cleaned.substring(6, 10);
      }
    }
    setPhoneNumber(formatted);
  };

  const handleImageSelected = async (imageUri) => {
    try {
      setUploading(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.USERS);
      
      // Update avatar on backend
      const response = await fetch(API_ENDPOINTS.UPDATE_AVATAR, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatarUrl: result.url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update avatar');
      }

      setProfilePhoto(result.url);
      
      // Update Redux state
      dispatch(setCredentials({
        user: { ...user, avatarUrl: result.url },
        token,
      }));

      alert('Success', 'Profile photo updated successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload Failed', error.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Format phone number as user types: (123) 456-7890
  const handlePhoneChange = (text) => {
    // Phone number is read-only, this function is not used
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Show loading state while fetching profile
  if (loading) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#32A6D8" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Error', 'Name is required', 'error');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: name.trim(),
          gender,
          address: address.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update Redux state with new user data
      dispatch(setCredentials({
        user: data.data.user,
        token,
      }));

      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

      alert('Success', 'Profile updated successfully!', 'success', 'OK', () => navigation.goBack());
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Error', error.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Profile Section */}
          <ImagePickerButton onImageSelected={handleImageSelected}>
            <View style={styles.profileSection}>
              <View style={styles.profileImageSmall}>
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#32A6D8" />
                  </View>
                ) : profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.profileImageActual} />
                ) : (
                  <ProfileImagePersonIcon width={60} height={60} />
                )}
                <View style={styles.editBadge}>
                  <Icon name="camera" size={12} color="#FFF" />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{name}</Text>
                <Text style={styles.profileEmail}>{email}</Text>
              </View>
            </View>
          </ImagePickerButton>

          {/* Dotted Divider */}
          <View style={styles.dottedDivider}>
            {Array.from({ length: Math.floor((width - 30) / 8) }).map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Name<Text style={{ color: '#FF3B30' }}> *</Text></Text>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                leftIcon={<MyProfileIcon width={20} height={20} />}
                rightIcon={<EditIcon width={16} height={16} fill="#D4D4D4" />}
                containerStyle={styles.inputField}
              />
            </View>

            {/* Email Field - Read Only */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                leftIcon={<EnvelopeIcon width={20} height={20} />}
                containerStyle={[styles.inputField, styles.disabledInput]}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            {/* Phone Number Field - Read Only */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Input
                type="phone"
                placeholder="Not set"
                value={phoneNumber}
                leftIcon={<PhoneCallIcon width={20} height={20} />}
                containerStyle={[styles.inputField, styles.disabledInput]}
                editable={false}
              />
              <Text style={styles.helperText}>Phone number cannot be changed</Text>
            </View>

            {/* Gender Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <Dropdown
                placeholder="Select gender"
                value={gender}
                onSelect={setGender}
                options={['Male', 'Female', 'Other']}
                rightIcon={<Icon name="chevron-down" size={20} color="#8D8E90" />}
                containerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
              />
            </View>

            {/* Address Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Input
                type="text"
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                rightIcon={<EditIcon width={16} height={16} fill="#D4D4D4" />}
                containerStyle={styles.inputField}
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={saving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            fullWidth
            size="medium"
            disabled={saving || uploading || !name.trim()}
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
    borderRadius: 40,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
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
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10,
  },
  profileImageSmall: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    position: 'relative',
  },
  profileImageActual: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 9999,
  },
  uploadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 9999,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 19.6,
  },
  profileEmail: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16.8,
  },
  dottedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    height: 1,
  },
  dot: {
    width: 4,
    height: 1,
    backgroundColor: '#EBEBEB',
    marginRight: 4,
  },
  formContainer: {
    gap: 20,
  },
  fieldContainer: {
    gap: 10,
  },
  fieldLabel: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 19.6,
  },
  inputField: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  helperText: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Avenir LT Std',
    marginTop: -5,
  },
  dropdownContainer: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  dropdownText: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Avenir LT Std',
  },
});

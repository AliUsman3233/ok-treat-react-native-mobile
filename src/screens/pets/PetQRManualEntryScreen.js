import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { BackArrowIcon } from '../../assets';
import { Input, Button } from '../../components';
import ScreenWrapper from '../../components/ScreenWrapper';

const { width, height } = Dimensions.get('window');

export default function PetQRManualEntryScreen({ navigation }) {
  const [tagId, setTagId] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmit = () => {
    // Validate tag ID
    const trimmed = tagId.trim();
    if (!trimmed || trimmed.length < 4 || !/^[a-zA-Z0-9]+$/.test(trimmed)) {
      Alert.alert('Invalid Tag ID', 'Please enter a valid tag ID (alphanumeric, at least 4 characters).');
      return;
    }

    // Navigate to PetDetailScreen with mock pet data
    const mockPetData = {
      id: 'QR-' + Date.now(),
      name: 'Unknown Pet',
      tagId: trimmed,
      type: 'Dog',
      breed: 'Unknown',
      age: 'Unknown',
      weight: 'Unknown',
    };

    navigation.navigate('PetDetail', { pet: mockPetData });
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
          source={require('../../assets/icons/tag_image.png')}
          style={styles.tagImage}
          resizeMode="contain"
        />

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <Input
            type="text"
            placeholder="DI787GH"
            value={tagId}
            onChangeText={setTagId}
            containerStyle={styles.input}
          />
        </View>

        {/* Submit Button */}
        <Button
          title="Submit"
          onPress={handleSubmit}
          fullWidth
          size="medium"
          disabled={!tagId.trim()}
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

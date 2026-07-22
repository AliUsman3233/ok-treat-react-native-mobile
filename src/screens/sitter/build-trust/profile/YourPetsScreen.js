import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useAppAlert } from '../../../../context/AlertContext';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import Button from '../../../../components/Button';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import { BackArrowIcon, CheckCircleIcon, BadgeCheckIcon } from '../../../../assets';
import { getUserPets } from '../../../../services/petService';
import { upsertBuildTrustSection } from '../../../../services/buildTrustService';

export default function YourPetsScreen({ navigation }) {
  const alert = useAppAlert();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's actual pets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserPets();
    }, [])
  );

  const fetchUserPets = async () => {
    try {
      setIsLoading(true);
      const response = await getUserPets();
      // getUserPets() returns { success, data: { pets } }. Reading
      // response.data set state to an object and crashed on .map().
      const pets = response?.data?.pets || response?.pets || [];
      setUserPets(Array.isArray(pets) ? pets : []);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      setUserPets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewPet = () => {
    navigation.navigate('AddPet');
  };

  const handleViewFullProfile = (petId) => {
    navigation.navigate('MyPetProfile', { petId });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Save the user's pets to buildTrustService
      const settings = {
        pets: userPets.map(p => ({
          name: p.name,
          breed: p.breed,
          weight: p.weight,
          age: p.age,
          image: p.photo || p.profileImage,
        })),
      };

      const response = await upsertBuildTrustSection('PET_CARE_INFO', settings, true);

      if (response.success) {
        navigation.navigate('ProfileSetup', { completedSection: 'yourPets' });
      } else {
        alert('Error', 'Failed to save your pets. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving your pets:', error);
      alert('Error', 'Failed to save your pets. Please try again.', 'error');
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

  const renderPetImage = (pet) => {
    const imageUri = pet.photo || pet.profileImage || pet.avatarUrl;
    if (imageUri) {
      return <Image source={{ uri: imageUri }} style={styles.petImage} />;
    }
    return (
      <View style={[styles.petImage, styles.petImagePlaceholder]}>
        <Text style={styles.petImagePlaceholderText}>
          {pet.name ? pet.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
    );
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
          <Text style={styles.headerTitle}>About your pets</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Let sitters get to know your pets, respond to your requests, and provide loving, safe care.
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Loading your pets...</Text>
            </View>
          ) : userPets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>You haven't added any pets yet</Text>
              <Text style={styles.emptyText}>
                Add your pets so sitters can learn about them and provide the best care possible.
              </Text>
              <TouchableOpacity style={styles.addPetLink} onPress={handleAddNewPet}>
                <Text style={styles.addPetLinkText}>+ Add a Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Pet List */
            userPets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                {/* Pet Header - Image, Name, and Breed in one row */}
                <View style={styles.petHeaderRow}>
                  <View style={styles.petHeaderLeft}>
                    {renderPetImage(pet)}
                    <Text style={styles.petName}>{pet.name}</Text>
                  </View>
                  <Text style={styles.petBreed}>{pet.breed || 'Unknown breed'}</Text>
                </View>

                {/* Pet Info */}
                <View style={styles.petInfoRow}>
                  <Text style={styles.petInfoText}>
                    <Text style={styles.petInfoLabel}>Weight:</Text>
                    <Text style={styles.petInfoValue}> {pet.weight || 'N/A'}          .         </Text>
                    <Text style={styles.petInfoLabel}>Age:</Text>
                    <Text style={styles.petInfoValue}> {pet.age || 'N/A'}</Text>
                  </Text>
                </View>

                {/* Pet Attributes */}
                <View style={styles.petAttributes}>
                  {pet.friendlyWithDogs && (
                    <View style={styles.attributeItem}>
                      <CheckCircleIcon width={20} height={20} fill="#32A6D8" />
                      <Text style={styles.attributeText}>{pet.friendlyWithDogs}</Text>
                    </View>
                  )}

                  {pet.friendlyWithCats && (
                    <View style={styles.attributeItem}>
                      <CheckCircleIcon width={20} height={20} fill="#32A6D8" />
                      <Text style={styles.attributeText}>{pet.friendlyWithCats}</Text>
                    </View>
                  )}

                  {pet.friendlyWithChildren && (
                    <View style={styles.attributeItem}>
                      <CheckCircleIcon width={20} height={20} fill="#32A6D8" />
                      <Text style={styles.attributeText}>{pet.friendlyWithChildren}</Text>
                    </View>
                  )}

                  {pet.isSpayedNeutered && (
                    <View style={styles.attributeItem}>
                      <BadgeCheckIcon width={20} height={20} fill="#32A6D8" />
                      <Text style={styles.attributeText}>Is spayed/neutered</Text>
                    </View>
                  )}
                </View>

                {/* View Full Profile Button */}
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => handleViewFullProfile(pet.id)}
                >
                  <Text style={styles.viewProfileText}>View Full Profile</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Unsaved Changes Modal */}
        <UnsavedChangesModal
          visible={showUnsavedModal}
          onCancel={handleCancelLeave}
          onLeave={handleConfirmLeave}
        />

        {/* Bottom Buttons */}
        <View style={styles.bottomButtonContainer}>
          {userPets.length > 0 && (
            <Button
              title={isSaving ? "Saving..." : "Save & Continue"}
              onPress={handleSave}
              type="secondary"
              size="large"
              fullWidth
              disabled={isSaving}
            />
          )}
          <Button
            title="Add New Pet"
            onPress={handleAddNewPet}
            type={userPets.length > 0 ? "outline" : "secondary"}
            size="large"
            fullWidth
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
  infoCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
  },
  infoText: {
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
    textAlign: 'center',
  },
  emptyText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  addPetLink: {
    marginTop: 4,
  },
  addPetLinkText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  petCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 6,
  },
  petHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  petHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  petImage: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  petImagePlaceholder: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderWidth: 1,
    borderColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImagePlaceholderText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  petName: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  petBreed: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  petInfoRow: {
    marginBottom: 6,
  },
  petInfoText: {
    textAlign: 'center',
    color: '#000000',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 17.05,
  },
  petInfoLabel: {
    color: '#000000',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 17.05,
  },
  petInfoValue: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  petAttributes: {
    gap: 6,
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  attributeText: {
    flex: 1,
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  viewProfileButton: {
    height: 27,
    paddingHorizontal: 20,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProfileText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18.6,
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
});

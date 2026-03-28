import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, ActivityIndicator, Alert } from 'react-native';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CheckCircleIcon } from '../../assets';
import PetWizardStep1Screen from './PetWizardStep1Screen';
import PetWizardStep2Screen from './PetWizardStep2Screen';
import PetWizardStep3Screen from './PetWizardStep3Screen';
import PetWizardStep4Screen from './PetWizardStep4Screen';
import { getPetById, updatePet } from '../../services/petService';

const { width } = Dimensions.get('window');

export default function EditPetScreen({ navigation, route }) {
  const { petId } = route.params || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1
    petType: '',
    name: '',
    weight: '',
    breed: '',
    ageYears: '',
    ageMonths: '',
    sex: '',
    photo: '',
    // Step 2
    microchipped: '',
    spayedNeutered: '',
    houseTrained: '',
    friendlyWithChildren: '',
    friendlyWithPets: '',
    adoptionDate: '',
    description: '',
    // Step 3
    pottyBreak: '',
    energyLevel: '',
    feedingSchedule: '',
    canBeLeftAlone: '',
    medications: [],
    additionalInstructions: '',
    // Step 4
    veterinaryInfo: '',
    insuranceProvider: '',
    qrCode: '',
    photos: [],
  });

  // Load existing pet data
  useEffect(() => {
    const loadPet = async () => {
      try {
        const response = await getPetById(petId);
        const pet = response.data?.pet || response.pet || response.data || response;

        setFormData({
          petType: pet.petType || pet.type || '',
          name: pet.name || '',
          weight: pet.weight ? String(pet.weight) : '',
          breed: pet.breed || '',
          ageYears: pet.ageYears ? String(pet.ageYears) : (pet.age ? String(Math.floor(parseFloat(pet.age))) : ''),
          ageMonths: pet.ageMonths ? String(pet.ageMonths) : '',
          sex: pet.sex || pet.gender || '',
          photo: pet.photo || pet.profileImage || pet.photoUrl || '',
          microchipped: pet.microchipped || '',
          spayedNeutered: pet.spayedNeutered || '',
          houseTrained: pet.houseTrained || '',
          friendlyWithChildren: pet.friendlyWithChildren || '',
          friendlyWithPets: pet.friendlyWithPets || '',
          adoptionDate: pet.adoptionDate || '',
          description: pet.description || pet.aboutPet || '',
          pottyBreak: pet.pottyBreak || '',
          energyLevel: pet.energyLevel || '',
          feedingSchedule: pet.feedingSchedule || '',
          canBeLeftAlone: pet.canBeLeftAlone || '',
          medications: pet.medications || [],
          additionalInstructions: pet.additionalInstructions || '',
          veterinaryInfo: pet.veterinaryInfo || '',
          insuranceProvider: pet.insuranceProvider || '',
          qrCode: pet.qrCode || '',
          photos: pet.photos || [],
        });
      } catch (error) {
        console.error('Error loading pet:', error);
        Alert.alert('Error', 'Failed to load pet data', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (petId) loadPet();
    else { setLoading(false); Alert.alert('Error', 'No pet ID provided'); navigation.goBack(); }
  }, [petId]);

  const getButtonText = () => {
    return currentStep === totalSteps ? 'Save Changes' : 'Next';
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return !!(formData.petType && formData.name && formData.name.trim());
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getValidationMessage = (step) => {
    switch (step) {
      case 1:
        if (!formData.petType) return 'Please select a pet type';
        if (!formData.name || !formData.name.trim()) return 'Please enter pet name';
        return '';
      default:
        return '';
    }
  };

  const isCurrentStepValid = validateStep(currentStep);
  const validationMessage = getValidationMessage(currentStep);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData.name || !formData.petType) {
        Alert.alert('Validation Error', 'Please provide at least a pet name and type');
        setSaving(false);
        return;
      }

      await updatePet(petId, formData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating pet:', error);
      Alert.alert('Error', error.message || 'Failed to update pet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PetWizardStep1Screen formData={formData} setFormData={setFormData} />;
      case 2:
        return <PetWizardStep2Screen formData={formData} setFormData={setFormData} />;
      case 3:
        return <PetWizardStep3Screen formData={formData} setFormData={setFormData} />;
      case 4:
        return <PetWizardStep4Screen formData={formData} setFormData={setFormData} navigation={navigation} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#32A6D8" />
          <Text style={styles.loadingText}>Loading pet data...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Pet</Text>

          <Text style={styles.stepText}>Step {currentStep}/4</Text>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          {renderStepContent()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!isCurrentStepValid && validationMessage && (
            <Text style={styles.validationMessage}>{validationMessage}</Text>
          )}
          <Button
            title={getButtonText()}
            onPress={handleNext}
            fullWidth
            size="medium"
            disabled={saving || !isCurrentStepValid}
          />
          {saving && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#32A6D8" />
            </View>
          )}
        </View>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <CheckCircleIcon width={66} height={66} color="#32A6D8" />
              </View>
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Successfully Updated</Text>
                <Text style={styles.modalMessage}>
                  Your pet's profile has been updated successfully.
                </Text>
              </View>
              <TouchableOpacity style={styles.doneButton} onPress={handleModalClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 90;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.053,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
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
  stepText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.6,
  },
  contentContainer: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    bottom: FOOTER_HEIGHT,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_HEIGHT,
    paddingHorizontal: width * 0.064,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    gap: 8,
  },
  validationMessage: {
    color: '#E96D6D',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.064,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 342,
    alignItems: 'center',
    gap: 30,
  },
  successIconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTextContainer: {
    width: '100%',
    gap: 10,
  },
  modalTitle: {
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#043334',
    textAlign: 'center',
    lineHeight: 25.2,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18.2,
  },
  doneButton: {
    width: width * 0.7,
    height: 40,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
    textAlign: 'center',
  },
});

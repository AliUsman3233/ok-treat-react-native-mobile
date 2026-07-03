import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CheckCircleIcon } from '../../assets';
import PetWizardStep1Screen from './PetWizardStep1Screen';
import PetWizardStep2Screen from './PetWizardStep2Screen';
import PetWizardStep3Screen from './PetWizardStep3Screen';
import PetWizardStep4Screen from './PetWizardStep4Screen';
import { createPet } from '../../services/petService';

const { width } = Dimensions.get('window');

export default function AddPetScreen({ navigation, route }) {
  const alert = useAppAlert();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
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
    foodAllergies: [],
    medicationAllergies: [],
    additionalInstructions: '',
    // Step 4
    veterinaryInfo: '',
    vetName: '',
    vetPhone: '',
    vetAddress: '',
    insuranceProvider: '',
    qrCode: '',
    photos: [],
  });

  // Handle QR code from navigation params
  useEffect(() => {
    if (route?.params?.qrCode) {
      setFormData(prev => ({ ...prev, qrCode: route.params.qrCode }));
      // Clear the param after using it
      navigation.setParams({ qrCode: undefined });
    }
  }, [route?.params?.qrCode]);

  const getButtonText = () => {
    return currentStep === totalSteps ? 'Save' : 'Next';
  };

  // Helpers
  const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const hasAge = () => has(formData.ageYears) || has(formData.ageMonths);

  // Each step lists the fields the user MUST fill before Next becomes
  // active. The list is ordered — getValidationMessage walks it and
  // returns the message for the first missing field, so the hint tells
  // the user exactly what's still needed.
  const STEP_RULES = {
    1: [
      ['petType',     'Please select a pet type',                () => has(formData.petType)],
      ['name',        'Please enter the pet\'s name',            () => has(formData.name)],
      ['weight',      'Please enter the pet\'s weight',          () => has(formData.weight)],
      ['breed',       'Please enter the pet\'s breed',           () => has(formData.breed)],
      ['age',         'Please enter the pet\'s age',             hasAge],
      ['sex',         'Please select the pet\'s sex',            () => has(formData.sex)],
      ['photo',       'Please upload a photo of the pet',        () => has(formData.photo)],
    ],
    2: [
      ['microchipped',         'Please answer: is the pet microchipped?',        () => has(formData.microchipped)],
      ['spayedNeutered',       'Please answer: is the pet spayed/neutered?',     () => has(formData.spayedNeutered)],
      ['houseTrained',         'Please answer: is the pet house-trained?',       () => has(formData.houseTrained)],
      ['friendlyWithChildren', 'Please answer: is the pet friendly with kids?',  () => has(formData.friendlyWithChildren)],
      ['friendlyWithPets',     'Please answer: is the pet friendly with pets?',  () => has(formData.friendlyWithPets)],
      ['adoptionDate',         'Please pick the adoption date',                  () => has(formData.adoptionDate)],
      // description (free text) is intentionally optional
    ],
    3: [
      ['pottyBreak',      'Please select potty break frequency', () => has(formData.pottyBreak)],
      ['energyLevel',     'Please select the energy level',      () => has(formData.energyLevel)],
      ['feedingSchedule', 'Please select the feeding schedule',  () => has(formData.feedingSchedule)],
      ['canBeLeftAlone',  'Please answer: can the pet be left alone?', () => has(formData.canBeLeftAlone)],
      // medications + additionalInstructions stay optional — many pets have neither
    ],
    4: [
      // Vet name is the anchor field — most owners know at least the clinic name.
      // Phone and address stay optional so a partial record still saves.
      ['vetName', 'Please enter your vet\'s name or clinic', () => has(formData.vetName)],
      // insuranceProvider, qrCode, photos all optional — sitter/owner may
      // not have these and blocking save would be too strict
    ],
  };

  const validateStep = (step) => {
    const rules = STEP_RULES[step];
    if (!rules) return false;
    return rules.every(([, , check]) => check());
  };

  const getValidationMessage = (step) => {
    const rules = STEP_RULES[step];
    if (!rules) return '';
    const missing = rules.find(([, , check]) => !check());
    return missing ? missing[1] : '';
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
      setLoading(true);

      // Validate required fields
      if (!formData.name || !formData.petType) {
        alert('Validation Error', 'Please provide at least a pet name and type', 'pending');
        setLoading(false);
        return;
      }

      // Call API to create pet
      const response = await createPet(formData);

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding pet:', error);

      // Check if it's an authentication error
      if (error.status === 'error' && error.message === 'No token provided') {
        alert(
          'Authentication Required',
          'Please log in to add a pet.',
          'error'
        );
      } else {
        // Backend returns either:
        //   400 → { message: '<specific reason>' }   (validation, QR conflicts, etc.)
        //   500 → { message: 'Failed to create pet', error: '<prisma/runtime detail>' }
        // The 500 case had only the generic message reaching the user. Surface
        // the technical detail too so they can tell us what actually failed.
        const userMessage = error?.message || 'Failed to add pet. Please try again.';
        const detail = error?.error;
        const text =
          detail && detail !== userMessage
            ? `${userMessage}\n\n${detail}`
            : userMessage;
        alert('Could not add pet', text, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // AddPetScreen is registered at the RootStack level (MainNavigator.js:383),
    // so `navigation` IS the root navigator — getParent() returns undefined here
    // and the chain silently no-oped. Navigate directly to the Pets tab.
    navigation.navigate('MainTabs', {
      screen: 'Pets',
      params: {
        screen: 'PetList',
      },
    });
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

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header - Absolute positioned at top */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Pet</Text>

          <Text style={styles.stepText}>Step {currentStep}/4</Text>
        </View>

        {/* Content Area - Takes remaining space with proper margins */}
        <View style={styles.contentContainer}>
          {renderStepContent()}
        </View>

        {/* Footer - Absolute positioned at bottom */}
        <View style={styles.footer}>
          {!isCurrentStepValid && validationMessage && (
            <Text style={styles.validationMessage} numberOfLines={2}>{validationMessage}</Text>
          )}
          <Button 
            title={getButtonText()} 
            onPress={handleNext} 
            fullWidth 
            size="medium"
            disabled={loading || !isCurrentStepValid}
          />
          {loading && (
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
                <Text style={styles.modalTitle}>Successfully Added</Text>
                <Text style={styles.modalMessage}>
                  Your Pet Profile has been successfully Created Welcome on joining us!
                </Text>
              </View>
              <TouchableOpacity style={styles.myPetsButton} onPress={handleModalClose}>
                <Text style={styles.myPetsButtonText}>My Pets</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 60;
// Footer holds the validation message (when a required field is missing
// on the current step) PLUS the Next/Save button. 90px wasn't enough to
// fit both — the button was being clipped off the bottom. 130px lets a
// 2-line message + button + safe padding all fit.
const FOOTER_HEIGHT = 130;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
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
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#191919',
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#5D6165',
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
  myPetsButton: {
    // Was height:40 with lineHeight:24.8 text inside → the inner space
    // (40 − 16px vert padding) was 24px, less than the line height, so
    // the label clipped and looked off-center. Bumped to 48 + removed
    // the rigid lineHeight + killed Android's extra font padding so the
    // glyph sits on the geometric center of the pill.
    width: width * 0.7,
    height: 48,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  myPetsButtonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

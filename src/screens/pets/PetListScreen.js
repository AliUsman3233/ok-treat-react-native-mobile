import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, RefreshControl, Animated, PanResponder, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { SplashIcon, DeleteIcon, CheckCircleIcon } from '../../assets';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getUserPets, deletePet } from '../../services/petService';

const dogImage = require('../../assets/images/dog_image.png');

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -50;
const DELETE_WIDTH = 40;

const SwipeablePetCard = ({ pet, onPress, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -DELETE_WIDTH));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsSwiping(false);
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handlePress = () => {
    const currentValue = translateX._value;
    if (currentValue < -10) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      onPress();
    }
  };

  const handleDelete = () => {
    onDelete(pet.id, pet.name);
  };

  const getAgeDisplay = () => {
    const years = pet.ageYears || 0;
    const months = pet.ageMonths || 0;
    
    if (years === 0 && months === 0) return 'Age not specified';
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} & ${months} month${months !== 1 ? 's' : ''}`;
  };

  const getWeightDisplay = () => {
    if (!pet.weight) return 'Weight not specified';
    return `${pet.weight} lbs`;
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteBackground}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <DeleteIcon />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[{ transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.petCard}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={isSwiping}
        >
          <View style={styles.petCardHeader}>
            <View style={styles.petCardLeft}>
              <View style={styles.petImageContainer}>
                {pet.photoUrl ? (
                  <Image source={{ uri: pet.photoUrl }} style={styles.petImage} />
                ) : (
                  <Image source={dogImage} style={styles.petImage} />
                )}
              </View>
              <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
            </View>
            <Text style={styles.petBreed}>{pet.breed || pet.type}</Text>
          </View>
          <View style={styles.petDetails}>
            <Text style={styles.petDetailsText}>
              <Text style={styles.detailLabel}>Weight:</Text>
              <Text style={styles.detailValue}> {getWeightDisplay()}  .  </Text>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}> {getAgeDisplay()}</Text>
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function PetListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fetchPets = async () => {
    try {
      const response = await getUserPets();
      setPets(response.data.pets || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPets();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };
  
  const handlePetPress = (petId) => {
    navigation.navigate('MyPetProfile', { petId });
  };

  const handleDeletePet = async (petId, petName) => {
    setSelectedPet({ id: petId, name: petName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPet) return;
    
    setShowDeleteModal(false);
    
    try {
      await deletePet(selectedPet.id);
      setPets(prevPets => prevPets.filter(pet => pet.id !== selectedPet.id));
      // setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting pet:', error);
      setErrorMessage('Failed to delete pet. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSelectedPet(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedPet(null);
  };

  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { top: insets.top }]}>
          <View style={styles.avatarContainer}>
            <Image source={SplashIcon} style={{ width: 30, height: 30 }} resizeMode="contain" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Your Pets</Text>
            <Text style={styles.headerSubtitle}>You can manage your pets</Text>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { top: HEADER_HEIGHT + insets.top }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#32A6D8" />
              <Text style={styles.loadingText}>Loading your pets...</Text>
            </View>
          ) : pets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Pets Yet</Text>
              <Text style={styles.emptyText}>Add your first pet to get started!</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#32A6D8']}
                  tintColor="#32A6D8"
                />
              }
            >
              {pets.map((pet) => (
                <SwipeablePetCard
                  key={pet.id}
                  pet={pet}
                  onPress={() => handlePetPress(pet.id)}
                  onDelete={handleDeletePet}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Add Pet Button */}
        <View style={styles.footer}>
          <Button
            title="Add a Pet"
            onPress={handleAddPet}
            fullWidth
            size="medium"
          />
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
             
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Delete Pet</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete {selectedPet?.name}? This action cannot be undone.
                </Text>
              </View>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButtonModel} onPress={confirmDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <CheckCircleIcon width={66} height={66} color="#32A6D8" />
              </View>
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Successfully Deleted</Text>
                <Text style={styles.modalMessage}>
                  The pet has been successfully removed from your list.
                </Text>
              </View>
              <TouchableOpacity style={styles.okButton} onPress={() => setShowSuccessModal(false)}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
              </View>
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Error</Text>
                <Text style={styles.modalMessage}>{errorMessage}</Text>
              </View>
              <TouchableOpacity style={styles.okButton} onPress={() => setShowErrorModal(false)}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 50;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 37.5,
    backgroundColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerTextContainer: {
    width: width,
    flexDirection: 'column',
    gap: 2,
  },
  headerTitle: {
    color: '#F38FB4',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerSubtitle: {
    color: '#5D6165',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.65,
  },
  contentContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: 10,
    paddingBottom: 10,
  },
  swipeContainer: {
    width: width * 0.9,
    position: 'relative',
    marginBottom: 8,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petCard: {
    width: width * 0.9,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 1,
    borderRadius: 12,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  petCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  petImageContainer: {
    width: 37,
    height: 37,
    borderRadius: 38,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  petImage: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  petName: {
    flex: 1,
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 21.7,
  },
  petBreed: {
    textAlign: 'center',
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  petDetails: {
    flexDirection: 'column',
    gap: 2,

  },
  petDetailsText: {
    textAlign: 'left',
    marginLeft: 50
  },
  detailLabel: {
    color: 'black',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 17.05,
  },
  detailValue: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18.6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#0D0D12',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    textAlign: 'center',
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
  deleteIconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 66,
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
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F3F3',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
    textAlign: 'center',
  },
  deleteButtonModel: {
    flex: 1,
    height: 40,
    borderRadius: 52,
     backgroundColor: '#F38FB4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deleteButtonText: {
    flex: 1,
    color: '#ffffffff',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
    textAlign: 'center',
  },
  okButton: {
    width: width * 0.7,
    height: 40,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  okButtonText: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
    textAlign: 'center',
  },
});

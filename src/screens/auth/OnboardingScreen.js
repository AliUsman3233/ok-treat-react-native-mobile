import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/ScreenWrapper';
import { IconButton } from '../../components/Button';
import OnboardingImage1 from '../../assets/icons/on_boarding_1.svg';
import OnboardingImage2 from '../../assets/icons/on_boarding_2.svg';
import OnboardingImage3 from '../../assets/icons/on_boarding_3.svg';
import NextArrowIcon from '../../assets/icons/next_arrow_btn_icon.svg';
import { completeOnboarding } from '../../store/slices/appSlice';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Smart QR Lost & Found Tags',
    description: 'Attach a Smart QR tag to your pet\'s collar. If they\'re ever lost, anyone can scan the QR and instantly help reunite you',
    image: OnboardingImage1
  },
  {
    id: '2',
    title: 'Find Trusted Pet Sitters',
    description: 'Connect with verified pet sitters in your area. Book services and keep your pets happy and safe',
    image: OnboardingImage2
  },
  {
    id: '3',
    title: 'Barter Your Time',
    description: 'Exchange pet care services using our coin-based economy. Earn coins by sitting, spend them when you need care',
    image: OnboardingImage3
  }
];

export default function OnboardingScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animate when currentIndex changes
  useEffect(() => {
    // Reset and start animation sequence
    Animated.parallel([
      // Fade out current image
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      // Slide out to left
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset position for new image
      slideAnim.setValue(50);
      
      // Fade in and slide in new image
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [currentIndex]);

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Mark onboarding as completed
      await dispatch(completeOnboarding());
      navigation.navigate('Login');
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed even if skipped
    await dispatch(completeOnboarding());
    navigation.navigate('Login');
  };

  const currentData = onboardingData[currentIndex];
  const ImageComponent = currentData.image;

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      {/* Skip Button */}
      <TouchableOpacity onPress={handleSkip} style={[styles.skipButton, { top: insets.top + 10 }]}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Image Container - Top Section */}
      <View style={[styles.imageSection, { top: insets.top + 50 }]}>
        <Animated.View 
          style={[
            styles.imageContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <ImageComponent
            width={width * 0.9}
            height={width * 0.76}
            preserveAspectRatio="xMidYMid meet"
          />
        </Animated.View>
      </View>

      {/* Text Content Card - Fixed at Bottom */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.textCard}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot
                ]}
              />
            ))}
          </View>
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.description}>{currentData.description}</Text>

          {/* Next Button */}
          <IconButton
            icon={<NextArrowIcon />}
            onPress={handleNext}
            size={40}
            backgroundColor="#32A6D8"
            style={styles.nextButton}
          />
        </View>
      </View>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F7F7',
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    textAlign: 'center',
    color: '#8A8A8A',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  imageSection: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  imageContainer: {
    width: width * 0.9,
    height: width * 0.76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textCard: {
    width: width - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    // Shadow for card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: '#EDEDED',
    borderRadius: 30,
  },
  activeDot: {
    width: 20,
    height: 4,
    backgroundColor: '#FFC2EB',
    borderRadius: 30,
  },
  title: {
    textAlign: 'center',
    color: '#100604',
    fontSize: 28,
    fontFamily: 'Kodchasan',
    fontWeight: '500',
    lineHeight: 36,
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#A1A1A1',
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '300',
    lineHeight: 19.60,
    marginBottom: 16,
  },
  nextButton: {
    marginTop: 8,
  },
});

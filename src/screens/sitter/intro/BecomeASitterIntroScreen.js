import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import { BackArrowIcon, AngleDownIcon, BuildingsIcon, HomeIconSvg, SunIcon, PawIcon, PawFilledIconPink, PawFilledIconPinkPink } from '../../../assets';
import { getVerificationStatus } from '../../../services/stripeService';

export default function BecomeASitterIntroScreen({ navigation }) {
  const [expandedSections, setExpandedSections] = useState({
    mainCard: true,
    tools: false,
    howItWorks: false,
    services: false,
    safety: false,
  });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const response = await getVerificationStatus();
      if (response.success && response.data.verified) {
        // User is already verified, navigate to ProfileSetup
        navigation.replace('ProfileSetup');
      }
    } catch (error) {
      console.log('Verification check error:', error);
      // If error, assume not verified and continue
    } finally {
      setIsChecking(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGetStarted = () => {
    navigation.navigate('VerifyIdentity');
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
            <BackArrowIcon 
              width={20} 
              height={20} 
              fill="#090E12" 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Sitter</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content Card */}
          <TouchableOpacity 
            style={styles.mainCard}
            onPress={() => toggleSection('mainCard')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Use your time to become a pet sitter</Text>
              <View style={[styles.expandIcon, !expandedSections.mainCard && styles.expandIconCollapsed]}>
                <AngleDownIcon width={24} height={24} fill="#32A6D8" />
              </View>
            </View>

            {expandedSections.mainCard && (
              <View style={styles.cardContent}>
                <Text style={styles.description}>
                  With OkTreat, it's easy to connect and become part of the world's largest pet parent network.
                </Text>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Flexibility puts you in control</Text>
                  
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bulletIconContainer}>
                        <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                      </View>
                      <Text style={styles.bulletText}>Create your own schedule and set your rates</Text>
                    </View>

                    <View style={styles.bulletItem}>
                      <View style={styles.bulletIconContainer}>
                        <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                      </View>
                      <Text style={styles.bulletText}>Provide any mix of pet care services</Text>
                    </View>

                    <View style={styles.bulletItem}>
                      <View style={styles.bulletIconContainer}>
                        <PawFilledIconPink width={10} height={10} color="#FFC2EB" />
                      </View>
                      <Text style={styles.bulletText}>
                        Choose pet sizes, ages, and other preferences that suit you
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Testimonial Image inside main card */}
                <View style={styles.testimonialSection}>
                  <Image
                    source={require('../../../assets/images/become_pet_sitter_image_1.png')}
                    style={styles.testimonialImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.testimonialText}>
                    It's super easy. I simply update my calendar with the times I'm available. Cari C.
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Expandable Sections */}
          <View style={styles.expandableList}>
        {/* Built-in tools */}
        <View style={styles.expandableContainer}>
          <TouchableOpacity 
            style={styles.expandableItem}
            onPress={() => toggleSection('tools')}
            activeOpacity={0.8}
          >
            <Text style={styles.expandableTitle}>Built-in tools to help you succeed</Text>
            <View style={[styles.expandableIcon, !expandedSections.tools && styles.expandableIconCollapsed]}>
              <AngleDownIcon width={20} height={20} fill="#32A6D8" />
            </View>
          </TouchableOpacity>
          {expandedSections.tools && (
            <View style={styles.expandableContent}>
              <View style={styles.bulletList}>
                {/* <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    The OkTreat Guarantee provides up to $18,000 in reimbursement for vet care.
                  </Text>
                </View> */}
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    Handle your pet sitting schedule and more—all in the OkTreat app
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    24/7 help, including professional veterinary support
                  </Text>
                </View>
              </View>
              
              <View style={styles.testimonialSection}>
                <Image
                  source={require('../../../assets/images/become_pet_sitter_image_2.jpg')}
                  style={styles.testimonialImage}
                  resizeMode="contain"
                />
                <Text style={styles.testimonialText}>
                  The OkTreat app keeps me instantly informed of new business requests, allowing me to respond fast. Cari C.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={styles.expandableContainer}>
          <TouchableOpacity 
            style={styles.expandableItem}
            onPress={() => toggleSection('howItWorks')}
            activeOpacity={0.8}
          >
            <Text style={styles.expandableTitle}>How it works</Text>
            <View style={[styles.expandableIcon, !expandedSections.howItWorks && styles.expandableIconCollapsed]}>
              <AngleDownIcon width={20} height={20} fill="#32A6D8" />
            </View>
          </TouchableOpacity>
          {expandedSections.howItWorks && (
            <View style={styles.expandableContent}>
              <View style={styles.stepsGrid}>
                <View style={styles.stepCard}>
                  <Text style={styles.stepTitle}>1. Create your profile</Text>
                  <Text style={styles.stepDescription}>
                    We guide you in building a profile that shows pet owners what matters most.
                  </Text>
                </View>
                <View style={styles.stepCard}>
                  <Text style={styles.stepTitle}>2. Accept requests</Text>
                  <Text style={styles.stepDescription}>
                    Specify the types of pets you'd like to care for & the dates you're available.
                  </Text>
                </View>
              </View>
              
              {/* <View style={styles.stepsGrid}>
                <View style={styles.stepCard}>
                  <Text style={styles.stepTitle}>3. Get coins</Text>
                  <Text style={styles.stepDescription}>
                    Coins become available for withdrawal 2 days after you finishing a service.
                  </Text>
                </View>
                <View style={styles.stepCard}>
                  <Text style={styles.stepTitle}>4. Keep earning</Text>
                  <Text style={styles.stepDescription}>
                    Once you earn your first Coins, we'll gather the tax info we need. Learn More
                  </Text>
                </View>
              </View> */}
            </View>
          )}
        </View>

        {/* Services */}
        <View style={styles.expandableContainer}>
          <TouchableOpacity 
            style={styles.expandableItem}
            onPress={() => toggleSection('services')}
            activeOpacity={0.8}
          >
            <Text style={styles.expandableTitle}>Services</Text>
            <View style={[styles.expandableIcon, !expandedSections.services && styles.expandableIconCollapsed]}>
              <AngleDownIcon width={20} height={20} fill="#32A6D8" />
            </View>
          </TouchableOpacity>
          {expandedSections.services && (
            <View style={styles.expandableContent}>
              <View style={styles.stepsGrid}>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceIconContainer}>
                    <BuildingsIcon width={24} height={24} fill="#32A6D8" />
                  </View>
                  <Text style={styles.serviceTitle}>Boarding</Text>
                  <Text style={styles.serviceDescription}>
                    Take care of a dog or cat overnight at your place. Boarding sitters can earn up to 2× more!
                  </Text>
                </View>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceIconContainer}>
                    <HomeIconSvg width={24} height={24} fill="#32A6D8" />
                  </View>
                  <Text style={styles.serviceTitle}>House Sitting, Drop-In Visits</Text>
                  <Text style={styles.serviceDescription}>
                    Care for pets in the comfort of their own homes.
                  </Text>
                </View>
              </View>
              
              <View style={styles.stepsGrid}>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceIconContainer}>
                    <SunIcon width={24} height={24} fill="#32A6D8" />
                  </View>
                  <Text style={styles.serviceTitle}>Day Care</Text>
                  <Text style={styles.serviceDescription}>
                    Great for pet enthusiasts working remotely.
                  </Text>
                </View>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceIconContainer}>
                    <PawIcon width={24} height={24} fill="#32A6D8" />
                  </View>
                  <Text style={styles.serviceTitle}>Pet Walking</Text>
                  <Text style={styles.serviceDescription}>
                    Pick pet walks that suit your timing.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Safety */}
        <View style={styles.expandableContainer}>
          <TouchableOpacity 
            style={styles.expandableItem}
            onPress={() => toggleSection('safety')}
            activeOpacity={0.8}
          >
            <Text style={styles.expandableTitle}>Safety always comes first</Text>
            <View style={[styles.expandableIcon, !expandedSections.safety && styles.expandableIconCollapsed]}>
              <AngleDownIcon width={20} height={20} fill="#32A6D8" />
            </View>
          </TouchableOpacity>
          {expandedSections.safety && (
            <View style={styles.expandableContent}>
              <Text style={styles.expandableText}>
                Our mission is to keep tails wagging and pet owners worry-free.
              </Text>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    The OkTreat Guarantee backs every service you provide on the platform.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    Online payments that are safe, secure, and hassle-free
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    Background checks included for every pet sitter and walker.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    24/7 access to our high-quality support team
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIconContainer}>
                    <PawFilledIconPink width={10} height={10} fill="#FFC2EB" />
                  </View>
                  <Text style={styles.bulletText}>
                    Ongoing training to help pet sitters provide the best care
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.expandableText, { marginTop: 12 }]}>
                After approval, begin connecting with pet owners.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>

    {/* Get Started Button - Fixed at Bottom */}
    <View style={styles.bottomButtonContainer}>
      <Button
        title="Get Started"
        onPress={handleGetStarted}
        type="primary"
        size="medium"
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
    paddingBottom: 100,
  },
  mainCard: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandIcon: {
    transform: [{ rotate: '-90deg' }],
    transition: 'transform 0.3s',
  },
  expandIconCollapsed: {
    transform: [{ rotate: '0deg' }],
  },
  cardTitle: {
    flex: 1,
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  cardContent: {
    gap: 12,
    marginTop: 4,
  },
  description: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    marginBottom: 4,
  },
  section: {
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '750',
    lineHeight: 18.6,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletIconContainer: {
    width: 13.34,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    flex: 1,
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  testimonialSection: {
    marginTop: 20,
  },
  testimonialImage: {
    width: '100%',
    height: 148,
    borderRadius: 12,
    marginBottom: 8,
  },
  testimonialText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  expandableList: {
    marginHorizontal: 24,
    marginTop: 0,
    gap: 12,
  },
  expandableContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandableItem: {
    minHeight: 45,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandableTitle: {
    flex: 1,
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  expandableIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  expandableIconCollapsed: {
    transform: [{ rotate: '0deg' }],
  },
  expandableContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 8,
  },
  expandableText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    marginBottom: 12,
  },
  stepsGrid: {
    flexDirection: 'row',
    gap: 11.12,
    marginBottom: 11.12,
  },
  stepCard: {
    flex: 1,
    padding: 11.12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7.41 },
    shadowOpacity: 0.04,
    shadowRadius: 37.06,
    elevation: 2,
    borderRadius: 11.12,
    gap: 9.27,
  },
  stepTitle: {
    color: '#000000',
    fontSize: 11.12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 17.23,
  },
  stepDescription: {
    color: '#818898',
    fontSize: 11.12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 17.23,
  },
  serviceCard: {
    flex: 1,
    padding: 11.12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7.41 },
    shadowOpacity: 0.04,
    shadowRadius: 37.06,
    elevation: 2,
    borderRadius: 11.12,
    gap: 9.27,
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F9FF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTitle: {
    color: '#000000',
    fontSize: 11.12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 17.23,
    textAlign: 'center',
  },
  serviceDescription: {
    color: '#818898',
    fontSize: 11.12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 17.23,
    textAlign: 'center',
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});


import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Calendar2Icon, CalendarIconBlue, SplashIcon } from '../../assets';
import { 
  SliderIcon,
  BriefcaseIcon,
  BuildingsIcon,
  SunIcon,
  PawIcon
} from '../../assets';
import Icon from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const SERVICES = [
  {
    id: 1,
    title: 'Boarding',
    subtitle: 'At the sitter\'s home',
    icon: 'BriefcaseIcon',
    serviceType: 'BOARDING',
    searchSubtitle: 'When do you need a sitter?'
  },
  {
    id: 2,
    title: 'House Sitting',
    subtitle: 'At your residence',
    icon: 'BuildingsIcon',
    serviceType: 'HOUSE_SITTING',
    searchSubtitle: 'When do you need house sitting?'
  },
  {
    id: 3,
    title: 'Drop-In Visits',
    subtitle: 'In-home visits',
    icon: 'Calendar',
    serviceType: 'DROP_IN_VISITS',
    searchSubtitle: 'When do you need drop-in visits?'
  },
  {
    id: 4,
    title: 'Day Care',
    subtitle: 'At the sitter\'s home',
    icon: 'SunIcon',
    serviceType: 'DAY_CARE',
    searchSubtitle: 'When do you need day care?'
  },
  {
    id: 5,
    title: 'Pet Walking',
    subtitle: 'Around neighbourhood',
    icon: 'PawIcon',
    serviceType: 'PET_WALKING',
    searchSubtitle: 'When do you need pet walking?'
  }
];

const ServiceIcon = ({ iconName }) => {
  switch(iconName) {
    case 'BriefcaseIcon':
      return <BriefcaseIcon width={36} height={36} />;
    case 'BuildingsIcon':
      return <BuildingsIcon width={36} height={36} />;
    case 'SunIcon':
      return <SunIcon width={36} height={36} />;
    case 'PawIcon':
      return <PawIcon width={36} height={36} />;
    default:
      return <CalendarIconBlue  width={36} height={36} />;
  }
};

export default function ServicesScreen({ navigation }) {
  const handleServicePress = (service) => {
    navigation.navigate('ServiceSearch', {
      serviceType: service.serviceType,
      serviceTitle: service.title,
      serviceSubtitle: service.searchSubtitle
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={{fontSize: 24, color: '#F38FB4'}}>🐾</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Services</Text>
            <Text style={styles.emailText}>You can chose services</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <SliderIcon width={19} height={19} />
          </TouchableOpacity>
        </View>

        {/* Services Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => handleServicePress(SERVICES[0])}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <ServiceIcon iconName={SERVICES[0].icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{SERVICES[0].title}</Text>
                  <Text style={styles.serviceSubtitle}>{SERVICES[0].subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => handleServicePress(SERVICES[1])}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <ServiceIcon iconName={SERVICES[1].icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{SERVICES[1].title}</Text>
                  <Text style={styles.serviceSubtitle}>{SERVICES[1].subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => handleServicePress(SERVICES[2])}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <ServiceIcon iconName={SERVICES[2].icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{SERVICES[2].title}</Text>
                  <Text style={styles.serviceSubtitle}>{SERVICES[2].subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => handleServicePress(SERVICES[3])}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <ServiceIcon iconName={SERVICES[3].icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{SERVICES[3].title}</Text>
                  <Text style={styles.serviceSubtitle}>{SERVICES[3].subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3 - Single Card */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.serviceCard, styles.halfCard]}
              onPress={() => handleServicePress(SERVICES[4])}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <ServiceIcon iconName={SERVICES[4].icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{SERVICES[4].title}</Text>
                  <Text style={styles.serviceSubtitle}>{SERVICES[4].subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 10,
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
    flex: 1,
    gap: 2,
  },
  welcomeText: {
    color: '#F38FB4',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  emailText: {
    color: '#5D6165',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.65,
  },
  filterButton: {
    width: 27,
    height: 27,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  serviceCard: {
    flex: 1,
    padding: 12,
    height: 116,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e1e1ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
  },
  halfCard: {
    flex: 0.45,
  },
  
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    // padding: 9,
    borderRadius: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  serviceTitle: {
    color: '#0D0D12',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 12.6,
    textAlign: 'center',
  },
  serviceSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 12.6,
    textAlign: 'center',
  },
});

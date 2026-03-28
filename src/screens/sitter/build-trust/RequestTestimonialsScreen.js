import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import { BackArrowIcon } from '../../../assets';

export default function RequestTestimonialsScreen({ navigation }) {
  const handleSave = () => {
    console.log('Save Request Testimonials');
    navigation.navigate('ProfileSetup', { completedBuildTrust: 'testimonials' });
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Testimonials</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.placeholderText}>Request Testimonials Screen - Design Coming Soon</Text>
        </View>

        <View style={styles.bottomButtonContainer}>
          <Button
            title="Save"
            onPress={handleSave}
            type="secondary"
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    color: '#898D8F',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
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

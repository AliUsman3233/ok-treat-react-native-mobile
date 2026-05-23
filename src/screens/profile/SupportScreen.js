import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { Button } from '../../components';
import { useAppAlert } from '../../context/AlertContext';

export default function SupportScreen({ navigation }) {
  const alert = useAppAlert();

  const handleBack = () => {
    navigation.goBack();
  };

  const comingSoon = (label) => () =>
    alert(label, 'Coming after release', 'pending');

  const handleVisitHelpCenter = comingSoon('Help Center');
  const handleChatWithSupport = comingSoon('Live Chat');
  const handleCallSupport = comingSoon('Phone Support');

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OkTreat Support</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* How can we help Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How can we help?</Text>
            <Text style={styles.cardDescription}>
              Access information and resources to address frequently asked questions.
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title="Visit the Help Center"
                onPress={handleVisitHelpCenter}
                type="primary"
                size="medium"
                style={styles.halfButton}
              />
              <Button
                title="Chat with Support"
                onPress={handleChatWithSupport}
                type="secondary"
                size="medium"
                style={styles.halfButton}
              />
            </View>
          </View>

          {/* Safety Issue Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Is this a safety issue?</Text>
            <Text style={styles.cardDescription}>
              If your are experiencing a safety issue concerning the well-being of a person or a pet in your care - including a lost pet, pet injury or pet illness - please contact the Trust & Safety team.
            </Text>
            <Button
              title="Call OkTreat Support"
              onPress={handleCallSupport}
              type="primary"
              size="medium"
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  cardDescription: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
});

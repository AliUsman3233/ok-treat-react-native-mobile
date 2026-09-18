import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import * as Application from 'expo-application';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { Button } from '../../components';
import { useAppAlert } from '../../context/AlertContext';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function SupportScreen({ navigation }) {
  const alert = useAppAlert();
  // Support contacts come from the admin-editable remote config. A blank value
  // means that channel isn't set up yet → we show an "under maintenance" note
  // instead of opening a dead link.
  const { supportWhatsapp, supportEmail, supportPhone } = useRemoteConfig();

  const handleBack = () => {
    navigation.goBack();
  };

  // App version appended to support messages so the team has debugging context.
  const appVer = Application.nativeApplicationVersion || '';
  const appBuild = Application.nativeBuildVersion || '';
  const versionNote = appVer ? `\n\n(App v${appVer}${appBuild ? ` (${appBuild})` : ''})` : '';
  const prefill = `Hi OkTreat Support, I need help with…${versionNote}`;

  const underMaintenance = (label) =>
    alert(label, 'This option is under maintenance. Please try another way to reach us or check back soon.', 'pending');

  const openOrWarn = async (url, label) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      underMaintenance(label);
    }
  };

  const handleChatWithSupport = () => {
    const digits = String(supportWhatsapp || '').replace(/[^0-9]/g, '');
    if (!digits) return underMaintenance('Live Chat');
    openOrWarn(`https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`, 'Live Chat');
  };

  const handleEmailSupport = () => {
    const email = String(supportEmail || '').trim();
    if (!email) return underMaintenance('Email Support');
    const subject = encodeURIComponent('OkTreat Support request');
    const body = encodeURIComponent(prefill);
    openOrWarn(`mailto:${email}?subject=${subject}&body=${body}`, 'Email Support');
  };

  const handleCallSupport = () => {
    const phone = String(supportPhone || '').replace(/[^0-9+]/g, '');
    if (!phone) return underMaintenance('Phone Support');
    openOrWarn(`tel:${phone}`, 'Phone Support');
  };

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
                title="Email Support"
                onPress={handleEmailSupport}
                type="primary"
                size="small"
                style={styles.halfButton}
              />
              <Button
                title="Chat with Support"
                onPress={handleChatWithSupport}
                type="secondary"
                size="small"
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
              size="small"
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    borderRadius: 14,
    gap: 10,
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

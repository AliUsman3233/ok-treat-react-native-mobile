import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import BackArrowIcon from '../../assets/icons/back_arrow.svg';
import TickIcon from '../../assets/icons/tick_icon.svg';
import { setLanguage } from '../../store/slices/appSlice';
import { SUPPORTED_LANGUAGES } from '../../i18n';

const { width, height } = Dimensions.get('window');

export default function LanguageScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const currentLanguage = useSelector((s) => s.app?.language) || 'en-us';
  // route.params.fromSettings === true → behave as a re-selection screen
  // (no Onboarding redirect, just goBack on Proceed). Default flow is the
  // first-launch onboarding path.
  const fromSettings = !!route?.params?.fromSettings;
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const handleContinue = async () => {
    await dispatch(setLanguage(selectedLanguage));
    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.navigate('Onboarding');
    }
  };

  return (
    <ScreenWrapper style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <BackArrowIcon
            width={width * 0.053}
            height={width * 0.053}
            fill="#090E12"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Language List */}
      <View style={styles.languageList}>
        {SUPPORTED_LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageCard,
              selectedLanguage === language.code && styles.languageCardActive
            ]}
            onPress={() => setSelectedLanguage(language.code)}
          >
            <Text style={styles.languageName}>{language.name}</Text>
            {selectedLanguage === language.code && (
              <View style={styles.checkbox}>
                <TickIcon
                  width={width * 0.037}
                  height={width * 0.037}
                  fill="#32A6D8"
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title={t('language.proceed')}
          onPress={handleContinue}
          type="primary"
          size="medium"
          fullWidth
        />
      </View>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  statusBar: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  time: {
    color: '#090E12',
    fontSize: 16.22,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.99,
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 5,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
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
    lineHeight: 24.80,
    textAlign: 'center',
  },
  headerPlaceholder: {
    display: 'none',
  },
  languageList: {
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 16,
  },
  languageCard: {
    height: 60,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageCardActive: {
    backgroundColor: 'rgba(50, 166, 216, 0.20)',
    borderColor: '#32A6D8',
  },
  languageName: {
    flex: 1,
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.80,
  },
  checkbox: {
    width: 20,
    height: 20,
    backgroundColor: '#32A6D8',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 78,
    left: 20,
    right: 20,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIndicatorBar: {
    width: 133,
    height: 6,
    backgroundColor: '#EBEBEB',
    borderRadius: 3,
  },
});

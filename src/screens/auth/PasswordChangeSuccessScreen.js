import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import { KeyIcon } from '../../assets';

const { width, height } = Dimensions.get('window');

export default function PasswordChangeSuccessScreen({ navigation }) {
  const handleGotIt = () => {
    navigation.navigate('Login');
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <View style={styles.iconInnerBorder} />
            <View style={styles.iconWrapper}>
              <KeyIcon
                width={width * 0.088}
                height={width * 0.088}
                fill="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Password has been changed</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Now you can enjoy all the benefits of our app again.
        </Text>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Button
          title="Got It"
          onPress={handleGotIt}
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
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.064,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 60,
    height: 60,
    backgroundColor: '#FFC2EB',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFC2EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconInnerBorder: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(9, 14, 18, 0.04)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    width: 307,
    color: '#191919',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    width: 283,
    textAlign: 'center',
    color: '#5D6165',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: width * 0.064,
    paddingBottom: height * 0.04,
  },
});

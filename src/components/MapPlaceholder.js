import { View, Text, StyleSheet } from 'react-native';

/**
 * Placeholder component shown when react-native-maps is not available
 * (e.g., in Expo Go)
 */
export default function MapPlaceholder({ style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>Map View</Text>
      <Text style={styles.message}>
        Maps require a development build.{'\n'}
        Using Expo Go? Maps will work in production build.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#191919',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 22,
  },
});

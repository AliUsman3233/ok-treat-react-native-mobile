import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function RegistrationSuccessScreen({ navigation }) {
  useEffect(() => {
    // Auto-navigate to main app after 3 seconds
    const timer = setTimeout(() => {
      // The auth state will automatically trigger navigation to Main
      // via RootNavigator since user is now authenticated
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenWrapper style={styles.container} noBottomTabs>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>

        <Text style={styles.title}>Successfully Registered!</Text>
        <Text style={styles.subtitle}>
          Welcome to OkTreat!{'\n'}
          Your account has been created successfully.
        </Text>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            You can now start exploring pet sitters,{'\n'}
            add your pets, and book services.
          </Text>
        </View>

        <Text style={styles.redirectText}>Redirecting to home...</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32
  },
  icon: {
    fontSize: 100
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24
  },
  messageContainer: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32
  },
  message: {
    fontSize: 14,
    color: '#2D5F3F',
    textAlign: 'center',
    lineHeight: 22
  },
  redirectText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  }
});

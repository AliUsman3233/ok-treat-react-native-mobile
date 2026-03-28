import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CheckCircleIcon } from '../assets';

export default function ProfileVerifiedModal({ 
  visible, 
  onNext, 
  title = "Profile Verified",
  description = "Your profile has been successfully Verified. Welcome on joining us!",
  buttonText = "Next",
  iconType = "success" // "success", "pending", "error"
}) {
  const renderIcon = () => {
    switch (iconType) {
      case 'success':
        return <CheckCircleIcon width={66.29} height={66.29} fill="#32A6D8" />;
      case 'pending':
        return <Icon name="hourglass-outline" size={66} color="#FFA500" />;
      case 'error':
        return <Icon name="close-circle-outline" size={66} color="#FF3B30" />;
      default:
        return <CheckCircleIcon width={66.29} height={66.29} fill="#32A6D8" />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onNext}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              {renderIcon()}
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>
                {description}
              </Text>
            </View>

            {/* Next Button */}
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={onNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 342,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    gap: 30,
  },
  iconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    width: '100%',
    gap: 10,
  },
  title: {
    textAlign: 'center',
    color: '#043334',
    fontSize: 21,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 25.2,
  },
  description: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    lineHeight: 18.2,
  },
  nextButton: {
    width: 258,
    height: 56,
    backgroundColor: '#FFC2EB',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextButtonText: {
    textAlign: 'center',
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 24.8,
  },
});

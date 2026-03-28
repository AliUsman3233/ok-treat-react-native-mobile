import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';

export default function EReceiptScreen({ navigation, route }) {
  const { transaction } = route.params || {};

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDownload = () => {
    // Handle download receipt
    console.log('Download receipt');
  };

  const handleShare = () => {
    // Handle share receipt
    console.log('Share receipt');
  };

  if (!transaction) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Receipt</Text>
            <View style={styles.shareButton} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <Icon name="receipt-outline" size={64} color="#E0E0E0" />
            <Text style={{ color: '#616161', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500', marginTop: 16 }}>
              No Receipt Available
            </Text>
            <Text style={{ color: '#9E9E9E', fontSize: 14, fontFamily: 'Poppins', textAlign: 'center', marginTop: 8 }}>
              The transaction details could not be loaded.
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Icon name="share-social-outline" size={24} color="#32A6D8" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Success Badge */}
          <View style={styles.successSection}>
            <View style={styles.successIconContainer}>
              <Icon name="checkmark-circle" size={64} color="#3FA477" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Your transaction has been completed</Text>
          </View>

          {/* Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>$125.00</Text>
            <View style={styles.paidBadge}>
              <Icon name="checkmark-circle" size={16} color="#3FA477" />
              <Text style={styles.paidText}>PAID</Text>
            </View>
          </View>

          {/* Receipt Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="receipt-outline" size={20} color="#32A6D8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <View style={styles.transactionIdRow}>
                  <Text style={styles.detailValue}>SK7263727399</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Icon name="copy-outline" size={16} color="#32A6D8" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="calendar-outline" size={20} color="#32A6D8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>Dec 14, 2025 | 10:01:16 AM</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="card-outline" size={20} color="#32A6D8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>Credit Card •••• 4242</Text>
              </View>
            </View>
          </View>

          {/* Service Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Service Information</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="paw-outline" size={20} color="#32A6D8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Service Type</Text>
                <Text style={styles.detailValue}>Pet Boarding</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="person-outline" size={20} color="#32A6D8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Sitter Name</Text>
                <Text style={styles.detailValue}>Jenny Wilson</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="time-outline" size={20} color="#32A6D8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Service Duration</Text>
                <Text style={styles.detailValue}>Dec 23, 2025 | 10:00 AM - 12 hours</Text>
              </View>
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Icon name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.downloadButtonText}>Download Receipt</Text>
          </TouchableOpacity>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            This is an electronic receipt. For any queries, please contact support.
          </Text>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#212121',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    color: '#212121',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    color: '#616161',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountLabel: {
    color: '#616161',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 8,
  },
  amountValue: {
    color: '#212121',
    fontSize: 40,
    fontFamily: 'Poppins',
    fontWeight: '700',
    marginBottom: 12,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(63, 164, 119, 0.1)',
    borderRadius: 20,
  },
  paidText: {
    color: '#3FA477',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '700',
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    color: '#212121',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(50, 166, 216, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    color: '#616161',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  detailValue: {
    color: '#212121',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  transactionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#32A6D8',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#32A6D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  footerNote: {
    color: '#9E9E9E',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingBottom: 32,
    lineHeight: 18,
  },
});

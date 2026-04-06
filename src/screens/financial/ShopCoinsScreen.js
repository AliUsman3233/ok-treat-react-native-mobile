import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CoinIcon } from '../../assets';
import { Button } from '../../components';
import AddCardBottomSheet from '../../components/AddCardBottomSheet';
import api from '../../config/api';
import { useAppAlert } from '../../context/AlertContext';

export default function ShopCoinsScreen({ navigation }) {
  const alert = useAppAlert();
  const [selectedPackage, setSelectedPackage] = useState('100');
  const [customAmount, setCustomAmount] = useState('0');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [totalCoins, setTotalCoins] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const packages = [
    { price: '$10.99', coins: '50', id: 'pkg_50' },
    { price: '$18.99', coins: '100', id: 'pkg_100' },
    { price: '$40.99', coins: '250', id: 'pkg_250' },
    { price: '$70.99', coins: '500', id: 'pkg_500' },
  ];

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get('/coins/balance');
      const data = response.data?.data || response.data || {};
      setTotalCoins(data.balance || data.coins || 0);
    } catch (err) {
      console.error('Error fetching coin balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleContinue = () => {
    setShowBottomSheet(true);
  };

  const handlePurchaseSuccess = async (cardData) => {
    setShowBottomSheet(false);
    setPurchasing(true);

    const selectedPkg = packages.find(p => p.coins === selectedPackage);
    const amount = selectedPkg ? parseFloat(selectedPkg.price.replace('$', '')) : parseFloat(customAmount) || 0;
    const packageId = selectedPkg?.id || 'custom';

    try {
      await api.post('/coins/purchase', { amount, packageId, cardData });
      await fetchBalance();
      alert('Success', 'Coins purchased successfully!', 'success');
    } catch (err) {
      console.error('Error purchasing coins:', err);
      alert('Error', err.response?.data?.message || 'Failed to purchase coins. Please try again.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Coins</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Total Coins Display */}
          <View style={styles.totalCoinsSection}>
            <View style={styles.coinIconWrapper}>
              <CoinIcon width={70} height={70} />
            </View>
            <Text style={styles.totalCoinsAmount}>{loadingBalance ? '...' : totalCoins}</Text>
            <Text style={styles.totalCoinsLabel}>Total Coins</Text>
          </View>

          {/* Coin Packages */}
          <View style={styles.packagesSection}>
            {packages.map((pkg, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.packageCard,
                  selectedPackage === pkg.coins && styles.packageCardSelected
                ]}
                onPress={() => setSelectedPackage(pkg.coins)}
              >
                <Text style={styles.packagePrice}>{pkg.price}</Text>
                <View style={styles.packageCoins}>
                  <CoinIcon width={18} height={18} />
                  <Text style={styles.packageCoinsText}>{pkg.coins} Coins</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Custom Amount */}
            <View style={styles.customAmountSection}>
              <Text style={styles.customAmountLabel}>Enter Other Amount</Text>
              <TouchableOpacity 
                style={styles.packageCard}
                onPress={() => setSelectedPackage('custom')}
              >
                <TextInput
                  style={styles.customAmountInput}
                  value={customAmount}
                  onChangeText={(text) => {
                    const numericOnly = text.replace(/[^0-9.]/g, '');
                    setCustomAmount(numericOnly);
                    setSelectedPackage('custom');
                  }}
                  placeholder="$0"
                  placeholderTextColor="#090E12"
                  keyboardType="numeric"
                />
                <View style={styles.packageCoins}>
                  <CoinIcon width={18} height={18} />
                  <Text style={styles.packageCoinsText}>   0 Coins</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.customAmountHelper}>Enter a custom amount (minimum $1)</Text>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={purchasing ? 'Processing...' : `Continue to Pay ${packages.find(p => p.coins === selectedPackage)?.price || '$0'}`}
            onPress={handleContinue}
            fullWidth
            size="medium"
            disabled={purchasing || (selectedPackage === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) || (!selectedPackage)}
          />
        </View>

        {/* Add Card Bottom Sheet */}
        <AddCardBottomSheet
          visible={showBottomSheet}
          onClose={() => setShowBottomSheet(false)}
          amount={packages.find(p => p.coins === selectedPackage)?.price || '$0'}
          onSuccess={handlePurchaseSuccess}
        />
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
    paddingTop: 20,
    paddingBottom: 100, // Space for fixed button
  },
  totalCoinsSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  coinIconWrapper: {
    width: 80,
    height: 80,
    paddingLeft: 5,
    paddingTop: 5,
    borderRadius: 39,
    backgroundColor: '#FBCE04',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalCoinsAmount: {
    color: 'black',
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 31,
    textAlign: 'center',
    marginTop: 0,
  },
  totalCoinsLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  packagesSection: {
    gap: 10,
  },
  packageCard: {
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageCardSelected: {
    borderWidth: 2,
    borderColor: '#32A6D8',
  },
  packagePrice: {
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  packageCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.88,
  },
  packageCoinsText: {
    color: '#32A6D8',
    fontSize: 13.76,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.34,
    textAlign: 'center',
  },
  customAmountSection: {
    gap: 8,
    marginTop: 8,
  },
  customAmountLabel: {
    color: 'rgba(0, 0, 0, 0.90)',
    fontSize: 12.72,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  customAmountInput: {
    flex: 1,
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    padding: 0,
  },
  customAmountHelper: {
    color: '#898D8F',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    marginTop: 4,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});

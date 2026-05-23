import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CoinIcon } from '../../assets';
import { Button } from '../../components';
import StripeCardSheet from '../../components/StripeCardSheet';
import api from '../../config/api';
import { useAppAlert } from '../../context/AlertContext';
import { usePaymentConfig } from '../../context/PaymentConfigContext';
import { useWallet } from '../../context/WalletContext';

// Format priceInCents → "$24.99"
const formatPrice = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function ShopCoinsScreen({ navigation }) {
  const alert = useAppAlert();
  const { mode, publishableKey } = usePaymentConfig();
  const wallet = useWallet();

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [showCardSheet, setShowCardSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleBack = () => navigation.goBack();

  const fetchBalance = useCallback(async () => {
    try {
      const response = await api.get('/coins/balance');
      const data = response.data?.data || response.data || {};
      setBalance(Number(data.coinBalance || 0));
    } catch (err) {
      console.warn('Error fetching coin balance:', err?.message);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      const response = await api.get('/coins/packages');
      const data = response.data?.data || response.data || {};
      const list = data.packages || [];
      setPackages(list);
      // Default-select the second package (a common "good middle option")
      // unless there are fewer.
      if (list.length > 0) {
        setSelectedPackageId(list[Math.min(1, list.length - 1)].id);
      }
    } catch (err) {
      console.warn('Error fetching packages:', err?.message);
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchPackages();
  }, [fetchBalance, fetchPackages]);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  // Called by StripeCardSheet when the user taps Pay. We create the
  // PaymentIntent at this moment (not at sheet-open) so abandoned sheets
  // don't litter Stripe with unconfirmed intents. Returns the clientSecret
  // for the SDK's confirmPayment call.
  const requestPaymentIntent = async () => {
    if (!selectedPackage) {
      return { message: 'Please select a package.' };
    }
    try {
      const response = await api.post('/coins/purchase', { packageId: selectedPackage.id });
      const data = response.data?.data || {};
      if (!data.clientSecret) {
        return { message: response.data?.message || 'Server did not return a clientSecret.' };
      }
      return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
    } catch (err) {
      console.error('Purchase error:', err);
      return { message: err.response?.data?.message || 'Failed to start purchase.' };
    }
  };

  // After Stripe confirms the charge, the backend webhook credits the user.
  // The webhook is async, so we poll the balance for a few seconds until it
  // increases. The card sheet stays closed at this point.
  const handlePaymentConfirmed = async () => {
    setShowCardSheet(false);
    setConfirming(true);
    const expectedDelta = selectedPackage
      ? selectedPackage.coins + (selectedPackage.bonusCoins || 0)
      : 0;
    const before = balance;

    let credited = false;
    for (let attempt = 0; attempt < 8 && !credited; attempt++) {
      // Webhook usually lands within 1–3 seconds; we poll up to ~12s.
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const response = await api.get('/coins/balance');
        const data = response.data?.data || {};
        const newBalance = Number(data.coinBalance || 0);
        setBalance(newBalance);
        if (newBalance >= before + expectedDelta) {
          credited = true;
        }
      } catch (e) {
        // Ignore transient errors and keep polling.
      }
    }

    setConfirming(false);
    // Propagate the new balance to every screen that uses WalletContext —
    // some screens won't re-mount on navigation so the global refresh is
    // what keeps the rest of the app in sync.
    wallet.refresh();
    if (credited) {
      alert(
        'Success',
        `${expectedDelta} coins added to your account.`,
        'success',
      );
    } else {
      // Payment succeeded but webhook hasn't credited yet. Common reasons:
      // webhook secret misconfig, network blip. Tell the user it's pending.
      alert(
        'Payment received',
        'Your payment was charged. Coins will appear in your balance shortly.',
        'success',
      );
    }
  };

  const stripeReady = !!publishableKey;
  const canPay = !!selectedPackage && stripeReady && !confirming;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
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
          {/* Balance */}
          <View style={styles.totalCoinsSection}>
            <View style={styles.coinIconWrapper}>
              <CoinIcon width={70} height={70} />
            </View>
            <Text style={styles.totalCoinsAmount}>
              {balanceLoading ? '...' : balance.toLocaleString()}
            </Text>
            <Text style={styles.totalCoinsLabel}>Total Coins</Text>
          </View>

          {/* Test-mode banner */}
          {mode === 'test' && (
            <View style={styles.testBanner}>
              <Text style={styles.testBannerText}>
                TEST MODE — test cards (4242 4242 4242 4242) are accepted; real cards are not charged.
              </Text>
            </View>
          )}

          {/* Packages */}
          <View style={styles.packagesSection}>
            {packagesLoading ? (
              <View style={styles.packagesLoading}>
                <ActivityIndicator color="#32A6D8" />
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.packagesLoading}>
                <Text style={styles.emptyText}>No packages available right now.</Text>
              </View>
            ) : (
              packages.map((pkg) => {
                const selected = selectedPackageId === pkg.id;
                const totalCoins = pkg.coins + (pkg.bonusCoins || 0);
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[styles.packageCard, selected && styles.packageCardSelected]}
                    onPress={() => setSelectedPackageId(pkg.id)}
                  >
                    <View style={styles.packageLeft}>
                      <Text style={styles.packagePrice}>{formatPrice(pkg.priceInCents)}</Text>
                      {pkg.bonusCoins > 0 && (
                        <Text style={styles.bonusText}>+{pkg.bonusCoins} bonus</Text>
                      )}
                    </View>
                    <View style={styles.packageCoins}>
                      <CoinIcon width={18} height={18} />
                      <Text style={styles.packageCoinsText}>
                        {totalCoins.toLocaleString()} Coins
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            title={
              confirming
                ? 'Crediting coins...'
                : !stripeReady
                ? 'Payments unavailable'
                : selectedPackage
                ? `Continue to Pay ${formatPrice(selectedPackage.priceInCents)}`
                : 'Select a package'
            }
            onPress={() => setShowCardSheet(true)}
            fullWidth
            size="medium"
            disabled={!canPay}
          />
        </View>

        <StripeCardSheet
          visible={showCardSheet}
          onClose={() => setShowCardSheet(false)}
          amountLabel={selectedPackage ? formatPrice(selectedPackage.priceInCents) : '$0'}
          fetchClientSecret={requestPaymentIntent}
          onSuccess={handlePaymentConfirmed}
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
  placeholder: { width: 40 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  totalCoinsSection: { alignItems: 'center', marginBottom: 32 },
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
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 32,
    textAlign: 'center',
  },
  totalCoinsLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  testBanner: {
    backgroundColor: '#FEF5E7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  testBannerText: {
    fontSize: 12,
    color: '#8C5A0E',
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
  },
  packagesSection: { gap: 10 },
  packagesLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#818898',
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  packageCard: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 14,
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
  packageLeft: { gap: 4 },
  packagePrice: {
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  bonusText: {
    color: '#3FA477',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
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

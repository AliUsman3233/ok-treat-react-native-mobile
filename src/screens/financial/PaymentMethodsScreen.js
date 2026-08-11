import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CoinIcon, CoinInIcon } from '../../assets';
import { Button } from '../../components';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';
import CashOutComingSoonDialog from '../../components/CashOutComingSoonDialog';
import { useWallet } from '../../context/WalletContext';

// Map a CoinTransaction.type to which tab it belongs in. SPEND and ADJUST
// land in Payments (money the user spent); EARN/REFUND/PURCHASE/BONUS in
// Earning (money coming in). Cash-out related types are reserved for
// Phase 2 (CASHOUT / CASHOUT_FEE → Withdrawals tab).
const TAB_FOR_TYPE = {
  PURCHASE: 'Earning',
  EARN: 'Earning',
  REFUND: 'Earning',
  BONUS: 'Earning',
  SPEND: 'Payments',
  ADJUST: 'Payments',
  CASHOUT: 'Withdrawals',
  CASHOUT_FEE: 'Withdrawals',
};

export default function PaymentMethodsScreen({ navigation }) {
  const wallet = useWallet();
  const [selectedTab, setSelectedTab] = useState('Earning');
  const [earningsOverview, setEarningsOverview] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState(false);
  const [documents, setDocuments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cashOutDialogOpen, setCashOutDialogOpen] = useState(false);
  const [tabData, setTabData] = useState({
    Earning: [],
    'Pending Earnings': [],
    Withdrawals: [],
    Payments: [],
  });

  const isSitter = wallet.role === 'sitter';

  const fetchTransactions = useCallback(async () => {
    try {
      // Wallet balance lives in WalletContext; this fetch is only for the
      // transaction tabs. The wallet refresh runs in parallel below.
      let txFetchFailed = false;
      const txRes = await api.get('/coins/transactions').catch((err) => {
        console.warn('Failed to load coin transactions:', err?.message);
        txFetchFailed = true;
        return { data: {} };
      });
      const txList = txRes.data?.data?.transactions || txRes.data?.transactions || [];
      const transactions = Array.isArray(txList) ? txList : [];

      // Classify each ledger row by its `type` field (PURCHASE/EARN/SPEND
      // etc.) using the TAB_FOR_TYPE map. Earlier code classified by sign
      // which incorrectly bucketed owner SPEND rows into "Withdrawals".
      const buckets = { Earning: [], 'Pending Earnings': [], Withdrawals: [], Payments: [] };

      transactions.forEach((tx) => {
        const amount = Number(tx.amount || 0);
        const rawId = tx.id || String(Math.random()).slice(2, 12);
        // Shorten long ids (e.g. UUIDs) with a middle ellipsis so the card
        // header doesn't overflow — full id stays in `rawId` for React keys.
        const displayId =
          rawId.length > 14 ? `${rawId.slice(0, 6)}***${rawId.slice(-4)}` : rawId;
        const formatted = {
          id: rawId,
          displayId,
          date: tx.createdAt
            ? new Date(tx.createdAt).toLocaleDateString('en-US') +
              ' @ ' +
              new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          type: tx.description || tx.type || 'Transaction',
          source: tx.source || 'PURCHASED',
          cashableAt: tx.cashableAt || null,
          phone: '',
          // Coins are integers — format with thousands separators, prepend "+" for credits
          amount: (amount >= 0 ? '+' : '') + Math.round(amount).toLocaleString(),
          status: 'Completed',
          statusColor: '#3FA477',
        };

        // EARN rows still in 30-day hold → Pending Earnings tab.
        if (
          tx.type === 'EARN' &&
          tx.cashableAt &&
          new Date(tx.cashableAt) > new Date()
        ) {
          buckets['Pending Earnings'].push({
            ...formatted,
            status: 'Cashable ' + new Date(tx.cashableAt).toLocaleDateString('en-US'),
            statusColor: '#F59E0B',
          });
          return;
        }

        const target = TAB_FOR_TYPE[tx.type] || 'Payments';
        buckets[target].push(formatted);
      });

      setTabData(buckets);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([wallet.refresh(), fetchTransactions()]).finally(() => setLoading(false));
      // wallet.refresh is stable; safe to omit from deps.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchTransactions])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  // All users see the same tabs. Owners can still have Earning rows from
  // refunds (cancelled bookings → REFUND → Earning per TAB_FOR_TYPE), so
  // hiding those tabs was misleading. Empty tabs render their own empty state.
  const tabs = ['Earning', 'Pending Earnings', 'Withdrawals', 'Payments'];

  if (loading) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AlohaPay Methods</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
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
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AlohaPay Methods</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Payment Info Cards */}
          <View style={styles.infoSection}>
            {/* Wallet — total balance */}
            <View style={styles.infoCard}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoTitle}>Wallet</Text>
                <Text style={styles.promoText}>
                  {wallet.purchasedCoinBalance.toLocaleString()} purchased + {wallet.earnedCoinBalance.toLocaleString()} earned
                </Text>
              </View>
              <View style={styles.coinsDisplay}>
                <CoinIcon width={18} height={18} />
                <Text style={styles.coinsText}>{wallet.coinBalance.toLocaleString()} Coins</Text>
              </View>
            </View>

            {/* Upcoming Earnings — sitter-only. EARN tx still in 30-day hold. */}
            {isSitter && (
              <View style={styles.infoCard}>
                <View style={styles.infoLeft}>
                  <Text style={styles.infoTitle}>Upcoming Earnings</Text>
                  <Text style={styles.promoText}>In 30-day hold before cash-out</Text>
                </View>
                <View style={styles.coinsDisplay}>
                  <CoinIcon width={18} height={18} />
                  <Text style={styles.coinsText}>{wallet.upcomingEarnings.toLocaleString()} Coins</Text>
                </View>
              </View>
            )}

            {/* Processing Payments — role-dependent meaning. */}
            <View style={styles.infoCard}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoTitle}>Processing Payments</Text>
                <Text style={styles.promoText}>
                  {isSitter
                    ? 'Coins arriving from CONFIRMED bookings'
                    : 'Coins held for your active bookings'}
                </Text>
              </View>
              <View style={styles.coinsDisplay}>
                <CoinIcon width={18} height={18} />
                <Text style={styles.coinsText}>{wallet.processingPayments.toLocaleString()} Coins</Text>
              </View>
            </View>

            {/* Cash Out — Phase 2. Shows the coming-soon dialog for now. */}
            <Button
              title="Cash Out"
              onPress={() => navigation.navigate('CashOut')}
              fullWidth
              size="medium"
            />
          </View>

          {/* Removed: Earnings Overview / Withdrawal History / Documents
              static info cards. They looked like interactive cards but had
              no action attached, which made the screen read as broken.
              Their data is already represented by the tabs below; the
              cards added clutter without adding info. */}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    selectedTab === tab && styles.tabActive
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text style={[
                    styles.tabText,
                    selectedTab === tab && styles.tabTextActive
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Transaction List */}
          {selectedTab === 'Withdrawals' ? (
            // Withdrawals are gated behind the cash-out feature, which is
            // not live yet. Show a coming-soon CTA instead of an empty list
            // so the user understands why it's empty.
            <View style={styles.withdrawalsEmpty}>
              <Text style={styles.emptyText}>
                Withdrawals will be available once cash-out launches.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CashOut')}
                style={styles.learnMoreBtn}
              >
                <Text style={styles.learnMoreText}>Learn more</Text>
              </TouchableOpacity>
            </View>
          ) : tabData[selectedTab] && tabData[selectedTab].length > 0 ? (
            <View style={styles.transactionList}>
              {tabData[selectedTab].map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  {/* Header Row */}
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionId} numberOfLines={1} ellipsizeMode="middle">
                      ID# {transaction.displayId || transaction.id}
                    </Text>
                    <Text style={styles.transactionDate} numberOfLines={1}>
                      {transaction.date}
                    </Text>
                  </View>

                  {/* Content Row */}
                  <View style={styles.transactionContent}>
                    {/* Left Side */}
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <CoinInIcon width={16} height={16} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionType} numberOfLines={1}>
                          {transaction.type}
                        </Text>
                        <Text style={styles.transactionPhone} numberOfLines={1}>
                          {transaction.source === 'EARNED' ? 'Earned coins' : 'Purchased coins'}
                        </Text>
                      </View>
                    </View>

                    {/* Right Side */}
                    <View style={styles.transactionRight}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.amount.startsWith('+') ? '#3FA477' : '#FF0000' }
                      ]}>
                        {transaction.amount}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: transaction.statusColor }
                      ]}>
                        <Text style={styles.statusText}>{transaction.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {selectedTab === 'Earning'
                ? 'No earning activity yet. Coin purchases and refunds will show up here.'
                : selectedTab === 'Pending Earnings'
                ? "Sitters earn coins on completed bookings, held 30 days before becoming cashable. You'll see pending earnings here once you complete a booking as a sitter."
                : selectedTab === 'Payments'
                ? "No payments yet. When you book a service, the coins spent will appear here."
                : 'No transactions in this tab yet.'}
            </Text>
          )}
        </ScrollView>

        <CashOutComingSoonDialog
          visible={cashOutDialogOpen}
          onClose={() => setCashOutDialogOpen(false)}
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
    paddingTop: 16,
  },
  infoSection: {
    gap: 10,
    marginBottom: 24,
  },
  infoCard: {
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
  infoLeft: {
    gap: 7,
  },
  infoTitle: {
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  promoText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.88,
  },
  coinsText: {
    color: '#32A6D8',
    fontSize: 13.76,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.34,
    textAlign: 'center',
  },
  toggleSection: {
    gap: 8,
    marginBottom: 24,
  },
  toggleCard: {
    height: 70,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  toggleSubtitle: {
    color: '#676869',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  toggleSwitch: {
    position: 'relative',
  },
  switchTrack: {
    width: 30,
    height: 16,
    backgroundColor: '#FFC2EB',
    position: 'absolute',
    left: 0,
    top: 2,
  },
  tabsContainer: {
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 40,
    backgroundColor: 'rgba(203.75, 203.75, 203.75, 0.15)',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderColor: '#FFC2EB',
  },
  tabText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  tabTextActive: {
    color: '#32A6D8',
  },
  withdrawalsEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  learnMoreBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#32A6D8',
  },
  learnMoreText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  emptyText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
    marginTop: 20,
  },
  transactionList: {
    gap: 12,
  },
  transactionCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E6E6',
    gap: 6,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  transactionId: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 15.6,
    flexShrink: 1,
  },
  transactionDate: {
    color: '#969696',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.6,
    flexShrink: 0,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  transactionIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: '#FFC2EB',
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  transactionType: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '500',
    lineHeight: 15.6,
  },
  transactionPhone: {
    color: '#6B7271',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 12.4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    lineHeight: 15.6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Urbanist',
    fontWeight: '600',
    lineHeight: 10.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

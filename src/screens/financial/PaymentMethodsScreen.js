import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CoinIcon, CoinInIcon } from '../../assets';
import { Button } from '../../components';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';

export default function PaymentMethodsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('Earning');
  const [earningsOverview, setEarningsOverview] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState(false);
  const [documents, setDocuments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [upcomingEarnings, setUpcomingEarnings] = useState(0);
  const [processingPayments, setProcessingPayments] = useState(0);
  const [tabData, setTabData] = useState({
    Earning: [],
    'Pending Earnings': [],
    Withdrawals: [],
    Payments: [],
  });

  const fetchPaymentData = async () => {
    try {
      // Fetch balance
      const balanceRes = await api.get('/coins/balance').catch(() => ({ data: {} }));
      const balData = balanceRes.data?.data || balanceRes.data || {};
      setWalletBalance(balData.balance || balData.coins || 0);
      setUpcomingEarnings(balData.upcomingEarnings || balData.upcoming || 0);
      setProcessingPayments(balData.processingPayments || balData.processing || 0);

      // Fetch payment methods / transactions
      const payRes = await api.get('/stripe/payment-methods').catch(() => ({ data: {} }));
      const methods = payRes.data?.data || payRes.data?.paymentMethods || [];

      // Fetch transactions for tab data
      const txRes = await api.get('/coins/transactions').catch(() => ({ data: {} }));
      const txList = txRes.data?.data || txRes.data?.transactions || txRes.data || [];
      const transactions = Array.isArray(txList) ? txList : [];

      const earning = [];
      const pending = [];
      const withdrawals = [];
      const payments = [];

      transactions.forEach(tx => {
        const formatted = {
          id: tx.id || tx._id || String(Math.random()).slice(2, 12),
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US') + ' @ ' + new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          type: tx.type || tx.description || 'Transaction',
          phone: tx.phone || tx.reference || '',
          amount: tx.amount >= 0 ? `+${Number(tx.amount).toFixed(2)}` : `${Number(tx.amount).toFixed(2)}`,
          status: tx.status || 'Completed',
          statusColor: tx.status === 'Pending' ? '#FFA500' : '#3FA477',
        };

        if (tx.status === 'Pending' || tx.status === 'pending') {
          pending.push(formatted);
        } else if (tx.type === 'withdrawal' || tx.type === 'Withdrawal' || (tx.amount < 0)) {
          withdrawals.push(formatted);
        } else if (tx.type === 'payment' || tx.type === 'Payment') {
          payments.push(formatted);
        } else {
          earning.push(formatted);
        }
      });

      setTabData({
        Earning: earning,
        'Pending Earnings': pending,
        Withdrawals: withdrawals,
        Payments: payments,
      });
    } catch (err) {
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPaymentData();
    }, [])
  );

  const handleBack = () => {
    navigation.goBack();
  };

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
            {/* Wallet */}
            <View style={styles.infoCard}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoTitle}>Wallet</Text>
                <Text style={styles.promoText}>Apply Promo Code</Text>
              </View>
              <View style={styles.coinsDisplay}>
                <CoinIcon width={18} height={18} />
                <Text style={styles.coinsText}>{walletBalance} Coins</Text>
              </View>
            </View>

            {/* Upcoming Earnings */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Upcoming Earnings</Text>
              <View style={styles.coinsDisplay}>
                <CoinIcon width={18} height={18} />
                <Text style={styles.coinsText}>{upcomingEarnings} Coins</Text>
              </View>
            </View>

            {/* Processing Payments */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Processing Payments</Text>
              <View style={styles.coinsDisplay}>
                <CoinIcon width={18} height={18} />
                <Text style={styles.coinsText}>{processingPayments} Coins</Text>
              </View>
            </View>

            {/* Manage Payout Button */}
            <Button
              title="Manage Payout Methods"
              onPress={() => console.log('Manage Payout')}
              fullWidth
              size="medium"
            />
          </View>

          {/* Toggle Options */}
          <View style={styles.toggleSection}>
            {/* Earnings Overview */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Earnings Overview</Text>
                <Text style={styles.toggleSubtitle}>You have not made any withdrawals yet.</Text>
              </View>
            
            </View>

            {/* Withdrawal History */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Withdrawal History (External)</Text>
                <Text style={styles.toggleSubtitle}>No external withdrawals have been made yet.</Text>
              </View>
            
            </View>

            {/* Documents */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Documents</Text>
                <Text style={styles.toggleSubtitle}>No documents are currently available.</Text>
              </View>
             
            </View>
          </View>

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
          {tabData[selectedTab] && tabData[selectedTab].length > 0 ? (
            <View style={styles.transactionList}>
              {tabData[selectedTab].map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  {/* Header Row */}
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionId}>ID# {transaction.id}</Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>

                  {/* Content Row */}
                  <View style={styles.transactionContent}>
                    {/* Left Side */}
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <CoinInIcon width={16} height={16} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionType}>{transaction.type}</Text>
                        <Text style={styles.transactionPhone}>{transaction.phone}</Text>
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
            <Text style={styles.emptyText}>No transaction history found.</Text>
          )}
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
  },
  transactionId: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 15.6,
  },
  transactionDate: {
    color: '#969696',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.6,
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

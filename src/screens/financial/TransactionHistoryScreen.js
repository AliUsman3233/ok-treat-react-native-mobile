import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, CoinIcon, CoinInIcon } from '../../assets';
import Dropdown from '../../components/Dropdown';
import Icon from '@expo/vector-icons/Ionicons';
import api from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';

export default function TransactionHistoryScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [transactions, setTransactions] = useState([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const fetchData = async () => {
    try {
      setError(null);
      // Fetch balance
      const balanceRes = await api.get('/coins/balance').catch(() => ({ data: {} }));
      const balData = balanceRes.data?.data || balanceRes.data || {};
      setTotalCoins(balData.balance || balData.coins || 0);

      // Fetch transactions
      const txRes = await api.get('/coins/transactions');
      const txList = txRes.data?.data || txRes.data?.transactions || txRes.data || [];
      const list = Array.isArray(txList) ? txList : [];

      const formatted = list.map(tx => ({
        id: tx.id || tx._id || String(Math.random()).slice(2, 12),
        date: tx.createdAt
          ? new Date(tx.createdAt).toLocaleDateString('en-US') + ' @ ' + new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        type: tx.type || tx.description || 'Coin Transfer',
        phone: tx.phone || tx.reference || '',
        amount: tx.amount >= 0 ? `+${Number(tx.amount).toFixed(2)}` : `${Number(tx.amount).toFixed(2)}`,
        status: tx.status || 'Completed',
        createdAt: tx.createdAt || tx.created_at,
      }));
      setTransactions(formatted);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  // Filter transactions by selected period
  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(tx => {
      if (!tx.createdAt) return true;
      const txDate = new Date(tx.createdAt);
      switch (selectedPeriod) {
        case 'This Week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return txDate >= weekAgo;
        }
        case 'This Month': {
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
        case 'Last 3 Months': {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return txDate >= threeMonthsAgo;
        }
        case 'Last 6 Months': {
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return txDate >= sixMonthsAgo;
        }
        case 'This Year': {
          return txDate.getFullYear() === now.getFullYear();
        }
        default:
          return true;
      }
    });
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={styles.menuButton}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchData(); }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Total Coins Section */}
            <View style={styles.totalCoinsSection}>
              <View style={styles.totalCoinsHeader}>
                <CoinIcon width={18} height={18} />
                <Text style={styles.totalCoinsLabel}>Total Coins</Text>
              </View>
              <Text style={styles.totalCoinsAmount}>{totalCoins}</Text>
            </View>

            {/* Recent Transactions Section */}
            <View style={styles.transactionsSection}>
              <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Recent Transactions</Text>
                <View style={styles.filterWrapper}>
                  <Dropdown
                    placeholder="Select period"
                    value={selectedPeriod}
                    onSelect={setSelectedPeriod}
                    options={['This Week', 'This Month', 'Last 3 Months', 'Last 6 Months', 'This Year']}
                    rightIcon={<Icon name="chevron-down" size={14} color="#3FA477" />}
                    containerStyle={styles.filterDropdown}
                    textStyle={styles.filterDropdownText}
                  />
                </View>
              </View>

              {/* Transaction List */}
              {filteredTransactions.length === 0 ? (
                <Text style={styles.emptyText}>No transactions found for this period.</Text>
              ) : (
                <View style={styles.transactionList}>
                  {filteredTransactions.map((transaction, index) => (
                    <View key={transaction.id + '-' + index} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionId}>ID# {transaction.id}</Text>
                        <Text style={styles.transactionDate}>{transaction.date}</Text>
                      </View>
                      <View style={styles.transactionBody}>
                        <View style={styles.transactionLeft}>
                          <View style={styles.iconCircle}>
                            <CoinInIcon width={16} height={16} />
                          </View>
                          <View style={styles.transactionInfo}>
                            <Text style={styles.transactionType}>{transaction.type}</Text>
                            <Text style={styles.transactionPhone}>{transaction.phone}</Text>
                          </View>
                        </View>
                        <View style={styles.transactionRight}>
                          <Text style={[styles.transactionAmount, { color: transaction.amount.startsWith('+') ? '#3FA477' : '#FF0000' }]}>{transaction.amount}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: transaction.status === 'Pending' ? '#FFA500' : '#3FA477' }]}>
                            <Text style={styles.statusText}>{transaction.status}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
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
  menuButton: {
    width: 2.5,
    height: 20.83,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 2.5,
    height: 2.5,
    backgroundColor: 'black',
    borderRadius: 9999,
  },
  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 12,
  },
  totalCoinsSection: {
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 24,
  },
  totalCoinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  totalCoinsLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 18.6,
  },
  totalCoinsAmount: {
    color: 'black',
    fontSize: 40,
    fontFamily: 'Poppins',
    fontWeight: '700',
    lineHeight: 62,
  },
  transactionsSection: {
    gap: 12,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionsTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 19.2,
  },
  filterWrapper: {
    width: 120,
  },
  filterDropdown: {
    width: '100%',
    height: 'auto',
    minHeight: 'auto',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E6E6',
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  filterDropdownText: {
    color: '#6E6E6E',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 12,
  },
  transactionList: {
    gap: 8,
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
  transactionBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
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
    color: '#3FA477',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    lineHeight: 15.6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#3FA477',
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
    paddingVertical: 40,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  emptyText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 20,
  },
});

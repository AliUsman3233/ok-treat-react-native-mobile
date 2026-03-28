import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon } from '../../../assets';
import { getSitterEarnings, getSitterTransactions } from '../../../services/bookingService';

export default function SitterEarningsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions
      const response = await getSitterTransactions();
      const data = response?.transactions || response?.data || response || [];
      const transactionsArray = Array.isArray(data) ? data : [];

      setTransactions(transactionsArray.map(tx => ({
        id: tx.id || tx._id || tx.transactionId || String(Math.random()),
        clientName: tx.clientName || tx.client?.name || tx.user?.name || 'Client',
        phone: tx.phone || tx.client?.phone || '',
        amount: tx.amount != null ? (tx.amount >= 0 ? `+${Number(tx.amount).toFixed(2)}` : Number(tx.amount).toFixed(2)) : '+0.00',
        date: tx.date || tx.createdAt
          ? new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: '2-digit', day: '2-digit',
            }) + ' @ ' + new Date(tx.date || tx.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true,
            })
          : '',
        status: tx.status || 'Completed',
      })));
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => {
    navigation.goBack();
  };

  // Filter transactions by search query
  const filteredTransactions = searchQuery.trim()
    ? transactions.filter(tx =>
        tx.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.id.toString().includes(searchQuery)
      )
    : transactions;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Earnings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transaction"
            placeholderTextColor="#6B7271"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Icon name="search" size={16} color="#3FA477" />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.exportButton}>
            <Icon name="download-outline" size={14} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filters</Text>
            <Icon name="filter" size={14} color="#32A6D8" />
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'No matching transactions' : 'No transactions yet'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.transactionList}>
              {filteredTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionCard}
                  onPress={() => navigation.navigate('EReceipt', { transaction })}
                >
                  {/* Transaction Header */}
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionId}>ID# {transaction.id}</Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>

                  {/* Transaction Details */}
                  <View style={styles.transactionDetails}>
                    {/* Client Info */}
                    <View style={styles.clientInfo}>
                      <View style={styles.clientAvatar}>
                        <Icon name="wallet" size={16} color="#32A6D8" />
                      </View>
                      <View style={styles.clientDetails}>
                        <Text style={styles.clientName}>{transaction.clientName}</Text>
                        <Text style={styles.clientPhone}>{transaction.phone}</Text>
                      </View>
                    </View>

                    {/* Amount and Status */}
                    <View style={styles.amountContainer}>
                      <Text style={styles.amount}>{transaction.amount}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{transaction.status}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
  searchContainer: {
    marginHorizontal: 17,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#EFF0F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFF0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#6B7271',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 15.6,
    padding: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#32A6D8',
    borderRadius: 8,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E6E6',
  },
  filterButtonText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#32A6D8',
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  emptyText: {
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  transactionList: {
    paddingHorizontal: 17,
    gap: 8,
    paddingBottom: 20,
  },
  transactionCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E6E6',
    gap: 6,
    marginBottom: 8,
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
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clientAvatar: {
    width: 30,
    height: 30,
    backgroundColor: '#FFC2EB',
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientDetails: {
    gap: 2,
  },
  clientName: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '500',
    lineHeight: 15.6,
  },
  clientPhone: {
    color: '#6B7271',
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 12.4,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
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
});

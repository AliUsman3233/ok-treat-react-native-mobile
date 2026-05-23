// My Earnings — sitter-only screen. Reads the CoinTransaction ledger
// filtered to EARN/REFUND rows (the sitter's labor income and refund
// adjustments). Each EARN row shows a "Cashable in X days" badge until
// the 30-day hold elapses.
//
// Cash Out button is a coming-soon CTA (Phase 2). The earnings ledger
// + summary cards are the substantive content for now.

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, CoinIcon } from '../../../assets';
import { Button } from '../../../components';
import api from '../../../config/api';
import { useWallet } from '../../../context/WalletContext';
import CashOutComingSoonDialog from '../../../components/CashOutComingSoonDialog';

// Days remaining until a timestamp; clamped at 0.
function daysUntil(iso) {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function SitterEarningsScreen({ navigation }) {
  const wallet = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cashOutDialogOpen, setCashOutDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Read the canonical CoinTransaction ledger. We surface EARN rows
      // (labor income) and REFUND rows for the user. SPEND tx aren't
      // relevant to the earnings story and live in PaymentMethodsScreen.
      const response = await api.get('/coins/transactions', { params: { take: 100 } });
      const data = response.data?.data || response.data || {};
      const rows = Array.isArray(data.transactions) ? data.transactions : [];

      const relevant = rows.filter((tx) => tx.type === 'EARN' || tx.type === 'REFUND');

      setTransactions(
        relevant.map((tx) => {
          const amount = Number(tx.amount || 0);
          const cashable = tx.cashableAt ? new Date(tx.cashableAt) <= new Date() : true;
          return {
            id: tx.id,
            description: tx.description || tx.type,
            amount: amount >= 0 ? `+${amount.toLocaleString()}` : amount.toLocaleString(),
            date: tx.createdAt
              ? new Date(tx.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }) +
                ' @ ' +
                new Date(tx.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : '',
            cashableAt: tx.cashableAt || null,
            cashable,
            cashableInDays: tx.cashableAt && !cashable ? daysUntil(tx.cashableAt) : 0,
            type: tx.type,
          };
        }),
      );
    } catch (err) {
      console.error('Failed to fetch earnings transactions:', err);
      setError(err?.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      wallet.refresh();
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData]),
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (tx) => tx.description.toLowerCase().includes(q) || tx.id.toLowerCase().includes(q),
    );
  }, [transactions, searchQuery]);

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Earnings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Earned-coin summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <CoinIcon width={28} height={28} />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Earned coins</Text>
                <Text style={styles.summaryAmount}>
                  {wallet.earnedCoinBalance.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.summarySplit}>
              <View style={styles.summaryHalf}>
                <Text style={styles.summarySubLabel}>In 30-day hold</Text>
                <Text style={styles.summarySubAmount}>
                  {wallet.upcomingEarnings.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryHalfBorder}>
                <Text style={styles.summarySubLabel}>Cashable</Text>
                <Text style={styles.summarySubAmount}>
                  {Math.max(
                    0,
                    wallet.earnedCoinBalance - wallet.upcomingEarnings,
                  ).toLocaleString()}
                </Text>
              </View>
            </View>
            <Button
              title="Cash Out"
              onPress={() => setCashOutDialogOpen(true)}
              fullWidth
              size="medium"
            />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#6B7271" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search earnings"
              placeholderTextColor="#6B7271"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#32A6D8" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              No earnings yet. Complete a booking to start earning coins.
            </Text>
          ) : (
            <View style={styles.txList}>
              {filtered.map((tx) => (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <Text style={styles.txDescription} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.amount.startsWith('-') ? '#E53E3E' : '#3FA477' },
                      ]}
                    >
                      {tx.amount} coins
                    </Text>
                  </View>
                  <View style={styles.txFooter}>
                    <Text style={styles.txDate}>{tx.date}</Text>
                    {tx.type === 'EARN' && (
                      tx.cashable ? (
                        <View style={[styles.badge, { backgroundColor: '#3FA477' }]}>
                          <Text style={styles.badgeText}>Cashable</Text>
                        </View>
                      ) : (
                        <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                          <Text style={styles.badgeText}>
                            Cashable in {tx.cashableInDays}d
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              ))}
            </View>
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
  placeholder: { width: 40 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  summaryCard: {
    backgroundColor: '#F8FDFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryText: { flex: 1 },
  summaryLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  summaryAmount: {
    color: '#0D0D12',
    fontSize: 28,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginTop: 2,
  },
  summarySplit: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  summaryHalf: { flex: 1, alignItems: 'center' },
  summaryHalfBorder: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  summarySubLabel: {
    color: '#818898',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  summarySubAmount: {
    color: '#0D0D12',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    color: '#0D0D12',
  },
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  errorText: {
    color: '#E53E3E',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: '#818898',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    textAlign: 'center',
    marginTop: 24,
  },
  txList: { marginTop: 16, gap: 10 },
  txCard: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  txDescription: {
    flex: 1,
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  txDate: {
    color: '#818898',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '700',
  },
});

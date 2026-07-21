// Admin-only "why is this sitter shown/hidden?" view. Runs the search
// diagnostics endpoint (same match logic as production search) and lists
// every candidate with a per-gate pass/fail breakdown. Reached via the
// diagnostics icon on SearchResultsScreen (admin accounts only).
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { diagnoseSitterSearch } from '../../services/sitterService';

const gateRows = (checks = {}) => [
  { label: 'Service setup', v: checks.serviceSetup, detail: checks.serviceSetup === undefined ? '—' : (checks.serviceSetup ? 'Complete' : 'Not set up') },
  { label: 'Location', v: checks.hasLocation, detail: checks.hasLocation === undefined ? '—' : (checks.hasLocation ? 'Set' : 'Missing') },
  { label: 'Distance', v: checks.withinRadius, detail: checks.distanceKm != null ? `${checks.distanceKm} / ${checks.radiusKm} km` : '—' },
  { label: 'Available day(s)', v: checks.weekdayOk, detail: checks.weekdayOk === undefined ? '—' : (checks.weekdayOk ? 'Yes' : 'No') },
  { label: 'Time window', v: checks.timeWindowOk, detail: checks.sitterWindow || (checks.timeWindowOk === undefined ? '—' : (checks.timeWindowOk ? 'OK' : 'None')) },
];

const Dot = ({ v }) => {
  const style = v === true ? styles.dotOk : v === false ? styles.dotNo : styles.dotNa;
  const glyph = v === true ? '✓' : v === false ? '✕' : '–';
  return <View style={[styles.dot, style]}><Text style={styles.dotText}>{glyph}</Text></View>;
};

export default function SearchDiagnosticsScreen({ navigation, route }) {
  const { serviceType = 'Boarding', searchParams = {}, radiusKm = 30 } = route?.params || {};
  const enumService = serviceType.toUpperCase().replace(/ /g, '_');

  const [state, setState] = useState({ loading: true, error: null, data: null });

  const run = useCallback(async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const res = await diagnoseSitterSearch(
        enumService,
        searchParams.latitude,
        searchParams.longitude,
        searchParams.startDate,
        searchParams.endDate,
        radiusKm,
        searchParams.startTime,
        searchParams.endTime,
      );
      setState({ loading: false, error: null, data: res.data });
    } catch (e) {
      const msg = e?.response?.status === 403
        ? 'Admin access required to view diagnostics.'
        : (e?.response?.data?.message || 'Failed to run diagnostics.');
      setState({ loading: false, error: msg, data: null });
    }
  }, [enumService, searchParams, radiusKm]);

  useEffect(() => { run(); }, [run]);

  const data = state.data;
  const summary = data?.summary;

  const renderCard = ({ item }) => (
    <View style={[styles.card, item.matched ? styles.cardShown : styles.cardHidden]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, !item.matched && styles.avatarHidden]}>
          <Text style={styles.avatarText}>{(item.name || '?').slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.subtle}>{item.approvalStatus || '—'}</Text>
        </View>
        <View style={[styles.pill, item.matched ? styles.pillShown : styles.pillHidden]}>
          <Text style={[styles.pillText, { color: item.matched ? '#15924B' : '#8A9BA8' }]}>
            {item.matched ? 'Shown' : 'Hidden'}
          </Text>
        </View>
      </View>

      <View style={styles.gates}>
        {gateRows(item.checks).map((g) => (
          <View style={styles.gate} key={g.label}>
            <Dot v={g.v} />
            <Text style={[styles.gateLabel, g.v === false && styles.gateFail]}>{g.label}</Text>
            <Text style={[styles.gateVal, g.v === false && styles.gateFail]}>{g.detail}</Text>
          </View>
        ))}
      </View>

      {!item.matched && !!item.reason && (
        <View style={styles.reason}>
          <Icon name="alert-circle-outline" size={15} color="#D23B3B" />
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Diagnostics</Text>
          <View style={styles.devBadge}><Text style={styles.devBadgeText}>ADMIN</Text></View>
        </View>

        {/* search params */}
        <View style={styles.paramsCard}>
          <View style={styles.chips}>
            <View style={styles.chip}><Text style={styles.chipText}>{serviceType}</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>{radiusKm >= 100000 ? 'Any distance' : `${radiusKm} km`}</Text></View>
            {searchParams.startTime && searchParams.endTime && (
              <View style={styles.chip}><Text style={styles.chipText}>{searchParams.startTime}–{searchParams.endTime}</Text></View>
            )}
            {searchParams.location && (
              <View style={styles.chip}><Text style={styles.chipText} numberOfLines={1}>{searchParams.location}</Text></View>
            )}
          </View>
        </View>

        {/* summary */}
        {summary && (
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={[styles.statN, { color: '#32A6D8' }]}>{summary.evaluated}</Text><Text style={styles.statL}>Evaluated</Text></View>
            <View style={styles.stat}><Text style={[styles.statN, { color: '#15924B' }]}>{summary.shown}</Text><Text style={styles.statL}>Shown</Text></View>
            <View style={styles.stat}><Text style={[styles.statN, { color: '#8A9BA8' }]}>{summary.hidden}</Text><Text style={styles.statL}>Hidden</Text></View>
          </View>
        )}

        {state.loading && (
          <View style={styles.center}><ActivityIndicator size="large" color="#32A6D8" /><Text style={styles.centerText}>Running diagnostics…</Text></View>
        )}
        {!state.loading && state.error && (
          <View style={styles.center}>
            <Icon name="alert-circle-outline" size={44} color="#D23B3B" />
            <Text style={styles.centerText}>{state.error}</Text>
            <TouchableOpacity style={styles.retry} onPress={run}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        )}
        {!state.loading && !state.error && data && (
          <FlatList
            data={data.candidates}
            keyExtractor={(c) => c.id}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={styles.center}><Text style={styles.centerText}>No active sitters to evaluate.</Text></View>}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6F9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#ECEFF3' },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Poppins', fontWeight: '600', color: '#0D1B26' },
  devBadge: { backgroundColor: '#32A6D8', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  devBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  paramsCard: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#ECEFF3', padding: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F2F6F9', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderColor: '#ECEFF3', maxWidth: '100%' },
  chipText: { fontSize: 12, color: '#0D1B26', fontFamily: 'Avenir LT Std', fontWeight: '600' },

  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#ECEFF3', paddingVertical: 12, alignItems: 'center' },
  statN: { fontSize: 22, fontWeight: '700' },
  statL: { fontSize: 10, color: '#8A9BA8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 4, fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#ECEFF3', padding: 14, marginBottom: 12 },
  cardShown: { borderLeftWidth: 3, borderLeftColor: '#15924B' },
  cardHidden: { borderLeftWidth: 3, borderLeftColor: '#D23B3B' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#32A6D8', justifyContent: 'center', alignItems: 'center' },
  avatarHidden: { backgroundColor: '#94A3B8' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  name: { fontSize: 15, fontWeight: '600', color: '#0D1B26', fontFamily: 'Avenir LT Std' },
  subtle: { fontSize: 11, color: '#8A9BA8', marginTop: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillShown: { backgroundColor: '#E6F4EC' },
  pillHidden: { backgroundColor: '#EDF1F4' },
  pillText: { fontSize: 11, fontWeight: '700' },

  gates: { marginTop: 12, gap: 8 },
  gate: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  dotOk: { backgroundColor: '#15924B' },
  dotNo: { backgroundColor: '#D23B3B' },
  dotNa: { backgroundColor: '#B7C2CC' },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  gateLabel: { flex: 1, fontSize: 13, color: '#5A6B7B', fontFamily: 'Avenir LT Std' },
  gateVal: { fontSize: 13, color: '#0D1B26', fontWeight: '500', fontVariant: ['tabular-nums'] },
  gateFail: { color: '#D23B3B', fontWeight: '600' },

  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: '#FBE9E9', borderRadius: 10, padding: 10 },
  reasonText: { flex: 1, color: '#D23B3B', fontSize: 12, fontWeight: '600', fontFamily: 'Avenir LT Std', lineHeight: 17 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  centerText: { color: '#5A6B7B', fontSize: 14, textAlign: 'center', fontFamily: 'Avenir LT Std' },
  retry: { backgroundColor: '#32A6D8', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 11 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { useAppAlert } from '../../context/AlertContext';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import {
  getCashoutConfig, getMyWithdrawals, createWithdrawal,
  startConnectOnboarding, proceedWithdrawal, computeBreakdown,
} from '../../services/payoutService';

const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

const DOC_SLOTS = [
  { key: 'idFront', req: 'ID_FRONT', label: 'ID — front' },
  { key: 'idBack', req: 'ID_BACK', label: 'ID — back' },
  { key: 'selfie', req: 'SELFIE', label: 'Selfie' },
];

const STATUS_META = {
  PENDING: { color: '#B7791F', bg: '#FFF3D0', label: 'Under review' },
  APPROVED: { color: '#2B6CB0', bg: '#E3F0FB', label: 'Approved' },
  PROCESSING: { color: '#6B46C1', bg: '#E9D8FD', label: 'Processing' },
  COMPLETED: { color: '#2E9E5B', bg: '#DCF5E5', label: 'Completed' },
  REJECTED: { color: '#C53030', bg: '#FED7D7', label: 'Rejected' },
  FAILED: { color: '#C53030', bg: '#FED7D7', label: 'Failed' },
};

export default function CashOutScreen({ navigation }) {
  const alert = useAppAlert();
  const [cfg, setCfg] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, h] = await Promise.all([getCashoutConfig(), getMyWithdrawals().catch(() => [])]);
      setCfg(c);
      setHistory(h);
    } catch (e) {
      alert('Error', 'Could not load cash-out. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const settings = cfg?.settings;
  const coins = parseInt(amount, 10) || 0;
  const bd = settings ? computeBreakdown(coins, settings) : null;
  const requiredDocs = settings?.requiredDocs || [];
  const slots = DOC_SLOTS.filter((s) => requiredDocs.includes(s.req));
  const docsComplete = slots.every((s) => docs[s.key]);
  const belowMin = bd && bd.grossCents < (settings?.minWithdrawalCents || 0);
  const overBalance = coins > (cfg?.cashableCoins || 0);

  const pickDoc = async (slot) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled || !res.assets?.[0]) return;
      setUploading((u) => ({ ...u, [slot]: true }));
      const up = await uploadToCloudinary(res.assets[0].uri, CLOUDINARY_FOLDERS.USERS);
      if (up?.url) setDocs((d) => ({ ...d, [slot]: up.url }));
      else alert('Upload failed', 'Could not upload that image. Try again.', 'error');
    } catch (e) {
      alert('Upload failed', 'Could not upload that image. Try again.', 'error');
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  };

  const handleSetupPayouts = async () => {
    setBusy(true);
    try {
      const url = await startConnectOnboarding();
      if (url) {
        await WebBrowser.openBrowserAsync(url);
        await load(); // re-check connect status on return
      }
    } catch (e) {
      alert('Error', 'Could not start payout setup.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!docsComplete) { alert('Documents required', 'Please upload all required documents.', 'pending'); return; }
    setBusy(true);
    try {
      await createWithdrawal({ amountCoins: coins, documents: docs });
      setAmount(''); setDocs({});
      alert('Request submitted', settings?.processingText || 'Your withdrawal is under review.', 'success', 'OK', load);
    } catch (e) {
      alert('Could not submit', e?.response?.data?.message || 'Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleProceed = async (id) => {
    setBusy(true);
    try {
      const res = await proceedWithdrawal(id);
      alert('Payout sent!', res?.message || 'Your payout is on its way.', 'success', 'OK', load);
    } catch (e) {
      alert('Payout failed', e?.response?.data?.message || 'Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackArrowIcon width={20} height={20} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Cash Out</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper noBottomTabs><View style={styles.container}>{header}
        <View style={styles.center}><ActivityIndicator size="large" color="#32A6D8" /></View>
      </View></ScreenWrapper>
    );
  }

  if (!settings?.enabled) {
    return (
      <ScreenWrapper noBottomTabs><View style={styles.container}>{header}
        <View style={styles.center}><Text style={styles.muted}>Cash-out is currently unavailable.</Text></View>
      </View></ScreenWrapper>
    );
  }

  const pending = cfg?.pendingWithdrawal;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {header}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Available balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available to withdraw</Text>
            <Text style={styles.balanceValue}>{money(Math.round((cfg.cashableCoins / settings.coinsPerDollar) * 100))}</Text>
            <Text style={styles.balanceCoins}>{cfg.cashableCoins} coins · {settings.coinsPerDollar} coins = $1</Text>
          </View>

          {pending ? (
            /* ---- Existing request status ---- */
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.cardTitle}>Your withdrawal</Text>
                {(() => { const m = STATUS_META[pending.status] || STATUS_META.PENDING; return (
                  <View style={[styles.badge, { backgroundColor: m.bg }]}><Text style={[styles.badgeText, { color: m.color }]}>{m.label}</Text></View>
                ); })()}
              </View>
              <Breakdown bd={pending} />
              {pending.status === 'PENDING' && (
                <Text style={styles.processingText}>{settings.processingText}</Text>
              )}
              {pending.status === 'APPROVED' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => handleProceed(pending.id)} disabled={busy}>
                  {busy ? <ActivityIndicator color="#FFF" /> : <><Icon name="cash-outline" size={18} color="#FFF" /><Text style={styles.primaryText}>Withdraw {money(pending.netCents)} now</Text></>}
                </TouchableOpacity>
              )}
              {pending.status === 'REJECTED' && !!pending.adminNote && (
                <Text style={styles.rejectNote}>Reason: {pending.adminNote}</Text>
              )}
            </View>
          ) : !cfg.connect?.payoutsEnabled ? (
            /* ---- Connect setup required ---- */
            <View style={[styles.card, { alignItems: 'center' }]}>
              <Icon name="business-outline" size={30} color="#32A6D8" />
              <Text style={[styles.cardTitle, { marginTop: 8 }]}>Set up your payout account</Text>
              <Text style={styles.muted}>Before you can cash out, link your bank securely through Stripe. Stripe verifies your identity and bank details.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSetupPayouts} disabled={busy}>
                {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Set up payouts</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            /* ---- New request form ---- */
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Amount</Text>
                <View style={styles.amountRow}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#B5B8CB"
                    keyboardType="number-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <Text style={styles.coinsSuffix}>coins</Text>
                  <TouchableOpacity onPress={() => setAmount(String(cfg.cashableCoins))} style={styles.maxBtn}>
                    <Text style={styles.maxText}>MAX</Text>
                  </TouchableOpacity>
                </View>
                {overBalance && <Text style={styles.err}>You can withdraw up to {cfg.cashableCoins} coins.</Text>}
                {!overBalance && belowMin && (
                  <Text style={styles.err}>Minimum is {money(settings.minWithdrawalCents)}.</Text>
                )}
                {coins > 0 && bd && !overBalance && !belowMin && (
                  <>
                    <View style={styles.divider} />
                    <Breakdown bd={bd} feePercent={settings.feePercent} />
                  </>
                )}
              </View>

              {/* Documents */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Identity documents</Text>
                <Text style={styles.hint}>Required for every withdrawal.</Text>
                <View style={styles.docsRow}>
                  {slots.map((s) => (
                    <TouchableOpacity key={s.key} style={styles.docSlot} onPress={() => pickDoc(s.key)} disabled={uploading[s.key]}>
                      {uploading[s.key] ? (
                        <ActivityIndicator size="small" color="#32A6D8" />
                      ) : docs[s.key] ? (
                        <Image source={{ uri: docs[s.key] }} style={styles.docThumb} />
                      ) : (
                        <Icon name="camera-outline" size={22} color="#32A6D8" />
                      )}
                      <Text style={styles.docLabel}>{s.label}</Text>
                      {docs[s.key] && <View style={styles.docCheck}><Icon name="checkmark" size={12} color="#FFF" /></View>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (!coins || overBalance || belowMin || !docsComplete || busy) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!coins || overBalance || belowMin || !docsComplete || busy}
              >
                {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Submit request</Text>}
              </TouchableOpacity>
              <Text style={styles.processingText}>{settings.processingText}</Text>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>History</Text>
              {history.map((h) => {
                const m = STATUS_META[h.status] || STATUS_META.PENDING;
                return (
                  <View key={h.id} style={styles.histRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.histAmount}>{money(h.netCents)}</Text>
                      <Text style={styles.histSub}>{h.amountCoins} coins · {new Date(h.createdAt).toLocaleDateString('en-US')}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: m.bg }]}><Text style={[styles.badgeText, { color: m.color }]}>{m.label}</Text></View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const Breakdown = ({ bd, feePercent }) => (
  <View style={{ marginTop: 8 }}>
    <Row label="Amount" value={money(bd.grossCents)} />
    <Row label="Flat fee" value={`– ${money(bd.flatFeeCents)}`} red />
    <Row label={`Fee${feePercent != null ? ` (${feePercent}%)` : ''}`} value={`– ${money(bd.percentFeeCents)}`} red />
    <View style={styles.divider} />
    <Row label="You'll receive" value={money(bd.netCents)} bold />
  </View>
);

const Row = ({ label, value, red, bold }) => (
  <View style={styles.brRow}>
    <Text style={[styles.brLabel, bold && { color: '#0D0D12', fontWeight: '700' }]}>{label}</Text>
    <Text style={[styles.brValue, red && { color: '#E53D3D' }, bold && { color: '#3FA477', fontWeight: '700', fontSize: 18 }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  muted: { color: '#818898', fontSize: 13, fontFamily: 'Poppins', lineHeight: 19, marginTop: 6, textAlign: 'center' },
  hint: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', marginTop: 3 },
  balanceCard: { backgroundColor: '#32A6D8', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', marginBottom: 14 },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Poppins' },
  balanceValue: { color: '#FFFFFF', fontSize: 30, fontFamily: 'Poppins', fontWeight: '700', marginTop: 2 },
  balanceCoins: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Poppins', marginTop: 2 },
  card: { borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'stretch' },
  cardTitle: { color: '#0D0D12', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  amountInput: { flex: 1, fontSize: 28, fontFamily: 'Poppins', fontWeight: '700', color: '#0D0D12', padding: 0 },
  coinsSuffix: { color: '#818898', fontSize: 14, fontFamily: 'Poppins', marginRight: 10 },
  maxBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(90,172,244,0.15)' },
  maxText: { color: '#32A6D8', fontSize: 12, fontFamily: 'Poppins', fontWeight: '700' },
  err: { color: '#E53D3D', fontSize: 12, fontFamily: 'Poppins', marginTop: 8 },
  brRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  brLabel: { color: '#5B6B7B', fontSize: 14, fontFamily: 'Poppins' },
  brValue: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  docsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  docSlot: { flex: 1, height: 88, borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  docThumb: { ...StyleSheet.absoluteFillObject },
  docLabel: { color: '#818898', fontSize: 10, fontFamily: 'Poppins', marginTop: 6, textAlign: 'center' },
  docCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#3FA477', justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#32A6D8', height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  processingText: { color: '#A0AEC0', fontSize: 12, fontFamily: 'Poppins', textAlign: 'center', marginTop: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '600' },
  rejectNote: { color: '#E53D3D', fontSize: 12, fontFamily: 'Poppins', marginTop: 10 },
  sectionTitle: { color: '#0D0D12', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600', marginBottom: 10 },
  histRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 12, padding: 12, marginBottom: 8 },
  histAmount: { color: '#0D0D12', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  histSub: { color: '#818898', fontSize: 11, fontFamily: 'Poppins', marginTop: 2 },
});

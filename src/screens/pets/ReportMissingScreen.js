import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { useAppAlert } from '../../context/AlertContext';
import { reportPetMissing } from '../../services/petService';
import { useSelector } from 'react-redux';

export default function ReportMissingScreen({ navigation, route }) {
  const alert = useAppAlert();
  const { pet } = route.params || {};
  const currentUser = useSelector((s) => s.auth?.user);

  const [lastSeenAt, setLastSeenAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [location, setLocation] = useState({ address: '', latitude: null, longitude: null });
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openLocationPicker = () => {
    // Callback only updates THIS screen's state — don't call navigate here.
    // LocationPicker's own goBack() will bring the user back to this still-
    // mounted screen. Earlier the callback did navigate('ReportMissing', ...)
    // which popped LocationPicker; then LocationPicker's goBack() popped this
    // screen too, dumping the user back on the Pet Profile.
    navigation.navigate('LocationPicker', {
      onLocationSelect: (loc) => {
        setLocation({
          address: loc.address || loc.addressLine1 || 'Selected Location',
          latitude: loc.latitude ?? null,
          longitude: loc.longitude ?? null,
        });
      },
    });
  };

  const onDatePickerChange = (event, selected) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event?.type === 'dismissed' || !selected) return;
    if (datePickerMode === 'date') {
      const merged = new Date(lastSeenAt);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setLastSeenAt(merged);
      // Chain into time picker on Android (iOS combined)
      if (Platform.OS === 'android') {
        setDatePickerMode('time');
        setTimeout(() => setShowDatePicker(true), 50);
      }
    } else {
      const merged = new Date(lastSeenAt);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setLastSeenAt(merged);
    }
  };

  const handleSubmit = async () => {
    if (!contactPhone?.trim()) {
      alert('Missing contact', 'Add a phone number people can reach you on.', 'error');
      return;
    }
    if (!lastSeenAt) {
      alert('Missing date', 'Pick when your pet was last seen.', 'error');
      return;
    }
    if (lastSeenAt > new Date(Date.now() + 60 * 60 * 1000)) {
      alert('Invalid date', 'Last-seen time cannot be in the future.', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await reportPetMissing(pet.id, {
        lastSeenAt: lastSeenAt.toISOString(),
        lastSeenLat: location.latitude,
        lastSeenLng: location.longitude,
        lastSeenAddress: location.address || null,
        contactPhone: contactPhone.trim(),
        notes: notes?.trim() || null,
      });
      // Show the success alert FIRST; navigate back only after the user
      // dismisses it. Previously alert() + goBack() ran synchronously,
      // unmounting the screen before the alert had a chance to render.
      alert(
        `${pet.name} reported missing`,
        'Anyone scanning the QR tag will see an emergency banner with your contact info.',
        'success',
        'OK',
        () => navigation.goBack()
      );
    } catch (e) {
      alert('Failed', e?.message || 'Could not report missing. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = lastSeenAt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = lastSeenAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <ScreenWrapper noBottomTabs>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Missing</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.urgencyCard}>
            <Icon name="warning" size={20} color="#D93025" />
            <View style={{ flex: 1 }}>
              <Text style={styles.urgencyTitle}>Reporting {pet?.name} as missing</Text>
              <Text style={styles.urgencyText}>
                Anyone who scans the QR tag will see an emergency alert with your contact details.
                You'll get a notification each time the tag is scanned.
              </Text>
            </View>
          </View>

          {/* Last seen — date + time */}
          <Text style={styles.label}>When were they last seen?</Text>
          <View style={styles.datetimeRow}>
            <TouchableOpacity
              style={styles.datetimeField}
              onPress={() => {
                setDatePickerMode('date');
                setShowDatePicker(true);
              }}
            >
              <Icon name="calendar-outline" size={18} color="#32A6D8" />
              <Text style={styles.datetimeText}>{dateLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.datetimeField}
              onPress={() => {
                setDatePickerMode('time');
                setShowDatePicker(true);
              }}
            >
              <Icon name="time-outline" size={18} color="#32A6D8" />
              <Text style={styles.datetimeText}>{timeLabel}</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={lastSeenAt}
              mode={datePickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onDatePickerChange}
            />
          )}

          {/* Last seen — location */}
          <Text style={styles.label}>Where were they last seen?</Text>
          <TouchableOpacity style={styles.locationField} onPress={openLocationPicker}>
            <Icon name="location-outline" size={20} color="#32A6D8" />
            <Text
              style={[styles.locationText, !location.address && styles.placeholderColor]}
              numberOfLines={2}
            >
              {location.address || 'Tap to pick a location on the map'}
            </Text>
            <Icon name="chevron-forward" size={18} color="#818898" />
          </TouchableOpacity>

          {/* Contact phone */}
          <Text style={styles.label}>Contact phone number</Text>
          <View style={styles.inputWrap}>
            <Icon name="call-outline" size={18} color="#32A6D8" />
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+92 300 0000000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.hint}>Shown publicly on the QR tag page so finders can call you.</Text>

          {/* Notes */}
          <Text style={styles.label}>Anything else? (optional)</Text>
          <View style={[styles.inputWrap, styles.notesWrap]}>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. wearing red collar, friendly with strangers, responds to 'Buddy'"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="megaphone" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Report {pet?.name} as Missing</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500', marginLeft: 8 },
  placeholder: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  urgencyCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF1EC',
    borderColor: '#FFD4C2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  urgencyTitle: { color: '#0D0D12', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600', marginBottom: 4 },
  urgencyText: { color: '#4B5563', fontSize: 12, fontFamily: 'Avenir LT Std', lineHeight: 17 },
  label: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginTop: 14,
    marginBottom: 6,
  },
  datetimeRow: { flexDirection: 'row', gap: 10 },
  datetimeField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datetimeText: { color: '#0D0D12', fontSize: 13, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  locationText: { flex: 1, color: '#0D0D12', fontSize: 13, fontFamily: 'Avenir LT Std' },
  placeholderColor: { color: '#9CA3AF' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  notesWrap: { alignItems: 'flex-start', paddingVertical: 10 },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
  },
  notesInput: { textAlignVertical: 'top', minHeight: 96 },
  hint: { color: '#818898', fontSize: 11, fontFamily: 'Avenir LT Std', marginTop: 4, paddingHorizontal: 4 },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#D93025',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600' },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Dropdown from '../../../components/Dropdown';
import PetTypeMultiSelect from '../../../components/PetTypeMultiSelect';
import TimeField from '../../../components/TimeField';
import UnsavedChangesModal from '../../../components/UnsavedChangesModal';
import AdditionalRatesSection from '../../../components/AdditionalRatesSection';
import { BackArrowIcon, InfoCircleIcon, CoinIcon, AngleDownIcon, ProgressTickIcon, InfoCircleIconBlue } from '../../../assets';
import { upsertServiceSetup, getServiceSetup } from '../../../services/serviceSetupService';
import { getServiceUnit, formatEarnRange } from '../../../utils/serviceUnits';

const { unit: RATE_UNIT, pricedBy: PRICED_BY } = getServiceUnit('PET_WALKING');


const { width } = Dimensions.get('window');

// Named constants for rate multipliers and defaults.
// Hour-based service: 60 coins/hour (1 min = 1 coin → 1 hr = 60 coins,
// i.e. the 1440/day day-rate divided across 24h). Sitter can still edit.
const DEFAULT_BASE_RATE = '60';
const HOLIDAY_RATE_MULTIPLIER = 1.12;
const ADDITIONAL_DOG_RATE_MULTIPLIER = 0.72;
const PUPPY_RATE_MULTIPLIER = 0.72;
const LONG_STAY_RATE_MULTIPLIER = 0.94;
const DEFAULT_EXTENDED_CARE_MIN = '50';
const DEFAULT_EXTENDED_CARE_MAX = '100';
const DEFAULT_MAX_PETS = '2';
const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_BUTTON_WIDTH_RATIO = 0.09;
const DAYS_SELECTOR_WIDTH_RATIO = 0.8;
const BOTTOM_BUTTON_WIDTH_RATIO = 0.9;
const BOTTOM_BUTTON_MARGIN_RATIO = 0.05;

export default function PetWalkingSettingsScreen({ navigation }) {
    const [baseRate, setBaseRate] = useState(DEFAULT_BASE_RATE);
    const [additionalRates, setAdditionalRates] = useState(false);
    const [showAdditionalRates, setShowAdditionalRates] = useState(false);
    
    // Additional rates state
    const [holidayRate, setHolidayRate] = useState('');
    const [additionalDogRate, setAdditionalDogRate] = useState('');
    const [puppyRate, setPuppyRate] = useState('');
    const [longStayRate, setLongStayRate] = useState('');
    const [bathingGrooming, setBathingGrooming] = useState('Free');
    const [extendedCareMin, setExtendedCareMin] = useState(DEFAULT_EXTENDED_CARE_MIN);
    const [extendedCareMax, setExtendedCareMax] = useState(DEFAULT_EXTENDED_CARE_MAX);
    
    // Pet size selection state
    const [selectedPetSizes, setSelectedPetSizes] = useState([]);
    
    const [availabilityImportant, setAvailabilityImportant] = useState('yes');
    const [selectedDays, setSelectedDays] = useState(['Su']);
    // Daily availability window (HH:mm, 24-hour). Applied to every
    // day in selectedDays. Owner-side search filters by this window.
    const [dailyStartTime, setDailyStartTime] = useState('09:00');
    const [dailyEndTime, setDailyEndTime] = useState('17:00');
    const [pottyBreaks, setPottyBreaks] = useState('0-2 hours');
    const [homeType, setHomeType] = useState('House');
    const [yardType, setYardType] = useState('Fenced yard');
    const [cancellationPolicy, setCancellationPolicy] = useState('Same Day');
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isExistingData, setIsExistingData] = useState(false);
    
    // Dropdown states
    const [contactTime, setContactTime] = useState('Select time');
    const [maxPets, setMaxPets] = useState(DEFAULT_MAX_PETS);
    // petTypes now holds an array of selected pet types (multi-select).
    // Legacy rows that saved a single string are tolerated on load below.
    const [petTypes, setPetTypes] = useState([]);
    const [homeExpectations, setHomeExpectations] = useState('No smoking inside');
    // hostAvailability holds an array of selected options (multi-select).
    // Legacy rows that saved a single string are tolerated on load below.
    const [hostAvailability, setHostAvailability] = useState([]);

    // Auto-fill additional rate defaults only for fields the sitter
    // hasn't touched — same behavior as the other setup screens.
    React.useEffect(() => {
        // Relative mode ON: auto-compute + lock additional rates. OFF: leave
        // values in place for manual editing. Recompute on toggle-on / base change.
        if (!additionalRates) return;
        const base = parseFloat(baseRate) || 0;
        setHolidayRate(Math.round(base * HOLIDAY_RATE_MULTIPLIER).toString());
        setAdditionalDogRate(Math.round(base * ADDITIONAL_DOG_RATE_MULTIPLIER).toString());
        setPuppyRate(Math.round(base * PUPPY_RATE_MULTIPLIER).toString());
        setLongStayRate(Math.round(base * LONG_STAY_RATE_MULTIPLIER).toString());
    }, [additionalRates, baseRate]);

    useFocusEffect(
        React.useCallback(() => {
            fetchSettings();
        }, [])
    );

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const response = await getServiceSetup('PET_WALKING');
            
            if (response.success && response.data.exists && response.data.settings) {
                const settings = response.data.settings;
                setIsExistingData(true);
                setBaseRate(settings.baseRate || DEFAULT_BASE_RATE);
                setAdditionalRates(settings.additionalRates || false);
                setShowAdditionalRates(settings.showAdditionalRates || false);
                setHolidayRate(settings.holidayRate || '');
                setAdditionalDogRate(settings.additionalDogRate || '');
                setPuppyRate(settings.puppyRate || '');
                setLongStayRate(settings.longStayRate || '');
                setBathingGrooming(settings.bathingGrooming || 'Free');
                setExtendedCareMin(settings.extendedCareMin || '50');
                setExtendedCareMax(settings.extendedCareMax || '100');
                setSelectedPetSizes(settings.selectedPetSizes || []);
                setAvailabilityImportant(settings.availabilityImportant || 'yes');
                setSelectedDays(settings.selectedDays || ['Su']);
                setDailyStartTime(settings.dailyStartTime || '09:00');
                setDailyEndTime(settings.dailyEndTime || '17:00');
                setPottyBreaks(settings.pottyBreaks || '0-2 hours');
                setContactTime(settings.contactTime || 'Select time');
                setMaxPets(settings.maxPets || '2');
                // Tolerate legacy string values (pre multi-select migration)
                setPetTypes(
                    Array.isArray(settings.petTypes)
                        ? settings.petTypes
                        : settings.petTypes ? [settings.petTypes] : []
                );
                setHomeType(settings.homeType || 'House');
                setYardType(settings.yardType || 'Fenced yard');
                setHomeExpectations(settings.homeExpectations || 'No smoking inside');
                // Tolerate legacy single-string values (pre multi-select migration)
                setHostAvailability(
                    Array.isArray(settings.hostAvailability)
                        ? settings.hostAvailability
                        : settings.hostAvailability ? [settings.hostAvailability] : []
                );
                setCancellationPolicy(settings.cancellationPolicy || 'Same Day');
            } else {
                setIsExistingData(false);
            }
        } catch (error) {
            console.error('Failed to fetch pet walking settings:', error);
            setIsExistingData(false);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const togglePetSize = (size) => {
        setSelectedPetSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const handleSave = async () => {
        // A base rate greater than 0 is required — without it the sitter shows
        // up in search but can't be booked (rate 0 → total mismatch server-side).
        if (!Number.isFinite(parseFloat(baseRate)) || parseFloat(baseRate) <= 0) {
            alert('Please enter a base rate greater than 0 before saving.');
            return;
        }

        // Validate that at least one pet size is selected
        if (selectedPetSizes.length === 0) {
            alert('Please select at least one pet size category');
            return;
        }

        setIsSaving(true);
        try {
            const settings = {
                baseRate,
                additionalRates,
                showAdditionalRates,
                holidayRate,
                additionalDogRate,
                puppyRate,
                longStayRate,
                bathingGrooming,
                extendedCareMin,
                extendedCareMax,
                selectedPetSizes,
                availabilityImportant,
                selectedDays,
                dailyStartTime,
                dailyEndTime,
                pottyBreaks,
                contactTime,
                maxPets,
                petTypes,
                homeType,
                yardType,
                homeExpectations,
                hostAvailability,
                cancellationPolicy
            };
            const response = await upsertServiceSetup('PET_WALKING', settings, true);
            if (response.success) {
                navigation.navigate('ProfileSetup', { completedService: 'petWalking' });
            } else {
                alert('Failed to save settings. Please try again.');
            }
        } catch (error) {
            console.error('Error saving pet walking settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackPress = () => {
        setShowUnsavedModal(true);
    };

    const handleCancelLeave = () => {
        setShowUnsavedModal(false);
    };

    const handleConfirmLeave = () => {
        setShowUnsavedModal(false);
        navigation.goBack();
    };

    return (
        <ScreenWrapper noBottomTabs>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                    >
                        <BackArrowIcon width={20} height={20} fill='#090E12' />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pet Walking</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Manage Pet Walking Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.pageTitle}>Manage Pet Walking</Text>
                    </View>

                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <View style={styles.infoBannerIcon}>
                            <InfoCircleIconBlue width={16.67} height={16.67} fill='#32A6D8' />
                        </View>
                        <Text style={styles.infoBannerText}>
                            We've recommended default settings that work well for new sitters and walkers. You can update them now or change them anytime later
                        </Text>
                    </View>

                    {/* Rates Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rates</Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Set base rate</Text>
                            <View style={styles.rateInputWrapper}>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={baseRate}
                                    onChangeText={setBaseRate}
                                    keyboardType="numeric"
                                    leftIcon={<CoinIcon width={18.35} height={18.35} />}
                                    containerStyle={styles.rateInputContainer}
                                />
                                <Text style={styles.rateUnitText}>/{RATE_UNIT}</Text>
                            </View>
                            {formatEarnRange(baseRate) && (
                                <Text style={styles.earnRangeText}>{formatEarnRange(baseRate)}</Text>
                            )}
                        </View>

                        <View style={styles.toggleCard}>
                            <View style={styles.toggleHeader}>
                                <Text style={styles.toggleTitle}>
                                    Set additional rates relative to my base rate
                                </Text>
                                <TouchableOpacity
                                    style={styles.toggle}
                                    onPress={() => setAdditionalRates(!additionalRates)}
                                >
                                    <View style={[styles.toggleTrack, additionalRates && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, additionalRates && styles.toggleThumbActive]} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <AdditionalRatesSection
                            additionalRates={additionalRates}
                            showAdditionalRates={showAdditionalRates}
                            onToggleShow={() => setShowAdditionalRates(!showAdditionalRates)}
                            holidayRate={holidayRate}
                            onHolidayRateChange={setHolidayRate}
                            additionalDogRate={additionalDogRate}
                            onAdditionalDogRateChange={setAdditionalDogRate}
                            puppyRate={puppyRate}
                            onPuppyRateChange={setPuppyRate}
                            longStayRate={longStayRate}
                            onLongStayRateChange={setLongStayRate}
                            extendedCareMin={extendedCareMin}
                            extendedCareMax={extendedCareMax}
                            selectedPetSizes={selectedPetSizes}
                            onTogglePetSize={togglePetSize}
                            pricedBy={PRICED_BY}
                        />
                    </View>

                    {/* Availability Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Availability</Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Are you available full-time for this service?</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => setAvailabilityImportant('yes')}
                                >
                                    <View style={[styles.radioButton, availabilityImportant !== 'yes' && styles.radioButtonUnselected]}>
                                        {availabilityImportant === 'yes' && <ProgressTickIcon width={25} height={25} fill="#32A6D8" />}
                                    </View>
                                    <Text style={styles.radioLabel}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => setAvailabilityImportant('no')}
                                >
                                    <View style={[styles.radioButton, availabilityImportant !== 'no' && styles.radioButtonUnselected]}>
                                        {availabilityImportant === 'no' && <ProgressTickIcon width={25} height={25} fill="#32A6D8" />}
                                    </View>
                                    <Text style={styles.radioLabel}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What days are you generally available to offer Pet Walking?</Text>
                            <View style={styles.daysSelector}>
                                {DAYS_OF_WEEK.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayButton, selectedDays.includes(day) && styles.dayButtonSelected]}
                                        onPress={() => toggleDay(day)}
                                    >
                                        <Text style={[styles.dayButtonText, selectedDays.includes(day) && styles.dayButtonTextSelected]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What hours are you available on those days?</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <TimeField value={dailyStartTime} onChange={setDailyStartTime} label="Start" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TimeField value={dailyEndTime} onChange={setDailyEndTime} label="End" />
                                </View>
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>How often can you offer potty breaks?</Text>
                            <View style={styles.radioGroupGrid}>
                                {['0-2 hours', '4-8 hours', '2-4 hours', '8+ hours'].map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.radioOptionInline}
                                        onPress={() => setPottyBreaks(option)}
                                    >
                                        <View style={[styles.radioButton, pottyBreaks !== option && styles.radioButtonUnselected]}>
                                            {pottyBreaks === option && <ProgressTickIcon width={25} height={25} fill="#32A6D8" />}
                                        </View>
                                        <Text style={styles.radioLabel}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>How early should new clients contact you before a booking?</Text>
                            <Dropdown
                                placeholder="Select time"
                                value={contactTime}
                                onSelect={setContactTime}
                                options={['Same day', '1 day before', '2 days before', '3 days before', '1 week before']}
                                leftIcon={<InfoCircleIcon width={16.67} height={16.67} fill='#FFC2EB' />}
                                rightIcon={<AngleDownIcon width={8.33} height={5} fill='#3B1153' />}
                                containerStyle={styles.dropdownContainer}
                            />
                        </View>
                    </View>

                    {/* Pet Preferences Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pet Preferences</Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>How many pets can you sit?</Text>
                            <Dropdown
                                placeholder="Select number"
                                value={maxPets}
                                onSelect={setMaxPets}
                                options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']}
                                rightIcon={<AngleDownIcon width={8.33} height={5} fill='#3B1153' />}
                                containerStyle={styles.dropdownContainer}
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What type of pets can you sit?</Text>
                            <PetTypeMultiSelect value={petTypes} onChange={setPetTypes} />
                        </View>
                    </View>

                    {/* About Your Home Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About your home</Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What type of home do you live?</Text>
                            <View style={styles.radioGroupGrid}>
                                {['House', 'Apartment', 'Farm'].map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.radioOptionInline}
                                        onPress={() => setHomeType(option)}
                                    >
                                        <View style={[styles.radioButton, homeType !== option && styles.radioButtonUnselected]}>
                                            {homeType === option && <ProgressTickIcon width={25} height={25} fill="#32A6D8" />}
                                        </View>
                                        <Text style={styles.radioLabel}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What type of outdoor space do you have?</Text>
                            <View style={styles.radioGroupGrid}>
                                {['Fenced yard', 'No yard', 'Unfenced yard'].map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.radioOptionInline}
                                        onPress={() => setYardType(option)}
                                    >
                                        <View style={[styles.radioButton, yardType !== option && styles.radioButtonUnselected]}>
                                            {yardType === option && <ProgressTickIcon width={25} height={25} fill="#32A6D8" />}
                                        </View>
                                        <Text style={styles.radioLabel}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What can pet owners expect when Pet Walking at your home?</Text>
                            <Dropdown
                                placeholder="Select expectation"
                                value={homeExpectations}
                                onSelect={setHomeExpectations}
                                options={['No smoking inside', 'Smoke-free home', 'Pet-proofed home', 'Fenced outdoor area', 'Indoor only', 'Quiet neighborhood']}
                                rightIcon={<AngleDownIcon width={8.33} height={5} fill='#3B1153' />}
                                containerStyle={styles.dropdownContainer}
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Are you available to host any of these?</Text>
                            <PetTypeMultiSelect
                                value={hostAvailability}
                                onChange={setHostAvailability}
                                options={['Pets that are not crate trained', 'Unneutered males', 'Females in heat', 'Puppies / kittens', 'Senior pets', 'Special needs pets']}
                            />
                        </View>
                    </View>

                    {/* Cancellation Policy Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cancellation Policy</Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>What are your pet sitting cancellation rules?</Text>
                            <View style={styles.radioGroupGrid}>
                                {['Same Day', 'One Day', 'Three Day', 'Seven Day'].map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.radioOptionInline}
                                        onPress={() => setCancellationPolicy(option)}
                                    >
                                        <View style={[styles.radioButton, cancellationPolicy !== option && styles.radioButtonUnselected]}>
                                            {cancellationPolicy === option && <ProgressTickIcon width={25} height={25} fill="#32A6D8" />}
                                        </View>
                                        <Text style={styles.radioLabel}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Text style={styles.noteText}>
                            Note: Service providers (e.g., sitters) are required to follow all relevant laws & regulations. See Terms of Service
                        </Text>
                    </View>
                </ScrollView>

                {/* Unsaved Changes Modal */}
                <UnsavedChangesModal
                    visible={showUnsavedModal}
                    onCancel={handleCancelLeave}
                    onLeave={handleConfirmLeave}
                />

                {/* Save Button */}
                <Button
                    style={styles.bottomButtonContainer}
                    title={isSaving ? (isExistingData ? "Updating..." : "Saving...") : (isExistingData ? "Update" : "Save")}
                    onPress={handleSave}
                    type="secondary"
                    size="medium"
                    fullWidth
                    disabled={isSaving}
                />
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
        height: 52,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#000000',
        fontSize: 16,
        fontFamily: 'Poppins',
        fontWeight: '500',
        lineHeight: 24.8,
    },
    headerPlaceholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 20,
    },
    titleContainer: {
        marginBottom: 8,
    },
    pageTitle: {
        color: '#0D0D12',
        fontSize: 14,
        fontFamily: 'Poppins',
        fontWeight: '500',
        lineHeight: 21.7,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 15,
        backgroundColor: '#DAEFF8',
        borderRadius: 10,
        marginBottom: 16,
    },
    infoBannerIcon: {
        marginTop: 2,
    },
    infoBannerText: {
        flex: 1,
        color: '#898D8F',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18,
    },
    section: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 2,
        borderRadius: 12,
        gap: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#0D0D12',
        fontSize: 14,
        fontFamily: 'Poppins',
        fontWeight: '500',
        lineHeight: 21.7,
    },
    fieldGroup: {
        gap: 4,
    },
    fieldLabel: {
        color: '#090E12',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 2,
    },
    rateInputWrapper: {
        position: 'relative',
    },
    rateInputContainer: {
        marginBottom: 0,
    },
    rateUnitText: {
        position: 'absolute',
        right: 20,
        top: 18,
        color: '#32A6D8',
        fontSize: 14,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
    },
    earnRangeText: {
        marginTop: 8,
        color: '#676869',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18,
    },
    dropdownContainer: {
        marginBottom: 0,
    },
    toggleCard: {
        padding: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 2,
        borderRadius: 12,
        gap: 12,
    },
    toggleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    toggleTitle: {
        flex: 1,
        color: '#000000',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleTrack: {
        width: 44,
        height: 24,
        backgroundColor: '#E0E0E0',
        borderRadius: 12,
        justifyContent: 'center',
        position: 'relative',
    },
    toggleTrackActive: {
        backgroundColor: '#FFC2EB',
    },
    toggleThumb: {
        position: 'absolute',
        left: 2,
        width: 20,
        height: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFC2EB',
        shadowColor: '#000',
        shadowOffset: { width: -3, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleThumbActive: {
        left: 22,
    },
    showMoreButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 40,
        alignSelf: 'center',
    },
    showMoreText: {
        color: '#32A6D8',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        textDecorationLine: 'underline',
        lineHeight: 18.6,
    },
    radioGroup: {
        height: 56,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EBEBEB',
        flexDirection: 'row',
        gap: 11,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioButton: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonUnselected: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#32A6D8',
    },
    radioButtonSelected: {
        width: 19.95,
        height: 19.95,
        borderRadius: 10,
        backgroundColor: '#32A6D8',
    },
    radioLabel: {
        color: '#898D8F',
        fontSize: 14,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
    },
    daysSelector: {
        width: width * DAYS_SELECTOR_WIDTH_RATIO,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'nowrap',
    },
    dayButton: {
        width: width * DAY_BUTTON_WIDTH_RATIO,

        paddingVertical: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D9D9D9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonSelected: {
        backgroundColor: 'rgba(255, 194, 235, 0.15)',
        borderColor: '#FFC2EB',
    },
    dayButtonText: {
        color: '#666D80',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    dayButtonTextSelected: {
        color: '#32A6D8',
    },
    radioGroupGrid: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EBEBEB',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    radioOptionInline: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    selectInput: {
        minHeight: 56,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EBEBEB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectInputContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectInputText: {
        color: '#898D8F',
        fontSize: 14,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
    },
    selectInputValue: {
        color: '#898D8F',
        fontSize: 13,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
    },
    noteText: {
        color: '#32A6D8',
        fontSize: 11,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
    },
    bottomButtonContainer: {
        width: width * BOTTOM_BUTTON_WIDTH_RATIO,
        marginHorizontal: width * BOTTOM_BUTTON_MARGIN_RATIO,
        marginTop: 5,
    },
});



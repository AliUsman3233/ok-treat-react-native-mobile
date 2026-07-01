import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Dropdown from '../../../components/Dropdown';
import PetTypeMultiSelect from '../../../components/PetTypeMultiSelect';
import UnsavedChangesModal from '../../../components/UnsavedChangesModal';
import { BackArrowIcon, InfoCircleIcon, CoinIcon, CoinBackgroundIcon, AngleDownIcon, ProgressTickIcon, InfoCircleIconBlue } from '../../../assets';
import { upsertServiceSetup, getServiceSetup } from '../../../services/serviceSetupService';


const { width } = Dimensions.get('window');

// Recommended sitter baseRate per the product spec: 1 day = 1440 coins
// (1 min = 1 coin, 24h shift). Pre-filled; sitter can still edit.
const DEFAULT_BASE_RATE = '1440';
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

export default function BoardingSettingsScreen({ navigation }) {
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
    
    // Pet size selection state - default to empty array
    const [selectedPetSizes, setSelectedPetSizes] = useState([]);
    
    const [availabilityImportant, setAvailabilityImportant] = useState('yes');
    const [selectedDays, setSelectedDays] = useState(['Su']);
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

    // Calculate additional rates based on base rate when toggle is ON
    React.useEffect(() => {
        if (additionalRates && baseRate) {
            const base = parseFloat(baseRate) || 0;
            setHolidayRate(Math.round(base * HOLIDAY_RATE_MULTIPLIER).toString());
            setAdditionalDogRate(Math.round(base * ADDITIONAL_DOG_RATE_MULTIPLIER).toString());
            setPuppyRate(Math.round(base * PUPPY_RATE_MULTIPLIER).toString());
            setLongStayRate(Math.round(base * LONG_STAY_RATE_MULTIPLIER).toString());
        }
    }, [additionalRates, baseRate]);

    // Fetch saved data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchBoardingSettings();
        }, [])
    );

    const fetchBoardingSettings = async () => {
        try {
            setIsLoading(true);
            const response = await getServiceSetup('BOARDING');
            
            if (response.success && response.data.exists && response.data.settings) {
                const settings = response.data.settings;
                
                // Mark that we have existing data
                setIsExistingData(true);
                
                // Populate all fields with saved data
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
                // No existing data
                setIsExistingData(false);
            }
        } catch (error) {
            console.error('Failed to fetch boarding settings:', error);
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
        // Validate that at least one pet size is selected
        if (selectedPetSizes.length === 0) {
            alert('Please select at least one pet size category');
            return;
        }

        setIsSaving(true);
        
        try {
            // Prepare settings data
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

            // Save to backend
            const response = await upsertServiceSetup('BOARDING', settings, true);
            
            if (response.success) {
                console.log('Boarding settings saved successfully');
                navigation.navigate('ProfileSetup', { completedService: 'boarding' });
            } else {
                console.error('Failed to save boarding settings:', response.message);
                alert('Failed to save settings. Please try again.');
            }
        } catch (error) {
            console.error('Error saving boarding settings:', error);
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
                    <Text style={styles.headerTitle}>Boarding</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Boarding Settings Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.pageTitle}>Boarding Settings</Text>
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
                                <Text style={styles.rateUnitText}>/ per day</Text>
                            </View>
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
                            
                            {/* Pet Size Categories — required. Previously buried inside
                                the collapsed Additional Rates section, which caused testers
                                to hit "select at least one pet size" with no idea where the
                                selector lived. Now a top-level required field. */}
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.fieldLabel}>Pet sizes you can accept</Text>
                                <Text style={styles.fieldHint}>Select all weight ranges (in pounds) you can sit.</Text>
                                <View style={styles.sizeOptions}>
                                    {['1-15', '16-40', '41-100', '101+'].map((size, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.sizeBox,
                                                selectedPetSizes.includes(size) && styles.sizeBoxSelected
                                            ]}
                                            onPress={() => togglePetSize(size)}
                                        >
                                            <Icon
                                                name="paw"
                                                size={24}
                                                color={selectedPetSizes.includes(size) ? '#FFC2EB' : '#D0D0D0'}
                                            />
                                            <Text style={styles.sizeText}>
                                                <Text style={[
                                                    styles.sizeNumber,
                                                    selectedPetSizes.includes(size) && styles.sizeNumberSelected
                                                ]}>{size}{'\n'}</Text>
                                                <Text style={styles.sizeLabel}>pounds</Text>
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.showMoreButton}
                                onPress={() => setShowAdditionalRates(!showAdditionalRates)}
                            >
                                <Text style={styles.showMoreText}>
                                    {showAdditionalRates ? 'Hide' : 'Show'} additional rates
                                </Text>
                            </TouchableOpacity>

                            {/* Additional Rates Details */}
                            {showAdditionalRates && (
                                <View style={styles.additionalRatesSection}>
                                    <View style={styles.ratesList}>
                                        {/* Holiday Rate */}
                                        <View style={styles.rateRow}>
                                            <View style={styles.rateLeft}>
                                                <Text style={styles.rateLabel}>Holiday Rate</Text>
                                                <Icon name="information-circle" size={16} color="#25314C" />
                                            </View>
                                            {additionalRates ? (
                                                <View style={styles.rateRight}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <Text style={styles.rateValue}>{holidayRate} Coins</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.inputBox}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <TextInput
                                                        style={styles.rateInput}
                                                        value={holidayRate}
                                                        onChangeText={setHolidayRate}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor="#A4ACB9"
                                                    />
                                                    <Icon name="pencil" size={14} color="#32A6D8" />
                                                </View>
                                            )}
                                        </View>

                                        {/* Additional Dog Rate */}
                                        <View style={styles.rateRow}>
                                            <Text style={styles.rateLabel}>Additional Dog Rate</Text>
                                            {additionalRates ? (
                                                <View style={styles.rateRight}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <Text style={styles.rateValue}>{additionalDogRate} Coins</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.inputBox}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <TextInput
                                                        style={styles.rateInput}
                                                        value={additionalDogRate}
                                                        onChangeText={setAdditionalDogRate}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor="#A4ACB9"
                                                    />
                                                    <Icon name="pencil" size={14} color="#32A6D8" />
                                                </View>
                                            )}
                                        </View>

                                        {/* Puppy Rate */}
                                        <View style={styles.rateRow}>
                                            <Text style={styles.rateLabel}>Puppy Rate</Text>
                                            {additionalRates ? (
                                                <View style={styles.rateRight}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <Text style={styles.rateValue}>{puppyRate} Coins</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.inputBox}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <TextInput
                                                        style={styles.rateInput}
                                                        value={puppyRate}
                                                        onChangeText={setPuppyRate}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor="#A4ACB9"
                                                    />
                                                    <Icon name="pencil" size={14} color="#32A6D8" />
                                                </View>
                                            )}
                                        </View>

                                        {/* Long Stay Rate */}
                                        <View style={styles.rateRow}>
                                            <Text style={styles.rateLabel}>Stays of 14 Nights or More</Text>
                                            {additionalRates ? (
                                                <View style={styles.rateRight}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <Text style={styles.rateValue}>{longStayRate} Coins</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.inputBox}>
                                                    <View style={styles.coinIconSmall}>
                                                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                                                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                                                    </View>
                                                    <TextInput
                                                        style={styles.rateInput}
                                                        value={longStayRate}
                                                        onChangeText={setLongStayRate}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor="#A4ACB9"
                                                    />
                                                    <Icon name="pencil" size={14} color="#32A6D8" />
                                                </View>
                                            )}
                                        </View>

                                        {/* Bathing/Grooming */}
                                        <View style={styles.rateRow}>
                                            <Text style={styles.rateLabel}>Bathing / Grooming</Text>
                                            <Text style={styles.freeText}>Free</Text>
                                        </View>

                                        {/* Extended Care */}
                                        <View style={styles.rateRow}>
                                            <View style={styles.rateLeft}>
                                                <Text style={styles.rateLabel}>Extended Care</Text>
                                                <Icon name="information-circle" size={16} color="#25314C" />
                                            </View>
                                            <View style={styles.rateRight}>
                                                <Text style={styles.percentText}>{extendedCareMin}-{extendedCareMax}%</Text>
                                                <Text style={styles.percentLabel}>of nightly rate</Text>
                                            </View>
                                        </View>
                                    </View>

                                </View>
                            )}
                        </View>
                    </View>

                    {/* Availability Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Availability</Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Why is availability important</Text>
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
                            <Text style={styles.fieldLabel}>What days are you generally available to offer boarding?</Text>
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
                            <Text style={styles.fieldLabel}>How many pets can you sit in your home?</Text>
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
                            <Text style={styles.fieldLabel}>What type of pets can you sit in your home?</Text>
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
                            <Text style={styles.fieldLabel}>What can pet owners expect when boarding at your home?</Text>
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
                                options={['Pets that are not crate trained', 'Unneutered male dogs', 'Female dogs in heat', 'Puppies', 'Senior pets', 'Special needs pets']}
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
    fieldHint: {
        color: '#A0AEC0',
        fontSize: 11,
        fontFamily: 'Avenir LT Std',
        fontStyle: 'italic',
        marginBottom: 4,
        lineHeight: 15,
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
    dropdownContainer: {
        marginBottom: 0,
    },
    rateInput: {
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
    rateInputContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6.88,
    },
    rateValue: {
        color: '#32A6D8',
        fontSize: 13.76,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 21.34,
    },
    rateValueInput: {
        color: '#32A6D8',
        fontSize: 13.76,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 21.34,
        padding: 0,
        minWidth: 60,
    },
    rateUnit: {
        color: '#32A6D8',
        fontSize: 14,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 20,
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
    additionalRatesSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EBEBEB',
        gap: 12,
    },
    ratesList: {
        gap: 12,
    },
    rateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rateLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rateLabel: {
        color: 'black',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    rateRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        maxWidth: 100,
    },
    coinIconSmall: {
        width: 16,
        height: 16,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinBackground: {
        position: 'absolute',
    },
    coinForeground: {
        position: 'absolute',
    },
    rateValue: {
        color: '#32A6D8',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    rateInput: {
        color: '#32A6D8',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
        minWidth: 40,
        maxWidth: 60,
        padding: 0,
        textAlign: 'left',
    },
    rateInputSmall: {
        width: 120,
        marginBottom: 0,
    },
    freeText: {
        color: '#32A6D8',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    percentText: {
        color: '#F38FB4',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    percentLabel: {
        color: '#676869',
        fontSize: 10,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 15.5,
    },
    sizeOptions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    sizeBox: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 14,
        backgroundColor: 'rgba(234.57, 234.57, 234.57, 0.17)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        alignItems: 'center',
        gap: 10,
    },
    sizeBoxSelected: {
        backgroundColor: 'rgba(255, 194, 235, 0.15)',
        borderColor: '#FFC2EB',
    },
    sizeText: {
        textAlign: 'center',
    },
    sizeNumber: {
        color: '#A0A0A0',
        fontSize: 15,
        fontFamily: 'Poppins',
        fontWeight: '500',
        lineHeight: 23.25,
    },
    sizeNumberSelected: {
        color: '#32A6D8',
    },
    sizeLabel: {
        color: 'black',
        fontSize: 10,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 15.5,
    },
});

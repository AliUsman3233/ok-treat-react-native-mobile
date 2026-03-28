import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { CoinIcon, CoinBackgroundIcon } from '../assets';

export default function AdditionalRatesSection({
    additionalRates,
    showAdditionalRates,
    onToggleShow,
    holidayRate,
    onHolidayRateChange,
    additionalDogRate,
    onAdditionalDogRateChange,
    puppyRate,
    onPuppyRateChange,
    longStayRate,
    onLongStayRateChange,
    extendedCareMin,
    extendedCareMax,
    selectedPetSizes,
    onTogglePetSize,
}) {
    return (
        <View style={styles.toggleCard}>
            <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={onToggleShow}
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
                                        onChangeText={onHolidayRateChange}
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
                                        onChangeText={onAdditionalDogRateChange}
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
                                        onChangeText={onPuppyRateChange}
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
                                        onChangeText={onLongStayRateChange}
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

                    {/* Pet Size Categories */}
                    <View style={styles.sizeOptions}>
                        {['1-15', '16-40', '41-100', '101+'].map((size, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[
                                    styles.sizeBox,
                                    selectedPetSizes.includes(size) && styles.sizeBoxSelected
                                ]}
                                onPress={() => onTogglePetSize(size)}
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
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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

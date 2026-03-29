import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/ScreenWrapper';
import { SplashIcon, HomeIconNew, BriefcaseIcon, BuildingsIcon, SunIcon, PawIcon, Calendar2Icon, CalendarIcon, CalendarIconBlue } from '../../assets';
import { getUserBookings } from '../../services/bookingService';

const { width } = Dimensions.get('window');

const sitterImage = require('../../assets/images/dog_image.png');

// Map service type icon names
const getServiceIcon = (serviceType) => {
    const type = serviceType?.toUpperCase?.() || '';
    if (type.includes('BOARDING')) return 'home';
    if (type.includes('HOUSE') || type.includes('SITTING')) return 'building';
    if (type.includes('DROP') || type.includes('VISIT')) return 'briefcase';
    if (type.includes('DAY') || type.includes('CARE')) return 'sun';
    if (type.includes('WALK') || type.includes('PET')) return 'paw';
    return 'home';
};

const ServiceIcon = ({ iconType }) => {
    const iconProps = { width: 19.5, height: 19.5,};

    switch (iconType) {
        case 'home':
            return <BriefcaseIcon {...iconProps} />;
        case 'building':
            return <BuildingsIcon {...iconProps} />;
        case 'briefcase':
            return <HomeIconNew {...iconProps} />;
        case 'sun':
            return <SunIcon {...iconProps} />;
        case 'paw':
            return <PawIcon {...iconProps} />;
        default:
            return <CalendarIconBlue {...iconProps}/>;
    }
};

const ServiceItem = ({ service, onRebook }) => (
    <View style={styles.serviceItem}>
        <View style={styles.serviceLeft}>
            <View style={styles.serviceIconContainer}>
                <ServiceIcon iconType={service.icon} />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
        </View>
        <TouchableOpacity style={styles.rebookButton} onPress={() => onRebook(service)}>
            <Text style={styles.rebookButtonText}>Rebook</Text>
        </TouchableOpacity>
    </View>
);

const SitterCard = ({ sitter, onRebook }) => (
    <View style={styles.sitterCard}>
        {/* Sitter Header */}
        <View style={styles.sitterHeader}>
            <View style={styles.sitterLeft}>
                <Image source={sitter.image ? { uri: sitter.image } : sitterImage} style={styles.sitterImage} />
                <View style={styles.sitterInfo}>
                    <Text style={styles.sitterName}>{sitter.name}</Text>
                    <Text style={styles.sitterLocation}>{sitter.location}</Text>
                </View>
            </View>
            <View style={styles.sitterRight}>
                <Text style={styles.recentBookingLabel}>Most Recent Booking</Text>
                <Text style={styles.recentBookingService}>{sitter.mostRecentService}</Text>
            </View>
        </View>

        {/* Services List */}
        {sitter.services.map((service, idx) => (
            <ServiceItem key={service.id || idx} service={service} onRebook={onRebook} />
        ))}
    </View>
);

export default function RebookScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [sitters, setSitters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCompletedBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getUserBookings('COMPLETED');
            const data = response?.bookings || response?.data || response || [];
            const bookingsArray = Array.isArray(data) ? data : [];

            // Group by sitter and extract unique sitters with their services
            const sitterMap = {};
            bookingsArray.forEach((booking) => {
                const sitterId = booking.sitter?.id || booking.sitterId;
                if (!sitterId) return;

                if (!sitterMap[sitterId]) {
                    sitterMap[sitterId] = {
                        id: sitterId,
                        name: booking.sitter?.name || booking.sitterName || 'Sitter',
                        location: booking.sitter?.city && booking.sitter?.state
                            ? `${booking.sitter.city}, ${booking.sitter.state}`
                            : booking.sitter?.location || 'Location not available',
                        image: booking.sitter?.profileImage || null,
                        mostRecentService: booking.serviceType || booking.service || '',
                        services: new Map(),
                        lastDate: new Date(booking.endDate || booking.startDate || 0),
                    };
                }

                const serviceType = booking.serviceType || booking.service || '';
                if (serviceType && !sitterMap[sitterId].services.has(serviceType)) {
                    sitterMap[sitterId].services.set(serviceType, {
                        id: sitterMap[sitterId].services.size + 1,
                        name: serviceType,
                        icon: getServiceIcon(serviceType),
                    });
                }

                // Track most recent booking
                const bookingDate = new Date(booking.endDate || booking.startDate || 0);
                if (bookingDate > sitterMap[sitterId].lastDate) {
                    sitterMap[sitterId].lastDate = bookingDate;
                    sitterMap[sitterId].mostRecentService = serviceType;
                }
            });

            // Convert map to array
            const sittersList = Object.values(sitterMap).map(s => ({
                ...s,
                services: Array.from(s.services.values()),
            }));

            setSitters(sittersList);
        } catch (err) {
            console.error('Failed to fetch completed bookings:', err);
            setError(err?.message || 'Failed to load past sitters');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompletedBookings();
    }, [fetchCompletedBookings]);

    const handleRebook = (service) => {
        console.log('Rebook service:', service.name);
        navigation.navigate('ServiceSearch', {
            serviceType: service.name,
            serviceTitle: service.name,
            serviceSubtitle: `When do you need a ${service.name.toLowerCase()} sitter?`,
        });
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { top: insets.top }]}>
                    <View style={styles.avatarContainer}>
                        <SplashIcon width={30} height={30} />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Rebook a Sitter</Text>
                        <Text style={styles.headerSubtitle}>You can manage your bookings</Text>
                    </View>
                </View>

                {/* Content */}
                <View style={[styles.contentContainer, { top: HEADER_HEIGHT + insets.top }]}>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#32A6D8" />
                            <Text style={styles.loadingText}>Loading past sitters...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchCompletedBookings}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : sitters.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No past sitters to rebook</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {sitters.map((sitter) => (
                                <SitterCard key={sitter.id} sitter={sitter} onRebook={handleRebook} />
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </ScreenWrapper>
    );
}

const HEADER_HEIGHT = 60;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.25,
        overflow: 'hidden',
        position: 'relative',
    },
    header: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 10,
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    avatarContainer: {
        width: 45,
        height: 45,
        borderRadius: 37.5,
        backgroundColor: '#FFC2EB',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerTextContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 2,
    },
    headerTitle: {
        color: '#F38FB4',
        fontSize: 16,
        fontFamily: 'Poppins',
        fontWeight: '500',
        lineHeight: 24.8,
    },
    headerSubtitle: {
        color: '#5D6165',
        fontSize: 13,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 22,
        letterSpacing: 0.65,
    },
    contentContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
        gap: 12,
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
    sitterCard: {
        padding: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        // elevation: 1,
        borderRadius: 12,
        gap: 12,
    },
    sitterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sitterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sitterImage: {
        width: 34,
        height: 34,
        borderRadius: 38,
    },
    sitterInfo: {
        flexDirection: 'column',
        gap: 4,
    },
    sitterName: {
        color: '#0D0D12',
        fontSize: 12,
        fontFamily: 'Poppins',
        fontWeight: '500',
        lineHeight: 18.6,
    },
    sitterLocation: {
        color: '#32A6D8',
        fontSize: 10,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 15.5,
    },
    sitterRight: {
        width: 118,
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    recentBookingLabel: {
        color: '#818898',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '350',
        lineHeight: 18.6,
        textAlign: 'center',
    },
    recentBookingService: {
        color: '#32A6D8',
        fontSize: 10,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 15.5,
        textAlign: 'right',
    },
    serviceItem: {
        paddingVertical: 10,
        paddingLeft: 14,
        paddingRight: 10,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.09)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serviceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    serviceIconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceName: {
        color: 'black',
        fontSize: 12,
        fontFamily: 'Avenir LT Std',
        fontWeight: '600',
        lineHeight: 18.6,
    },
    rebookButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: '#FFC2EB',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rebookButtonText: {
        color: '#32A6D8',
        fontSize: 10,
        fontFamily: 'Avenir LT Std',
        fontWeight: '750',
        lineHeight: 15.5,
        textAlign: 'center',
    },
});

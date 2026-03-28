import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, StarIcon, LocationPinIcon, ImageHereIcon, VerifiedIcon, CoinIcon, CoinBackgroundIcon } from '../../assets';
import { Button } from '../../components';
import api from '../../config/api';

const { width } = Dimensions.get('window');

export default function SitterProfileScreen({ navigation, route }) {
  const { sitter, serviceType: searchedServiceType } = route?.params || {};
  const [sitterData, setSitterData] = useState(sitter || {});
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [selectedTab, setSelectedTab] = useState(searchedServiceType ? 'services' : 'info');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAboutHint, setShowAboutHint] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const sitterId = sitter?.id || sitter?.sitterId;
        if (!sitterId) { setLoading(false); return; }

        const response = await api.get(`/sitter/${sitterId}/public`);
        if (response.data?.success) {
          setSitterData(prev => ({ ...prev, ...response.data.data.sitter }));
          setReviews(response.data.data.reviews || []);
        }
      } catch (error) {
        console.log('Using navigation params for sitter data');
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContactSitter = () => {
    // Use the searched service type if available, otherwise fall back to first service
    const serviceKeys = sitterData?.services ? Object.keys(sitterData.services) : [];
    let selectedService;
    if (searchedServiceType && serviceKeys.includes(searchedServiceType)) {
      selectedService = getServiceDisplayName(searchedServiceType);
    } else if (serviceKeys.length > 0) {
      selectedService = getServiceDisplayName(serviceKeys[0]);
    } else {
      selectedService = 'Boarding';
    }

    navigation.navigate('ContactSitter', {
      sitter: {
        id: sitterData?.id || sitterData?._id,
        name: sitterData?.name || sitterData?.firstName
          ? `${sitterData.firstName || ''} ${sitterData.lastName || ''}`.trim()
          : 'Sitter',
        profileImage: sitterData?.profileImage,
        ...sitterData,
      },
      service: selectedService,
      dates: '',
      pets: [],
    });
  };

  // Helper to get service display name
  const getServiceDisplayName = (serviceType) => {
    const names = {
      'BOARDING': 'Boarding',
      'HOUSE_SITTING': 'House Sitting',
      'DROP_IN_VISITS': 'Drop-In Visit',
      'DAY_CARE': 'Day Care',
      'PET_WALKING': 'Pet Walking'
    };
    return names[serviceType] || serviceType;
  };

  // Helper to get service subtitle
  const getServiceSubtitle = (serviceType) => {
    const subtitles = {
      'BOARDING': 'in the sitter\'s home',
      'HOUSE_SITTING': 'in your home',
      'DROP_IN_VISITS': 'visit in your home',
      'DAY_CARE': 'daytime care',
      'PET_WALKING': 'exercise & fresh air'
    };
    return subtitles[serviceType] || '';
  };

  // Helper to get service icon
  const getServiceIcon = (serviceType) => {
    const icons = {
      'BOARDING': 'home',
      'HOUSE_SITTING': 'home-outline',
      'DROP_IN_VISITS': 'time',
      'DAY_CARE': 'sunny',
      'PET_WALKING': 'walk'
    };
    return icons[serviceType] || 'home';
  };

  // Helper to get price label
  const getPriceLabel = (serviceType) => {
    const labels = {
      'BOARDING': 'per night',
      'HOUSE_SITTING': 'per night',
      'DROP_IN_VISITS': 'per visit',
      'DAY_CARE': 'per day',
      'PET_WALKING': 'per walk'
    };
    return labels[serviceType] || 'per service';
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();
    
    // Previous month's last date
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthLastDate = prevMonthLastDay.getDate();
    
    const weeks = [];
    let currentWeek = [];
    
    // Fill in previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      currentWeek.push({
        date: prevMonthLastDate - i,
        isCurrentMonth: false,
        dayOfWeek: firstDayOfWeek - 1 - i
      });
    }
    
    // Fill in current month's days
    for (let date = 1; date <= lastDate; date++) {
      const dayOfWeek = new Date(year, month, date).getDay();
      currentWeek.push({
        date: date,
        isCurrentMonth: true,
        dayOfWeek: dayOfWeek
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill in next month's days
    if (currentWeek.length > 0) {
      let nextMonthDate = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: nextMonthDate,
          isCurrentMonth: false,
          dayOfWeek: currentWeek.length
        });
        nextMonthDate++;
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  // Format month and year for display
  const getMonthYearDisplay = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, selectedTab === 'info' && styles.tabButtonActive]}
        onPress={() => setSelectedTab('info')}
      >
        <Text style={[styles.tabText, selectedTab === 'info' && styles.tabTextActive]}>
          Info
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, selectedTab === 'services' && styles.tabButtonActive]}
        onPress={() => setSelectedTab('services')}
      >
        <Text style={[styles.tabText, selectedTab === 'services' && styles.tabTextActive]}>
          Services
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, selectedTab === 'reviews' && styles.tabButtonActive]}
        onPress={() => setSelectedTab('reviews')}
      >
        <Text style={[styles.tabText, selectedTab === 'reviews' && styles.tabTextActive]}>
          Review
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {/* About Pet */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About Pet</Text>
        <TouchableOpacity
          style={styles.hintToggle}
          onPress={() => setShowAboutHint(!showAboutHint)}
        >
          <Icon name="information-circle-outline" size={16} color="#32A6D8" />
          <Text style={styles.hintToggleText}>What should this include?</Text>
          <Icon name={showAboutHint ? "chevron-up" : "chevron-down"} size={14} color="#32A6D8" />
        </TouchableOpacity>
        {showAboutHint && (
          <Text style={styles.hintText}>
            Provide future sitters with important information about your pet's personality, behaviors, and specific care requirements.
          </Text>
        )}
        <Text style={styles.cardDescription}>
          {sitterData?.aboutPet || 'No description provided.'}
        </Text>
      </View>

      {/* Skills */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Skills</Text>
        <View style={styles.listContainer}>
          {sitterData?.skills && sitterData.skills.length > 0 ? (
            sitterData.skills.map((skill, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="checkmark-circle" size={20} color="#32A6D8" />
                <Text style={styles.listText}>{skill}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardDescription}>No skills listed.</Text>
          )}
        </View>
      </View>

      {/* Home */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Home</Text>
        <View style={styles.listContainer}>
          {sitterData?.homeType && (
            <View style={styles.listItem}>
              <Icon name="home" size={20} color="#32A6D8" />
              <Text style={styles.listText}>Resides in {sitterData.homeType.toLowerCase().replace('_', ' ')}</Text>
            </View>
          )}
          {sitterData?.yardType && (
            <View style={styles.listItem}>
              <Icon name={sitterData.yardType === 'NO_YARD' || sitterData.yardType.toLowerCase().includes('no yard') ? 'close-circle' : 'checkmark-circle'} size={20} color="#32A6D8" />
              <Text style={styles.listText}>
                {sitterData.yardType === 'NO_YARD' || sitterData.yardType.toLowerCase().includes('no yard')
                  ? 'No yard available'
                  : `${sitterData.yardType.replace(/_/g, ' ').toLowerCase()} available`}
              </Text>
            </View>
          )}
          {sitterData?.smokingPolicy && (
            <View style={styles.listItem}>
              <Icon name={sitterData.smokingPolicy === 'SMOKE_FREE' || sitterData.smokingPolicy.toLowerCase().includes('smoke-free') || sitterData.smokingPolicy.toLowerCase().includes('no smoking') ? 'checkmark-circle' : 'close-circle'} size={20} color="#32A6D8" />
              <Text style={styles.listText}>
                {sitterData.smokingPolicy === 'SMOKE_FREE' || sitterData.smokingPolicy.toLowerCase().includes('smoke-free') || sitterData.smokingPolicy.toLowerCase().includes('no smoking')
                  ? 'Smoke-free home'
                  : sitterData.smokingPolicy}
              </Text>
            </View>
          )}
          {sitterData?.petsInHome && sitterData.petsInHome.length > 0 && (
            <View style={styles.listItem}>
              <Icon name="paw" size={20} color="#32A6D8" />
              <Text style={styles.listText}>{sitterData.petsInHome.join(', ')} in the household</Text>
            </View>
          )}
          {sitterData?.childrenInHome !== undefined && (
            <View style={styles.listItem}>
              <Icon name={sitterData.childrenInHome ? 'people' : 'close-circle'} size={20} color="#32A6D8" />
              <Text style={styles.listText}>
                {sitterData.childrenInHome ? 'Children in the home' : 'No children in the home'}
              </Text>
            </View>
          )}
          {sitterData?.petRestrictions && sitterData.petRestrictions.length > 0 && (
            <View style={styles.listItem}>
              <Icon name="paw" size={20} color="#32A6D8" />
              <Text style={styles.listText}>{sitterData.petRestrictions.join(', ')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <LocationPinIcon width={20} height={20} fill="#FFC2EB" />
            <Text style={styles.listText}>
              {sitterData?.city && sitterData?.state ? `${sitterData.city}, ${sitterData.state}` : 'Location not available'}
            </Text>
          </View>
          {sitterData?.latitude != null && sitterData?.longitude != null && !isNaN(parseFloat(sitterData.latitude)) && !isNaN(parseFloat(sitterData.longitude)) && (
            <View style={styles.mapContainer}>
              <MapView
                key="map-zoomed-out"
                style={styles.mapImage}
                initialRegion={{
                  latitude: parseFloat(sitterData.latitude),
                  longitude: parseFloat(sitterData.longitude),
                  latitudeDelta: 0.3,
                  longitudeDelta: 0.3,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(sitterData.latitude),
                    longitude: parseFloat(sitterData.longitude),
                  }}
                  pinColor="#FFC2EB"
                />
              </MapView>
            </View>
          )}
        </View>
      </View>

      {/* Pets */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pets</Text>
        {sitterData?.pets && sitterData.pets.length > 0 ? (
          sitterData.pets.map((pet, index) => (
            <View key={index} style={styles.petItem}>
              <Image
                source={pet.image ? { uri: pet.image } : require('../../assets/images/Pet_default_image.png')}
                style={styles.petImage}
                resizeMode="cover"
              />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name || 'Pet'}</Text>
                <Text style={styles.petDetails}>
                  {pet.breed || 'Unknown breed'}{'\n'}
                  {pet.weight ? `${pet.weight} lbs` : ''}{pet.weight && pet.age ? ', ' : ''}{pet.age || ''}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.cardDescription}>No pets listed.</Text>
        )}
      </View>
    </View>
  );

  // Helper to collect selectedDays from all services
  const getSelectedDaysFromServices = () => {
    if (!sitterData?.services) return [];
    const allDays = new Set();
    Object.values(sitterData.services).forEach(service => {
      if (service.selectedDays && Array.isArray(service.selectedDays)) {
        service.selectedDays.forEach(day => allDays.add(day));
      }
    });
    return Array.from(allDays);
  };

  const renderServicesTab = () => {
    const allServices = sitterData?.services ? Object.keys(sitterData.services) : [];
    // Put the searched service first if it exists
    const availableServices = searchedServiceType && allServices.includes(searchedServiceType)
      ? [searchedServiceType, ...allServices.filter(s => s !== searchedServiceType)]
      : allServices;

    return (
      <View style={styles.tabContent}>
        {availableServices.length > 0 ? (
          availableServices.map((serviceType, index) => {
            const isSearchedService = serviceType === searchedServiceType;
            const service = sitterData.services[serviceType];
            const baseRate = parseFloat(service.baseRate) || 50;
            const holidayRate = parseFloat(service.holidayRate) || Math.round(baseRate * 1.12);
            const additionalDogRate = parseFloat(service.additionalDogRate) || Math.round(baseRate * 0.72);
            const puppyRate = parseFloat(service.puppyRate) || Math.round(baseRate * 0.72);
            const longStayRate = parseFloat(service.longStayRate) || Math.round(baseRate * 0.94);
            const bathingGrooming = service.bathingGrooming;
            const extendedCareMin = parseFloat(service.extendedCareMin) || 50;
            const extendedCareMax = parseFloat(service.extendedCareMax) || 100;
            const selectedPetSizes = service.selectedPetSizes || [];

            return (
              <View key={index} style={[
                styles.card,
                index > 0 && { marginTop: 12 },
                isSearchedService && { borderWidth: 2, borderColor: '#32A6D8' }
              ]}>
                {isSearchedService && (
                  <View style={{ backgroundColor: '#32A6D8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Avenir LT Std', fontWeight: '600' }}>Searched Service</Text>
                  </View>
                )}
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceLeft}>
                    <Icon name={getServiceIcon(serviceType)} size={29} color="#32A6D8" />
                    <View>
                      <Text style={styles.serviceName}>{getServiceDisplayName(serviceType)}</Text>
                      <Text style={styles.serviceSubtitle}>{getServiceSubtitle(serviceType)}</Text>
                    </View>
                  </View>
                  <View style={styles.servicePrice}>
                    <View style={styles.coinRow}>
                      <View style={styles.coinIconContainer}>
                        <CoinBackgroundIcon width={23} height={23} style={styles.coinBackground} />
                        <CoinIcon width={23} height={23} style={styles.coinForeground} />
                      </View>
                      <Text style={styles.coinText}>{baseRate} Coins</Text>
                    </View>
                    <Text style={styles.priceLabel}>{getPriceLabel(serviceType)}</Text>
                  </View>
                </View>

                <View style={styles.ratesList}>
                  {serviceType === 'DROP_IN_VISITS' && (
                    <View style={styles.rateRow}>
                      <Text style={styles.rateLabel}>Hourly Rate</Text>
                      <View style={styles.rateRight}>
                        <View style={styles.coinIconSmall}>
                          <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                          <CoinIcon width={16} height={16} style={styles.coinForeground} />
                        </View>
                        <Text style={styles.rateValue}>{baseRate} Coins</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.rateRow}>
                    <View style={styles.rateLeft}>
                      <Text style={styles.rateLabel}>Holiday Rate</Text>
                      <Icon name="information-circle" size={16} color="#25314C" />
                    </View>
                    <View style={styles.rateRight}>
                      <View style={styles.coinIconSmall}>
                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                      </View>
                      <Text style={styles.rateValue}>{holidayRate} Coins</Text>
                    </View>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Additional Dog Rate</Text>
                    <View style={styles.rateRight}>
                      <View style={styles.coinIconSmall}>
                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                      </View>
                      <Text style={styles.rateValue}>{additionalDogRate} Coins</Text>
                    </View>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Puppy Rate</Text>
                    <View style={styles.rateRight}>
                      <View style={styles.coinIconSmall}>
                        <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                        <CoinIcon width={16} height={16} style={styles.coinForeground} />
                      </View>
                      <Text style={styles.rateValue}>{puppyRate} Coins</Text>
                    </View>
                  </View>
                  {(serviceType === 'BOARDING' || serviceType === 'HOUSE_SITTING') && (
                    <View style={styles.rateRow}>
                      <Text style={styles.rateLabel}>Stays of 14 Nights or More</Text>
                      <View style={styles.rateRight}>
                        <View style={styles.coinIconSmall}>
                          <CoinBackgroundIcon width={16} height={16} style={styles.coinBackground} />
                          <CoinIcon width={16} height={16} style={styles.coinForeground} />
                        </View>
                        <Text style={styles.rateValue}>{longStayRate} Coins</Text>
                      </View>
                    </View>
                  )}
                  {(serviceType === 'BOARDING' || serviceType === 'HOUSE_SITTING') && (
                    <>
                      <View style={styles.rateRow}>
                        <Text style={styles.rateLabel}>Bathing / Grooming</Text>
                        <Text style={styles.freeText}>{typeof bathingGrooming === 'string' ? bathingGrooming : (bathingGrooming ? 'Included' : 'Free')}</Text>
                      </View>
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
                    </>
                  )}
                </View>

                <View style={styles.sizeOptions}>
                  {['1-15', '16-40', '41-100', '101+'].map((size, idx) => {
                    const isAvailable = selectedPetSizes.includes(size);
                    return (
                      <View 
                        key={idx} 
                        style={[
                          styles.sizeBox,
                          { borderColor: isAvailable ? '#4CAF50' : '#F44336' }
                        ]}
                      >
                        <Icon name="paw" size={24} color="#FFC2EB" />
                        <Text style={styles.sizeText}>
                          <Text style={styles.sizeNumber}>{size}{'\n'}</Text>
                          <Text style={styles.sizeLabel}>pounds</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardDescription}>No services available.</Text>
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <Text style={styles.cardTitle}>Calendar</Text>
            <View style={styles.calendarDropdown}>
              <Text style={styles.dropdownText}>Availability</Text>
              <Icon name="chevron-down" size={20} color="#32A6D8" />
            </View>
          </View>

          {/* Available Days Info */}
          {(() => {
            const selectedDays = getSelectedDaysFromServices();
            if (selectedDays.length === 0) return null;
            return (
              <View style={styles.availableDaysInfo}>
                <Text style={styles.cardSubtitle}>
                  Available on: {selectedDays.map(day => {
                    const dayMap = {
                      'Su': 'Sunday', 'Mo': 'Monday', 'Tu': 'Tuesday',
                      'We': 'Wednesday', 'Th': 'Thursday', 'Fr': 'Friday', 'Sa': 'Saturday'
                    };
                    return dayMap[day];
                  }).join(', ')}
                </Text>
              </View>
            );
          })()}

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <Icon name="chevron-back" size={24} color="#32A6D8" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{getMonthYearDisplay()}</Text>
            <TouchableOpacity onPress={goToNextMonth}>
              <Icon name="chevron-forward" size={24} color="#32A6D8" />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Day Headers */}
            <View style={styles.calendarRow}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Weeks */}
            {(() => {
              const dayMap = {
                'Su': 0, 'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6
              };
              const selectedDays = getSelectedDaysFromServices();
              const availableDayIndices = selectedDays.length > 0
                ? selectedDays.map(day => dayMap[day]).filter(d => d !== undefined)
                : [];

              const isAvailable = (dayOfWeek) => availableDayIndices.includes(dayOfWeek);
              const weeks = generateCalendarDays();

              return weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.calendarRow}>
                  {week.map((day, dayIndex) => {
                    const available = day.isCurrentMonth && isAvailable(day.dayOfWeek);
                    return (
                      <View key={dayIndex} style={styles.dayCell}>
                        {available ? (
                          <View style={styles.selectedDay}>
                            <Text style={styles.selectedDayText}>{day.date}</Text>
                          </View>
                        ) : (
                          <Text style={[styles.dayText, !day.isCurrentMonth && styles.dayTextOther]}>
                            {day.date}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ));
            })()}
          </View>
        </View>
      </View>
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          width={14}
          height={14}
          fill={i <= rating ? '#FBBC04' : '#D9D9D9'}
        />
      );
    }
    return stars;
  };

  const formatReviewDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      {/* Average Rating Summary */}
      <View style={styles.card}>
        <View style={styles.reviewSummary}>
          <Text style={styles.reviewSummaryRating}>
            {sitterData?.rating ? parseFloat(sitterData.rating).toFixed(1) : '5.0'}
          </Text>
          <View style={styles.reviewSummaryStars}>
            {renderStars(Math.round(sitterData?.rating || 5))}
          </View>
          <Text style={styles.reviewSummaryCount}>
            {sitterData?.reviews || reviews.length || 0} review{(sitterData?.reviews || reviews.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <View key={review.id} style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                {review.reviewer?.avatarUrl ? (
                  <Image
                    source={{ uri: review.reviewer.avatarUrl }}
                    style={styles.reviewerAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.reviewerAvatarPlaceholder}>
                    <Icon name="person" size={16} color="#818898" />
                  </View>
                )}
                <View>
                  <Text style={styles.reviewName}>{review.reviewer?.name || 'Anonymous'}</Text>
                  <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                </View>
              </View>
              <View style={styles.reviewStars}>
                {renderStars(review.rating)}
              </View>
            </View>
            {review.comment ? (
              <Text style={styles.reviewText}>{review.comment}</Text>
            ) : null}
          </View>
        ))
      ) : (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardDescription}>No reviews yet.</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sitter Profile</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sitter Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Cover and Profile Image */}
            <View style={styles.imageContainer}>
              <Image
                source={sitterData?.coverImage ? { uri: sitterData.coverImage } : require('../../assets/images/Pet_default_image.png')}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={[styles.profileImageContainer, { top: 130 }]}>
                {sitterData?.avatarUrl ? (
                  <Image
                    source={{ uri: sitterData.avatarUrl }}
                    style={{ width: 103, height: 103, borderRadius: 51.5 }}
                    resizeMode="cover"
                  />
                ) : (
                  <ImageHereIcon width={103} height={103} fill="#CCCCCC" />
                )}
              </View>
            </View>

            {/* Name and Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.sitterName}>{sitterData?.name || 'Anonymous'}</Text>

              {/* Verified Badge */}
              <View style={styles.verifiedBadge}>
                <VerifiedIcon width={17} height={17} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>

              {/* Stats Section */}
              <View style={styles.statsContainer}>
                {/* Row 1: Rating and Repeat Clients */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <StarIcon width={16} height={16} fill="#FBBC04" />
                    <Text style={styles.statText}>
                      {sitterData?.rating || '5.0'} ({sitterData?.reviews || '0'} reviews)
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="repeat" size={16} color="#32A6D8" />
                    <Text style={styles.statText}>
                      {sitterData?.repeatClients || '0'} repeat clients
                    </Text>
                  </View>
                </View>

                {/* Row 2: Title and Location */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <LocationPinIcon width={14} height={14} fill="#32A6D8" />
                    <Text style={styles.subtitleText}>{sitterData?.title || 'Pet sitter & walker'}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="location-sharp" size={14} color="#32A6D8" />
                    <Text style={styles.locationText}>
                      {sitterData?.city && sitterData?.state ? `${sitterData.city}, ${sitterData.state}` : 'Location not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Tab Buttons */}
          {renderTabButtons()}

          {/* Tab Content */}
          {selectedTab === 'info' && renderInfoTab()}
          {selectedTab === 'services' && renderServicesTab()}
          {selectedTab === 'reviews' && renderReviewsTab()}

          {/* Contact Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Contact Sitter"
              onPress={handleContactSitter}
              fullWidth
              size="medium"
            />
          </View>
        </ScrollView>
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
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: width * 0.9,
    height: 233,
    position: 'relative',
    alignItems: 'center',
  },
  coverImage: {
    width: 327,
    height: 182,
    borderRadius: 20,
  },
  profileImageContainer: {
    position: 'absolute',
    width: 103,
    height: 103,
    borderRadius: 51.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    width: width * 0.9,
    alignItems: 'center',
    gap: 10,
  },
  sitterName: {
    color: '#0D0D12',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 37.2,
    textAlign: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  statsContainer: {
    width: width * 0.9,
    gap: 5,
  },
  statsRow: {
    width: width * 0.9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  locationText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(203.75, 203.75, 203.75, 0.15)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 194, 235, 0.15)',
    borderColor: '#FFC2EB',
  },
  tabText: {
    color: '#666D80',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  tabTextActive: {
    color: '#32A6D8',
  },
  tabContent: {
    paddingHorizontal: 24,
    marginTop: 13,
  },
  card: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 21.7,
  },
  cardSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  cardDescription: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  listText: {
    color: '#676869',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
    flex: 1,
  },
  mapContainer: {
    width: '100%',
    height: 215,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  mapImage: {
    width: '100%',
    height: 215,
  },
  petItem: {
    flexDirection: 'row',
    gap: 8,
  },
  petImage: {
    width: 34,
    height: 34,
    borderRadius: 38,
  },
  petInfo: {
    gap: 5,
  },
  petName: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20.15,
  },
  petDetails: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  serviceName: {
    color: '#0D0D12',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20.15,
  },
  serviceSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  servicePrice: {
    alignItems: 'flex-end',
    gap: 5,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coinIconContainer: {
    width: 23,
    height: 23,
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
  coinText: {
    color: '#32A6D8',
    fontSize: 14.53,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 22.52,
  },
  priceLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    textAlign: 'right',
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
  coinIconSmall: {
    width: 16,
    height: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateValue: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
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
  },
  sizeBox: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 14,
    backgroundColor: 'rgba(234.57, 234.57, 234.57, 0.17)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    gap: 10,
  },
  sizeText: {
    textAlign: 'center',
  },
  sizeNumber: {
    color: '#32A6D8',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 20,
  },
  sizeLabel: {
    color: 'black',
    fontSize: 10,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 15.5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableDaysInfo: {
    marginTop: 8,
  },
  calendarDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  dropdownText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  monthText: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
  },
  calendarGrid: {
    gap: 4,
    marginTop: 10,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderText: {
    color: '#A4ACB9',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  dayCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 21.7,
  },
  dayTextOther: {
    color: '#A4ACB9',
  },
  selectedDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  calendarPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 21.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
  },
  reviewSummary: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  reviewSummaryRating: {
    color: '#0D0D12',
    fontSize: 32,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 40,
  },
  reviewSummaryStars: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewSummaryCount: {
    color: '#818898',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20.15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewName: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  reviewDate: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  reviewText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  hintToggleText: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    flex: 1,
  },
  hintText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 18,
    backgroundColor: '#F6FBFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
});

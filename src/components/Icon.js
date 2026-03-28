import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Icon Component - Reusable SVG icon wrapper
 * 
 * Usage:
 * import Icon from '../components/Icon';
 * 
 * <Icon name="home" size={24} color="#FF6B6B" />
 * 
 * Note: After installing react-native-svg, import your SVG files here
 * and add them to the icons object below.
 */

// TODO: Import your SVG icons here after installing react-native-svg
// Example:
// import HomeIcon from '../assets/icons/home.svg';
// import CalendarIcon from '../assets/icons/calendar.svg';
// import PawIcon from '../assets/icons/paw.svg';

const icons = {
  // TODO: Add your icons here
  // home: HomeIcon,
  // calendar: CalendarIcon,
  // paw: PawIcon,
};

export default function Icon({ 
  name, 
  size = 24, 
  color = '#333', 
  style,
  ...props 
}) {
  const IconComponent = icons[name];
  
  if (!IconComponent) {
    // Fallback: Show emoji or placeholder
    console.warn(`Icon "${name}" not found. Add it to src/components/Icon.js`);
    return (
      <View style={[styles.placeholder, { width: size, height: size }, style]}>
        <View style={styles.placeholderInner} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <IconComponent 
        width={size} 
        height={size} 
        fill={color}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  placeholderInner: {
    width: '50%',
    height: '50%',
    backgroundColor: '#CCC',
    borderRadius: 2,
  }
});

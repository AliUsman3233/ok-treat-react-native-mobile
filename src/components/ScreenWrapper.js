import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * ScreenWrapper - Universal wrapper for all screens
 * Handles web scrolling issues and safe areas automatically
 * 
 * Usage:
 * <ScreenWrapper>
 *   <YourScreenContent />
 * </ScreenWrapper>
 * 
 * Or with custom styles:
 * <ScreenWrapper style={customStyles}>
 *   <YourScreenContent />
 * </ScreenWrapper>
 * 
 * For screens WITHOUT bottom tabs (full screen modals), use noBottomTabs prop:
 * <ScreenWrapper noBottomTabs>
 *   <YourScreenContent />
 * </ScreenWrapper>
 */
const ScreenWrapper = ({ children, style, scrollable = true, noBottomTabs = false }) => {
  if (Platform.OS === 'web') {
    // Web: Use div with proper scrolling
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: scrollable ? 'auto' : 'hidden',
        backgroundColor: style?.backgroundColor || '#FFFFFF',
        ...style
      }}>
        {children}
      </div>
    );
  }

  // Native: Use SafeAreaView to avoid system bars
  // Screens with bottom tabs: only protect top (tab bar handles bottom)
  // Screens without bottom tabs: protect both top and bottom
  const edges = noBottomTabs ? ['top', 'bottom'] : ['top'];
  
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  }
});

export default ScreenWrapper;

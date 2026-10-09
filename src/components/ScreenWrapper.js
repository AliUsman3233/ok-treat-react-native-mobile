import React from 'react';
import { View, Platform, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
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
const ScreenWrapper = ({ children, style, scrollable = true, noBottomTabs = false, dismissKeyboard = true }) => {
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

  // Tap anywhere outside a focused input to dismiss the keyboard.
  //
  // A ScrollView already dismisses on an unhandled tap, but taps that land
  // outside it — headers, footers, padding, and screens built from a plain
  // View + KeyboardAvoidingView — did nothing, so the keyboard stayed up.
  // TouchableWithoutFeedback only becomes the responder for taps no child
  // handled, so buttons, inputs and scrolling are unaffected.
  //
  // Applied on BOTH platforms. Android's system back button also dismisses the
  // keyboard, but users expect tapping the screen to work too — on content-dense
  // forms there's little empty ScrollView space to tap, so back was the only way
  // out and the keyboard felt stuck.
  //
  // Pass dismissKeyboard={false} to opt a screen out if it ever needs an
  // input to keep focus while the user taps elsewhere.
  const content = dismissKeyboard ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.flex}>{children}</View>
    </TouchableWithoutFeedback>
  ) : (
    children
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  flex: {
    flex: 1
  }
});

export default ScreenWrapper;

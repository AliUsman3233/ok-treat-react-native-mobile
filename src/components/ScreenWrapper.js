import React, { useEffect, useRef, useState } from 'react';
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

// A finger never holds perfectly still, so a tap reports a few pixels of
// movement. Past this much the gesture is a drag, not a tap.
const DRAG_SLOP = 12;

const ScreenWrapper = ({ children, style, scrollable = true, noBottomTabs = false, dismissKeyboard = true }) => {
  // Only mount the tap-to-dismiss catcher while the keyboard is actually up.
  //
  // The catcher is a TouchableWithoutFeedback spanning the whole screen. It
  // becomes the touch responder at touch-START, before anyone knows whether the
  // gesture is a tap or a drag. On a screen built mostly from plain View/Image/
  // Text the native UIScrollView then never receives the pan, and iOS renders
  // the drag as a rubber-band overscroll: content follows the finger and springs
  // back to the top. Screens whose rows are TouchableOpacity escaped it because
  // those children took the touch first — which is why only some screens broke.
  //
  // With no input focused there is no keyboard to dismiss, so the catcher has
  // nothing to do; keeping it mounted only cost us scrolling. Gating on keyboard
  // visibility means the normal case — browsing a screen — has no extra
  // responder in the tree at all.
  const [keyboardUp, setKeyboardUp] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    if (!dismissKeyboard || Platform.OS === 'web') return undefined;

    // iOS fires the "will" events ahead of the animation, so the catcher is
    // mounted by the time the keyboard is actually on screen. Android only has
    // the "did" variants.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => setKeyboardUp(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [dismissKeyboard]);

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
  //
  // Pass dismissKeyboard={false} to opt a screen out if it ever needs an
  // input to keep focus while the user taps elsewhere.
  const showCatcher = dismissKeyboard && keyboardUp;

  // While the catcher IS mounted it still owns the gesture, so a drag would be
  // swallowed rather than scrolling. Dismiss on a real drag too: that matches
  // the iOS convention that scrolling puts the keyboard away, and it unmounts
  // the catcher so the gesture that follows scrolls normally.
  //
  // onTouchStart/onTouchMove are plain touch callbacks — unlike the responder
  // system they fire without claiming the gesture, so adding them changes
  // nothing about who handles the touch.
  const onTouchStart = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    touchStart.current = { x: pageX, y: pageY };
  };

  const onTouchMove = (e) => {
    const start = touchStart.current;
    if (!start) return;
    const { pageX, pageY } = e.nativeEvent;
    if (Math.abs(pageX - start.x) > DRAG_SLOP || Math.abs(pageY - start.y) > DRAG_SLOP) {
      touchStart.current = null;
      Keyboard.dismiss();
    }
  };

  const content = showCatcher ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.flex} onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
        {children}
      </View>
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

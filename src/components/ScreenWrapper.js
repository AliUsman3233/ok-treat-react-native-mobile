import React, { useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, Keyboard } from 'react-native';
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
  // Is the tap-to-dismiss catcher armed? Only while the keyboard is up.
  //
  // This is a ref, deliberately, and the tree below never changes shape.
  // An earlier version held this in state and swapped the children between a
  // bare mount and a <TouchableWithoutFeedback><View> wrapper. React sees a
  // different element type at that position and remounts the entire subtree —
  // which destroyed the TextInput the user had just tapped. Focus was lost, the
  // keyboard slid away, that fired keyboardWillHide, and the whole thing
  // unwound: the keyboard appeared and vanished within a second.
  //
  // So: one stable tree, and a flag the responder callbacks read at touch time.
  // No re-render on a keyboard transition either, which matters when 76 screens
  // sit inside this component.
  const armed = useRef(false);
  const touchStart = useRef(null);

  useEffect(() => {
    if (!dismissKeyboard || Platform.OS === 'web') return undefined;

    // iOS fires the "will" events ahead of the animation, so the catcher is
    // armed by the time the keyboard is actually on screen. Android only has
    // the "did" variants.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => {
      armed.current = true;
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      armed.current = false;
    });
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
  //
  // Claiming the responder is what makes this safe to tell apart from a tap on
  // a control: responder negotiation bubbles outward from the touched view, so
  // a TextInput or Touchable under the finger claims the gesture first and this
  // handler is never asked. We only ever win taps nothing else wanted. The
  // touch callbacks below, by contrast, fire for every touch regardless of who
  // the responder is — which is why the drag check lives there and the dismiss
  // lives in onResponderRelease.
  //
  // With the keyboard down we decline every gesture, so the native UIScrollView
  // gets the pan and plain View/Image/Text screens scroll normally.
  const onStartShouldSetResponder = () => dismissKeyboard && armed.current;

  const onTouchStart = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    touchStart.current = { x: pageX, y: pageY };
  };

  // While the catcher is armed it owns the gesture, so a drag would be
  // swallowed rather than scrolling. Dismiss on a real drag too: that matches
  // the iOS convention that scrolling puts the keyboard away, and it disarms
  // the catcher so the gesture that follows scrolls normally.
  const onTouchMove = (e) => {
    const start = touchStart.current;
    if (!start) return;
    const { pageX, pageY } = e.nativeEvent;
    if (Math.abs(pageX - start.x) > DRAG_SLOP || Math.abs(pageY - start.y) > DRAG_SLOP) {
      touchStart.current = null;
      Keyboard.dismiss();
    }
  };

  // Reached only when nothing else claimed the touch, i.e. a tap on blank
  // space. touchStart is null if the gesture already turned into a drag.
  const onResponderRelease = () => {
    const wasTap = touchStart.current !== null;
    touchStart.current = null;
    if (wasTap) Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      <View
        style={styles.flex}
        onStartShouldSetResponder={onStartShouldSetResponder}
        onResponderRelease={onResponderRelease}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {children}
      </View>
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

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tracks the current soft-keyboard height (0 when hidden).
 *
 * Use the returned value as extra `paddingBottom` on a ScrollView's
 * contentContainerStyle so a long form has enough scroll room to lift
 * any bottom field above the keyboard.
 *
 * Why we need this on Android even with the manifest set to pan mode:
 * pan only shifts the window up enough to reveal the focused TextInput
 * — it doesn't give the form room to scroll further to fields BELOW the
 * focused one. Extra paddingBottom solves that.
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => setHeight(e?.endCoordinates?.height || 0);
    const onHide = () => setHeight(0);
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return height;
}

import { Platform } from 'react-native';

/**
 * ScrollView `keyboardDismissMode` value, iOS only.
 *
 * On iOS users expect the keyboard to fall away as soon as they start
 * scrolling. Android keeps its default (the system back button dismisses),
 * so this is `undefined` there and the prop is a no-op.
 *
 * Usage: <ScrollView keyboardDismissMode={iosKeyboardDismissMode} ... />
 */
export const iosKeyboardDismissMode = Platform.OS === 'ios' ? 'on-drag' : undefined;

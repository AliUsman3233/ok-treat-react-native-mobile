import { CommonActions } from '@react-navigation/native';

/**
 * Finish a multi-step flow by RESETTING the root stack, so the intermediate
 * flow screens (e.g. ServiceSearch → SearchResults → SitterProfile →
 * ContactSitter) are cleared from the back stack instead of lingering.
 *
 * Lands on the given tabs container ('MainTabs' | 'SitterTabs') and, if a
 * `screen` is provided, pushes that result screen on top — so Back from the
 * result returns to the tabs, never back into the completed flow.
 *
 * Use this at every terminal/"success" action instead of navigation.navigate().
 */
export function finishFlow(navigation, { tabs = 'MainTabs', screen, params } = {}) {
  const routes = [{ name: tabs }];
  if (screen) routes.push({ name: screen, params });
  navigation.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    })
  );
}

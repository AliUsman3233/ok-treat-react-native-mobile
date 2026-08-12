import { Platform } from 'react-native';
import * as Application from 'expo-application';
import api from '../config/api';

// The installed build number — Android versionCode / iOS CFBundleVersion — as
// an integer. This is what the backend config compares against (monotonic).
export function getInstalledBuild() {
  const n = parseInt(Application.nativeBuildVersion, 10);
  return Number.isFinite(n) ? n : 0;
}

// Fetch the admin-controlled version config. Fail-open: returns null on any
// error/timeout so a backend hiccup can never block app startup.
export async function fetchVersionConfig() {
  try {
    const res = await api.get('/app/version', { timeout: 6000 });
    return res.data?.data || null;
  } catch (e) {
    return null;
  }
}

// Decide what the splash should do with the update config.
// Returns { action: 'force' | 'soft' | 'auto' | 'none', message, storeUrl }.
//   force -> non-dismissable "update required" gate
//   soft  -> dismissable "update available" prompt
//   auto  -> defer to Google Play In-App Updates (Android); no-op elsewhere
//   none  -> nothing to do
export async function evaluateAppUpdate() {
  const config = await fetchVersionConfig();
  if (!config) return { action: 'none' };

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const p = config[platform] || {};
  const installed = getInstalledBuild();
  const mode = config.mode || 'auto';
  const storeUrl = p.storeUrl || '';
  const message = config.message || '';

  // Only gate when we actually know the installed build and the admin set a
  // meaningful threshold (>0) — avoids accidental lockouts.
  if (mode === 'force' && installed > 0 && p.minSupported > 0 && installed < p.minSupported) {
    return { action: 'force', message, storeUrl };
  }
  if (mode === 'soft' && installed > 0 && p.latest > 0 && installed < p.latest) {
    return { action: 'soft', message, storeUrl };
  }
  if (mode === 'auto') {
    return { action: 'auto', message, storeUrl };
  }
  return { action: 'none' };
}

// 'auto' mode → Google Play In-App Updates. DEFERRED: the native module
// (sp-react-native-in-app-updates) can't be compiled in this environment
// (New-Architecture C++ codegen exceeds the Windows 260-char path limit at this
// project's deep path). Until it's added via an EAS/cloud build or a shorter
// project path, 'auto' is a no-op and the app simply proceeds. Kept as an
// export so the splash import stays stable and re-enabling is a one-file change.
export async function tryPlayInAppUpdate() {
  return; // no-op until the native updater is linked
}

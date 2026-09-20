import { useSelector } from 'react-redux';
import { DEFAULT_REMOTE_CONFIG } from '../services/appConfigService';

// Read the admin-editable remote config anywhere in the app:
//   const { amazonTagsUrl, playStoreUrl, appStoreUrl, supportEmail, supportPhone } = useRemoteConfig();
// Always returns a full object (falls back to defaults before the first fetch).
export function useRemoteConfig() {
  return useSelector((s) => s.app?.remoteConfig) || DEFAULT_REMOTE_CONFIG;
}

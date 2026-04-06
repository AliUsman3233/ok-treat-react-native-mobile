import { createContext, useContext, useState, useCallback } from 'react';
import ProfileVerifiedModal from '../components/ProfileVerifiedModal';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({});

  const showAlert = useCallback((title, description, iconType = 'success', buttonText = 'OK', onClose) => {
    setConfig({ title, description, iconType, buttonText, onClose });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    if (config.onClose) {
      config.onClose();
    }
  }, [config]);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <ProfileVerifiedModal
        visible={visible}
        onNext={hideAlert}
        title={config.title}
        description={config.description}
        buttonText={config.buttonText}
        iconType={config.iconType}
      />
    </AlertContext.Provider>
  );
}

/**
 * Drop-in replacement for Alert.alert using the app's ProfileVerifiedModal.
 *
 * Usage:
 *   const alert = useAppAlert();
 *   alert('Title', 'Description');                          // success
 *   alert('Error', 'Something went wrong', 'error');        // error
 *   alert('Pending', 'Please wait...', 'pending');          // pending
 *   alert('Done', 'All set!', 'success', 'Continue', () => navigation.goBack());
 */
export function useAppAlert() {
  const showAlert = useContext(AlertContext);
  if (!showAlert) {
    // Fallback if used outside provider — shouldn't happen
    return (title, description) => {
      console.warn('useAppAlert used outside AlertProvider, falling back to console');
      console.log(`[Alert] ${title}: ${description}`);
    };
  }
  return showAlert;
}

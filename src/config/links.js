import * as WebBrowser from 'expo-web-browser';

// The admin dashboard host also serves the public legal/info pages
// (same host that serves the QR /tag/:code pages).
export const WEB_BASE_URL = 'https://ok-treat-admin-dashboard-bufbf.ondigitalocean.app';

export const LEGAL_URLS = {
  privacy: `${WEB_BASE_URL}/privacy-policy`,
  terms: `${WEB_BASE_URL}/terms-of-service`,
  about: `${WEB_BASE_URL}/about`,
  contact: `${WEB_BASE_URL}/contact`,
};

// Open a URL in an in-app browser tab (Android Custom Tab / iOS SFSafariView)
// so the user stays inside the app experience.
export async function openInAppBrowser(url) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#32A6D8',
      controlsColor: '#FFFFFF',
      dismissButtonStyle: 'done',
      enableBarCollapsing: true,
    });
  } catch (e) {
    console.error('Failed to open browser:', e?.message);
  }
}

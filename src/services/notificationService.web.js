// Web-compatible notification service (no-op for web)
export const initializeNotifications = async () => {
  console.log('Notifications not supported on web');
  return Promise.resolve();
};

export const registerForPushNotifications = async () => {
  console.log('Push notifications not supported on web');
  return null;
};

import * as Notifications from 'expo-notifications';

export const initializeNotifications = async () => {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
};

export const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
};

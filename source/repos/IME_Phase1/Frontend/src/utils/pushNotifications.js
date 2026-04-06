// Push notifications disabled for Expo Go compatibility
// Enable after building a standalone APK with EAS Build

export async function registerForPushNotificationsAsync() {
  console.log('Push notifications not available in Expo Go on this SDK.');
  return null;
}

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Text } from 'react-native';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import NewsScreen from '../screens/NewsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import MediaDetailScreen from '../screens/MediaDetailScreen';
import PodcastDetailScreen from '../screens/PodcastDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import ContentViewerScreen from '../screens/ContentViewerScreen';
import SupportScreen from '../screens/SupportScreen';
import CircularScreen from '../screens/CircularScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import OrganisationScreen from '../screens/OrganisationScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ActivityFormScreen from '../screens/ActivityFormScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const tabIcons = {
  Home: '🏠',
  Activities: '📅',
  News: '📰',
  Notifications: '🔔',
  Profile: '👤',
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: { backgroundColor: '#ffffff' },
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 20 }}>{tabIcons[route.name]}</Text>
      ),
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="Activities" component={ActivitiesScreen} options={{ tabBarLabel: 'Activities' }} />
    <Tab.Screen name="News" component={NewsScreen} options={{ tabBarLabel: 'News' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Notifications' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
    }}
  >
    <Stack.Screen
      name="MainTabs"
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ActivityDetail"
      component={ActivityDetailScreen}
      options={{ title: 'Activity Details' }}
    />
    <Stack.Screen
      name="NewsDetail"
      component={NewsDetailScreen}
      options={{ title: 'News Article' }}
    />
    <Stack.Screen
      name="MediaDetail"
      component={MediaDetailScreen}
      options={{ title: 'Media' }}
    />
    <Stack.Screen
      name="PodcastDetail"
      component={PodcastDetailScreen}
      options={{ title: 'Podcast Episode' }}
    />
    <Stack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{ title: 'Pay Membership Fee' }}
    />
    <Stack.Screen
      name="PaymentHistory"
      component={PaymentHistoryScreen}
      options={{ title: 'Payment History' }}
    />
    <Stack.Screen
      name="ContentViewer"
      component={ContentViewerScreen}
      options={({ route }) => ({ title: route.params?.title || 'Content' })}
    />
    <Stack.Screen
      name="Support"
      component={SupportScreen}
      options={{ title: 'Support Services' }}
    />
    <Stack.Screen
      name="Circular"
      component={CircularScreen}
      options={{ title: 'GO & Circular' }}
    />
    <Stack.Screen
      name="Achievements"
      component={AchievementsScreen}
      options={{ title: 'Hall of Fame' }}
    />
    <Stack.Screen
      name="Organisation"
      component={OrganisationScreen}
      options={{ title: 'Admin & Office Bearers' }}
    />
    <Stack.Screen
      name="ProfileEdit"
      component={ProfileEditScreen}
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{ title: 'Change Password' }}
    />
    <Stack.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
      options={{ title: 'Admin Dashboard' }}
    />
    <Stack.Screen
      name="ActivityForm"
      component={ActivityFormScreen}
      options={({ route }) => ({
        title: route.params?.activityId ? 'Edit Activity' : 'Create Activity',
      })}
    />
    <Stack.Screen
      name="MemberManagement"
      component={MemberManagementScreen}
      options={{ title: 'Member Management' }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return isAuthenticated ? <MainStack /> : <AuthStack />;
};

export default AppNavigator;

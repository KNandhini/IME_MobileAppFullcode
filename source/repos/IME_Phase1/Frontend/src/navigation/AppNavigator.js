import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ActivityFormScreen from '../screens/ActivityFormScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import MediaDetailScreen from '../screens/MediaDetailScreen';
import PodcastDetailScreen from '../screens/PodcastDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import ContentViewerScreen from '../screens/ContentViewerScreen';
import SupportScreen from '../screens/SupportScreen';
import CircularScreen from '../screens/CircularScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import OrganisationScreen from '../screens/OrganisationScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import SetAnnualFeeScreen from '../screens/SetAnnualFeeScreen';
import RegistrationPaymentScreen from '../screens/RegistrationPaymentScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';
import AboutScreen from '../screens/AboutScreen';
import FundraiseListScreen from '../screens/FundraiseListScreen';
import CreateFundScreen from '../screens/CreateFundScreen';
import FundraiseViewScreen from '../screens/FundraiseViewScreen';
//import MemberManagementScreen      from '../screens/MemberManagementScreen';
//import AboutScreen                 from '../screens/AboutScreen';
import FundScreen from '../screens/FeedScreen';
import RaiseFundScreen from '../screens/RaiseFundScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import AddCircularScreen from '../screens/AddCircularScreen';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#1E3A5F' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="RegistrationPayment" component={RegistrationPaymentScreen}
      options={{ headerShown: true, title: 'Complete Payment', headerStyle: { backgroundColor: '#1E3A5F' }, headerTintColor: '#fff' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#1E3A5F',
      tabBarInactiveTintColor: '#999',
      tabBarShowLabel: false,
      tabBarStyle: {
        height: 64,
        paddingBottom: 6,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        backgroundColor: '#fff',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
            <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Home</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="SupportTab"
      component={SupportScreen}
      options={{
        title: 'Support Services',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>🤝</Text>
            <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Support</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="FundTab"
      component={FundScreen}
      options={{
        title: 'IME Fund',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>💰</Text>
            <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Fund</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="AchievementsTab"
      component={AchievementsScreen}
      options={{
        title: 'Hall of Fame',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>🏆</Text>
            <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Achievements</Text>
          </View>
        ),
      }}
    />
  </Tab.Navigator>

);

const MainStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    {/* Activities */}
    <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ title: 'Activities' }} />
    <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: 'Activity Details' }} />
    <Stack.Screen name="ActivityForm" component={ActivityFormScreen} options={{ headerShown: false }} />
    {/* News & Media */}
    <Stack.Screen name="News" component={NewsScreen} options={{ title: 'News & Media' }} />
    <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: 'News' }} />
    <Stack.Screen name="MediaDetail" component={MediaDetailScreen} options={{ title: 'Media' }} />
    <Stack.Screen name="PodcastDetail" component={PodcastDetailScreen} options={{ title: 'Podcast' }} />
    {/* Payment */}
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Membership Payment' }} />
    <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
    {/* Content */}
    <Stack.Screen name="ContentViewer" component={ContentViewerScreen}
      options={({ route }) => ({ title: route.params?.title || 'Content' })} />
    {/* Support & Circular */}
    <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support Services' }} />
    <Stack.Screen name="Circular" component={CircularScreen} options={{ title: 'GO & Circular' }} />
    {/* Other */}
    <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Hall of Fame' }} />
    <Stack.Screen name="Organisation" component={OrganisationScreen} options={{ title: 'Our Team' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SetAnnualFee" component={SetAnnualFeeScreen} options={{ title: 'Set Annual Fee' }} />
    <Stack.Screen name="MemberManagement" component={MemberManagementScreen} options={{ title: 'Members' }} />
    <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About IME' }} />
    <Stack.Screen name="FundraiseList" component={FundraiseListScreen} options={{ ...HEADER_STYLE, title: 'Fund List', headerShown: true }} />
    <Stack.Screen name="CreateFund" component={CreateFundScreen} options={{ headerShown: false }} />
    <Stack.Screen name="FundraiseView" component={FundraiseViewScreen} options={{ ...HEADER_STYLE, title: 'Fund Details' }} />
    {/* <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About IME' }} /> */}
    <Stack.Screen name="RaiseFund" component={RaiseFundScreen} options={{ ...HEADER_STYLE, title: 'Raise Fund' }} />
    {/*<Stack.Screen name="About"            component={AboutScreen}            options={{ title: 'About IME' }} />*/}
    <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="AddCircular"
      component={AddCircularScreen}
      options={({ route }) => ({
        title: route.params?.item ? 'Edit Circular' : 'Add Circular'
      })}
    />
  </Stack.Navigator>



);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A5F' }}>
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  return isAuthenticated ? <MainStack /> : <AuthStack />;
};

export default AppNavigator;


import React, { useCallback, useState, useEffect, createContext } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Screens
import AnimatedSplashScreen from '../screens/AnimatedSplashScreen';
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
import FundScreen from '../screens/FeedScreen';
import RaiseFundScreen from '../screens/RaiseFundScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import AddCircularScreen from '../screens/AddCircularScreen';
import ClubListScreen from '../screens/ClubListScreen';
import ClubFormScreen from '../screens/ClubFormScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatsListScreen from '../screens/ChatsListScreen';
import SupportDetailScreen from '../screens/SupportDetailScreen';
import MunicipalMapScreen from '../screens/MunicipalMapScreen';
import DemoScreen from '../screens/DemoScreen';
import PresentationScreen from '../screens/PresentationScreen';
import CircularDetailScreen from '../screens/CircularDetailScreen';
import AchievementDetailScreen from '../screens/AchievementDetailScreen';
import AchievementFormScreen from '../screens/AchievementFormScreen';
import LawBotScreen from '../screens/LawBotScreen';
import MemberEditScreen from '../screens/MemberEditScreen';
import CorpDetailScreen from '../screens/CorpDetailsScreen';
import AdminSignupScreen from '../screens/AddAdminScreen';
import AboutIMEScreen from "../screens/AboutIMEScreen";
import JobPostingDetailScreen from '../screens/JobPostingDetailScreen';
import JobPostingFormScreen from '../screens/JobPostingFormScreen';
import JobPostingListScreen from '../screens/JobPostingListScreen';

import MembershipDetailsScreen from '../screens/MembershipDetails';
import FeesDetailsScreen from '../screens/FeesDetails';
import GovernanceDetailsScreen from '../screens/GovernanceDetails';
import HistoryDetailsScreen from '../screens/HistoryDetails';
import ObjectivesDetailsScreen from '../screens/Objectivesdetailsscreen';
import MyPostScreen from '../screens/MypostScreen';
import MagazinesScreen from '../screens/MagazinesScreen';
import MagazineDetailScreen from '../screens/MagazineDetailScreen';
import MagazineFormScreen from '../screens/MagazineFormScreen';
import MembershipBenefitsScreen from '../screens/Membershipbenefitsscreen';

import PaymentReportsScreen from '../screens/Paymentreportsscreen';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Lets LoginScreen (mounted underneath the splash overlay from app start)
// know when to begin its own fade-in. Defaults to `true` so any screen
// reached later (e.g. Login after a logout) just fades in immediately
// instead of waiting for a splash signal that will never come again.
export const SplashFadeContext = createContext(true);

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#1E3A5F' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
  // Prevents the default white flash behind screens during transitions.
  cardStyle: { backgroundColor: '#1E3A5F' },
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      //headerBackVisible: false,
      // Same fix as MainStack — no white flash before Login paints.
      cardStyle: { backgroundColor: '#1E3A5F' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />

    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen
      name="RegistrationPayment"
      component={RegistrationPaymentScreen}
      options={{
        headerShown: true,
        title: 'Complete Payment',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
      }}
    />
    <Stack.Screen
      name="About"
      component={AboutScreen}
      options={{
        headerShown: true,
        title: 'About IMC',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
      }}
    />
    <Stack.Screen name="MembershipDetails" component={MembershipDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="FeesDetails" component={FeesDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="GovernanceDetails" component={GovernanceDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="HistoryDetails" component={HistoryDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ObjectivesDetails" component={ObjectivesDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MunicipalMap" component={MunicipalMapScreen} />
    <Stack.Screen name="CorpDetails" component={CorpDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Demo" component={DemoScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Presentation" component={PresentationScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MembershipBenefits" component={MembershipBenefitsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const [restricted, setRestricted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkOccupation = async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.occupation === 'Unemployed') {
            setRestricted(true);
          }
        }
      } catch (e) {
        console.warn('Failed to read userData for occupation check:', e);
      } finally {
        setChecked(true);
      }
    };
    checkOccupation();
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A5F' }}>
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
        {restricted ? (
          <>
            <Tab.Screen
              name="MyPostTab"
              component={HomeScreen}
              options={{
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <View style={{ alignItems: 'center' }}>
                   <Text style={{ fontSize: 22 }}>🏠</Text>
                    <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Posts</Text>
                  </View>
                ),
              }}
            />
             <Tab.Screen
      name="JobsTab"
      component={JobPostingListScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>💼</Text>
            <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Jobs</Text>
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
            
          </>
        ) : (
          <>
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
            <Tab.Screen
              name="ChatsTab"
              component={ChatsListScreen}
              options={{
                title: 'Chats',
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 22 }}>📩</Text>
                    <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Chats</Text>
                  </View>
                ),
              }}
            />
          </>
        )}
      </Tab.Navigator>

      <View style={{ height: insets.bottom, backgroundColor: '#1E3A5F' }} />
    </View>
  );
};

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
    <Stack.Screen name="AboutIME" component={AboutIMEScreen} options={{ title: 'About IME' }} />
    <Stack.Screen
      name="ContentViewer"
      component={ContentViewerScreen}
      options={({ route }) => ({ title: route.params?.title || 'Content' })}
    />
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
    <Stack.Screen name="About" component={AboutIMEScreen} options={{ title: 'About IME' }} />
    <Stack.Screen
      name="FundraiseList"
      component={FundraiseListScreen}
      options={{ ...HEADER_STYLE, title: 'Fund List', headerShown: true }}
    />
    <Stack.Screen name="CreateFund" component={CreateFundScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="FundraiseView"
      component={FundraiseViewScreen}
      options={{ ...HEADER_STYLE, title: 'Fund Details' }}
    />
    <Stack.Screen name="RaiseFund" component={RaiseFundScreen} options={{ ...HEADER_STYLE, title: 'Raise Fund' }} />
    <Stack.Screen name="ClubList" component={ClubListScreen} options={{ ...HEADER_STYLE, title: 'Club List' }} />
    <Stack.Screen name="ClubForm" component={ClubFormScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="SupportDetail"
      component={SupportDetailScreen}
      options={{ headerShown: false, presentation: 'modal' }}
    />
    <Stack.Screen name="Presentation" component={PresentationScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CircularDetail" component={CircularDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AchievementDetail" component={AchievementDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AchievementForm" component={AchievementFormScreen} options={{ headerShown: false }} />
    <Stack.Screen name="JobPostingDetail" component={JobPostingDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="JobPostingForm" component={JobPostingFormScreen} options={{ headerShown: false }} />
    <Stack.Screen name="JobPostingList" component={JobPostingListScreen} options={{ headerShown: false }} />

    {/* <Stack.Screen
      name="AddCircular"
      component={AddCircularScreen}
      options={{ headerShown: false }} /> */}
    <Stack.Screen name="MembershipDetails" component={MembershipDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="FeesDetails" component={FeesDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="GovernanceDetails" component={GovernanceDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="HistoryDetails" component={HistoryDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ObjectivesDetails" component={ObjectivesDetailsScreen} options={{ headerShown: false }} />

    <Stack.Screen
      name="RegistrationPayment"
      component={RegistrationPaymentScreen}
      options={{
        headerShown: true,
        title: 'Complete Payment',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
      }}
    />
    <Stack.Screen name="LawBot" component={LawBotScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MemberEdit" component={MemberEditScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CorpDetails" component={CorpDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AdminSignup" component={AdminSignupScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddCircular" component={AddCircularScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MyPost" component={MyPostScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Magazines" component={MagazinesScreen} options={{ title: 'Magazines' }} />
    <Stack.Screen name="MagazineForm" component={MagazineFormScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MagazineDetail" component={MagazineDetailScreen} options={{ headerShown: false }} />
 <Stack.Screen name="PaymentReports" component={PaymentReportsScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [loginFadeIn, setLoginFadeIn] = useState(false);

  // Called by AnimatedSplashScreen once it has actually painted a frame —
  // this is the moment it's safe to hide the native launch screen without
  // a white gap appearing between it and the animated gradient.
  const handleSplashReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  // The real app content — mounted from the very start (invisible),
  // sitting underneath the splash overlay until it's revealed.
  const content = loading ? (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E3A5F',
      }}>
      <ActivityIndicator size="large" color="#D4A017" />
    </View>
  ) : isAuthenticated ? (
    <MainStack />
  ) : (
    <AuthStack />
  );

  return (
    <SplashFadeContext.Provider value={loginFadeIn}>
      <View style={{ flex: 1, backgroundColor: '#1E3A5F' }}>
        {content}

        {showSplash && (
          <View style={StyleSheet.absoluteFill}>
            <AnimatedSplashScreen
              onReady={handleSplashReady}
              onExitStart={() => setLoginFadeIn(true)}
              onFinish={() => setShowSplash(false)}
            />
          </View>
        )}
      </View>
    </SplashFadeContext.Provider>
  );
};

export default AppNavigator;
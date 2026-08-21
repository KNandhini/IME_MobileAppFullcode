import React, { useCallback, useState, useEffect, useRef, createContext } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../screens/theme';

// Screens
import AnimatedSplashScreen from '../screens/AnimatedSplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import HealthNutritionScreen from '../screens/HealthNutritionScreen';
import HealthNutritionDetailScreen from '../screens/HealthNutritionDetailScreen';
import HealthNutritionFormScreen from '../screens/HealthNutritionFormScreen';

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
import MemberDashboardScreen from '../screens/MemberDashboardScreen';
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
import ClubDetailScreen from '../screens/ClubDetailScreen';
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

// Small scale + color-pop animation used for the Feed tab icon so it
// visibly reacts when the tab becomes active, similar to how Facebook's
// bottom nav icons bounce on selection.
const AnimatedTabIcon = ({ name, focused, color, activeColor, size = 24 }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: focused ? 1.25 : 1, friction: 3, useNativeDriver: true }),
      Animated.spring(scale, { toValue: focused ? 1.1 : 1, friction: 3, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={size} color={focused ? activeColor : color} />
    </Animated.View>
  );
};

// ── Shared gradient background for native stack headers ──
// React Navigation's stack header can't take arbitrary child components the
// way an in-screen <GradientHeader> can, but it exposes `headerBackground`
// for exactly this — a component rendered behind the title/back button.
// Pass this into `headerBackground` and leave `headerStyle` without a
// backgroundColor (or set it to 'transparent') so the gradient shows through.
const renderGradientHeaderBackground = () => (
  <LinearGradient
    colors={[COLORS.headerStart, COLORS.headerEnd]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={StyleSheet.absoluteFill}
  />
);

const HEADER_STYLE = {
  headerBackground: renderGradientHeaderBackground,
  headerStyle: { backgroundColor: 'transparent' },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '700' },
  // Prevents the default white flash behind screens during transitions.
  cardStyle: { backgroundColor: COLORS.bg },
};

// Shorthand for the one-off screens below that previously set
// headerStyle: { backgroundColor: COLORS.dark } individually.
const GRADIENT_HEADER_OPTIONS = {
  headerShown: true,
  headerBackground: renderGradientHeaderBackground,
  headerStyle: { backgroundColor: 'transparent' },
  headerTintColor: COLORS.white,
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      //headerBackVisible: false,
      // Same fix as MainStack — no white flash before Login paints.
      cardStyle: { backgroundColor: COLORS.bg },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />

    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen
      name="RegistrationPayment"
      component={RegistrationPaymentScreen}
      options={{
        ...GRADIENT_HEADER_OPTIONS,
        title: 'Complete Payment',
      }}
    />
    <Stack.Screen
      name="About"
      component={AboutScreen}
      options={{
        ...GRADIENT_HEADER_OPTIONS,
        title: 'About IME',
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
  const { logout, user } = useAuth();
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const HomeComponent = user?.roleName === 'Admin' ? AdminDashboardScreen : MemberDashboardScreen;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.dark,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 64,
            paddingBottom: 6,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            backgroundColor: COLORS.white,
            elevation: 10,
            shadowColor: COLORS.dark,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -2 },
          },
        }}
      >
        <>
          <Tab.Screen
            name="Home"
            component={HomeComponent}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                  <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Home</Text>
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Feed"
            component={HomeScreen}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <AnimatedTabIcon
                    name={focused ? 'add-circle' : 'add-circle-outline'}
                    focused={focused}
                    color={color}
                    activeColor={COLORS.dark}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: focused ? COLORS.dark : color,
                      fontWeight: focused ? '700' : '400',
                      marginTop: 2,
                    }}
                  >
                    Feed
                  </Text>
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="AboutIMETab"
            component={AboutIMEScreen}
            options={{
              title: 'IME Profile',
              headerBackground: renderGradientHeaderBackground,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: COLORS.white,
              headerTitleStyle: { fontWeight: '700' },
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} size={24} color={color} />
                  <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>IME Profile</Text>
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
                  <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
                  <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Chats</Text>
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="LogoutTab"
            component={View}
            options={{
              title: 'Logout',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name={focused ? 'log-out' : 'log-out-outline'} size={24} color={color} />
                  <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>Logout</Text>
                </View>
              ),
            }}
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                logout();
              },
            })}
          />
        </>
      </Tab.Navigator>

      <View style={{ height: insets.bottom, backgroundColor: COLORS.dark }} />
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
    <Stack.Screen name="AboutIME" component={AboutIMEScreen} options={{ title: 'IME Profile' }} />
    <Stack.Screen
      name="ContentViewer"
      component={ContentViewerScreen}
      options={({ route }) => ({ title: route.params?.title || 'Content' })}
    />
    {/* Support & Circular */}
    <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support Services' }} />
    <Stack.Screen name="HealthNutrition" component={HealthNutritionScreen} options={{ title: 'Podcasts' }} />
    <Stack.Screen name="HealthNutritionDetail" component={HealthNutritionDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="HealthNutritionForm" component={HealthNutritionFormScreen} options={{ headerShown: false }} />


    <Stack.Screen name="Circular" component={CircularScreen} options={{ title: 'GO & Circular' }} />
    {/* Other */}
    <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Hall of Fame' }} />
    <Stack.Screen name="Organisation" component={OrganisationScreen} options={{ title: 'Our Team' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MemberDashboard" component={MemberDashboardScreen} options={{ headerShown: false }} />
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
    <Stack.Screen name="ClubDetail" component={ClubDetailScreen} options={{ headerShown: false }} />

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
    <Stack.Screen name="FundScreen" component={FundScreen} options={{ title: 'Fund Raise' }} />

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
        ...GRADIENT_HEADER_OPTIONS,
        title: 'Complete Payment',
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
        backgroundColor: COLORS.dark,
      }}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  ) : isAuthenticated ? (
    <MainStack />
  ) : (
    <AuthStack />
  );

  return (
    <SplashFadeContext.Provider value={loginFadeIn}>
      <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
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
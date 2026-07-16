import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, StatusBar, Dimensions, Easing, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import IMELogo from '../components/IMELogo';
import WelcomeCard from '../components/WelcomeCard';
import { SplashFadeContext } from '../navigation/AppNavigator';
import { LoginScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const { width } = Dimensions.get('window');
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const { login } = useAuth();
  const startFadeIn = useContext(SplashFadeContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!startFadeIn) return; // stay invisible until the splash tells us to go

    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 480, // matches the splash's fade-out duration for a clean crossfade
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 100, useNativeDriver: true }),
    ]).start();
  }, [startFadeIn]);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const response = await login(email, password);
      if (!response.success) {
        if (response.message === 'GRACE_EXPIRED') {
          const d = response.data || {};
          Alert.alert(
            'Grace Period Expired',
            'Your 3-day free period has ended.\n\nComplete your payment to activate your account.',
            [
              {
                text: 'Pay Now',
                onPress: () => navigation.navigate('RegistrationPayment', {
                  userId: d.userId ?? d.UserId,
                  memberId: d.memberId ?? d.MemberId,
                  memberEmail: email,
                  memberName: d.fullName ?? d.FullName ?? '',
                  memberPassword: password,
                  feeAmount: 0,
                }),
              },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
        } else {
          Alert.alert(
            'Login Failed',
            response.message || 'Invalid email or password'
          );
        }
      }
    } catch {
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* ── Hero / Logo section ── */}
      <View style={styles.heroBg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <Animated.View
          style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <IMELogo size="large" animated={false} />
        </Animated.View>
      </View>

      {/* ── Scrollable body ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Welcome / About card */}
          <WelcomeCard onViewMore={() => navigation.navigate('AboutIME')} />

          {/* Login card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Welcome back to IME Portal</Text>

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor="#BBDEFB"
              activeOutlineColor={NAVY}
              textColor="#1E3A5F"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secureText}
              outlineColor="#BBDEFB"
              activeOutlineColor={NAVY}
              textColor="#1E3A5F"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={secureText ? 'eye-outline' : 'eye-off-outline'}
                  onPress={() => setSecureText(!secureText)}
                />
              }
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}>
              <MaterialCommunityIcons
                name={loading ? 'loading' : 'login'}
                size={18}
                color="#fff"
                style={styles.loginBtnIcon}
              />
              <Text style={styles.loginBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New here?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Routes through the Membership Benefits screen first, so new
                users see what they're joining before hitting the signup form. */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('MembershipBenefits')}>
              <Text style={styles.signupBtnText}>Register New Member</Text>
            </TouchableOpacity>
          </View>

          {/* Quick action buttons */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="information-outline"
              label="About IME"
              onPress={() => navigation.navigate('About')}
            />
            <QuickAction
              icon="play-circle-outline"
              label="Watch Demo"
              onPress={() => navigation.navigate('Demo')}
            />
            <QuickAction
              icon="map-search-outline"
              label="Explore Map"
              onPress={() => navigation.navigate('MunicipalMap')}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsBar}>
            <StatItem value="2,500+" label="Members" />
            <View style={styles.statsDivider} />
            <StatItem value="150+" label="Engineers" />
            <View style={styles.statsDivider} />
            <StatItem value="28+" label="States" />
            <View style={styles.statsDivider} />
            <StatItem value="1965" label="Founded" />
          </View>

          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Institute of Municipal Engineers · All rights reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

    </Animated.View>
  );
};

// ── Sub-components ───────────────────────────────────────────────
const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.quickIconWrap}>
      <MaterialCommunityIcons name={icon} size={24} color={GOLD} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const StatItem = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── Styles ───────────────────────────────────────────────────────


export default LoginScreen;
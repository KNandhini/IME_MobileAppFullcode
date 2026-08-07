import { COLORS } from './theme';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, StatusBar, Dimensions, Easing, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import IMELogo from '../components/IMELogo';
import WelcomeCard from '../components/WelcomeCard';
import { SplashFadeContext } from '../navigation/AppNavigator';
import { LoginScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

// ── Field wrapper — matches Achievement/JobPosting/Club/ChangePassword ──
function Field({ label, children, error, hint }) {
  return (
    <View style={styles.field.wrapper}>
      <Text style={styles.field.label}>{label}</Text>
      {children}
      {!!hint && !error && <Text style={styles.field.hint}>{hint}</Text>}
      {!!error && <Text style={styles.field.error}>{error}</Text>}
    </View>
  );
}

// ── Styled TextInput with a left icon and optional right icon (eye toggle) ──
function IconInputField({ leftIcon, rightIcon, onRightIconPress, hasError, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        style={[
          styles.styledInput.base,
          { paddingLeft: 44, paddingRight: rightIcon ? 44 : 16 },
          focused && styles.styledInput.focused,
          hasError && styles.styledInput.errored,
          style,
        ]}
        placeholderTextColor="#CBD5E1"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      <View style={{ position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
        <MaterialCommunityIcons name={leftIcon} size={19} color={COLORS.placeholder} />
      </View>
      {rightIcon && (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name={rightIcon} size={20} color={COLORS.placeholder} />
        </TouchableOpacity>
      )}
    </View>
  );
}

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
    if (!startFadeIn) return;

    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 480,
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
  <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
    <StatusBar
      backgroundColor={COLORS.headerStart}
      barStyle="light-content"
    />

    <LinearGradient
      colors={[COLORS.headerStart, COLORS.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ---------- Hero ---------- */}

          <View style={styles.heroBg}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />

            <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <IMELogo
                size="large"
                animated={false}
              />
            </Animated.View>
          </View>

          {/* ---------- Welcome ---------- */}

          <WelcomeCard
            onViewMore={() =>
              navigation.navigate('AboutIME')
            }
          />

          {/* ---------- Login Card ---------- */}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Sign In
            </Text>

            <Text style={styles.cardSub}>
              Welcome back to IME Portal
            </Text>

            <Field label="Email Address">
              <IconInputField
                leftIcon="email-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password">
              <IconInputField
                leftIcon="lock-outline"
                rightIcon={
                  secureText
                    ? 'eye-outline'
                    : 'eye-off-outline'
                }
                onRightIconPress={() =>
                  setSecureText(!secureText)
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                placeholder="Enter your password"
              />
            </Field>

            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() =>
                navigation.navigate('ForgotPassword')
              }
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginBtn,
                loading && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={
                  loading
                    ? 'loading'
                    : 'login'
                }
                size={18}
                color={COLORS.white}
                style={styles.loginBtnIcon}
              />

              <Text style={styles.loginBtnText}>
                {loading
                  ? 'Signing in...'
                  : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />

              <Text style={styles.dividerText}>
                New here?
              </Text>

              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() =>
                navigation.navigate(
                  'MembershipBenefits'
                )
              }
            >
              <Text style={styles.signupBtnText}>
                Register New Member
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Quick Actions ---------- */}

          <View style={styles.quickRow}>
            <QuickAction
              icon="information-outline"
              label="About IME"
              onPress={() =>
                navigation.navigate('About')
              }
            />

            <QuickAction
              icon="play-circle-outline"
              label="Watch Demo"
              onPress={() =>
                navigation.navigate('Demo')
              }
            />

            <QuickAction
              icon="map-search-outline"
              label="Explore Map"
              onPress={() =>
                navigation.navigate('MunicipalMap')
              }
            />
          </View>

          {/* ---------- Stats ---------- */}

          <View style={styles.statsBar}>
            <StatItem
              value="2,500+"
              label="Members"
            />

            <View style={styles.statsDivider} />

            <StatItem
              value="150+"
              label="Engineers"
            />

            <View style={styles.statsDivider} />

            <StatItem
              value="28+"
              label="States"
            />

            <View style={styles.statsDivider} />

            <StatItem
              value="1965"
              label="Founded"
            />
          </View>

          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Institution
            of Municipal Engineers · All rights
            reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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

export default LoginScreen;

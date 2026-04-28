import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Animated, StatusBar, Modal, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import IMELogo from '../components/IMELogo';

const { width } = Dimensions.get('window');
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

// Replace with your actual demo YouTube video ID
const DEMO_VIDEO_ID = 'dQw4w9WgXcQ';

const LoginScreen = ({ navigation }) => {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [videoModal, setVideoModal] = useState(false);

  const { login } = useAuth();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await login(email, password);
      if (!response.success) {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
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

          {/* Login card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Welcome back to IMC Portal</Text>

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor="#BBDEFB"
              activeOutlineColor={NAVY}
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
              />
              <Text style={styles.loginBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New here?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Quick action buttons */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="information-outline"
              label="About IMC"
              onPress={() => navigation.navigate('About')}
            />
            <QuickAction
              icon="play-circle-outline"
              label="Watch Demo"
              onPress={() => setVideoModal(true)}
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
            <StatItem value="150+" label="Corporations" />
            <View style={styles.statsDivider} />
            <StatItem value="28+" label="States" />
            <View style={styles.statsDivider} />
            <StatItem value="1965" label="Founded" />
          </View>

          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Indian Municipal Corporation · All rights reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Video modal */}
      <Modal
        visible={videoModal}
        animationType="slide"
        onRequestClose={() => setVideoModal(false)}>
        <View style={styles.videoModal}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoTitle}>App Demo</Text>
            <TouchableOpacity onPress={() => setVideoModal(false)}>
              <MaterialCommunityIcons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: `https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0` }}
            style={{ flex: 1 }}
            allowsFullscreenVideo
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
          />
          <View style={styles.videoFooter}>
            <Text style={styles.videoFooterText}>
              See how to navigate and use the IMC Member Portal
            </Text>
          </View>
        </View>
      </Modal>
    </View>
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
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },

  heroBg: {
    backgroundColor: NAVY,
    alignItems: 'center',
    paddingTop: (StatusBar.currentHeight ?? 0) + 24,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    borderWidth: 1, borderColor: 'rgba(212,160,23,0.12)', top: -60, right: -60,
  },
  circle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, borderColor: 'rgba(212,160,23,0.08)', bottom: -20, left: -40,
  },
  circle3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(212,160,23,0.05)', top: 20, left: 30,
  },
  logoWrap: { alignItems: 'center' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },

  // Login card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#6B7A8D', marginBottom: 18 },
  input:     { marginBottom: 12, backgroundColor: '#fff' },

  forgotWrap: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: NAVY, fontSize: 13, fontWeight: '600' },

  loginBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#8090A0', fontSize: 12, fontWeight: '600' },

  signupBtn: {
    borderWidth: 2, borderColor: NAVY, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  signupBtnText: { color: NAVY, fontSize: 15, fontWeight: '700' },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  quickAction: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  quickIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(212,160,23,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { color: GOLD, fontSize: 16, fontWeight: '800' },
  statLabel:   { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2, fontWeight: '500' },
  statsDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },

  footerText: { color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'center', marginTop: 4 },

  // Video modal
  videoModal:  { flex: 1, backgroundColor: '#000' },
  videoHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight ?? 0) + 10,
    paddingBottom: 12, paddingHorizontal: 16,
  },
  videoTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  videoFooter: { backgroundColor: NAVY, padding: 12, alignItems: 'center' },
  videoFooterText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },
});

export default LoginScreen;

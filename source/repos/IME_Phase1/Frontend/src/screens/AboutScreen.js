import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Palette ────────────────────────────────────────────────────
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY = '#6B7A8D';

// ── Data ───────────────────────────────────────────────────────
// Real historical anchors, not a "founding year" — IME itself is a
// proposed institution, so these stats trace the lineage it stands on.
const STATS = [
  { value: '1688', label: 'First Municipal Institution (Madras)' },
  { value: '1919', label: 'Parent Body IEI Founded' },
  { value: '1993', label: '74th Amendment in Force' },
  { value: '6', label: 'Membership Categories' },
];

const QUICK_LINKS = [
  {
    title: 'History',
    subtitle: 'From 1688 to the 74th Amendment',
    icon: 'book-clock-outline',
    screen: 'HistoryDetails',
  },

  {
    title: 'Our Objectives',
    subtitle: 'What the institution sets out to do',
    icon: 'target',
    screen: 'ObjectivesDetails',
  },
  {
    title: 'Governance',
    subtitle: 'Office bearers, roles & advisory body',
    icon: 'gavel',
    screen: 'GovernanceDetails',
  },
  {
    title: 'Membership',
    subtitle: 'Eligibility across six categories',
    icon: 'account-group',
    screen: 'MembershipDetails',
  },
  {
    title: 'Fee Structure',
    subtitle: 'One-time fees by membership category',
    icon: 'cash-multiple',
    screen: 'FeesDetails',
  },


];

// ── Animated Fade-In ───────────────────────────────────────────
const FadeIn = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 600, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 500, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ── Quick Link Card ────────────────────────────────────────────
const QuickLinkCard = ({ item, navigation, delay }) => (
  <FadeIn delay={delay}>
    <TouchableOpacity
      style={styles.linkCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.linkIconWrap}>
        <MaterialCommunityIcons name={item.icon} size={22} color={GOLD} />
      </View>
      <View style={styles.linkTextWrap}>
        <Text style={styles.linkTitle}>{item.title}</Text>
        <Text style={styles.linkSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.linkMoreWrap}>
        <Text style={styles.linkMore}>Click Here</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={NAVY} />
      </View>
    </TouchableOpacity>
  </FadeIn>
);

// ── Main Screen ────────────────────────────────────────────────
const AboutScreen = ({ navigation }) => {
  const goldLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(goldLine, {
      toValue: 1, duration: 900, delay: 300, useNativeDriver: false,
    }).start();
  }, []);

  const goldWidth = goldLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Banner ── */}
        <View style={styles.hero}>
          <FadeIn delay={0}>
            <Text style={styles.heroEyebrow}>PROPOSED INSTITUTION</Text>
          </FadeIn>
          <FadeIn delay={100}>
            <Text style={styles.heroTitle}>Institution of{'\n'}Municipal Engineers</Text>
          </FadeIn>
          <FadeIn delay={200}>
            <Animated.View style={[styles.goldDivider, { width: goldWidth }]} />
          </FadeIn>
          <FadeIn delay={300}>
            <Text style={styles.heroSubtitle}>
              Carrying forward 338 years of municipal engineering, since the first
              municipal institution was set up at Madras in 1688.
            </Text>
          </FadeIn>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </View>

        {/* ── Quick Stats ── */}
        <FadeIn delay={400}>
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.statBox, i < STATS.length - 1 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeIn>

        {/* ── Short Intro: About IME ── */}
        <FadeIn delay={500}>
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.goldAccent} />
              <Text style={styles.sectionTitle}>About IME</Text>
            </View>
            <Text style={styles.bodyText}>
              Local bodies meet the basic needs of rural and urban populations — water,
              waste water, garbage, roads, street lighting, education, and health.
              Creating and maintaining these amenities has been the responsibility of
              local body engineers for more than 338 years, since the first municipal
              institution was installed at Madras in 1688.
            </Text>
            <Text style={[styles.bodyText, { marginTop: 10 }]}>
              The Institution of Engineers (India), founded in 1919, became the mother
              body behind institutions like the Institution of Public Health Engineers
              (Calcutta) and the Indian Water Works Association (Mumbai) — yet no
              separate institution exists for municipal engineers. The Institution of
              Municipal Engineers, India is proposed to fill that gap, on the same
              lines as IEI Calcutta.
            </Text>
          </View>
        </FadeIn>



        {/* ── Featured Cards (Quick Links) ── */}
        <View style={styles.linksWrap}>
          {QUICK_LINKS.map((item, i) => (
            <QuickLinkCard
              key={item.screen}
              item={item}
              navigation={navigation}
              delay={700 + i * 80}
            />
          ))}
        </View>
        {/* ── Contact Banner ── */}
        <FadeIn delay={800}>
          <View style={styles.contactBanner}>
            <Text style={styles.contactTitle}>Get In Touch</Text>
            <Text style={styles.contactSub}>
              Have questions about membership or our programs?
            </Text>
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL('mailto:info@ime.org')}
              >
                <Text style={styles.contactBtnIcon}>✉️</Text>
                <Text style={styles.contactBtnText}>imeindia2026@gmail.com</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL('tel:+911800000000')}
              >
                <Text style={styles.contactBtnIcon}>📞</Text>
                <Text style={styles.contactBtnText}>9789966699</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>
        {/* ── Footer ── */}
        <FadeIn delay={1300}>
          <View style={styles.footer}>
            <View style={styles.footerGoldLine} />
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Institution of Municipal Engineers, India
            </Text>
            <Text style={styles.footerSub}>Registered office — Chennai</Text>

            <Text style={styles.footerSub}>All rights reserved</Text>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT,
  },
  scroll: {
    paddingBottom: 40,
  },

  // Hero
  hero: {
    backgroundColor: NAVY,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroEyebrow: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 10,
  },
  heroTitle: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 16,
  },
  goldDivider: {
    height: 3,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '90%',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.15)',
    right: -50,
    top: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.10)',
    right: 20,
    bottom: 10,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: '#E8EDF2',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  statLabel: {
    fontSize: 9,
    color: GREY,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Section
  section: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goldAccent: {
    width: 4,
    height: 22,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },

  // Quick Link Cards
  linksWrap: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
  },
  linkIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(212,160,23,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkTextWrap: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 2,
  },
  linkSubtitle: {
    fontSize: 12,
    color: GREY,
    lineHeight: 16,
  },
  linkMoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  linkMore: {
    fontSize: 11,
    color: NAVY,
    fontWeight: '600',
    marginRight: 2,
  },
  // Contact
  contactBanner: {
    backgroundColor: GOLD,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 6,
  },
  contactSub: {
    fontSize: 13,
    color: 'rgba(30,58,95,0.75)',
    marginBottom: 18,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  contactBtnIcon: {
    fontSize: 14,
  },
  contactBtnText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 36,
    paddingBottom: 10,
  },
  footerGoldLine: {
    width: 40,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: GREY,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footerSub: { fontSize: 11, color: '#AAB4BE', marginTop: 2 },

});

export default AboutScreen;
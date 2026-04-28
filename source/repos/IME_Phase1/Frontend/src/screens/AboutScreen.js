import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Linking,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── Palette (matches AppNavigator header) ──────────────────────
const NAVY  = '#1E3A5F';
const GOLD  = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY  = '#6B7A8D';

// ── Data ────────────────────────────────────────────────────────
const STATS = [
  { value: '1965', label: 'Founded' },
  { value: '2,500+', label: 'Members' },
  { value: '58+', label: 'Years of Service' },
  { value: '12', label: 'Regional Chapters' },
];

const VALUES = [
  { icon: '🏛️', title: 'Integrity',    desc: 'Upholding the highest ethical standards in public service and professional conduct.' },
  { icon: '⚙️', title: 'Excellence',   desc: 'Driving innovation and best practices in municipal engineering across the nation.' },
  { icon: '🤝', title: 'Community',    desc: 'Fostering a collaborative network of professionals committed to public welfare.' },
  { icon: '📚', title: 'Knowledge',    desc: 'Continuous learning through research, seminars, publications, and mentorship.' },
];

const OBJECTIVES = [
  'Advance the science and practice of municipal engineering',
  'Promote professional development and continuing education',
  'Represent members in matters of policy and legislation',
  'Establish and maintain professional standards of practice',
  'Foster collaboration between members and government bodies',
  'Publish technical journals and research in the field',
];

// ── Animated Fade-In component ──────────────────────────────────
const FadeIn = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────
const AboutScreen = ({ navigation }) => {
  const goldLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(goldLine, {
      toValue: 1,
      duration: 900,
      delay: 300,
      useNativeDriver: false,
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
            <Text style={styles.heroEyebrow}>ESTABLISHED 1965</Text>
          </FadeIn>
          <FadeIn delay={100}>
            <Text style={styles.heroTitle}>Institution of{'\n'}Municipal Engineering</Text>
          </FadeIn>
          <FadeIn delay={200}>
            <Animated.View style={[styles.goldDivider, { width: goldWidth }]} />
          </FadeIn>
          <FadeIn delay={300}>
            <Text style={styles.heroSubtitle}>
              Advancing the profession that builds and sustains the cities of tomorrow.
            </Text>
          </FadeIn>

          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </View>

        {/* ── Stats Row ── */}
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

        {/* ── Mission ── */}
        <FadeIn delay={500}>
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.goldAccent} />
              <Text style={styles.sectionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.bodyText}>
              The Institution of Municipal Engineering (IME) is a premier professional body dedicated
              to advancing the practice of municipal engineering. We serve as the collective voice of
              engineers who design, build, and maintain the infrastructure that underpins modern civic life —
              from roads and water systems to public spaces and urban planning.
            </Text>
            <Text style={[styles.bodyText, { marginTop: 12 }]}>
              Founded in 1965, IME has grown into a nationwide network of professionals united by a
              common commitment to public service, technical excellence, and ethical practice.
            </Text>
          </View>
        </FadeIn>

        {/* ── Objectives ── */}
        <FadeIn delay={600}>
          <View style={[styles.section, styles.sectionAlt]}>
            <View style={styles.sectionHead}>
              <View style={styles.goldAccent} />
              <Text style={styles.sectionTitle}>Our Objectives</Text>
            </View>
            {OBJECTIVES.map((obj, i) => (
              <View key={i} style={styles.objectiveRow}>
                <View style={styles.objBullet}>
                  <Text style={styles.objNumber}>{String(i + 1).padStart(2, '0')}</Text>
                </View>
                <Text style={styles.objText}>{obj}</Text>
              </View>
            ))}
          </View>
        </FadeIn>

        {/* ── Core Values ── */}
        <FadeIn delay={700}>
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.goldAccent} />
              <Text style={styles.sectionTitle}>Core Values</Text>
            </View>
            <View style={styles.valuesGrid}>
              {VALUES.map((v, i) => (
                <View key={i} style={styles.valueCard}>
                  <Text style={styles.valueIcon}>{v.icon}</Text>
                  <Text style={styles.valueTitle}>{v.title}</Text>
                  <Text style={styles.valueDesc}>{v.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* ── App Overview Presentation ── */}
        <FadeIn delay={750}>
          <TouchableOpacity
            style={styles.presentationBtn}
            onPress={() => navigation.navigate('Presentation')}
            activeOpacity={0.88}>
            <View style={styles.presentationLeft}>
              <View style={styles.presentationIconWrap}>
                <MaterialCommunityIcons name="presentation-play" size={26} color={GOLD} />
              </View>
              <View style={styles.presentationText}>
                <Text style={styles.presentationTitle}>View App Overview</Text>
                <Text style={styles.presentationSub}>Explore all features in a guided presentation</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={NAVY} />
          </TouchableOpacity>
        </FadeIn>

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
                <Text style={styles.contactBtnText}>info@ime.org</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL('tel:+911800000000')}
              >
                <Text style={styles.contactBtnIcon}>📞</Text>
                <Text style={styles.contactBtnText}>1800-000-0000</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        {/* ── Footer ── */}
        <FadeIn delay={900}>
          <View style={styles.footer}>
            <View style={styles.footerGoldLine} />
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Institution of Municipal Engineering
            </Text>
            <Text style={styles.footerSub}>All rights reserved</Text>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────
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
    maxWidth: '85%',
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
    paddingVertical: 18,
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
    fontSize: 10,
    color: GREY,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.5,
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
  sectionAlt: {
    backgroundColor: NAVY,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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

  // Objectives
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  objBullet: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(212,160,23,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  objNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
  objText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.85)',
  },

  // Values
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  valueCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  valueIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 4,
  },
  valueDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: GREY,
  },

  // Presentation button
  presentationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
  },
  presentationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  presentationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212,160,23,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  presentationText: { flex: 1 },
  presentationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 3,
  },
  presentationSub: {
    fontSize: 12,
    color: GREY,
    lineHeight: 16,
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
    marginTop: 28,
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
  },
  footerSub: {
    fontSize: 11,
    color: '#AAB4BE',
    marginTop: 2,
  },
});

export default AboutScreen;

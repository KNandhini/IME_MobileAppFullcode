import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StatusBar, Dimensions, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DemoScreenStyles as styles } from './screenStyles';

const { width: W, height: H } = Dimensions.get('window');
const NAVY = COLORS.navy;
const GREEN = COLORS.green;
const WHITE = COLORS.white;
const LIGHT = COLORS.bg;

const AUTO_ADVANCE_MS = 5000;

// ── Slide definitions ─────────────────────────────────────────────
const SLIDES = [
  {
    id: 'welcome',
    title: 'Institution of Municipal Engineers (IME)',
    subtitle: 'Member Portal',
    desc: 'A unified platform for IME members to connect, collaborate, and stay informed. Available on Android and iOS.',
    icon: 'city-variant-outline',
    color: GREEN,
    accent: GREEN,
    mockup: 'splash',
  },
  {
    id: 'login',
    title: 'Step 1 — Open the App',
    subtitle: 'Sign In Screen',
    desc: 'Launch the IME app to reach the sign-in screen. Tap "Sign In" with your registered email and password.',
    icon: 'login',
    color: NAVY,
    accent: GREEN,
    mockup: 'login',
  },
  {
    id: 'credentials',
    title: 'Step 2 — Enter Credentials',
    subtitle: 'Email & Password',
    desc: 'Type your registered email address and password. Tap the eye icon to show/hide your password.',
    icon: 'form-textbox-password',
    color: GREEN,
    accent: GREEN,
    mockup: 'credentials',
  },
  {
    id: 'home',
    title: 'Step 3 — Home Dashboard',
    subtitle: 'Member Feed',
    desc: 'After logging in, explore the Home feed — see news, activities, circulars, and member posts in one place.',
    icon: 'home-outline',
    color: NAVY,
    accent: GREEN,
    mockup: 'home',
  },
  {
    id: 'profile',
    title: 'Step 4 — Your Profile',
    subtitle: 'Manage Your Details',
    desc: 'View and edit your profile, update your photo, contact info, location, and membership details.',
    icon: 'account-circle-outline',
    color: GREEN,
    accent: GREEN,
    mockup: 'profile',
  },
  {
    id: 'activities',
    title: 'Step 5 — Activities & Events',
    subtitle: 'Stay Engaged',
    desc: 'Browse upcoming workshops, seminars, and field events. Register with one tap and view past activity reports.',
    icon: 'calendar-star',
    color: NAVY,
    accent: GREEN,
    mockup: 'activities',
  },
  {
    id: 'support',
    title: 'Step 6 — Support & Chat',
    subtitle: 'Get Help Anytime',
    desc: 'Raise support tickets, track their status, and chat directly with other members or the support team.',
    icon: 'headset',
    color: GREEN,
    accent: GREEN,
    mockup: 'support',
  },
  {
    id: 'fund',
    title: 'Step 7 — Fundraising',
    subtitle: 'Contribute & Grow',
    desc: 'View active fundraising campaigns, make contributions, and track your donation history securely.',
    icon: 'hand-coin-outline',
    color: NAVY,
    accent: GREEN,
    mockup: 'fund',
  },
  {
    id: 'map',
    title: 'Step 8 — Explore Map',
    subtitle: 'Find Corporations',
    desc: 'Browse municipal corporations across India. Drill down by State → District → Corporation to view full details.',
    icon: 'map-search-outline',
    color: GREEN,
    accent: GREEN,
    mockup: 'map',
  },
  {
    id: 'done',
    title: "You're All Set!",
    subtitle: 'Start Your IME Journey',
    desc: 'Sign in with your member credentials to access all features. New member? Register to join the IME community.',
    icon: 'check-circle-outline',
    color: NAVY,
    accent: GREEN,
    mockup: 'done',
  },
];

// ── Phone mockup content ──────────────────────────────────────────
const MockupContent = ({ type, accent }) => {
  const MOCK_STYLES = {
    bar: {
      height: 6, borderRadius: 3, backgroundColor: accent || GREEN,
      marginBottom: 8, opacity: 0.85,
    },
    barHalf: {
      height: 6, borderRadius: 3, backgroundColor: accent || GREEN,
      marginBottom: 8, width: '60%', opacity: 0.5,
    },
    chip: {
      height: 24, borderRadius: 12, backgroundColor: accent || GREEN,
      marginBottom: 8, marginRight: 6, paddingHorizontal: 10,
      flexDirection: 'row', alignItems: 'center', opacity: 0.9,
      alignSelf: 'flex-start',
    },
    card: {
      backgroundColor: WHITE, borderRadius: 8,
      padding: 10, marginBottom: 8, elevation: 2,
    },
  };

  switch (type) {
    case 'splash':
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <MaterialCommunityIcons name="city-variant-outline" size={32} color={NAVY} />
          </View>
          <Text style={{ color: GREEN, fontWeight: '900', fontSize: 18, letterSpacing: 3 }}>IME</Text>
          <Text style={{ color: WHITE, fontSize: 10, marginTop: 2 }}>Institution of Municipal Corporation</Text>
          <View style={{ marginTop: 20, width: 40, height: 3, backgroundColor: GREEN, borderRadius: 2 }} />
        </View>
      );

    case 'login':
      return (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="city-variant-outline" size={20} color={GREEN} />
            </View>
            <Text style={{ color: GREEN, fontSize: 10, fontWeight: '900', marginTop: 4 }}>IME</Text>
          </View>
          <View style={{ backgroundColor: WHITE, borderRadius: 10, margin: 8, padding: 10 }}>
            <Text style={{ color: NAVY, fontWeight: '700', fontSize: 11, marginBottom: 6 }}>Sign In</Text>
            <View style={{ height: 22, borderRadius: 6, borderWidth: 1, borderColor: COLORS.selected, backgroundColor: '#F9FAFE', marginBottom: 6, paddingHorizontal: 6, justifyContent: 'center' }}>
              <Text style={{ color: '#9E9E9E', fontSize: 8 }}>Email Address</Text>
            </View>
            <View style={{ height: 22, borderRadius: 6, borderWidth: 1, borderColor: COLORS.selected, backgroundColor: '#F9FAFE', marginBottom: 10, paddingHorizontal: 6, justifyContent: 'center' }}>
              <Text style={{ color: '#9E9E9E', fontSize: 8 }}>Password</Text>
            </View>
            <View style={{ backgroundColor: NAVY, borderRadius: 6, paddingVertical: 6, alignItems: 'center' }}>
              <Text style={{ color: WHITE, fontSize: 9, fontWeight: '700' }}>Sign In</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 }}>
            {['About', 'Demo', 'Map'].map(l => (
              <View key={l} style={{ alignItems: 'center' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.selected, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="information-outline" size={12} color={GREEN} />
                </View>
                <Text style={{ color: WHITE, fontSize: 7, marginTop: 2 }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      );

    case 'credentials':
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 10 }}>
          <View style={{ backgroundColor: WHITE, borderRadius: 10, padding: 10 }}>
            <Text style={{ color: NAVY, fontWeight: '700', fontSize: 11, marginBottom: 8 }}>Enter Your Details</Text>
            <View style={{ height: 24, borderRadius: 6, borderWidth: 2, borderColor: NAVY, backgroundColor: '#F9FAFE', marginBottom: 6, paddingHorizontal: 6, justifyContent: 'center' }}>
              <Text style={{ color: NAVY, fontSize: 9 }}>member@ime.org</Text>
            </View>
            <View style={{ height: 24, borderRadius: 6, borderWidth: 1, borderColor: COLORS.selected, backgroundColor: '#F9FAFE', marginBottom: 12, paddingHorizontal: 6, justifyContent: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: NAVY, fontSize: 9 }}>••••••••</Text>
              <MaterialCommunityIcons name="eye-outline" size={12} color="#9E9E9E" />
            </View>
            <View style={{ backgroundColor: NAVY, borderRadius: 6, paddingVertical: 7, alignItems: 'center' }}>
              <Text style={{ color: WHITE, fontSize: 9, fontWeight: '700' }}>Sign In  →</Text>
            </View>
          </View>
        </View>
      );

    case 'home':
      return (
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: NAVY, padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: GREEN, fontWeight: '900', fontSize: 10 }}></Text>
            <MaterialCommunityIcons name="bell-outline" size={14} color={WHITE} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {['Circular: Annual Meeting 2025', 'Activity: Field Visit - Chennai', 'News: Budget Update'].map((item, i) => (
              <View key={i} style={{ backgroundColor: WHITE, margin: 4, marginBottom: 2, borderRadius: 6, padding: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginRight: 6 }} />
                  <Text style={{ color: NAVY, fontSize: 7, fontWeight: '600', flex: 1 }}>{item}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: '#E8E8E8' }}>
            {['🏠', '💬', '💰', '🏆', '📋'].map((ic, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14 }}>{ic}</Text>
              </View>
            ))}
          </View>
        </View>
      );

    case 'profile':
      return (
        <View style={{ flex: 1, backgroundColor: LIGHT }}>
          <View style={{ backgroundColor: NAVY, padding: 10, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6A5ACD', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Text style={{ color: WHITE, fontSize: 16, fontWeight: '700' }}>M</Text>
            </View>
            <Text style={{ color: WHITE, fontWeight: '700', fontSize: 10 }}>Member Name</Text>
            <Text style={{ color: GREEN, fontSize: 8 }}>IME Member · Active</Text>
          </View>
          {['Full Name', 'Email', 'Contact', 'Location'].map((f, i) => (
            <View key={i} style={{ backgroundColor: WHITE, marginHorizontal: 8, marginTop: 4, borderRadius: 6, padding: 6 }}>
              <Text style={{ color: '#9E9E9E', fontSize: 7 }}>{f}</Text>
              <View style={{ height: 3, backgroundColor: '#E0E0E0', borderRadius: 2, marginTop: 3 }} />
            </View>
          ))}
        </View>
      );

    case 'activities':
      return (
        <View style={{ flex: 1, backgroundColor: LIGHT }}>
          <View style={{ backgroundColor: NAVY, padding: 8 }}>
            <Text style={{ color: WHITE, fontWeight: '700', fontSize: 10 }}>Activities</Text>
          </View>
          {[
            { name: 'Annual Conference 2025', date: 'May 15', icon: '🏛️', status: 'Upcoming' },
            { name: 'Field Visit – Pune', date: 'May 22', icon: '🚌', status: 'Open' },
            { name: 'Workshop: Smart Cities', date: 'Jun 5', icon: '🏙️', status: 'Open' },
          ].map((a, i) => (
            <View key={i} style={{ backgroundColor: WHITE, margin: 4, marginBottom: 2, borderRadius: 6, padding: 6, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: NAVY, fontSize: 7, fontWeight: '700' }}>{a.name}</Text>
                <Text style={{ color: '#9E9E9E', fontSize: 7 }}>{a.date}</Text>
              </View>
              <View style={{ backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 }}>
                <Text style={{ color: NAVY, fontSize: 6, fontWeight: '700' }}>{a.status}</Text>
              </View>
            </View>
          ))}
        </View>
      );

    case 'support':
      return (
        <View style={{ flex: 1, backgroundColor: LIGHT }}>
          <View style={{ backgroundColor: NAVY, padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: WHITE, fontWeight: '700', fontSize: 10 }}>Support</Text>
            <MaterialCommunityIcons name="plus" size={14} color={GREEN} />
          </View>
          {[
            { t: 'Membership Renewal Query', s: 'Open', c: GREEN },
            { t: 'Certificate Request', s: 'Closed', c: '#4CAF50' },
          ].map((item, i) => (
            <View key={i} style={{ backgroundColor: WHITE, margin: 4, borderRadius: 6, padding: 6 }}>
              <Text style={{ color: NAVY, fontSize: 7, fontWeight: '600' }}>{item.t}</Text>
              <View style={{ height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.c, marginRight: 4 }} />
                <Text style={{ color: '#9E9E9E', fontSize: 7 }}>{item.s}</Text>
              </View>
            </View>
          ))}
          <View style={{ backgroundColor: NAVY, margin: 8, borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="chat-outline" size={14} color={GREEN} style={{ marginRight: 6 }} />
            <Text style={{ color: WHITE, fontSize: 8 }}>Start a Direct Message</Text>
          </View>
        </View>
      );

    case 'fund':
      return (
        <View style={{ flex: 1, backgroundColor: LIGHT }}>
          <View style={{ backgroundColor: NAVY, padding: 8 }}>
            <Text style={{ color: WHITE, fontWeight: '700', fontSize: 10 }}>Fundraising</Text>
          </View>
          {[
            { name: 'Infrastructure Fund 2025', raised: '₹ 8.2L', goal: '₹ 10L', pct: 82 },
            { name: 'Member Welfare Fund', raised: '₹ 3.5L', goal: '₹ 5L', pct: 70 },
          ].map((f, i) => (
            <View key={i} style={{ backgroundColor: WHITE, margin: 4, borderRadius: 6, padding: 8 }}>
              <Text style={{ color: NAVY, fontSize: 8, fontWeight: '700', marginBottom: 4 }}>{f.name}</Text>
              <View style={{ height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 4 }}>
                <View style={{ height: 4, backgroundColor: GREEN, borderRadius: 2, width: `${f.pct}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#9E9E9E', fontSize: 7 }}>{f.raised} raised</Text>
                <Text style={{ color: NAVY, fontSize: 7, fontWeight: '700' }}>{f.pct}%</Text>
              </View>
            </View>
          ))}
        </View>
      );

    case 'map':
      return (
        <View style={{ flex: 1, backgroundColor: LIGHT }}>
          <View style={{ backgroundColor: NAVY, padding: 8 }}>
            <Text style={{ color: WHITE, fontWeight: '700', fontSize: 10 }}>Explore Corporations</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7 }}>India › Tamil Nadu › Chennai</Text>
          </View>
          <View style={{ flexDirection: 'row', padding: 6 }}>
            {['Countries', 'States', 'Districts', 'Corps'].map((l, i) => (
              <View key={l} style={{ flex: 1, backgroundColor: i === 3 ? GREEN : COLORS.infoLight, borderRadius: 10, paddingVertical: 3, marginRight: i < 3 ? 3 : 0, alignItems: 'center' }}>
                <Text style={{ fontSize: 6, color: i === 3 ? NAVY : '#6B7A8D', fontWeight: '700' }}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: WHITE, margin: 4, borderRadius: 8, overflow: 'hidden' }}>
            <View style={{ backgroundColor: NAVY, padding: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                <MaterialCommunityIcons name="office-building" size={12} color={NAVY} />
              </View>
              <View>
                <Text style={{ color: WHITE, fontSize: 8, fontWeight: '700' }}>Greater Chennai Corporation</Text>
                <Text style={{ color: GREEN, fontSize: 7 }}>GCC · Est. 1688</Text>
              </View>
            </View>
            <View style={{ padding: 6 }}>
              {['Mayor: R. Priya', 'Population: 7.1M', 'Wards: 200'].map((d, i) => (
                <Text key={i} style={{ color: '#555', fontSize: 7, marginBottom: 2 }}>• {d}</Text>
              ))}
            </View>
          </View>
        </View>
      );

    case 'done':
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="check-circle" size={52} color={GREEN} />
          <Text style={{ color: NAVY, fontWeight: '900', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
            Ready to Go!
          </Text>
          <Text style={{ color: '#6B7A8D', fontSize: 9, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 }}>
            Sign in to your IME account{'\n'}and start exploring all features.
          </Text>
          <View style={{ marginTop: 16, backgroundColor: GREEN, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20 }}>
            <Text style={{ color: NAVY, fontWeight: '700', fontSize: 10 }}>Sign In Now</Text>
          </View>
        </View>
      );

    default:
      return null;
  }
};

// ── Main Screen ───────────────────────────────────────────────────
const DemoScreen = ({ navigation }) => {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const total = SLIDES.length;
  const slide = SLIDES[current];

  const animateIn = useCallback(() => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1, tension: 70, friction: 10, useNativeDriver: true,
    }).start();
  }, []);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    if (progressRef.current) progressRef.current.stop();
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: AUTO_ADVANCE_MS,
      useNativeDriver: false,
    });
    progressRef.current = anim;
    anim.start();
  }, []);

  const scheduleAdvance = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrent(prev => {
        if (prev < total - 1) return prev + 1;
        setPlaying(false);
        return prev;
      });
    }, AUTO_ADVANCE_MS);
  }, [total]);

  useEffect(() => {
    animateIn();
    if (playing) {
      startProgress();
      scheduleAdvance();
    } else {
      clearTimeout(timerRef.current);
      if (progressRef.current) progressRef.current.stop();
    }
    return () => clearTimeout(timerRef.current);
  }, [current, playing]);

  const goTo = (idx) => {
    if (idx < 0 || idx >= total) return;
    clearTimeout(timerRef.current);
    setCurrent(idx);
    if (!playing) setPlaying(true);
  };

  const togglePlay = () => {
    setPlaying(p => {
      if (!p) {
        startProgress();
        scheduleAdvance();
      } else {
        clearTimeout(timerRef.current);
        if (progressRef.current) progressRef.current.stop();
      }
      return !p;
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const slideOpacity = slideAnim;
  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={WHITE} barStyle="dark-content" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>App Demo</Text>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <MaterialCommunityIcons
            name={playing ? 'pause' : 'play'}
            size={22}
            color={GREEN}
          />
        </TouchableOpacity>
      </View>

      {/* ── Slide progress strips ── */}
      <View style={styles.stripsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} style={styles.stripWrap} activeOpacity={0.8}>
            <View style={styles.stripBg}>
              {i < current ? (
                <View style={[styles.stripFill, { width: '100%' }]} />
              ) : i === current ? (
                <Animated.View style={[styles.stripFill, { width: progressWidth }]} />
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content area — always white ── */}
      <View style={styles.contentArea}>

        {/* Phone mockup — large, fills available space */}
        <Animated.View style={[
          styles.phoneMockupWrap,
          { opacity: slideOpacity, transform: [{ translateY: slideTranslate }] },
        ]}>
          <View style={styles.phoneFrame}>
            <View style={styles.phoneSpeaker} />
            <View style={styles.phoneScreen}>
              <MockupContent type={slide.mockup} accent={slide.accent} />
            </View>
            <View style={styles.phoneHome} />
          </View>
        </Animated.View>

        {/* ── Bottom strip: description + dots + nav ── */}
        <Animated.View style={[styles.bottomStrip, { opacity: slideOpacity },{marginBottom:30}]}>
          {/* Step badge + subtitle */}
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>
                {current + 1} / {total}
              </Text>
            </View>
            <Text style={styles.infoSubtitle} numberOfLines={1}>{slide.subtitle}</Text>
          </View>

          {/* Title + description */}
          <Text style={styles.infoTitle} numberOfLines={1}>{slide.title}</Text>
          <Text style={styles.infoDesc} numberOfLines={2}>{slide.desc}</Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <View style={[
                  styles.dot,
                  i === current && styles.dotActive,
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Prev / Next buttons */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, current === 0 && styles.navBtnDisabled]}
              onPress={() => goTo(current - 1)}
              disabled={current === 0}>
              <MaterialCommunityIcons name="chevron-left" size={20} color={current === 0 ? '#5A6072' : GREEN} />
              <Text style={[styles.navBtnText, { color: current === 0 ? '#5A6072' : GREEN }]}>Prev</Text>
            </TouchableOpacity>

            {current < total - 1 ? (
              <TouchableOpacity style={[styles.navBtn, styles.navBtnNext]} onPress={() => goTo(current + 1)}>
                <Text style={styles.navBtnText}>Next</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={WHITE} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, styles.navBtnNext]}
                onPress={() => navigation.goBack()}>
                <Text style={styles.navBtnText}>Login</Text>
                <MaterialCommunityIcons name="login" size={18} color={WHITE} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

      </View>
    </View>
  );
};

export default DemoScreen;
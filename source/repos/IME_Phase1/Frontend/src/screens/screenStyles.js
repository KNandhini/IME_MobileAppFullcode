import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from './theme';
import * as Common from './common';


const { width } = Dimensions.get('window');
export const CommonScreenStyles = {
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row' },
  error: { color: '#D32F2F', fontSize: 12 },
};

const createScreenStyles = (styles) => StyleSheet.create({
  ...CommonScreenStyles,
  ...styles,
});

// AboutIMEScreen
export const AboutIMEScreenStyles = (() => {
  const BG = '#F5F7FA';


  const ROYAL = '#3A4EFB';

  const NAVY = '#003366';

  const GOLD = '#D4AF37';

  return createScreenStyles({
    root: { flex: 1, backgroundColor: BG },

    banner: {
      alignItems: 'center',
      paddingTop: 14,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    backBtn: {
      position: 'absolute', top: 14, left: 14, zIndex: 10,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    bannerTitle: {
      color: '#fff', fontSize: 18, fontWeight: '800',
      marginTop: 8, letterSpacing: 0.3,
    },

    scrollContent: { padding: 16, paddingBottom: 30 },

    paragraph: { fontSize: 13.5, color: '#334155', lineHeight: 21 },
    docCard: {
      backgroundColor: BG, borderRadius: 10, padding: 14,
      borderWidth: 1, borderColor: '#E2E8F0',
    },
    docLabel: { fontSize: 12, fontWeight: '800', color: ROYAL, marginBottom: 4, letterSpacing: 0.5 },

    footer: { alignItems: 'center', marginTop: 20, paddingHorizontal: 10 },
    footerTitle: { color: NAVY, fontSize: 13, fontWeight: '800', textAlign: 'center' },
    footerTagline: { color: GOLD, fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center' },
    footerCopy: { color: '#94A3B8', fontSize: 11, marginTop: 8 },
  });
})();
// MembershipBenefitsScreen
export const MembershipBenefitsScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  scrollContent: {
    paddingBottom: 36,
  },

  // =========================
  // HERO
  // =========================

  hero: {
  alignItems: 'center',
  paddingTop: (StatusBar.currentHeight || 0) + 22,
  paddingBottom: 46,
  paddingHorizontal: 24,
  borderBottomLeftRadius: 28,
  borderBottomRightRadius: 28,
  overflow: 'hidden',
},

backBtn: {
  position: 'absolute',
  top: (StatusBar.currentHeight || 0) + 22,
  left: 18,
  zIndex: 10,
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: 'rgba(255,255,255,0.14)',
  alignItems: 'center',
  justifyContent: 'center',
},

  heroRing1: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.18)',
  },

  heroRing2: {
    position: 'absolute',
    bottom: -70,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: width - 80,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },

  dividerLine: {
    width: 44,
    height: 1,
    backgroundColor: 'rgba(212,160,23,0.55)',
  },

  dividerDiamond: {
    width: 7,
    height: 7,
    backgroundColor: '#A0C878',
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },

  // =========================
  // SEAL
  // =========================

  sealWrap: {
    alignItems: 'center',
    marginTop: -34,
    marginBottom: 8,
  },

  seal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A0C878',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 5,
  },

  sealText: {
    marginTop: 8,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#252943',
    letterSpacing: 0.3,
  },

  // =========================
  // SECTIONS
  // =========================

  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A0C878',
    letterSpacing: 1.4,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#252943',
    marginTop: 4,
    marginBottom: 14,
  },
  // =========================
  // BENEFITS
  // =========================

  benefitsList: {
    gap: 12,
  },

  benefitCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,

    shadowColor: '#0F2A4A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,

    borderWidth: 1,
    borderColor: '#EEF1F6',
  },

  benefitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF0F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  benefitTextWrap: {
    flex: 1,
  },

  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#252943',
    marginBottom: 3,
  },

  benefitBlurb: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // =========================
  // TERMS & CONDITIONS
  // =========================

  termsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,

    borderWidth: 1,
    borderColor: '#EEF1F6',

    shadowColor: '#0F2A4A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  termsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },

  // =========================
  // REGISTRATION FEE
  // =========================

  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,

    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,

    borderWidth: 1,
    borderColor: '#EEF1F6',

    shadowColor: '#0F2A4A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  feeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,

    backgroundColor: '#EAF0F8',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: '#A0C878',
  },

  feeCardBody: {
    flex: 1,
  },

  feeCardLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  feeCardAmount: {
    fontSize: 28,
    color: '#252943',
    fontWeight: '800',
    marginTop: 3,
  },

  feeCardCurrency: {
    fontSize: 18,
    fontWeight: '700',
  },

  feeCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,

    alignSelf: 'flex-start',

    backgroundColor: '#FBF3DD',

    borderRadius: 20,

    paddingHorizontal: 10,
    paddingVertical: 4,

    marginTop: 8,
  },

  feeCardBadgeText: {
    fontSize: 11,
    color: '#252943',
    fontWeight: '600',
  },

  noFee: {
    fontSize: 12.5,
    color: '#B91C1C',
  },
  // =========================
  // ACCEPTANCE
  // =========================

  commitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',

    borderRadius: 16,
    padding: 12,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    marginBottom: 14,
  },

  commitText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '500',
  },

  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    backgroundColor: '#252943',

    borderRadius: 14,
    paddingVertical: 15,

    shadowColor: '#252943',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  continueBtnDisabled: {
    backgroundColor: '#9CA9B8',
    shadowOpacity: 0,
    elevation: 0,
  },

  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  backLink: {
    color: '#252943',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },

  footerNote: {
    textAlign: 'center',
    fontSize: 11.5,
    color: '#94A3B8',

    marginTop: 18,
    marginBottom: 20,

    paddingHorizontal: 40,
    lineHeight: 17,
  },
  
membershipFeeInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE5EF',

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,

    shadowOffset: {
        width: 0,
        height: 3,
    },

    elevation: 3,
},

membershipFeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingBottom: 13,
    marginBottom: 5,

    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF3',
},

membershipFeeTitle: {
    marginLeft: 9,

    fontSize: 16,
    fontWeight: '700',

    color: '#252943',
},

membershipFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 13,
},

membershipFeeCategory: {
    flex: 1,

    paddingRight: 12,

    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',

    color: '#334155',
},

membershipFeeAmount: {
    fontSize: 15,
    fontWeight: '800',

    color: '#252943',
},

membershipFeeDivider: {
    height: 1,

    backgroundColor: '#E8EDF3',
},


});
// AboutScreen
export const AboutScreenStyles = (() => {
  const LIGHT = COLORS.bg;

  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;

  const WHITE = COLORS.white;

  const GREY = COLORS.grey;

 const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 600; // adjust breakpoint as needed

  return createScreenStyles({
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
   contactRow: isTablet
      ? { flexDirection: 'row', gap: 12 }
      : { flexDirection: 'column', gap: 10, width: '100%' },

    contactBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: NAVY,
      paddingVertical: isTablet ? 10 : 12,
      paddingHorizontal: 14,
      borderRadius: 8,
      gap: isTablet ? 6 : 8,
      ...(isTablet ? {} : { width: '100%' }),
    },

    contactBtnIcon: {
      fontSize: 14,
    },
    contactBtnText: {
      color: WHITE,
      fontSize: isTablet ? 12 : 13,
      fontWeight: '600',
      textAlign: 'center',
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
})();

// AchievementDetailScreen
export const AchievementDetailScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F0F4F8' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    headerBtn: { padding: 6, borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

    loadingContainer: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: 24,
    },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },

    body: { padding: 20, paddingBottom: 40, alignItems: 'center' },

    heroSection: { position: 'relative', marginBottom: 14, marginTop: 8 },
    heroAvatar: {
      width: 110, height: 110, borderRadius: 55,
      borderWidth: 4, borderColor: GOLD,
    },
    heroAvatarFallback: {
      backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
    },
    heroInitials: { color: '#fff', fontSize: 36, fontWeight: '800' },
    trophyCircle: {
      position: 'absolute', bottom: 0, right: 0,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
      elevation: 4, borderWidth: 2, borderColor: GOLD,
    },

    memberName: {
      fontSize: 20, fontWeight: '800', color: NAVY,
      textAlign: 'center', marginBottom: 12,
    },
    goldDivider: {
      width: 56, height: 3, backgroundColor: GOLD,
      borderRadius: 2, marginBottom: 16,
    },

    achTitle: {
      fontSize: 18, fontWeight: '700', color: '#0F172A',
      textAlign: 'center', lineHeight: 26, marginBottom: 12,
    },

    metaRow: {
      flexDirection: 'row', alignItems: 'center',
      marginBottom: 20,
    },
    metaText: { color: '#64748B', fontSize: 13, marginLeft: 6, fontWeight: '500' },

    descCard: {
      width: '100%', backgroundColor: '#fff',
      borderRadius: 12, padding: 16, marginBottom: 20,
      elevation: 2, shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    descLabel: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    descText: { fontSize: 14, color: '#334155', lineHeight: 22 },

    attachSection: { width: '100%', marginBottom: 20 },
    attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    attachImage: {
      width: '100%',
      height: 220,
      borderRadius: 12,
      resizeMode: 'contain',
      backgroundColor: '#fff',
    },
    attachHint: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
    downloadBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 14,
    },
    downloadText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    ...Common.lightboxSimple(),
  });
})();

// AchievementFormScreen
const _AchievementFormScreenStyleBundle = (() => {
  const GOLD = COLORS.gold;


  const NAVY = COLORS.navy;

  return {
  
    AchievementFormScreenDrop: createScreenStyles({
  wrapper: { marginBottom: 20 }, // match field.wrapper spacing
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',      // was '#fff'
    borderRadius: 12,                // was 4
    paddingHorizontal: 16,           // was 14
    paddingVertical: 14,
    borderWidth: 1.5,                // was 1
    borderColor: '#E2E8F0',          // was '#BBDEFB'
  },
  triggerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',      // added, matches styledInput.errored
  },
  triggerText: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  placeholder: { color: '#CBD5E1' },
  chevron: { fontSize: 10, color: '#94A3B8', marginLeft: 8 },
  errorText: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },

  // sheet/option styles unchanged
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 30 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sheetClose: { fontSize: 18, color: '#94A3B8', fontWeight: '700' },
  option: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  optionActive: { backgroundColor: '#EFF6FF' },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  optionPhoto: { width: 36, height: 36, borderRadius: 18, marginRight: 12, borderWidth: 1.5, borderColor: GOLD },
  optionPhotoPlaceholder: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  optionInitials: { color: '#fff', fontSize: 12, fontWeight: '700' },
  optionText: { fontSize: 15, color: '#334155', flex: 1 },
  optionTextActive: { color: '#1D4ED8', fontWeight: '600' },
}),

    AchievementFormScreenStyles: createScreenStyles({
      root: { flex: 1, backgroundColor: '#F7F9FC' },
     
      navbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  backgroundColor: NAVY,
},
navSide: { minWidth: 64, paddingHorizontal: 4 },
navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff' },
navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
navSave: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },
      body: { padding: 18, paddingBottom: 40 },

      roleLoadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingVertical: 14 },
      roleLoadingText: { marginLeft: 8, fontSize: 14, color: '#94A3B8' },

      avatarBlock: { alignItems: 'center', marginBottom: 16 },
      avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, borderColor: GOLD },
      avatarPlaceholder: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: NAVY,
        borderWidth: 2.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center',
      },
      avatarInitials: { color: '#fff', fontSize: 26, fontWeight: '800' },

      input: { marginBottom: 14, backgroundColor: '#fff' },
      inputReadOnly: { marginBottom: 14, backgroundColor: '#F1F5F9' },
      error: {
        color: 'red',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 5,
      },
      dateField: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 10, padding: 14, marginBottom: 20, elevation: 1,
        borderWidth: 1, borderColor: '#BBDEFB',
      },
      dateText: { flex: 1, marginLeft: 10 },
      dateLabelText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
      dateValue: { fontSize: 14, color: NAVY, fontWeight: '600', marginTop: 2 },

      attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.6 },
      attachGrid: {
        flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1',
        borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80,
        alignItems: 'center', marginBottom: 6,
      },
      gridThumb: {
        width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden',
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
      },
      gridImg: { width: '100%', height: '100%' },
      gridDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
      gridDocIcon: { fontSize: 24 },
      gridDocName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
      gridRemove: {
        position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
      },
      gridRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
      gridAddBtn: {
        width: 80, height: 80, borderRadius: 10, margin: 4,
        borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
      },
      gridAddIcon: { fontSize: 22, marginBottom: 2 },
      gridAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
      attachHint: { fontSize: 11, color: '#94A3B8', marginBottom: 20 },

      saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: NAVY, borderRadius: 12, padding: 16, marginTop: 6,
      },
      saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },

      saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: NAVY, borderRadius: 12, padding: 16, marginTop: 6,
      },
      saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },

      viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
      viewerImage: { width: '100%', height: '80%' },
      viewerClose: { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
      viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },

      viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
      viewerImage: { width: '100%', height: '80%' },
      viewerClose: { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
      viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
      navbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: NAVY,
        paddingTop: (StatusBar.currentHeight || 0) + 6,
        paddingBottom: 12, paddingHorizontal: 12,
      },
      navSide: { minWidth: 64, paddingHorizontal: 4 },
      navTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
      cancelText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
      saveText: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },
    // ── Field wrapper styles (own copy — not shared with Support/Admin screens) ──
      field: {
        wrapper: { marginBottom: 20 },
        labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
        label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
        req: { color: '#EF4444' },
        counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
        counterOver: { color: '#EF4444' },
        hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
        error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
      },

      // ── Styled TextInput styles (own copy — not shared with Support/Admin screens) ──
      styledInput: {
        base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
        focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
        errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
        multiline: { height: 130, paddingTop: 14 },
      },
    }),
  };
})();
export const AchievementFormScreenDrop = _AchievementFormScreenStyleBundle.AchievementFormScreenDrop;
export const AchievementFormScreenStyles = _AchievementFormScreenStyleBundle.AchievementFormScreenStyles;

// AchievementsScreen
export const AchievementsScreenS = (() => {
  const GOLD = COLORS.gold;

  const NAVY = COLORS.navy;

  return createScreenStyles({
    safe: { flex: 1, backgroundColor: '#F7F9FC' },
    list: { padding: 16, paddingBottom: 90 },
    card: {
      backgroundColor: '#fff',
      borderRadius: 16,
      marginBottom: 12,
      padding: 16,
      shadowColor: '#1A202C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    badge: {
      backgroundColor: '#FEF9EC',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 10,
      color: '#B7791F',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardActions: { flexDirection: 'row', gap: 8 },
    editBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 0.5,
      borderColor: '#BFDBFE',
    },
    deleteBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 0.5,
      borderColor: '#FECACA',
    },
    editText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
    deleteText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    photo: {
      width: 52, height: 52, borderRadius: 26,
      marginRight: 14, borderWidth: 2, borderColor: GOLD,
    },
    photoPlaceholder: {
      width: 52, height: 52, borderRadius: 26,
      marginRight: 14, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: GOLD,
    },
    photoPlaceholderText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    textContainer: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginBottom: 2 },
    achTitle: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 4 },
    description: { fontSize: 13, color: '#718096', lineHeight: 18 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
    date: { fontSize: 11, color: '#A0AEC0' },
    centered: {
      flex: 1, justifyContent: 'center',
      alignItems: 'center', paddingVertical: 60,
    },
    loadingText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginTop: 12, marginBottom: 4 },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    fab: Common.fab({ zIndex: 100 }),
    fabText: Common.fabText,
  });
})();

// ActivitiesScreen
export const ActivitiesScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    list: { padding: 12, paddingBottom: 80 },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },

    visibilityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeAll: { backgroundColor: '#DBEAFE' },
    badgeClub: { backgroundColor: '#FEF3C7' },
    visibilityText: { fontSize: 11, fontWeight: '700', color: '#475569' },

    actionRow: { flexDirection: 'row', gap: 6 },
    editBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
    editText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    deleteBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
    deleteText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

    title: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
    description: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 6 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
    metaText: { fontSize: 12, color: '#94A3B8' },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
    statusText: { fontSize: 11, fontWeight: '600', color: '#475569' },

    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
    emptyHint: { fontSize: 13, color: '#CBD5E1', marginTop: 8 },

    fab: Common.fab(),
    fabText: Common.fabText,
  });
})();

// ActivityDetailScreen
export const ActivityDetailScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F0F4F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
    errorText: { fontSize: 15, color: '#888' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    headerBtn: { padding: 6, borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

    body: { padding: 20, paddingBottom: 40, alignItems: 'center' },

    badge: {
      alignSelf: 'flex-start', backgroundColor: '#FEF9EC', borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10,
    },
    badgeText: { fontSize: 10, color: '#B7791F', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    title: {
      width: '100%',
      fontSize: 20, fontWeight: '800', color: NAVY,
      textAlign: 'left', marginBottom: 12,
    },
    goldDivider: {
      width: 56, height: 3, backgroundColor: GOLD,
      borderRadius: 2, marginBottom: 16,
    },

    metaWrap: { width: '100%', marginBottom: 20 },
    metaRow: {
      flexDirection: 'row', alignItems: 'center',
      marginBottom: 10,
    },
    metaText: { color: '#334155', fontSize: 14, marginLeft: 8, fontWeight: '500' },

    descCard: {
      width: '100%', backgroundColor: '#fff',
      borderRadius: 12, padding: 16, marginBottom: 20,
      elevation: 2, shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    descLabel: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    descText: { fontSize: 14, color: '#334155', lineHeight: 22 },

     attachSection: { width: '100%', marginTop: 8 },
    attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    noAttach: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
    attachImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#fff' },
    attachHint: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 10 },
    downloadText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8, flex: 1 },


    ...Common.lightboxSimple({ zIndex: 10 }),
  });
})();

// ActivityFormScreen
export const ActivityFormScreenStyles = (() => {
  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F7F9FC' },

    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      paddingTop: (StatusBar.currentHeight ?? 0) + 12,
      backgroundColor: '#252943',
    },
    navSide: { minWidth: 72, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    navSave: { fontSize: 15, color: '#A0C878', fontWeight: '700', textAlign: 'right' },

    body: { padding: 18, paddingBottom: 40 },   // was container/card boxing — matches JobPosting

    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#64748B',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },

    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#E0E7EF',
      marginRight: 8,
      marginBottom: 8,
    },
    chipSelected: { backgroundColor: '#252943' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#252943' },
    chipTextSelected: { color: '#fff' },

    radioGroup: { gap: 10, marginBottom: 20 },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#D1D5DB',
      borderRadius: 10,
      padding: 14,
      backgroundColor: '#fff',
    },
    radioOptionSelected: {
      borderColor: '#252943',
      backgroundColor: '#EFF6FF',
    },
    radioCircle: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 2, borderColor: '#9CA3AF',
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12,
    },
    radioCircleSelected: { borderColor: '#252943' },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#252943' },
    radioTextWrap: { flex: 1 },
    radioLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    radioLabelSelected: { color: '#252943' },
    radioSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    radioSubSelected: { color: '#6B9CC7' },
    radioIcon: { fontSize: 20, marginLeft: 8 },

    attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.6 },
    attachGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      borderWidth: 1.5, borderColor: '#CBD5E1',
      borderRadius: 12, borderStyle: 'dashed',
      padding: 8, minHeight: 80,
      alignItems: 'center', marginBottom: 6,
    },
    thumb: {
      width: 80, height: 80, borderRadius: 10, margin: 4,
      overflow: 'hidden', backgroundColor: '#F1F5F9',
      borderWidth: 1, borderColor: '#E2E8F0',
    },
    thumbImg: { width: '100%', height: '100%' },
    thumbDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
    thumbIcon: { fontSize: 24 },
    thumbName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
    thumbRemove: {
      position: 'absolute', top: 2, right: 2,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 8, width: 18, height: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    thumbRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    thumbAdd: {
      width: 80, height: 80, borderRadius: 10, margin: 4,
      borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
    },
    thumbAddIcon: { fontSize: 22, marginBottom: 2 },
    thumbAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
    attachHint: { fontSize: 11, color: '#94A3B8', marginBottom: 20 },

    field: {
      wrapper: { marginBottom: 20 },
      labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
      counterOver: { color: '#EF4444' },
      hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
      error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
    },

    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
      multiline: { height: 130, paddingTop: 14 },
    },
  });
})();

// AddAdminScreen
export const AddAdminScreenStyles = (() => {
  const NAVY = COLORS.navy;
  const GOLD = COLORS.gold;

  return createScreenStyles({
    // ── Screen — navy covers the entire screen, not just the header ──
    container: { flex: 1, backgroundColor: '#fff'},
    //content: { padding: 20,  },
content: { padding: 20,  paddingBottom: 40 },
    // ── Header — same navy as container, no separate background block ──
    header: {
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 20,
      paddingBottom: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    headerBackBtn: {
      position: 'absolute',
      top: (StatusBar.currentHeight || 0) + 14,
      left: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, textAlign: 'center' },

    // ── Card — floats on the navy background with visible padding/margin ──
    /*card: {
      width: '100%',
      backgroundColor: '#fff',
      //borderRadius: 16,
      padding: 18,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
*/
    // ── Inputs ──
    input: {
      marginBottom: 10,
      borderRadius: 10,
      backgroundColor: '#fff',
    },

    // ── Buttons ──
    button: { marginTop: 20, paddingVertical: 6, borderRadius: 10, backgroundColor: NAVY },
    linkButton: { marginTop: 10 },

    // ── Error / helper text ──
    error: { color: '#D9534F', fontSize: 12, marginBottom: 8, marginLeft: 5 },
    helper: { fontSize: 12, color: '#64748B', marginBottom: 8, marginLeft: 5 },

    // ── Section groups ──
    sectionBox: { marginTop: 4, marginBottom: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 8 },

    // ── Profile Photo ──
    photoLabel: { fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 8, marginTop: 4 },
    photoPickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F4FF',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#BBDEFB',
      borderStyle: 'dashed',
    },
    photoPreview: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ddd' },
    photoPlaceholder: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: '#BBDEFB',
      justifyContent: 'center', alignItems: 'center',
    },
    photoPlaceholderIcon: { fontSize: 28 },
    photoPickerText: { marginLeft: 14, flex: 1 },
    photoPickerTitle: { fontSize: 14, fontWeight: '600', color: NAVY },
    photoPickerHint: { fontSize: 12, color: '#888', marginTop: 2 },

    // ── Picker modals ──
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    pickerTitle: { fontSize: 17, fontWeight: '700', color: NAVY, marginBottom: 12 },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    pickerItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    pickerItemActive: { backgroundColor: '#EBF0FA', paddingHorizontal: 8, borderRadius: 8 },
    pickerItemText: { fontSize: 15, color: '#111' },
    pickerItemTextActive: { color: NAVY, fontWeight: '700' },
    checkMark: { fontSize: 16, color: 'transparent', width: 20, textAlign: 'right' },
    checkMarkActive: { color: '#1976D2', fontWeight: '700' },
    pickerEmpty: { textAlign: 'center', color: '#888', paddingVertical: 24 },
    pickerCancel: {
      marginTop: 12,
      backgroundColor: '#F0F2F5',
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    pickerCancelText: { fontSize: 15, color: NAVY, fontWeight: '600' },
    pickerDone: {
      marginTop: 12,
      backgroundColor: NAVY,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    pickerDoneText: { fontSize: 15, color: '#fff', fontWeight: '700' },
    // ── Field wrapper styles (own copy — not shared with Support screen) ──
field: {
  wrapper: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
  req: { color: '#EF4444' },
  counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  counterOver: { color: '#EF4444' },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
},

// ── Styled TextInput styles (own copy — not shared with Support screen) ──
styledInput: {
  base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
  focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
  errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  multiline: { height: 130, paddingTop: 14 },
},
navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      paddingTop: (StatusBar.currentHeight ?? 0) + 12,
      backgroundColor: '#252943',
    },
    navSide: { minWidth: 72, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    navSave: { fontSize: 15, color: '#A0C878', fontWeight: '700', textAlign: 'right' },
  });
})();

// AddCircularScreen
export const AddCircularScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    safe: { flex: 1, backgroundColor: NAVY },
    navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: NAVY },
    navSide: { minWidth: 64, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    cancelText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    saveText: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },
    scroll: { flex: 1, backgroundColor: '#FAFBFC' },
    scrollContent: { padding: 20, paddingBottom: 52 },
    label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 16 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0' },
    error: { color: 'red', fontSize: 12, marginTop: 4, marginBottom: 4, marginLeft: 5 },

    // ── Visibility Radio Buttons ──
    radioGroup: { gap: 10 },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      padding: 14,
      backgroundColor: '#F8FAFC',
    },
    radioOptionSelected: {
      borderColor: NAVY,
      backgroundColor: '#EFF6FF',
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#9CA3AF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioCircleSelected: {
      borderColor: NAVY,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: NAVY,
    },
    radioTextWrap: { flex: 1 },
    radioLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    radioLabelSelected: { color: NAVY },
    radioSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    radioSubSelected: { color: '#6B9CC7' },
    radioIcon: { fontSize: 20, marginLeft: 8 },

    attachGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80, alignItems: 'center', marginTop: 4 },
    thumb: { width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    thumbImg: { width: '100%', height: '100%' },
    thumbDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
    thumbIcon: { fontSize: 24 },
    thumbName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
    thumbRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
    thumbRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    thumbAdd: { width: 80, height: 80, borderRadius: 10, margin: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    thumbAddIcon: { fontSize: 22, marginBottom: 2 },
    thumbAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
    attachHint: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
    ...Common.lightbox,
  });
})();

// AdminDashboardScreen
export const AdminDashboardScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    scrollContent: { paddingBottom: 24 },

    // IME header
    appHeader: {
  backgroundColor: '#252943',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 14,
  paddingTop: 44,
  paddingBottom: 10,
},
headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginRight: 8,
},
headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
},
iconBtn: {
  padding: 8,
  marginLeft: 4,
  alignItems: 'center',
  justifyContent: 'center',
},
iconBtnText: {
  fontSize: 20,
  textAlign: 'center',
},
kebabIcon: {
  fontSize: 22,
  color: '#fff',
  fontWeight: '700',
  textAlign: 'center',
},
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#A0C878',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    logoText: { color: '#252943', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    appName: { color: '#fff', fontSize: 13, fontWeight: '700' },
    appTagline: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
    backBtn: { padding: 8 },
    backIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },

    // Welcome strip
    welcomeStrip: {
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
      elevation: 1,
    },
    welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#252943' },
    welcomeSub: { fontSize: 13, color: '#888', marginTop: 2 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 4, justifyContent: 'space-between' },
    card: { width: '48%', marginBottom: 14 },
    cardInner: { elevation: 2, backgroundColor: '#fff' },
    cardContent: { alignItems: 'center', paddingVertical: 20 },
    icon: { fontSize: 36, marginBottom: 8 },
    cardTitle: { fontSize: 13, textAlign: 'center', color: '#252943' },
    lawBotCard: {
      backgroundColor: '#ffffff',
      marginHorizontal: 11,
      marginBottom: 8,
      borderRadius: 10,
      padding: 12,
      borderWidth: 0.9,
      borderColor: '#5da1e6',
    },
    lawBotTitle: { fontSize: 14, fontWeight: '700', color: '#252943' },
    lawBotSubtitle: { fontSize: 12, color: '#33A4FA', marginTop: 3 },
menuContent: { backgroundColor: '#fff', borderRadius: 10, elevation: 8, minWidth: 200 },
    menuItemText: { fontSize: 14, color: '#222' },
    menuSep: { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 12, marginVertical: 4 },

    

  });
})();

// AnimatedSplashScreen
export const AnimatedSplashScreenStyles = (() => {
  const COLORS = {
    navy: '#123663',
    indigo: '#2F2F63',
    plum: '#4A2354',
    goldBright: '#FFF3D6',
    darkGold: '#C9A227',
  };


  return createScreenStyles({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {},
    sparkle: {
      position: 'absolute',
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: COLORS.goldBright,
    },
    title: {
      marginTop: 22,
      textAlign: 'center',
      fontWeight: '700',
      letterSpacing: 6,
      color: COLORS.darkGold,
    },
  });
})();
//ChangePasswordScreen
export const ChangePasswordScreenStyles = (() => {
  const NAVY = '#252943';
  const GOLD = '#A0C878';
  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F7F9FC' },

    navbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 12,
      paddingTop: (StatusBar.currentHeight ?? 0) + 12,
      backgroundColor: NAVY,
    },
    navSide: { minWidth: 72, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    navSave: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },

    body: { padding: 18, paddingBottom: 40 },

    // ── Card wrapping the whole form ──
    card: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 18,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
    },

    title: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
    subtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },

    // ── Requirements box — light blue ──
    requirements: {
      backgroundColor: '#E0E7EF',
      borderRadius: 12,
      padding: 16,
      marginTop: 4,
    },
    reqTitle: { fontSize: 12, fontWeight: '700', color: '#252943', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
    req: { fontSize: 13, color: '#334155', marginBottom: 4 },

    // ── Field wrapper — matches Achievement/JobPosting/Club ──
    field: {
      wrapper: { marginBottom: 20 },
      labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
      counterOver: { color: '#EF4444' },
      hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
      error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
    },

    // ── Styled TextInput — matches Achievement/JobPosting/Club ──
    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
      multiline: { height: 130, paddingTop: 14 },
    },
  });
})();

// ChatScreen
export const ChatScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F0F2F5' },

    // Header
    header: {
      backgroundColor: '#252943',
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 44,
      paddingBottom: 10,
      paddingHorizontal: 14,
    },
    backBtn: { padding: 6, marginRight: 6 },
    backIcon: { fontSize: 22, color: '#fff', fontWeight: '700' },
    headerAvatar: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: '#A0C878',
      justifyContent: 'center', alignItems: 'center',
      marginRight: 10,
    },
    headerAvatarLetter: { color: '#252943', fontSize: 16, fontWeight: '800' },
    headerInfo: { flex: 1 },
    headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Messages
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { padding: 12, paddingBottom: 8 },

    msgRow: { flexDirection: 'row', marginBottom: 6 },
    msgRowOwn: { justifyContent: 'flex-end' },
    msgRowOther: { justifyContent: 'flex-start' },

    bubble: {
      maxWidth: '75%',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
    },
    bubbleOwn: { backgroundColor: '#252943', borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },

    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextOwn: { color: '#fff' },
    bubbleTextOther: { color: '#1a1a1a' },

    timeText: { fontSize: 10, marginTop: 3 },
    timeOwn: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
    timeOther: { color: '#aaa', textAlign: 'left' },

    // Empty
    emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 15, color: '#aaa' },

    // Input bar
    inputBar: {
  flexDirection: 'row', alignItems: 'flex-end',
  backgroundColor: '#fff', // or whatever you currently have
  borderTopWidth: 1, borderTopColor: '#E8E8E8',
  paddingHorizontal: 12, paddingVertical: 8,
 paddingBottom: Platform.OS === 'android' ? 20 : 18,   // ← added
},
    textInput: {
      flex: 1,
      backgroundColor: '#F5F5F5',
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: '#1a1a1a',
      maxHeight: 120,
      marginRight: 8,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: '#252943',
      justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#B0BEC5' },
    sendIcon: { color: '#fff', fontSize: 18, marginLeft: 2 },
  });
})();

// ChatsListScreen
export const ChatsListScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#fff' },

    header: {
      backgroundColor: '#252943',
      paddingTop: 44,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#fff',
    },
    avatar: {
      width: 50, height: 50, borderRadius: 25,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 13,
    },
    avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '700' },

    info: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
    time: { fontSize: 12, color: '#aaa' },
    preview: { fontSize: 13, color: '#888' },

    separator: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 79 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 52, marginBottom: 14 },
    emptyText: { fontSize: 17, fontWeight: '700', color: '#555', marginBottom: 6 },
    emptySub: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
   // ── FAB ──
 // ── FAB ──
  fab: Common.fab(),
    fabText: Common.fabText,
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '700', lineHeight: 30 },
 
  // ── Member picker modal ──
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#252943' },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0F2F5',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseText: { fontSize: 14, color: '#334155', fontWeight: '700' },
 
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  searchClear: { fontSize: 13, color: '#94A3B8', paddingHorizontal: 6 },
 
  // ── Inline search box on the main Chats list (above the FlatList) ──
  chatSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
 
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarLetter: { color: '#fff', fontSize: 16, fontWeight: '700' },
  memberName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  memberEmail: { fontSize: 12, color: '#888', marginTop: 1 },
  });
})();

// CircularDetailScreen
export const CircularDetailScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F5F7FA' },

    header: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    headerBtn: { padding: 6, borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

    body: { padding: 20, paddingBottom: 40 },

    chipWrap: { marginBottom: 14 },
    chip: {
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
      backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    chipText: { color: NAVY, fontSize: 12, fontWeight: '700', marginLeft: 5, letterSpacing: 0.3 },

    title: { fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 30, marginBottom: 14 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    metaText: { color: '#64748B', fontSize: 13, fontWeight: '500', marginLeft: 6 },
    goldDivider: { height: 3, width: 48, backgroundColor: GOLD, borderRadius: 2, marginBottom: 20 },
    description: { fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 24 },
    noDesc: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },

    attachSection: { width: '100%', marginTop: 8 },
    attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    noAttach: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
    attachImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#fff' },
    attachHint: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 10 },
    downloadText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8, flex: 1 },

    ...Common.lightboxSimple(),
  });
})();

// CircularScreen
export const CircularScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    list: { padding: 12 },

    card: {
      backgroundColor: '#fff', borderRadius: 12, padding: 14,
      marginBottom: 12, elevation: 2,
      shadowColor: '#000', shadowOpacity: 0.06,
      shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    },

    /* header row */
    cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 8,
    },

    /* ✅ left group — shrinks to content */
    leftBadges: {
      flexDirection: 'row', alignItems: 'center',
      gap: 6, flexShrink: 1,
    },

    /* circular-number chip */
    chip: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    chipText: { fontSize: 11, fontWeight: '700', color: '#3B82F6', letterSpacing: 0.3 },

    /* ✅ visibility badge — alignSelf keeps it compact */
    visBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8, },
    visBadgeAll: { backgroundColor: '#DBEAFE' },
    visBadgeClub: { backgroundColor: '#FEF3C7' },
    visText: { fontSize: 10, fontWeight: '700', color: '#475569' },

    /* admin action icons */
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconBtn: { padding: 4 },

    /* card body */
    title: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
    description: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 8 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    date: { fontSize: 12, color: '#94A3B8' },
    viewHint: { fontSize: 11, color: '#3B82F6', fontWeight: '600' },

    /* empty state */
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#999' },

    /* FAB */
    fab: Common.fab(),
    fabText: Common.fabText,
  });
})();

// ClubFormScreen
export const ClubFormScreenStyles = (() => {
  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F7F9FC' },   // was '#F0F2F5' — match Achievement's bg
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { backgroundColor: '#252943', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 14 },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    headerBtn: { padding: 4, minWidth: 48 },
    saveText: { color: '#A0C878', fontSize: 16, fontWeight: '700', textAlign: 'right' },

    scroll: { padding: 18, paddingBottom: 40 },   // was { paddingBottom: 40 } — match Achievement's body

    // ── Logo / "Attachment" upload — restyled like Achievement's attachGrid/gridAddBtn ──
    logoSection: { alignItems: 'center', marginBottom: 20 },
    logoBox: {
      width: 110, height: 110, borderRadius: 55, overflow: 'hidden',
      backgroundColor: '#F8FAFC',                 // was '#F0F2F5'
      borderWidth: 1.5,                            // was 2
      borderColor: '#CBD5E1',                      // was '#E0E0E0'
      borderStyle: 'dashed',
    },
    logoImage: { width: '100%', height: '100%' },
    logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoPlaceholderText: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },  // matches gridAddText
    changeLogoBtn: { marginTop: 10 },
    changeLogoText: { fontSize: 13, color: '#252943', fontWeight: '600' },

    sectionHeader: { marginTop: 8, marginBottom: 4 },   // was boxed banner — now plain like Achievement's attachLabel
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#64748B',                 // was '#252943' — match Achievement's label color
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    // ── Field wrapper — matches Achievement/JobPosting's field.wrapper/label ──
    field: { marginBottom: 20 },              // was { paddingHorizontal: 16, paddingTop: 12 }
    fieldFlex: { flex: 1 },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#64748B',
      marginBottom: 7,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    // ── Styled TextInput — matches Achievement/JobPosting's styledInput ──
    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
      multiline: { height: 130, paddingTop: 14 },
    },

    // legacy input/textarea kept for anything not yet migrated
    input: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', fontWeight: '500' },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5', borderWidth: 1.5 },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    codeInput: { flex: 1 },
    regenBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
    textarea: { minHeight: 80 },

    selector: {
      backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    selectorDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
    selectorError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5', borderWidth: 1.5 },
    selectorValue: { fontSize: 15, color: '#1E293B', flex: 1, fontWeight: '500' },
    selectorPlaceholder: { fontSize: 15, color: '#CBD5E1', flex: 1, fontWeight: '500' },

    error: { fontSize: 11, color: '#EF4444', marginTop: 5, marginBottom: 8, marginLeft: 2, fontWeight: '500' },

    row: { flexDirection: 'row', gap: 12 },

    // Admin chips
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    adminChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E7EF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    adminChipText: { fontSize: 13, color: '#252943', fontWeight: '600' },

    // Admin radio toggle
    radioRow: { flexDirection: 'row', gap: 20, marginTop: 4, marginBottom: 4 },
    radioOption: { flexDirection: 'row', alignItems: 'center' },
    radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#bbb', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    radioOuterActive: { borderColor: '#252943' },
    radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#252943' },
    radioLabel: { fontSize: 13, color: '#333' },
    addAdminButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, backgroundColor: '#E0E7EF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10 },
    addAdminButtonText: { fontSize: 13, color: '#252943', fontWeight: '700' },
    embeddedAdminBox: { marginTop: 8, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#fff', padding: 4 },

    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    switchLabel: { fontSize: 15, color: '#1E293B', fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#252943', marginBottom: 4 },
    modalSubtitle: { fontSize: 12, color: '#888', marginBottom: 10 },
    modalSearch: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 10, fontSize: 14, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0' },

    modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' },
    modalItemSelected: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
    modalItemText: { fontSize: 15, color: '#111' },
    modalItemTextSelected: { color: '#1D4ED8', fontWeight: '600' },
    modalItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
    modalEmpty: { textAlign: 'center', color: '#888', paddingVertical: 24 },

    modalDone: { marginTop: 14, backgroundColor: '#252943', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    modalDoneText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    modalCancel: { marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
    modalCancelText: { fontSize: 15, color: '#252943', fontWeight: '600' },
    // ── Club Logo — restyled like AddAdminScreen's photoPickerRow ──
logoLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
logoPickerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F8FAFC',
  borderRadius: 12,
  padding: 12,
  marginBottom: 20,
  borderWidth: 1.5,
  borderColor: '#CBD5E1',
  borderStyle: 'dashed',
},
logoPreview: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0' },
logoPlaceholderCircle: {
  width: 60, height: 60, borderRadius: 30,
  backgroundColor: '#E0E7EF',
  justifyContent: 'center', alignItems: 'center',
},
logoPlaceholderIcon: { fontSize: 26 },
logoPickerText: { marginLeft: 14, flex: 1 },
logoPickerTitle: { fontSize: 14, fontWeight: '600', color: '#252943' },
logoPickerHint: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
changeLogoBtn: { marginTop: 0 },
changeLogoText: { fontSize: 13, color: '#252943', fontWeight: '600' },
navSide: { minWidth: 64, paddingHorizontal: 4 },
navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff' },
navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
//navSave: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },
  });
})();

// ClubListScreen
export const ClubListScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    searchbar: { margin: 12, marginBottom: 6, elevation: 2, borderRadius: 10 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
    chip: { backgroundColor: '#E0E7EF' },
    chipSelected: { backgroundColor: '#252943' },
    chipText: { fontSize: 12, color: '#252943' },
    chipTextSelected: { color: '#fff' },

    list: { paddingHorizontal: 12, paddingBottom: 100 },

    card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 14, elevation: 2 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },

    logoImg: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#F0F2F5' },
    avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#252943', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },

    cardInfo: { flex: 1 },
    clubName: { fontSize: 15, fontWeight: '700', color: '#252943', marginBottom: 2 },
    clubCode: { fontSize: 12, color: '#888', marginBottom: 2 },
    clubMeta: { fontSize: 12, color: '#555', marginBottom: 1 },

   cardHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},
badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    badgeActive: { backgroundColor: '#E8F5E9' },
    badgeInactive: { backgroundColor: '#FFEBEE' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    badgeTextActive: { color: '#2E7D32' },
    badgeTextInactive: { color: '#C62828' },
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 2,
    },
    editBtn: { flex: 1, backgroundColor: '#EBF0FA', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    editBtnText: { color: '#252943', fontWeight: '600', fontSize: 13 },
    deleteBtn: { flex: 1, backgroundColor: '#FFEBEE', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    deleteBtnText: { color: '#C62828', fontWeight: '600', fontSize: 13 },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15, color: '#888' },

    fab: Common.fab(),
    fabText: Common.fabText,
  });
})();

// ContentViewerScreen
export const ContentViewerScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#252943', marginBottom: 6 },
    emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
    header: { backgroundColor: '#252943', padding: 24, paddingTop: 32 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    body: { padding: 20 },
  });
})();

// CorpDetailsScreen
export const CorpDetailsScreenStyles = (() => {
  const BG = COLORS.bg;

  const NAVY = COLORS.navy;

  const GREEN = '#2D9B6F';

  const GOLD = COLORS.gold;

  const CRIMSON = COLORS.crimson;


  return createScreenStyles({
    root: { flex: 1, backgroundColor: BG },

    header: {
      backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center',
      paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 48,
      paddingBottom: 14, paddingHorizontal: 16,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
    mapBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },

    strip: {
      backgroundColor: NAVY, flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: 16, paddingBottom: 12, gap: 12,
    },
    stripItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stripText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', maxWidth: 180 },

    tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tabBarInner: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
    pill: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F0F4F8',
    },
    pillActive: { backgroundColor: NAVY },
    pillText: { fontSize: 12, fontWeight: '600', color: NAVY, marginLeft: 4 },
    pillTextActive: { color: '#fff' },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN, marginLeft: 5 },

    content: { padding: 12, paddingBottom: 40 },

    srcBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: `${GREEN}12`, borderRadius: 8,
      paddingVertical: 5, paddingHorizontal: 10, marginBottom: 10,
    },
    srcText: { fontSize: 11, color: GREEN, fontWeight: '500', flex: 1 },

    card: {
      backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
      elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4,
    },

    secRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    secIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    secTitle: { fontSize: 14, fontWeight: '700', color: NAVY },

    field: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    fieldLabel: { fontSize: 12, color: '#6B7A8D', width: 90, fontWeight: '600' },
    fieldValue: { fontSize: 13, color: '#2D3748', fontWeight: '500', flex: 1 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    chip: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
    chipText: { fontSize: 11, fontWeight: '600' },

    bullet: { flexDirection: 'row', marginBottom: 7 },
    bulletDot: { color: GOLD, fontWeight: '700', marginRight: 7, fontSize: 14 },
    bulletText: { fontSize: 13, color: '#4A5568', flex: 1, lineHeight: 19 },

    overview: { fontSize: 13, color: '#4A5568', lineHeight: 20 },

    masterLoadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4 },
    masterLoadText: { fontSize: 11, color: '#8090A0', fontStyle: 'italic' },

    websiteRow: {
      flexDirection: 'row', alignItems: 'center',
      padding: 10, backgroundColor: `${GREEN}10`,
      borderRadius: 10, borderWidth: 1, borderColor: `${GREEN}30`,
    },
    websiteLink: {
      fontSize: 12, color: NAVY, flex: 1, lineHeight: 17,
      textDecorationLine: 'underline', fontWeight: '500', marginRight: 6,
    },

    loadTitle: { color: '#2D3748', marginTop: 14, fontSize: 15, fontWeight: '600' },
    loadSub: { color: '#6B7A8D', marginTop: 4, fontSize: 12, textAlign: 'center' },

    errBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
    errTitle: { fontSize: 15, fontWeight: '700', color: CRIMSON, marginTop: 10 },
    errMsg: { marginTop: 10, padding: 12, backgroundColor: '#FFF0F0', borderRadius: 8, width: '100%' },
    errMsgText: { fontSize: 12, color: CRIMSON, lineHeight: 18 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: NAVY, borderRadius: 24 },
    retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  });
})();

// CreateFundScreen
export const CreateFundScreenS = (() => {
  const C = {
    bg: "#F7F8FC",
    card: "#FFFFFF",
    navy: "#1A2E4A",
    teal: "#0D8A6E",
    tealLight: "#E6F5F1",
    amber: "#F59E0B",
    red: "#E53E3E",
    border: "#E2E8F0",
    muted: "#94A3B8",
    text: "#1E293B",
    sub: "#64748B",
  };


  return createScreenStyles({
    root: { flex: 1, backgroundColor: C.bg },

    // Top bar
    topBar: {
      backgroundColor: C.navy,
      paddingTop: Platform.OS === "ios" ? 56 : 36,
      paddingBottom: 20,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    navbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 12,
      paddingTop: (StatusBar.currentHeight ?? 0) + 12,
      borderBottomWidth: 0,
      backgroundColor: '#252943',
    },
    navSide: { minWidth: 72, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    navSave: { fontSize: 15, color: '#A0C878', fontWeight: '700', textAlign: 'right' },

    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center", justifyContent: "center",
    },
    backArrow: { color: "#fff", fontSize: 20 },
    topTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
    topSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
    urgencyPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    urgencyPillText: { fontSize: 11, fontWeight: "700" },

    // Card
    card: {
      backgroundColor: C.card,
      marginHorizontal: 14,
      marginTop: 14,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    // Section header
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
    sectionIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: C.tealLight,
      alignItems: "center", justifyContent: "center",
    },
    sectionIcon: { fontSize: 18 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: C.navy },
    sectionSub: { fontSize: 11, color: C.muted, marginTop: 1 },

    // Field
    field: { marginBottom: 12 },
    fieldLabel: {
      fontSize: 12, fontWeight: "600", color: C.sub,
      marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4,
    },
    error: { color: 'red', fontSize: 12, marginTop: 4, marginLeft: 5 },

    // Input
    input: {
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      fontSize: 15,
      color: C.text,
      backgroundColor: "#FAFBFD",
    },
    multiline: { height: 70, textAlignVertical: "top", paddingTop: 10 },
    multilineTall: { height: 90, textAlignVertical: "top", paddingTop: 10 },

    // Row
    row: { flexDirection: "row" },

    // Read-only
    readOnly: {
      flexDirection: "row", alignItems: "center",
      borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      backgroundColor: "#F0F4FA",
    },
    readOnlyText: { flex: 1, fontSize: 15, color: "#444", fontWeight: "600" },
    autoBadge: {
      fontSize: 10, color: C.teal, fontWeight: "700",
      backgroundColor: C.tealLight,
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
    },

    // Date
    datePill: {
      flexDirection: "row", alignItems: "center",
      borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
      padding: 11, backgroundColor: "#FAFBFD",
    },
    datePillIcon: { fontSize: 15, marginRight: 7 },
    datePillText: { fontSize: 14, color: C.text },

    // Upload zone
    addZone: {
      borderWidth: 1.5, borderColor: C.teal, borderStyle: "dashed",
      borderRadius: 12, padding: 18, alignItems: "center",
      backgroundColor: C.tealLight, marginBottom: 4,
    },
    addZoneIcon: { fontSize: 28, color: C.teal },
    addZoneText: { fontSize: 14, fontWeight: "600", color: C.teal, marginTop: 4 },
    addZoneSub: { fontSize: 11, color: C.muted, marginTop: 2 },

    // Group label
    groupLabel: {
      fontSize: 11, fontWeight: "700", color: C.muted,
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
    },

    // Thumbnails
    thumbWrap: { marginRight: 10, position: "relative", marginBottom: 4 },
    thumb: {
      width: 90, height: 90, borderRadius: 10, backgroundColor: C.border,
    },
    thumbRemove: {
      position: "absolute", top: 4, right: 4,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: C.red, alignItems: "center", justifyContent: "center",
    },
    thumbRemoveText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    serverBadge: {
      position: "absolute", bottom: 4, left: 4,
      backgroundColor: C.teal, borderRadius: 6,
      paddingHorizontal: 5, paddingVertical: 2,
    },
    serverBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

    // Doc rows
    docRow: {
      flexDirection: "row", alignItems: "center",
      borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
      padding: 12, marginTop: 8, backgroundColor: "#FAFBFD",
    },
    docIconWrap: {
      width: 36, height: 36, borderRadius: 8,
      backgroundColor: C.tealLight,
      alignItems: "center", justifyContent: "center", marginRight: 10,
    },
    docName: { fontSize: 13, fontWeight: "600", color: C.text },
    docSub: { fontSize: 11, color: C.muted, marginTop: 2 },

    // Empty
    emptyHint: {
      textAlign: "center", color: C.muted, fontSize: 13, paddingVertical: 12,
    },

    // Dropdown
    dropTrigger: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      backgroundColor: "#FAFBFD",
    },
    dropValue: { fontSize: 15, color: C.text },
    dropPlaceholder: { fontSize: 15, color: C.muted },
    dropArrow: { fontSize: 12, color: C.muted },
    backdrop: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      backgroundColor: "#fff",
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, maxHeight: "65%",
    },
    sheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: C.border, alignSelf: "center", marginBottom: 14,
    },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: C.navy, marginBottom: 12 },
    searchBox: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: "#F4F6FA", borderRadius: 10,
      paddingHorizontal: 12, marginBottom: 10, gap: 8,
    },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.text },
    sheetItem: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 13, borderBottomWidth: 1, borderColor: "#F0F2F7",
    },
    sheetItemActive: {
      backgroundColor: C.tealLight, borderRadius: 8, paddingHorizontal: 8,
    },
    sheetItemText: { fontSize: 15, color: "#333" },
    sheetItemTextActive: { color: C.teal, fontWeight: "600" },

    // Submit
    submitWrap: { marginHorizontal: 14, marginTop: 14 },
    uploadSummary: {
      backgroundColor: C.amber + "22", borderRadius: 10,
      padding: 10, marginBottom: 10, alignItems: "center",
    },
    uploadSummaryText: { color: C.amber, fontSize: 12, fontWeight: "600" },
    submitBtn: {
      backgroundColor: C.navy, borderRadius: 14, padding: 17, alignItems: "center",
      shadowColor: C.navy, shadowOpacity: 0.35, shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  });
})();

// CreatePostScreen
export const CreatePostScreenStyles = (() => {
  const BLUE = COLORS.navy;

  const LIGHT = '#EAF1FA';


  const BLUE2 = '#33A4FA';

  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#fff' },
    scroll: { flex: 1 },

    // Header
    header: {
      backgroundColor: BLUE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 44,
      paddingBottom: 12,
    },
    cancelBtn: { paddingVertical: 6, paddingHorizontal: 4, minWidth: 60 },
    cancelText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    postBtn: {
      backgroundColor: '#A0C878',
      paddingHorizontal: 20,
      paddingVertical: 7,
      borderRadius: 20,
      minWidth: 60,
      alignItems: 'center',
    },
    postBtnDisabled: { backgroundColor: 'rgba(212,160,23,0.45)' },
    postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Text input
    textInput: {
      minHeight: 120,
      fontSize: 16,
      color: '#222',
      lineHeight: 24,
      paddingHorizontal: 16,
      paddingTop: 16,
      textAlignVertical: 'top',
    },

    // Media grid
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      paddingTop: 8,
      gap: 6,
    },
    mediaTile: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#eee',
    },
    mediaTileImg: { width: '100%', height: '100%' },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoIcon: { color: '#fff', fontSize: 28 },
    removeBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    // Add media
    addMediaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 14,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: BLUE,
      borderStyle: 'dashed',
    },
    addMediaIcon: { fontSize: 20, marginRight: 10 },
    addMediaText: { fontSize: 14, color: BLUE, fontWeight: '600' },

    // Divider
    divider: {
      height: 1,
      backgroundColor: '#eef0f4',
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 20,
    },

    // Visibility section
    visibilitySection: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    visibilityLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#8a96a8',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 12,
    },

    // Radio buttons
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#e4e8ee',
      marginBottom: 10,
      backgroundColor: '#fafbfc',
    },
    radioOptionSelected: {
      borderColor: BLUE,
      backgroundColor: LIGHT,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#b0bfcf',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    radioCircleSelected: { borderColor: BLUE },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: BLUE,
    },
    radioTextWrap: { flex: 1 },
    radioLabel: { fontSize: 15, fontWeight: '600', color: '#2a3545' },
    radioLabelSelected: { color: BLUE },
    radioSub: { fontSize: 12, color: '#8a96a8', marginTop: 2 },
    radioSubSelected: { color: BLUE2 },
    radioIcon: { fontSize: 20, marginLeft: 8 },

    // Private hint banner
    privateHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#FFF8E1',
      borderRadius: 8,
      padding: 12,
      marginTop: 4,
      borderLeftWidth: 3,
      borderLeftColor: '#F59E0B',
    },
    privateHintIcon: { fontSize: 14, marginRight: 8, marginTop: 1 },
    privateHintText: { flex: 1, fontSize: 13, color: '#78620A', lineHeight: 18 },

    // Hint
    hintRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    hintText: { fontSize: 11, color: '#bbb', lineHeight: 16 },
  });
})();

// DemoScreen
// DemoScreen
export const DemoScreenStyles = (() => {
  const WHITE = COLORS.white;
  const NAVY = COLORS.navy;
  const GREEN = COLORS.green;

  const { width: W, height: H } = Dimensions.get('window');

  return createScreenStyles({
    root: { flex: 1, backgroundColor: WHITE },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: (StatusBar.currentHeight || 0) + 8,
      paddingBottom: 8,
      paddingHorizontal: 12,
      backgroundColor: WHITE,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderSoft,
    },
    closeBtn: { padding: 4 },
    playBtn: { padding: 4 },
    topTitle: {
      flex: 1, textAlign: 'center',
      color: NAVY, fontSize: 15, fontWeight: '700',
    },

    stripsRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: WHITE,
    },
    stripWrap: { flex: 1, paddingHorizontal: 2 },
    stripBg: {
      height: 3, borderRadius: 2,
      backgroundColor: COLORS.border,
      overflow: 'hidden',
    },
    stripFill: { height: '100%', borderRadius: 2, backgroundColor: GREEN },

    contentArea: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 14,
      paddingHorizontal: 12,
      backgroundColor: WHITE,
    },

    phoneMockupWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    phoneFrame: {
      width: W * 0.72,
      height: H * 0.52,
      backgroundColor: '#1A1A2E',
      borderRadius: 34,
      padding: 12,
      alignItems: 'center',
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      borderWidth: 2.5,
      borderColor: '#2A2A3E',
    },
    phoneSpeaker: {
      width: 44, height: 5, borderRadius: 3,
      backgroundColor: '#2A2A3E', marginBottom: 10,
    },
    phoneScreen: {
      flex: 1, width: '100%',
      backgroundColor: NAVY,
      borderRadius: 18,
      overflow: 'hidden',
    },
    phoneHome: {
      width: 32, height: 5, borderRadius: 3,
      backgroundColor: '#2A2A3E', marginTop: 10,
    },

    bottomStrip: {
      width: '100%',
      backgroundColor: NAVY,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 10,
    },

    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepBadge: {
      borderRadius: 10,
      paddingVertical: 2,
      paddingHorizontal: 10,
      marginRight: 8,
      backgroundColor: 'rgba(160, 200, 120, 0.18)',
    },
    stepText: { fontSize: 11, fontWeight: '700', color: GREEN },

    infoSubtitle: {
      fontSize: 11, fontWeight: '700',
      color: 'rgba(255,255,255,0.55)',
      letterSpacing: 1,
      textTransform: 'uppercase',
      flex: 1,
    },
    infoTitle: {
      fontSize: 15, fontWeight: '800',
      color: WHITE, marginBottom: 3,
      lineHeight: 20,
    },
    infoDesc: {
      fontSize: 12, color: 'rgba(255,255,255,0.7)',
      lineHeight: 17,
    },

    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 10,
      marginBottom: 8,
    },
    dot: {
      width: 6, height: 6, borderRadius: 3,
      marginHorizontal: 3,
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    dotActive: { width: 18, borderRadius: 3, backgroundColor: GREEN },

    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(160, 200, 120, 0.4)',
      minWidth: 76,
      justifyContent: 'center',
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnNext: {
      backgroundColor: GREEN,
      borderColor: GREEN,
    },
    navBtnText: { fontSize: 13, fontWeight: '700', color: WHITE, marginHorizontal: 2 },
  });
})();

// FeedScreen
// FeedScreen
const _FeedScreenStyleBundle = (() => {
  const { width } = Dimensions.get("window");
  const GREEN = COLORS.accent;

  return {
    FeedScreenS: createScreenStyles({
      safe: { flex: 1, backgroundColor: "#f5f4f0" },
      feed: { flex: 1 },
      center: { flex: 1, justifyContent: "center", alignItems: "center" },
      hint: { color: "#888", marginTop: 12, fontSize: 14 },
      retryBtn: {
        marginTop: 16, backgroundColor: GREEN,
        borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10,
      },
      retryText: { color: "#fff", fontWeight: "600" },
    }),
    FeedScreenAv: createScreenStyles({
      circle: { backgroundColor: "#c084fc", alignItems: "center", justifyContent: "center" },
      text: { color: "#fff", fontSize: 15, fontWeight: "600" },
      dot: {
        position: "absolute", bottom: 0, right: 0,
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#fff",
      },
    }),
    FeedScreenPb: createScreenStyles({
      wrap: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
      meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
      label: { fontSize: 12, color: "#888" },
      pct: { fontSize: 12, fontWeight: "600", color: "#22c55e" },
      track: {
        height: 6, backgroundColor: "#f0ede8",
        borderRadius: 99, overflow: "hidden", marginBottom: 5,
      },
      fill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 99 },
      amount: { fontSize: 13, fontWeight: "700", color: "#111" },
    }),
    FeedScreenMs: createScreenStyles({
      container: { marginBottom: 2 },
      tile: { overflow: "hidden" },

      // Image tile
      img: { width: "100%", height: 260, backgroundColor: "#e8e5e0" },
      expandHint: {
        position: "absolute", bottom: 10, right: 12,
        backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 6, padding: 5,
      },
      counterBadge: {
        position: "absolute", top: 10, right: 12,
        backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12,
        paddingHorizontal: 9, paddingVertical: 3,
      },
      counterText: { color: "#fff", fontSize: 11, fontWeight: "600" },

      // Document tile
      docTile: {
        height: 260, backgroundColor: "#1a1a2e",
        alignItems: "center", justifyContent: "center",
        paddingHorizontal: 28, gap: 10,
      },
      docIconCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: GREEN,
        alignItems: "center", justifyContent: "center", marginBottom: 4,
      },
      docLabel: {
        color: "rgba(255,255,255,0.6)", fontSize: 12,
        fontWeight: "500", textTransform: "uppercase", letterSpacing: 1,
      },
      docFileName: {
        color: "#fff", fontSize: 15, fontWeight: "700",
        textAlign: "center", lineHeight: 21,
      },
      docDownloadBtn: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: GREEN,
        borderRadius: 22, paddingHorizontal: 22, paddingVertical: 11, marginTop: 6,
      },
      docDownloadText: { color: "#fff", fontSize: 14, fontWeight: "700" },

      // Pagination dots
      dotsRow: {
        flexDirection: "row", justifyContent: "center",
        alignItems: "center", gap: 5, paddingVertical: 9,
      },
      dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ddd" },
      dotActive: { backgroundColor: GREEN, width: 18, borderRadius: 3 },
    }),
    FeedScreenCard: createScreenStyles({
      root: {
        backgroundColor: "#fff", marginHorizontal: 14, marginTop: 12,
        borderRadius: 20, overflow: "hidden",
        borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)",
      },
      header: { flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 10, gap: 10 },
      headerInfo: { flex: 1 },
      name: { fontSize: 15, fontWeight: "600", color: "#111" },
      meta: { fontSize: 11, color: "#888", marginTop: 2 },
      badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
      badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },

      body: { paddingHorizontal: 16, paddingBottom: 12 },
      title: { fontSize: 17, fontWeight: "700", color: "#111", lineHeight: 24, marginBottom: 6 },
      desc: { fontSize: 14, color: "#555", lineHeight: 22 },

      mediaLoader: {
        height: 80, alignItems: "center", justifyContent: "center",
        flexDirection: "row", gap: 10, backgroundColor: "#fafaf9",
      },
      mediaLoaderText: { fontSize: 13, color: "#aaa" },

      endRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingBottom: 10 },
      endText: { fontSize: 11, color: "#aaa" },

      footer: {
        flexDirection: "row", alignItems: "center", gap: 8,
        borderTopWidth: 0.5, borderTopColor: "#f0ede8",
        paddingHorizontal: 16, paddingVertical: 10,
      },
      reaction: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 },
      reactionCount: { fontSize: 12, color: "#888" },
      fundBtn: {
        marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6,
        borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9,
      },
      fundBtnText: { fontSize: 13, fontWeight: "600", color: "#fff", letterSpacing: 0.3 },
    }),
    FeedScreenVw: createScreenStyles({
      root: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
      imgWrap: { width, height: "100%", justifyContent: "center", alignItems: "center" },
      img: { width, height: "100%" },
      close: { position: "absolute", top: 52, right: 18 },
      closeCircle: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center", justifyContent: "center",
      },
    }),
  };
})();
export const FeedScreenS = _FeedScreenStyleBundle.FeedScreenS;
export const FeedScreenAv = _FeedScreenStyleBundle.FeedScreenAv;
export const FeedScreenPb = _FeedScreenStyleBundle.FeedScreenPb;
export const FeedScreenMs = _FeedScreenStyleBundle.FeedScreenMs;
export const FeedScreenCard = _FeedScreenStyleBundle.FeedScreenCard;
export const FeedScreenVw = _FeedScreenStyleBundle.FeedScreenVw;

// FeesDetails
export const FeesDetailsStyles = (() => {
  const LIGHT = COLORS.bg;

  const NAVY = COLORS.navy;

  const WHITE = COLORS.white;

  const GREY = COLORS.grey;


  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: LIGHT },
    header: {
      backgroundColor: NAVY, paddingTop: 48, paddingBottom: 18, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center',
    },
    backBtn: { marginRight: 14, padding: 4 },
    headerTitle: { color: WHITE, fontSize: 19, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 16 },
    table: {
      backgroundColor: WHITE, borderRadius: 12, overflow: 'hidden',
      elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4,
    },
    row: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
    tableHead: { backgroundColor: NAVY },
    rowAlt: { backgroundColor: '#F7F9FB' },
    headText: { color: WHITE, fontWeight: '700', fontSize: 12 },
    cellCategory: { flex: 2, fontSize: 13, color: '#333', fontWeight: '600' },
    cellAmount: { flex: 1, fontSize: 13, color: NAVY, fontWeight: '700', textAlign: 'right' },
    note: { fontSize: 12, color: GREY, marginTop: 12, fontStyle: 'italic', lineHeight: 18 },
    paymentCard: {
      backgroundColor: WHITE, borderRadius: 12, padding: 16, marginTop: 18,
      borderLeftWidth: 4, borderLeftColor: GOLD,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    paymentTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
    cardBody: { fontSize: 13, lineHeight: 19, color: '#444' },
  });
})();

export const ForgotPasswordScreenStyles = (() => {
  const NAVY = '#252943';
  const GOLD = '#A0C878';
  return createScreenStyles({
    container: {
      flex: 1,
      backgroundColor: '#F7F9FC',
      justifyContent: 'center',
      padding: 20,
    },

    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
    },

    header: {
      alignItems: 'center',
      marginBottom: 24,
    },

    title: {
      fontSize: 22,
      fontWeight: '700',
      color: NAVY,
      marginBottom: 6,
    },

    subtitle: {
      fontSize: 13,
      color: '#64748B',
      textAlign: 'center',
    },

    form: { width: '100%' },

    button: {
      marginTop: 6,
      backgroundColor: NAVY,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: { color: GOLD, fontSize: 15, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },

    linkButton: { marginTop: 18, alignItems: 'center' },
    linkButtonText: { color: NAVY, fontSize: 14, fontWeight: '600' },

    // ── Field wrapper — matches Achievement/JobPosting/Club ──
    field: {
      wrapper: { marginBottom: 16 },
      labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
      error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
    },

    // ── Styled TextInput — matches Achievement/JobPosting/Club ──
    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
    },
  });
})();

// FundScreen
export const FundScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F4F6F9' },
    content: { padding: 16, paddingBottom: 32 },

    heroBanner: {
      backgroundColor: '#252943',
      borderRadius: 16,
      padding: 28,
      alignItems: 'center',
      marginBottom: 16,
    },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: '#A0C878', marginBottom: 4 },
    heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 14,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    comingSoonCard: { opacity: 0.65 },
    comingSoonBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#A0C878',
      color: '#252943',
      fontSize: 11,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
      marginBottom: 8,
      overflow: 'hidden',
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#252943', marginBottom: 6 },
    cardDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },

    btn: {
      backgroundColor: '#252943',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#252943' },
    btnOutlineText: { color: '#252943', fontWeight: '700', fontSize: 14 },
  });
})();

// FundraiseListScreen
const _FundraiseListScreenStyleBundle = (() => {
  const BG = '#F0F4FA';

  const PRIMARY = COLORS.navy;

  const CARD_BG = COLORS.white;

  const SUCCESS = COLORS.success;

  const ACCENT = '#2E86DE';

  return {
    FundraiseListScreenStyles: createScreenStyles({
      container: { flex: 1, backgroundColor: BG },
      listContent: { padding: 14, paddingBottom: 90 },

      summaryStrip: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginTop: 8, borderRadius: 14, padding: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, marginBottom: 6 },
      summaryItem: { flex: 1, alignItems: 'center' },
      summaryVal: { fontSize: 15, fontWeight: '800', color: PRIMARY },
      summaryLabel: { fontSize: 11, color: '#888', marginTop: 2 },
      summaryDivider: { width: 1, backgroundColor: '#E8ECF4' },

      card: { backgroundColor: CARD_BG, borderRadius: 16, marginBottom: 14, padding: 16, elevation: 3, shadowColor: '#252943', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
      cardTopInfo: { flex: 1, marginLeft: 12 },
      titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
      fundTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A2540', marginRight: 8 },
      badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
      badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
      badgeText: { fontSize: 11, fontWeight: '700' },
      metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
      metaName: { fontSize: 12, color: '#888' },
      categoryChip: { backgroundColor: '#EEF2FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
      categoryText: { fontSize: 11, color: '#4361EE', fontWeight: '600' },

      amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
      amountLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
      amountValue: { fontSize: 15, fontWeight: '700', color: SUCCESS },
      pctBubble: { backgroundColor: '#EEF5FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
      pctText: { fontSize: 13, fontWeight: '800', color: ACCENT },

      divider: { height: 1, backgroundColor: '#F0F3FA', marginVertical: 12 },
      actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      actionBtn: { padding: 4 },
      actionView: { fontSize: 13, color: '#888', fontWeight: '500' },

      footerWrap: { paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
      footerText: { fontSize: 12, color: '#aaa' },

      emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
      emptyIcon: { fontSize: 52, marginBottom: 16 },
      emptyTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY, marginBottom: 8 },
      emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
      emptyBtn: { marginTop: 24, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
      emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

      fab: Common.fab(),
      fabText: Common.fabText,
      statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginRight: 6 },

    }),
    FundraiseListScreenAv: createScreenStyles({
      img: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#E8ECF4', borderWidth: 1.5, borderColor: '#DDE3EF' },
      fallback: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#D6E4F7', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#B8CEE8' },
      initials: { fontSize: 20, fontWeight: '800', color: PRIMARY },
    }),
    FundraiseListScreenPb: createScreenStyles({
      track: { height: 7, backgroundColor: '#EEF2F8', borderRadius: 99, overflow: 'hidden', marginTop: 8 },
      fill: { height: '100%', borderRadius: 99 },
    }),
  };
})();
export const FundraiseListScreenStyles = _FundraiseListScreenStyleBundle.FundraiseListScreenStyles;
export const FundraiseListScreenAv = _FundraiseListScreenStyleBundle.FundraiseListScreenAv;
export const FundraiseListScreenPb = _FundraiseListScreenStyleBundle.FundraiseListScreenPb;

// FundraiseViewScreen
const _FundraiseViewScreenStyleBundle = (() => {
  const BG = '#F0F4FA';


  const PRIMARY = COLORS.navy;

  const SUCCESS = COLORS.success;

  const DANGER = COLORS.dangerAlt;

  return {
    FundraiseViewScreenStyles: createScreenStyles({
      container: { flex: 1, backgroundColor: BG },

      // Header
      header: {
        backgroundColor: PRIMARY,
        paddingTop: Platform.OS === 'ios' ? 52 : 18,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      backBtn: { padding: 6 },
      backArrow: { color: '#fff', fontSize: 22, fontWeight: '300' },
      headerLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
      editHeaderBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
      editHeaderText: { color: '#fff', fontWeight: '600', fontSize: 13 },

      scroll: { padding: 14 },

      // Hero card
      heroCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18,
        marginBottom: 14,
        elevation: 4, shadowColor: '#252943',
        shadowOpacity: 0.09, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      heroMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
      categoryChip: {
        backgroundColor: '#EEF2FF', borderRadius: 6,
        paddingHorizontal: 10, paddingVertical: 4,
      },
      categoryText: { fontSize: 12, color: '#4361EE', fontWeight: '700' },
      urgencyBadge: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
      },
      urgencyDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
      urgencyText: { fontSize: 12, fontWeight: '700' },

      fundTitle: {
        fontSize: 22, fontWeight: '800', color: '#1A2540',
        lineHeight: 28, marginBottom: 8,
      },
      description: {
        fontSize: 14, color: '#666', lineHeight: 21, marginBottom: 16,
      },
      progressWrap: { marginBottom: 16 },

      // Amount tiles
      amountGrid: { flexDirection: 'row', gap: 8 },
      amountTile: {
        flex: 1, borderRadius: 12,
        paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
      },
      amountTileVal: { fontSize: 14, fontWeight: '800', color: SUCCESS, marginBottom: 3 },
      amountTileLabel: { fontSize: 11, fontWeight: '600' },

      // Action buttons
      actionsCard: { gap: 10 },
      editBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: PRIMARY, borderRadius: 14,
        paddingVertical: 15, gap: 8,
        elevation: 3, shadowColor: PRIMARY,
        shadowOpacity: 0.25, shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      editBtnIcon: { fontSize: 16 },
      editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

      deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 14,
        paddingVertical: 15, gap: 8,
        borderWidth: 1.5, borderColor: '#F5C6C6',
      },
      deleteBtnIcon: { fontSize: 16 },
      deleteBtnText: { color: DANGER, fontSize: 16, fontWeight: '700' },
    }),
    FundraiseViewScreenSc: createScreenStyles({
      card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        marginBottom: 14,
        elevation: 2, shadowColor: '#000',
        shadowOpacity: 0.05, shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      title: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginBottom: 12, letterSpacing: 0.3 },
    }),
    FundraiseViewScreenIr: createScreenStyles({
      row: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: 9, borderBottomWidth: 1, borderColor: '#F3F5FB',
      },
      iconWrap: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#F3F6FC', alignItems: 'center',
        justifyContent: 'center', marginRight: 12,
      },
      icon: { fontSize: 15 },
      content: { flex: 1, justifyContent: 'center' },
      label: { fontSize: 11, color: '#999', fontWeight: '500', marginBottom: 2 },
      value: { fontSize: 14, color: '#1A2540', fontWeight: '600' },
    }),
    FundraiseViewScreenPb: createScreenStyles({
      track: {
        height: 8, backgroundColor: '#EEF2F8',
        borderRadius: 99, overflow: 'hidden',
      },
      fill: { height: '100%', borderRadius: 99 },
      labels: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginTop: 8,
      },
      labelText: { fontSize: 12, color: '#888' },
    }),
  };
})();
export const FundraiseViewScreenStyles = _FundraiseViewScreenStyleBundle.FundraiseViewScreenStyles;
export const FundraiseViewScreenSc = _FundraiseViewScreenStyleBundle.FundraiseViewScreenSc;
export const FundraiseViewScreenIr = _FundraiseViewScreenStyleBundle.FundraiseViewScreenIr;
export const FundraiseViewScreenPb = _FundraiseViewScreenStyleBundle.FundraiseViewScreenPb;

// GovernanceDetails
export const GovernanceDetailsStyles = (() => {
  const LIGHT = COLORS.bg;

  const NAVY = COLORS.navy;

  const WHITE = COLORS.white;

  const GREY = COLORS.grey;


  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: LIGHT },
    header: {
      backgroundColor: NAVY, paddingTop: 48, paddingBottom: 18, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center',
    },
    backBtn: { marginRight: 14, padding: 4 },
    headerTitle: { color: WHITE, fontSize: 19, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    advisoryCard: {
      backgroundColor: NAVY, borderRadius: 12, padding: 16, marginBottom: 18,
    },
    cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    advisoryTitle: { color: WHITE, fontSize: 15, fontWeight: '700' },
    advisoryText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: GREY, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
    card: {
      backgroundColor: WHITE, borderRadius: 12, padding: 16, marginBottom: 10,
      elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, borderLeftWidth: 4, borderLeftColor: GOLD,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    iconWrap: {
      width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(212,160,23,0.12)',
      alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    cardTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
    cardBody: { fontSize: 13, lineHeight: 19, color: '#444' },
    meetingsCard: {
      backgroundColor: WHITE, borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 12,
    },
    meetingsTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 6 },
    officeCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 10, padding: 14,
    },
    officeText: { fontSize: 13, color: '#444' },
  });
})();

// HistoryDetails
export const HistoryDetailsStyles = (() => {
  const LIGHT = COLORS.bg;

  const NAVY = COLORS.navy;

  const WHITE = COLORS.white;

  const GREY = COLORS.grey;


  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: LIGHT },
    header: {
      backgroundColor: NAVY, paddingTop: 48, paddingBottom: 18, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center',
    },
    backBtn: { marginRight: 14, padding: 4 },
    headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 20 },
    timeline: { paddingLeft: 4 },
    timelineRow: { flexDirection: 'row' },
    timelineMarkerCol: { width: 24, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: GOLD, marginTop: 4 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#D8DEE6', marginVertical: 2 },
    timelineContent: { flex: 1, paddingLeft: 14, paddingBottom: 20 },
    timelineYear: { fontSize: 14, fontWeight: '800', color: NAVY, marginBottom: 4 },
    timelineText: { fontSize: 13, lineHeight: 19, color: '#444' },
  });
})();

// HomeScreen
export const HomeScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#252943' },
    list: { flex: 1, backgroundColor: '#F0F2F5' },
    listContent: { paddingBottom: 20 },
    emptyContent: { flexGrow: 1 },

    // App header
    appHeader: {
      backgroundColor: '#252943',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 44,
      paddingBottom: 10,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoBox: {
      width: 40, height: 40, borderRadius: 10,
      backgroundColor: '#A0C878',
      justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    logoText: { color: '#252943', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    appName: { color: '#fff', fontSize: 13, fontWeight: '700' },
    appTagline: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { padding: 7, marginLeft: 2 },
    iconBtnText: { fontSize: 20 },
    kebabIcon: { fontSize: 26, color: '#fff', fontWeight: '700' },
    menuContent: { backgroundColor: '#fff', borderRadius: 10, elevation: 8, minWidth: 200 },
    menuItemText: { fontSize: 14, color: '#222' },
    menuSep: { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 12, marginVertical: 4 },

    // Welcome strip
    welcomeStrip: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
    },
    welcomeAvatar: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: '#252943', justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    welcomeAvatarLetter: { color: '#A0C878', fontSize: 20, fontWeight: '800' },
    welcomeTexts: { flex: 1 },
    welcomeGreeting: { fontSize: 16, fontWeight: '700', color: '#252943' },
    welcomeSub: { fontSize: 12, color: '#888', marginTop: 2 },
    newPostBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: '#3A4EFB',
      justifyContent: 'center', alignItems: 'center',
      marginLeft: 8,
    },
    newPostBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28 },

    // Footer
    footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
    footerText: { fontSize: 13, color: '#888', marginLeft: 10 },
    endWrap: { alignItems: 'center', paddingVertical: 26 },
    endText: { fontSize: 13, color: '#aaa' },

    // Center (loading / error)
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5', padding: 32 },
    centerText: { marginTop: 14, fontSize: 14, color: '#888' },
    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorText: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
    retryBtn: { backgroundColor: '#252943', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Empty
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '700', color: '#555' },
    emptySubText: { fontSize: 13, color: '#aaa', marginTop: 4 },
    lawBotCard: {
      backgroundColor: '#EEF4FB',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 10,
      padding: 12,
      borderWidth: 0.5,
      borderColor: '#B5D4F4',
    },
    lawBotTitle: { fontSize: 14, fontWeight: '700', color: '#252943' },
    lawBotSubtitle: { fontSize: 12, color: '#33A4FA', marginTop: 3 },
  });
})();

// JobPostingDetailScreen
export const JobPostingDetailScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F0F4F8' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    headerBtn: { padding: 6, borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

    body: { padding: 20, paddingBottom: 40, alignItems: 'center' },

    heroSection: { marginBottom: 16, marginTop: 8 },
    heroIconCircle: {
      width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF',
      alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: GOLD,
    },

    jobTitle: { fontSize: 20, fontWeight: '800', color: NAVY, textAlign: 'center', marginBottom: 4 },
    companyName: { fontSize: 15, color: '#64748B', textAlign: 'center', fontWeight: '500', marginBottom: 12 },

    goldDivider: { width: 56, height: 3, backgroundColor: GOLD, borderRadius: 2, marginBottom: 16 },

    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
    badge: {
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
      borderWidth: 1, borderColor: GOLD, backgroundColor: '#FFFBEB',
      marginRight: 8, marginBottom: 6,
    },
    badgeText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

    infoCard: {
      width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
      marginBottom: 16, elevation: 2,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    infoLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
    infoValue: { fontSize: 14, color: '#334155', fontWeight: '500', marginTop: 2 },

    section: {
      width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
      marginBottom: 14, elevation: 2,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    sectionText: { fontSize: 14, color: '#334155', lineHeight: 22 },

    contactCard: {
      width: '100%', flexDirection: 'row', alignItems: 'flex-start',
      backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 20,
      borderWidth: 1, borderColor: '#BFDBFE',
    },
    contactLabel: { fontSize: 11, fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.4 },
    contactValue: { fontSize: 14, color: '#252943', fontWeight: '600', marginTop: 2 },

    attachSection: { width: '100%', marginBottom: 20 },
    attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    attachImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#fff' },
    attachHint: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
    downloadBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 10,
    },
    downloadText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },

    ...Common.lightboxSimple(),
  });
})();

// JobPostingFormScreen
const _JobPostingFormScreenStyleBundle = (() => {
  const NAVY = COLORS.navy;
  const GOLD = COLORS.gold;
  return {
    JobPostingFormScreenChip: createScreenStyles({
      wrapper: { marginBottom: 20 }, // match field.wrapper spacing
      label: {
        fontSize: 12, fontWeight: '700', color: '#64748B',
        marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6,
      },
      row: { flexDirection: 'row', flexWrap: 'wrap' },
      chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E7EF',   // was transparent + NAVY border
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: NAVY,        // matches chipSelected in your example
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,                  // was NAVY, kept — matches chipText in your example
  },
  chipTextActive: {
    color: '#fff',
  },
    }),
    JobPostingFormScreenStyles: createScreenStyles({
      root: { flex: 1, backgroundColor: '#F7F9FC' },
      navbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: NAVY,
        paddingTop: (StatusBar.currentHeight || 0) + 6,
        paddingBottom: 12, paddingHorizontal: 12,
      },
      navSide: { minWidth: 64, paddingHorizontal: 4 },
      navTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
      cancelText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
      saveText: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },

      body: { padding: 18, paddingBottom: 40 },

      attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.6 },
      attachGrid: {
        flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1',
        borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80,
        alignItems: 'center', marginBottom: 6,
      },
      gridThumb: {
        width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden',
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
      },
      gridImg: { width: '100%', height: '100%' },
      gridDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
      gridDocIcon: { fontSize: 24 },
      gridDocName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
      gridRemove: {
        position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
      },
      gridRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
      gridAddBtn: {
        width: 80, height: 80, borderRadius: 10, margin: 4,
        borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
      },
      gridAddIcon: { fontSize: 22, marginBottom: 2 },
      gridAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
      attachHint: { fontSize: 11, color: '#94A3B8', marginBottom: 20 },

      saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: NAVY, borderRadius: 12, padding: 16, marginTop: 6,
      },
      saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },

      // ── Field wrapper styles (mirrors AchievementFormScreenStyles.field) ──
      field: {
        wrapper: { marginBottom: 20 },
        labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
        label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
        req: { color: '#EF4444' },
        counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
        counterOver: { color: '#EF4444' },
        hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
        error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
      },

      // ── Styled TextInput styles (mirrors AchievementFormScreenStyles.styledInput) ──
      styledInput: {
        base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
        focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
        errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
        multiline: { height: 130, paddingTop: 14 },
      },
      

      ...Common.lightbox,
    }),
  };
})();
export const JobPostingFormScreenChip = _JobPostingFormScreenStyleBundle.JobPostingFormScreenChip;
export const JobPostingFormScreenStyles = _JobPostingFormScreenStyleBundle.JobPostingFormScreenStyles;

// JobPostingListScreen
export const JobPostingListScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F0F2F5' },

    appHeader: {
      backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingTop: 44, paddingBottom: 14,
    },
    backBtn: { padding: 8, marginRight: 6 },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },

    listContent: { padding: 12, paddingBottom: 90, flexGrow: 1 },

    card: {
      flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12,
      elevation: 2, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    cardThumb: { width: 80, height: '100%', minHeight: 120 },
    cardThumbFallback: { backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, padding: 12 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: NAVY },
    actionRow: { flexDirection: 'row' },
    iconBtn: { padding: 4, marginLeft: 4 },
    cardCompany: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    metaChip: { flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 },
    metaText: { fontSize: 11, color: '#64748B', marginLeft: 3 },

    salaryText: { fontSize: 12, color: '#047857', fontWeight: '600', marginTop: 4 },

    cardFooter: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6 },
    closingText: { fontSize: 11, color: NAVY, fontWeight: '600' },
    closedText: { color: '#EF4444' },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { fontSize: 15, color: '#888', fontWeight: '600' },
    emptySubText: { fontSize: 13, color: '#aaa', marginTop: 4 },

    fab: Common.fab({ zIndex: 100 }),
     fabText: Common.fabText,
  });
})();

// LawBotScreen
export const LawBotScreenStyles = (() => {
  const BG = '#F0F2F5';
const NAVY = '#252943';
const GOLD = '#A0C878';
const WHITE = '#FFFFFF';
  return createScreenStyles({
    safe: { flex: 1, backgroundColor: BG },

    // Header
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',

    paddingTop:
        Platform.OS === 'android'
            ? StatusBar.currentHeight
            : 10,

    paddingBottom: 12,
    paddingHorizontal: 14,
},
    backBtn: { padding: 6, marginRight: 6 },
    backIcon: { fontSize: 22, color: WHITE, fontWeight: '700' },
    headerIcon: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: GOLD,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 10,
    },
    headerIconText: { fontSize: 18 },
    headerInfo: { flex: 1 },
    headerTitle: { color: WHITE, fontSize: 16, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
    liveTag: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(212,160,23,0.2)',
      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 1, borderColor: 'rgba(212,160,23,0.4)',
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 4 },
    liveText: { color: GOLD, fontSize: 10, fontWeight: '700' },

    // Messages
messageList: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 8,
    backgroundColor: BG,
},
    msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    msgRowBot: { justifyContent: 'flex-start' },
    msgRowUser: { justifyContent: 'flex-end' },

    botAvatar: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: NAVY,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 8, flexShrink: 0,
    },
    botAvatarErr: { backgroundColor: '#c0392b' },
    botAvatarText: { fontSize: 14 },

    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 18, elevation: 1,
      shadowColor: '#000', shadowOpacity: 0.06,
      shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    },
    bubbleBot: {
      backgroundColor: WHITE,
      borderBottomLeftRadius: 4,
      borderWidth: 1, borderColor: '#E8EEF4',
    },
    bubbleUser: { backgroundColor: NAVY, borderBottomRightRadius: 4 },
    bubbleErr: { backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#FFCDD2' },

    bubbleSender: { fontSize: 10, fontWeight: '700', color: GOLD, marginBottom: 4 },

    bubbleText: { fontSize: 14, lineHeight: 21 },
    bubbleTextBot: { color: '#1a1a1a' },
    bubbleTextUser: { color: WHITE },
    bubbleTextErr: { color: '#c0392b' },

    timeText: { fontSize: 10, marginTop: 5 },
    timeBot: { color: '#aaa' },
    timeUser: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },

    // Typing
    typingRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingBottom: 6,
      backgroundColor: BG,
    },
    typingBubble: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: WHITE, borderRadius: 14,
      paddingHorizontal: 12, paddingVertical: 8,
      borderWidth: 1, borderColor: '#E8EEF4',
      gap: 8,
    },
    typingText: { color: '#888', fontSize: 12, marginLeft: 6 },

    // Suggestions
    suggWrap: { backgroundColor: BG, paddingVertical: 8 },
    suggLabel: {
      fontSize: 11, fontWeight: '700', color: '#888',
      marginLeft: 14, marginBottom: 6,
    },
    suggList: { paddingHorizontal: 14, gap: 8 },
    suggChip: {
      backgroundColor: WHITE,
      borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: '#D0DBE8',
      marginRight: 8,
    },
    suggText: { fontSize: 12, color: NAVY, fontWeight: '600' },

    // Input bar
    inputBar: {
  flexDirection: 'row', alignItems: 'flex-end',
  backgroundColor: WHITE,
  borderTopWidth: 1, borderTopColor: '#E8E8E8',
  paddingHorizontal: 12, paddingVertical: 8,
  paddingBottom: Platform.OS === 'android' ? 20 : 18,   // ← added
},
    textInput: {
      flex: 1, backgroundColor: '#F5F5F5',
      borderRadius: 22, paddingHorizontal: 16,
      paddingVertical: 10, fontSize: 14,
      color: '#1a1a1a', maxHeight: 120, marginRight: 8,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: NAVY,
      justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#B0BEC5' },
    sendIcon: { color: WHITE, fontSize: 18, marginLeft: 2 },
  });
})();

// LoginScreen
export const LoginScreenStyles = (() => {
  const NAVY = COLORS.navy;
  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, },

    heroBg: {
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

    card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 22,
  marginBottom: 16,
  elevation: 8,
  shadowColor: '#252943',
  shadowOpacity: 0.15,
  shadowRadius: 12,
},
    cardTitle: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 4 },
    cardSub: { fontSize: 13, color: '#6B7A8D', marginBottom: 18 },

    field: {
  wrapper: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },  // added marginBottom
  req: { color: '#EF4444' },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
},

    // ── Styled TextInput — matches Achievement/JobPosting/Club/ChangePassword ──
    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: COLORS.accent, backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
    },

    forgotWrap: { alignSelf: 'flex-end', marginBottom: 16 },
    forgotText: { color: NAVY, fontSize: 13, fontWeight: '600' },

    loginBtn: {
      backgroundColor: NAVY,
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
    },
    loginBtnIcon: { marginRight: 8 },
    loginBtnDisabled: { opacity: 0.7 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerText: { color: '#8090A0', fontSize: 12, fontWeight: '600', marginHorizontal: 10 },

    signupBtn: {
      borderWidth: 2, borderColor: NAVY, borderRadius: 12,
      paddingVertical: 13, alignItems: 'center',
    },
    signupBtnText: { color: NAVY, fontSize: 15, fontWeight: '700' },

    quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
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

    statsBar: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { color: COLORS.accent, fontSize: 16, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2, fontWeight: '500' },
    statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },

    footerText: { color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'center', marginTop: 4 , marginBottom: 12, },
  });
})();


// MagazineDetailScreen

export const MagazineDetailScreenStyles = (() => {
  const NAVY = COLORS.navy;
  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F0F4F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
    errorText: { fontSize: 15, color: '#888' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    headerBtn: { padding: 6, borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

    body: { padding: 20, paddingBottom: 20 },

    // ---------- Badge / Title / Meta (plain, sits directly on page bg) ----------
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    badge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  alignSelf: 'flex-start',
  backgroundColor: '#FEF9EC',
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 4,
  height: 22,
},
badgeText: {
  fontSize: 10,
  color: '#B7791F',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  includeFontPadding: false,
  textAlignVertical: 'center',
  lineHeight: 12,
},

    title: {
      fontSize: 20, fontWeight: '800', color: NAVY,
      marginBottom: 4, letterSpacing: -0.3,
    },

    issueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 12,
    },
    issue: {
      fontSize: 13, color: GOLD, fontWeight: '700',
    },

    goldDivider: {
      width: 56, height: 3, backgroundColor: GOLD,
      borderRadius: 2, marginBottom: 16,
    },

    metaRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 14, color: '#334155', fontWeight: '500' },

    categoryPill: {
  alignSelf: 'flex-start',
  backgroundColor: '#EFF6FF',
  borderRadius: 8,
  paddingHorizontal: 10,
  justifyContent: 'center',
  height: 22,
},
categoryText: {
  fontSize: 12,
  color: '#2563EB',
  fontWeight: '600',
  includeFontPadding: false,
  textAlignVertical: 'center',
},

    // ---------- Description card (white card, gold label) ----------
    descBlock: {
      width: '100%', backgroundColor: '#fff',
      borderRadius: 12, padding: 16, marginBottom: 20,
      elevation: 2, shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    descLabel: {
      fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1,
      marginBottom: 8, textTransform: 'uppercase',
    },
    descText: { fontSize: 14, color: '#334155', lineHeight: 22 },

    // ---------- Attachments (white card wrapping image/list) ----------
    attachLabel: {
      fontSize: 12, fontWeight: '700', color: '#64748B',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
    },
    noAttach: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
    attachSection: {
      width: '100%', backgroundColor: '#fff',
      borderRadius: 12, padding: 16, marginBottom: 20,
      elevation: 2, shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    attachImage: {
      width: '100%',
      height: 220,
      borderRadius: 12,
      backgroundColor: '#F1F5F9',
    },
    attachHint: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
    downloadBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 14,
    },
    downloadText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },

    // ---------- Discussion / chat styles ----------
    discussionBox: { gap: 10 },
    chatBubbleWrap: { flexDirection: 'row', marginBottom: 4 },
    chatBubbleWrapMine: { justifyContent: 'flex-end' },
    chatBubbleWrapOther: { justifyContent: 'flex-start' },
    chatBubble: {
      maxWidth: '80%',
      borderRadius: 12,
      padding: 10,
    },
    chatBubbleMine: {
      backgroundColor: '#DCEEFF',
      borderTopRightRadius: 2,
    },
    chatBubbleOther: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderTopLeftRadius: 2,
    },
    chatName: { fontSize: 12, fontWeight: '700', color: NAVY, marginBottom: 2 },
    chatContent: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
    chatDate: { fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'right' },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    input: {
      flex: 1,
      backgroundColor: '#F1F5F9',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: '#0F172A',
      minHeight: 100,
      maxHeight: 150,
      textAlignVertical: 'top',
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: NAVY,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    previewContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    previewImage: { width: "100%", height: "100%" },
    closeButton: { position: "absolute", top: 50, right: 20, zIndex: 100 },
  });
})();
// MagazineFormScreen
export const MagazineFormScreenStyles = (() => {
  const NAVY = COLORS.navy;
  const GOLD = COLORS.gold;
  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F7F9FC' },
    navbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    navSide: { minWidth: 64, paddingHorizontal: 4 },
    navTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
    cancelText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    saveText: { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },
    body: { padding: 18, paddingBottom: 40 },
    error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },

    attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.6 },
    attachGrid: {
      flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1',
      borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80,
      alignItems: 'center', marginBottom: 6,
    },
    gridThumb: {
      width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden',
      backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    },
    gridImg: { width: '100%', height: '100%' },
    gridDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
    gridDocIcon: { fontSize: 24 },
    gridDocName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
    gridRemove: {
      position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    },
    gridRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    gridAddBtn: {
      width: 80, height: 80, borderRadius: 10, margin: 4,
      borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
    },
    gridAddIcon: { fontSize: 22, marginBottom: 2 },
    gridAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
    attachHint: { fontSize: 11, color: '#94A3B8', marginBottom: 20 },

    // ── Field wrapper styles (own copy — matches Achievement Form Screen) ──
    field: {
      wrapper: { marginBottom: 20 },
      labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
      counterOver: { color: '#EF4444' },
      hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
      error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
    },

    // ── Styled TextInput styles (own copy — matches Achievement Form Screen) ──
    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
      multiline: { height: 130, paddingTop: 14 },
    },

    ...Common.lightbox,
  });
})();
// MagazinesScreen
export const MagazinesScreenS = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    safe: { flex: 1, backgroundColor: '#F7F9FC' },
    list: { padding: 16, paddingBottom: 90 },
    card: {
      backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 16,
      shadowColor: '#1A202C', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
   cardTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},
actionContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
iconButton: {
  padding: 4,
  marginLeft: 8,
},
badge: {
  flexDirection: 'row',
  alignSelf: 'flex-start',
  backgroundColor: '#EEF2FF',
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 4,
},
badgeText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#252943',
},
    iconBotton: { padding: 4 },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    cover: { width: 52, height: 68, borderRadius: 6, marginRight: 14, borderWidth: 1, borderColor: '#E2E8F0' },
    coverPlaceholder: {
      width: 52, height: 68, borderRadius: 6, marginRight: 14,
      backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
    },
    textContainer: { flex: 1 },
    title: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginBottom: 2 },
    issue: { fontSize: 12, color: GOLD, fontWeight: '600', marginBottom: 2 },
    author: { fontSize: 13, color: '#718096', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
    categoryPill: { backgroundColor: '#EFF6FF', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    categoryText: { fontSize: 10, color: '#2563EB', fontWeight: '600' },
    date: { fontSize: 11, color: '#A0AEC0' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginTop: 12, marginBottom: 4 },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    fab: Common.fab({ zIndex: 100 }),
    fabText: Common.fabText,
    
  });
})();

// MediaDetailScreen
export const MediaDetailScreenStyles = (() => {
  const { width } = Dimensions.get('window');


  return createScreenStyles({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    errorText: {
      fontSize: 16,
      color: '#999',
    },
    mediaViewer: {
      position: 'relative',
      backgroundColor: '#000',
    },
    mainImage: {
      width: width,
      height: 400,
    },
    videoContainer: {
      width: width,
      height: 400,
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
    },
    playButton: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 8,
    },
    controlButton: {
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    counter: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    counterText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      backgroundColor: '#f5f5f5',
      padding: 15,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeChip: {
      height: 28,
    },
    typeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    date: {
      fontSize: 12,
      color: '#999',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    descriptionCard: {
      marginBottom: 15,
      elevation: 2,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: '#666',
    },
    albumContainer: {
      flexDirection: 'row',
      marginBottom: 15,
      alignItems: 'center',
    },
    albumLabel: {
      fontSize: 14,
      color: '#999',
      marginRight: 8,
    },
    albumName: {
      fontSize: 16,
      color: '#2196F3',
      fontWeight: '600',
    },
    tagsContainer: {
      marginBottom: 15,
    },
    tagsLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tag: {
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: '#E3F2FD',
    },
    tagText: {
      fontSize: 12,
      color: '#2196F3',
    },
    thumbnailsContainer: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    thumbnail: {
      marginRight: 8,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    thumbnailSelected: {
      borderColor: '#2196F3',
    },
    thumbnailImage: {
      width: 100,
      height: 100,
    },
    thumbnailOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    externalLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E3F2FD',
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
    },
    externalLinkText: {
      fontSize: 16,
      color: '#2196F3',
      fontWeight: '600',
    },
  });
})();

// MemberEditScreen
export const MemberEditScreenStyles = (() => {
  return createScreenStyles({
    // ── Navbar (same as Activity Form) ──
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      paddingTop: (StatusBar.currentHeight ?? 0) + 12,
      backgroundColor: '#252943',
    },
    navSide: { minWidth: 72, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    navSave: { fontSize: 15, color: '#A0C878', fontWeight: '700', textAlign: 'right' },

    root: { flex: 1,  backgroundColor: '#F5F5F5', },
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { paddingBottom: 32 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ── Card (same as Activity Form) ──
    card: { margin: 12, elevation: 2, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },

    // ── Read-only info block ──
    readOnlyBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    readOnlyLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
    readOnlyValue: { fontSize: 14, color: '#1E293B', fontWeight: '600', marginTop: 2 },

    // ── Field wrapper styles (matches Activity Form) ──
    field: {
      wrapper: { marginBottom: 20 },
      labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
      counterOver: { color: '#EF4444' },
      hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
      error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
    },

    // ── Styled TextInput styles (matches Activity Form) ──
    styledInput: {
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
      multiline: { height: 90, paddingTop: 14 },
      disabled: { backgroundColor: '#EDF1F5', borderColor: '#E2E8F0', color: '#94A3B8' },
    },

    // ── Gender dropdown ──
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownSelected: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
    dropdownPlaceholder: { fontSize: 15, color: '#CBD5E1' },
    dropdownArrow: { fontSize: 12, color: '#94A3B8' },
    dropdownMenu: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', marginTop: 8, overflow: 'hidden' },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
    dropdownItemText: { fontSize: 15, color: '#334155' },
    dropdownItemActive: { color: '#252943', fontWeight: '700' },

    // ── Attachment-style photo upload box (matches Activity Form Attachments exactly) ──
    attachGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      borderWidth: 1.5, borderColor: '#CBD5E1',
      borderRadius: 12, borderStyle: 'dashed',
      padding: 8, minHeight: 80,
      alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    thumb: {
      width: 90, height: 90, borderRadius: 12, margin: 4,
      overflow: 'hidden', backgroundColor: '#fff',
      borderWidth: 1, borderColor: '#E2E8F0',
    },
    thumbImg: { width: '100%', height: '100%' },
    thumbDoc: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: 6, backgroundColor: '#F8FAFC',
    },
    thumbIcon: { fontSize: 24, marginBottom: 2 },
    thumbName: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
    thumbRemove: {
      position: 'absolute', top: 2, right: 2,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 8, width: 18, height: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    thumbRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    thumbAdd: {
      width: 90, height: 90, borderRadius: 12, margin: 4,
      borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
    },
    thumbAddIcon: { fontSize: 24, marginBottom: 2 },
    thumbAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
    attachHint: { fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'center' },

    // ── Action buttons row ──
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginHorizontal: 12,
      marginTop: 4,
      marginBottom: 20,
    },
    clearBtn: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#252943',
    },
    clearBtnText: { color: '#252943', fontSize: 16, fontWeight: '700' },
    saveBtn: {
      flex: 1,
      backgroundColor: '#252943',
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
})();

// MemberManagementScreen
export const MemberManagementScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    searchBar: { margin: 15, elevation: 2 },
    filters: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10, flexWrap: 'wrap' },
    list: { padding: 15, paddingTop: 0, paddingBottom: 90 },
    card: { marginBottom: 15, borderRadius: 16, backgroundColor: '#fff', elevation: 4 },
    memberHeader: { flexDirection: 'row', alignItems: 'center' },
    photo: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
    photoPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    photoPlaceholderText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 18, fontWeight: 'bold', color: '#222' },
    memberEmail: { fontSize: 13, color: '#777', marginTop: 2 },
    memberPhone: { fontSize: 13, color: '#777' },
    designation: { fontSize: 13, color: '#999', fontStyle: 'italic', marginTop: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    emptyText: { fontSize: 16, color: '#999' },
    fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#252943' },

    // ── Top row: status badge (left) — Edit/Delete (right) ──
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBotton: {
      marginLeft: 8,
    },

    // ── Status badge — top-left of card ──
    cornerBadge: {
      borderRadius: 6,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    cornerBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    // ── Filter chips — same pattern as Activity status chips ──
    chip: { marginRight: 8, marginBottom: 8, backgroundColor: '#E0E7EF' },
    chipSelected: { backgroundColor: '#252943' },
    chipText: { fontSize: 12, color: '#252943' },
    chipTextSelected: { color: '#fff' },
  });
})();

// MembershipDetails
export const MembershipDetailsStyles = (() => {
  const LIGHT = COLORS.bg;

  const NAVY = COLORS.navy;

  const WHITE = COLORS.white;

  const GREY = COLORS.grey;


  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: LIGHT },
    header: {
      backgroundColor: NAVY,
      paddingTop: 48,
      paddingBottom: 18,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backBtn: { marginRight: 14, padding: 4 },
    headerTitle: { color: WHITE, fontSize: 19, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 16 },
    card: {
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
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconWrap: {
      width: 38, height: 38, borderRadius: 9,
      backgroundColor: 'rgba(212,160,23,0.12)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
    cardBody: { fontSize: 13, lineHeight: 19, color: '#444' },
    benefitsCard: {
      backgroundColor: NAVY,
      borderRadius: 12,
      padding: 18,
      marginTop: 8,
    },
    benefitsTitle: { color: WHITE, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    benefitRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
    benefitText: { flex: 1, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)' },
  });
})();

// MunicipalMapScreen
export const MunicipalMapScreenStyles = (() => {
  const BG = COLORS.bg;


  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: BG },

    header: {
      backgroundColor: NAVY,
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 48,
      paddingBottom: 14,
      paddingHorizontal: 16,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    loginBackBtn: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: GOLD, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6, gap: 4,
    },
    loginBackBtnText: { color: NAVY, fontWeight: '700', fontSize: 12 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    breadcrumb: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },

 levelRow: {
  flexDirection: 'row',
  backgroundColor: NAVY,
  paddingHorizontal: 10,
  paddingBottom: 8,
  padding :20
},
levelPill: {
  flex: 1, minHeight: 34, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.12)',
  alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
},
levelPillActive: { backgroundColor: GOLD },
levelPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
levelPillTextActive: { color: NAVY, fontWeight: '700' },
//levelPillTextActive: { color: NAVY },

    mapContainer: { flex: 1 },
    map: { flex: 1 },

    carouselOverlay: {
      position: 'absolute', left: 16, right: 16, bottom: 16,
      backgroundColor: '#fff', borderRadius: 16,
      paddingTop: 14, paddingBottom: 10,
      elevation: 14,
      shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: -2 },
    },
    carouselHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, marginBottom: 10,
    },
    carouselTitle: { fontSize: 13, fontWeight: '700', color: NAVY, flex: 1 },
    carouselLoadingBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
    carouselLoadingText: { color: '#6B7A8D', fontSize: 12, marginLeft: 10 },
    carouselEmpty: { color: '#6B7A8D', fontSize: 12, paddingHorizontal: 14, paddingBottom: 14 },

    corpCard: { paddingHorizontal: 14, paddingBottom: 4 },
    corpCardInner: { backgroundColor: '#F4F6FB', borderRadius: 12, padding: 14 },
    corpTypePill: {
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
    },
    corpTypePillText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
    corpName: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 8 },
    corpMetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    corpMetaChip: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#E8EEF6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
    },
    corpMetaChipText: { fontSize: 11, color: NAVY, fontWeight: '600' },
    corpBtnRow: { flexDirection: 'row', marginTop: 0 },
    corpNavBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, paddingVertical: 8, gap: 6,
    },
    corpNavBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    dotRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C5CDD8' },
    dotActive: { width: 18, borderRadius: 3, backgroundColor: NAVY },

    bottomPanel: {
      backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, elevation: 8,
    },
    bottomRow: { padding: 14, flexDirection: 'row', alignItems: 'center' },
    panelTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
    panelText: { fontSize: 12, color: '#6B7A8D', marginLeft: 6 },
  });
})();

// MypostScreen
export const MypostScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#252943' },
    list: { flex: 1, backgroundColor: '#F0F2F5' },
    listContent: { paddingBottom: 20 },
    emptyContent: { flexGrow: 1 },

    appHeader: {
      backgroundColor: '#252943',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 44,
      paddingBottom: 14,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    backIcon: { color: '#fff', fontSize: 22 },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

    card: {
      backgroundColor: '#fff',
      marginHorizontal: 12,
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      paddingBottom: 14,
    },
    cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 0 },
    avatar: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: '#252943',
      justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    avatarLetter: { color: '#A0C878', fontSize: 16, fontWeight: '800' },
    cardTopTexts: { flex: 1 },
    memberName: { fontSize: 14, fontWeight: '700', color: '#222' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    typePill: {
      backgroundColor: '#EEF1F5', borderRadius: 6,
      paddingHorizontal: 6, paddingVertical: 1,
    },
    typePillText: { fontSize: 11, color: '#555' },
    metaDot: { fontSize: 12, color: '#aaa', marginHorizontal: 5 },
    metaTime: { fontSize: 11, color: '#999' },

    deleteBtn: { padding: 6, marginLeft: 6 },
    deleteIcon: { fontSize: 18 },

    cardBody: { fontSize: 14, color: '#333', marginTop: 10, lineHeight: 19, paddingHorizontal: 14 },

    // ── Full-width attached image, same treatment as the home feed card ──
    postImage: {
      width: '100%',
      height: 320,
      marginTop: 12,
      backgroundColor: '#eee',
    },

    cardFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      marginTop: 12, paddingTop: 10, paddingHorizontal: 14,
      borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    footerStat: { fontSize: 12, color: '#888' },

    footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
    footerLoaderText: { fontSize: 13, color: '#888', marginLeft: 10 },
    endWrap: { alignItems: 'center', paddingVertical: 26 },
    endText: { fontSize: 13, color: '#aaa' },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5', padding: 32 },
    centerText: { marginTop: 14, fontSize: 14, color: '#888' },
    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorText: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
    retryBtn: { backgroundColor: '#252943', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '700', color: '#555' },
    emptySubText: { fontSize: 13, color: '#aaa', marginTop: 4 },
  });
})();

// NewsDetailScreen
export const NewsDetailScreenStyles = (() => {
  const { width } = Dimensions.get('window');


  return createScreenStyles({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: '#999',
    },
    imageGallery: {
      position: 'relative',
    },
    mainImage: {
      width: width,
      height: 300,
    },
    imageControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingHorizontal: 8,
    },
    imageButton: {
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    imageCounter: {
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    imageCounterText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      padding: 15,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    category: {
      fontSize: 14,
      color: '#2196F3',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    date: {
      fontSize: 12,
      color: '#999',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    authorContainer: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    authorLabel: {
      fontSize: 14,
      color: '#666',
    },
    author: {
      fontSize: 14,
      color: '#2196F3',
      fontWeight: '500',
    },
    contentCard: {
      marginBottom: 15,
      elevation: 2,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: '#333',
    },
    tagsContainer: {
      marginBottom: 15,
    },
    tagsLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tag: {
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: '#E3F2FD',
    },
    tagText: {
      fontSize: 12,
      color: '#2196F3',
    },
    thumbnailsContainer: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    thumbnail: {
      marginRight: 8,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbnailSelected: {
      borderColor: '#2196F3',
    },
    thumbnailImage: {
      width: 80,
      height: 80,
    },
    attachmentsCard: {
      marginBottom: 15,
      elevation: 2,
    },
    attachmentItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    externalLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E3F2FD',
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
    },
    externalLinkText: {
      fontSize: 16,
      color: '#2196F3',
      fontWeight: '600',
    },
  });
})();

// NewsScreen
export const NewsScreenStyles = (() => {
  return createScreenStyles({
    tabContent: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    list: {
      padding: 15,
    },
    card: {
      marginBottom: 15,
      elevation: 2,
    },
    date: {
      fontSize: 12,
      color: '#999',
      marginTop: 8,
    },
    mediaType: {
      fontSize: 12,
      color: '#2196F3',
      marginTop: 8,
      fontWeight: '500',
    },
    podcastInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    duration: {
      fontSize: 12,
      color: '#666',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    emptyText: {
      fontSize: 16,
      color: '#999',
    },
  });
})();

// NotificationsScreen
export const NotificationsScreenStyles = (() => {
  return createScreenStyles({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: '#999',
    },
    unreadItem: {
      backgroundColor: '#E3F2FD',
    },
    unreadTitle: {
      fontWeight: 'bold',
    },
    readTitle: {
      fontWeight: 'normal',
    },
    rightContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    time: {
      fontSize: 12,
      color: '#999',
      marginBottom: 4,
    },
    badge: {
      backgroundColor: '#2196F3',
    },
  });
})();

// Objectivesdetailsscreen
export const ObjectivesdetailsscreenStyles = (() => {
  const LIGHT = COLORS.bg;

  const NAVY = COLORS.navy;

  const WHITE = COLORS.white;

  const GREY = COLORS.grey;


  const GOLD = COLORS.gold;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: LIGHT },

    header: {
      backgroundColor: NAVY,
      paddingTop: 48,
      paddingBottom: 24,
      paddingHorizontal: 16,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backBtn: {
      marginRight: 14,
      padding: 4,
    },

    headerTitle: {
      color: WHITE,
      fontSize: 19,
      fontWeight: '800',
    },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 16 },

    subtitle: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 13,
      marginTop: 8,
      marginLeft: 40,
    },

    goldLine: {
      width: 40,
      height: 3,
      backgroundColor: GOLD,
      borderRadius: 2,
      marginTop: 12,
      marginLeft: 40,
    },

    // List
    scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: WHITE,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: GOLD,
    },
    numWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(212,160,23,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 1,
    },
    numText: {
      fontSize: 11,
      fontWeight: '800',
      color: GOLD,
    },
    objText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 20,
      color: '#444',
    },
  });
})();

// OrganisationScreen
export const OrganisationScreenStyles = (() => {
  return createScreenStyles({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: 15,
    },

    photo: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginRight: 14,
      borderWidth: 2,
      borderColor: '#2196F3',
    },
    photoPlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#2196F3',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    photoPlaceholderText: {
      fontSize: 28,
      color: '#fff',
      fontWeight: 'bold',
    },
    textContainer: {
      flex: 1,
    },
    name: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#222',
      marginBottom: 3,
    },
    role: {
      fontSize: 13,
      color: '#6d6c6c',
      fontWeight: '500',
      marginBottom: 4,
      //textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 6,
    },
    detail: {
      fontSize: 13,
      color: '#6d6c6c',
      fontWeight: '500',
      marginBottom: 2,
      marginLeft: 6,
    },
    clubName: {
      fontSize: 13,
      color: '#6d6c6c',
      fontWeight: '500',
      marginTop: 4,
      fontStyle: 'italic',
      marginLeft: 6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    emptyText: {
      fontSize: 16,
      color: '#999',
    },
    card: {
      marginBottom: 12,
      borderRadius: 14,
      backgroundColor: '#fff',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },

    photo: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: '#2196F3',
      marginRight: 12,
    },

    photoPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#2196F3',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },

    photoPlaceholderText: {
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
    },

    textContainer: {
      flex: 1,
    },

    name: {
      fontSize: 18,
      fontWeight: '700',
      color: '#222',
      marginBottom: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },

    infoText: {
      marginLeft: 6,
      fontSize: 13,
      color: '#666',
    },





  });
})();

// PaymentHistoryScreen
export const PaymentHistoryScreenStyles = (() => {
  const NAVY = '#252943';
  const GOLD = '#A0C878';
  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#F7F9FC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },

    navbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight || 0) + 6,
      paddingBottom: 12, paddingHorizontal: 12,
    },
    navSide: { minWidth: 64, paddingHorizontal: 4 },
    navTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

    body: { padding: 18, paddingBottom: 40 },

    card: {
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      padding: 16,
      marginBottom: 20,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginLeft: 8 },

    emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },

    tableHeaderRow: {
      flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#E2E8F0',
      paddingBottom: 8, marginBottom: 4,
    },
    th: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 },

    tableRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    td: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
    tdSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

    colSno: { width: 34 },
    colName: { flex: 1, paddingRight: 6 },
    colDate: { width: 78 },
    colAmount: { width: 74, textAlign: 'right' },

    totalRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      marginTop: 8, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: '#E2E8F0',
    },
    totalLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    totalValue: { fontSize: 15, fontWeight: '800', color: NAVY },

    downloadBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: NAVY, borderRadius: 12, paddingVertical: 15, marginTop: 4,marginBottom:15
    },
    downloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  });
})();

// PaymentScreen
export const PaymentScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    feeCard: { margin: 15, elevation: 3, backgroundColor: '#2196F3' },
    feeLabel: { fontSize: 16, color: '#fff', opacity: 0.9 },
    feeAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
    feeYear: { fontSize: 14, color: '#fff', opacity: 0.8 },

    methodCard: { margin: 15, marginTop: 0, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
    radioItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    radioLabel: { fontSize: 16, color: '#333', marginLeft: 8 },

    actionCard: { margin: 15, marginTop: 0, elevation: 2 },
    amountBreakdown: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 16 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    breakdownLabel: { fontSize: 14, color: '#666' },
    breakdownValue: { fontSize: 14, color: '#333', fontWeight: '500' },
    breakdownDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
    breakdownTotal: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    breakdownTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },

    infoText: { fontSize: 13, color: '#666', marginBottom: 16, textAlign: 'center' },
    payButton: { paddingVertical: 6 },
    historyButton: { margin: 15 },

    webViewContainer: { flex: 1, backgroundColor: '#fff' },
    webViewHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 48,
      paddingBottom: 8, backgroundColor: '#fff',
      borderBottomWidth: 1, borderBottomColor: '#eee',
    },
    webViewTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    webViewLoading: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center', alignItems: 'center',
    },
  });
})();

// PodcastDetailScreen
export const PodcastDetailScreenStyles = (() => {
  return createScreenStyles({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: '#999',
    },
    header: {
      position: 'relative',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: 30,
    },
    coverImage: {
      width: 250,
      height: 250,
      borderRadius: 16,
    },
    coverPlaceholder: {
      width: 250,
      height: 250,
      borderRadius: 16,
      backgroundColor: '#2196F3',
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      position: 'absolute',
      bottom: 10,
      right: '50%',
      transform: [{ translateX: 40 }],
      backgroundColor: '#fff',
      borderRadius: 50,
      elevation: 4,
    },
    content: {
      padding: 15,
    },
    titleSection: {
      marginBottom: 15,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    date: {
      fontSize: 14,
      color: '#999',
    },
    separator: {
      fontSize: 14,
      color: '#999',
      marginHorizontal: 8,
    },
    duration: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
    },
    speakerCard: {
      marginBottom: 15,
      elevation: 2,
      backgroundColor: '#E3F2FD',
    },
    speakerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    speakerInfo: {
      flex: 1,
    },
    speakerLabel: {
      fontSize: 12,
      color: '#666',
    },
    speakerName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2196F3',
    },
    descriptionCard: {
      marginBottom: 15,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: '#666',
    },
    categoryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    categoryLabel: {
      fontSize: 14,
      color: '#666',
      marginRight: 8,
    },
    categoryChip: {
      backgroundColor: '#FFF3E0',
    },
    categoryText: {
      color: '#FF9800',
      fontWeight: '600',
    },
    tagsContainer: {
      marginBottom: 15,
    },
    tagsLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tag: {
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: '#E3F2FD',
    },
    tagText: {
      fontSize: 12,
      color: '#2196F3',
    },
    attachmentsCard: {
      marginBottom: 15,
      elevation: 2,
    },
    attachmentItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    externalLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      elevation: 2,
    },
    externalLinkText: {
      fontSize: 16,
      color: '#333',
      fontWeight: '600',
      flex: 1,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 8,
      elevation: 2,
    },
    actionButton: {
      alignItems: 'center',
    },
    actionText: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
  });
})();

// PresentationScreen
export const PresentationScreenStyles = (() => {
  const NAVY = COLORS.navy;

  return createScreenStyles({
    root: { flex: 1, backgroundColor: '#0d1f33' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: NAVY,
      paddingTop: (StatusBar.currentHeight ?? 0) + 4,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    backBtn: {
      width: 40, height: 40,
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    headerTitle: {
      color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5,
    },
  });
})();
export const InputTheme = {
  roundness: 12,
  colors: {
    onSurfaceVariant: '#000',
    onSurface: '#000',
    onSurfaceDisabled: '#000',
    primary: '#1976D2',
  },
};
// ProfileEditScreen
export const ProfileEditScreenStyles = (() => {
  return createScreenStyles({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },

    navbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 12,
      paddingTop: (StatusBar.currentHeight ?? 0) + 12,
      backgroundColor: '#252943',
    },
    navSide: { minWidth: 72, paddingHorizontal: 4 },
    navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
    navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    navSave: { fontSize: 15, color: '#A0C878', fontWeight: '700', textAlign: 'right' },

    scrollContainer: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 16, paddingBottom: 40 },

    card: {
      backgroundColor: '#fff', borderRadius: 16,
      padding: 20, marginBottom: 16, elevation: 2,
    },
    sectionTitle: {
      fontSize: 15, fontWeight: '700', color: '#252943',
      marginBottom: 14, borderBottomWidth: 1,
      borderBottomColor: '#EEF2FF', paddingBottom: 8,
    },

    input: { marginBottom: 10, backgroundColor: '#fff', },
    error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },

    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    pickerTitle: { fontSize: 17, fontWeight: '700', color: '#252943', marginBottom: 12 },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    pickerItemActive: { backgroundColor: '#EBF0FA', paddingHorizontal: 8, borderRadius: 8 },
    pickerItemText: { fontSize: 15, color: '#111' },
    pickerItemTextActive: { color: '#252943', fontWeight: '700' },
    pickerEmpty: { textAlign: 'center', color: '#888', paddingVertical: 24 },
    pickerCancel: { marginTop: 12, backgroundColor: '#F0F2F5', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    pickerCancelText: { fontSize: 15, color: '#252943', fontWeight: '600' },

    profileContainer: { alignItems: 'center', marginBottom: 20 },
    profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff' },
    profilePlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#6A5ACD', justifyContent: 'center', alignItems: 'center' },
    profileInitial: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  });
})();

// ProfileScreen
export const ProfileScreenStyles = (() => {
  const NAVY = COLORS.navy;

  const GOLD = COLORS.gold;


  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    header: {
      backgroundColor: NAVY,
      padding: 30,
      alignItems: 'center',
    },

    // ── Photo styles ──
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 3,
      borderColor: GOLD,
    },
    avatarPlaceholder: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: '#6A5ACD',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: GOLD,
    },
    avatarInitial: { fontSize: 36, color: '#fff', fontWeight: 'bold' },

    name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 12 },
    email: { fontSize: 13, color: '#fff', opacity: 0.85, marginTop: 4 },

    card: { margin: 15, elevation: 2 ,  backgroundColor: '#fff', },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: NAVY },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 14, color: '#666' },
    value: { fontSize: 14, fontWeight: '500' },

    actions: { padding: 15, paddingBottom: 40 },
    button: { marginBottom: 10 },
    logoutButton: { marginTop: 20, marginBottom: 30 },
  });
})();

// RaiseFundScreen
// RaiseFundScreen
export const RaiseFundScreenS = (() => {
  const GREEN = COLORS.accent;
  const GREEN_LIGHT = COLORS.selected;

  return createScreenStyles({
    safe: { flex: 1, backgroundColor: '#f5f4f0' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 60 },

    postCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
    badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
    badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
    postTitle: { fontSize: 18, fontWeight: '700', color: '#111', lineHeight: 26, marginBottom: 8 },
    postBody: { fontSize: 14, color: '#555', lineHeight: 22 },

    progressCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
    cardSectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 13, color: '#555' },
    progressPct: { fontSize: 13, fontWeight: '700' },
    progressTrack: { height: 8, backgroundColor: '#f0ede8', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 99 },
    progressGoal: { fontSize: 12, color: '#aaa' },

    statsRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
    stat: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: '700', color: '#111' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: '#f0ede8' },

    memberCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
    memberAvatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    memberName: { fontSize: 15, fontWeight: '600', color: '#111' },
    memberEmail: { fontSize: 12, color: '#888', marginTop: 2 },

    beneficiaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
    beneficiaryText: { fontSize: 14, color: '#333', marginBottom: 6 },

    raiseFundBtn: { backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
    raiseFundBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    secureNote: { fontSize: 12, color: '#aaa', textAlign: 'center' },

    wvHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    wvTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
    wvClose: { padding: 4 },

    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    processingText: { color: '#fff', marginTop: 12, fontSize: 15 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },

    modalGoalBox: { backgroundColor: '#f5f4f0', borderRadius: 14, padding: 14, marginBottom: 20 },
    modalGoalRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center' },
    modalStat: { flex: 1, alignItems: 'center' },
    modalStatVal: { fontSize: 15, fontWeight: '700', color: '#111' },
    modalStatLabel: { fontSize: 11, color: '#888', marginTop: 2 },
    modalStatDivider: { width: 1, height: 32, backgroundColor: '#ddd' },

modalSectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
modalGoalBox: { backgroundColor: '#f5f4f0', borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 20 },
modalGoalRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center' },    quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    quickChip: { flex: 1, minWidth: 70, borderRadius: 10, paddingVertical: 10, backgroundColor: '#f0ede8', alignItems: 'center' },
    quickChipActive: { backgroundColor: GREEN },
    quickChipText: { fontSize: 14, fontWeight: '600', color: '#666' },
    quickChipTextActive: { color: '#fff' },

    amountInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', borderRadius: 12, paddingHorizontal: 14, marginBottom: 20, backgroundColor: '#fafaf8' },
    rupeeSign: { fontSize: 20, fontWeight: '600', color: '#333', marginRight: 6 },
    amountInput: { flex: 1, fontSize: 22, fontWeight: '600', color: '#111', paddingVertical: 14 },
    proceedBtn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    minAmountBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_LIGHT, borderRadius: 8, padding: 10, marginBottom: 14 },
    minAmountText: { fontSize: 13, color: '#5C7A3A', fontWeight: '600' },
  });
})();

// RegistrationPaymentScreen
export const RegistrationPaymentScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#252943', padding: 28, alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    feeCard: { backgroundColor: '#A0C878', margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
    feeLabel: { color: '#252943', fontSize: 13, fontWeight: '600' },
    feeAmount: { color: '#252943', fontSize: 40, fontWeight: 'bold', marginVertical: 4 },
    feeNote: { color: '#252943', fontSize: 12, textAlign: 'center', marginTop: 4 },

    section: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 16, elevation: 1 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#252943', marginBottom: 12 },

    // Profile photo
    photoRow: { flexDirection: 'row', alignItems: 'center' },
    photoPreview: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#252943' },
    photoPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8EFF7', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BBDEFB', borderStyle: 'dashed' },
    photoPlaceholderIcon: { fontSize: 32 },
    photoBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#252943', justifyContent: 'center', alignItems: 'center' },
    photoBadgeText: { fontSize: 10 },
    photoInfo: { marginLeft: 16, flex: 1 },
    photoInfoTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
    photoInfoHint: { fontSize: 12, color: '#888', marginTop: 2 },
    photoOptional: { fontSize: 11, color: '#aaa', marginTop: 4, fontStyle: 'italic' },

    // Razorpay badge
    razorpayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#252943' },
    razorpayIcon: { fontSize: 28 },
    razorpayTitle: { fontSize: 14, fontWeight: '700', color: '#252943' },
    razorpaySubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
    razorpayActive: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#252943', justifyContent: 'center', alignItems: 'center' },
    razorpayActiveText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    // Amount breakdown
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    breakdownLabel: { fontSize: 14, color: '#666' },
    breakdownValue: { fontSize: 14, color: '#333', fontWeight: '500' },
    breakdownDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
    breakdownTotal: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    breakdownTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#252943' },

    button: { backgroundColor: '#252943', margin: 16, borderRadius: 10, padding: 16, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { alignItems: 'center', marginBottom: 30 },
    backLinkText: { color: '#1976D2', fontSize: 14 },

    // WebView
    webViewContainer: { flex: 1, backgroundColor: '#fff' },
    webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    webViewTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    webViewLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },

    // Processing overlay
    processingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    processingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', minWidth: 200 },
    processingText: { marginTop: 16, fontSize: 15, color: '#252943', fontWeight: '600' },
  });
})();

// SetAnnualFeeScreen
export const SetAnnualFeeScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    currentCard: { backgroundColor: '#252943', margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
    currentTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
    currentAmount: { color: '#A0C878', fontSize: 36, fontWeight: 'bold' },
    currentDate: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 },
    form: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#252943', marginBottom: 20 },
    label: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, backgroundColor: '#fafafa' },
    error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },
    dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#fafafa' },
    dateText: { fontSize: 15, color: '#333' },
    datePlaceholder: { fontSize: 15, color: '#aaa' },
    calendarIcon: { fontSize: 18 },
    button: { backgroundColor: '#252943', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
})();

// SignupScreen
// SignupScreen
export const SignupScreenStyles = (() => {
  const GOLD = COLORS.gold;  
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    content: { padding: 20, paddingBottom: 40 },

    // ── Header ──
    header: {
     backgroundColor: '#252943',
      paddingTop: (StatusBar.currentHeight || 0) + 20,
      paddingBottom: 26,
      paddingHorizontal: 20,
      //borderBottomLeftRadius: 24,
     // borderBottomRightRadius: 24,
      alignItems: 'center',
    },
    /*card: {
      width: '100%',
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },*/

    headerBackBtn: {
      position: 'absolute',
      top: (StatusBar.currentHeight || 0) + 14,
      left: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, textAlign: 'center' },

    // ── Card + Field wrapper ──
    
    fieldCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  marginBottom: 12,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  overflow: 'hidden',
},

   input: { backgroundColor: '#fff' },
  button: { marginTop: 20, paddingVertical: 6, borderRadius: 10, backgroundColor: '#252943' },
    buttonLabel: { color: GOLD, fontWeight: '700', fontSize: 16 },   // ← NEW: Register text color

    linkButton: { marginTop: 10 },
    linkButtonLabel: { color: GOLD, fontWeight: '700' },    linkButton: { marginTop: 10 },
    error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },
    helper: { fontSize: 12, color: '#555', marginBottom: 8, marginLeft: 5 },

    // Occupation / Education sections
    sectionBox: { backgroundColor: '#F7F9FC', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E3EAF5' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#252943', marginBottom: 10 },

    // Profile Photo
    photoLabel: { fontSize: 14, fontWeight: '600', color: '#252943', marginBottom: 8, marginTop: 4 },
    photoPickerRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
      padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BBDEFB', borderStyle: 'dashed',
      elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    photoPreview: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ddd' },
    photoPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#BBDEFB', justifyContent: 'center', alignItems: 'center' },
    photoPlaceholderIcon: { fontSize: 28 },
    photoPickerText: { marginLeft: 14, flex: 1 },
    photoPickerTitle: { fontSize: 14, fontWeight: '600', color: '#252943' },
    photoPickerHint: { fontSize: 12, color: '#888', marginTop: 2 },

    // Welcome Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', alignItems: 'center' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#252943', marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
    modalBody: { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    feeBox: { backgroundColor: '#252943', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%', marginBottom: 20 },
    feeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    feeAmount: { color: '#A0C878', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
    feeNote: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
    noFee: { color: '#999', fontSize: 13, marginBottom: 20 },
    proceedBtn: { backgroundColor: '#252943', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
    proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { color: '#1976D2', fontSize: 14 },

    // Terms & Conditions
    termsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    termsSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '88%' },
    termsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    termsTitle: { fontSize: 22, fontWeight: 'bold', color: '#252943' },
    termsCloseButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' },
    termsCloseText: { fontSize: 18, color: '#252943', fontWeight: '700' },
    termsSubtitle: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 14 },
    termsContent: { maxHeight: 260, borderWidth: 1, borderColor: '#E3EAF5', borderRadius: 12, padding: 14, backgroundColor: '#F7F9FC' },
    termsText: { fontSize: 14, color: '#333', lineHeight: 21, marginBottom: 12 },
    termsCheckRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 2 },
    termsCheckText: { flex: 1, fontSize: 14, color: '#252943', fontWeight: '600' },
    disabledButton: { backgroundColor: '#9CA9B8' },

    // Picker modals
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    pickerTitle: { fontSize: 17, fontWeight: '700', color: '#252943', marginBottom: 12 },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    pickerItemActive: { backgroundColor: '#EBF0FA', paddingHorizontal: 8, borderRadius: 8 },
    pickerItemText: { fontSize: 15, color: '#111' },
    pickerItemTextActive: { color: '#252943', fontWeight: '700' },
    pickerEmpty: { textAlign: 'center', color: '#888', paddingVertical: 24 },
    pickerCancel: { marginTop: 12, backgroundColor: '#F0F2F5', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    pickerCancelText: { fontSize: 15, color: '#252943', fontWeight: '600' },
  });
})();

// SplashScreen
export const SplashScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#252943' },
    logo: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: 4 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 30, marginTop: 8 },
    loader: { marginTop: 40 },
  });
})();

// SupportDetailScreen
export const SupportDetailScreenStyles = (() => {
  return createScreenStyles({
    safe: { flex: 1, backgroundColor: '#F7F9FC' },
    fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
    errorText: { fontSize: 15, color: '#718096', marginBottom: 16 },
    backBtn: { backgroundColor: '#252943', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: '#fff', fontWeight: '700' },

    header: {
      backgroundColor: '#252943',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    closeIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff' },

    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    badgeRow: { marginBottom: 14 },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: '#EBF4FF',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: { fontSize: 11, color: '#2B6CB0', fontWeight: '700', letterSpacing: 0.5 },

    titleBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 14 },
    avatarPlaceholder: {
      width: 60, height: 60, borderRadius: 30,
      marginRight: 14, alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { color: '#fff', fontSize: 24, fontWeight: '800' },
    titleMeta: { flex: 1 },
    title: { fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 4 },
    clubName: { fontSize: 13, color: '#4A5568', fontWeight: '500' },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      gap: 8,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 10, color: '#A0AEC0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    statValue: { fontSize: 14, fontWeight: '700', color: '#2D3748', textAlign: 'center' },
    amountValue: { color: '#276749', fontSize: 16 },

    section: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    sectionLabel: { fontSize: 10, color: '#A0AEC0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    sectionText: { fontSize: 15, color: '#2D3748', fontWeight: '600' },
    descriptionText: { fontSize: 14, color: '#4A5568', lineHeight: 22 },

    attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    thumb: {
      width: 90, height: 90, borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    thumbImg: { width: '100%', height: '100%' },
    thumbDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },
    thumbDocIcon: { fontSize: 28 },
    thumbDocName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 4 },

    ...Common.lightbox,
  });
})();

// SupportScreen
const _SupportScreenStyleBundle = (() => {
  return {
    SupportScreenDd: createScreenStyles({
      wrapper: { marginBottom: 20 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
      trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
      triggerError: { borderColor: '#EF4444' },
      triggerText: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
      placeholder: { color: '#CBD5E1' },
      chevron: { fontSize: 10, color: '#94A3B8', marginLeft: 8 },
      errorText: { fontSize: 11, color: '#EF4444', marginTop: 4 },

      // Sheet modal
      overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
      sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '65%', paddingBottom: 30 },
      sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
      sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
      sheetClose: { fontSize: 18, color: '#94A3B8', fontWeight: '700' },
      option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
      optionActive: { backgroundColor: '#EFF6FF' },
      optionText: { flex: 1, fontSize: 15, color: '#334155' },
      optionTextActive: { color: '#1D4ED8', fontWeight: '600' },
      tick: { fontSize: 14, color: '#1D4ED8', fontWeight: '700' },
    }),
    SupportScreenDp: createScreenStyles({
      wrapper: { marginBottom: 20 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
      triggerError: { borderColor: '#EF4444' },
      triggerText: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
      placeholder: { color: '#CBD5E1' },
      icon: { fontSize: 16 },
      errorText: { fontSize: 11, color: '#EF4444', marginTop: 4 },
      overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
      sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
      sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
      sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
      sheetDone: { fontSize: 15, color: '#2563EB', fontWeight: '700' },
      input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
      },
    }),
    SupportScreenFld: createScreenStyles({
      wrapper: { marginBottom: 20 },
      labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
      label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
      req: { color: '#EF4444' },
      counter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
      counterOver: { color: '#EF4444' },
      hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
      error: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
    }),
    SupportScreenInp: createScreenStyles({
      base: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
      focused: { borderColor: '#3B82F6', backgroundColor: '#fff' },
      errored: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
      multiline: { height: 130, paddingTop: 14 },
    }),
    SupportScreenAtt: createScreenStyles({
      pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginRight: 8, marginBottom: 8, maxWidth: 170, borderWidth: 1, borderColor: '#BFDBFE' },
      icon: { fontSize: 14, marginRight: 5 },
      name: { flex: 1, fontSize: 12, color: '#1D4ED8', fontWeight: '500' },
      remove: { fontSize: 12, color: '#EF4444', marginLeft: 6, fontWeight: '800' },
    }),
    SupportScreenFs: createScreenStyles({
      safe: { flex: 1, backgroundColor: '#252943' },
      navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, paddingTop: (StatusBar.currentHeight ?? 0) + 12, backgroundColor: '#252943' },
      navSideBtn: { minWidth: 64, paddingHorizontal: 4, paddingVertical: 4 },
      navCenter: { flex: 1, alignItems: 'center' },
      navTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
      navCancelText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
      navSubmitText: { fontSize: 15, color: '#A0C878', fontWeight: '700', textAlign: 'right' },
      accentBar: { height: 3, backgroundColor: '#A0C878', opacity: 0.3 },
      scroll: { flex: 1, backgroundColor: '#FAFBFC' },
      scrollContent: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 52 },
      attachHint: { fontSize: 11, color: '#94A3B8', marginTop: 6 },

      // Grid-style attachment area
      attachGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80, alignItems: 'center' },
      gridThumb: { width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
      gridImg: { width: '100%', height: '100%' },
      gridDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
      gridDocIcon: { fontSize: 24 },
      gridDocName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
      gridRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
      gridRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
      gridAddBtn: { width: 80, height: 80, borderRadius: 10, margin: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
      gridAddIcon: { fontSize: 22, marginBottom: 2 },
      gridAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },

      // File viewer
      ...Common.lightbox,
    }),
    SupportScreenS: createScreenStyles({
      safe: { flex: 1, backgroundColor: '#F7F9FC' },

      headerBar: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
      headerTitle: { fontSize: 20, fontWeight: '700', color: '#252943' },
      fab: { position: 'absolute', bottom: 24, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: '#252943', alignItems: 'center', justifyContent: 'center', elevation: 4, zIndex: 100 },
      fabText: { color: '#A0C878', fontSize: 24, fontWeight: '700', lineHeight: 28 },
      loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
      loadingOverlayText: { color: '#fff', marginTop: 12, fontSize: 15, fontWeight: '600' },

      tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
      tabBarContent: { paddingHorizontal: 10 },
      tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
      tabActive: { borderBottomColor: '#2563EB' },
      tabLabel: { fontSize: 13, fontWeight: '500', color: '#A0AEC0' },
      tabLabelActive: { color: '#2563EB', fontWeight: '700' },

      content: { flex: 1 },
      tabPanel: { flex: 1 },
      list: { padding: 16, paddingBottom: 40 },

      card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 16, shadowColor: '#1A202C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
      cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
      photo: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
      photoPlaceholder: { width: 52, height: 52, borderRadius: 26, marginRight: 14, alignItems: 'center', justifyContent: 'center' },
      photoPlaceholderText: { color: '#fff', fontSize: 20, fontWeight: '800' },
      textContainer: { flex: 1 },
      titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
      title: { fontSize: 15, fontWeight: '700', color: '#1A202C', flex: 1 },
      badge: { backgroundColor: '#EBF4FF', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 },
      badgeText: { fontSize: 10, color: '#2B6CB0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
      personName: { fontSize: 13, fontWeight: '500', color: '#4A5568', marginBottom: 4 },
      description: { fontSize: 13, color: '#718096', lineHeight: 18 },
      metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
      amount: { fontSize: 13, fontWeight: '700', color: '#276749' },
      company: { fontSize: 11, color: '#A0AEC0', backgroundColor: '#F7FAFC', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
      date: { fontSize: 11, color: '#A0AEC0' },

      centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
      emptyIcon: { fontSize: 40, marginBottom: 12 },
      emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
      emptyText: { fontSize: 14, color: '#A0AEC0' },
      loadingText: { color: '#718096', marginTop: 10, fontSize: 14 },
      cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: '#BFDBFE' },
      deleteBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: '#FECACA' },
      editText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
      deleteText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },

      iconBotton: {
        marginLeft: 8,
      },
       fab: Common.fab({ zIndex: 100 }),
     fabText: Common.fabText,
      // Add this new one:
      cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    }),
  };
})();
export const SupportScreenDd = _SupportScreenStyleBundle.SupportScreenDd;
export const SupportScreenDp = _SupportScreenStyleBundle.SupportScreenDp;
export const SupportScreenFld = _SupportScreenStyleBundle.SupportScreenFld;
export const SupportScreenInp = _SupportScreenStyleBundle.SupportScreenInp;
export const SupportScreenAtt = _SupportScreenStyleBundle.SupportScreenAtt;
export const SupportScreenFs = _SupportScreenStyleBundle.SupportScreenFs;
export const SupportScreenS = _SupportScreenStyleBundle.SupportScreenS;

// UserProfileScreen
export const UserProfileScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#252943' },
    list: { flex: 1, backgroundColor: '#F0F2F5' },
    listContent: { paddingBottom: 20 },
    emptyContent: { flexGrow: 1 },

    appHeader: {
      backgroundColor: '#252943',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 44,
      paddingBottom: 10,
    },
    backBtn: { padding: 6 },
    backIcon: { fontSize: 22, color: '#fff', fontWeight: '700' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },

    profileCard: {
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 20,
      marginBottom: 8,
      alignItems: 'center',
    },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 12,
    },
    avatarPhoto: {
      width: 80, height: 80, borderRadius: 40,
      marginBottom: 12,
      borderWidth: 3,
      borderColor: '#A0C878',
    },
    avatarLetter: { color: '#A0C878', fontSize: 32, fontWeight: '800' },
    nameRow: { alignItems: 'center', marginBottom: 16 },
    nameClubWrap: { alignItems: 'center', marginBottom: 12 },
    memberName: { fontSize: 20, fontWeight: '800', color: '#252943' },
    clubName: { fontSize: 13, fontWeight: '600', color: '#888', marginTop: 2 },

    actionBtns: { flexDirection: 'row', gap: 10 },
    actionBtn: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 22,
      minWidth: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageBtn: { backgroundColor: '#252943' },
    mailBtn: { backgroundColor: '#A0C878' },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    postsLabelWrap: {
      alignSelf: 'stretch',
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
      paddingTop: 12,
      marginTop: 4,
    },
    postsLabel: { fontSize: 14, fontWeight: '700', color: '#252943' },

    // ── Post card (mirrors home feed card, plus optional delete icon) ──
    card: {
      backgroundColor: '#fff',
      marginHorizontal: 12,
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      paddingBottom: 14,
    },
    cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 0 },
    cardAvatar: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: '#252943',
      justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    cardAvatarLetter: { color: '#A0C878', fontSize: 16, fontWeight: '800' },
    cardTopTexts: { flex: 1 },
    cardMemberName: { fontSize: 14, fontWeight: '700', color: '#222' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    typePill: {
      backgroundColor: '#EEF1F5', borderRadius: 6,
      paddingHorizontal: 6, paddingVertical: 1,
    },
    typePillText: { fontSize: 11, color: '#555' },
    metaDot: { fontSize: 12, color: '#aaa', marginHorizontal: 5 },
    metaTime: { fontSize: 11, color: '#999' },

    deleteBtn: { padding: 6, marginLeft: 6 },
    deleteIcon: { fontSize: 18 },

    cardBody: { fontSize: 14, color: '#333', marginTop: 10, lineHeight: 19, paddingHorizontal: 14 },

    postImage: {
      width: '100%',
      height: 320,
      marginTop: 12,
      backgroundColor: '#eee',
    },

    cardFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      marginTop: 12, paddingTop: 10, paddingHorizontal: 14,
      borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    footerStat: { fontSize: 12, color: '#888' },

    footerLoader: { padding: 18, alignItems: 'center' },
    endWrap: { alignItems: 'center', paddingVertical: 20 },
    endText: { fontSize: 13, color: '#aaa' },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },

    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 40, marginBottom: 10 },
    emptyText: { fontSize: 15, color: '#888' },
  });

})();
export const PaymentReportsScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
 
    header: {
      backgroundColor: '#252943',
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 44,
      paddingBottom: 14,
      paddingHorizontal: 14,
    },
    backBtn: { padding: 6, marginRight: 6 },
    backIcon: { fontSize: 22, color: '#fff', fontWeight: '700' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
 
    scrollContent: { padding: 16, paddingBottom: 40 },
 
    pickerBlock: { marginBottom: 18 },
    pickerLabel: { fontSize: 14, fontWeight: '700', color: '#252943', marginBottom: 8 },
 
    monthRow: { marginBottom: 8 },
    monthChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 18, backgroundColor: '#fff',
      borderWidth: 1, borderColor: '#E2E8F0',
      marginRight: 8,
    },
    monthChipActive: { backgroundColor: '#252943', borderColor: '#252943' },
    monthChipText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    monthChipTextActive: { color: '#fff' },
 
    yearRow: {},
    yearChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 18, backgroundColor: '#fff',
      borderWidth: 1, borderColor: '#E2E8F0',
      marginRight: 8,
    },
    yearChipActive: { backgroundColor: '#A0C878', borderColor: '#A0C878' },
    yearChipText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    yearChipTextActive: { color: '#252943' },
 
    getBtn: {
      backgroundColor: '#252943',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 20,
    },
    getBtnDisabled: { opacity: 0.6 },
    getBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
 
    resultsWrap: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
 
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 12,
    },
    summaryText: { fontSize: 13, color: '#64748B' },
    summaryTotal: { fontSize: 15, fontWeight: '800', color: '#252943' },
 
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 2, borderBottomColor: '#252943',
      paddingBottom: 8, marginBottom: 4,
    },
    cellHeader: { fontSize: 12, fontWeight: '800', color: '#252943' },
 
    tableRow: { flexDirection: 'row', paddingVertical: 10 },
    rowSeparator: { height: 1, backgroundColor: '#F1F5F9' },
    cell: { fontSize: 13, color: '#334155' },
    cellSNo:   { width: 40 },
    cellName:  { flex: 1, paddingRight: 6 },
    cellDate:  { width: 80 },
    cellAmount:{ width: 70, textAlign: 'right', fontWeight: '700', color: '#252943' },
 
    downloadBtn: {
      backgroundColor: '#27AE60',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 18,
    },
    downloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
})();
export const ClubDetailScreenStyles = {
  safe: { flex: 1, backgroundColor: '#fff' },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 15, color: '#64748B', marginBottom: 12 },
  backBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#252943', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#252943', paddingHorizontal: 12, paddingVertical: 14,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { color: '#fff', fontSize: 20, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeInactive: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextActive: { color: '#15803D' },
  badgeTextInactive: { color: '#B91C1C' },
  typePill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typePillText: { fontSize: 11, fontWeight: '600', color: '#334155' },

  titleBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 14, backgroundColor: '#F1F5F9' },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32, marginRight: 14,
    backgroundColor: '#252943', alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 26, fontWeight: '700' },
  titleMeta: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700', color: '#0F172A' },
  clubCode: { fontSize: 13, color: '#64748B', marginTop: 2 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  statBox: {
    flex: 1, minWidth: 90, backgroundColor: '#F8FAFC', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#334155', lineHeight: 21 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, color: '#334155', flexShrink: 1 },
  linkText: { color: '#252943' },
};

// MemberDashboardScreen
// MemberDashboardScreen
export const MemberDashboardScreenStyles = (() => {
  return createScreenStyles({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    scrollContent: { paddingBottom: 24 },

    // IME header
    appHeader: {
  backgroundColor: '#252943',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 14,
  paddingTop: 44,
  paddingBottom: 10,
},
headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginRight: 8,
},
headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
},
iconBtn: {
  padding: 8,
  marginLeft: 4,
  alignItems: 'center',
  justifyContent: 'center',
},
iconBtnText: {
  fontSize: 20,
  textAlign: 'center',
},
kebabIcon: {
  fontSize: 22,
  color: '#fff',
  fontWeight: '700',
  textAlign: 'center',
},
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#A0C878',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    logoText: { color: '#252943', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    appName: { color: '#fff', fontSize: 13, fontWeight: '700' },
    appTagline: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
    backBtn: { padding: 8 },
    backIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },

    // Header right (notification + kebab menu)
  
    
   
    menuContent: { backgroundColor: '#fff', borderRadius: 10, elevation: 8, minWidth: 200 },
    menuItemText: { fontSize: 14, color: '#222' },
    menuSep: { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 12, marginVertical: 4 },

    // Welcome strip
    welcomeStrip: {
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
      elevation: 1,
    },
    welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#252943' },
    welcomeSub: { fontSize: 13, color: '#888', marginTop: 2 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 4, justifyContent: 'space-between' },
    card: { width: '48%', marginBottom: 14 },
    cardInner: { elevation: 2, backgroundColor: '#fff' },
    cardContent: { alignItems: 'center', paddingVertical: 20 },
    icon: { fontSize: 36, marginBottom: 8 },
    cardTitle: { fontSize: 13, textAlign: 'center', color: '#252943' },
     lawBotCard: {
      backgroundColor: '#ffffff',
      marginHorizontal: 11,
      marginBottom: 8,
      borderRadius: 10,
      padding: 12,
      borderWidth: 0.9,
      borderColor: '#5da1e6',
    },
    lawBotTitle: { fontSize: 14, fontWeight: '700', color: '#252943' },
    lawBotSubtitle: { fontSize: 12, color: '#33A4FA', marginTop: 3 },
  });
})();
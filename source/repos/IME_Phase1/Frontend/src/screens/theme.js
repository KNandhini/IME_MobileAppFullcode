// Central IME design system. Keep application chrome and shared components
// connected to these semantic tokens instead of declaring local brand colors.
export const COLORS = {
  primary: '#4379F2',
  secondary: '#33A4FA',
  dark: '#252943',
  accent: '#A0C878',

  // Backward-compatible semantic aliases used by existing screens.
  navy: '#252943',
  gold: '#F7AD19',
  green: '#A0C878',
  blue: '#4379F2',
  skyBlue: '#33A4FA',

  bg: '#F7F8FF',
  bgAlt: '#F4F6FF',
  bgSoft: '#F8FAFF',
  white: '#FFFFFF',

  text: '#252943',
  textSecondary: '#33A4FA',
  textMuted: '#6F7892',
  grey: '#81899E',
  placeholder: '#9299AA',
  disabled: '#CBD5E1',

  border: '#E0E4F2',
  borderSoft: '#EDF0F8',

  success: '#A0C878',
  successAlt: '#789F52',
  danger: '#EF4444',
  dangerAlt: '#DC2626',
  crimson: '#B91C1C',
  warning: '#A0C878',
  info: '#33A4FA',
  infoLight: '#EEF7FE',

  headerStart: '#33A4FA',
  headerEnd: '#252943',
  fabBackground: '#252943',
  fabIcon: '#A0C878',
  focus: '#4379F2',
  pressed: '#252943',
  selected: '#F0F6E9',
  tableAlternate: '#F7F8FF',
  inactive: '#9299AA',

  overlay: 'rgba(37,41,67,0.45)',
  overlayDark: 'rgba(37,41,67,0.65)',
  lightboxBg: 'rgba(37,41,67,0.95)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 20,
  circle: 9999,
};

export const FONT = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  title: 18,
  h2: 20,
  h1: 22,
};

export const SHADOW = {
  sm: {
    elevation: 1,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  md: {
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  lg: {
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};

export const COMPONENTS = {
  screen: { flex: 1, backgroundColor: COLORS.bg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, ...SHADOW.md },
  primaryButton: {
    minHeight: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
};

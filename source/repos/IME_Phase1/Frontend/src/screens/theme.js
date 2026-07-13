// theme.js
// Single source of truth for design tokens used across every screen.
// Import COLORS / SPACING / RADIUS / SHADOW instead of re-declaring hex
// values or magic numbers inside each screen's style file.

export const COLORS = {
  // Brand
  navy: '#1E3A5F',
  gold: '#D4A017',

  // Backgrounds
  bg: '#F0F4F8',        // standard screen background
  bgAlt: '#F5F7FA',     // list/card background alt
  bgSoft: '#F7F9FC',    // form background
  white: '#FFFFFF',

  // Text
  text: '#1E293B',
  textSecondary: '#334155',
  textMuted: '#64748B',
  grey: '#6B7A8D',
  placeholder: '#94A3B8',
  disabled: '#CBD5E1',

  // Borders
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',

  // Status
  success: '#27AE60',
  successAlt: '#2D9B6F',
  danger: '#EF4444',
  dangerAlt: '#E74C3C',
  crimson: '#C0392B',
  warning: '#F59E0B',
  info: '#2563EB',
  infoLight: '#EFF6FF',

  // Overlays
  overlay: 'rgba(0,0,0,0.4)',
  overlayDark: 'rgba(0,0,0,0.5)',
  lightboxBg: 'rgba(0,0,0,0.92)',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const RADIUS = { xs: 4, sm: 8, md: 10, lg: 12, xl: 16, pill: 20, circle: 9999 };

export const FONT = {
  xs: 11, sm: 12, md: 13, base: 14, lg: 15, xl: 16, title: 18, h2: 20, h1: 22,
};

// Reusable elevation/shadow presets (RN needs both `elevation` for Android
// and `shadow*` for iOS).
export const SHADOW = {
  sm: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  md: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  lg: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};
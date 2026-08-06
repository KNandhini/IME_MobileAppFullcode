import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../screens/theme';

/** Shared horizontal header background; preserves the caller's layout styles. */
export default function GradientHeader({ children, style, ...props }) {
  return (
    <LinearGradient
      colors={[COLORS.headerStart, COLORS.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.header, style]}
      {...props}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
});

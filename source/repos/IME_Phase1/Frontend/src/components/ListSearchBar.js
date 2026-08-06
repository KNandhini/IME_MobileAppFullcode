import React from 'react';
import { Searchbar } from 'react-native-paper';
import { COLORS, RADIUS, SHADOW, SPACING } from '../screens/theme';

export default function ListSearchBar({ value, onChangeText, placeholder }) {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={{
        margin: SPACING.md,
        marginBottom: SPACING.sm,
        minHeight: 52,
        borderRadius: RADIUS.xl,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.md,
      }}
      iconColor={COLORS.secondary}
      placeholderTextColor={COLORS.placeholder}
      inputStyle={{ fontSize: 15, color: COLORS.textPrimary }}
    />
  );
}

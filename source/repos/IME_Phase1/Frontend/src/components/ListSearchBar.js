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
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        ...SHADOW.sm,
      }}
      iconColor={COLORS.secondary}
      placeholderTextColor={COLORS.placeholder}
      inputStyle={{ fontSize: 14, color: COLORS.text }}
    />
  );
}

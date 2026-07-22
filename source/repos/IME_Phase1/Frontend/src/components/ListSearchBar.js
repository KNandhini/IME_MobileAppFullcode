import React from 'react';
import { Searchbar } from 'react-native-paper';

export default function ListSearchBar({ value, onChangeText, placeholder }) {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={{ margin: 12, marginBottom: 6, elevation: 2, borderRadius: 10, backgroundColor: '#fff' }}
      inputStyle={{ fontSize: 14 }}
    />
  );
}

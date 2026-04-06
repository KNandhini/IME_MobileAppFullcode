import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen = () => (
  <View style={styles.container}>
    <Text style={styles.logo}>IME</Text>
    <Text style={styles.subtitle}>Institution of Municipal Engineering</Text>
    <ActivityIndicator size="large" color="#D4A017" style={styles.loader} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A5F' },
  logo:     { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 30, marginTop: 8 },
  loader:   { marginTop: 40 },
});

export default SplashScreen;

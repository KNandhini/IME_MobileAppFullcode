import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IME</Text>
      <Text style={styles.subtitle}>Institution of Municipal Engineering</Text>
      <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 30,
  },
});

export default SplashScreen;

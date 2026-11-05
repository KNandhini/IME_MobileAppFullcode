import { COLORS } from './theme';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/IMEText';
import { SplashScreenStyles as styles } from './screenStyles';

const SplashScreen = () => (
  <View style={styles.container}>
    <Text style={styles.logo}>IUE</Text>
    <Text style={styles.subtitle}>Institution of Urban Engineering</Text>
    <ActivityIndicator size="large" color={COLORS.accent} style={styles.loader} />
  </View>
);



export default SplashScreen;

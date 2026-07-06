import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const GOLD = '#D4A017';

const IMELogo = ({ size = 'large', animated = true }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: animated ? 700 : 0,
      useNativeDriver: true,
    }).start();
  }, []);

  const isSmall = size === 'small';
  const logoSize = isSmall ? 74 : 130;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={require('../../assets/logo_transparent.png')}
        style={{ width: logoSize, height: logoSize, marginBottom: 10 }}
        resizeMode="contain"
      />

      <Text style={[styles.acronym, { fontSize: isSmall ? 14 : 22 }]}>IME</Text>

      <Text style={[styles.fullName, { fontSize: isSmall ? 9 : 12 }]}>
        Institute of Municipal Engineers
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  acronym: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 2,
  },
  fullName: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default IMELogo;
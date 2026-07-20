import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const GOLD = '#D4AF37'; // Government Gold — aligned with theme.js accent

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
  const logoSize = isSmall ? 74 : 96;
  const circleSize = isSmall ? 88 : 132;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
        <Image
          source={require('../../assets/logo-clean.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </View>

      {!isSmall && (
        <>
          <Text style={styles.orgName}>
            Institution of Municipal Engineers
          </Text>

          <Text style={styles.systemName}>
            Professional Management Platform
          </Text>

          <Text style={styles.govLine}>
            One Community. One Vision. Better Cities.
          </Text>

        </>
      )}

      {isSmall && <Text style={styles.acronym}>IME</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0A1E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  acronym: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 4,
    fontSize: 14,
    marginTop: 2,
  },
  orgName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  systemName: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
    fontSize: 11.5,
    marginTop: 3,
    textAlign: 'center',
  },
  govLine: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default IMELogo;

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
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

  const isSmall  = size === 'small';
  const iconSize = isSmall ? 28 : 44;
  const ringSize = isSmall ? 74 : 110;
  const innerSize = isSmall ? 56 : 86;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Outer ring */}
      <View style={[styles.outerRing, {
        width: ringSize, height: ringSize, borderRadius: ringSize / 2,
      }]}>
        {/* Inner glow circle */}
        <View style={[styles.innerCircle, {
          width: innerSize, height: innerSize, borderRadius: innerSize / 2,
        }]}>
          <MaterialCommunityIcons name="city-variant-outline" size={iconSize} color={GOLD} />
        </View>

        {/* Decorative dots */}
        <View style={[styles.dot, { top: 4, left: ringSize / 2 - 3 }]} />
        <View style={[styles.dot, { bottom: 4, left: ringSize / 2 - 3 }]} />
        <View style={[styles.dot, { left: 4, top: ringSize / 2 - 3 }]} />
        <View style={[styles.dot, { right: 4, top: ringSize / 2 - 3 }]} />
      </View>

      {/* IMC acronym with gold bars */}
      <View style={styles.textRow}>
        <View style={styles.goldBar} />
        <Text style={[styles.acronym, { fontSize: isSmall ? 14 : 22 }]}>IMC</Text>
        <View style={styles.goldBar} />
      </View>

      {/* Full name */}
      <Text style={[styles.fullName, { fontSize: isSmall ? 9 : 12 }]}>
        Indian Municipal Corporation
      </Text>

      {!isSmall && (
        <Text style={styles.tagline}>Serving Cities · Building Futures</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  outerRing: {
    backgroundColor: NAVY,
    borderWidth: 2.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
    elevation: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  innerCircle: {
    backgroundColor: 'rgba(212,160,23,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goldBar: {
    width: 20,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
    marginHorizontal: 8,
  },
  acronym: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 4,
  },
  fullName: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default IMELogo;

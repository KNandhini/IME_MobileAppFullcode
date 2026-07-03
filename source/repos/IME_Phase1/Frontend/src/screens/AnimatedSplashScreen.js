import React, { useEffect, useMemo, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Easing,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const COLORS = {
    navy: '#123663',
    indigo: '#2F2F63',
    plum: '#4A2354',
    goldBright: '#FFF3D6',
    darkGold: '#C9A227',
};

const SPARKLE_COUNT = 12;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function AnimatedSplashScreen({ onFinish, onReady }) {
    const { width, height } = useWindowDimensions();

    const layout = useMemo(() => {
        const shortSide = Math.min(width, height);
        const scale = clamp(shortSide / 375, 0.82, 1.3);

        const logoSize = clamp(200 * scale, 118, 236);
        const maxSparkleRadius = Math.max(70, shortSide / 2 - 36);
        const sparkleRadius = Math.min(logoSize * 0.66, maxSparkleRadius);

        return {
            logoSize,
            sparkleRadius,
            sparkleStep: clamp(10 * scale, 6, 14),
            titleSize: clamp(27 * scale, 20, 32),
        };
    }, [width, height]);

    const logoScale = useRef(new Animated.Value(0.85)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(14)).current;

    const screenFade = useRef(new Animated.Value(1)).current;
    const screenScale = useRef(new Animated.Value(1)).current;

    const sparkleAnims = useRef(
        Array.from({ length: SPARKLE_COUNT }, () => new Animated.Value(0)),
    ).current;

    // Tell the parent (App.js) that this screen has actually painted a frame,
    // so the native splash screen can be hidden without a white gap showing
    // between it and this gradient.
    useEffect(() => {
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => {
                onReady && onReady();
            });
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf1);
    }, []);

    useEffect(() => {
        const activeLoops = [];

        Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 520,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 55,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        sparkleAnims.forEach((anim) => {
            const delay = 700 + Math.random() * 700;
            let cancelled = false;

            const loop = () => {
                if (cancelled) return;

                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 600 + Math.random() * 300,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 600 + Math.random() * 300,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]).start(() => loop());
            };

            loop();

            activeLoops.push(() => {
                cancelled = true;
            });
        });

        Animated.sequence([
            Animated.delay(750),
            Animated.parallel([
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 450,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(titleTranslate, {
                    toValue: 0,
                    duration: 450,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        const exitTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(screenFade, {
                    toValue: 0,
                    duration: 480,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(screenScale, {
                    toValue: 1.06,
                    duration: 480,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (onFinish) {
                    onFinish();
                }
            });
        }, 3200);

        return () => {
            clearTimeout(exitTimer);
            activeLoops.forEach((cancel) => cancel());
        };
    }, []);

    return (
        <Animated.View
            style={[
                StyleSheet.absoluteFill,
                {
                    opacity: screenFade,
                    transform: [{ scale: screenScale }],
                },
            ]}
        >
            <StatusBar style="light" hidden animated />

            <LinearGradient
                colors={[COLORS.navy, COLORS.indigo, COLORS.plum]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
            >
                <View style={styles.center}>
                    {sparkleAnims.map((anim, i) => {
                        const angle = (2 * Math.PI * i) / SPARKLE_COUNT;
                        const radius =
                            layout.sparkleRadius + (i % 3) * layout.sparkleStep;

                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle) * 0.9;

                        return (
                            <Animated.View
                                key={i}
                                pointerEvents="none"
                                style={[
                                    styles.sparkle,
                                    {
                                        opacity: anim,
                                        transform: [
                                            { translateX: x },
                                            { translateY: y },
                                            {
                                                scale: anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.4, 1.1],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            />
                        );
                    })}

                    <Animated.Image
                        source={require('../../assets/logo_transparent.png')}
                        style={[
                            styles.logo,
                            {
                                width: layout.logoSize,
                                height: layout.logoSize,
                                opacity: logoOpacity,
                                transform: [{ scale: logoScale }],
                            },
                        ]}
                        resizeMode="contain"
                    />

                    <Animated.Text
                        style={[
                            styles.title,
                            {
                                fontSize: layout.titleSize,
                                opacity: titleOpacity,
                                transform: [{ translateY: titleTranslate }],
                            },
                        ]}
                    >
                        IME
                    </Animated.Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {},
    sparkle: {
        position: 'absolute',
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: COLORS.goldBright,
    },
    title: {
        marginTop: 22,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 6,
        color: COLORS.darkGold,
    },
});
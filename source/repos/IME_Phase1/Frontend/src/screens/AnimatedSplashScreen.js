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
import { Audio } from 'expo-av';
import { AnimatedSplashScreenStyles as styles } from './screenStyles';

const COLORS = {
    navy: '#123663',
    indigo: '#2F2F63',
    plum: '#4A2354',
    goldBright: '#FFF3D6',
    darkGold: '#C9A227',
};

const SPARKLE_COUNT = 12;

// Music starts as soon as it's loaded (t=0). The logo waits this long
// AFTER that before it appears, so the music plays alone for 1s first.
const MUSIC_LEAD_MS = 1000;
const LOGO_START_DELAY_MS = MUSIC_LEAD_MS;

// How long the logo + music play together (after the logo appears)
// before the fade-out begins.
const SYNCED_PLAY_DURATION_MS = 7520;

// Total time-on-screen before the exit (fade-out) animation starts.
// = 1s music-alone lead-in + 6s logo-and-music-together.
const SPLASH_DURATION_MS = LOGO_START_DELAY_MS + SYNCED_PLAY_DURATION_MS;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function AnimatedSplashScreen({ onFinish, onReady, onExitStart }) {
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

    // Ref to the loaded background music Sound object
    const soundRef = useRef(null);

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

    // Load and immediately play the background music — this starts the
    // instant it's ready, 1 full second BEFORE the logo begins appearing.
    useEffect(() => {
        let isMounted = true;

        const loadAndPlay = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });

                const { sound } = await Audio.Sound.createAsync(
                    require('../assets/audio/splash-theme.mp3'),
                    { shouldPlay: true, volume: 1.0 },
                );

                if (!isMounted) {
                    await sound.unloadAsync();
                    return;
                }

                soundRef.current = sound;
            } catch (e) {
                console.warn('Splash audio failed to load/play:', e.message);
            }
        };

        loadAndPlay();

        return () => {
            isMounted = false;
            if (soundRef.current) {
                soundRef.current.stopAsync().catch(() => {});
                soundRef.current.unloadAsync().catch(() => {});
                soundRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const activeLoops = [];

        Animated.sequence([
            Animated.delay(LOGO_START_DELAY_MS),
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
            // Shifted forward by LOGO_START_DELAY_MS so sparkles still feel
            // staged relative to the logo, not relative to raw mount time.
            const delay = LOGO_START_DELAY_MS + 700 + Math.random() * 700;
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
            // Shifted forward by LOGO_START_DELAY_MS so the title still
            // appears just after the logo, not before it.
            Animated.delay(LOGO_START_DELAY_MS + 750),
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
    const FADE_MS = 1000;   // 1 full second of fade — matches screen fade
    const STEP_MS = 40;
    const fadeSteps = Math.round(FADE_MS / STEP_MS);

    let step = 0;
    const MIN_VOLUME = 0.0001;
    const startVolume = 1.0;

    const volumeInterval = setInterval(() => {
        step += 1;
        const t = Math.min(1, step / fadeSteps);
        const nextVolume = startVolume * Math.pow(MIN_VOLUME / startVolume, t);

        if (soundRef.current) {
            soundRef.current.setVolumeAsync(t >= 1 ? 0 : nextVolume).catch(() => {});
        }

        if (step >= fadeSteps) {
            clearInterval(volumeInterval);
            if (soundRef.current) {
                soundRef.current.stopAsync().catch(() => {});
            }
        }
    }, STEP_MS);

    // Audio fade and screen fade start together and both last 1000ms,
    // so both music and visuals finish at the exact same instant: t=9s.
    if (onExitStart) {
        onExitStart();
    }

    Animated.parallel([
        Animated.timing(screenFade, {
            toValue: 0,
            duration: FADE_MS,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
            toValue: 1.06,
            duration: FADE_MS,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }),
    ]).start(() => {
        clearInterval(volumeInterval);
        if (soundRef.current) {
            soundRef.current.unloadAsync().catch(() => {});
            soundRef.current = null;
        }
        if (onFinish) {
            onFinish();
        }
    });
}, SPLASH_DURATION_MS);

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


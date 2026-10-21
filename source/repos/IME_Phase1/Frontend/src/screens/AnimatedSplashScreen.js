import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS } from './theme';
import IMELogo from '../components/IMELogo';

// File location: Frontend/assets/video/rainwater_circular_transparent.webm
const SPLASH_VIDEO = require('../../assets/video/rainwater_circular_transparent.webm');

// Static logo shown for the hold after the video ends.
// File location: Frontend/assets/logo-clean.png (change if you want a different image)
const HOLD_LOGO = require('../../assets/logo-clean.png');

// true  = after the video ends, show HOLD_LOGO for HOLD_MS (reliable)
// false = keep the video's own last frame on screen for HOLD_MS
const HOLD_WITH_STATIC_LOGO = true;

// Video frame size as a fraction of the screen's short side (1 = full width).
const VIDEO_SIZE_RATIO = 1;

// Circular clip as a fraction of the video frame. Android draws the video's
// transparent pixels as black, so this cuts away the black corners and ring.
const CLIP_SCALE = 0.95;

// After the video ends, the logo stays visible this long before login opens.
// 5000 = 5 seconds.
const HOLD_MS = 5000;
// Fade-out length. Matches the 480 ms fade-in of LoginScreen.
const FADE_MS = 480;

// Treat the video as ended when this close to its duration (seconds).
const END_TOLERANCE_S = 0.2;

// Safety nets so the app can never get stuck:
const READY_FALLBACK_MS = 1500; // hide native splash even if first frame never fires
const MAX_VIDEO_MS = 13000;     // video is ~10.05s long; move on if it stalls

export default function AnimatedSplashScreen({ onFinish, onReady, onExitStart }) {
    const { width, height } = useWindowDimensions();
    const size = Math.round(Math.min(width, height) * VIDEO_SIZE_RATIO);
    const clipSize = Math.round(size * CLIP_SCALE);

    const [failed, setFailed] = useState(false);
    const [holding, setHolding] = useState(false);
    const fade = useRef(new Animated.Value(1)).current;

    // Always call the latest callbacks without re-subscribing listeners.
    const callbacks = useRef({ onFinish, onReady, onExitStart });
    callbacks.current = { onFinish, onReady, onExitStart };

    const readySent = useRef(false);
    const holdStarted = useRef(false);
    const exited = useRef(false);
    const finished = useRef(false);
    const holdTimer = useRef(null);
    const finishTimer = useRef(null);

    const signalReady = useCallback(() => {
        if (readySent.current) return;
        readySent.current = true;
        callbacks.current.onReady && callbacks.current.onReady();
    }, []);

    const finishOnce = useCallback(() => {
        if (finished.current) return;
        finished.current = true;
        callbacks.current.onFinish && callbacks.current.onFinish();
    }, []);

    // After the hold: tell the app the exit starts (login fades in), fade out, then finish.
    const exit = useCallback(() => {
        if (exited.current) return;
        exited.current = true;
        console.log('[Splash] hold finished (' + Date.now() + '), opening login');
        callbacks.current.onExitStart && callbacks.current.onExitStart();
        Animated.timing(fade, {
            toValue: 0,
            duration: FADE_MS,
            useNativeDriver: true,
        }).start(({ finished: done }) => {
            if (done) finishOnce();
        });
        // Fallback in case the animation callback never fires.
        finishTimer.current = setTimeout(finishOnce, FADE_MS + 400);
    }, [fade, finishOnce]);

    const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
        p.loop = false;   // play exactly once
        p.muted = false;  // keep the video's own audio track
        p.volume = 1.0;
        p.timeUpdateEventInterval = 0.2;
        try {
            p.audioMixingMode = 'doNotMix'; // take audio focus on Android
        } catch (e) {
            // not available on this expo-video version: safe to ignore
        }
        p.play();
    });

    // Starts the hold. Runs once, whether the video ended, failed or stalled.
    const startHold = useCallback(() => {
        if (holdStarted.current) return;
        holdStarted.current = true;
        console.log('[Splash] video ended, logo hold started (' + Date.now() + ')');
        signalReady();
        try {
            player.pause(); // freeze, so nothing restarts or blanks the frame
        } catch (e) {
            // player may already be released: safe to ignore
        }
        setHolding(true);
        holdTimer.current = setTimeout(exit, HOLD_MS);
    }, [exit, signalReady, player]);

    useEffect(() => {
        const endSub = player.addListener('playToEnd', startHold);

        // Backup end detection in case 'playToEnd' is late or never fires on Android.
        const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
            const duration = player.duration;
            if (duration > 0 && currentTime >= duration - END_TOLERANCE_S) {
                startHold();
            }
        });

        const statusSub = player.addListener('statusChange', ({ status, error }) => {
            if (status === 'error') {
                console.warn('Splash video failed:', error && error.message);
                setFailed(true);
                startHold();
            }
        });
        const readyTimer = setTimeout(signalReady, READY_FALLBACK_MS);
        const maxTimer = setTimeout(startHold, MAX_VIDEO_MS);

        return () => {
            endSub.remove();
            timeSub.remove();
            statusSub.remove();
            clearTimeout(readyTimer);
            clearTimeout(maxTimer);
        };
    }, [player, startHold, signalReady]);

    // Clean up the hold and finish timers on unmount.
    useEffect(() => {
        return () => {
            clearTimeout(holdTimer.current);
            clearTimeout(finishTimer.current);
        };
    }, []);

    const showStaticLogo = holding && HOLD_WITH_STATIC_LOGO && !failed;

    let body;
    if (failed) {
        // Video could not play: show the app logo for the same hold time.
        body = <IMELogo size="large" animated={false} />;
    } else if (showStaticLogo) {
        body = (
            <Image
                source={HOLD_LOGO}
                style={{ width: clipSize, height: clipSize }}
                resizeMode="contain"
                fadeDuration={0}
            />
        );
    } else {
        body = (
            <View
                style={{
                    width: clipSize,
                    height: clipSize,
                    borderRadius: clipSize / 2,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <VideoView
                    player={player}
                    style={{ width: size, height: size }}
                    contentFit="contain"
                    nativeControls={false}
                    fullscreenOptions={{ enable: false }}
                    allowsPictureInPicture={false}
                    surfaceType="textureView"
                    onFirstFrameRender={signalReady}
                />
            </View>
        );
    }

    return (
        <Animated.View style={[styles.container, { opacity: fade }]} pointerEvents="none">
            <StatusBar style="light" hidden animated />
            <LinearGradient
                colors={[COLORS.headerStart, COLORS.headerEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {body}
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
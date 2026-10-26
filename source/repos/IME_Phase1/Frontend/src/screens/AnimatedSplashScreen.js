import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './theme';

const SPLASH_VIDEO = require('../../assets/video/rainwater_circular_transparent.webm');
// Same gradient as the Login screen is used for video + hold (no colour shift).
// Exact last frame of the video (white circular badge, transparent outside the circle).
// Shown at the same size/position as the video so the hand-off is seamless.
const HOLD_LOGO = require('../../assets/splash-final-frame.png');
const HOLD_MS = 5000;
const READY_FALLBACK_MS = 1500;

export default function AnimatedSplashScreen({ onFinish, onReady, onExitStart }) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Symmetric margins keep the video centered and clear of system bars.
    const size = Math.max(0, Math.floor(Math.min(
        width - 2 * Math.max(insets.left, insets.right),
        height - 2 * Math.max(insets.top, insets.bottom),
    )));
    const [holding, setHolding] = useState(false);
    const callbacks = useRef({ onFinish, onReady, onExitStart });
    callbacks.current = { onFinish, onReady, onExitStart };
    const readySent = useRef(false);
    const holdStarted = useRef(false);
    const finished = useRef(false);

    const signalReady = useCallback(() => {
        if (readySent.current) return;
        readySent.current = true;
        callbacks.current.onReady?.();
    }, []);

    const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
        p.loop = false;
        p.muted = false;
        p.volume = 1.0;
        try {
            p.audioMixingMode = 'doNotMix';
        } catch (e) {
            // Not available on every playback platform.
        }
    });

    const startHold = useCallback(() => {
        if (holdStarted.current) return;
        holdStarted.current = true;
        player.pause();
        signalReady();
        setHolding(true);
    }, [player, signalReady]);

    useEffect(() => {
        // Subscribe before playing; only actual completion triggers the normal hold.
        const endSub = player.addListener('playToEnd', startHold);
        const statusSub = player.addListener('statusChange', ({ status, error }) => {
            if (status === 'error') {
                console.warn('Splash video failed:', error?.message);
                startHold(); // Preserve the logo fallback on playback failure.
            }
        });
        const readyTimer = setTimeout(signalReady, READY_FALLBACK_MS);
        if (!holdStarted.current) player.play();
        return () => {
            endSub.remove();
            statusSub.remove();
            clearTimeout(readyTimer);
            player.pause();
        };
    }, [player, startHold, signalReady]);

    // Start the hold after the fully opaque, static logo is mounted.
    useEffect(() => {
        if (!holding) return;
        const timer = setTimeout(() => {
            if (finished.current) return;
            finished.current = true;
            callbacks.current.onExitStart?.();
            callbacks.current.onFinish?.();
        }, HOLD_MS);
        return () => clearTimeout(timer);
    }, [holding]);

    return (
        <Modal
            visible
            animationType="none"
            presentationStyle="fullScreen"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={() => { }}
        >
            <LinearGradient
                colors={[COLORS.headerStart, COLORS.headerEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <StatusBar style="light" hidden />
                {/* Same box for video and hold image => identical size/position, no jump. */}
                <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
                    {holding ? (
                        <Image
                            source={HOLD_LOGO}
                            style={{ width: size, height: size }}
                            resizeMode="contain"
                            fadeDuration={0}
                        />
                    ) : (
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
                    )}
                </View>
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.headerStart,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
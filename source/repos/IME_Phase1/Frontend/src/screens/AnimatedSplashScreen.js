import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './theme';

const SPLASH_VIDEO = require('../../assets/video/splash-intro.mp4');
const HOLD_LOGO = require('../../assets/splash-final-frame.png');
const ERROR_FALLBACK_MS = 1500;
const READY_FALLBACK_MS = 1500;
const MAX_VIDEO_MS = 13000;

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
    const fallbackStarted = useRef(false);
    const finished = useRef(false);

    const signalReady = useCallback(() => {
        if (readySent.current) return;
        readySent.current = true;
        callbacks.current.onReady?.();
    }, []);

    const finishOnce = useCallback(() => {
        if (finished.current) return;
        finished.current = true;
        callbacks.current.onExitStart?.();
        callbacks.current.onFinish?.();
    }, []);

    const player = useVideoPlayer(SPLASH_VIDEO, (videoPlayer) => {
        videoPlayer.loop = false;
        videoPlayer.muted = false;
        videoPlayer.volume = 1;
    });

    const showFallback = useCallback(() => {
        if (fallbackStarted.current || finished.current) return;
        fallbackStarted.current = true;
        player.pause();
        signalReady();
        setHolding(true);
    }, [player, signalReady]);

    useEffect(() => {
        const endSubscription = player.addListener('playToEnd', finishOnce);
        const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
            if (status === 'error') {
                console.warn('Splash video failed:', error?.message ?? 'Unknown playback error');
                showFallback();
            }
        });
        const readyTimer = setTimeout(signalReady, READY_FALLBACK_MS);
        const videoTimer = setTimeout(showFallback, MAX_VIDEO_MS);

        if (!fallbackStarted.current && !finished.current) player.play();

        return () => {
            endSubscription.remove();
            statusSubscription.remove();
            clearTimeout(readyTimer);
            clearTimeout(videoTimer);
            player.pause();
        };
    }, [finishOnce, player, showFallback, signalReady]);

    useEffect(() => {
        if (!holding) return undefined;
        const timer = setTimeout(finishOnce, ERROR_FALLBACK_MS);
        return () => clearTimeout(timer);
    }, [finishOnce, holding]);

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
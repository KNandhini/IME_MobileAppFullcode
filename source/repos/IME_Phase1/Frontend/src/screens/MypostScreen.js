import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Modal,
  StyleSheet,
} from 'react-native';

import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import api from '../utils/api';
import { MypostScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const PAGE_SIZE = 10;

// ── Fixed, explicit media carousel dimensions ──
// The card has marginHorizontal: 12 on each side (see screenStyles' `card`
// style) plus overflow: 'hidden' — so the carousel's real available width is
// the screen width minus those margins, NOT the full screen width. Using the
// full screen width here made the carousel (and anything positioned near its
// right edge, like the counter badge) get clipped by the card's rounded
// overflow-hidden boundary.
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HORIZONTAL_MARGIN = 12; // must match styles.card.marginHorizontal
const CAROUSEL_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const CAROUSEL_HEIGHT = 240;

// api.defaults.baseURL is usually something like "http://host:port/api"
// strip the trailing "/api" so we get the plain server root to prefix
// the raw disk-style paths ("Uploads\Posts-351\xyz.jpg") that come back
// from the backend. Same helper as FeedCard.js, for consistency.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server is a raw disk path like
// "Uploads\Posts-351\xyz.jpg" — convert it into a URL the static file
// middleware can actually serve.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

// ── Preview for one video inside the carousel ──
// expo-video needs one player per video, created with a hook, and hooks
// can't run inside .map() — so each video gets this small component.
// Paused on purpose (same as FeedCard): it only needs to show the first
// frame. Looping playback here downloaded the same video a second time
// and competed with the full-screen player for bandwidth.
const CarouselVideo = ({ mediaId, uri, onFail }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
  });

  React.useEffect(() => {
    console.log('[VIDEO START]', { mediaId, uri });
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        console.log('[VIDEO SUCCESS]', { mediaId, uri });
      } else if (status === 'error') {
        console.log('[VIDEO FAILED]', { mediaId, uri, error });
        onFail && onFail(error);
      }
    });
    return () => sub.remove();
  }, [player, mediaId, uri]);

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%', position: 'absolute' }}
      contentFit="contain"
      nativeControls={false}
      pointerEvents="none"
    />
  );
};

// ── MediaCarousel: plain ScrollView (not a nested FlatList), mirroring the
// pattern that already works in FeedCard.js. Each slide is a View with FIXED
// pixel width/height (CAROUSEL_WIDTH / CAROUSEL_HEIGHT) — the Image/Video
// inside can then safely use '100%' because its parent has a real,
// non-ambiguous size. A nested horizontal FlatList's auto-sized cell wrapper
// was the root cause of the blank/gray boxes.
// Defined at module level (not inside MyPostScreen) so it isn't recreated on
// every parent render — required now that it contains video player hooks. ──
const MediaCarousel = ({ media, onOpenViewer }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIds, setFailedIds] = useState({});

  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const markFailed = (mediaId, uri, error) => {
    console.log('[MEDIA ERROR]', {
      mediaId,
      uri,
      error,
    });

    setFailedIds(prev => ({
      ...prev,
      [mediaId]: true,
    }));
  };

  const handleScroll = (event) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH
    );
    setActiveIndex(index);
  };

  return (
    <View
      style={[
        styles.postImage,
        {
          width: CAROUSEL_WIDTH,
          height: CAROUSEL_HEIGHT,
          overflow: 'hidden',
          backgroundColor: '#EEEEEE',
        },
      ]}
    >

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {media.map((m, index) => {
          const mediaId = m.mediaId;
          const uri = toPublicUrl(m.filePath);
          const mediaType = (m.mediaType || 'image').toLowerCase();

          // Fixed-size slide wrapper — this is the key difference vs the
          // old FlatList version. width/height here are real numbers, so
          // the Image/Video's '100%' inside has something concrete to fill.
          const slideStyle = {
            width: CAROUSEL_WIDTH,
            height: CAROUSEL_HEIGHT,
          };

          if (!mediaId) {
            return (
              <View
                key={`media-missing-${index}`}
                style={[
                  slideStyle,
                  { justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <Text>Media ID missing</Text>
              </View>
            );
          }

          if (failedIds[mediaId]) {
            return (
              <View
                key={`media-failed-${mediaId}-${index}`}
                style={[
                  slideStyle,
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#EEEEEE',
                  },
                ]}
              >
                <Text style={{ fontSize: 12, color: '#888' }}>
                  Couldn't load media
                </Text>
              </View>
            );
          }

          if (mediaType === 'video') {
            return (
              <TouchableOpacity
                key={`media-${mediaId}-${index}`}
                style={slideStyle}
                activeOpacity={0.9}
                onPress={() => onOpenViewer && onOpenViewer(media, index)}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Paused first-frame preview, no controls; contain so the
                      full frame is visible, not cropped. Tapping anywhere
                      opens the full-screen viewer. */}
                  <CarouselVideo
                    mediaId={mediaId}
                    uri={uri}
                    onFail={(error) => markFailed(mediaId, uri, error)}
                  />
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 24, color: '#FFFFFF', marginLeft: 2 }}>▶</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={`media-${mediaId}-${index}`}
              style={slideStyle}
              activeOpacity={0.9}
              onPress={() => onOpenViewer && onOpenViewer(media, index)}
            >
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                onLoadStart={() => {
                  console.log('[IMAGE START]', { mediaId, uri });
                }}
                onLoad={() => {
                  console.log('[IMAGE SUCCESS]', { mediaId, uri });
                }}
                onError={(error) => {
                  console.log('[IMAGE FAILED]', {
                    mediaId,
                    uri,
                    error: error?.nativeEvent,
                  });
                  markFailed(mediaId, uri, error?.nativeEvent);
                }}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Counter */}

      {media.length > 1 && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            maxWidth: CAROUSEL_WIDTH - 20,
            zIndex: 10,
            elevation: 10,
            backgroundColor: 'rgba(0,0,0,0.75)',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            {activeIndex + 1}/{media.length}
          </Text>
        </View>
      )}

      {/* Dots */}

      {media.length > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            zIndex: 10,
            elevation: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {media.map((m, index) => (
            <View
              key={`dot-${m.mediaId}-${index}`}
              style={{
                width:
                  index === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                marginHorizontal: 3,
                backgroundColor:
                  index === activeIndex
                    ? '#3B82F6'
                    : 'rgba(255,255,255,0.7)',
              }}
            />
          ))}
        </View>
      )}

    </View>
  );
};

// ── mm:ss (zero padded) like "00:10" ──────────────────────────────────────────
const formatMs = (ms) => {
  if (!ms || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SPEEDS = [1, 1.5, 2, 0.5];

// ── "↺ 15" style skip button ──────────────────────────────────────────────────
const SkipIcon = ({ forward }) => (
  <View style={viewerStyles.skipIcon}>
    <Text style={viewerStyles.skipArrow}>{forward ? '↻' : '↺'}</Text>
    <Text style={viewerStyles.skipNumber}>15</Text>
  </View>
);

// ── One video slide: own player, own controls ─────────────────────────────────
// Mounted ONLY while that slide is visible, so the player is created
// immediately on open (no late binding) and released on close/swipe.
// Same viewer as FeedCard.js.
const VideoSlide = ({ url, hasPrev, hasNext, onPrev, onNext }) => {
  const [isPlaying, setIsPlaying] = useState(false);   // real state, not assumed
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState({ position: 0, duration: 0 });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [fillScreen, setFillScreen] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const hideTimer = useRef(null);

  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  React.useEffect(() => {
    // pick up whatever state the player is already in
    setIsPlaying(!!player.playing);
    setIsLoading(player.status === 'loading' || player.status === 'idle');
    if (player.duration) {
      setStatus((s) => ({ ...s, duration: player.duration * 1000 }));
    }

    const subs = [
      player.addListener('statusChange', ({ status: st }) => {
        setIsLoading(st === 'loading' || st === 'idle');
        if (st === 'readyToPlay') {
          setStatus((s) => ({ ...s, duration: (player.duration || 0) * 1000 }));
        }
      }),
      player.addListener('playingChange', ({ isPlaying: playing }) => {
        setIsPlaying(playing);
        // If it is playing, it is by definition not loading anymore.
        if (playing) setIsLoading(false);
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        // Time is advancing → video is really playing, hide any spinner
        // (the status event can stay on 'loading' on some devices).
        if (currentTime > 0) setIsLoading(false);
        setStatus({
          position: (currentTime || 0) * 1000,
          duration: (player.duration || 0) * 1000,
        });
      }),
      player.addListener('playToEnd', () => {
        setIsPlaying(false);
        setControlsVisible(true);
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [player]);

  // Auto-hide controls 3s after playback starts
  React.useEffect(() => {
    clearTimeout(hideTimer.current);
    if (isPlaying && controlsVisible) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
    return () => clearTimeout(hideTimer.current);
  }, [isPlaying, controlsVisible]);

  const togglePlayPause = () => {
    try {
      // If the video already finished, pressing play restarts it.
      if (status.duration && status.position >= status.duration - 250) {
        player.currentTime = 0;
        player.play();
        return;
      }
      if (player.playing) player.pause();
      else player.play();
    } catch (e) { /* not ready */ }
  };

  const seekBy = (deltaMs) => {
    try {
      const duration = player.duration || 0;
      player.currentTime = Math.max(0, Math.min(player.currentTime + deltaMs / 1000, duration));
    } catch (e) { /* not ready */ }
  };

  const seekToX = (x) => {
    if (!barWidth || !status.duration) return;
    const ratio = Math.max(0, Math.min(1, x / barWidth));
    try { player.currentTime = (ratio * status.duration) / 1000; } catch (e) { /* not ready */ }
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    try { player.playbackRate = SPEEDS[next]; } catch (e) { /* not ready */ }
  };

  const progressPct = status.duration
    ? Math.min(100, (status.position / status.duration) * 100)
    : 0;

  // Spinner only while genuinely waiting: never while playing / after time moved.
  const showSpinner = isLoading && !isPlaying && status.position === 0;

  return (
    <View style={viewerStyles.videoRoot}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={fillScreen ? 'cover' : 'contain'}
        nativeControls={false}
      />

      {/* Tap anywhere on the video to show/hide controls */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setControlsVisible((v) => !v)}
      />

      {/* Spinner while the video is buffering */}
      {showSpinner && (
        <View style={viewerStyles.loadingWrap} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {controlsVisible && (
        <View style={viewerStyles.overlay} pointerEvents="box-none">
          {/* ── Center controls: prev · -15 · play/pause · +15 · next ── */}
          <View style={viewerStyles.centerRow} pointerEvents="box-none">
            <TouchableOpacity
              style={[viewerStyles.sideBtn, !hasPrev && viewerStyles.btnDisabled]}
              onPress={onPrev}
              disabled={!hasPrev}
              activeOpacity={0.7}
            >
              <Text style={viewerStyles.sideBtnText}>|◀</Text>
            </TouchableOpacity>

            <TouchableOpacity style={viewerStyles.sideBtn} onPress={() => seekBy(-15000)} activeOpacity={0.7}>
              <SkipIcon />
            </TouchableOpacity>

            <TouchableOpacity style={viewerStyles.playBtn} onPress={togglePlayPause} activeOpacity={0.8}>
              {showSpinner ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <Text style={viewerStyles.playBtnText}>{isPlaying ? '❚❚' : '▶'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={viewerStyles.sideBtn} onPress={() => seekBy(15000)} activeOpacity={0.7}>
              <SkipIcon forward />
            </TouchableOpacity>

            <TouchableOpacity
              style={[viewerStyles.sideBtn, !hasNext && viewerStyles.btnDisabled]}
              onPress={onNext}
              disabled={!hasNext}
              activeOpacity={0.7}
            >
              <Text style={viewerStyles.sideBtnText}>▶|</Text>
            </TouchableOpacity>
          </View>

          {/* ── Bottom: seek bar + time + speed / fit ── */}
          <View style={viewerStyles.bottomBar} pointerEvents="box-none">
            <View
              style={viewerStyles.seekHit}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => seekToX(e.nativeEvent.locationX)}
              onResponderMove={(e) => seekToX(e.nativeEvent.locationX)}
            >
              <View style={viewerStyles.seekTrack} pointerEvents="none">
                <View style={[viewerStyles.seekFill, { width: `${progressPct}%` }]} />
              </View>
              <View
                pointerEvents="none"
                style={[viewerStyles.seekThumb, { left: `${progressPct}%` }]}
              />
            </View>

            <View style={viewerStyles.bottomRow}>
              <Text style={viewerStyles.timeText}>
                {formatMs(status.position)}  ·  {formatMs(status.duration)}
              </Text>
              <View style={viewerStyles.bottomRight}>
                <TouchableOpacity onPress={cycleSpeed} style={viewerStyles.iconBtn} activeOpacity={0.7}>
                  <Text style={viewerStyles.iconText}>⚙ {SPEEDS[speedIdx]}x</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFillScreen((f) => !f)} style={viewerStyles.iconBtn} activeOpacity={0.7}>
                  <Text style={viewerStyles.iconText}>{fillScreen ? '⤡' : '⛶'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ── Full-screen media viewer: tap an image/video in the carousel to open
// this. Images are swipeable; video uses the custom VideoSlide controls
// (prev/next, ±15s, play/pause, seek bar, speed, fit/fill) — same as FeedCard.js.
// Also at module level, for the same reason as MediaCarousel above. ──
const MediaViewerModal = ({ visible, mediaList, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [ready, setReady] = useState(false); // avoids mounting a stale slide on open
  // Real visible height of the viewer. Dimensions.get('window') can be taller
  // than what the Modal actually shows (Android nav bar etc.).
  const [viewerH, setViewerH] = useState(SCREEN_HEIGHT);
  const scrollRef = useRef(null);

  React.useEffect(() => {
    if (visible) {
      setIndex(startIndex);
      setReady(true);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: startIndex * SCREEN_WIDTH, animated: false });
      });
    } else {
      setReady(false);
    }
  }, [visible, startIndex]);

  const goTo = useCallback((i) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: false });
  }, []);

  const handleScroll = useCallback((e) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }, []);

  if (!mediaList || mediaList.length === 0) return null;

  const hasMultiple = mediaList.length > 1;
  const current = mediaList[index];
  const currentIsVideo = (current?.mediaType || 'image').toLowerCase() === 'video';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View
        style={viewerStyles.backdrop}
        onLayout={(e) => setViewerH(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity style={viewerStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={viewerStyles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {hasMultiple && (
          <View style={viewerStyles.counter}>
            <Text style={viewerStyles.counterText}>{index + 1}/{mediaList.length}</Text>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          scrollEnabled={!currentIsVideo} // prev/next buttons handle navigation on videos
        >
          {mediaList.map((m, i) => {
            const uri = toPublicUrl(m.filePath);
            const isVideo = (m.mediaType || 'image').toLowerCase() === 'video';

            if (!isVideo) {
              return (
                <View key={`viewer-${m.mediaId ?? i}`} style={[viewerStyles.slide, { height: viewerH }]}>
                  <Image source={{ uri }} style={[viewerStyles.media, { height: viewerH }]} resizeMode="contain" />
                </View>
              );
            }

            // Blank page keeps the paging index; the real video layer is
            // rendered below, on top of the viewer, so it is always centred.
            return <View key={`viewer-${m.mediaId ?? i}`} style={[viewerStyles.slide, { height: viewerH }]} />;
          })}
        </ScrollView>

        {/* Only the current video is mounted → its own fresh player.
            Absolute-fill of the backdrop = exactly the visible area. */}
        {ready && visible && currentIsVideo && (
          <VideoSlide
            key={`video-${current?.mediaId ?? index}`}
            url={toPublicUrl(current.filePath)}
            hasPrev={index > 0}
            hasNext={index < mediaList.length - 1}
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
          />
        )}
      </View>
    </Modal>
  );
};

const MyPostScreen = ({ navigation }) => {
  const { user } = useAuth();
  const memberId = user?.memberId; // adjust if your auth context stores this under a different key

  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error,       setError]       = useState(null);
  const [deletingId,  setDeletingId]  = useState(null); // disables the tapped delete icon while in flight

  // ── Full-screen media viewer state (shared across all cards) ──
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerMedia,   setViewerMedia]   = useState([]);
  const [viewerIndex,   setViewerIndex]   = useState(0);

  const handleOpenViewer = useCallback((mediaList, index) => {
    setViewerMedia(mediaList);
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  // ── Base URL for media images, same pattern as ProfileScreen ──
  const baseUrl = api.defaults.baseURL.replace('/api', '');

  // ── Reload every time this screen is focused ──────────
  useFocusEffect(useCallback(() => {
    loadPosts(1, true);
  }, []));

  const loadPosts = async (pageNumber, isRefresh = false) => {
    try {
      if (isRefresh) setError(null);
      const res = await feedService.getMemberFeed(memberId, pageNumber, PAGE_SIZE);
      if (res.success) {
        const newItems = res.data.items || [];

        // ── Diagnostic: how many posts and how many media items came back ──
        console.log('[FEED PAGE LOADED]', {
          pageNumber,
          postCount: newItems.length,
          totalMediaCount: newItems.reduce(
            (sum, p) => sum + (p.mediaItems?.length || 0),
            0
          ),
          breakdown: newItems.map(p => ({
            postId: p.id,
            mediaCount: p.mediaItems?.length || 0,
            mediaIds: (p.mediaItems || []).map(m => m.mediaId),
          })),
        });

        setPosts(prev => (isRefresh ? newItems : [...prev, ...newItems]));
        setPage(pageNumber);
        setHasMore(res.data.hasMore);
      } else {
        setError('Failed to load your posts.');
      }
    } catch (e) {
      setError('Could not connect to server.');
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    loadPosts(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoad) return;
    setLoadingMore(true);
    loadPosts(page + 1, false);
  }, [loadingMore, hasMore, page, initialLoad]);

  // ── Delete flow: confirm → call API → remove from local list ──
  const confirmDelete = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? ',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(postId) },
      ],
    );
  };

  const handleDelete = async (postId) => {
    try {
      setDeletingId(postId);
      const res = await feedService.deletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        Alert.alert('Error', getSafeErrorMessage(res));
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Header ─────────────────────────────────────────────
  const renderHeader = () => (
    <GradientHeader style={styles.appHeader}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Post</Text>
      <View style={styles.backBtn} />
    </GradientHeader>
  );

  // ── Single post card (mirrors the feed card look, plus a delete icon) ──
  const renderPost = ({ item }) => {
    const media = Array.isArray(item.mediaItems)
      ? item.mediaItems
          .slice()
          .sort(
            (a, b) =>
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
          )
      : [];

    return (
      <View style={styles.card}>

        {/* Header */}

        <View style={styles.cardTopRow}>

          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(item.memberName || 'M')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardTopTexts}>

            <Text style={styles.memberName}>
              {item.memberName}
            </Text>

            <View style={styles.metaRow}>

              <View style={styles.typePill}>
                <Text style={styles.typePillText}>
                  📌 {item.type}
                </Text>
              </View>

              <Text style={styles.metaDot}>
                ·
              </Text>

              <Text style={styles.metaTime}>
                {formatTimeAgo(item.postedDate)}
              </Text>

            </View>

          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDelete(item.id)}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator
                size="small"
                color="#C0392B"
              />
            ) : (
              <Text style={styles.deleteIcon}>
                🗑️
              </Text>
            )}
          </TouchableOpacity>

        </View>

        {/* Description */}

        {!!item.description && (
          <Text style={styles.cardBody}>
            {item.description}
          </Text>
        )}

        {/* MEDIA */}

        <MediaCarousel
          media={media}
          onOpenViewer={handleOpenViewer}
        />

        {/* Footer */}

      </View>
    );
  };

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.footerLoaderText}>Loading more...</Text>
        </View>
      )}
      {!hasMore && !loadingMore && posts.length > 0 && (
        <View style={styles.endWrap}>
          <Text style={styles.endText}>No more posts</Text>
        </View>
      )}
    </View>
  );

  if (initialLoad) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        {renderHeader()}
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.centerText}>Loading your posts...</Text>
        </View>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        {renderHeader()}
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setInitialLoad(true); loadPosts(1, true); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
      {renderHeader()}

      <FlatList
        data={posts}
        keyExtractor={(item, index) => `post-${item.id}-${index}`}
        renderItem={renderPost}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyContent : styles.listContent}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.dark]} tintColor={COLORS.dark} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>You haven't posted yet.</Text>
            <Text style={styles.emptySubText}>Pull down to refresh.</Text>
          </View>
        }
      />

      <MediaViewerModal
        visible={viewerVisible}
        mediaList={viewerMedia}
        startIndex={viewerIndex}
        onClose={handleCloseViewer}
      />
    </View>
  );
};

// ── Small helper, replace with your own date util if you already have one ──
// Compares calendar dates (not a rolling 24-hour window), so a post from
// 11 PM two days ago correctly shows "2d ago" instead of "1d ago" just
// because less than 48 raw hours have elapsed.
function formatTimeAgo(dateString) {
  if (!dateString) return '';

  const postDate = new Date(dateString);
  const now = new Date();

  // Strip time-of-day, keep only the calendar date, for both.
  const postDay = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((today.getTime() - postDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1w ago' : `${weeks}w ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1mo ago' : `${months}mo ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1y ago' : `${years}y ago`;
}

// ── Full-screen viewer styles (same as FeedCard.js) ───────────────────────────
const viewerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  slide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  media: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  closeBtn: {
    position: 'absolute', top: 44, right: 16, zIndex: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  counter: {
    position: 'absolute', top: 50, alignSelf: 'center', zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  videoRoot: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 5,
    backgroundColor: '#000',
  },

  loadingWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },

  // Dark tint + controls
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  centerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  sideBtn: {
    width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 6,
  },
  sideBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  btnDisabled: { opacity: 0.35 },
  playBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 10,
  },
  playBtnText: { color: '#111', fontSize: 24, fontWeight: '700' },

  skipIcon: { alignItems: 'center', justifyContent: 'center' },
  skipArrow: { color: '#fff', fontSize: 34, lineHeight: 36 },
  skipNumber: {
    position: 'absolute', color: '#fff', fontSize: 11, fontWeight: '800', marginTop: 3,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute', left: 16, right: 16, bottom: 80,
  },
  seekHit: { height: 28, justifyContent: 'center' },
  seekTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden',
  },
  seekFill: { height: 4, backgroundColor: '#fff' },
  seekThumb: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#fff', marginLeft: -6, top: 8,
  },
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  timeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bottomRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  iconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default MyPostScreen;
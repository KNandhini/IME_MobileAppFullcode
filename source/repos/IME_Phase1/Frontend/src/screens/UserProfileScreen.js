import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Linking, RefreshControl, Alert, Image, Dimensions, Modal, StyleSheet } from 'react-native';
import { AppText as Text } from '../components/IMEText';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import { chatService } from '../services/chatService';
import { memberService } from '../services/memberService';
import api from '../utils/api';
import { UserProfileScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const PAGE_SIZE = 10;

// ═══════════════════════════════════════════════════════════════════════════
// Post media (carousel + full-screen viewer) — all in this one file,
// same behaviour as FeedCard / MyPostScreen.
// ═══════════════════════════════════════════════════════════════════════════
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CAROUSEL_HEIGHT = 240;

// api.defaults.baseURL is usually "http://host:port/api" — strip "/api" to get
// the server root, then prefix the raw disk-style path from the backend
// ("Uploads\Posts-351\xyz.jpg").
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const isVideoItem = (m) => (m?.mediaType || 'image').toLowerCase() === 'video';

// ── Paused first-frame preview for a video inside the carousel ────────────────
const CarouselVideo = ({ mediaId, uri, onFail }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
  });

  React.useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') {
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

// ── Media carousel: measures its own width, so it fits any card margins ───────
const MediaCarousel = ({ media, onOpenViewer }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIds, setFailedIds] = useState({});
  const [width, setWidth] = useState(0);

  if (!Array.isArray(media) || media.length === 0) return null;

  const markFailed = (mediaId, uri, error) => {
    console.log('[MEDIA ERROR]', { mediaId, uri, error });
    setFailedIds((prev) => ({ ...prev, [mediaId]: true }));
  };

  const handleScroll = (e) => {
    if (!width) return;
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const slideStyle = { width, height: CAROUSEL_HEIGHT };

  return (
    <View
      style={{
        width: '100%',
        height: CAROUSEL_HEIGHT,
        overflow: 'hidden',
        backgroundColor: '#EEEEEE',
      }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
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

            if (!mediaId || !uri) {
              return (
                <View
                  key={`media-missing-${index}`}
                  style={[slideStyle, { justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Text style={{ fontSize: 12, color: '#888' }}>Media not available</Text>
                </View>
              );
            }

            if (failedIds[mediaId]) {
              return (
                <View
                  key={`media-failed-${mediaId}-${index}`}
                  style={[slideStyle, { justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Text style={{ fontSize: 12, color: '#888' }}>Couldn't load media</Text>
                </View>
              );
            }

            if (isVideoItem(m)) {
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
                  onError={(error) => markFailed(mediaId, uri, error?.nativeEvent)}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {media.length > 1 && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            zIndex: 10,
            elevation: 10,
            backgroundColor: 'rgba(0,0,0,0.75)',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
            {activeIndex + 1}/{media.length}
          </Text>
        </View>
      )}

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
                width: index === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                marginHorizontal: 3,
                backgroundColor: index === activeIndex ? '#3B82F6' : 'rgba(255,255,255,0.7)',
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

const SkipIcon = ({ forward }) => (
  <View style={viewerStyles.skipIcon}>
    <Text style={viewerStyles.skipArrow}>{forward ? '↻' : '↺'}</Text>
    <Text style={viewerStyles.skipNumber}>15</Text>
  </View>
);

// ── One video slide: own player, own controls ─────────────────────────────────
const VideoSlide = ({ url, hasPrev, hasNext, onPrev, onNext }) => {
  const [isPlaying, setIsPlaying] = useState(false);
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
        if (playing) setIsLoading(false);
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
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

  const showSpinner = isLoading && !isPlaying && status.position === 0;

  return (
    <View style={viewerStyles.videoRoot}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={fillScreen ? 'cover' : 'contain'}
        nativeControls={false}
      />

      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setControlsVisible((v) => !v)}
      />

      {showSpinner && (
        <View style={viewerStyles.loadingWrap} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {controlsVisible && (
        <View style={viewerStyles.overlay} pointerEvents="box-none">
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

// ── Full-screen media viewer ──────────────────────────────────────────────────
const MediaViewerModal = ({ visible, mediaList, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [ready, setReady] = useState(false);
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
  const currentIsVideo = isVideoItem(current);

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
          scrollEnabled={!currentIsVideo}
        >
          {mediaList.map((m, i) => {
            if (isVideoItem(m)) {
              // Blank page keeps the paging index; the real video layer is
              // rendered below, on top of the viewer.
              return (
                <View key={`viewer-${m.mediaId ?? i}`} style={[viewerStyles.slide, { height: viewerH }]} />
              );
            }
            return (
              <View key={`viewer-${m.mediaId ?? i}`} style={[viewerStyles.slide, { height: viewerH }]}>
                <Image
                  source={{ uri: toPublicUrl(m.filePath) }}
                  style={[viewerStyles.media, { height: viewerH }]}
                  resizeMode="contain"
                />
              </View>
            );
          })}
        </ScrollView>

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
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
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

  bottomBar: { position: 'absolute', left: 16, right: 16, bottom: 80 },
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
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bottomRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  iconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ═══════════════════ end of post media ═══════════════════


const UserProfileScreen = ({ navigation, route }) => {
  const { memberId, memberName, email } = route.params || {};
  const { user } = useAuth();

  // Only an Admin sees the delete icon on someone else's posts
  const isAdmin = user?.roleId === 1 || user?.roleName === 'Admin';

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [clubName, setClubName] = useState(null);

  // ── Full-screen media viewer state (shared across all cards) ──
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerMedia, setViewerMedia] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleOpenViewer = useCallback((mediaList, index) => {
    setViewerMedia(mediaList);
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  // ── Base URL for the profile photo, same pattern as ProfileScreen ──
  const baseUrl = api.defaults.baseURL.replace('/api', '');

  // ── Load this member's profile photo, same logic as ProfileScreen ──
  useEffect(() => {
    loadPhoto();
  }, [memberId]);

  const loadPhoto = async () => {
    try {
      if (!memberId) return;

      const res = await memberService.getProfile(memberId);
      if (res.success && res.data) {
        const d = res.data;

        if (d.clubName) {
          setClubName(d.clubName);
        }

        if (d.profilePhotoPath) {
          // ── Use URL path ──
          const path = d.profilePhotoPath;
          const photoUrl = path.startsWith('http')
            ? path
            : `${baseUrl}/Uploads/${path.replace(/\\/g, '/').replace(/^Uploads\/?/i, '')}`;
          setProfilePhoto(photoUrl);
        } else if (d.profilePhoto) {
          // ── Use base64 blob ──
          const photo = d.profilePhoto;
          setProfilePhoto(
            photo.startsWith('data:')
              ? photo
              : `data:image/jpeg;base64,${photo}`
          );
        }
      }
    } catch (e) {
      console.warn('Load photo error:', e);
    }
  };

  useFocusEffect(useCallback(() => {
    loadPosts(1, true);
  }, [memberId]));

  const loadPosts = async (pageNumber, isRefresh = false) => {
    try {
      const res = await feedService.getMemberFeed(memberId, pageNumber, PAGE_SIZE);
      if (res.success) {
        const items = res.data?.items || [];
        setPosts(prev => (isRefresh ? items : [...prev, ...items]));
        setPage(pageNumber);
        setHasMore(res.data?.hasMore ?? false);
      }
    } catch (_) {
      // silent
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
  }, [memberId]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoad) return;
    setLoadingMore(true);
    loadPosts(page + 1, false);
  }, [loadingMore, hasMore, page, initialLoad]);

  const handleMessage = async () => {
    if (!memberId) return;
    setChatLoading(true);
    try {
      const res = await chatService.getOrCreateConversation(memberId);
      if (res.success && res.data?.conversationId) {
        navigation.navigate('Chat', {
          conversationId: res.data.conversationId,
          otherMemberName: memberName,
          otherMemberEmail: email,
        });
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleMail = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  // ── Admin delete flow: confirm → call API → remove from local list ──
  const confirmDelete = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
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
    } catch (_) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setDeletingId(null);
    }
  };

  const avatarColor = COLORS.dark;
  const initial = (memberName || 'M').charAt(0).toUpperCase();

  const renderHeader = () => (
    <View style={styles.profileCard}>
      {/* Avatar — real photo if available, otherwise initial letter */}
      {profilePhoto ? (
        <Image
          source={{ uri: profilePhoto }}
          style={styles.avatarPhoto}
          onError={() => setProfilePhoto(null)}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
      )}

      {/* Name + actions */}
      <View style={styles.nameRow}>
        <View style={styles.nameClubWrap}>
          <Text style={styles.memberName}>{memberName || 'Member'}</Text>
          {!!clubName && <Text style={styles.clubName}>{clubName}</Text>}
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.messageBtn]}
            onPress={handleMessage}
            disabled={chatLoading}
            activeOpacity={0.8}
          >
            {chatLoading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={styles.actionBtnText}>💬 Message</Text>
            }
          </TouchableOpacity>

          {!!email && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.mailBtn]}
              onPress={handleMail}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>✉️ Mail</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.postsLabelWrap}>
        <Text style={styles.postsLabel}>Posts</Text>
      </View>
    </View>
  );

  // ── Single post card: avatar/name/time row, caption, media carousel, delete, footer ──
  const renderPost = ({ item }) => {
    // Same data + same URL building as MyPostScreen: each media item's
    // filePath is converted with toPublicUrl() inside MediaCarousel.
    const media = Array.isArray(item.mediaItems)
      ? item.mediaItems
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : [];

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardAvatar}>
            <Text style={styles.cardAvatarLetter}>
              {(item.memberName || 'M').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardTopTexts}>
            <Text style={styles.cardMemberName}>{item.memberName}</Text>
            <View style={styles.metaRow}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>📌 {item.type}</Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaTime}>{formatTimeAgo(item.postedDate)}</Text>
            </View>
          </View>
          {item.isSameClub === true && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmDelete(item.id)}
              disabled={deletingId === item.id}
              activeOpacity={0.7}
            >
              {deletingId === item.id
                ? <ActivityIndicator size="small" color="#C0392B" />
                : <Text style={styles.deleteIcon}>🗑️</Text>}
            </TouchableOpacity>
          )}
        </View>

        {!!item.description && <Text style={styles.cardBody}>{item.description}</Text>}

        {/* ── Attached media: swipeable carousel, tap to open full screen ── */}
        <MediaCarousel media={media} onOpenViewer={handleOpenViewer} />

        <View style={styles.cardFooter}>
          <Text style={styles.footerStat}>❤️ {item.likeCount ?? 0} likes</Text>
          <Text style={styles.footerStat}>{item.commentCount ?? 0} comments</Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      )}
      {!hasMore && !loadingMore && posts.length > 0 && (
        <View style={styles.endWrap}>
          <Text style={styles.endText}>No more posts</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {/* Header bar */}
      <GradientHeader style={styles.appHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{memberName || 'Profile'}</Text>
        <View style={{ width: 40 }} />
      </GradientHeader>

      {initialLoad ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => `post-${item.id}-${index}`}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={posts.length === 0 ? styles.emptyContent : styles.listContent}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.dark]}
              tintColor={COLORS.dark}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          }
        />
      )}

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
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export default UserProfileScreen;
import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useCallback } from 'react';
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
} from 'react-native';

import { Video, ResizeMode } from 'expo-av';
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

  // ── MediaCarousel: rebuilt using a plain ScrollView (not a nested FlatList),
  // mirroring the pattern that already works in FeedCard.js. Each slide is a
  // View with FIXED pixel width/height (CAROUSEL_WIDTH / CAROUSEL_HEIGHT) —
  // the Image/Video inside can then safely use '100%' because its parent has
  // a real, non-ambiguous size. A nested horizontal FlatList's auto-sized
  // cell wrapper was the root cause of the blank/gray boxes. ──
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
                    {/* Muted, no controls — lightweight preview thumbnail;
                        contain so the full frame is visible, not cropped.
                        Tapping anywhere opens the full-screen viewer. */}
                    <Video
                      source={{ uri }}
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      resizeMode={ResizeMode.CONTAIN}
                      isMuted
                      shouldPlay
                      isLooping
                      useNativeControls={false}
                      onLoadStart={() => {
                        console.log('[VIDEO START]', { mediaId, uri });
                      }}
                      onLoad={() => {
                        console.log('[VIDEO SUCCESS]', { mediaId, uri });
                      }}
                      onError={(error) => {
                        console.log('[VIDEO FAILED]', { mediaId, uri, error });
                        markFailed(mediaId, uri, error);
                      }}
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

  // ── Full-screen media viewer: tap an image/video in the carousel to open
  // this. Shows one slide at a time, swipeable, with a close (✕) button.
  // Video gets custom controls (play/pause, ±10s seek, progress bar, time
  // labels) instead of native controls — matches FeedCard.js's viewer. ──
  const LIGHT_GREEN = '#A0C878';

  const MediaViewerModal = ({ visible, mediaList, startIndex, onClose }) => {
    const [index, setIndex] = useState(startIndex);
    const [isPlaying, setIsPlaying] = useState(true);
    const [playbackStatus, setPlaybackStatus] = useState({ position: 0, duration: 0 });
    const scrollRef = React.useRef(null);
    const videoRef = React.useRef(null);

    React.useEffect(() => {
      if (visible) {
        setIndex(startIndex);
        setIsPlaying(true);
        setPlaybackStatus({ position: 0, duration: 0 });
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ x: startIndex * SCREEN_WIDTH, animated: false });
        });
      }
    }, [visible, startIndex]);

    const handleScroll = (event) => {
      const i = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setIndex(i);
      setIsPlaying(true);
      setPlaybackStatus({ position: 0, duration: 0 });
    };

    const togglePlayPause = async () => {
      if (!videoRef.current) return;

      if (playbackStatus.duration && playbackStatus.position >= playbackStatus.duration) {
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    };

    const seekBy = async (deltaMs) => {
      if (!videoRef.current) return;
      try {
        const status = await videoRef.current.getStatusAsync();
        if (!status.isLoaded) return;
        const duration = status.durationMillis ?? 0;
        const newPos = Math.max(0, Math.min((status.positionMillis || 0) + deltaMs, duration));
        await videoRef.current.setPositionAsync(newPos);
      } catch (e) {
        // ignore — e.g. video not loaded yet
      }
    };

    const handlePlaybackStatusUpdate = (status) => {
      if (!status.isLoaded) return;
      setPlaybackStatus({
        position: status.positionMillis || 0,
        duration: status.durationMillis || 0,
      });
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    };

    if (!mediaList || mediaList.length === 0) return null;

    const current = mediaList[index];
    const currentIsVideo = (current?.mediaType || 'image').toLowerCase() === 'video';
    const hasMultiple = mediaList.length > 1;

    const progressPct = playbackStatus.duration
      ? Math.min(100, (playbackStatus.position / playbackStatus.duration) * 100)
      : 0;

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: '#000' }}>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              position: 'absolute',
              top: 44,
              right: 16,
              zIndex: 20,
              elevation: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>

          {hasMultiple && (
            <View
              style={{
                position: 'absolute',
                top: 50,
                alignSelf: 'center',
                zIndex: 20,
                elevation: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {index + 1}/{mediaList.length}
              </Text>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            // While viewing a video, disable swipe-scroll so it doesn't fight
            // with seeking — the ‹ › buttons take over there instead.
            scrollEnabled={!currentIsVideo}
          >
            {mediaList.map((m, i) => {
              const uri = toPublicUrl(m.filePath);
              const isVideo = (m.mediaType || 'image').toLowerCase() === 'video';
              return (
                <View
                  key={`viewer-${m.mediaId ?? i}`}
                  style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {isVideo ? (
                    // Only mount the player for the currently visible slide —
                    // avoids every video in the post trying to buffer at once.
                    index === i ? (
                      <Video
                        ref={i === index ? videoRef : null}
                        source={{ uri }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                        resizeMode={ResizeMode.CONTAIN}
                        useNativeControls={false}
                        shouldPlay={visible && isPlaying}
                        isLooping={false}
                        onPlaybackStatusUpdate={i === index ? handlePlaybackStatusUpdate : undefined}
                      />
                    ) : (
                      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />
                    )
                  ) : (
                    <Image
                      source={{ uri }}
                      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ── Controls: only shown for video — progress line, seek back, play/pause, seek forward ── */}
          {currentIsVideo && (
            <>
              <View
                pointerEvents="none"
                style={{ position: 'absolute', bottom: 116, left: 20, right: 20 }}
              >
                <View
                  style={{
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ height: 3, backgroundColor: LIGHT_GREEN, width: `${progressPct}%` }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                    {formatMs(playbackStatus.position)}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                    {formatMs(playbackStatus.duration)}
                  </Text>
                </View>
              </View>

              <View
                pointerEvents="box-none"
                style={{
                  position: 'absolute',
                  bottom: 48,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  onPress={() => seekBy(-10000)}
                  activeOpacity={0.7}
                  style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: LIGHT_GREEN,
                    justifyContent: 'center', alignItems: 'center',
                    marginHorizontal: 20,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 }}>‹</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={togglePlayPause}
                  activeOpacity={0.7}
                  style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: LIGHT_GREEN,
                    justifyContent: 'center', alignItems: 'center',
                    marginHorizontal: 12,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
                    {isPlaying ? '❚❚' : '▶'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => seekBy(10000)}
                  activeOpacity={0.7}
                  style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: LIGHT_GREEN,
                    justifyContent: 'center', alignItems: 'center',
                    marginHorizontal: 20,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 }}>›</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    );
  };

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

    // ── Diagnostic: how many media items this specific post has ──
  

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

// Format milliseconds as m:ss for the progress bar time label.
function formatMs(ms) {
  if (!ms || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default MyPostScreen;
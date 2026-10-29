import { COLORS, RADIUS, SHADOW } from '../screens/theme';
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Dimensions, TextInput, ActivityIndicator,
  Modal, StatusBar,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import api from '../utils/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// api.defaults.baseURL is usually something like "http://host:port/api"
// strip the trailing "/api" so we get the plain server root to prefix
// the raw disk-style paths ("Uploads\Posts-121\xyz.jpg") that come back
// from the backend. Same helper as AchievementDetailScreen for consistency.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath / imagePath from the server is a raw disk path like
// "Uploads\Posts-121\xyz.jpg" (or "Uploads/News/xyz.jpg") — convert it
// into a URL the app can actually load/display.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const AVATAR_COLORS = [
  COLORS.primary, COLORS.accent, COLORS.secondary, COLORS.dark,
];

const TYPE_LABELS = {
  Activity: { label: 'Activity', icon: '📅' },
  News: { label: 'News', icon: '📰' },
  Circular: { label: 'Circular', icon: '📋' },
  Post: { label: 'Post', icon: '📌' },
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';

  const postDate = new Date(dateString);
  let diff = Math.floor((Date.now() - postDate.getTime()) / 1000);

  // Tolerate small clock skew between server and device (and network/render
  // latency for something that was JUST created) — treat anything within
  // 2 minutes "in the future" as effectively now, instead of misreading it
  // as a genuinely future-dated item.
  if (diff < 0 && diff > -120) diff = 0;

  // Future dates (beyond the tolerance above)
  if (diff < 0) {
    return postDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (diff < 60) return 'Just now';

  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  }

  if (diff < 86400) {
    const hrs = Math.floor(diff / 3600);
    return `${hrs}h ago`;
  }

  if (diff < 2592000) {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  }

  if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months}mo ago`;
  }

  const years = Math.floor(diff / 31536000);
  return `${years}y ago`;
};

// Formats as d/m/yyyy in the en-IN locale, e.g. 10/7/2026
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

// Combines the relative label with the actual date, e.g. "Just now · 10/7/2026".
// getTimeAgo only returns a raw formatted date (no "ago"/"Just now") for the
// rare genuinely-future case beyond the clock-skew tolerance — in that case
// don't append formatDate again, or the date would show twice.
const getCommentTimestamp = (dateString) => {
  if (!dateString) return '';
  const relative = getTimeAgo(dateString);
  const isAlreadyFullDate = relative !== 'Just now' && !relative.includes('ago');
  if (isAlreadyFullDate) return relative;
  return `${relative} · ${formatDate(dateString)}`;
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

// ── Full-screen media viewer — images + video ─────────────────────────────────
const MediaViewerModal = ({ visible, mediaList, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [ready, setReady] = useState(false); // avoids mounting a stale slide on open
  // Real visible height of the viewer. Dimensions.get('window') can be taller
  // than what the Modal actually shows (Android nav bar etc.), which pushed
  // the controls off the bottom of the screen.
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
  const currentIsVideo = mediaList[index]?.mediaType === 'video';

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
          {mediaList.map((media, i) => {
            const url = toPublicUrl(media.filePath ?? media.imagePath);
            const isVideo = media.mediaType === 'video';

            if (!isVideo) {
              return (
                <View key={media.mediaId ?? i} style={[viewerStyles.slide, { height: viewerH }]}>
                  <Image source={{ uri: url }} style={[viewerStyles.media, { height: viewerH }]} resizeMode="contain" />
                </View>
              );
            }

            // Blank page keeps the paging index; the real video layer is
            // rendered below, on top of the viewer, so it is always centred.
            return <View key={media.mediaId ?? i} style={[viewerStyles.slide, { height: viewerH }]} />;
          })}
        </ScrollView>

        {/* Only the current video is mounted → its own fresh player.
            Absolute-fill of the backdrop = exactly the visible area. */}
        {ready && visible && currentIsVideo && (
          <VideoSlide
            key={`video-${mediaList[index]?.mediaId ?? index}`}
            url={toPublicUrl(mediaList[index].filePath ?? mediaList[index].imagePath)}
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

// ── Muted looping preview for a video inside the carousel ─────────────────────
// Each video needs its own player, and hooks can't run inside .map(),
// so this lives in its own small component.
const CarouselVideo = ({ url }) => {
  // Paused on purpose: it only needs to show the first frame. Looping
  // playback here downloaded the same video a second time and competed
  // with the full-screen player for bandwidth.
  const player = useVideoPlayer(url, (p) => {
    p.muted = true;
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
      pointerEvents="none"
    />
  );
};

// ── Media carousel for Post-type items ────────────────────────────────────────
const MediaCarousel = ({ mediaItems, onOpenViewer }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = useCallback((e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <View style={carousel.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {mediaItems.map((media, index) => {
          const url = toPublicUrl(media.filePath);
          const isVideo = media.mediaType === 'video';
          return (
            <TouchableOpacity
              key={media.mediaId ?? index}
              style={carousel.slide}
              activeOpacity={0.9}
              onPress={() => onOpenViewer(mediaItems, index)}
            >
              {isVideo ? (
                <View style={carousel.videoPlaceholder}>
                  {/* Muted, no controls — lightweight preview thumbnail;
                      contain so the full frame is visible, not cropped. */}
                  <CarouselVideo url={url} />
                  <View style={carousel.videoPlayBadge}>
                    <Text style={carousel.videoPlay}>▶</Text>
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: url }}
                  style={carousel.image}
                  resizeMode="contain"
                  onError={(e) => console.log('Image load error mediaId=' + media.mediaId, e.nativeEvent.error)}
                  onLoad={() => console.log('Image loaded mediaId=' + media.mediaId)}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Counter badge — only when >1 item */}
      {mediaItems.length > 1 && (
        <View style={carousel.counter}>
          <Text style={carousel.counterText}>{activeIndex + 1}/{mediaItems.length}</Text>
        </View>
      )}

      {/* Dot indicators */}
      {mediaItems.length > 1 && (
        <View style={carousel.dots}>
          {mediaItems.map((_, i) => (
            <View key={i} style={[carousel.dot, i === activeIndex && carousel.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

// ── Single image for News / Activity (uses ImagePath) ─────────────────────────
const SingleImage = ({ imagePath, onOpenViewer }) => {
  if (!imagePath) return null;
  const uri = toPublicUrl(imagePath);
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onOpenViewer([{ imagePath, mediaType: 'image' }], 0)}
    >
      <Image source={{ uri }} style={single.image} resizeMode="contain" />
    </TouchableOpacity>
  );
};

// ── Main card ─────────────────────────────────────────────────────────────────
const FeedCard = ({ item, navigation }) => {
  const colorIndex = (item.id || 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const memberName = item.memberName || 'IUE Admin';
  const typeMeta = TYPE_LABELS[item.type] || { label: item.type || '', icon: '📌' };
  const timeAgo = getTimeAgo(item.postedDate);

  // itemType/itemId are what the interaction endpoints key off of now —
  // likes/comments work on Post, Activity, News, and Circular alike.
  const itemType = item.type;
  const itemId = item.id;

  const isPost = item.type === 'Post';
  const hasCarousel = isPost && item.mediaItems && item.mediaItems.length > 0;
  const hasSingle = !isPost && item.hasImage && item.imagePath;

  // ── Full-screen media viewer state ─────────────────────────────────
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

  // ── Like / Comment state ──────────────────────────────────────────
  // Now wired up for every feed item type (Post/Activity/News/Circular) —
  // tbl_PostInteractions keys off (ItemType, ItemId) instead of a Posts-only FK.
  const [isLiked, setIsLiked] = useState(!!item.isLikedByViewer);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? item.likes ?? 0);
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentCount, setCommentCount] = useState(item.commentCount ?? item.comments ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // ── Toggle like on/off (optimistic, reconciled with server response) ──
  const handleToggleLike = useCallback(async () => {
    if (likeBusy) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setLikeBusy(true);
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.post(`/feed/${itemType}/${itemId}/like`);
      const body = res.data;
      if (body?.success && body.data) {
        setIsLiked(!!body.data.isLikedByViewer);
        setLikeCount(body.data.likeCount ?? 0);
      } else {
        // revert optimistic update on failure
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch (e) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  }, [isLiked, likeCount, likeBusy, itemType, itemId]);

  // ── Load comments the first time the thread is opened ─────────────
  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/feed/${itemType}/${itemId}/comments`);
      if (res.data?.success) {
        setComments(res.data.data || []);
      }
    } catch (e) {
      // leave comments empty; user can retry by collapsing/expanding again
    } finally {
      setLoadingComments(false);
    }
  }, [itemType, itemId]);

  const handleToggleComments = useCallback(() => {
    setShowComments((prev) => {
      const next = !prev;
      if (next && comments.length === 0) {
        loadComments();
      }
      return next;
    });
  }, [comments.length, loadComments]);

  // ── Post a new comment ─────────────────────────────────────────────
  const handleSendComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || postingComment) return;

    setPostingComment(true);
    try {
      const res = await api.post(`/feed/${itemType}/${itemId}/comment`, { commentDetails: trimmed });
      if (res.data?.success && res.data.data) {
        setComments((prev) => [...prev, res.data.data]);
        setCommentCount((prev) => prev + 1);
        setCommentText('');
      }
    } catch (e) {
      // could surface a toast/snackbar here
    } finally {
      setPostingComment(false);
    }
  }, [commentText, postingComment, itemType, itemId]);

  return (
    <View style={styles.card}>

      {/* ── Card Header ── */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLetter}>{memberName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.headerMeta}>
          <TouchableOpacity
            activeOpacity={navigation && item.memberId ? 0.6 : 1}
            onPress={() => {
              if (navigation && item.memberId) {
                navigation.navigate('UserProfile', {
                  memberId: item.memberId,
                  memberName: memberName,
                  email: item.email,
                });
              }
            }}
          >
            <Text style={[styles.memberName, navigation && item.memberId && styles.memberNameLink]}>
              {memberName}
            </Text>
          </TouchableOpacity>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{typeMeta.icon} {typeMeta.label}</Text>
            </View>
            <Text style={styles.timeAgo}> · {timeAgo}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.dotMenuBtn} activeOpacity={0.7}>
          <Text style={styles.dotMenuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* ── Media ── */}
      {hasCarousel && <MediaCarousel mediaItems={item.mediaItems} onOpenViewer={handleOpenViewer} />}
      {hasSingle && <SingleImage imagePath={item.imagePath} onOpenViewer={handleOpenViewer} />}

      {/* ── Post Content ── */}
      <View style={styles.body}>
        {item.title ? <Text style={styles.postTitle}>{item.title}</Text> : null}
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>❤️ {likeCount} likes</Text>
        <TouchableOpacity onPress={handleToggleComments} activeOpacity={0.7}>
          <Text style={styles.statsText}>{commentCount} comments</Text>
        </TouchableOpacity>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Action Buttons ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={handleToggleLike}
          disabled={likeBusy}
        >
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={[styles.actionLabel, isLiked && styles.actionLabelActive]}>
            {isLiked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={handleToggleComments}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionLabel, showComments && styles.actionLabelActive]}>Comment</Text>
        </TouchableOpacity>
      </View>

      {/* ── Comments thread (all feed item types) ── */}
      {showComments && (
        <View style={styles.commentsSection}>
          {loadingComments ? (
            <View style={styles.commentsLoadingRow}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.commentsLoadingText}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment.</Text>
          ) : (
            comments.map((c) => (
              <View key={c.interactionId} style={styles.commentRow}>
                <View
                  style={[
                    styles.commentAvatar,
                    { backgroundColor: AVATAR_COLORS[(c.memberId || 0) % AVATAR_COLORS.length] },
                  ]}
                >
                  <Text style={styles.commentAvatarLetter}>
                    {(c.memberName || 'M').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={styles.commentName}>{c.memberName}</Text>
                    <Text style={styles.commentTime}>{getCommentTimestamp(c.createdDate)}</Text>
                  </View>
                  <Text style={styles.commentText}>{c.commentDetails}</Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.placeholder}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              editable={!postingComment}
            />
            <TouchableOpacity
              style={[
                styles.commentSendBtn,
                (!commentText.trim() || postingComment) && styles.commentSendBtnDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || postingComment}
              activeOpacity={0.7}
            >
              {postingComment ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.commentSendText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Full-screen image/video viewer ── */}
      <MediaViewerModal
        visible={viewerVisible}
        mediaList={viewerMedia}
        startIndex={viewerIndex}
        onClose={handleCloseViewer}
      />

    </View>
  );
};

// ── Full-screen viewer styles ──────────────────────────────────────────────────
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

// ── Carousel styles ───────────────────────────────────────────────────────────
const carousel = StyleSheet.create({
  wrapper: { position: 'relative', backgroundColor: '#000' },
  slide: { width: SCREEN_WIDTH, height: 280 },
  image: { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, backgroundColor: COLORS.dark, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  videoPlayBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  videoPlay: { fontSize: 24, color: COLORS.white, marginLeft: 2 },
  counter: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: COLORS.overlayDark,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  counterText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border, marginHorizontal: 3 },
  dotActive: { backgroundColor: COLORS.primary, width: 16 },
});

// ── Single image styles ────────────────────────────────────────────────────────
const single = StyleSheet.create({
  image: { width: '100%', height: 220, backgroundColor: COLORS.bgAlt },
});

// ── Card styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOW.md,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', ...SHADOW.sm },
  avatarLetter: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  headerMeta: { flex: 1, marginLeft: 10 },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  memberNameLink: { color: COLORS.dark },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: {
    backgroundColor: COLORS.selected,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 11, color: COLORS.dark, fontWeight: '600' },
  timeAgo: { fontSize: 11, color: COLORS.textMuted },
  dotMenuBtn: { padding: 4 },
  dotMenuIcon: { fontSize: 22, color: COLORS.dark, fontWeight: '700' },

  // Body
  body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  postTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  description: { fontSize: 14, color: COLORS.text, lineHeight: 20 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  statsText: { fontSize: 12, color: COLORS.textMuted },

  divider: { height: 1, backgroundColor: COLORS.borderSoft, marginHorizontal: 14 },

  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 6 },
  actionIcon: { fontSize: 16, marginRight: 5 },
  actionLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  actionLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // Comments thread
  commentsSection: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },
  commentsLoadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  commentsLoadingText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 8 },
  noCommentsText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 10 },
  commentRow: { flexDirection: 'row', marginTop: 10 },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  commentAvatarLetter: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  commentBubble: {
    flex: 1, backgroundColor: COLORS.bgSoft, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentName: { fontSize: 12, fontWeight: '700', color: COLORS.dark },
  commentText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  commentTime: { fontSize: 10, color: COLORS.textMuted, marginLeft: 8 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 },
  commentInput: {
    flex: 1,
    minHeight: 52,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    maxHeight: 90,
    marginRight: 8,
  },
  commentSendBtn: { backgroundColor: COLORS.primary, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9 },
  commentSendBtnDisabled: { backgroundColor: COLORS.disabled },
  commentSendText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});

export default FeedCard;
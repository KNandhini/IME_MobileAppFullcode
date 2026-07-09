import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Dimensions, TextInput, ActivityIndicator,
} from 'react-native';
import api from '../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  '#1E3A5F', '#D4A017', '#27AE60', '#8E44AD',
  '#E67E22', '#2980B9', '#C0392B', '#16A085',
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
  const diff = Math.floor((Date.now() - postDate.getTime()) / 1000);

  // Future dates
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

// ── Media carousel for Post-type items ────────────────────────────────────────
const MediaCarousel = ({ mediaItems }) => {
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
          return (
            <View key={media.mediaId ?? index} style={carousel.slide}>
              {media.mediaType === 'video' ? (
                <View style={carousel.videoPlaceholder}>
                  <Text style={carousel.videoPlay}>▶</Text>
                  <Text style={carousel.videoLabel}>Video</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: url }}
                  style={carousel.image}
                  resizeMode="cover"
                  onError={(e) => console.log('Image load error mediaId=' + media.mediaId, e.nativeEvent.error)}
                  onLoad={() => console.log('Image loaded mediaId=' + media.mediaId)}
                />
              )}
            </View>
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
const SingleImage = ({ imagePath }) => {
  if (!imagePath) return null;
  const uri = toPublicUrl(imagePath);
  return <Image source={{ uri }} style={single.image} resizeMode="cover" />;
};

// ── Main card ─────────────────────────────────────────────────────────────────
const FeedCard = ({ item, navigation }) => {
  const colorIndex = (item.id || 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const memberName = item.memberName || 'IME Admin';
  const typeMeta = TYPE_LABELS[item.type] || { label: item.type || '', icon: '📌' };
  const timeAgo = getTimeAgo(item.postedDate);

  const isPost = item.type === 'Post';
  const hasCarousel = isPost && item.mediaItems && item.mediaItems.length > 0;
  const hasSingle = !isPost && item.hasImage && item.imagePath;

  // ── Like / Comment state ──────────────────────────────────────────
  // NOTE: likes/comments are only wired up for Post-type items today,
  // since tbl_PostInteractions.PostId references tbl_Posts. Activity/
  // News/Circular items will just have inert Like/Comment buttons.
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
    if (!isPost || likeBusy) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setLikeBusy(true);
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.post(`/feed/post/${item.id}/like`);
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
  }, [isPost, isLiked, likeCount, likeBusy, item.id]);

  // ── Load comments the first time the thread is opened ─────────────
  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/feed/post/${item.id}/comments`);
      if (res.data?.success) {
        setComments(res.data.data || []);
      }
    } catch (e) {
      // leave comments empty; user can retry by collapsing/expanding again
    } finally {
      setLoadingComments(false);
    }
  }, [item.id]);

  const handleToggleComments = useCallback(() => {
    if (!isPost) return;
    setShowComments((prev) => {
      const next = !prev;
      if (next && comments.length === 0) {
        loadComments();
      }
      return next;
    });
  }, [isPost, comments.length, loadComments]);

  // ── Post a new comment ─────────────────────────────────────────────
  const handleSendComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || postingComment) return;

    setPostingComment(true);
    try {
      const res = await api.post(`/feed/post/${item.id}/comment`, { commentDetails: trimmed });
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
  }, [commentText, postingComment, item.id]);

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
      {hasCarousel && <MediaCarousel mediaItems={item.mediaItems} />}
      {hasSingle && <SingleImage imagePath={item.imagePath} />}

      {/* ── Post Content ── */}
      <View style={styles.body}>
        {item.title ? <Text style={styles.postTitle}>{item.title}</Text> : null}
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>❤️ {likeCount} likes</Text>
        <TouchableOpacity onPress={handleToggleComments} activeOpacity={0.7} disabled={!isPost}>
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
          disabled={!isPost || likeBusy}
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
          disabled={!isPost}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionLabel, showComments && styles.actionLabelActive]}>Comment</Text>
        </TouchableOpacity>
      </View>

      {/* ── Comments thread (Post-type only) ── */}
      {isPost && showComments && (
        <View style={styles.commentsSection}>
          {loadingComments ? (
            <View style={styles.commentsLoadingRow}>
              <ActivityIndicator size="small" color="#1E3A5F" />
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
                  <Text style={styles.commentName}>{c.memberName}</Text>
                  <Text style={styles.commentText}>{c.commentDetails}</Text>
                  <Text style={styles.commentTime}>{getTimeAgo(c.createdDate)}</Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
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
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.commentSendText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
};

// ── Carousel styles ───────────────────────────────────────────────────────────
const carousel = StyleSheet.create({
  wrapper: { position: 'relative' },
  slide: { width: SCREEN_WIDTH, height: 280 },
  image: { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  videoPlay: { fontSize: 48, color: '#fff' },
  videoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, letterSpacing: 1 },
  counter: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#1E3A5F', width: 16 },
});

// ── Single image styles ────────────────────────────────────────────────────────
const single = StyleSheet.create({
  image: { width: '100%', height: 220, backgroundColor: '#eee' },
});

// ── Card styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerMeta: { flex: 1, marginLeft: 10 },
  memberName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  memberNameLink: { color: '#1E3A5F' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 11, color: '#1E3A5F', fontWeight: '600' },
  timeAgo: { fontSize: 11, color: '#999' },
  dotMenuBtn: { padding: 4 },
  dotMenuIcon: { fontSize: 22, color: '#555', fontWeight: '700' },

  // Body
  body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  postTitle: { fontSize: 15, fontWeight: '700', color: '#1E3A5F', marginBottom: 4 },
  description: { fontSize: 14, color: '#333', lineHeight: 20 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  statsText: { fontSize: 12, color: '#888' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },

  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 6 },
  actionIcon: { fontSize: 16, marginRight: 5 },
  actionLabel: { fontSize: 13, color: '#555', fontWeight: '600' },
  actionLabelActive: { color: '#1E3A5F', fontWeight: '700' },

  // Comments thread
  commentsSection: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentsLoadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  commentsLoadingText: { fontSize: 12, color: '#999', marginLeft: 8 },
  noCommentsText: { fontSize: 12, color: '#aaa', fontStyle: 'italic', paddingVertical: 10 },
  commentRow: { flexDirection: 'row', marginTop: 10 },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  commentAvatarLetter: { color: '#fff', fontSize: 13, fontWeight: '700' },
  commentBubble: {
    flex: 1, backgroundColor: '#F5F5F7', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  commentName: { fontSize: 12, fontWeight: '700', color: '#1E3A5F', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#333', lineHeight: 18 },
  commentTime: { fontSize: 10, color: '#999', marginTop: 4 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1a1a1a',
    maxHeight: 90,
    marginRight: 8,
  },
  commentSendBtn: { backgroundColor: '#1E3A5F', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9 },
  commentSendBtnDisabled: { backgroundColor: '#B0BEC5' },
  commentSendText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

export default FeedCard;
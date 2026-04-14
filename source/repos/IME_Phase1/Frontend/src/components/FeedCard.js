import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Dimensions,
} from 'react-native';
import { BASE_URL } from '../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVATAR_COLORS = [
  '#1E3A5F', '#D4A017', '#27AE60', '#8E44AD',
  '#E67E22', '#2980B9', '#C0392B', '#16A085',
];

const TYPE_LABELS = {
  Activity: { label: 'Activity', icon: '📅' },
  News:     { label: 'News',     icon: '📰' },
  Circular: { label: 'Circular', icon: '📋' },
  Post:     { label: 'Post',     icon: '📌' },
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60)      return 'Just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
        {mediaItems.map((media, index) => (
          <View key={media.mediaId ?? index} style={carousel.slide}>
            {media.mediaType === 'video' ? (
              <View style={carousel.videoPlaceholder}>
                <Text style={carousel.videoPlay}>▶</Text>
                <Text style={carousel.videoLabel}>Video</Text>
              </View>
            ) : (
              <Image
                source={{ uri: `${BASE_URL}/api/feed/media/${media.mediaId}` }}
                style={carousel.image}
                resizeMode="cover"
                onError={(e) => console.log('Image load error mediaId=' + media.mediaId, e.nativeEvent.error)}
                onLoad={() => console.log('Image loaded mediaId=' + media.mediaId)}
              />
            )}
          </View>
        ))}
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
  // imagePath may be a relative server path like "Uploads/News/xxx.jpg"
  const uri = imagePath.startsWith('http') ? imagePath : `${BASE_URL}/${imagePath}`;
  return <Image source={{ uri }} style={single.image} resizeMode="cover" />;
};

// ── Main card ─────────────────────────────────────────────────────────────────
const FeedCard = ({ item }) => {
  const colorIndex  = (item.id || 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const memberName  = item.memberName || 'IME Admin';
  const typeMeta    = TYPE_LABELS[item.type] || { label: item.type || '', icon: '📌' };
  const timeAgo     = getTimeAgo(item.postedDate);

  const isPost      = item.type === 'Post';
  const hasCarousel = isPost && item.mediaItems && item.mediaItems.length > 0;
  const hasSingle   = !isPost && item.hasImage && item.imagePath;

  return (
    <View style={styles.card}>

      {/* ── Card Header ── */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLetter}>{memberName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.memberName}>{memberName}</Text>
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
      {hasSingle   && <SingleImage  imagePath={item.imagePath} />}

      {/* ── Post Content ── */}
      <View style={styles.body}>
        {item.title       ? <Text style={styles.postTitle}>{item.title}</Text>       : null}
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>❤️ {item.likes ?? 0} likes</Text>
        <Text style={styles.statsText}>{item.comments ?? 0} comments</Text>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Action Buttons ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={styles.actionLabel}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

// ── Carousel styles ───────────────────────────────────────────────────────────
const carousel = StyleSheet.create({
  wrapper:          { position: 'relative' },
  slide:            { width: SCREEN_WIDTH, height: 280 },
  image:            { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  videoPlay:        { fontSize: 48, color: '#fff' },
  videoLabel:       { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, letterSpacing: 1 },
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
  dots:        { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginHorizontal: 3 },
  dotActive:   { backgroundColor: '#1E3A5F', width: 16 },
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
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  avatar:       { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerMeta:   { flex: 1, marginLeft: 10 },
  memberName:   { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  metaRow:      { flexDirection: 'row', alignItems: 'center' },
  typeBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 11, color: '#1E3A5F', fontWeight: '600' },
  timeAgo:       { fontSize: 11, color: '#999' },
  dotMenuBtn:    { padding: 4 },
  dotMenuIcon:   { fontSize: 22, color: '#555', fontWeight: '700' },

  // Body
  body:        { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  postTitle:   { fontSize: 15, fontWeight: '700', color: '#1E3A5F', marginBottom: 4 },
  description: { fontSize: 14, color: '#333', lineHeight: 20 },

  // Stats
  statsRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  statsText: { fontSize: 12, color: '#888' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },

  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  actionBtn:  { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 6 },
  actionIcon: { fontSize: 16, marginRight: 5 },
  actionLabel:{ fontSize: 13, color: '#555', fontWeight: '600' },
});

export default FeedCard;

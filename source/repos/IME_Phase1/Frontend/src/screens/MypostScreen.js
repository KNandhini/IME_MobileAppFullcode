import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl, Alert, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import api from '../utils/api';

const PAGE_SIZE = 10;

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

  // ── Base URL for media images, same pattern as ProfileScreen ──
  const baseUrl = api.defaults.baseURL.replace('/api', '');
  const getMediaUrl = (mediaId) => `${baseUrl}/api/Feed/media/${mediaId}`;

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
        Alert.alert('Error', res.message || 'Could not delete the post.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Header ─────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.appHeader}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Post</Text>
      <View style={styles.backBtn} />
    </View>
  );

  // ── Single post card (mirrors the feed card look, plus a delete icon) ──
  const renderPost = ({ item }) => {
    const media = item.mediaItems || [];
    const firstImage = media.find(m => m.mediaType === 'image') || media[0];

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(item.memberName || 'M').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardTopTexts}>
            <Text style={styles.memberName}>{item.memberName}</Text>
            <View style={styles.metaRow}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>📌 {item.type}</Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaTime}>{formatTimeAgo(item.postedDate)}</Text>
            </View>
          </View>

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
        </View>

        {!!item.description && <Text style={styles.cardBody}>{item.description}</Text>}

        {/* ── Attached media, same full-width treatment as the feed card ── */}
        {firstImage && (
          <Image
            source={{ uri: getMediaUrl(firstImage.mediaId) }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

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
          <ActivityIndicator size="small" color="#1E3A5F" />
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
        <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
        {renderHeader()}
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A5F" />
          <Text style={styles.centerText}>Loading your posts...</Text>
        </View>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
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
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E3A5F']} tintColor="#1E3A5F" />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>You haven't posted yet.</Text>
            <Text style={styles.emptySubText}>Pull down to refresh.</Text>
          </View>
        }
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

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1E3A5F' },
  list:         { flex: 1, backgroundColor: '#F0F2F5' },
  listContent:  { paddingBottom: 20 },
  emptyContent: { flexGrow: 1 },

  appHeader: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 44,
    paddingBottom: 14,
  },
  backBtn:    { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backIcon:   { color: '#fff', fontSize: 22 },
  headerTitle:{ color: '#fff', fontSize: 16, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 0 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  avatarLetter: { color: '#D4A017', fontSize: 16, fontWeight: '800' },
  cardTopTexts: { flex: 1 },
  memberName:   { fontSize: 14, fontWeight: '700', color: '#222' },
  metaRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  typePill: {
    backgroundColor: '#EEF1F5', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  typePillText: { fontSize: 11, color: '#555' },
  metaDot:      { fontSize: 12, color: '#aaa', marginHorizontal: 5 },
  metaTime:     { fontSize: 11, color: '#999' },

  deleteBtn:  { padding: 6, marginLeft: 6 },
  deleteIcon: { fontSize: 18 },

  cardBody: { fontSize: 14, color: '#333', marginTop: 10, lineHeight: 19, paddingHorizontal: 14 },

  // ── Full-width attached image, same treatment as the home feed card ──
  postImage: {
    width: '100%',
    height: 320,
    marginTop: 12,
    backgroundColor: '#eee',
  },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10, paddingHorizontal: 14,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  footerStat: { fontSize: 12, color: '#888' },

  footerLoader:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
  footerLoaderText: { fontSize: 13, color: '#888', marginLeft: 10 },
  endWrap:          { alignItems: 'center', paddingVertical: 26 },
  endText:          { fontSize: 13, color: '#aaa' },

  centerBox:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5', padding: 32 },
  centerText:  { marginTop: 14, fontSize: 14, color: '#888' },
  errorIcon:   { fontSize: 48, marginBottom: 12 },
  errorText:   { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
  retryBtn:    { backgroundColor: '#1E3A5F', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySubText: { fontSize: 13, color: '#aaa', marginTop: 4 },
});

export default MyPostScreen;
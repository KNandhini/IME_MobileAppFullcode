import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import api from '../utils/api';
import { MypostScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

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



export default MyPostScreen;
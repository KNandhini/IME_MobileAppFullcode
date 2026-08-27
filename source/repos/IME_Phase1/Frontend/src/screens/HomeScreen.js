import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FeedCard from '../components/FeedCard';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import { feedService } from '../services/feedService';
import { HomeScreenStyles as styles } from './screenStyles';
const PAGE_SIZE = 10;

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  // ── Reload on screen focus ──────────────────
  useFocusEffect(useCallback(() => {
    loadFeed(1, true);
  }, []));

  const loadFeed = async (pageNumber, isRefresh = false) => {
    try {
      if (isRefresh) setError(null);
      const res = await feedService.getFeed(pageNumber, PAGE_SIZE);
      if (res.success) {
        const newItems = res.data.items || [];
        if (isRefresh) {
          setPosts(newItems);
        } else {
          setPosts(prev => [...prev, ...newItems]);
        }
        setPage(pageNumber);
        setHasMore(res.data.hasMore);
      } else {
        setError('Failed to load feed.');
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
    loadFeed(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoad) return;
    setLoadingMore(true);
    loadFeed(page + 1, false);
  }, [loadingMore, hasMore, page, initialLoad]);

  // ── Welcome strip (Law Bot card removed) ────────────────────────────
  const renderFeedHeader = () => (
    <View>
      <View style={styles.welcomeStrip}>
        <View style={styles.welcomeAvatar}>
          <Text style={styles.welcomeAvatarLetter}>
            {(user?.fullName || user?.email || 'M').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.welcomeTexts}>
          <Text style={styles.welcomeGreeting}>What's happening in IME today?</Text>
        </View>
        {user?.roleName?.toLowerCase() !== 'student' && (
          <TouchableOpacity
            style={styles.newPostBtn}
            onPress={() => navigation.navigate('CreatePost')}
            activeOpacity={0.8}
          >
            <Text style={styles.newPostBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── Footer loader / end message ──────────────
  const renderFeedFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.footerText}>Loading more posts...</Text>
        </View>
      )}
      {!hasMore && !loadingMore && posts.length > 0 && (
        <View style={styles.endWrap}>
          <Text style={styles.endText}>You're all caught up! 🎉</Text>
        </View>
      )}
    </View>
  );

  // ── App header — gradient, simplified (no bell / no kebab menu) ──
  function renderAppHeader() {
    return (
      <GradientHeader style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>IME</Text>
          </View>
          <View>
            <Text style={styles.appName}>Institution of Municipal Engineers</Text>
            <Text style={styles.appTagline}>Connect · Grow · Achieve</Text>
          </View>
        </View>
      </GradientHeader>
    );
  }

  // ── Initial loading state ────────────────────
  if (initialLoad) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        {renderAppHeader()}
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.centerText}>Loading feed...</Text>
        </View>
      </View>
    );
  }

  // ── Error state ──────────────────────────────
  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        {renderAppHeader()}
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setInitialLoad(true); loadFeed(1, true); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {renderAppHeader()}

      <FlatList
        data={posts}
        keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
        renderItem={({ item }) => <FeedCard item={item} navigation={navigation} />}
        ListHeaderComponent={renderFeedHeader}
        ListFooterComponent={renderFeedFooter}
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
            <Text style={styles.emptyText}>No posts yet.</Text>
            <Text style={styles.emptySubText}>Pull down to refresh.</Text>
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;
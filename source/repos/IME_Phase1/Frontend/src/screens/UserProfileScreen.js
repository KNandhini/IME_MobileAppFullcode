import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Linking, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FeedCard from '../components/FeedCard';
import { feedService } from '../services/feedService';
import { chatService } from '../services/chatService';

const PAGE_SIZE = 10;

const UserProfileScreen = ({ navigation, route }) => {
  const { memberId, memberName, email } = route.params || {};
  const { user } = useAuth();

  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    loadPosts(1, true);
  }, [memberId]));

  const loadPosts = async (pageNumber, isRefresh = false) => {
    try {
      const res = await feedService.getMemberFeed(memberId, pageNumber, PAGE_SIZE);
      if (res.success) {
        const items = res.data?.items || [];
        setPosts(isRefresh ? items : prev => [...prev, ...items]);
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
          conversationId:   res.data.conversationId,
          otherMemberName:  memberName,
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

  const avatarColor = '#1E3A5F';
  const initial     = (memberName || 'M').charAt(0).toUpperCase();

  const renderHeader = () => (
    <View style={styles.profileCard}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarLetter}>{initial}</Text>
      </View>

      {/* Name + actions */}
      <View style={styles.nameRow}>
        <Text style={styles.memberName}>{memberName || 'Member'}</Text>
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.messageBtn]}
            onPress={handleMessage}
            disabled={chatLoading}
            activeOpacity={0.8}
          >
            {chatLoading
              ? <ActivityIndicator size="small" color="#fff" />
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

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#1E3A5F" />
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
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* Header bar */}
      <View style={styles.appHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{memberName || 'Profile'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {initialLoad ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A5F" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => `post-${item.id}-${index}`}
          renderItem={({ item }) => <FeedCard item={item} navigation={navigation} />}
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
              colors={['#1E3A5F']}
              tintColor="#1E3A5F"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E3A5F' },
  list:      { flex: 1, backgroundColor: '#F0F2F5' },
  listContent:  { paddingBottom: 20 },
  emptyContent: { flexGrow: 1 },

  appHeader: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 44,
    paddingBottom: 10,
  },
  backBtn:     { padding: 6 },
  backIcon:    { fontSize: 22, color: '#fff', fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },

  profileCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { color: '#D4A017', fontSize: 32, fontWeight: '800' },
  nameRow:      { alignItems: 'center', marginBottom: 16 },
  memberName:   { fontSize: 20, fontWeight: '800', color: '#1E3A5F', marginBottom: 12 },

  actionBtns: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtn:    { backgroundColor: '#1E3A5F' },
  mailBtn:       { backgroundColor: '#D4A017' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  postsLabelWrap: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 4,
  },
  postsLabel: { fontSize: 14, fontWeight: '700', color: '#1E3A5F' },

  footerLoader: { padding: 18, alignItems: 'center' },
  endWrap:      { alignItems: 'center', paddingVertical: 20 },
  endText:      { fontSize: 13, color: '#aaa' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#888' },
});

export default UserProfileScreen;

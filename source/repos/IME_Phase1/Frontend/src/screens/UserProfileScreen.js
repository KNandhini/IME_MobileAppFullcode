import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Linking, RefreshControl, Alert, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import { chatService } from '../services/chatService';
import { memberService } from '../services/memberService';
import api from '../utils/api';

const PAGE_SIZE = 10;

const UserProfileScreen = ({ navigation, route }) => {
  const { memberId, memberName, email } = route.params || {};
  const { user } = useAuth();

  // Only an Admin sees the delete icon on someone else's posts
  const isAdmin = user?.roleId === 1 || user?.roleName === 'Admin';

  const [posts,         setPosts]         = useState([]);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [initialLoad,   setInitialLoad]   = useState(true);
  const [chatLoading,   setChatLoading]   = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [profilePhoto,  setProfilePhoto]  = useState(null);
  const [clubName,      setClubName]      = useState(null);

  // ── Base URL for media images, same pattern as ProfileScreen ──
  const baseUrl = api.defaults.baseURL.replace('/api', '');
  const getMediaUrl = (mediaId) => `${baseUrl}/api/Feed/media/${mediaId}`;

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
        debugger;
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
        Alert.alert('Error', res.message || 'Could not delete the post.');
      }
    } catch (_) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setDeletingId(null);
    }
  };

  const avatarColor = '#1E3A5F';
  const initial     = (memberName || 'M').charAt(0).toUpperCase();

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

  // ── Single post card: avatar/name/time row, caption, full-width image, delete (admin only), footer ──
  const renderPost = ({ item }) => {
    const media      = item.mediaItems || [];
    const firstImage = media.find(m => m.mediaType === 'image') || media[0];

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

        {/* ── Attached media, full-width like the home feed card ── */}
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
  avatarPhoto: {
    width: 80, height: 80, borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#D4A017',
  },
  avatarLetter: { color: '#D4A017', fontSize: 32, fontWeight: '800' },
  nameRow:      { alignItems: 'center', marginBottom: 16 },
  nameClubWrap: { alignItems: 'center', marginBottom: 12 },
  memberName:   { fontSize: 20, fontWeight: '800', color: '#1E3A5F' },
  clubName:     { fontSize: 13, fontWeight: '600', color: '#888', marginTop: 2 },

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

  // ── Post card (mirrors home feed card, plus optional delete icon) ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 0 },
  cardAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  cardAvatarLetter: { color: '#D4A017', fontSize: 16, fontWeight: '800' },
  cardTopTexts:     { flex: 1 },
  cardMemberName:   { fontSize: 14, fontWeight: '700', color: '#222' },
  metaRow:          { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
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

  footerLoader: { padding: 18, alignItems: 'center' },
  endWrap:      { alignItems: 'center', paddingVertical: 20 },
  endText:      { fontSize: 13, color: '#aaa' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#888' },
});

export default UserProfileScreen;
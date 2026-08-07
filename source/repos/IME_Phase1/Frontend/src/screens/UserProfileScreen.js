import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Linking, RefreshControl, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import { chatService } from '../services/chatService';
import { memberService } from '../services/memberService';
import api from '../utils/api';
import { UserProfileScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const PAGE_SIZE = 10;

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

  // ── Single post card: avatar/name/time row, caption, full-width image, delete (admin only), footer ──
  const renderPost = ({ item }) => {
    const media = item.mediaItems || [];
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
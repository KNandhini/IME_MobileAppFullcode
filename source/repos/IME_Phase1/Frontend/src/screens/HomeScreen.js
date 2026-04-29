import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { Menu } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FeedCard from '../components/FeedCard';
import { feedService } from '../services/feedService';

const PAGE_SIZE = 10;

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [posts,        setPosts]        = useState([]);
  const [page,         setPage]         = useState(1);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [initialLoad,  setInitialLoad]  = useState(true);
  const [error,        setError]        = useState(null);
  const [menuVisible,  setMenuVisible]  = useState(false);
  const paymentPopupShown = useRef(false);

  // ── Payment pending popup (once per session) ──
  useEffect(() => {
    if (paymentPopupShown.current) return;
    const isPending =
      user?.paymentStatus === 'Pending' ||
      user?.paymentStatus === 'Unpaid'  ||
      user?.membershipStatus === 'Pending' ||
      user?.isPaymentPending === true;

    if (isPending) {
      paymentPopupShown.current = true;
      Alert.alert(
        '⚠️ Payment Pending',
        'Your membership registration payment is pending.\n\nPlease complete your payment to maintain full access to IMC Portal.',
        [
          {
            text: 'Pay Now',
            onPress: () => navigation.navigate('RegistrationPayment', {
              userId:      user?.userId      || user?.id,
              memberId:    user?.memberId    || user?.id,
              feeAmount:   user?.registrationFee || user?.feeAmount,
              memberName:  user?.fullName    || user?.name,
              memberEmail: user?.email,
            }),
          },
          { text: 'Remind Me Later', style: 'cancel' },
        ],
      );
    }
  }, [user]);

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

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  // ── Welcome strip ────────────────────────────
  const renderFeedHeader = () => (
    <View style={styles.welcomeStrip}>
      <View style={styles.welcomeAvatar}>
        <Text style={styles.welcomeAvatarLetter}>
          {(user?.fullName || user?.email || 'M').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.welcomeTexts}>
        <Text style={styles.welcomeGreeting}>
          Hello, {user?.fullName?.split(' ')[0] || 'Member'} 👋
        </Text>
        <Text style={styles.welcomeSub}>What's happening in IME today?</Text>
      </View>
      <TouchableOpacity
        style={styles.newPostBtn}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <Text style={styles.newPostBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Footer loader / end message ──────────────
  const renderFeedFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#1E3A5F" />
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

  // ── Initial loading state ────────────────────
  if (initialLoad) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
        {renderAppHeader()}
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A5F" />
          <Text style={styles.centerText}>Loading feed...</Text>
        </View>
      </View>
    );
  }

  // ── Error state ──────────────────────────────
  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
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

  // ── App header (extracted as function for reuse in loading/error states) ──
  function renderAppHeader() {
    return (
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>IME</Text>
          </View>
          <View>
            <Text style={styles.appName}>Indian Municipal Engineers</Text>
            <Text style={styles.appTagline}>Connect · Grow · Achieve</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.75}>
            <Text style={styles.iconBtnText}>🔔</Text>
          </TouchableOpacity>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={styles.menuContent}
            anchor={
              <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)} activeOpacity={0.75}>
                <Text style={styles.kebabIcon}>⋮</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item title="👤  My Profile"   titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }} />
            {user?.roleName === 'Admin' && (
              <Menu.Item title="⚙️  Admin Dashboard" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('AdminDashboard'); }} />
            )}
            <Menu.Item title="🏢  Organisation" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('Organisation'); }} />
            <Menu.Item title="📖  About IME"    titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('About'); }} />
            <View style={styles.menuSep} />
            <Menu.Item title="🚪  Logout" titleStyle={[styles.menuItemText, { color: '#C0392B' }]} onPress={handleLogout} />
          </Menu>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

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
            colors={['#1E3A5F']}
            tintColor="#1E3A5F"
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

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1E3A5F' },
  list:        { flex: 1, backgroundColor: '#F0F2F5' },
  listContent: { paddingBottom: 20 },
  emptyContent:{ flexGrow: 1 },

  // App header
  appHeader: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 44,
    paddingBottom: 10,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#D4A017',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  logoText:   { color: '#1E3A5F', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  appName:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  appTagline: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn:     { padding: 7, marginLeft: 2 },
  iconBtnText: { fontSize: 20 },
  kebabIcon:   { fontSize: 26, color: '#fff', fontWeight: '700' },
  menuContent: { backgroundColor: '#fff', borderRadius: 10, elevation: 8, minWidth: 200 },
  menuItemText:{ fontSize: 14, color: '#222' },
  menuSep:     { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 12, marginVertical: 4 },

  // Welcome strip
  welcomeStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
  },
  welcomeAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  welcomeAvatarLetter: { color: '#D4A017', fontSize: 20, fontWeight: '800' },
  welcomeTexts:        { flex: 1 },
  welcomeGreeting:     { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  welcomeSub:          { fontSize: 12, color: '#888', marginTop: 2 },
  newPostBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  newPostBtnText: { color: '#D4A017', fontSize: 24, fontWeight: '700', lineHeight: 28 },

  // Footer
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
  footerText:   { fontSize: 13, color: '#888', marginLeft: 10 },
  endWrap:      { alignItems: 'center', paddingVertical: 26 },
  endText:      { fontSize: 13, color: '#aaa' },

  // Center (loading / error)
  centerBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5', padding: 32 },
  centerText: { marginTop: 14, fontSize: 14, color: '#888' },
  errorIcon:  { fontSize: 48, marginBottom: 12 },
  errorText:  { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
  retryBtn:   { backgroundColor: '#1E3A5F', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  // Empty
  emptyWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySubText: { fontSize: 13, color: '#aaa', marginTop: 4 },
});

export default HomeScreen;

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, Alert } from 'react-native';
import { Menu } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import FeedCard from '../components/FeedCard';
import { feedService } from '../services/feedService';
import { HomeScreenStyles as styles } from './screenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
const PAGE_SIZE = 10;

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const paymentPopupShown = useRef(false);
const [restricted, setRestricted] = useState(false);
const [isMember, setIsMember] = useState(false);
useEffect(() => {
  const checkOccupation = async () => {
    try {
      const raw = await AsyncStorage.getItem('userData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.occupation?.toLowerCase() === 'unemployed') {
          setRestricted(true);
        }
         if (parsed?.roleName === 'Member') {
          setIsMember(true);
        }
      }
    } catch (e) {
      console.warn('Failed to check occupation:', e);
    }
  };
  checkOccupation();
}, []);
  // ── Payment pending popup (once per session, driven by server roleId/membershipStatus/graceExpiryDate) ──
  useEffect(() => {
    if (paymentPopupShown.current) return;
    checkPaymentGrace();
  }, [user]);

  const checkPaymentGrace = async () => {
    try {
      // Admins (roleId 1) never see the payment-pending popup
      if (user?.roleId === 1) return;

      // Only Members (roleId 2) are subject to this check
      if (user?.roleId !== 2) return;

      // Only relevant if their membership is actually pending
      if (user?.membershipStatus !== 'Pending') return;

      // Grace deadline comes straight from the server on login
      if (!user?.graceExpiryDate) return;

      const expiry = new Date(user.graceExpiryDate).getTime();
      const msLeft = expiry - Date.now();

      if (msLeft <= 0) {
        // Grace period already expired — nothing to show
        return;
      }

      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      paymentPopupShown.current = true;

      Alert.alert(
        '⚠️ Payment Pending',
        `Your membership registration payment is pending.\n\nYou have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining to complete payment before your account expires.`,
        [
          {
            text: 'Pay Now',
            onPress: () => navigation.navigate('RegistrationPayment', { memberId: user?.memberId }),
          },
          { text: 'Remind Me Later', style: 'cancel' },
        ],
      );
    } catch (_) { }
  };

  // ── Reload on screen focus ──────────────────
  useFocusEffect(useCallback(() => {
    loadFeed(1, true);
  }, []));

  const loadFeed = async (pageNumber, isRefresh = false) => {
    try {
      debugger;
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
    <View>
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

      {/* Law Bot card as its own row below the strip */}
      <TouchableOpacity
        style={styles.lawBotCard}
        onPress={() => navigation.navigate('LawBot')}
        activeOpacity={0.85}
      >
        <Text style={styles.lawBotTitle}>⚖️ Law Assistant</Text>
        <Text style={styles.lawBotSubtitle}>
          Ask questions about the 74th Amendment Act
        </Text>
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
            <Text style={styles.appName}>Institute of Municipal Engineers</Text>
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
  <Menu.Item title="👤  My Profile" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }} />
  {!restricted && user?.roleName === 'Admin' && (
    <Menu.Item title="⚙️  Admin Dashboard" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('AdminDashboard'); }} />
  )}
  {!restricted && (
    <>
      <Menu.Item title="🏢  Organisation" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('Organisation'); }} />
      <Menu.Item title="📰  Magazine" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('Magazines'); }} />
    </>
  )}
  {isMember && (
    <Menu.Item title="💼  Job Postings" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('JobPostingList'); }} />
  )}
  <Menu.Item title="ℹ️  About IME" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('About'); }} />
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



export default HomeScreen;
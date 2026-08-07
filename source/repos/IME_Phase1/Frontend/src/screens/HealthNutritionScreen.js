import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { healthNutritionService } from '../services/healthNutritionService';
import { HealthNutritionScreenStyles as styles } from './screenStyles';
import ListSearchBar from '../components/ListSearchBar';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const PAGE_SIZE = 20;

const ATTACHMENT_ICON = {
  image: 'image-outline',
  audio: 'music-circle-outline',
  video: 'video-outline',
  pdf: 'file-pdf-box',
  other: 'file-download-outline',
};

// Note: this screen is deliberately NOT wired into feedService / FundTab.
// Health & Nutrition posts only appear here, opened from its own tile
// (Admin Dashboard -> "Health & Nutrition") — they never show in the
// main Post feed the way Circular/Achievement items do.
const HealthNutritionScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadRole = async () => {
      const raw = await AsyncStorage.getItem('userData');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const role = (parsed.roleName || parsed.role || '').trim().toLowerCase();
      setUserRole(role === 'admin' ? 'Admin' : 'Member');
    };
    loadRole();
  }, []);

  const fetchPage = useCallback(async (page, append, searchTerm = search) => {
    const res = await healthNutritionService.getAll({
      search: searchTerm,
      pageNumber: page,
      pageSize: PAGE_SIZE,
    });
    if (!res?.success) return;
    const data = res.data;
    setItems((prev) => (append ? [...prev, ...data.items] : data.items));
    setTotalPages(data.totalPages || 1);
    setPageNumber(data.pageNumber || page);
  }, [search]);

  const loadFirstPage = async () => {
    setLoading(true);
    try {
      await fetchPage(1, false);
    } catch (e) {
      console.log('HealthNutrition load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadFirstPage(); }, []);
  useFocusEffect(useCallback(() => { loadFirstPage(); }, []));

  // Debounced server-side search, mirrors the client-side filter pattern
  // used by CircularScreen/ActivitiesScreen but backed by the API's
  // `search` param instead of filtering an already-fetched array.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search === '') return; // covered by loadFirstPage above
      setLoading(true);
      fetchPage(1, false, search).finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => { setRefreshing(true); loadFirstPage(); };

  const onEndReached = async () => {
    if (loadingMore || pageNumber >= totalPages) return;
    setLoadingMore(true);
    try {
      await fetchPage(pageNumber + 1, true);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Post', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await healthNutritionService.delete(item.id);
            loadFirstPage();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete. Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('HealthNutritionDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.chip}>
          <MaterialCommunityIcons
            name={ATTACHMENT_ICON[item.attachmentType] || ATTACHMENT_ICON.other}
            size={14}
            color={NAVY}
          />
          <Text style={styles.chipText}>{(item.attachmentType || 'file').toUpperCase()}</Text>
        </View>

        {userRole === 'Admin' && (
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); navigation.navigate('HealthNutritionForm', { item }); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={NAVY} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
        <Text style={styles.metaText} numberOfLines={1}>{item.postedUser}</Text>
      </View>

      <View style={styles.dateRow}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color="#94A3B8" />
          <Text style={styles.date}>
            {item.postedBy ? new Date(item.postedBy).toLocaleDateString('en-IN') : ''}
          </Text>
        </View>
        <Text style={styles.viewHint}>Tap to view ›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ListSearchBar value={search} onChangeText={setSearch} placeholder="Search health & nutrition posts..." />

      {loading && items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-apple-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyText}>No Health & Nutrition posts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={GOLD} /> : null}
        />
      )}

      {userRole === 'Admin' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 20 + insets.bottom }]}
          onPress={() => navigation.navigate('HealthNutritionForm')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HealthNutritionScreen;
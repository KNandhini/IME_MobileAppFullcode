import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Searchbar, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { clubService } from '../services/clubService';
import api from '../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ClubListScreenStyles as styles } from './screenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// api.defaults.baseURL is usually something like "http://host:port/api"
// strip the trailing "/api" so we get the plain server root to prefix
// the raw disk-style paths ("Uploads\Clubs-11\xyz.jpeg") that come back
// from the backend. Same helper as AchievementDetailScreen for consistency.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// logoPath from the server can be a raw disk path like "Uploads\Clubs-11\xyz.jpeg"
// (or a full absolute path once the backend stores GetFullPath()) — convert it
// into a URL the app can actually load/display.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const FILTERS = ['All', 'Active', 'Inactive'];

export default function ClubListScreen({ navigation }) {
  const [clubs, setClubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { loadClubs(); }, []));

  const loadClubs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const res = await clubService.getAll();
    if (res.success) {
      setClubs(res.data || []);
      applyFilter(res.data || [], search, filter);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const applyFilter = (list, q, status) => {
    let result = list;
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(
        c => c.clubName?.toLowerCase().includes(lower)
          || c.clubCode?.toLowerCase().includes(lower)
          || c.city?.toLowerCase().includes(lower)
      );
    }
    if (status === 'Active') result = result.filter(c => c.isActive);
    else if (status === 'Inactive') result = result.filter(c => !c.isActive);
    setFiltered(result);
  };

  const handleSearch = (q) => {
    setSearch(q);
    applyFilter(clubs, q, filter);
  };

  const handleFilter = (status) => {
    setFilter(status);
    applyFilter(clubs, search, status);
  };

  const handleDelete = (club) => {
    Alert.alert(
      'Delete Club',
      `Delete "${club.clubName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const res = await clubService.delete(club.clubId);
            if (res.success) {
              Alert.alert('Deleted', 'Club deleted successfully.');
              loadClubs();
            } else {
              Alert.alert('Error', res.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const logoUrl = toPublicUrl(item.logoPath);

    return (
      <View style={styles.card}>
        {/* ── Header row: status badge on the left, edit/delete on the right ── */}
        <View style={styles.cardHeaderRow}>
          <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ClubForm', { clubId: item.clubId })}
              style={{ padding: 4, marginRight: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color="#1E3A5F"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={{ padding: 4 }}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color="#D9534F"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardTop}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoImg} />
          ) : (
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{(item.clubName || 'C').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.clubName}>{item.clubName}</Text>
            {item.clubCode ? <Text style={styles.clubCode}>Code: {item.clubCode}</Text> : null}
            {item.clubType ? <Text style={styles.clubMeta}>🏛 {item.clubType}</Text> : null}
            {item.city || item.stateName
              ? <Text style={styles.clubMeta}>📍 {[item.city, item.stateName].filter(Boolean).join(', ')}</Text>
              : null}
            {item.contactNumber ? <Text style={styles.clubMeta}>📞 {item.contactNumber}</Text> : null}
            {item.adminMemberNames ? <Text style={styles.clubMeta}>👤 {item.adminMemberNames}</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered,{ backgroundColor: '#fff' }]}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
     <Searchbar
  placeholder="Search clubs..."
  value={search}
  onChangeText={handleSearch}
  style={[styles.searchbar, { backgroundColor: '#fff' }]}
  inputStyle={{ fontSize: 14 }}
/>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => handleFilter(f)}
            style={[styles.chip, filter === f && styles.chipSelected]}
            textStyle={[styles.chipText, filter === f && styles.chipTextSelected]}
          >
            {f}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.clubId)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadClubs(true)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>No clubs found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab,{ bottom: 10 + insets.bottom }]}
        onPress={() => navigation.navigate('ClubForm', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
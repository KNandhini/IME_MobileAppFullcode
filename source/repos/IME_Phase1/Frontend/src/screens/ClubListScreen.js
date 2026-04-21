import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Searchbar, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { clubService } from '../services/clubService';
import { BASE_URL } from '../utils/api';

const FILTERS = ['All', 'Active', 'Inactive'];

export default function ClubListScreen({ navigation }) {
  const [clubs, setClubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    const logoUrl = item.logoPath
      ? `${BASE_URL}/Uploads/${item.logoPath.replace(/\\/g, '/')}`
      : null;

    return (
    <View style={styles.card}>
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
        <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('ClubForm', { clubId: item.clubId })}
        >
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
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
        style={styles.searchbar}
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
        style={styles.fab}
        onPress={() => navigation.navigate('ClubForm', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchbar:  { margin: 12, marginBottom: 6, elevation: 2, borderRadius: 10 },
  filterRow:  { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  chip:       { backgroundColor: '#E0E7EF' },
  chipSelected: { backgroundColor: '#1E3A5F' },
  chipText:     { fontSize: 12, color: '#1E3A5F' },
  chipTextSelected: { color: '#fff' },

  list: { paddingHorizontal: 12, paddingBottom: 100 },

  card:    { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 14, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },

  avatarBox:  { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  cardInfo:  { flex: 1 },
  clubName:  { fontSize: 15, fontWeight: '700', color: '#1E3A5F', marginBottom: 2 },
  clubCode:  { fontSize: 12, color: '#888', marginBottom: 2 },
  clubMeta:  { fontSize: 12, color: '#555', marginBottom: 1 },

  badge:           { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeActive:     { backgroundColor: '#E8F5E9' },
  badgeInactive:   { backgroundColor: '#FFEBEE' },
  badgeText:       { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#2E7D32' },
  badgeTextInactive: { color: '#C62828' },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  editBtn:     { flex: 1, backgroundColor: '#EBF0FA', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { color: '#1E3A5F', fontWeight: '600', fontSize: 13 },
  deleteBtn:   { flex: 1, backgroundColor: '#FFEBEE', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { color: '#C62828', fontWeight: '600', fontSize: 13 },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },

  fab:     { position: 'absolute', right: 20, bottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#D4A017', fontSize: 24, fontWeight: '700', lineHeight: 28 },
});

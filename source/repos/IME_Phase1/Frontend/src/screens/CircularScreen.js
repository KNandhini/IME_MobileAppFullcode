import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { circularService } from '../services/circularService';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback } from 'react';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const CircularScreen = ({ navigation }) => {
  const [circulars,  setCirculars]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'Admin';

  const loadCirculars = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await circularService.getByClub()
        : await circularService.getAll();
      if (response.success) setCirculars(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadCirculars(); }, []);
  useFocusEffect(useCallback(() => { loadCirculars(); }, []));

  const onRefresh = () => { setRefreshing(true); loadCirculars(); };

  const deleteCircular = (id) => {
    Alert.alert('Delete Circular', 'Are you sure you want to delete this circular?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await circularService.delete(id); loadCirculars(); },
      },
    ]);
  };

 const renderCircular = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => navigation.navigate('CircularDetail', { item })}
    activeOpacity={0.85}
  >
    {/* ── Top row: chip + Edit/Delete ── */}
    <View style={styles.cardHeader}>

      {/* LEFT: circular number chip only */}
      <View style={styles.leftBadges}>
        {item.circularNumber ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.circularNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* RIGHT: admin actions */}
      {isAdmin && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); navigation.navigate('AddCircular', { item }); }}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={22} color={NAVY} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); deleteCircular(item.circularId); }}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color="#D9534F" />
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* ✅ Visibility badge — below chip, left-aligned */}
    <View style={[
      styles.visBadge,
      item.visibility === 'Club' ? styles.visBadgeClub : styles.visBadgeAll,
    ]}>
      <Text style={styles.visText}>
        {item.visibility === 'Club' ? 'My Club' : 'All Members'}
      </Text>
    </View>

    {/* Title */}
    <Text style={styles.title}>{item.title}</Text>

    {/* Description */}
    {item.description ? (
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
    ) : null}

    {/* Date row */}
    <View style={styles.dateRow}>
      <Text style={styles.date}>
        {item.publishDate
          ? new Date(item.publishDate).toLocaleDateString('en-IN')
          : ''}
      </Text>
      <Text style={styles.viewHint}>Tap to view ›</Text>
    </View>
  </TouchableOpacity>
);

  return (
    <View style={styles.container}>
      {circulars.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No circulars available</Text>
        </View>
      ) : (
        <FlatList
          data={circulars}
          renderItem={renderCircular}
          keyExtractor={(item) => item.circularId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddCircular')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CircularScreen;

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F7FA' },
  list:           { padding: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },

  /* header row */
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },

  /* ✅ left group — shrinks to content */
  leftBadges: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, flexShrink: 1,
  },

  /* circular-number chip */
  chip:     { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#3B82F6', letterSpacing: 0.3 },

  /* ✅ visibility badge — alignSelf keeps it compact */
  visBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start',marginBottom: 8,  },
  visBadgeAll: { backgroundColor: '#DBEAFE' },
  visBadgeClub:{ backgroundColor: '#FEF3C7' },
  visText:     { fontSize: 10, fontWeight: '700', color: '#475569' },

  /* admin action icons */
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:   { padding: 4 },

  /* card body */
  title:       { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  description: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 8 },
  dateRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  date:        { fontSize: 12, color: '#94A3B8' },
  viewHint:    { fontSize: 11, color: '#3B82F6', fontWeight: '600' },

  /* empty state */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 16, color: '#999' },

  /* FAB */
  fab:     { position: 'absolute', right: 20, bottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: GOLD, fontSize: 24, fontWeight: '700', lineHeight: 28 },
});
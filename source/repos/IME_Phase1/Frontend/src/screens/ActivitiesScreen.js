import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const STATUS_COLORS = {
  Upcoming:  '#DBEAFE',
  Ongoing:   '#DCFCE7',
  Completed: '#F3F4F6',
  Cancelled: '#FEE2E2',
};

const ActivitiesScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'Admin';

  useFocusEffect(useCallback(() => { loadActivities(); }, []));

  const loadActivities = async () => {
    setLoading(true);
    try {
      debugger;
      const res = isAdmin
        ? await activityService.getByClub()
        : await activityService.getAll();
      if (res.success) setActivities(res.data || []);
    } catch (e) { debugger; console.log('Activities load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadActivities(); };

  const handleDelete = (activityId, title) => {
    Alert.alert('Delete Activity', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await activityService.delete(activityId);
            if (res.success) {
              setActivities(p => p.filter(a => a.activityId !== activityId));
            } else {
              Alert.alert('Error', res.message || 'Failed to delete.');
            }
          } catch { Alert.alert('Error', 'Failed to delete activity.'); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[
          styles.visibilityBadge,
          item.visibility === 'Club' ? styles.badgeClub : styles.badgeAll,
        ]}>
          <Text style={styles.visibilityText}>
            {item.visibility === 'Club' ? 'My Club' : 'All Members'}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('ActivityForm', { activityId: item.activityId })}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.activityId, item.activityName)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.activityId })}>
        <Text style={styles.title}>{item.activityName}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.activityDate && (
            <Text style={styles.metaText}>
              📅 {new Date(item.activityDate).toLocaleDateString('en-IN')}
            </Text>
          )}
          {item.venue ? <Text style={styles.metaText}>📍 {item.venue}</Text> : null}
        </View>
        {item.status ? (
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#F3F4F6' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.activityId?.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No activities found</Text>
              {isAdmin && (
                <Text style={styles.emptyHint}>Tap + to add your first activity</Text>
              )}
            </View>
          )
        }
      />
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ActivityForm')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F5F7FA' },
  list:            { padding: 12, paddingBottom: 80 },

  card:            { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },

  visibilityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeAll:        { backgroundColor: '#DBEAFE' },
  badgeClub:       { backgroundColor: '#FEF3C7' },
  visibilityText:  { fontSize: 11, fontWeight: '700', color: '#475569' },

  actionRow:       { flexDirection: 'row', gap: 6 },
  editBtn:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  editText:        { fontSize: 13, color: '#334155', fontWeight: '600' },
  deleteBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  deleteText:      { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  title:           { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  description:     { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 6 },
  metaRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  metaText:        { fontSize: 12, color: '#94A3B8' },
  statusBadge:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  statusText:      { fontSize: 11, fontWeight: '600', color: '#475569' },

  empty:           { alignItems: 'center', paddingVertical: 60 },
  emptyText:       { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  emptyHint:       { fontSize: 13, color: '#CBD5E1', marginTop: 8 },

  fab:             { position: 'absolute', right: 20, bottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText:         { color: GOLD, fontSize: 24, fontWeight: '700', lineHeight: 28 },
});

export default ActivitiesScreen;

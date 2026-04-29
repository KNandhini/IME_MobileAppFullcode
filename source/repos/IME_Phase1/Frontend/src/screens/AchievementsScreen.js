import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, StatusBar, Image, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { useAuth } from '../context/AuthContext';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const AVATAR_COLORS = ['#1E3A5F', '#D4A017', '#27AE60', '#8E44AD', '#E67E22', '#2980B9'];

const AchievementCard = ({ item, onPress, onDelete, index }) => {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = (item.memberName || 'M').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const dateStr = item.achievementDate
    ? new Date(item.achievementDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Circular member avatar */}
      <View style={styles.avatarWrap}>
        {item.memberPhotoPath ? (
          <Image source={{ uri: item.memberPhotoPath }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: bg }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        {/* Gold trophy badge */}
        <View style={styles.trophyBadge}>
          <Text style={{ fontSize: 10 }}>🏆</Text>
        </View>
      </View>

      {/* Member name */}
      <Text style={styles.memberName} numberOfLines={1}>{item.memberName || 'Member'}</Text>

      {/* Achievement title */}
      <Text style={styles.achTitle} numberOfLines={2}>{item.title}</Text>

      {/* Date */}
      {dateStr ? <Text style={styles.achDate}>{dateStr}</Text> : null}

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={(e) => { e.stopPropagation(); onDelete(item.achievementId); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const AchievementsScreen = ({ navigation }) => {
  const [achievements, setAchievements] = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const { user } = useAuth();

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const res = await achievementService.getAll();
      if (res.success) setAchievements(res.data || []);
    } catch (e) { console.error('Achievements load error:', e); }
    finally { setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (id) => {
    Alert.alert('Delete Achievement', 'Are you sure you want to delete this achievement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await achievementService.delete(id);
            load();
          } catch { Alert.alert('Error', 'Failed to delete.'); }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Hall of Fame</Text>
        <Text style={styles.headerSub}>Celebrating Excellence</Text>
      </View>

      {achievements.length === 0 && !refreshing ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="trophy-outline" size={56} color="#CBD5E1" />
          <Text style={styles.emptyText}>No achievements yet</Text>
          <Text style={styles.emptySub}>Be the first to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={achievements}
          numColumns={2}
          renderItem={({ item, index }) => (
            <AchievementCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('AchievementDetail', { item })}
              onDelete={handleDelete}
            />
          )}
          keyExtractor={(item) => item.achievementId.toString()}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />}
        />
      )}

      {/* FAB — all members can add */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AchievementForm')}
        activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" size={26} color={GOLD} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: NAVY, padding: 20, alignItems: 'center',
    paddingTop: (StatusBar.currentHeight || 0) + 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  list: { padding: 12, paddingBottom: 90 },
  row:  { justifyContent: 'space-between' },

  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    position: 'relative',
  },

  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: GOLD,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },
  trophyBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#fff', borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },

  memberName: {
    fontSize: 13, fontWeight: '700', color: NAVY,
    textAlign: 'center', marginBottom: 4,
  },
  achTitle: {
    fontSize: 12, color: '#475569',
    textAlign: 'center', lineHeight: 17, marginBottom: 6,
  },
  achDate: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },

  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    padding: 4,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, color: '#94A3B8', marginTop: 12, fontWeight: '600' },
  emptySub:  { fontSize: 13, color: '#CBD5E1', marginTop: 4 },

  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
});

export default AchievementsScreen;

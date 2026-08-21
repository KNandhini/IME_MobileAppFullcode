import { COLORS } from './theme';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivitiesScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListSearchBar from '../components/ListSearchBar';
const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

const STATUS_COLORS = {
  Upcoming: '#DBEAFE',
  Ongoing: '#DCFCE7',
  Completed: '#F3F4F6',
  Cancelled: '#FEE2E2',
};

const ActivitiesScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'Admin';
const insets = useSafeAreaInsets();
  const query = search.trim().toLowerCase();
  const filteredActivities = query
    ? activities.filter((item) => [item.activityName, item.description, item.venue, item.status, item.visibility]
        .some((value) => String(value ?? '').toLowerCase().includes(query)))
    : activities;
  useFocusEffect(useCallback(() => { loadActivities(); }, []));

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = isAdmin
        ? await activityService.getByClub()
        : await activityService.getAll();
      if (res.success) setActivities(res.data || []);
    } catch (e) { console.log('Activities load error:', e); }
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
              Alert.alert('Error', getSafeErrorMessage(res));
            }
          } catch { Alert.alert('Error', 'Failed to delete activity.'); }
        },
      },
    ]);
  };

 const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.activityId })}
    >
      {/* ── Card header: status badge on the left, edit/delete on the top-right ── */}
      <View style={styles.cardHeader}>
        {item.status ? (
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#F3F4F6' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        ) : (
          <View />
        )}

        {isAdmin && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('ActivityForm', { activityId: item.activityId });
              }}
              style={{ padding: 4, marginRight: 2 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={COLORS.dark}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.activityId, item.activityName);
              }}
              style={{ padding: 4 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color="#D9534F"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View>
        <Text style={styles.title}>{item.activityName}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

       <View style={{ marginTop: 8 }}>
  {/* Date */}
  {item.activityDate && (
    <Text style={styles.metaText}>
      📅 {new Date(item.activityDate).toLocaleDateString('en-IN')}
    </Text>
  )}

  {/* Venue - always next line */}
  {item.venue ? (
    <Text
      style={[styles.metaText, { marginTop: 4 }]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      📍 {item.venue}
    </Text>
  ) : null}

  {/* Tap to view - next line, right aligned */}
  <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
    <Text
      style={
        styles.viewHint || {
          color: '#3B82F6',
          fontSize: 12,
          fontWeight: '600',
        }
      }
    >
      Tap to view ›
    </Text>
  </View>
</View>
      </View>
    </TouchableOpacity>
  );

  return (

  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
  <View style={styles.container}>
    <ListSearchBar value={search} onChangeText={setSearch} placeholder="Search activities..." />
    {loading && activities.length === 0 ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    ) : (
      <FlatList
        data={filteredActivities}
        renderItem={renderItem}
        keyExtractor={(item) => item.activityId?.toString()}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GOLD]} />
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
    )}
    {isAdmin && (
      <TouchableOpacity style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={() => navigation.navigate('ActivityForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    )}
  </View>
  </KeyboardAvoidingView>

  );
};



export default ActivitiesScreen;
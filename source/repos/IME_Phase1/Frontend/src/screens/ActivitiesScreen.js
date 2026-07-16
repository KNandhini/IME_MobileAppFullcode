import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivitiesScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

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
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'Admin';
const insets = useSafeAreaInsets();
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
              Alert.alert('Error', getSafeErrorMessage(res));
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
      {isAdmin && (
        <View style={[styles.actionRow, { marginTop: 5, justifyContent: 'flex-end' }]}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ActivityForm', { activityId: item.activityId })
            }
            style={{ padding: 4, marginRight: 2 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color="#1E3A5F"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item.activityId, item.activityName)}
            style={{ padding: 4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color="#D9534F"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>

  );

  return (
   
  <View style={styles.container}>
    {loading && activities.length === 0 ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    ) : (
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
    )}
    {isAdmin && (
      <TouchableOpacity style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={() => navigation.navigate('ActivityForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    )}
  </View>

  );
};



export default ActivitiesScreen;

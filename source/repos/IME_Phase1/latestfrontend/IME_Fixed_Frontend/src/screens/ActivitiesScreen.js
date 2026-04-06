import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';

const ActivitiesScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => { loadActivities(); }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await activityService.getAll();
      if (res.success) setActivities(res.data || []);
    } catch (e) { console.error('Activities load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadActivities(); };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ActivityDetail', { activityId: item.activityId })}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.activityName || item.title}</Title>
          <Paragraph numberOfLines={3}>{item.description}</Paragraph>
          <View style={styles.meta}>
            <Text style={styles.metaText}>📅 {item.activityDate ? new Date(item.activityDate).toLocaleDateString('en-IN') : 'TBD'}</Text>
            {item.venue ? <Text style={styles.metaText}>📍 {item.venue}</Text> : null}
            {item.time  ? <Text style={styles.metaText}>⏰ {item.time}</Text>  : null}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.activityId?.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />}
        ListEmptyComponent={
          !loading && <View style={styles.empty}><Text style={styles.emptyText}>No activities available</Text></View>
        }
      />

      {user?.roleName === 'Admin' && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ActivityForm')}>
          <Text style={styles.fabText}>+ Add Activity</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list:      { padding: 15, paddingBottom: 80 },
  card:      { marginBottom: 15, elevation: 2 },
  meta:      { marginTop: 10 },
  metaText:  { fontSize: 12, color: '#666', marginTop: 4 },
  empty:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#999' },
  fab:       { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1E3A5F', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 28, elevation: 4 },
  fabText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default ActivitiesScreen;

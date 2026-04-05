import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';

const ActivitiesScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await activityService.getAll();
      if (response.success) {
        setActivities(response.data);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.activityId })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.activityName}</Title>
          <Paragraph numberOfLines={3}>{item.description}</Paragraph>
          <View style={styles.details}>
            <Text style={styles.detailText}>📅 {item.activityDate}</Text>
            <Text style={styles.detailText}>📍 {item.venue}</Text>
            <Text style={styles.detailText}>⏰ {item.time}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.activityId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities available</Text>
          </View>
        }
      />

      {(user?.roleName === 'Admin' || user?.roleId === 1) && (
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('ActivityForm')}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 15,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  details: {
    marginTop: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    textAlign: 'center',
    marginTop: -2,
  },
});

export default ActivitiesScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { List, Divider, Badge } from 'react-native-paper';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!user?.userId) return;

    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications(user.userId);
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.notificationId);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId
              ? { ...n, isRead: true }
              : n
          )
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    // TODO: Navigate to the related content based on moduleName and referenceId
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }) => (
    <>
      <TouchableOpacity onPress={() => handleNotificationPress(item)}>
        <List.Item
          title={item.title}
          titleStyle={!item.isRead ? styles.unreadTitle : styles.readTitle}
          description={item.message}
          descriptionNumberOfLines={2}
          left={(props) => (
            <List.Icon
              {...props}
              icon={item.isRead ? 'bell-outline' : 'bell'}
              color={item.isRead ? '#999' : '#2196F3'}
            />
          )}
          right={() => (
            <View style={styles.rightContainer}>
              <Text style={styles.time}>{formatTime(item.sentDate)}</Text>
              {!item.isRead && <Badge style={styles.badge} size={8} />}
            </View>
          )}
          style={!item.isRead ? styles.unreadItem : null}
        />
      </TouchableOpacity>
      <Divider />
    </>
  );

  return (
    <View style={styles.container}>
      {loading && notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.notificationId.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  unreadItem: {
    backgroundColor: '#E3F2FD',
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  readTitle: {
    fontWeight: 'normal',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#2196F3',
  },
});

export default NotificationsScreen;

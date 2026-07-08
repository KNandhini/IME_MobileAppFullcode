import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { chatService } from '../services/chatService';
import { ChatsListScreenStyles as styles } from './screenStyles';

const AVATAR_COLORS = [
  '#1E3A5F', '#D4A017', '#27AE60', '#8E44AD',
  '#E67E22', '#2980B9', '#C0392B', '#16A085',
];

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d    = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  const now  = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)      return 'Just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ChatsListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  useFocusEffect(useCallback(() => {
    loadConversations(false);
  }, []));

  const loadConversations = async (isRefresh = false) => {
    try {
      const res = await chatService.getConversations();
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openChat = (conv) => {
    navigation.navigate('Chat', {
      conversationId:   conv.conversationId,
      otherMemberName:  conv.otherMemberName,
      otherMemberEmail: conv.otherMemberEmail,
    });
  };

  const renderItem = ({ item, index }) => {
    const color   = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initial = (item.otherMemberName || 'M').charAt(0).toUpperCase();
    const time    = formatTime(item.lastMessageDate);
    const preview = item.lastMessage
      ? item.lastMessage.length > 45
        ? item.lastMessage.substring(0, 45) + '…'
        : item.lastMessage
      : 'Start a conversation';

    return (
      <TouchableOpacity style={styles.row} onPress={() => openChat(item)} activeOpacity={0.75}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{item.otherMemberName}</Text>
            {!!time && <Text style={styles.time}>{time}</Text>}
          </View>
          <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A5F" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.conversationId)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => { setRefreshing(true); loadConversations(true); }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySub}>Tap a member's name in the feed to start chatting</Text>
            </View>
          }
        />
      )}
    </View>
  );
};



export default ChatsListScreen;

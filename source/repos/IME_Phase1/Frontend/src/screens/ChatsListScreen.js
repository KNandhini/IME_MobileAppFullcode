import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar,
  Modal, TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { chatService } from '../services/chatService';
// ⚠️ Adjust this import to wherever your member-list API lives.
// It should expose something like getAllMembers() -> { success, data: [{ id, name, email }] }
import { memberService } from '../services/memberService';
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

  const [chatSearch, setChatSearch] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [members,       setMembers]       = useState([]);
  const [membersLoading,setMembersLoading]= useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');

  useFocusEffect(useCallback(() => {
    loadConversations(false);
  }, []));

  const loadConversations = async (isRefresh = false) => {
    try {
      const res = await chatService.getConversations();
      if (res.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort((a, b) => {
          const dateA = a.lastMessageDate ? new Date(a.lastMessageDate) : new Date(0);
          const dateB = b.lastMessageDate ? new Date(b.lastMessageDate) : new Date(0);
          return dateB - dateA; // most recent first
        });
        setConversations(sorted);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Load members once, the first time the picker opens ──
  const loadMembers = async () => {
    if (members.length > 0) return; // already cached
    setMembersLoading(true);
    try {
      const res = await memberService.getAllMembers();
      if (res.success && Array.isArray(res.data)) {
        console.log('SAMPLE MEMBER OBJECT:', JSON.stringify(res.data[0], null, 2)); // ⚠️ remove after checking
        setMembers(res.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const openPicker = () => {
    setPickerVisible(true);
    loadMembers();
  };

  const closePicker = () => {
    setPickerVisible(false);
    setSearchQuery('');
  };

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name  = (m.name || m.memberName || m.fullName || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, searchQuery]);

  const filteredConversations = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.otherMemberName || '').toLowerCase().includes(q)
    );
  }, [conversations, chatSearch]);

  // ⚠️ conv.otherMemberId must be returned by GET /chat/conversations for
  // this to work — it's required by chatService.getOrCreateConversation.
  const openChat = (conv) => {
    debugger;
    navigation.navigate('Chat', {
      
      conversationId:   conv.conversationId,
      otherMemberName:  conv.otherMemberName,
      otherMemberEmail: conv.otherMemberEmail,
      otherMemberId:    conv.otherMemberId,
    });
  };

  // Start (or resume) a chat with a member picked from the search list
  const startChatWithMember = (member) => {
    closePicker();

    const memberId = getMemberId(member);
    if (memberId == null) {
      console.error('startChatWithMember: could not resolve an id for member:', member);
    }

    // If a conversation with this member already exists, jump straight into it
    const existing = conversations.find(
      (c) => c.otherMemberEmail === member.email
    );

    navigation.navigate('Chat', {
      conversationId:   existing ? existing.conversationId : null,
      otherMemberName:  member.name,
      otherMemberEmail: member.email,
      otherMemberId:    memberId,
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

  // Some APIs return the id under different keys (id / memberId / userId / Id).
  // This checks the common variants so otherMemberId is never silently undefined.
  const getMemberId = (item) => {
    return item.id ?? item.memberId ?? item.userId ?? item.Id ?? null;
  };

  // Some APIs return the display name under different keys (name / memberName / fullName),
  // and some only return an email. This guarantees a name is always shown.
  const getMemberDisplayName = (item) => {
    const raw = item.name || item.memberName || item.fullName || '';
    if (raw.trim()) return raw;
    if (item.email) {
      const local = item.email.split('@')[0];
      return local
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return 'Member';
  };

  const renderMemberItem = ({ item, index }) => {
    const color       = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const displayName = getMemberDisplayName(item);
    const initial     = displayName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.memberRow}
        onPress={() => startChatWithMember({ ...item, name: displayName })}
        activeOpacity={0.75}
      >
        <View style={[styles.memberAvatar, { backgroundColor: color }]}>
          <Text style={styles.memberAvatarLetter}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
          {!!item.email && (
            <Text style={styles.memberEmail} numberOfLines={1}>{item.email}</Text>
          )}
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

      {/* ── Search chats by member name ── */}
      <View style={styles.chatSearchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.chatSearchInput}
          placeholder="Search chats by name…"
          placeholderTextColor="#94A3B8"
          value={chatSearch}
          onChangeText={setChatSearch}
          autoCorrect={false}
        />
        {chatSearch.length > 0 && (
          <TouchableOpacity onPress={() => setChatSearch('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A5F" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item, index) =>
            item.conversationId != null
              ? String(item.conversationId)
              : (item.otherMemberEmail || `conv-${index}`)
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => { setRefreshing(true); loadConversations(true); }}
          refreshing={refreshing}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>
                {chatSearch ? 'No chats match that name' : 'No conversations yet'}
              </Text>
              {!chatSearch && (
                <Text style={styles.emptySub}>Tap a member's name in the feed to start chatting</Text>
              )}
            </View>
          }
        />
      )}

      {/* ── FAB: start a new chat ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openPicker}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* ── Member picker modal with search ── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker} />

        <KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={0}
>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Chat</Text>
            <TouchableOpacity onPress={closePicker} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members by name…"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {membersLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#1E3A5F" />
            </View>
          ) : (
            <FlatList
              data={filteredMembers}
              keyExtractor={(item, index) =>
                getMemberId(item) != null ? String(getMemberId(item)) : (item.email || `member-${index}`)
              }
              renderItem={renderMemberItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No members match your search' : 'No members found'}
                  </Text>
                </View>
              }
            />
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ChatsListScreen;